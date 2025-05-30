document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration and Constants ---
    const API_KEY = 'c6e99cc6626de28d89826cee75d11a3c'; // API key for OpenWeatherMap.
    const CACHE_KEY = 'cachedWeather'; // Key for storing weather data in localStorage.
    const CACHE_DURATION = 1800000; // Cache validity duration: 30 minutes in milliseconds.

    // --- DOM Element Access Helper ---
    /**
     * Shortcut function to select a single DOM element using a CSS selector.
     * @param {string} selector - The CSS selector for the element.
     * @returns {Element|null} The first matching DOM element, or null if not found.
     */
    const $ = selector => document.querySelector(selector);

    // --- Cached DOM Elements ---
    // Storing references to frequently accessed DOM elements for performance and readability.
    const elements = {
        loc: $('#current-weather-preview p:nth-of-type(1) span'), // Location display.
        temp: $('#current-weather-preview p:nth-of-type(2) span'), // Temperature display.
        cond: $('#current-weather-preview p:nth-of-type(3) span'), // Weather conditions display.
        wind: $('#current-weather-preview p:nth-of-type(4) span'), // Wind speed display.
        aqi: $('#current-weather-preview .aqi-value'),           // Air Quality Index display.
        icon: $('#current-weather-icon-img'),                   // Weather icon image.
        form: $('#weather-search form'),                        // Weather search form (forecast page).
        locInput: $('#location'),                               // Location input field (forecast page).
        heroInput: $('#search-hero'),                           // Location input field (homepage hero section).
        weekly: $('#weekly-forecast tbody'),                    // Table body for weekly forecast.
        hourly: $('#hourly-forecast .slides'),                  // Container for hourly forecast slides.
        slider: $('#hourly-forecast .slider-wrapper'),          // Wrapper for the hourly forecast slider.
        selectOnMapBtn: $('#select-on-map-btn'),                // Button to open map selection modal.
        mapModal: $('#map-modal'),                              // Modal dialog for map selection.
        mapContainer: $('#leaflet-map-container'),              // Container for the Leaflet map.
        closeMapModalBtn: $('#close-map-modal-btn'),            // Button to close the map modal.
    };

    // --- Map Variables ---
    let leafletMap = null; // Holds the Leaflet map instance.
    let mapMarker = null;  // Holds the Leaflet marker instance on the map.

    // --- Utility Functions ---

    /**
     * Constructs the URL for a weather icon from OpenWeatherMap.
     * @param {string} code - The icon code provided by the API (e.g., "01d").
     * @param {string} [size="@2x.png"] - The desired icon size suffix (e.g., ".png", "@2x.png").
     * @returns {string} The full URL for the weather icon.
     */
    const iconUrl = (code, size = "@2x.png") => `https://openweathermap.org/img/wn/${code}${size}`;

    /**
     * Caches weather data in localStorage along with a timestamp.
     * @param {string} name - The location name associated with the data.
     * @param {object} data - The weather data object to cache.
     */
    function cacheWeather(name, data) {
        const record = { name, data, time: Date.now() };
        localStorage.setItem(CACHE_KEY, JSON.stringify(record));
    }

    /**
     * Retrieves cached weather data from localStorage if it's still valid (not expired).
     * @returns {{name: string, data: object}|null} The cached data or null if not found/expired.
     */
    function getCachedWeather() {
        const rawCachedData = localStorage.getItem(CACHE_KEY);
        if (!rawCachedData) return null;

        try {
            const { name, data, time } = JSON.parse(rawCachedData);
            // Check if cache has expired.
            if (Date.now() - time > CACHE_DURATION) {
                localStorage.removeItem(CACHE_KEY); // Remove expired cache.
                return null;
            }
            return { name, data };
        } catch (error) {
            // If parsing fails or structure is unexpected, remove the invalid cache.
            console.error("Error parsing cached weather data:", error);
            localStorage.removeItem(CACHE_KEY);
            return null;
        }
    }

    /**
     * Maps an AQI (Air Quality Index) numeric value to a descriptive text and CSS class.
     * @param {number|null} aqiValue - The AQI value (typically 1-5).
     * @returns {{description: string, className: string}} Details for displaying the AQI.
     */
    function getAqiDetails(aqiValue) {
        if (aqiValue == null) return { description: 'N/A', className: 'aqi-na' };
        // AQI values map: 1=Good, 2=Fair, 3=Moderate, 4=Poor, 5=Very Poor.
        const aqiMap = [
            null, // Index 0 is unused.
            { description: 'Good', className: 'aqi-good' },
            { description: 'Fair', className: 'aqi-fair' },
            { description: 'Moderate', className: 'aqi-moderate' },
            { description: 'Poor', className: 'aqi-poor' },
            { description: 'Very Poor', className: 'aqi-very-poor' },
        ];
        return aqiMap[aqiValue] || { description: 'Unknown', className: 'aqi-unknown' };
    }

    // --- UI Update Functions ---

    /**
     * Resets UI elements to a default or loading state.
     * @param {string} [locText="Loading..."] - Text to display for location.
     * @param {string} [forecastText="Loading..."] - Text for forecast sections.
     */
    function resetUI(locText = "Loading...", forecastText = "Loading...") {
        // Reset current weather text fields.
        ['temp', 'cond', 'wind'].forEach(key => {
            if (elements[key]) elements[key].textContent = 'N/A';
        });

        // Reset AQI display.
        if (elements.aqi) {
            elements.aqi.textContent = 'N/A';
            elements.aqi.className = 'aqi-value aqi-na'; // Reset CSS class.
        }

        // Reset location text.
        if (elements.loc) elements.loc.textContent = locText;

        // Reset weather icon.
        if (elements.icon) {
            elements.icon.src = '';
            elements.icon.alt = '';
            elements.icon.style.display = 'none';
        }

        // Reset weekly forecast table.
        if (elements.weekly) {
            elements.weekly.innerHTML = `<tr><td colspan="4" style="text-align:center;">${forecastText}</td></tr>`;
        }

        // Reset hourly forecast slider.
        if (elements.hourly) {
            elements.hourly.innerHTML = `<div class="slide" style="text-align:center;width:100%;"><p>${forecastText}</p></div>`;
            // If a slider initialization function is globally available, call it.
            window.initializeSlider?.(elements.slider);
        }
    }

    /**
     * Updates the "Current Weather" section of the UI with fetched data.
     * @param {object} data - The current weather data object from the API.
     * @param {string} name - The display name of the location.
     */
    function updateCurrent(data, name) {
        if (!data || !data.weather) { // Basic validation of input data.
            console.warn("updateCurrent called with invalid data:", data);
            return;
        }

        if (elements.loc) elements.loc.textContent = name || 'N/A';
        if (elements.temp) elements.temp.textContent = `${Math.round(data.temp)}°C`;
        if (elements.cond) {
            // Capitalize the first letter of each word in the description.
            const description = data.weather[0].description.replace(/\b\w/g, l => l.toUpperCase());
            elements.cond.textContent = description;
        }
        if (elements.wind) elements.wind.textContent = `${Math.round(data.wind_speed * 3.6)} km/h`; // Convert m/s to km/h.

        // Update AQI display.
        if (elements.aqi) {
            const { description, className } = getAqiDetails(data.aqi);
            elements.aqi.textContent = description;
            elements.aqi.className = `aqi-value ${className}`;
        }

        // Update weather icon.
        if (elements.icon) {
            elements.icon.src = iconUrl(data.weather[0].icon, ".png"); // Use smaller .png for inline display.
            elements.icon.alt = data.weather[0].description;
            elements.icon.style.display = 'inline';
        }
    }

    /**
     * Populates the "Weekly Forecast" table with provided forecast data.
     * @param {Array} forecast - An array of daily forecast objects from the API.
     */
    function updateWeekly(forecast) {
        if (!elements.weekly || !forecast?.length) return;
        elements.weekly.innerHTML = ''; // Clear existing rows.

        // Display forecast for the next 7 days.
        forecast.slice(0, 7).forEach(day => {
            const date = new Date(day.dt * 1000); // Convert UNIX timestamp to Date.
            const weekday = date.toLocaleDateString(undefined, { weekday: 'short' });
            const description = day.weather[0].description.replace(/\b\w/g, l => l.toUpperCase());

            const row = elements.weekly.insertRow();
            row.innerHTML = `
                <td>${weekday}</td>
                <td><img src="${iconUrl(day.weather[0].icon)}" alt="${description}" style="height:25px; vertical-align: middle;"> ${description}</td>
                <td>${Math.round(day.temp.max)}°C</td>
                <td>${Math.round(day.temp.min)}°C</td>
            `;
        });
    }

    /**
     * Populates the "Hourly Forecast" slider with provided forecast data.
     * @param {Array} forecast - An array of hourly forecast objects from the API.
     */
    function updateHourly(forecast) {
        if (!elements.hourly || !forecast?.length) return;
        elements.hourly.innerHTML = ''; // Clear existing slides.

        // Display forecast for the next 24 hours.
        forecast.slice(0, 24).forEach(hour => {
            const date = new Date(hour.dt * 1000);
            const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

            const slide = document.createElement('div');
            slide.className = 'slide';
            // Basic inline styles for slide content layout.
            slide.style.cssText = 'display:flex; flex-direction:column; align-items:center; padding:10px 5px; min-height:150px; min-width:100px; text-align:center;';
            slide.innerHTML = `
                <time style="font-weight:bold;">${time}</time>
                <img src="${iconUrl(hour.weather[0].icon)}" alt="${hour.weather[0].description}" style="width:50px;height:50px;" />
                <div><strong>${Math.round(hour.temp)}°C</strong><br><small>Feels: ${Math.round(hour.feels_like)}°C</small></div>
            `;
            elements.hourly.appendChild(slide);
        });
        // Re-initialize the slider if the function is available.
        window.initializeSlider?.(elements.slider);
    }

    /**
     * Orchestrates the update of all weather-related UI sections.
     * @param {object} data - The comprehensive weather data object from OneCall API.
     * @param {string} name - The display name of the location.
     */
    function showWeather(data, name) {
        updateCurrent(data.current, name);
        updateWeekly(data.daily);
        updateHourly(data.hourly);
    }

    // --- Data Fetching ---

    /**
     * Fetches weather data for a given location (either by name or coordinates).
     * Handles API calls for geolocation, weather, and air pollution.
     * Updates the UI or displays an error message.
     * @param {string|{lat: number, lon: number}} queryOrCoords - Location name string or an object with lat/lon.
     */
    async function getWeather(queryOrCoords) {
        resetUI("Getting weather...", "Please wait..."); // Set UI to loading state.
        let lat, lon, locName;

        try {
            // --- Step 1: Determine Latitude and Longitude ---
            if (typeof queryOrCoords === 'string') {
                // Geocoding: Convert location name to coordinates.
                const geoResponse = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(queryOrCoords)}&limit=1&appid=${API_KEY}`);
                if (!geoResponse.ok) throw new Error(`Geo API error: ${geoResponse.statusText} (Code: ${geoResponse.status})`);
                const geoData = await geoResponse.json();
                if (!geoData.length) throw new Error(`No location data found for "${queryOrCoords}"`);

                ({ lat, lon } = geoData[0]);
                // Format location name for display.
                locName = `${geoData[0].name}${geoData[0].state ? ', ' + geoData[0].state : ''}, ${geoData[0].country}`.trim();
                if (elements.locInput) elements.locInput.value = locName; // Update forecast page input.

            } else if (queryOrCoords?.lat && queryOrCoords?.lon) {
                // Coordinates provided directly (e.g., from map click).
                ({ lat, lon } = queryOrCoords);
                // Reverse Geocoding: Convert coordinates to location name.
                const reverseGeoResponse = await fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`);
                const reverseGeoData = reverseGeoResponse.ok ? await reverseGeoResponse.json() : [];
                locName = reverseGeoData.length > 0
                    ? `${reverseGeoData[0].name}${reverseGeoData[0].state ? ', ' + reverseGeoData[0].state : ''}, ${reverseGeoData[0].country}`.trim()
                    : `Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)}`; // Fallback name if reverse geocoding fails.
                if (elements.locInput) elements.locInput.value = locName;

            } else {
                throw new Error("Invalid query or coordinates provided.");
            }

            // --- Step 2: Fetch Weather Data (OneCall API) ---
            const weatherResponse = await fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,alerts&appid=${API_KEY}&units=metric`);
            if (!weatherResponse.ok) throw new Error(`Weather API error: ${weatherResponse.statusText} (Code: ${weatherResponse.status})`);
            const weatherData = await weatherResponse.json();

            // --- Step 3: Fetch Air Pollution Data ---
            const aqiResponse = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
            const aqiApiData = aqiResponse.ok ? await aqiResponse.json() : null;
            // Extract AQI value and add it to the current weather data.
            weatherData.current.aqi = aqiApiData?.list?.[0]?.main?.aqi || null;

            // --- Step 4: Update UI and Cache ---
            showWeather(weatherData, locName);
            cacheWeather(locName, weatherData);
            // Also update hero input on the homepage if it exists.
            if (elements.heroInput) elements.heroInput.value = locName;

        } catch (err) {
            console.error("Error fetching weather data:", err);
            alert(`Failed to fetch weather. ${err.message}. Please check console and try again.`);
            resetUI("Error", "Unable to load forecast.");
            if (elements.cond) elements.cond.textContent = (err.message || 'Unknown error').substring(0, 100);
        }
    }

    // --- Map Functionality ---

    /**
     * Initializes the Leaflet map for location selection.
     * Sets up tile layer and click event listener.
     */
    function initializeMap() {
        if (!elements.mapContainer || leafletMap) return; // Abort if no container or map already initialized.

        // Check if Leaflet library (L) is loaded.
        if (typeof L === 'undefined') {
            console.error("Leaflet library (L) is not loaded!");
            alert("Map library could not be loaded. Please ensure you are online and try again.");
            if (elements.mapModal) elements.mapModal.style.display = 'none'; // Hide modal if map fails.
            return;
        }

        // Create map instance.
        leafletMap = L.map(elements.mapContainer).setView([51.505, -0.09], 5); // Default view.
        // Add OpenStreetMap tile layer.
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(leafletMap);

        // Handle map click events.
        leafletMap.on('click', function(e) {
            const { lat, lng } = e.latlng;
            // Update existing marker or create a new one.
            if (mapMarker) {
                mapMarker.setLatLng(e.latlng);
            } else {
                mapMarker = L.marker(e.latlng).addTo(leafletMap);
            }
            mapMarker.bindPopup(`Selected: Lat ${lat.toFixed(4)}, Lon ${lng.toFixed(4)}`).openPopup();

            // After a short delay, close modal and fetch weather for selected coordinates.
            setTimeout(() => {
                if (elements.mapModal) elements.mapModal.style.display = 'none';
                getWeather({ lat, lon: lng });
            }, 700);
        });
    }

    // --- Event Listeners Setup ---

    /**
     * Sets up common event listeners for form submissions and modal interactions.
     */
    function setupCommonEventListeners() {
        // Weather search form submission (forecast.html).
        elements.form?.addEventListener('submit', e => {
            e.preventDefault();
            const query = elements.locInput?.value.trim();
            if (query) {
                getWeather(query);
            } else {
                alert('Please enter a location.');
            }
        });

        // "Select on Map" button click (forecast.html).
        elements.selectOnMapBtn?.addEventListener('click', () => {
            if (elements.mapModal) {
                elements.mapModal.style.display = 'block';
                if (!leafletMap) initializeMap(); // Initialize map if not already done.
                // Leaflet maps in hidden containers need their size invalidated when shown.
                setTimeout(() => leafletMap?.invalidateSize(), 10);
            }
        });

        // Close map modal button click.
        elements.closeMapModalBtn?.addEventListener('click', () => {
            if (elements.mapModal) elements.mapModal.style.display = 'none';
        });

        // Close map modal if clicked outside the modal content area (on the overlay).
        window.addEventListener('click', (event) => {
            if (event.target === elements.mapModal) {
                elements.mapModal.style.display = "none";
            }
        });
    }

    // --- Initialization Logic ---

    /**
     * Main initialization function.
     * Determines initial weather display based on URL parameters, cache, or IP geolocation.
     */
    function init() {
        // Ensure AQI element is selected if missed initially (e.g. if DOM was not fully ready).
        if (!elements.aqi && document.getElementById('current-weather-preview')) {
            elements.aqi = $('#current-weather-preview .aqi-value');
        }

        setupCommonEventListeners(); // Set up event listeners early.

        // --- Determine Initial Weather Location ---

        // 1. Check for 'location' in URL query parameters.
        const urlQueryLocation = new URLSearchParams(window.location.search).get('location');
        if (urlQueryLocation) {
            getWeather(urlQueryLocation);
            localStorage.setItem('cozySkiesVisitedBefore', 'true'); // Mark as visited.
            return; // Initialization complete if loaded from URL.
        }

        const hasVisitedBefore = localStorage.getItem('cozySkiesVisitedBefore');
        const cachedData = getCachedWeather();

        // 2. First visit and no cache: Try IP-based geolocation.
        if (!hasVisitedBefore && !cachedData) {
            console.log("First visit, no cache. Attempting IP-based auto-detection...");
            // Use ip-api.com for geolocation (Note: uses HTTP, consider alternatives for HTTPS sites if mixed content is an issue).
            fetch('http://ip-api.com/json/')
                .then(response => {
                    if (!response.ok) throw new Error(`IP-API request failed with status ${response.status}`);
                    return response.json();
                })
                .then(apiResponse => {
                    if (apiResponse.status === 'success' && apiResponse.city) {
                        // Format query for OpenWeatherMap (City, Country works well).
                        const query = apiResponse.country ? `${apiResponse.city}, ${apiResponse.country}` : apiResponse.city;
                        console.log('Auto-detected location for getWeather:', query);
                        getWeather(query); // getWeather handles UI and input field updates.
                    } else {
                        console.warn('IP-API did not return a city or status was not "success":', apiResponse.message || apiResponse);
                        resetUI("Cozy Skies", "Enter a location to begin."); // Fallback.
                    }
                })
                .catch(error => {
                    console.error('Error fetching IP-based location:', error);
                    resetUI("Cozy Skies", "Enter a location to begin."); // Fallback on error.
                })
                .finally(() => {
                    // Mark that an auto-detection attempt has been made.
                    localStorage.setItem('cozySkiesVisitedBefore', 'true');
                });
        }
        // 3. Cached data available: Load from cache.
        else if (cachedData) {
            console.log("Loading weather from cache.");
            showWeather(cachedData.data, cachedData.name);
            // Populate input fields with cached location name.
            if (elements.locInput) elements.locInput.value = cachedData.name;
            if (elements.heroInput) elements.heroInput.value = cachedData.name;
            // Ensure 'visited' flag is set if cache exists but flag was somehow missed.
            if (!hasVisitedBefore) localStorage.setItem('cozySkiesVisitedBefore', 'true');
        }
        // 4. Visited before, but no current cache (e.g., expired): Show default state.
        else {
            console.log("Visited before, but no cache. Displaying default state.");
            resetUI("Cozy Skies", "Enter a location to begin.");
        }
    }

    // Start the application.
    init();
});