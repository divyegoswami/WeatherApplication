// weather.js
document.addEventListener('DOMContentLoaded', () => {
    const apiKey = 'c6e99cc6626de28d89826cee75d11a3c'; // Your API key
    const LAST_WEATHER_DATA_KEY = 'cozySkies_lastWeatherData';
    const DATA_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

    // UI Elements
    const currentLocElement = document.querySelector('#current-weather-preview p:nth-of-type(1) span');
    const currentTempElement = document.querySelector('#current-weather-preview p:nth-of-type(2) span');
    const currentCondElement = document.querySelector('#current-weather-preview p:nth-of-type(3) span');
    const currentIconImgElement = document.getElementById('current-weather-icon-img');
    const currentWindElement = document.querySelector('#current-weather-preview p:nth-of-type(4) span');

    const weatherSearchForm = document.querySelector('#weather-search form'); // Forecast page search form
    const locationInput = document.getElementById('location'); // Forecast page search input
    const heroLocationInput = document.getElementById('search-hero'); // Index page hero search input

    const weeklyForecastTableBody = document.querySelector('#weekly-forecast tbody');
    const hourlyForecastSlidesContainer = document.querySelector('#hourly-forecast .slides');
    const hourlySliderWrapper = document.querySelector('#hourly-forecast .slider-wrapper');

    // --- Local Storage ---
    function saveWeatherDataToStorage(resolvedName, data) {
        const weatherInfo = { query: resolvedName, data: data, timestamp: Date.now() };
        try {
            localStorage.setItem(LAST_WEATHER_DATA_KEY, JSON.stringify(weatherInfo));
        } catch (e) {
            console.error("Error saving to localStorage:", e);
        }
    }

    function loadWeatherDataFromStorage() {
        try {
            const storedInfo = localStorage.getItem(LAST_WEATHER_DATA_KEY);
            if (!storedInfo) return null;
            const weatherInfo = JSON.parse(storedInfo);
            if (Date.now() - weatherInfo.timestamp > DATA_EXPIRY_MS) {
                localStorage.removeItem(LAST_WEATHER_DATA_KEY);
                return null;
            }
            return weatherInfo;
        } catch (e) {
            localStorage.removeItem(LAST_WEATHER_DATA_KEY); // Clear potentially corrupt data
            return null;
        }
    }

    // --- UI Update Utilities ---
    function getOpenWeatherMapIconUrl(iconCode, size = "@2x.png") {
        return `https://openweathermap.org/img/wn/${iconCode}${size}`;
    }

    function clearUI(locMessage = "Loading...", forecastMessage = "Loading forecast...") {
        if (currentLocElement) currentLocElement.textContent = locMessage;
        if (currentTempElement) currentTempElement.textContent = 'N/A';
        if (currentCondElement) currentCondElement.textContent = 'N/A';
        if (currentWindElement) currentWindElement.textContent = 'N/A';
        if (currentIconImgElement) {
            currentIconImgElement.src = '';
            currentIconImgElement.alt = '';
            currentIconImgElement.style.display = 'none';
        }

        if (weeklyForecastTableBody) {
            weeklyForecastTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">${forecastMessage}</td></tr>`;
        }
        if (hourlyForecastSlidesContainer) {
            hourlyForecastSlidesContainer.innerHTML = `<div class="slide" style="text-align:center;width:100%;"><p>${forecastMessage}</p></div>`;
            if (typeof window.initializeSlider === 'function' && hourlySliderWrapper) {
                window.initializeSlider(hourlySliderWrapper); // Re-init slider for empty/loading state
            }
        }
    }

    function updateCurrentWeatherUI(currentData, locationName) {
        if (currentLocElement) currentLocElement.textContent = locationName || 'N/A';
        if (!currentData || !currentData.weather || !currentData.weather[0]) {
            if (currentTempElement) currentTempElement.textContent = 'N/A';
            if (currentCondElement) currentCondElement.textContent = 'Data unavailable';
            if (currentWindElement) currentWindElement.textContent = 'N/A';
            if (currentIconImgElement) currentIconImgElement.style.display = 'none';
            return;
        }
        if (currentTempElement) currentTempElement.textContent = `${Math.round(currentData.temp)}°C`;
        if (currentCondElement) currentCondElement.textContent = currentData.weather[0].description.replace(/\b\w/g, l => l.toUpperCase());
        if (currentWindElement) currentWindElement.textContent = `${Math.round(currentData.wind_speed * 3.6)} km/h`;
        if (currentIconImgElement) {
            currentIconImgElement.src = getOpenWeatherMapIconUrl(currentData.weather[0].icon, ".png");
            currentIconImgElement.alt = currentData.weather[0].description;
            currentIconImgElement.style.display = 'inline';
        }
    }

    function updateWeeklyForecastUI(dailyData) {
        if (!weeklyForecastTableBody) return;
        if (!dailyData || dailyData.length === 0) {
            weeklyForecastTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Weekly data unavailable.</td></tr>';
            return;
        }
        weeklyForecastTableBody.innerHTML = ''; // Clear previous
        const daysToShow = Math.min(dailyData.length, 7);
        dailyData.slice(0, daysToShow).forEach(day => {
            const date = new Date(day.dt * 1000);
            const dayName = date.toLocaleDateString(navigator.language || 'en-US', { weekday: 'short' });
            const condition = day.weather[0].description.replace(/\b\w/g, l => l.toUpperCase());
            weeklyForecastTableBody.insertRow().innerHTML = `
                <td>${dayName}</td>
                <td><img src="${getOpenWeatherMapIconUrl(day.weather[0].icon, '.png')}" alt="${condition}" style="height:25px;vertical-align:middle;margin-right:5px;">${condition}</td>
                <td>${Math.round(day.temp.max)}°C</td>
                <td>${Math.round(day.temp.min)}°C</td>
            `;
        });
    }

    function updateHourlyForecastUI(hourlyData) {
        if (!hourlyForecastSlidesContainer) return;
        if (!hourlyData || hourlyData.length === 0) {
            hourlyForecastSlidesContainer.innerHTML = '<div class="slide" style="text-align:center;width:100%;"><p>Hourly data unavailable.</p></div>';
        } else {
            hourlyForecastSlidesContainer.innerHTML = ''; // Clear previous
            const hoursToShow = Math.min(hourlyData.length, 24);
            hourlyData.slice(0, hoursToShow).forEach(hour => {
                const date = new Date(hour.dt * 1000);
                const time = date.toLocaleTimeString(navigator.language || 'en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                const slide = document.createElement('div');
                slide.className = 'slide';
                slide.style.cssText = `display:flex; flex-direction:column; align-items:center; justify-content:space-around; text-align:center; padding:10px 5px; box-sizing:border-box; min-height:150px; min-width:100px;`;
                slide.innerHTML = `
                    <time style="font-weight:bold;font-size:0.9em;">${time}</time>
                    <img src="${getOpenWeatherMapIconUrl(hour.weather[0].icon)}" alt="${hour.weather[0].description}" style="width:50px;height:50px;" />
                    <div style="font-size:0.9em;">
                        <span style="font-size:1.1em;font-weight:bold;">${Math.round(hour.temp)}°C</span><br>
                        <span style="opacity:0.8;">Feels: ${Math.round(hour.feels_like)}°C</span>
                    </div>
                `;
                hourlyForecastSlidesContainer.appendChild(slide);
            });
        }
        if (typeof window.initializeSlider === 'function' && hourlySliderWrapper) {
            window.initializeSlider(hourlySliderWrapper);
        }
    }

    function displayFullWeatherData(weatherAPIData, resolvedLocationName) {
        updateCurrentWeatherUI(weatherAPIData.current, resolvedLocationName);
        // Only update forecast sections if their containers exist (i.e., on forecast.html)
        if (weeklyForecastTableBody) updateWeeklyForecastUI(weatherAPIData.daily);
        if (hourlyForecastSlidesContainer) updateHourlyForecastUI(weatherAPIData.hourly);
    }

    // --- Core Fetch & Display Logic ---
    async function fetchAndDisplayWeather(locationQuery) {
        clearUI("Loading weather...", "Fetching forecast...");
        try {
            // 1. Geocode location query to lat/lon
            const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(locationQuery)}&limit=1&appid=${apiKey}`;
            const geoResponse = await fetch(geoUrl);
            if (!geoResponse.ok) throw new Error(`Geocoding error: ${geoResponse.statusText}`);
            const geoData = await geoResponse.json();
            if (!geoData || geoData.length === 0) throw new Error(`Location "${locationQuery}" not found.`);
            
            const { lat, lon, name, state, country } = geoData[0];
            const resolvedName = `${name}${state ? ', ' + state : ''}, ${country || ''}`.trim().replace(/,$/, '');

            // 2. Fetch weather data using lat/lon
            const weatherUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,alerts&appid=${apiKey}&units=metric`;
            const weatherResponse = await fetch(weatherUrl);
            if (!weatherResponse.ok) throw new Error(`Weather data error: ${weatherResponse.statusText}`);
            const weatherData = await weatherResponse.json();

            // 3. Display data and cache it
            displayFullWeatherData(weatherData, resolvedName);
            saveWeatherDataToStorage(resolvedName, weatherData);

            // 4. Update search input fields with resolved name for consistency
            if (locationInput) locationInput.value = resolvedName;
            if (heroLocationInput) heroLocationInput.value = resolvedName;

        } catch (error) {
            console.error("Fetch Weather Error:", error.message);
            alert(`Error: ${error.message}`);
            clearUI("Error", "Could not load data.");
            if (currentCondElement) currentCondElement.textContent = error.message.substring(0, 50); // Show brief error
        }
    }

    // --- Initialization on Page Load ---
    function initializeApp() {
        const queryFromUrl = new URLSearchParams(window.location.search).get('location');

        if (queryFromUrl) {
            if (locationInput) locationInput.value = queryFromUrl;
            if (heroLocationInput) heroLocationInput.value = queryFromUrl;
            fetchAndDisplayWeather(queryFromUrl);
            return;
        }

        const cachedWeather = loadWeatherDataFromStorage();
        if (cachedWeather) {
            displayFullWeatherData(cachedWeather.data, cachedWeather.query);
            if (locationInput) locationInput.value = cachedWeather.query;
            if (heroLocationInput) heroLocationInput.value = cachedWeather.query;
            return;
        }
        
        // Default state if no URL query and no cache
        clearUI("Cozy Skies", "Enter a location to see the weather.");
    }

    // --- Event Listeners ---
    if (weatherSearchForm && locationInput) { // Forecast page search
        weatherSearchForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const query = locationInput.value.trim();
            if (query) {
                fetchAndDisplayWeather(query);
            } else {
                alert('Please enter a location.');
            }
        });
    }
    // index.html hero form submission is handled by standard form action navigating to forecast.html

    // --- Start ---
    initializeApp();
});