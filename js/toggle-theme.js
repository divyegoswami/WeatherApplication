// Execute the script once the entire DOM is fully loaded and parsed.
document.addEventListener("DOMContentLoaded", function() {
  // Get a reference to the root <html> element to manage CSS custom properties.
  const root = document.documentElement;

  // Get references to the control buttons.
  // Assumes these elements exist in the DOM; an error will occur if not.
  const themeBtn = document.getElementById("toggle-theme-control");
  const contrastBtn = document.getElementById("high-contrast");
  const increaseFontBtn = document.getElementById("increase-font");
  const decreaseFontBtn = document.getElementById("decrease-font");

  // --- Theme Constants and State ---
  const THEME_KEY = "theme"; // localStorage key for storing the theme.
  const DEFAULT_THEME = "light"; // Default theme if none is saved.
  let currentTheme; // Stores the current theme ("light", "dark", or "high-contrast").

  // --- Font Size Constants and State ---
  const FONT_SIZE_KEY = "fontSize"; // localStorage key for storing font size.
  const FONT_SIZE_CSS_VAR = "--base-font-size"; // CSS custom property for font size.
  const DEFAULT_FONT_SIZE = 1; // Default base font size in rem.
  const MIN_FONT_SIZE = 0.5;   // Minimum allowed font size in rem.
  const MAX_FONT_SIZE = 2.5;   // Maximum allowed font size in rem.
  const FONT_SIZE_STEP = 0.1;  // Increment/decrement step for font size.
  let currentFontSize; // Stores the current base font size in rem.

  // --- Theme Management ---

  /**
   * Applies a new theme to the page and persists it in localStorage.
   * @param {string} newTheme - The theme to apply ("light", "dark", "high-contrast").
   */
  function applyTheme(newTheme) {
    currentTheme = newTheme;
    root.setAttribute("data-theme", currentTheme); // Sets the theme on the <html> element.
    localStorage.setItem(THEME_KEY, currentTheme); // Saves the theme choice.
    updateThemeButtonText(); // Updates the theme button's display text.
  }

  /**
   * Updates the text of the theme toggle button.
   * The text indicates which mode (Dark or Light) will be activated if clicked.
   */
  function updateThemeButtonText() {
    if (currentTheme === "dark") {
      themeBtn.textContent = "☀️ Light Mode"; // If dark, button offers to switch to Light.
    } else { // Covers "light" and "high-contrast" themes.
      themeBtn.textContent = "🌙 Dark Mode"; // If light or high-contrast, button offers to switch to Dark.
    }
  }

  /**
   * Handles the theme toggle button click.
   * Switches between "light" and "dark" themes.
   * If current theme is "high-contrast", switches to "dark".
   */
  function handleThemeToggle() {
    // Determine the new theme: if current is light or high-contrast, go dark; otherwise, go light.
    const newTheme = (currentTheme === "light" || currentTheme === "high-contrast") ? "dark" : "light";
    applyTheme(newTheme);
  }

  /**
   * Handles the high-contrast toggle button click.
   * Toggles "high-contrast" mode. If "high-contrast" is active, reverts to "light" theme.
   */
  function handleContrastToggle() {
    // Determine the new theme: if current is high-contrast, go light; otherwise, go high-contrast.
    const newTheme = currentTheme === "high-contrast" ? "light" : "high-contrast";
    applyTheme(newTheme);
  }

  // --- Font Size Management ---

  /**
   * Applies the given font size, updates the CSS variable, and persists it.
   * Ensures the font size stays within defined min/max limits.
   * @param {number} size - The desired font size in rem.
   */
  function applyFontSize(size) {
    // Clamps the font size to the defined min/max boundaries.
    currentFontSize = Math.max(MIN_FONT_SIZE, Math.min(parseFloat(size), MAX_FONT_SIZE));
    
    // Sets the CSS custom property for base font size, formatted to two decimal places.
    root.style.setProperty(FONT_SIZE_CSS_VAR, currentFontSize.toFixed(2) + "rem");
    // Saves the font size choice to localStorage.
    localStorage.setItem(FONT_SIZE_KEY, currentFontSize.toFixed(2));
    updateFontButtonStates(); // Updates the enable/disable state of font buttons.
  }

  /**
   * Increases or decreases the base font size by one step.
   * @param {boolean} increase - True to increase font size, false to decrease.
   */
  function changeFontSize(increase) {
    const newSize = currentFontSize + (increase ? FONT_SIZE_STEP : -FONT_SIZE_STEP);
    applyFontSize(newSize); // applyFontSize handles clamping and all updates.
  }

  /**
   * Updates the enabled/disabled state of font size adjustment buttons.
   * Buttons are disabled if the font size is at its minimum or maximum limit.
   */
  function updateFontButtonStates() {
    decreaseFontBtn.disabled = currentFontSize <= MIN_FONT_SIZE;
    increaseFontBtn.disabled = currentFontSize >= MAX_FONT_SIZE;
  }

  // --- Initialization ---

  // Initializes theme: Loads from localStorage or uses default, then applies it.
  applyTheme(localStorage.getItem(THEME_KEY) || DEFAULT_THEME);

  // Initializes font size: Loads from localStorage or uses default, then applies it.
  // parseFloat is used to convert the stored string value to a number.
  applyFontSize(parseFloat(localStorage.getItem(FONT_SIZE_KEY)) || DEFAULT_FONT_SIZE);
  
  // --- Event Listeners ---
  // Attaches event listeners to the control buttons.
  themeBtn.addEventListener("click", handleThemeToggle);
  contrastBtn.addEventListener("click", handleContrastToggle);
  increaseFontBtn.addEventListener("click", () => changeFontSize(true));
  decreaseFontBtn.addEventListener("click", () => changeFontSize(false));
});