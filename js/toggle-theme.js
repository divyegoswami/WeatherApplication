document.addEventListener("DOMContentLoaded", () => {
    const themeButton = document.getElementById("toggle-theme-control");
    const contrastButton = document.getElementById("high-contrast");
    
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);

    function setTheme(theme) {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
        
        themeButton.ariaPressed = theme === "dark";
        contrastButton.ariaPressed = theme === "high-contrast";

        themeButton.textContent = theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode";
    }

    themeButton.addEventListener("click", () => {
        const currentTheme = document.documentElement.getAttribute("data-theme");
        setTheme(currentTheme === "dark" ? "light" : "dark");
    });

    contrastButton.addEventListener("click", () => {
        const currentTheme = document.documentElement.getAttribute("data-theme");
        setTheme(currentTheme === "high-contrast" ? "light" : "high-contrast");
    });
});
