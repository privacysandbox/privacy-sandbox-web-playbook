const body = document.body;

// Check for stored preference on page load
const urlSearchParams = new URLSearchParams(window.location.search);
const currentTheme = localStorage.getItem('theme') || urlSearchParams.get('theme') || 'light';
if (currentTheme === 'dark') {
  body.classList.add('dark-mode');
}