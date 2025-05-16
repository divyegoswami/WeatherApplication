document.addEventListener("DOMContentLoaded", () => {
  const root           = document.documentElement;
  const themeButton    = document.getElementById("toggle-theme-control");
  const contrastButton = document.getElementById("high-contrast");
  const increaseBtn    = document.getElementById("increase-font");
  const decreaseBtn    = document.getElementById("decrease-font");

  const savedTheme = localStorage.getItem("theme") || "light";
  setTheme(savedTheme);
  function setTheme(theme) {
    root.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    themeButton.ariaPressed    = theme === "dark";
    contrastButton.ariaPressed = theme === "high-contrast";
    themeButton.textContent    = theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode";
  }
  themeButton.addEventListener("click", () => {
    const cur = root.getAttribute("data-theme");
    setTheme(cur === "dark" ? "light" : "dark");
  });
  contrastButton.addEventListener("click", () => {
    const cur = root.getAttribute("data-theme");
    setTheme(cur === "high-contrast" ? "light" : "high-contrast");
  });

  let currentSize = parseFloat(localStorage.getItem("fontSize")) || 1;
  applySize(currentSize);

  function applySize(sizeRem) {
    root.style.setProperty("--base-font-size", sizeRem + "rem");
    localStorage.setItem("fontSize", sizeRem);
    decreaseBtn.disabled = sizeRem <= 0.5;
    increaseBtn.disabled = sizeRem >= 2.5;
  }

  increaseBtn.addEventListener("click", () => {
    currentSize = +(currentSize + 0.1).toFixed(2);
    applySize(currentSize);
  });
  decreaseBtn.addEventListener("click", () => {
    currentSize = +(currentSize - 0.1).toFixed(2);
    applySize(currentSize);
  });
});
