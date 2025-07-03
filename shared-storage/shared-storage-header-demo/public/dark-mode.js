const body = document.body;

// Function to toggle dark mode
function toggleDarkMode() {
  body.classList.toggle('dark-mode');

  // Store the preference for the next visit
  if (body.classList.contains('dark-mode')) {
    localStorage.setItem('theme', 'dark');
  } else {
    localStorage.setItem('theme', 'light');
  }
}

// Event listener for the button
const toggleButton = document.getElementById('darkModeButton');
if (toggleButton) {
  toggleButton.addEventListener('click', toggleDarkMode);
}

// Check for stored preference on page load
const urlSearchParams = new URLSearchParams(window.location.search);
const currentTheme = localStorage.getItem('theme') || urlSearchParams.get('theme') || 'light';
if (currentTheme === 'dark') {
  body.classList.add('dark-mode');
}