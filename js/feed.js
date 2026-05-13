async function fetchJson(path, options) {
  const res = await fetch(path, options);
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { res, data };
}

async function getMe() {
  const { res, data } = await fetchJson('/api/auth/me', { method: 'GET' });
  if (!res.ok) return null;
  return data && data.user ? data.user : null;
}

async function getPosts() {
  const { res, data } = await fetchJson('/api/posts', { method: 'GET' });
  if (!res.ok) return [];
  return data || [];
}

async function likePost(id) {
  return fetchJson(`/api/posts/${id}/like`, { method: 'POST' });
}

async function commentPost(id, text) {
  return fetchJson(`/api/posts/${id}/comments`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

async function postElement(post, me) {
  const wrap = document.createElement('div');
  wrap.className = 'post';

  const avatarText = (post.avatar || '?').toString();

  wrap.innerHTML = `
    <div class="meta">
      <div class="avatar">${escapeHtml(avatarText)}</div>
      <div>
        <div class="author">${escapeHtml(post.author || 'Unknown')}</div>
        <div class="time">${escapeHtml(post.time || '')}</div>
      </div>
    </div>
    <div class="text">${escapeHtml(post.text || '')}</div>
    <div class="actions">
      <button class="likeBtn primary" type="button" ${me ? '' : 'disabled'}>
        Like <span class="likeCount">${Number(post.likes || 0)}</span>
      </button>

      <button class="shareBtn" type="button">Share</button>

      <div class="muted" style="margin-left:auto;">
        <span class="commentCount">${(post.comments || []).length}</span> comments
      </div>
    </div>

    <div class="comments">
      <div class="commentList">
        ${renderComments(post.comments || [])}
      </div>

      <div class="comment-form">
        <textarea class="commentText" placeholder="Write a comment..." ${me ? '' : 'disabled'}></textarea>
        <button class="commentBtn primary" type="button" ${me ? '' : 'disabled'}>Comment</button>
      </div>
    </div>
  `;

  const likeBtn = wrap.querySelector('.likeBtn');
  const likeCount = wrap.querySelector('.likeCount');

  likeBtn.addEventListener('click', async () => {
    const { res, data } = await likePost(post.id);
    if (!res.ok) {
      alert((data && data.error) ? data.error : 'Like failed');
      return;
    }
    likeCount.textContent = Number(data.likes || 0);
  });

  const shareBtn = wrap.querySelector('.shareBtn');
  shareBtn.addEventListener('click', async () => {
    const shareUrl = location.origin + '/pages/feed.html';
    const payload = { title: 'Linkhub', text: post.text || '', url: shareUrl };

    if (navigator.share) {
      try {
        await navigator.share(payload);
        return;
      } catch (e) {
        // user cancelled or error; fall through to clipboard
      }
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(payload.url);
      alert('Link copied to clipboard');
    } else {
      // last resort
      prompt('Copy link:', payload.url);
    }
  });

  const commentText = wrap.querySelector('.commentText');
  const commentBtn = wrap.querySelector('.commentBtn');
  const commentList = wrap.querySelector('.commentList');
  const commentCountEl = wrap.querySelector('.commentCount');

  commentBtn.addEventListener('click', async () => {
    const text = (commentText.value || '').trim();
    if (!text) return;

    const { res, data } = await commentPost(post.id, text);
    if (!res.ok) {
      alert((data && data.error) ? data.error : 'Comment failed');
      return;
    }

    // backend returns whole post; rerender comments
    commentList.innerHTML = renderComments(data.comments || []);
    commentCountEl.textContent = String((data.comments || []).length);
    commentText.value = '';
  });

  return wrap;
}

function renderComments(comments) {
  if (!comments || comments.length === 0) return '<div class="muted">No comments yet.</div>';
  return comments
    .map(
      (c) => `
      <div class="comment">
        <div class="avatar" style="width:32px;height:32px;font-size:12px;">${escapeHtml((c.avatar || '?').toString())}</div>
        <div class="bubble">
          <div class="authorline">${escapeHtml(c.author || 'Unknown')}</div>
          <div class="ctext">${escapeHtml(c.text || '')}</div>
        </div>
      </div>
    `
    )
    .join('');
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '<')
    .replaceAll('>', '>')
    .replaceAll('"', '"')
    .replaceAll("'", '&#039;');
}

document.addEventListener('DOMContentLoaded', async () => {
  const me = await getMe();
  const userPill = document.getElementById('userPill');
  const authHint = document.getElementById('authHint');
  const logoutBtn = document.getElementById('logoutBtn');

  if (me) {
    userPill.textContent = `Logged in as ${me.name}`;
    logoutBtn.style.display = 'inline-block';
    authHint.textContent = 'You can like and comment.';
  } else {
    userPill.textContent = 'Not logged in';
    authHint.textContent = 'Login to like and comment.';
  }

  logoutBtn.addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.reload();
  });

  const posts = await getPosts();
  const postsEl = document.getElementById('posts');
  postsEl.innerHTML = '';

  for (const p of posts) {
    const el = await postElement(p, me);
    postsEl.appendChild(el);
  }
});

