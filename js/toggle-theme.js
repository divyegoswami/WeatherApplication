// Theme Toggle Logic
document.addEventListener("DOMContentLoaded", () => {
    const themeButton = document.getElementById("toggle-theme-control");
    const contrastButton = document.getElementById("high-contrast");
    
    // Load the saved theme
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);

    function setTheme(theme) {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
        
        // Update button active states
        themeButton.ariaPressed = theme === "dark";
        contrastButton.ariaPressed = theme === "high-contrast";

        // Update button text
        themeButton.textContent = theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode";
    }

    // Theme toggle
    themeButton.addEventListener("click", () => {
        const currentTheme = document.documentElement.getAttribute("data-theme");
        setTheme(currentTheme === "dark" ? "light" : "dark");
    });

    // High contrast toggle
    contrastButton.addEventListener("click", () => {
        const currentTheme = document.documentElement.getAttribute("data-theme");
        setTheme(currentTheme === "high-contrast" ? "light" : "high-contrast");
    });
});
