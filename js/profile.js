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

async function getUserProfile() {
  try {
    const { res, data } = await api('/api/profile/me', { method: 'GET' });
    if (!res.ok) {
      throw new Error(data?.error || 'Failed to load profile');
    }
    return data;
  } catch (error) {
    console.error('Error loading profile:', error);
    throw error;
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderProfile(profile) {
  return `
    <div style="max-width: 840px; margin: 0 auto;">
      <div class="card">
        <div style="display: flex; gap: 2rem; align-items: flex-start;">
          <div style="width: 120px; height: 120px; border-radius: 50%; background: #111; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 48px; font-weight: bold; flex-shrink: 0;">
            ${escapeHtml((profile.avatar || '?').toString())}
          </div>
          <div style="flex: 1;">
            <h1 style="margin: 0 0 8px 0;">${escapeHtml(profile.name || 'Unknown')}</h1>
            <div style="color: #666; font-size: 16px; margin-bottom: 1rem;">${escapeHtml(profile.headline || '—')}</div>
            <div style="color: #666; margin-bottom: 1rem;">
              <div>📍 ${escapeHtml(profile.location || '—')}</div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 1rem;">
              <div style="text-align: center; padding: 1rem; background: #f0f0f0; border-radius: 8px;">
                <div style="font-size: 24px; font-weight: bold; color: #111;">${profile.friends || 0}</div>
                <div style="color: #666; font-size: 14px; margin-top: 0.5rem;">Friends</div>
              </div>
              <div style="text-align: center; padding: 1rem; background: #f0f0f0; border-radius: 8px;">
                <div style="font-size: 24px; font-weight: bold; color: #111;">${profile.groups || 0}</div>
                <div style="color: #666; font-size: 14px; margin-top: 0.5rem;">Groups</div>
              </div>
              <div style="text-align: center; padding: 1rem; background: #f0f0f0; border-radius: 8px;">
                <div style="font-size: 24px; font-weight: bold; color: #111;">${profile.eventsAttended || 0}</div>
                <div style="color: #666; font-size: 14px; margin-top: 0.5rem;">Events</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', async () => {
  const profileContainer = document.getElementById('profile-content') || document.querySelector('main');

  // Check authentication
  const user = await checkAuth();
  if (!user) {
    profileContainer.innerHTML = '<p style="color: var(--danger); padding: 2rem; text-align: center;">You must be logged in to view your profile. <a href="/pages/login.html">Login</a></p>';
    return;
  }

  // Load and render profile
  try {
    const profile = await getUserProfile();
    profileContainer.innerHTML = renderProfile(profile);
  } catch (error) {
    console.error('Failed to load profile:', error);
    profileContainer.innerHTML = `<p style="color: var(--danger); padding: 2rem; text-align: center;">Error loading profile: ${escapeHtml(error.message)}</p>`;
  }
});
