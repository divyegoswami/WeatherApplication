document.addEventListener('DOMContentLoaded', () => {
    // API key and caching configuration
    const API_KEY = 'c6e99cc6626de28d89826cee75d11a3c';
    const CACHE_KEY = 'cachedWeather';
    const CACHE_DURATION = 1800000; // 30 minutes in milliseconds

    // Helper function to simplify DOM element selection
    const $ = selector => document.querySelector(selector);

    // References to key DOM elements used throughout the app
    const elements = {
        loc: $('#current-weather-preview p:nth-of-type(1) span'),
        temp: $('#current-weather-preview p:nth-of-type(2) span'),
        cond: $('#current-weather-preview p:nth-of-type(3) span'),
        wind: $('#current-weather-preview p:nth-of-type(4) span'),
        aqi: $('#current-weather-preview .aqi-value'),
        icon: $('#current-weather-icon-img'),
        form: $('#weather-search form'),
        locInput: $('#location'),
        heroInput: $('#search-hero'),
        weekly: $('#weekly-forecast tbody'),
        hourly: $('#hourly-forecast .slides'),
        slider: $('#hourly-forecast .slider-wrapper'),
        selectOnMapBtn: $('#select-on-map-btn'),
        mapModal: $('#map-modal'),
        mapContainer: $('#leaflet-map-container'),
        closeMapModalBtn: $('#close-map-modal-btn'),
    };

    let leafletMap = null;
    let mapMarker = null;

    // Constructs the full URL for a weather icon based on icon code
    const iconUrl = (code, size = "@2x.png") => `https://openweathermap.org/img/wn/${code}${size}`;

    // Stores weather data in local storage with timestamp
    function cacheWeather(name, data) {
        const record = { name, data, time: Date.now() };
        localStorage.setItem(CACHE_KEY, JSON.stringify(record));
    }

    // Retrieves weather data from local storage if it's still valid
    function getCachedWeather() {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        try {
            const { name, data, time } = JSON.parse(raw);
            if (Date.now() - time > CACHE_DURATION) throw 'Expired';
            return { name, data };
        } catch {
            localStorage.removeItem(CACHE_KEY);
            return null;
        }
    }

    // Maps AQI index values to descriptive text and CSS class names
    function getAqiDetails(aqiValue) {
        if (aqiValue == null) return { description: 'N/A', className: 'aqi-na' };
        return [
            null,
            { description: 'Good', className: 'aqi-good' },
            { description: 'Fair', className: 'aqi-fair' },
            { description: 'Moderate', className: 'aqi-moderate' },
            { description: 'Poor', className: 'aqi-poor' },
            { description: 'Very Poor', className: 'aqi-very-poor' },
        ][aqiValue] || { description: 'Unknown', className: 'aqi-unknown' };
    }

    // Resets the UI elements to show a loading or default state
    function resetUI(locText = "Loading...", forecastText = "Loading...") {
        ['temp', 'cond', 'wind'].forEach(k => elements[k] && (elements[k].textContent = 'N/A'));
        if (elements.aqi) {
            elements.aqi.textContent = 'N/A';
            elements.aqi.className = 'aqi-value aqi-na';
        }
        if (elements.loc) elements.loc.textContent = locText;
        if (elements.icon) Object.assign(elements.icon, { src: '', alt: '', style: 'display:none' });

        if (elements.weekly) {
            elements.weekly.innerHTML = `<tr><td colspan="4" style="text-align:center;">${forecastText}</td></tr>`;
        }

        if (elements.hourly) {
            elements.hourly.innerHTML = `<div class="slide" style="text-align:center;width:100%;"><p>${forecastText}</p></div>`;
            window.initializeSlider?.(elements.slider);
        }
    }

    // Updates the current weather section with provided data
    function updateCurrent(data, name) {
        if (!data || !data.weather) return;

        if (elements.loc) elements.loc.textContent = name || 'N/A';
        if (elements.temp) elements.temp.textContent = `${Math.round(data.temp)}°C`;
        if (elements.cond) elements.cond.textContent = data.weather[0].description.replace(/\b\w/g, l => l.toUpperCase());
        if (elements.wind) elements.wind.textContent = `${Math.round(data.wind_speed * 3.6)} km/h`;

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

    // Populates the weekly forecast section with data
    function updateWeekly(forecast) {
        if (!elements.weekly || !forecast?.length) return;
        elements.weekly.innerHTML = '';
        forecast.slice(0, 7).forEach(day => {
            const d = new Date(day.dt * 1000);
            const weekday = d.toLocaleDateString(undefined, { weekday: 'short' });
            const desc = day.weather[0].description.replace(/\b\w/g, l => l.toUpperCase());
            elements.weekly.insertRow().innerHTML = `
                <td>${weekday}</td>
                <td><img src="${iconUrl(day.weather[0].icon)}" alt="${desc}" style="height:25px;"> ${desc}</td>
                <td>${Math.round(day.temp.max)}°C</td>
                <td>${Math.round(day.temp.min)}°C</td>
            `;
        });
    }

    // Populates the hourly forecast slider with weather data
    function updateHourly(forecast) {
        if (!elements.hourly || !forecast?.length) return;
        elements.hourly.innerHTML = '';
        forecast.slice(0, 24).forEach(hour => {
            const d = new Date(hour.dt * 1000);
            const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
            const slide = document.createElement('div');
            slide.className = 'slide';
            slide.style = 'display:flex; flex-direction:column; align-items:center; padding:10px 5px; min-height:150px; min-width:100px; text-align:center;';
            slide.innerHTML = `
                <time style="font-weight:bold;">${time}</time>
                <img src="${iconUrl(hour.weather[0].icon)}" alt="${hour.weather[0].description}" style="width:50px;height:50px;" />
                <div><strong>${Math.round(hour.temp)}°C</strong><br><small>Feels: ${Math.round(hour.feels_like)}°C</small></div>
            `;
            elements.hourly.appendChild(slide);
        });
        window.initializeSlider?.(elements.slider);
    }

    // Orchestrates the full update of weather data in the UI
    function showWeather(data, name) {
        updateCurrent(data.current, name);
        updateWeekly(data.daily);
        updateHourly(data.hourly);
    }

    // Fetches weather data using a location string or coordinates
    async function getWeather(queryOrCoords) {
        resetUI("Getting weather...", "Please wait...");
        let lat, lon, locName;

        try {
            if (typeof queryOrCoords === 'string') {
                const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(queryOrCoords)}&limit=1&appid=${API_KEY}`);
                if (!geoRes.ok) throw new Error(`Geo API error: ${geoRes.statusText} (Code: ${geoRes.status})`);
                const geo = await geoRes.json();
                if (!geo.length) throw new Error(`No location data found for "${queryOrCoords}"`);
                ({ lat, lon } = geo[0]);
                locName = `${geo[0].name}${geo[0].state ? ', ' + geo[0].state : ''}, ${geo[0].country}`.trim();
                if (elements.locInput) elements.locInput.value = locName;
            } else if (queryOrCoords?.lat && queryOrCoords?.lon) {
                ({ lat, lon } = queryOrCoords);
                const reverseGeoRes = await fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`);
                const reverseGeo = reverseGeoRes.ok ? await reverseGeoRes.json() : [];
                locName = reverseGeo.length > 0
                    ? `${reverseGeo[0].name}${reverseGeo[0].state ? ', ' + reverseGeo[0].state : ''}, ${reverseGeo[0].country}`.trim()
                    : `Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)}`;
                if (elements.locInput) elements.locInput.value = locName;
            } else {
                throw new Error("Invalid query or coordinates provided.");
            }

            const weatherRes = await fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,alerts&appid=${API_KEY}&units=metric`);
            if (!weatherRes.ok) throw new Error(`Weather API error: ${weatherRes.statusText} (Code: ${weatherRes.status})`);
            const weather = await weatherRes.json();

            const aqiRes = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
            const aqiData = aqiRes.ok ? await aqiRes.json() : null;
            weather.current.aqi = aqiData?.list?.[0]?.main?.aqi || null;

            showWeather(weather, locName);
            cacheWeather(locName, weather);
            if (elements.heroInput) elements.heroInput.value = locName;
        } catch (err) {
            console.error("Fetch error details:", err);
            alert(`Failed to fetch weather. ${err.message}. Please check the console for more details and try again.`);
            resetUI("Error", "Unable to load forecast.");
            if (elements.cond) elements.cond.textContent = (err.message || 'Unknown error').substring(0, 100);
        }
    }

    // Initializes and configures the interactive map
    function initializeMap() {
        if (!elements.mapContainer || leafletMap) return;
        if (typeof L === 'undefined') {
            console.error("Leaflet library is not loaded!");
            alert("Map library could not be loaded.");
            elements.mapModal.style.display = 'none';
            return;
        }

        leafletMap = L.map(elements.mapContainer).setView([51.505, -0.09], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(leafletMap);

        leafletMap.on('click', function(e) {
            const { lat, lng } = e.latlng;
            if (mapMarker) {
                mapMarker.setLatLng(e.latlng);
            } else {
                mapMarker = L.marker(e.latlng).addTo(leafletMap);
            }
            mapMarker.bindPopup(`Selected: Lat ${lat.toFixed(4)}, Lon ${lng.toFixed(4)}`).openPopup();
            setTimeout(() => {
                elements.mapModal.style.display = 'none';
                getWeather({ lat, lon: lng });
            }, 700);
        });
    }

    // Main initialization function to configure UI, events, and optionally load data
    function init() {
        if (!elements.aqi && document.getElementById('current-weather-preview')) {
            elements.aqi = $('#current-weather-preview .aqi-value');
        }

        const urlQuery = new URLSearchParams(window.location.search).get('location');
        if (urlQuery) {
            getWeather(urlQuery);
            return;
        }

        const cache = getCachedWeather();
        if (cache) {
            showWeather(cache.data, cache.name);
            [elements.locInput, elements.heroInput].forEach(el => el && (el.value = cache.name));
        } else {
            resetUI("Cozy Skies", "Enter a location to begin.");
        }

        elements.selectOnMapBtn?.addEventListener('click', () => {
            if (elements.mapModal) {
                elements.mapModal.style.display = 'block';
                if (!leafletMap) initializeMap();
                setTimeout(() => leafletMap?.invalidateSize(), 0);
            }
        });

        elements.closeMapModalBtn?.addEventListener('click', () => {
            if (elements.mapModal) elements.mapModal.style.display = 'none';
        });

        window.addEventListener('click', (event) => {
            if (event.target === elements.mapModal) {
                elements.mapModal.style.display = "none";
            }
        });
    }

    // Form submission handler to trigger weather search
    elements.form?.addEventListener('submit', e => {
        e.preventDefault();
        const q = elements.locInput?.value.trim();
        if (q) getWeather(q);
        else alert('Enter a location.');
    });

    init();
});
