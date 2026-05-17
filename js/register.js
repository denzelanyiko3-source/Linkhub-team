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

async function checkAlreadyLoggedIn() {
  try {
    const response = await fetch('/api/auth/me');
    if (!response.ok) return;
    const result = await response.json();
    if (result.user) {
      window.location.href = '../index.html';
    }
  } catch (error) {
    console.warn('Unable to check authentication status', error);
  }
}

if (registerForm) {
  registerForm.addEventListener('submit', handleRegister);
}

document.addEventListener('DOMContentLoaded', checkAlreadyLoggedIn);
