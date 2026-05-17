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

async function loadGroups() {
  try {
    const { res, data } = await api('/api/groups', { method: 'GET' });
    if (!res.ok) {
      throw new Error(data?.error || 'Failed to load groups');
    }
    return data || [];
  } catch (error) {
    console.error('Error loading groups:', error);
    throw error;
  }
}

async function createGroup(groupData) {
  try {
    const { res, data } = await api('/api/groups', {
      method: 'POST',
      body: JSON.stringify(groupData),
    });
    if (!res.ok) {
      throw new Error(data?.error || 'Failed to create group');
    }
    return data;
  } catch (error) {
    console.error('Error creating group:', error);
    throw error;
  }
}

async function joinGroup(groupId) {
  try {
    const { res, data } = await api(`/api/groups/${encodeURIComponent(groupId)}/join`, {
      method: 'POST',
    });
    if (!res.ok) {
      throw new Error(data?.error || 'Failed to join group');
    }
    return data;
  } catch (error) {
    console.error('Error joining group:', error);
    throw error;
  }
}


function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderGroupCard(group) {
  return `
    <div class="card" style="padding: 1.5rem;">
      <div style="font-size: 48px; margin-bottom: 1rem;">${escapeHtml((group.emoji || '👥').toString())}</div>
      <h3 style="margin: 0 0 0.5rem;">${escapeHtml(group.name || 'Unnamed Group')}</h3>
      <p style="color: #666; margin: 0 0 1rem; font-size: 14px;">${escapeHtml(group.description || '')}</p>
      <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid #f0f0f0;">
        <div style="color: #666; font-size: 14px;">
          👥 ${group.members || 0} members
        </div>
        <button class="chip join-group-btn" type="button" data-group-id="${group.id}" style="background: #111; color: #fff; border: none; cursor: pointer; padding: 6px 12px; border-radius: 20px;">
          Join
        </button>
      </div>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', async () => {
  const user = await checkAuth();
  const groupsContainer = document.querySelector('[data-groups-container]');
  const createForm = document.getElementById('create-group-form');
  const logoutBtn = document.getElementById('logout-button');

  if (logoutBtn) {
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

  // Load and display groups
  try {
    const groups = await loadGroups();
    if (groupsContainer) {
      groupsContainer.innerHTML = groups.map(g => renderGroupCard(g)).join('');
      groupsContainer.querySelectorAll('.join-group-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!user) {
            window.location.href = '/pages/login.html';
            return;
          }
          try {
            const groupId = btn.getAttribute('data-group-id');
            await joinGroup(groupId);
            window.location.reload();
          } catch (error) {
            console.error('Error joining group:', error);
            alert('Failed to join group: ' + error.message);
          }
        });
      });
    }
  } catch (error) {
    console.error('Failed to load groups:', error);
    if (groupsContainer) {
      groupsContainer.innerHTML = `<p style="color: var(--danger); grid-column: 1 / -1;">Error loading groups: ${escapeHtml(error.message)}</p>`;
    }
  }

  // Handle group creation
  if (createForm && user) {
    createForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const formData = new FormData(createForm);
        const groupData = {
          name: formData.get('name'),
          emoji: formData.get('emoji') || '👥',
          members: parseInt(formData.get('members')) || 0,
          description: formData.get('description'),
        };

        await createGroup(groupData);
        createForm.reset();
        window.location.reload();
      } catch (error) {
        console.error('Error creating group:', error);
        alert('Failed to create group: ' + (error?.message || error));
      }
    });
  } else if (createForm) {
    // Don’t silently hide the form; show why it can’t be used.
    createForm.insertAdjacentHTML(
      'afterend',
      `<div class="auth-hint" style="color: #fff; background: rgba(0,0,0,0.25); padding: 12px 16px; border-radius: 8px;">
        <strong>Sign in required:</strong> Please sign in to create a group.
        <a href="/pages/login.html" style="margin-left: 8px; color: #fff; text-decoration: underline;">Go to login</a>
      </div>`
    );
  }
});

