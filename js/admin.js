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
      window.location.href = '/pages/login.html';
      return null;
    }
    return data.user;
  } catch (error) {
    console.error('Auth check failed:', error);
    window.location.href = '/pages/login.html';
    return null;
  }
}

async function loadAdminStats() {
  try {
    const { res, data } = await api('/api/admin/stats', { method: 'GET' });
    if (!res.ok) {
      throw new Error(data?.error || 'Failed to load stats');
    }
    return data;
  } catch (error) {
    console.error('Error loading admin stats:', error);
    throw error;
  }
}

async function loadAdminUsers() {
  try {
    const { res, data } = await api('/api/admin/users', { method: 'GET' });
    if (!res.ok) {
      throw new Error(data?.error || 'Failed to load users');
    }
    return data;
  } catch (error) {
    console.error('Error loading admin users:', error);
    throw error;
  }
}

function renderStats(stats) {
  return `
    <h3>Platform Statistics</h3>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
      <div style="background: #f0f0f0; padding: 1rem; border-radius: 8px; text-align: center;">
        <div style="font-size: 32px; font-weight: bold; color: #111;">${stats.posts || 0}</div>
        <div style="color: #666; font-size: 14px; margin-top: 0.5rem;">Posts</div>
      </div>
      <div style="background: #f0f0f0; padding: 1rem; border-radius: 8px; text-align: center;">
        <div style="font-size: 32px; font-weight: bold; color: #111;">${stats.groups || 0}</div>
        <div style="color: #666; font-size: 14px; margin-top: 0.5rem;">Groups</div>
      </div>
      <div style="background: #f0f0f0; padding: 1rem; border-radius: 8px; text-align: center;">
        <div style="font-size: 32px; font-weight: bold; color: #111;">${stats.events || 0}</div>
        <div style="color: #666; font-size: 14px; margin-top: 0.5rem;">Events</div>
      </div>
      <div style="background: #f0f0f0; padding: 1rem; border-radius: 8px; text-align: center;">
        <div style="font-size: 32px; font-weight: bold; color: #111;">${stats.users || 0}</div>
        <div style="color: #666; font-size: 14px; margin-top: 0.5rem;">Users</div>
      </div>
    </div>
  `;
}

function renderUsersList(users) {
  if (!users || users.length === 0) {
    return '<h3>Users</h3><p>No users found</p>';
  }

  const userRows = users
    .map(user => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #f0f0f0;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background: #111; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: bold;">${escapeHtml((user.avatar || '?').toString())}</div>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #f0f0f0;">
          <div style="font-weight: 600;">${escapeHtml(user.name || 'Unknown')}</div>
          <div style="color: #666; font-size: 13px;">${escapeHtml(user.email || '')}</div>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #f0f0f0; text-align: center;">
          <span style="background: ${user.role === 'admin' ? '#111' : '#e4e6eb'}; color: ${user.role === 'admin' ? '#fff' : '#000'}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">${escapeHtml(user.role || 'member')}</span>
        </td>
      </tr>
    `)
    .join('');

  return `
    <h3>Registered Users (${users.length})</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background: #f0f0f0;">
          <th style="padding: 12px; text-align: left; font-weight: 600;">Avatar</th>
          <th style="padding: 12px; text-align: left; font-weight: 600;">User</th>
          <th style="padding: 12px; text-align: center; font-weight: 600;">Role</th>
        </tr>
      </thead>
      <tbody>
        ${userRows}
      </tbody>
    </table>
  `;
}

function escapeHtml(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(str).replace(/[&<>"']/g, c => map[c]);
}

document.addEventListener('DOMContentLoaded', async () => {
  const statsContainer = document.getElementById('admin-stats');
  const usersContainer = document.getElementById('admin-users');

  // Check authentication
  const user = await checkAuth();
  if (!user) {
    if (statsContainer) statsContainer.innerHTML = '<p style="color: var(--danger);">Not authorized. Redirecting to login...</p>';
    return;
  }

  // Load and render stats
  try {
    const stats = await loadAdminStats();
    if (statsContainer) {
      statsContainer.innerHTML = renderStats(stats);
    }
  } catch (error) {
    console.error('Failed to load stats:', error);
    if (statsContainer) {
      statsContainer.innerHTML = `<p style="color: var(--danger);">Error loading statistics: ${escapeHtml(error.message)}</p>`;
    }
  }

  // Load and render users
  try {
    const users = await loadAdminUsers();
    if (usersContainer) {
      usersContainer.innerHTML = renderUsersList(users);
    }
  } catch (error) {
    console.error('Failed to load users:', error);
    if (usersContainer) {
      usersContainer.innerHTML = `<p style="color: var(--danger);">Error loading users: ${escapeHtml(error.message)}</p>`;
    }
  }
});

