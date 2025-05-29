// weather.js - Weather data management and UI updates

document.addEventListener('DOMContentLoaded', () => {
    const API_KEY = 'c6e99cc6626de28d89826cee75d11a3c'; // Your OpenWeatherMap API Key
    const CACHE_KEY = 'cachedWeather';
    const CACHE_DURATION = 1800000; // 30 minutes in milliseconds

    // DOM element references
    const $ = selector => document.querySelector(selector);
    const elements = {
        loc: $('#current-weather-preview p:nth-of-type(1) span'),
        temp: $('#current-weather-preview p:nth-of-type(2) span'),
        cond: $('#current-weather-preview p:nth-of-type(3) span'),
        wind: $('#current-weather-preview p:nth-of-type(4) span'),
        aqi: $('#current-weather-preview .aqi-value'), // Selector for AQI span
        icon: $('#current-weather-icon-img'),
        form: $('#weather-search form'),
        locInput: $('#location'),
        heroInput: $('#search-hero'),
        weekly: $('#weekly-forecast tbody'),
        hourly: $('#hourly-forecast .slides'),
        slider: $('#hourly-forecast .slider-wrapper'),
    };

    // Generate weather icon URL
    const iconUrl = (code, size = "@2x.png") => `https://openweathermap.org/img/wn/${code}${size}`;

    // Store weather data in localStorage
    function cacheWeather(name, data) {
        const record = { name, data, time: Date.now() };
        localStorage.setItem(CACHE_KEY, JSON.stringify(record));
    }

    // Retrieve cached data if it hasn't expired
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

    // Helper to get AQI description AND corresponding class
    const getAqiDetails = (aqiValue) => {
        if (aqiValue === null || typeof aqiValue === 'undefined') {
            return { description: 'N/A', className: 'aqi-na' };
        }
        switch (aqiValue) {
            case 1: return { description: 'Good', className: 'aqi-good' };
            case 2: return { description: 'Fair', className: 'aqi-fair' };
            case 3: return { description: 'Moderate', className: 'aqi-moderate' };
            case 4: return { description: 'Poor', className: 'aqi-poor' };
            case 5: return { description: 'Very Poor', className: 'aqi-very-poor' };
            default: return { description: 'Unknown', className: 'aqi-unknown' };
        }
    };

    // Reset all weather display elements to a loading or default state
    function resetUI(locText = "Loading...", forecastText = "Loading...") {
        ['temp', 'cond', 'wind'].forEach(k => elements[k] && (elements[k].textContent = 'N/A'));
        
        if (elements.aqi) {
            elements.aqi.textContent = 'N/A';
            elements.aqi.className = 'aqi-value aqi-na'; // Reset to base and N/A class
        }
        
        elements.loc && (elements.loc.textContent = locText);
        if (elements.icon) Object.assign(elements.icon, { src: '', alt: '', style: 'display:none' });
        if (elements.weekly) {
            elements.weekly.innerHTML = `<tr><td colspan="4" style="text-align:center;">${forecastText}</td></tr>`;
        }
        if (elements.hourly) {
            elements.hourly.innerHTML = `<div class="slide" style="text-align:center;width:100%;"><p>${forecastText}</p></div>`;
            window.initializeSlider?.(elements.slider);
        }
    }

    // Populate the UI with current weather data
    function updateCurrent(data, name) {
        if (!data || !data.weather) return;
        elements.loc && (elements.loc.textContent = name || 'N/A');
        elements.temp && (elements.temp.textContent = `${Math.round(data.temp)}°C`);
        elements.cond && (elements.cond.textContent = data.weather[0].description.replace(/\b\w/g, l => l.toUpperCase()));
        elements.wind && (elements.wind.textContent = `${Math.round(data.wind_speed * 3.6)} km/h`);
        
        // Update AQI display
        if (elements.aqi) {
            const aqiDetails = getAqiDetails(data.aqi);
            elements.aqi.textContent = aqiDetails.description;
            // Remove any existing AQI classes before adding the new one
            elements.aqi.className = 'aqi-value'; // Reset to base class
            elements.aqi.classList.add(aqiDetails.className);
        }

        if (elements.icon) {
            elements.icon.src = iconUrl(data.weather[0].icon, ".png");
            elements.icon.alt = data.weather[0].description;
            elements.icon.style.display = 'inline';
        }
    }

    // Populate the weekly forecast table
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

    // Render the hourly forecast slider
    function updateHourly(forecast) {
        if (!elements.hourly || !forecast?.length) return;
        elements.hourly.innerHTML = '';
        forecast.slice(0, 24).forEach(hour => {
            const d = new Date(hour.dt * 1000);
            const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
            const slide = document.createElement('div');
            slide.className = 'slide';
            slide.style = `display:flex; flex-direction:column; align-items:center; padding:10px 5px; min-height:150px; min-width:100px; text-align:center;`;
            slide.innerHTML = `
                <time style="font-weight:bold;">${time}</time>
                <img src="${iconUrl(hour.weather[0].icon)}" alt="${hour.weather[0].description}" style="width:50px;height:50px;" />
                <div><strong>${Math.round(hour.temp)}°C</strong><br><small>Feels: ${Math.round(hour.feels_like)}°C</small></div>
            `;
            elements.hourly.appendChild(slide);
        });
        window.initializeSlider?.(elements.slider);
    }

    // Dispatch updates to all sections
    function showWeather(data, name) {
        updateCurrent(data.current, name); // data.current should now include .aqi
        updateWeekly(data.daily);
        updateHourly(data.hourly);
    }

    // Fetch weather data based on user query
    async function getWeather(query) {
        resetUI("Getting weather...", "Please wait...");
        try {
            // 1. Get Geolocation
            const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=1&appid=${API_KEY}`);
            if (!geoRes.ok) throw new Error(`Geo API error: ${geoRes.statusText} (Code: ${geoRes.status})`);
            const geo = await geoRes.json();
            if (!geo.length) throw new Error(`No location data found for "${query}"`);
            
            const { lat, lon, name, state, country } = geo[0];
            const locName = `${name}${state ? ', ' + state : ''}, ${country}`.trim();

            // 2. Get Main Weather Data (One Call API)
            const weatherRes = await fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,alerts&appid=${API_KEY}&units=metric`);
            if (!weatherRes.ok) throw new Error(`Weather API error: ${weatherRes.statusText} (Code: ${weatherRes.status})`);
            const weather = await weatherRes.json();

            // 3. Get Air Pollution Data
            const aqiRes = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
            if (!aqiRes.ok) {
                console.warn(`AQI API error: ${aqiRes.statusText} (Code: ${aqiRes.status}). Proceeding without AQI.`);
                weather.current.aqi = null; // Set default if AQI fetch fails
            } else {
                const aqiData = await aqiRes.json();
                if (aqiData && aqiData.list && aqiData.list.length > 0) {
                    weather.current.aqi = aqiData.list[0].main.aqi;
                } else {
                    console.warn('AQI data received but list is empty or malformed.');
                    weather.current.aqi = null; // No AQI data in response's list
                }
            }
            
            showWeather(weather, locName);
            cacheWeather(locName, weather); // This will now include AQI in weather.current
            [elements.locInput, elements.heroInput].forEach(el => el && (el.value = locName));
        } catch (err) {
            console.error("Fetch error details:", err); // Log the full error object
            alert(`Failed to fetch weather. ${err.message}. Please check the console for more details and try again.`);
            resetUI("Error", "Unable to load forecast.");
            elements.cond && (elements.cond.textContent = (err.message || 'Unknown error').substring(0, 100)); // Increased length for more details
        }
    }

    // Initialize application on page load
    function init() {
        // Ensure elements.aqi is available if current-weather-preview is on the page
        // This is a bit of a safeguard if this script runs on pages without the AQI element
        if (!elements.aqi && document.getElementById('current-weather-preview')) {
            elements.aqi = $('#current-weather-preview .aqi-value');
        }

        const urlQuery = new URLSearchParams(window.location.search).get('location');
        if (urlQuery) {
            getWeather(urlQuery);
            return; // getWeather will handle UI updates
        }

        const cache = getCachedWeather();
        if (cache) {
            showWeather(cache.data, cache.name);
            [elements.locInput, elements.heroInput].forEach(el => el && (el.value = cache.name));
        } else {
            resetUI("Cozy Skies", "Enter a location to begin.");
        }
    }

    // Attach event listener to the search form
    elements.form?.addEventListener('submit', e => {
        e.preventDefault();
        const q = elements.locInput?.value.trim();
        if (q) getWeather(q);
        else alert('Enter a location.');
    });

    // Trigger initial logic
    init();
});