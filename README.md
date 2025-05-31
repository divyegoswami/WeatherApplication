# 🌤️ Cozy Skies — Weather Dashboard

**Cozy Skies** is a responsive, accessible, and interactive web application that provides real-time weather forecasts, air quality updates, and dynamic visualizations powered by OpenWeather APIs and Leaflet.js.

## 📌 Features

- 🌍 **Location-based Weather**: Search by city name or select coordinates from an interactive map.
- 📅 **7-Day Forecast**: Clear and concise weekly weather overview.
- ⏰ **24-Hour Forecast Slider**: Interactive hourly updates with icons and temperature details.
- 📡 **Air Quality Index (AQI)**: Real-time AQI ratings with visual color-coded badges.
- 🎨 **Theme Support**: Toggle between light, dark, and high-contrast modes.
- 🔍 **Accessible UI**: Includes keyboard navigation, ARIA live regions, and font size controls.
- 📦 **Local Storage Support**: Caches the last viewed location for convenience.
- 🕐 **Live Clock**: Real-time digital clock in the footer.
- 🔄 **Sticky Header & Smooth Scroll**: Enhances navigation and user experience.
- 🧾 **Contact Form**: Client-side validated feedback form with mailto integration.
- ❓ **FAQ Section**: Expandable Q&A on weather data and app usage.

## 🧑‍💻 Technologies Used

- **HTML5**, **CSS3**, and **JavaScript (ES6+)**
- [jQuery 3.7.1](https://jquery.com/)
- [OpenWeatherMap API](https://openweathermap.org/)
- [Leaflet.js](https://leafletjs.com/) for map integration

## 🗺️ API Integration

The application uses three OpenWeather endpoints:

- `/geo/1.0/direct` and `/geo/1.0/reverse` for location resolution
- `/data/3.0/onecall` for current, daily, and hourly weather data
- `/data/2.5/air_pollution` for AQI information

## 📁 Project Structure

```
📦 Cozy-Skies/
├── css/
│   └── styles.css
├── js/
│   ├── weather.js
│   ├── slider.js
│   ├── toggle-theme.js
│   └── jquery-enhancements.js
├── images/
│   └── (icons, logos, hero backgrounds, etc.)
├── index.html
├── forecast.html
├── about.html
├── contact.html
├── accessibility.html
├── privacy-policy.html
└── README.md
```

## 🧑‍🎯 Personas and Use Cases

- **Mike**: A commuter who checks the app every morning for quick updates.
- **Rosey**: A travel blogger who uses the hourly and map features while planning trips.
- **Stacy**: A fitness enthusiast needing AQI and weather for outdoor runs.
- **Visually impaired users**: Benefit from theme toggles, high contrast, and keyboard navigation.

## 🚀 Getting Started

1. Clone or download the repository.
2. Open `index.html` in a web browser.
3. Ensure internet access to retrieve live weather and map data.
4. Optional: Replace the placeholder OpenWeather API key in `weather.js`.

```js
const API_KEY = 'your_openweather_api_key_here';
```

## ♿ Accessibility Highlights

- ARIA live region announces weather updates.
- Dark, light, and high-contrast themes.
- Adjustable font sizes.
- Fully keyboard-navigable with visual focus indicators.

## 📝 License

This project is for educational and non-commercial use only. Attribution to OpenWeatherMap and OpenStreetMap is maintained as per their guidelines.