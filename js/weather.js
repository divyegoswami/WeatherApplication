// weather.js
document.addEventListener('DOMContentLoaded', () => {
    const apiKey = 'c6e99cc6626de28d89826cee75d11a3c'; // Keep your API key secure
    const LAST_WEATHER_DATA_KEY = 'cozySkies_lastWeatherData';
    const DATA_EXPIRY_MS = 30 * 60 * 1000; // Data is considered fresh for 30 minutes

    // --- UI Element Selectors ---
    // Common for current weather preview (present on both index.html and forecast.html)
    const currentLocElement = document.querySelector('#current-weather-preview p:nth-of-type(1) span');
    const currentTempElement = document.querySelector('#current-weather-preview p:nth-of-type(2) span');
    const currentCondElement = document.querySelector('#current-weather-preview p:nth-of-type(3) span'); // Span for text
    const currentIconImgElement = document.getElementById('current-weather-icon-img'); // Img tag for icon
    const currentWindElement = document.querySelector('#current-weather-preview p:nth-of-type(4) span');

    // Specific to forecast.html
    const weatherSearchForm = document.querySelector('#weather-search form');
    const locationInput = document.getElementById('location'); // Search input on forecast.html
    const weeklyForecastTableBody = document.querySelector('#weekly-forecast tbody');
    const hourlyForecastSlidesContainer = document.querySelector('#hourly-forecast .slides');
    const hourlySliderWrapper = document.querySelector('#hourly-forecast .slider-wrapper');

    // Specific to index.html (hero search input)
    const heroLocationInput = document.getElementById('search-hero');


    // --- Local Storage Functions ---
    function saveWeatherDataToStorage(query, data) {
        const weatherInfo = {
            query: query, // The query string or resolved name that fetched this data
            data: data,   // The full weatherData object from OpenWeatherMap OneCall API
            timestamp: Date.now()
        };
        try {
            localStorage.setItem(LAST_WEATHER_DATA_KEY, JSON.stringify(weatherInfo));
            console.log("Weather data saved to localStorage for:", query);
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
                console.log("Cached weather data is stale for:", weatherInfo.query);
                localStorage.removeItem(LAST_WEATHER_DATA_KEY);
                return null;
            }
            console.log("Fresh weather data loaded from localStorage for:", weatherInfo.query);
            return weatherInfo; // Contains { query, data, timestamp }
        } catch (e) {
            console.error("Error loading from localStorage:", e);
            localStorage.removeItem(LAST_WEATHER_DATA_KEY); // Clear corrupted data
            return null;
        }
    }

    // --- UI Update Functions ---
    function getOpenWeatherMapIconUrl(iconCode, size = "@2x.png") {
        return `https://openweathermap.org/img/wn/${iconCode}${size}`;
    }

    function clearAllUIStates() {
        if (currentLocElement) currentLocElement.textContent = 'Loading...';
        if (currentTempElement) currentTempElement.textContent = 'N/A';
        if (currentCondElement) currentCondElement.textContent = 'N/A';
        if (currentWindElement) currentWindElement.textContent = 'N/A';
        if (currentIconImgElement) {
            currentIconImgElement.src = '';
            currentIconImgElement.alt = '';
            currentIconImgElement.style.display = 'none';
        }

        if (weeklyForecastTableBody) {
            weeklyForecastTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Loading...</td></tr>';
        }
        if (hourlyForecastSlidesContainer) {
            hourlyForecastSlidesContainer.innerHTML = '<div class="slide" style="text-align:center;width:100%;"><p>Loading...</p></div>';
            if (typeof window.initializeSlider === 'function' && hourlySliderWrapper) {
                window.initializeSlider(hourlySliderWrapper); // Re-init for loading state
            }
        }
    }
    
    function updateCurrentWeatherUI(currentData, locationNameToDisplay) {
        if (currentLocElement) currentLocElement.textContent = locationNameToDisplay || 'N/A';

        if (currentData && currentData.weather && currentData.weather[0]) {
            if (currentTempElement) currentTempElement.textContent = `${Math.round(currentData.temp)}°C`;
            if (currentCondElement) currentCondElement.textContent = currentData.weather[0].description.replace(/\b\w/g, l => l.toUpperCase());
            if (currentWindElement) currentWindElement.textContent = `${Math.round(currentData.wind_speed * 3.6)} km/h`; // Assuming m/s to km/h

            if (currentIconImgElement) {
                currentIconImgElement.src = getOpenWeatherMapIconUrl(currentData.weather[0].icon, ".png"); // smaller icon for preview
                currentIconImgElement.alt = currentData.weather[0].description;
                currentIconImgElement.style.display = 'inline';
            }
        } else {
            if (currentTempElement) currentTempElement.textContent = 'N/A';
            if (currentCondElement) currentCondElement.textContent = 'Data unavailable';
            if (currentWindElement) currentWindElement.textContent = 'N/A';
            if (currentIconImgElement) currentIconImgElement.style.display = 'none';
        }
    }

    function displayFullWeatherData(fullWeatherData, locationNameToDisplay) {
        // Update current weather preview (common to both pages)
        updateCurrentWeatherUI(fullWeatherData.current, locationNameToDisplay);

        // Update forecast sections (only if on forecast.html and elements exist)
        if (weeklyForecastTableBody && fullWeatherData.daily) {
            updateWeeklyForecastUI(fullWeatherData.daily);
        } else if (weeklyForecastTableBody) { // If element exists but no data
            weeklyForecastTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Weekly forecast data unavailable.</td></tr>';
        }

        if (hourlyForecastSlidesContainer && fullWeatherData.hourly) {
            updateHourlyForecastUI(fullWeatherData.hourly);
        } else if (hourlyForecastSlidesContainer) { // If element exists but no data
            hourlyForecastSlidesContainer.innerHTML = '<div class="slide" style="text-align:center; width:100%;"><p>Hourly forecast data unavailable.</p></div>';
            if (typeof window.initializeSlider === 'function' && hourlySliderWrapper) window.initializeSlider(hourlySliderWrapper);
        }
    }

    function updateWeeklyForecastUI(dailyData) {
        if (!weeklyForecastTableBody) return; // Should already be checked by caller
        weeklyForecastTableBody.innerHTML = '';

        if (!dailyData || dailyData.length === 0) {
            weeklyForecastTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Weekly forecast data unavailable.</td></tr>';
            return;
        }
        const daysToShow = Math.min(dailyData.length, 7); // Show up to 7 days
        dailyData.slice(0, daysToShow).forEach(day => {
            const date = new Date(day.dt * 1000);
            const dayName = date.toLocaleDateString(navigator.language || 'en-US', { weekday: 'short' });
            const highTemp = Math.round(day.temp.max);
            const lowTemp = Math.round(day.temp.min);
            const iconCode = day.weather[0].icon;
            const conditionDescription = day.weather[0].description.replace(/\b\w/g, l => l.toUpperCase());

            const row = weeklyForecastTableBody.insertRow();
            row.innerHTML = `
                <td>${dayName}</td>
                <td><img src="${getOpenWeatherMapIconUrl(iconCode, '.png')}" alt="${conditionDescription}" style="height: 25px; vertical-align: middle; margin-right: 5px;">${conditionDescription}</td>
                <td>${highTemp}°C</td>
                <td>${lowTemp}°C</td>
            `;
        });
    }

    function updateHourlyForecastUI(hourlyData) {
        if (!hourlyForecastSlidesContainer) return; // Should already be checked by caller
        hourlyForecastSlidesContainer.innerHTML = '';

        if (!hourlyData || hourlyData.length === 0) {
            hourlyForecastSlidesContainer.innerHTML = '<div class="slide" style="text-align:center; width:100%;"><p>Hourly forecast data unavailable.</p></div>';
        } else {
            const hoursToShow = Math.min(hourlyData.length, 24); // Show up to 24 hours
            hourlyData.slice(0, hoursToShow).forEach(hour => {
                const date = new Date(hour.dt * 1000);
                const timeString = date.toLocaleTimeString(navigator.language || 'en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                const temp = Math.round(hour.temp);
                const feelsLikeTemp = Math.round(hour.feels_like);
                const iconCode = hour.weather[0].icon;
                const conditionDescription = hour.weather[0].description;

                const slide = document.createElement('div');
                slide.classList.add('slide');
                // Basic styling, ensure your CSS for .slide handles layout better
                slide.style.cssText = ` 
                    display: flex; flex-direction: column; align-items: center; justify-content: space-around;
                    text-align: center; padding: 10px 5px; box-sizing: border-box; min-height: 150px; min-width: 100px;
                `;
                slide.innerHTML = `
                    <time style="font-weight: bold; font-size: 0.9em; margin-bottom: 5px;">${timeString}</time>
                    <img src="${getOpenWeatherMapIconUrl(iconCode)}" alt="${conditionDescription}" style="width: 50px; height: 50px; margin-bottom: 5px;" />
                    <div class="temps" style="font-size: 0.9em;">
                        <span class="temp-main" style="font-size: 1.1em; font-weight: bold;">${temp}°C</span><br>
                        <span class="temp-feelslike" style="opacity: 0.8;">Feels: ${feelsLikeTemp}°C</span>
                    </div>
                `;
                hourlyForecastSlidesContainer.appendChild(slide);
            });
        }
        if (typeof window.initializeSlider === 'function' && hourlySliderWrapper) {
            window.initializeSlider(hourlySliderWrapper);
        }
    }

    // --- Core Fetch Logic ---
    async function fetchAndDisplayWeather(locationSource, isCoords = false) {
        clearAllUIStates(); // Show loading state across relevant UI parts

        let lat, lon, locationNameToDisplay, originalQuery = "";

        try {
            if (isCoords) { // Geolocation coordinates provided
                lat = locationSource.latitude;
                lon = locationSource.longitude;
                const reverseGeoUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`;
                const rgResponse = await fetch(reverseGeoUrl);
                if (!rgResponse.ok) throw new Error(`Reverse geocoding failed: ${rgResponse.statusText}`);
                const rgData = await rgResponse.json();
                if (rgData && rgData.length > 0) {
                    const loc = rgData[0];
                    locationNameToDisplay = `${loc.name}${loc.state ? ', ' + loc.state : ''}, ${loc.country || ''}`.trim().replace(/,$/, '');
                    originalQuery = locationNameToDisplay; // For saving, use the resolved name
                } else {
                    locationNameToDisplay = "Current Location";
                    originalQuery = `coords:${lat},${lon}`; // Save identifiable query for coords
                }
            } else { // Location query string provided
                originalQuery = locationSource;
                const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(originalQuery)}&limit=1&appid=${apiKey}`;
                const geoResponse = await fetch(geoUrl);
                if (!geoResponse.ok) throw new Error(`Geocoding failed: ${geoResponse.statusText}`);
                const geoData = await geoResponse.json();
                if (!geoData || geoData.length === 0) {
                    throw new Error(`Location "${originalQuery}" not found.`);
                }
                const locDetails = geoData[0];
                lat = locDetails.lat;
                lon = locDetails.lon;
                locationNameToDisplay = `${locDetails.name}${locDetails.state ? ', ' + locDetails.state : ''}, ${locDetails.country || ''}`.trim().replace(/,$/, '');
            }

            const weatherUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,alerts&appid=${apiKey}&units=metric`;
            const weatherResponse = await fetch(weatherUrl);
            if (!weatherResponse.ok) {
                const errorData = await weatherResponse.json().catch(() => ({})); // Try to get error message from API
                throw new Error(`Weather data fetch failed: ${errorData.message || weatherResponse.statusText}`);
            }
            const weatherData = await weatherResponse.json();

            displayFullWeatherData(weatherData, locationNameToDisplay);
            saveWeatherDataToStorage(originalQuery, weatherData); // Save using the original query or resolved name

            // If on forecast page and this was a search, update the input field (especially if it was from geolocation)
            if (locationInput && (isCoords || locationInput.value !== locationNameToDisplay)) {
                locationInput.value = locationNameToDisplay;
            }

        } catch (error) {
            console.error('Error in fetchAndDisplayWeather:', error);
            alert(`Failed to fetch weather data: ${error.message}`);
            // Update UI to show a clear error message
            if (currentLocElement) currentLocElement.textContent = 'Error';
            if (currentCondElement) currentCondElement.textContent = error.message.length > 50 ? error.message.substring(0,47) + '...' : error.message;
            // Potentially clear other parts of the forecast page if they exist
            if (weeklyForecastTableBody) weeklyForecastTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Error: ${error.message}</td></tr>`;
            if (hourlyForecastSlidesContainer) hourlyForecastSlidesContainer.innerHTML = `<div class="slide" style="text-align:center;width:100%;"><p>Error: ${error.message}</p></div>`;
        }
    }

    // --- Initialization Logic on Page Load ---
    function initializeWeatherApp() {
        const urlParams = new URLSearchParams(window.location.search);
        const queryFromUrl = urlParams.get('location');

        if (queryFromUrl) { // Typically on forecast.html after search from index.html or direct nav
            console.log("Query from URL:", queryFromUrl);
            if (locationInput) locationInput.value = queryFromUrl; // Pre-fill forecast page search bar
            if (heroLocationInput) heroLocationInput.value = queryFromUrl; // Also pre-fill index page if navigated back
            fetchAndDisplayWeather(queryFromUrl);
        } else {
            const cachedWeather = loadWeatherDataFromStorage();
            if (cachedWeather && cachedWeather.data) {
                console.log("Displaying cached weather for:", cachedWeather.query);
                displayFullWeatherData(cachedWeather.data, cachedWeather.query.startsWith("coords:") ? "Current Location (Cached)" : cachedWeather.query);
                // Pre-fill search inputs with cached query if they exist
                if (locationInput && !cachedWeather.query.startsWith("coords:")) locationInput.value = cachedWeather.query;
                if (heroLocationInput && !cachedWeather.query.startsWith("coords:")) heroLocationInput.value = cachedWeather.query;

            } else { // No URL query, no fresh cached data
                if (navigator.geolocation) {
                    console.log("Attempting geolocation...");
                    clearAllUIStates();
                    navigator.geolocation.getCurrentPosition(
                        position => {
                            console.log("Geolocation successful.");
                            fetchAndDisplayWeather({ latitude: position.coords.latitude, longitude: position.coords.longitude }, true);
                        },
                        geoError => {
                            console.warn("Geolocation failed/denied:", geoError.message);
                            if (currentLocElement) currentLocElement.textContent = "Search for weather";
                            if (currentCondElement) currentCondElement.textContent = "Geolocation unavailable. Please use search.";
                            // Optionally: fetchAndDisplayWeather('New York, US'); // Default city
                        }
                    );
                } else {
                    console.warn("Geolocation not supported.");
                    if (currentLocElement) currentLocElement.textContent = "Search for weather";
                    if (currentCondElement) currentCondElement.textContent = "Geolocation not supported. Please use search.";
                    // Optionally: fetchAndDisplayWeather('Paris, FR'); // Default city
                }
            }
        }
    }

    // --- Event Listeners for Forms ---
    if (weatherSearchForm && locationInput) { // Forecast page search form
        weatherSearchForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const locationQuery = locationInput.value.trim();
            if (locationQuery) {
                fetchAndDisplayWeather(locationQuery);
            } else {
                alert('Please enter a location.');
            }
        });
    }

    // The index.html hero form naturally navigates to forecast.html?location=...
    // No special JS needed for its submit event here, as initializeWeatherApp() on forecast.html handles the URL query.

    // --- Start the app ---
    initializeWeatherApp();
});