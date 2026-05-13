async function api(path, options) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...(options && options.headers ? options.headers : {}),
    },
  });
  let data;
  try { data = await res.json(); } catch { data = null; }
  return { res, data };
}

function setStatus(el, msg) {
  el.textContent = msg;
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const statusEl = document.getElementById('status');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus(statusEl, 'Logging in...');

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    const { res, data } = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      setStatus(statusEl, data && data.error ? data.error : 'Login failed');
      return;
    }

    setStatus(statusEl, 'Logged in! Redirecting...');
    window.location.href = '/pages/feed.html';
  });
});

