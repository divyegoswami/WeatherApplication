// Execute the script once the entire DOM is fully loaded and parsed.
document.addEventListener("DOMContentLoaded", function() {
  // Get a reference to the root <html> element to manage CSS custom properties (variables).
  const root = document.documentElement;

  // Get references to the theme and font size control buttons.
  const themeBtn = document.getElementById("toggle-theme-control");
  const contrastBtn = document.getElementById("high-contrast");
  const increaseFontBtn = document.getElementById("increase-font");
  const decreaseFontBtn = document.getElementById("decrease-font");

  // --- Theme Initialization ---
  // Load the saved theme from localStorage, defaulting to "light" if no theme is saved.
  let currentTheme = localStorage.getItem("theme") || "light";
  root.setAttribute("data-theme", currentTheme); // Apply the loaded theme to the <html> element.
  // Update theme button text based on the initial theme.
  if (themeBtn) {
    if (currentTheme === "dark") {
        themeBtn.textContent = "☀️ Light Mode";
    } else {
        themeBtn.textContent = "🌙 Dark Mode";
    }
  }


  // --- Font Size Initialization ---
  // Load the saved base font size from localStorage, defaulting to 1rem (16px) if not saved.
  // parseFloat is used to convert the stored string value to a number.
  let currentFontSize = parseFloat(localStorage.getItem("fontSize")) || 1;
  root.style.setProperty("--base-font-size", currentFontSize + "rem");
  // Initial check to disable font size buttons if at limits.
  updateFontButtonStates();


  // --- Theme Switching Functions ---

  /**
   * Switches between "light" and "dark" themes.
   * Updates the `data-theme` attribute on the <html> element and saves the theme to localStorage.
   * Also updates the theme toggle button's text.
   */
  function switchTheme() {
    if (currentTheme === "dark") {
      currentTheme = "light";
      if (themeBtn) themeBtn.textContent = "🌙 Dark Mode";
    } else { // Covers "light" or "high-contrast" states, switching them to "dark".
      currentTheme = "dark";
      if (themeBtn) themeBtn.textContent = "☀️ Light Mode";
    }
    root.setAttribute("data-theme", currentTheme);
    localStorage.setItem("theme", currentTheme);
  }

  /**
   * Toggles "high-contrast" mode.
   * If currently in "high-contrast", it switches to "light" theme.
   * Otherwise, it switches to "high-contrast" theme.
   * Updates `data-theme` and localStorage.
   */
  function switchContrast() {
    if (currentTheme === "high-contrast") {
      currentTheme = "light"; // Revert from high-contrast to light mode.
      // If coming from high-contrast to light, ensure theme button text is for dark mode.
      if (themeBtn) themeBtn.textContent = "🌙 Dark Mode";
    } else { // Covers "light" or "dark" states, switching them to "high-contrast".
      currentTheme = "high-contrast";
      // When switching to high-contrast, theme button might still show based on previous light/dark.
      // This part doesn't change themeBtn text, relying on switchTheme for that if user clicks it.
    }
    root.setAttribute("data-theme", currentTheme);
    localStorage.setItem("theme", currentTheme);
  }

  // --- Font Size Adjustment Functions ---

  /**
   * Changes the base font size of the website.
   * @param {boolean} shouldIncrease - True to increase font size, false to decrease.
   * Updates the `--base-font-size` CSS variable and saves the size to localStorage.
   * Disables increase/decrease buttons if size limits (0.5rem to 2.5rem) are reached.
   */
  function changeFontSize(shouldIncrease) {
    const step = 0.1; // Increment/decrement value for font size.
    const minSize = 0.5; // Minimum allowed font size in rem.
    const maxSize = 2.5; // Maximum allowed font size in rem.

    if (shouldIncrease) {
      currentFontSize = Math.min(currentFontSize + step, maxSize);
    } else {
      currentFontSize = Math.max(currentFontSize - step, minSize);
    }

    // Apply the new font size, ensuring it's formatted to two decimal places for consistency.
    root.style.setProperty("--base-font-size", currentFontSize.toFixed(2) + "rem");
    localStorage.setItem("fontSize", currentFontSize.toFixed(2)); // Save with precision.
    
    updateFontButtonStates();
  }

  /**
   * Updates the disabled state of font size adjustment buttons based on currentFontSize.
   */
  function updateFontButtonStates() {
    if (decreaseFontBtn) decreaseFontBtn.disabled = currentFontSize <= 0.5;
    if (increaseFontBtn) increaseFontBtn.disabled = currentFontSize >= 2.5;
  }

  // --- Event Listeners ---
  // Attach event listeners to the control buttons if they exist in the DOM.

  if (themeBtn) {
    themeBtn.addEventListener("click", switchTheme);
  }
  if (contrastBtn) {
    contrastBtn.addEventListener("click", switchContrast);
  }
  if (increaseFontBtn) {
    increaseFontBtn.addEventListener("click", function() {
      changeFontSize(true);
    });
  }
  if (decreaseFontBtn) {
    decreaseFontBtn.addEventListener("click", function() {
      changeFontSize(false);
    });
  }
});