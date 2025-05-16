// Run the script once the DOM is fully loaded
document.addEventListener("DOMContentLoaded", function() {
  // Reference to the root element for setting CSS variables
  var root = document.documentElement;

  // Get all buttons
  var themeBtn = document.getElementById("toggle-theme-control");
  var contrastBtn = document.getElementById("high-contrast");
  var increaseBtn = document.getElementById("increase-font");
  var decreaseBtn = document.getElementById("decrease-font");

  // Load saved theme or set to "light" by default
  var currentTheme = localStorage.getItem("theme") || "light";
  root.setAttribute("data-theme", currentTheme);

  // Load saved font size or set to 1rem by default
  var currentSize = parseFloat(localStorage.getItem("fontSize")) || 1;
  root.style.setProperty("--base-font-size", currentSize + "rem");

  // Function to switch themes
  function switchTheme() {
    if (currentTheme === "dark") {
      currentTheme = "light";
      if (themeBtn) themeBtn.textContent = "🌙 Dark Mode";
    } else {
      currentTheme = "dark";
      if (themeBtn) themeBtn.textContent = "☀️ Light Mode";
    }
    root.setAttribute("data-theme", currentTheme);
    localStorage.setItem("theme", currentTheme);
  }

  // Function to switch contrast
  function switchContrast() {
    if (currentTheme === "high-contrast") {
      currentTheme = "light";
    } else {
      currentTheme = "high-contrast";
    }
    root.setAttribute("data-theme", currentTheme);
    localStorage.setItem("theme", currentTheme);
  }

  // Function to change font size
  function changeFontSize(increase) {
    if (increase) {
      currentSize = Math.min(currentSize + 0.1, 2.5);
    } else {
      currentSize = Math.max(currentSize - 0.1, 0.5);
    }
    root.style.setProperty("--base-font-size", currentSize.toFixed(2) + "rem");
    localStorage.setItem("fontSize", currentSize);
    
    // Disable buttons if limits are reached
    if (decreaseBtn) decreaseBtn.disabled = currentSize <= 0.5;
    if (increaseBtn) increaseBtn.disabled = currentSize >= 2.5;
  }

  // Attach event listeners
  if (themeBtn) themeBtn.addEventListener("click", switchTheme);
  if (contrastBtn) contrastBtn.addEventListener("click", switchContrast);
  if (increaseBtn) increaseBtn.addEventListener("click", function() {
    changeFontSize(true);
  });
  if (decreaseBtn) decreaseBtn.addEventListener("click", function() {
    changeFontSize(false);
  });
});
