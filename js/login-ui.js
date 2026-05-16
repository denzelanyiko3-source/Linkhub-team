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
  el.style.color = isError ? '#d32f2f' : '#2e7d32';
  el.style.marginTop = '12px';
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const statusEl = document.getElementById('status');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  if (!form) {
    console.error('Login form not found');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Validation
    if (!email || !password) {
      setStatus(statusEl, 'Email and password are required', true);
      return;
    }

    if (!validateEmail(email)) {
      setStatus(statusEl, 'Please enter a valid email', true);
      return;
    }

    if (password.length < 1) {
      setStatus(statusEl, 'Password cannot be empty', true);
      return;
    }

    setStatus(statusEl, 'Logging in...', false);

    try {
      const { res, data } = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const error = data && data.error ? data.error : 'Login failed';
        setStatus(statusEl, error, true);
        return;
      }

      setStatus(statusEl, 'Login successful! Redirecting...', false);
      setTimeout(() => {
        window.location.href = '/pages/feed.html';
      }, 1000);
    } catch (error) {
      console.error('Login error:', error);
      setStatus(statusEl, 'An error occurred during login', true);
    }
  });
});

