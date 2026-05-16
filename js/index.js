async function api(path, options) {
  try {
    const res = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        ...(options && options.headers ? options.headers : {}),
      },
    });
    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { res, data };
  } catch (error) {
    console.error('API request failed:', error);
    return { res: { ok: false }, data: { error: 'Network error' } };
  }
}

async function checkAuth() {
  try {
    const { res, data } = await api('/api/auth/me', { method: 'GET' });
    if (!res.ok || !data.user) {
      return null;
    }
    return data.user;
  } catch (error) {
    console.error('Auth check failed:', error);
    return null;
  }
}

async function getPosts() {
  try {
    const { res, data } = await api('/api/posts', { method: 'GET' });
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
    const { res, data } = await api('/api/posts', {
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
    return await api(`/api/posts/${id}/like`, { method: 'POST' });
  } catch (error) {
    console.error('Error liking post:', error);
    return { res: { ok: false }, data: { error: 'Network error' } };
  }
}

async function commentPost(id, text) {
  try {
    return await api(`/api/posts/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  } catch (error) {
    console.error('Error commenting:', error);
    return { res: { ok: false }, data: { error: 'Network error' } };
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderPost(post, me) {
  const commentsHtml = (post.comments || [])
    .map(c => `
      <div class="comment">
        <div class="avatar" style="width:32px;height:32px;font-size:12px;">${escapeHtml((c.avatar || '?').toString())}</div>
        <div class="bubble">
          <div class="authorline">${escapeHtml(c.author || 'Unknown')}</div>
          <div class="ctext">${escapeHtml(c.text || '')}</div>
        </div>
      </div>
    `)
    .join('');

  return `
    <div class="post card">
      <div class="meta">
        <div class="avatar">${escapeHtml((post.avatar || '?').toString())}</div>
        <div>
          <div class="author">${escapeHtml(post.author || 'Unknown')}</div>
          <div class="time">${escapeHtml(post.time || '')}</div>
        </div>
      </div>
      <div class="text" style="margin-top: 10px; white-space: pre-wrap;">${escapeHtml(post.text || '')}</div>
      <div class="actions" style="display: flex; gap: 10px; margin-top: 12px; flex-wrap: wrap; align-items: center;">
        <button class="likeBtn" type="button" data-post-id="${post.id}" style="padding: 8px 12px; border: 1px solid #ddd; background: #fff; border-radius: 10px; cursor: pointer; ${me ? '' : 'opacity: 0.55; cursor: not-allowed;'}">
          Like <span class="likeCount">${Number(post.likes || 0)}</span>
        </button>
        <button class="shareBtn" type="button" style="padding: 8px 12px; border: 1px solid #ddd; background: #fff; border-radius: 10px; cursor: pointer;">Share</button>
        <div style="color: #666; font-size: 13px; margin-left: auto;">
          <span class="commentCount">${(post.comments || []).length}</span> comments
        </div>
      </div>
      <div class="comments" style="margin-top: 12px; border-top: 1px solid #f0f0f0; padding-top: 12px;">
        <div class="commentList">
          ${commentsHtml || '<div style="color: #666; font-size: 13px;">No comments yet.</div>'}
        </div>
        <div class="comment-form" style="display: flex; gap: 10px; margin-top: 10px; ${me ? '' : 'display: none;'}">
          <textarea class="commentText" placeholder="Write a comment..." style="flex: 1; min-height: 42px; max-height: 120px; resize: vertical; padding: 10px; border: 1px solid #ddd; border-radius: 10px;"></textarea>
          <button class="commentBtn" type="button" style="padding: 8px 12px; background: #111; color: #fff; border: none; border-radius: 10px; cursor: pointer; font-weight: 600;">Comment</button>
        </div>
      </div>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', async () => {
  const user = await checkAuth();
  const logoutBtn = document.getElementById('logout-button');
  const createInput = document.getElementById('create-input');
  const feed = document.querySelector('.feed');

  // Update user display
  if (user) {
    const userSpan = document.querySelector('.topbar-right span');
    if (userSpan) userSpan.textContent = user.name;
    if (logoutBtn) {
      logoutBtn.style.display = 'inline-block';
      logoutBtn.addEventListener('click', async () => {
        try {
          await api('/api/auth/logout', { method: 'POST' });
          window.location.reload();
        } catch (error) {
          console.error('Logout error:', error);
          window.location.reload();
        }
      });
    }
  }

  // Handle create post from input
  if (createInput && user) {
    createInput.addEventListener('keypress', async (e) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        const text = createInput.value.trim();
        if (!text) return;

        createInput.disabled = true;
        const { res, data } = await createPost(text);
        createInput.disabled = false;

        if (res.ok) {
          createInput.value = '';
          window.location.reload();
        } else {
          alert(data?.error || 'Failed to create post');
        }
      }
    });
  }

  // Load and display posts
  try {
    const posts = await getPosts();
    if (feed) {
      if (posts.length === 0) {
        feed.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">No posts yet. Be the first to post!</div>';
      } else {
        feed.innerHTML = posts.map(p => renderPost(p, user)).join('');

        // Add event listeners to all like and comment buttons
        feed.querySelectorAll('.likeBtn').forEach(btn => {
          btn.addEventListener('click', async () => {
            if (!user) {
              window.location.href = '/pages/login.html';
              return;
            }
            try {
              const postId = btn.getAttribute('data-post-id');
              const { res, data } = await likePost(postId);
              if (res.ok) {
                btn.querySelector('.likeCount').textContent = Number(data.likes || 0);
              } else {
                alert(data?.error || 'Like failed');
              }
            } catch (error) {
              alert('Failed to like post');
            }
          });
        });

        feed.querySelectorAll('.commentBtn').forEach(btn => {
          btn.addEventListener('click', async () => {
            if (!user) {
              window.location.href = '/pages/login.html';
              return;
            }
            try {
              const postCard = btn.closest('.post');
              const commentText = postCard.querySelector('.commentText');
              const text = (commentText.value || '').trim();
              if (!text) return;

              const postId = postCard.querySelector('.likeBtn').getAttribute('data-post-id');
              const { res, data } = await commentPost(postId, text);
              if (res.ok) {
                postCard.querySelector('.commentList').innerHTML = (data.comments || [])
                  .map(c => `
                    <div class="comment">
                      <div class="avatar" style="width:32px;height:32px;font-size:12px;">${escapeHtml((c.avatar || '?').toString())}</div>
                      <div class="bubble">
                        <div class="authorline">${escapeHtml(c.author || 'Unknown')}</div>
                        <div class="ctext">${escapeHtml(c.text || '')}</div>
                      </div>
                    </div>
                  `)
                  .join('');
                postCard.querySelector('.commentCount').textContent = String((data.comments || []).length);
                commentText.value = '';
              } else {
                alert(data?.error || 'Comment failed');
              }
            } catch (error) {
              alert('Failed to post comment');
            }
          });
        });
      }
    }
  } catch (error) {
    console.error('Error loading posts:', error);
    if (feed) {
      feed.innerHTML = '<div style="color: #d32f2f; padding: 20px; text-align: center;">Error loading posts</div>';
    }
  }

  // Dark mode toggle
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      localStorage.setItem('darkMode', document.body.classList.contains('dark-mode') ? 'true' : 'false');
    });

    // Restore dark mode preference
    if (localStorage.getItem('darkMode') === 'true') {
      document.body.classList.add('dark-mode');
    }
  }
});
