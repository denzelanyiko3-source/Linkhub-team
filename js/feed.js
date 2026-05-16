async function fetchJson(path, options) {
  try {
    const res = await fetch(path, options);
    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { res, data };
  } catch (error) {
    console.error('Fetch error:', error);
    return { res: { ok: false }, data: { error: 'Network error' } };
  }
}

async function getMe() {
  try {
    const { res, data } = await fetchJson('/api/auth/me', { method: 'GET' });
    if (!res.ok) return null;
    return data && data.user ? data.user : null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

async function getPosts() {
  try {
    const { res, data } = await fetchJson('/api/posts', { method: 'GET' });
    if (!res.ok) {
      console.error('Error loading posts:', data?.error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('Error loading posts:', error);
    return [];
  }
}

async function createPost(text) {
  try {
    const { res, data } = await fetchJson('/api/posts', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      throw new Error(data?.error || 'Failed to create post');
    }
    return { res, data };
  } catch (error) {
    console.error('Error creating post:', error);
    return { res: { ok: false }, data: { error: error.message || 'Failed to create post' } };
  }
}

async function likePost(id) {
  try {
    return await fetchJson(`/api/posts/${id}/like`, { method: 'POST' });
  } catch (error) {
    console.error('Error liking post:', error);
    return { res: { ok: false }, data: { error: 'Network error' } };
  }
}

async function commentPost(id, text) {
  try {
    return await fetchJson(`/api/posts/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  } catch (error) {
    console.error('Error commenting:', error);
    return { res: { ok: false }, data: { error: 'Network error' } };
  }
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
    try {
      const { res, data } = await likePost(post.id);
      if (!res.ok) {
        alert((data && data.error) ? data.error : 'Like failed');
        return;
      }
      likeCount.textContent = Number(data.likes || 0);
    } catch (error) {
      console.error('Like error:', error);
      alert('Failed to like post');
    }
  });

  const shareBtn = wrap.querySelector('.shareBtn');
  shareBtn.addEventListener('click', async () => {
    try {
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
    } catch (error) {
      console.error('Share error:', error);
    }
  });

  const commentText = wrap.querySelector('.commentText');
  const commentBtn = wrap.querySelector('.commentBtn');
  const commentList = wrap.querySelector('.commentList');
  const commentCountEl = wrap.querySelector('.commentCount');

  commentBtn.addEventListener('click', async () => {
    try {
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
    } catch (error) {
      console.error('Comment error:', error);
      alert('Failed to post comment');
    }
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
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', async () => {
  const me = await getMe();
  const userPill = document.getElementById('userPill');
  const authHint = document.getElementById('authHint');
  const logoutBtn = document.getElementById('logoutBtn');
  const postsEl = document.getElementById('posts');

  if (me) {
    userPill.textContent = `Logged in as ${me.name}`;
    logoutBtn.style.display = 'inline-block';
    authHint.textContent = 'You can like and comment.';
  } else {
    userPill.textContent = 'Not logged in';
    authHint.textContent = 'Login to like and comment.';
  }

  logoutBtn.addEventListener('click', async () => {
    try {
      await fetchJson('/api/auth/logout', { method: 'POST' });
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
      window.location.reload();
    }
  });

  // Add post creation form if logged in
  if (me && postsEl) {
    const createPostForm = document.createElement('div');
    createPostForm.className = 'post';
    createPostForm.innerHTML = `
      <div style="margin-bottom: 12px;">
        <textarea id="newPostText" placeholder="What's on your mind?" style="width: 100%; min-height: 100px; padding: 10px; border: 1px solid #ddd; border-radius: 10px; font-family: system-ui; resize: vertical;"></textarea>
      </div>
      <button id="createPostBtn" class="primary" style="padding: 8px 16px; background: #111; color: #fff; border: none; border-radius: 10px; cursor: pointer; font-weight: 600;">Post</button>
      <div id="postError" style="margin-top: 8px; color: var(--danger); font-size: 14px; display: none;"></div>
    `;
    postsEl.appendChild(createPostForm);

    const createPostBtn = createPostForm.querySelector('#createPostBtn');
    const newPostText = createPostForm.querySelector('#newPostText');
    const postError = createPostForm.querySelector('#postError');

    createPostBtn.addEventListener('click', async () => {
      try {
        const text = (newPostText.value || '').trim();
        if (!text) {
          postError.textContent = 'Please write something';
          postError.style.display = 'block';
          return;
        }

        createPostBtn.disabled = true;
        createPostBtn.textContent = 'Posting...';
        postError.style.display = 'none';

        const { res, data } = await createPost(text);
        if (!res.ok) {
          postError.textContent = data?.error || 'Failed to create post';
          postError.style.display = 'block';
          createPostBtn.disabled = false;
          createPostBtn.textContent = 'Post';
          return;
        }

        newPostText.value = '';
        postError.style.display = 'none';
        createPostBtn.disabled = false;
        createPostBtn.textContent = 'Post';

        // Reload posts
        window.location.reload();
      } catch (error) {
        console.error('Create post error:', error);
        postError.textContent = 'Error creating post';
        postError.style.display = 'block';
        createPostBtn.disabled = false;
        createPostBtn.textContent = 'Post';
      }
    });
  }

  // Load and display posts
  try {
    const posts = await getPosts();
    if (postsEl) {
      // Add posts after the create form (if it exists)
      const existingChildren = Array.from(postsEl.children);
      for (const p of posts) {
        const el = await postElement(p, me);
        postsEl.appendChild(el);
      }
    }
  } catch (error) {
    console.error('Error loading posts:', error);
    if (postsEl) {
      postsEl.innerHTML = '<div style="color: var(--danger);">Error loading posts</div>';
    }
  }
});

