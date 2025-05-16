document.addEventListener("DOMContentLoaded", () => {
  const root           = document.documentElement;
  const themeBtn       = document.getElementById("toggle-theme-control");
  const contrastBtn    = document.getElementById("high-contrast");
  const increaseBtn    = document.getElementById("increase-font");
  const decreaseBtn    = document.getElementById("decrease-font");

  const savedTheme = localStorage.getItem("theme") || "light";
  root.setAttribute("data-theme", savedTheme);

  const savedSize  = parseFloat(localStorage.getItem("fontSize")) || 1;
  root.style.setProperty("--base-font-size", savedSize + "rem");

  function setTheme(theme) {
    root.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    if (themeBtn) {
      themeBtn.ariaPressed = theme === "dark";
      themeBtn.textContent = theme === "dark"
        ? "☀️ Light Mode"
        : "🌙 Dark Mode";
    }
    if (contrastBtn) {
      contrastBtn.ariaPressed = theme === "high-contrast";
    }
  }

  if (themeBtn) {
    setTheme(savedTheme);
    themeBtn.addEventListener("click", () => {
      const cur = root.getAttribute("data-theme");
      setTheme(cur === "dark" ? "light" : "dark");
    });
  }
  if (contrastBtn) {
    contrastBtn.addEventListener("click", () => {
      const cur = root.getAttribute("data-theme");
      setTheme(cur === "high-contrast" ? "light" : "high-contrast");
    });
  }

  let currentSize = savedSize;
  function applySize(sizeRem) {
    root.style.setProperty("--base-font-size", sizeRem + "rem");
    localStorage.setItem("fontSize", sizeRem);
    if (decreaseBtn) decreaseBtn.disabled = sizeRem <= 0.5;
    if (increaseBtn) increaseBtn.disabled = sizeRem >= 2.5;
  }

  if (increaseBtn && decreaseBtn) {
    applySize(currentSize);

    increaseBtn.addEventListener("click", () => {
      currentSize = Math.min(currentSize + 0.1, 2.5);
      applySize(+currentSize.toFixed(2));
    });
    decreaseBtn.addEventListener("click", () => {
      currentSize = Math.max(currentSize - 0.1, 0.5);
      applySize(+currentSize.toFixed(2));
    });
  }
});
