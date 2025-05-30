document.addEventListener('DOMContentLoaded', () => {
    const API_KEY = 'c6e99cc6626de28d89826cee75d11a3c'; // API key for OpenWeatherMap
    const CACHE_KEY = 'cachedWeather'; // Key for localStorage caching
    const CACHE_DURATION = 1800000; // Cache duration: 30 minutes in milliseconds

    // Selects DOM elements
    const elements = {
        loc: document.querySelector('#current-weather-preview p:nth-of-type(1) span'),
        temp: document.querySelector('#current-weather-preview p:nth-of-type(2) span'),
        cond: document.querySelector('#current-weather-preview p:nth-of-type(3) span'),
        wind: document.querySelector('#current-weather-preview p:nth-of-type(4) span'),
        aqi: document.querySelector('#current-weather-preview .aqi-value'),
        icon: document.querySelector('#current-weather-icon-img'),
        form: document.querySelector('#weather-search form'),
        locInput: document.querySelector('#location'),
        heroInput: document.querySelector('#search-hero'),
        weekly: document.querySelector('#weekly-forecast tbody'),
        hourly: document.querySelector('#hourly-forecast .slides'),
        slider: document.querySelector('#hourly-forecast .slider-wrapper'),
        selectOnMapBtn: document.querySelector('#select-on-map-btn'),
        mapModal: document.querySelector('#map-modal'),
        mapContainer: document.querySelector('#leaflet-map-container'),
        closeMapModalBtn: document.querySelector('#close-map-modal-btn'),
        getCurrentLocationBtn: document.querySelector('#get-current-location-btn'),
        getCurrentLocationHeroBtn: document.querySelector('#get-current-location-hero-btn')
    };

    let leafletMap = null; // Holds the Leaflet map instance
    let mapMarker = null; // Holds the Leaflet map marker instance

    // Generates OpenWeatherMap icon URL
    const iconUrl = (code, size = "@2x.png") => `https://openweathermap.org/img/wn/${code}${size}`;

    // Caches weather data in localStorage
    function cacheWeather(name, data) {
        const record = { name, data, time: Date.now() };
        localStorage.setItem(CACHE_KEY, JSON.stringify(record));
    }

    // Retrieves cached weather data from localStorage
    function getCachedWeather() {
        const rawCachedData = localStorage.getItem(CACHE_KEY);
        if (!rawCachedData) return null;
        try {
            const { name, data, time } = JSON.parse(rawCachedData);
            // Checks if cache has expired
            if (Date.now() - time > CACHE_DURATION) {
                localStorage.removeItem(CACHE_KEY);
                return null;
            }
            return { name, data };
        } catch (error) {
            console.error("Error parsing cached weather data:", error);
            localStorage.removeItem(CACHE_KEY); // Clears invalid cache
            return null;
        }
    }

    // Gets AQI description and CSS class based on AQI value
    function getAqiDetails(aqiValue) {
        if (aqiValue == null) return { description: 'N/A', className: 'aqi-na' };
        const aqiMap = [
            null, // AQI values are 1-indexed
            { description: 'Good', className: 'aqi-good' },
            { description: 'Fair', className: 'aqi-fair' },
            { description: 'Moderate', className: 'aqi-moderate' },
            { description: 'Poor', className: 'aqi-poor' },
            { description: 'Very Poor', className: 'aqi-very-poor' },
        ];
        return aqiMap[aqiValue] || { description: 'Unknown', className: 'aqi-unknown' };
    }

    // Resets UI elements to a loading or default state
    function resetUI(locText = "Loading...", forecastText = "Loading...") {
        if (elements.loc) elements.loc.textContent = locText;
        if (elements.temp) elements.temp.textContent = 'N/A';
        if (elements.cond) elements.cond.textContent = 'N/A';
        if (elements.wind) elements.wind.textContent = 'N/A';

        if (elements.aqi) {
            elements.aqi.textContent = 'N/A';
            elements.aqi.className = 'aqi-value aqi-na';
        }
        if (elements.icon) {
            elements.icon.src = '';
            elements.icon.alt = '';
            elements.icon.style.display = 'none';
        }
        if (elements.weekly) {
            elements.weekly.innerHTML = `<tr><td colspan="4" style="text-align:center;">${forecastText}</td></tr>`;
        }
        if (elements.hourly) {
            elements.hourly.innerHTML = `<div class="slide" style="text-align:center;width:100%;"><p>${forecastText}</p></div>`;
            window.initializeSlider?.(elements.slider); // Re-initializes slider if present
        }
    }

    // Updates the current weather display section
    function updateCurrent(data, name) {
        if (!data || !data.weather) {
            console.warn("updateCurrent called with invalid data:", data);
            return;
        }
        if (elements.loc) elements.loc.textContent = name || 'N/A';
        if (elements.temp) elements.temp.textContent = `${Math.round(data.temp)}°C`;
        if (elements.cond) {
            const description = data.weather[0].description.replace(/\b\w/g, l => l.toUpperCase());
            elements.cond.textContent = description;
        }
        if (elements.wind) elements.wind.textContent = `${Math.round(data.wind_speed * 3.6)} km/h`; // m/s to km/h
        if (elements.aqi) {
            const { description, className } = getAqiDetails(data.aqi);
            elements.aqi.textContent = description;
            elements.aqi.className = `aqi-value ${className}`;
        }
        if (elements.icon) {
            elements.icon.src = iconUrl(data.weather[0].icon, ".png");
            elements.icon.alt = data.weather[0].description;
            elements.icon.style.display = 'inline';
        }
    }

    // Updates the weekly forecast display section
    function updateWeekly(forecast) {
        if (!elements.weekly || !forecast?.length) return;
        elements.weekly.innerHTML = ''; // Clears previous forecast
        forecast.slice(0, 7).forEach(day => { // Displays up to 7 days
            const date = new Date(day.dt * 1000);
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

    // Updates the hourly forecast display section
    function updateHourly(forecast) {
        if (!elements.hourly || !forecast?.length) return;
        elements.hourly.innerHTML = ''; // Clears previous forecast
        forecast.slice(0, 24).forEach(hour => { // Displays up to 24 hours
            const date = new Date(hour.dt * 1000);
            const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
            const slide = document.createElement('div');
            slide.className = 'slide';
            slide.style.cssText = 'display:flex; flex-direction:column; align-items:center; padding:10px 5px; min-height:150px; min-width:100px; text-align:center;';
            slide.innerHTML = `
                <time style="font-weight:bold;">${time}</time>
                <img src="${iconUrl(hour.weather[0].icon)}" alt="${hour.weather[0].description}" style="width:50px;height:50px;" />
                <div><strong>${Math.round(hour.temp)}°C</strong><br><small>Feels: ${Math.round(hour.feels_like)}°C</small></div>
            `;
            elements.hourly.appendChild(slide);
        });
        window.initializeSlider?.(elements.slider); // Re-initializes slider if present
    }

    // Fetches and displays weather data for a given query or coordinates
    async function getWeather(queryOrCoords) {
        resetUI("Getting weather...", "Please wait...");
        let lat, lon, locName;

        try {
            // Determines latitude, longitude, and location name
            if (typeof queryOrCoords === 'string') {
                const geoResponse = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(queryOrCoords)}&limit=1&appid=${API_KEY}`);
                if (!geoResponse.ok) throw new Error(`Geo API error: ${geoResponse.statusText} (Code: ${geoResponse.status})`);
                const geoData = await geoResponse.json();
                if (!geoData.length) throw new Error(`No location data found for "${queryOrCoords}"`);
                ({ lat, lon } = geoData[0]);
                locName = `${geoData[0].name}${geoData[0].state ? ', ' + geoData[0].state : ''}, ${geoData[0].country}`.trim();
                if (elements.locInput) elements.locInput.value = locName;
            } else if (queryOrCoords?.lat && queryOrCoords?.lon) {
                ({ lat, lon } = queryOrCoords);
                const reverseGeoResponse = await fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`);
                const reverseGeoData = reverseGeoResponse.ok ? await reverseGeoResponse.json() : [];
                locName = reverseGeoData.length > 0
                    ? `${reverseGeoData[0].name}${reverseGeoData[0].state ? ', ' + reverseGeoData[0].state : ''}, ${reverseGeoData[0].country}`.trim()
                    : `Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)}`;
                if (elements.locInput) elements.locInput.value = locName;
            } else {
                throw new Error("Invalid query or coordinates provided.");
            }

            // Fetches weather data
            const weatherResponse = await fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,alerts&appid=${API_KEY}&units=metric`);
            if (!weatherResponse.ok) throw new Error(`Weather API error: ${weatherResponse.statusText} (Code: ${weatherResponse.status})`);
            const weatherData = await weatherResponse.json();

            // Fetches Air Quality Index (AQI) data
            const aqiResponse = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
            const aqiApiData = aqiResponse.ok ? await aqiResponse.json() : null;
            weatherData.current.aqi = aqiApiData?.list?.[0]?.main?.aqi || null;

            // Updates UI with fetched data
            updateCurrent(weatherData.current, locName);
            updateWeekly(weatherData.daily);
            updateHourly(weatherData.hourly);

            cacheWeather(locName, weatherData); // Caches the new weather data
            if (elements.heroInput) elements.heroInput.value = locName;

        } catch (err) {
            console.error("Error fetching weather data:", err);
            alert(`Failed to fetch weather. ${err.message}. Please check console and try again.`);
            resetUI("Error", "Unable to load forecast.");
            if (elements.cond) elements.cond.textContent = (err.message || 'Unknown error').substring(0, 100);
        }
    }

    // Initializes the Leaflet map
    function initializeMap() {
        if (!elements.mapContainer || leafletMap) return; // Prevents re-initialization or if container missing
        if (typeof L === 'undefined') { // Checks if Leaflet library is loaded
            console.error("Leaflet library (L) is not loaded!");
            alert("Map library could not be loaded. Please ensure you are online and try again.");
            if (elements.mapModal) elements.mapModal.style.display = 'none';
            return;
        }
        // Creates map and sets initial view
        leafletMap = L.map(elements.mapContainer).setView([51.505, -0.09], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(leafletMap);

        // Handles map click events
        leafletMap.on('click', function(e) {
            const { lat, lng } = e.latlng;
            if (mapMarker) {
                mapMarker.setLatLng(e.latlng); // Moves existing marker
            } else {
                mapMarker = L.marker(e.latlng).addTo(leafletMap); // Creates new marker
            }
            mapMarker.bindPopup(`Selected: Lat ${lat.toFixed(4)}, Lon ${lng.toFixed(4)}`).openPopup();
            // Closes modal and fetches weather after a short delay
            setTimeout(() => {
                if (elements.mapModal) elements.mapModal.style.display = 'none';
                getWeather({ lat, lon: lng });
            }, 700);
        });
    }

    // Handles request to get current geolocation of the user
    async function handleGetCurrentLocation() {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            resetUI("Geolocation N/A", "Feature not supported.");
            return;
        }
        resetUI("Getting your location...", "Please wait...");
        navigator.geolocation.getCurrentPosition(
            async (position) => { // Success callback
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                const currentPath = window.location.pathname;
                // Redirects to forecast page or fetches weather based on current page
                if (currentPath.endsWith('index.html') || currentPath === '/' || currentPath.endsWith('/index')) {
                    window.location.href = `forecast.html?lat=${lat}&lon=${lon}`;
                } else {
                    await getWeather({ lat, lon });
                }
            },
            (error) => { // Error callback
                console.error("Error getting geolocation:", error);
                let message = "Unable to retrieve your location.";
                if (error.code === error.PERMISSION_DENIED) message = "You denied the request for Geolocation.";
                else if (error.code === error.POSITION_UNAVAILABLE) message = "Location information is unavailable.";
                else if (error.code === error.TIMEOUT) message = "The request to get user location timed out.";
                alert(message);
                resetUI("Location Error", message.substring(0,50));
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } // Geolocation options
        );
    }

    // Sets up common event listeners for UI elements
    function setupCommonEventListeners() {
        elements.form?.addEventListener('submit', e => {
            e.preventDefault();
            const query = elements.locInput?.value.trim();
            if (query) getWeather(query);
            else alert('Please enter a location.');
        });

        elements.selectOnMapBtn?.addEventListener('click', () => {
            if (elements.mapModal) {
                elements.mapModal.style.display = 'block';
                if (!leafletMap) initializeMap(); // Initializes map if not already done
                setTimeout(() => leafletMap?.invalidateSize(), 10); // Ensures map renders correctly
            }
        });

        elements.closeMapModalBtn?.addEventListener('click', () => {
            if (elements.mapModal) elements.mapModal.style.display = 'none';
        });

        // Closes map modal if clicked outside the modal content
        window.addEventListener('click', (event) => {
            if (event.target === elements.mapModal) {
                elements.mapModal.style.display = "none";
            }
        });

        elements.getCurrentLocationBtn?.addEventListener('click', handleGetCurrentLocation);
        elements.getCurrentLocationHeroBtn?.addEventListener('click', handleGetCurrentLocation);
    }

    // Initializes the application
    function init() {
        setupCommonEventListeners();

        const urlParams = new URLSearchParams(window.location.search);
        const urlQueryLocation = urlParams.get('location');
        const urlLat = urlParams.get('lat');
        const urlLon = urlParams.get('lon');

        // Fetches weather if location data is present in URL parameters
        if (urlLat && urlLon) {
            const lat = parseFloat(urlLat);
            const lon = parseFloat(urlLon);
            if (!isNaN(lat) && !isNaN(lon)) {
                getWeather({ lat, lon });
                localStorage.setItem('cozySkiesVisitedBefore', 'true');
                return;
            }
        } else if (urlQueryLocation) {
            getWeather(urlQueryLocation);
            localStorage.setItem('cozySkiesVisitedBefore', 'true');
            return;
        }

        const hasVisitedBefore = localStorage.getItem('cozySkiesVisitedBefore');
        const cachedData = getCachedWeather();

        // On first visit with no cache, attempts IP-based location detection
        if (!hasVisitedBefore && !cachedData) {
            console.log("First visit, no cache. Attempting IP-based auto-detection...");
            fetch('https://ip-api.com/json/') // Fetches location based on IP
                .then(response => {
                    if (!response.ok) throw new Error(`IP-API request failed with status ${response.status}`);
                    return response.json();
                })
                .then(apiResponse => {
                    if (apiResponse.status === 'success' && apiResponse.city) {
                        const query = apiResponse.country ? `${apiResponse.city}, ${apiResponse.country}` : apiResponse.city;
                        getWeather(query);
                    } else {
                        console.warn('IP-API did not return a city or status was not "success":', apiResponse.message || apiResponse);
                        resetUI("Cozy Skies", "Enter a location to begin.");
                    }
                })
                .catch(error => {
                    console.error('Error fetching IP-based location:', error);
                    resetUI("Cozy Skies", "Enter a location to begin.");
                })
                .finally(() => {
                    localStorage.setItem('cozySkiesVisitedBefore', 'true');
                });
        } else if (cachedData) { // Loads weather from cache if available
            console.log("Loading weather from cache.");
            updateCurrent(cachedData.data.current, cachedData.name);
            updateWeekly(cachedData.data.daily);
            updateHourly(cachedData.data.hourly);
            if (elements.locInput) elements.locInput.value = cachedData.name;
            if (elements.heroInput) elements.heroInput.value = cachedData.name;
            if (!hasVisitedBefore) localStorage.setItem('cozySkiesVisitedBefore', 'true');
        } else { // Default state if visited before but no cache
            console.log("Visited before, but no cache. Displaying default state.");
            resetUI("Cozy Skies", "Enter a location to begin.");
        }
    }

    init(); 
});
