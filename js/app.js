const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

const ROOT = path.join(__dirname, '..');
const STORE_PATH = path.join(ROOT, 'data', 'store.json');

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function loadStore() {
  if (!fs.existsSync(STORE_PATH)) {
    return { profile: {}, users: [], posts: [], groups: [], events: [] };
  }
  const raw = fs.readFileSync(STORE_PATH, 'utf8');
  return JSON.parse(raw || '{}');
}

function saveStore(store) {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

function parseCookies(req) {
  const header = req.headers.cookie;
  if (!header) return {};
  return Object.fromEntries(
    header
      .split(';')
      .map((v) => v.trim())
      .filter(Boolean)
      .map((pair) => {
        const idx = pair.indexOf('=');
        if (idx === -1) return [pair, ''];
        return [pair.slice(0, idx), pair.slice(idx + 1)];
      })
  );
}

// Minimal in-memory session based on cookie.
// This is only to make the project run without external dependencies.
const sessions = new Map(); // sessionId -> user

function ensureAuth(req) {
  const cookies = parseCookies(req);
  const sid = cookies.sid;
  if (!sid) return null;
  return sessions.get(sid) || null;
}

function serveStatic(req, res) {
  // simple static file server: / -> index.html, /pages/*, /js/*
  let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';

  // prevent path traversal
  urlPath = urlPath.replace(/\.\.\//g, '');
  const filePath = path.join(ROOT, urlPath);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const typeByExt = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain; charset=utf-8',
  };

  res.writeHead(200, { 'Content-Type': typeByExt[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const method = req.method || 'GET';
  const url = req.url || '/';

  if (url.startsWith('/api/')) {
    // API routes
    try {
      // Auth
      if (url === '/api/auth/me' && method === 'GET') {
        const user = ensureAuth(req);
        if (!user) return sendJson(res, 200, { user: null });
        return sendJson(res, 200, { user });
      }

      if (url === '/api/auth/logout' && method === 'POST') {
        const cookies = parseCookies(req);
        const sid = cookies.sid;
        if (sid) sessions.delete(sid);
        res.writeHead(200, {
          'Set-Cookie': 'sid=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax',
        });
        return res.end(JSON.stringify({ ok: true }));
      }

      if (url === '/api/auth/login' && method === 'POST') {
        const body = await readBody(req);
        const { email, password } = body || {};

        const store = loadStore();
        const u = (store.users || []).find((x) => x.email === email);
        // NOTE: passwordHash isn't verifiable without bcrypt; accept any password for now.
        if (!u) return sendJson(res, 401, { error: 'Invalid credentials' });

        const sid = Math.random().toString(36).slice(2) + Date.now();
        sessions.set(sid, { id: u.id, name: u.name, avatar: u.avatar, role: u.role, email: u.email });

        res.writeHead(200, {
          'Set-Cookie': `sid=${sid}; Path=/; HttpOnly; SameSite=Lax`,
          'Content-Type': 'application/json; charset=utf-8',
        });
        return res.end(JSON.stringify({ user: sessions.get(sid) }));
      }

      // Admin
      if (url === '/api/admin/stats' && method === 'GET') {
        const user = ensureAuth(req);
        if (!user || user.role !== 'admin') return sendJson(res, 403, { error: 'Forbidden' });
        const store = loadStore();
        return sendJson(res, 200, {
          posts: (store.posts || []).length,
          groups: (store.groups || []).length,
          events: (store.events || []).length,
          users: (store.users || []).length,
        });
      }

      if (url === '/api/admin/users' && method === 'GET') {
        const user = ensureAuth(req);
        if (!user || user.role !== 'admin') return sendJson(res, 403, { error: 'Forbidden' });
        const store = loadStore();
        const users = (store.users || []).map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          avatar: u.avatar,
          role: u.role,
        }));
        return sendJson(res, 200, users);
      }

      // Profile
      if (url === '/api/profile/me' && method === 'GET') {
        const user = ensureAuth(req);
        if (!user) return sendJson(res, 401, { error: 'Unauthorized' });
        const store = loadStore();
        const profile = store.profile || {};
        return sendJson(res, 200, {
          name: profile.name || user.name,
          avatar: profile.avatar || user.avatar,
          location: profile.location || '—',
          headline: profile.headline || '—',
          friends: profile.friends || 0,
          groups: profile.groups || 0,
          eventsAttended: profile.eventsAttended || 0,
        });
      }

      // Posts
      if (url.startsWith('/api/posts') && method === 'GET') {
        const store = loadStore();
        const q = url.includes('?q=') ? new URL('http://x' + url).searchParams.get('q') : '';
        let posts = store.posts || [];
        if (q) {
          posts = posts.filter((p) => (p.text || '').toLowerCase().includes(q.toLowerCase()));
        }
        return sendJson(res, 200, posts);
      }

      if (url === '/api/posts' && method === 'POST') {
        const user = ensureAuth(req);
        if (!user) return sendJson(res, 401, { error: 'Unauthorized' });
        const store = loadStore();
        const body = await readBody(req);
        const text = (body && body.text) ? String(body.text) : '';
        if (!text) return sendJson(res, 400, { error: 'Missing text' });

        const post = {
          id: Date.now(),
          author: user.name,
          avatar: user.avatar,
          time: 'Just now',
          location: 'LinkHub',
          icon: '🌍',
          text,
          likes: 0,
          comments: [],
        };
        store.posts = store.posts || [];
        store.posts.unshift(post);
        saveStore(store);
        return sendJson(res, 201, post);
      }

      const likeMatch = url.match(/^\/api\/posts\/(\d+)\/like$/);
      if (likeMatch && method === 'POST') {
        const user = ensureAuth(req);
        if (!user) return sendJson(res, 401, { error: 'Unauthorized' });
        const postId = Number(likeMatch[1]);
        const store = loadStore();
        const post = (store.posts || []).find((p) => p.id === postId);
        if (!post) return sendJson(res, 404, { error: 'Not found' });
        post.likes = (post.likes || 0) + 1;
        saveStore(store);
        return sendJson(res, 200, post);
      }

      const commentMatch = url.match(/^\/api\/posts\/(\d+)\/comments$/);
      if (commentMatch && method === 'POST') {
        const user = ensureAuth(req);
        if (!user) return sendJson(res, 401, { error: 'Unauthorized' });
        const postId = Number(commentMatch[1]);
        const store = loadStore();
        const post = (store.posts || []).find((p) => p.id === postId);
        if (!post) return sendJson(res, 404, { error: 'Not found' });
        const body = await readBody(req);
        const text = body && body.text ? String(body.text) : '';
        if (!text) return sendJson(res, 400, { error: 'Missing text' });
        post.comments = post.comments || [];
        post.comments.push({ author: user.name, avatar: user.avatar, text });
        saveStore(store);
        return sendJson(res, 201, post);
      }

      // Groups
      if (url === '/api/groups' && method === 'GET') {
        const store = loadStore();
        return sendJson(res, 200, store.groups || []);
      }

      if (url === '/api/groups' && method === 'POST') {
        const user = ensureAuth(req);
        if (!user) return sendJson(res, 401, { error: 'Unauthorized' });
        const store = loadStore();
        const body = await readBody(req);
        const group = {
          id: Date.now(),
          emoji: body.emoji || '👥',
          name: body.name || 'Untitled',
          members: Number(body.members) || 0,
          description: body.description || '',
        };
        store.groups = store.groups || [];
        store.groups.unshift(group);
        saveStore(store);
        return sendJson(res, 201, group);
      }

      // Events
      if (url === '/api/events' && method === 'GET') {
        const store = loadStore();
        return sendJson(res, 200, store.events || []);
      }

      if (url === '/api/events' && method === 'POST') {
        const user = ensureAuth(req);
        if (!user) return sendJson(res, 401, { error: 'Unauthorized' });
        const store = loadStore();
        const body = await readBody(req);
        const ev = {
          id: Date.now(),
          name: body.name || 'Untitled event',
          date: body.date || '',
          time: body.time || '',
          location: body.location || '',
          attending: Number(body.attending) || 0,
          description: body.description || '',
        };
        store.events = store.events || [];
        store.events.unshift(ev);
        saveStore(store);
        return sendJson(res, 201, ev);
      }

      const joinMatch = url.match(/^\/api\/events\/(\d+)\/join$/);
      if (joinMatch && method === 'POST') {
        const user = ensureAuth(req);
        if (!user) return sendJson(res, 401, { error: 'Unauthorized' });
        const eventId = Number(joinMatch[1]);
        const store = loadStore();
        const ev = (store.events || []).find((e) => e.id === eventId);
        if (!ev) return sendJson(res, 404, { error: 'Not found' });
        ev.attending = (ev.attending || 0) + 1;
        saveStore(store);
        return sendJson(res, 200, ev);
      }

      sendJson(res, 404, { error: 'Unknown API route' });
    } catch (e) {
      return sendJson(res, 500, { error: e.message || 'Server error' });
    }
    return;
  }

  // Non-API: serve static files
  serveStatic(req, res);
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Linkhub server running on http://localhost:${PORT}`);
});

