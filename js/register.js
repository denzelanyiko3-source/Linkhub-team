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

function setStatus(el, msg, isError = false) {
  el.textContent = msg;
  el.style.color = isError ? 'var(--danger)' : 'var(--success)';
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('register-form');
  const errorEl = document.getElementById('register-error');

  if (!form) {
    console.error('Register form not found');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.querySelector('input[name="name"]').value.trim();
    const email = document.querySelector('input[name="email"]').value.trim();
    const password = document.querySelector('input[name="password"]').value;

    if (!name || !email || !password) {
      setStatus(errorEl, 'All fields are required', true);
      return;
    }

    if (password.length < 6) {
      setStatus(errorEl, 'Password must be at least 6 characters', true);
      return;
    }

    setStatus(errorEl, 'Creating account...', false);

    const { res, data } = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const error = data && data.error ? data.error : 'Registration failed';
      setStatus(errorEl, error, true);
      return;
    }

    setStatus(errorEl, 'Account created! Redirecting...', false);
    setTimeout(() => {
      window.location.href = '/pages/feed.html';
    }, 1500);
  });
});
