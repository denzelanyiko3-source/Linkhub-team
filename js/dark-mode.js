function applySavedDarkMode() {
  try {
    const saved = localStorage.getItem('linkhub_dark_mode');
    const shouldEnable = saved === '1';
    document.body.classList.toggle('dark-mode', shouldEnable);
    return shouldEnable;
  } catch (_) {
    return false;
  }
}

function setToggleLabel(isDarkMode) {
  const btn = document.getElementById('dark-mode-toggle');
  if (!btn) return;
  btn.textContent = isDarkMode ? '☀️' : '🌙';
}

function initDarkModeToggle() {
  const toggleEl = document.getElementById('dark-mode-toggle');
  if (!toggleEl) return;

  let isDarkMode = applySavedDarkMode();
  setToggleLabel(isDarkMode);

  toggleEl.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);

    try {
      localStorage.setItem('linkhub_dark_mode', isDarkMode ? '1' : '0');
    } catch (_) {}

    setToggleLabel(isDarkMode);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initDarkModeToggle();
});

