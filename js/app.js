// DEPRECATED: This file is no longer used
// The application now uses server.js with Express.js
// Package.json has been updated to use "node server.js"
//
// This file is kept for reference only.
// All API functionality is now handled by ../server.js
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

