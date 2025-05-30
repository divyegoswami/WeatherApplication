document.addEventListener('DOMContentLoaded', () => {
    const API_KEY = 'c6e99cc6626de28d89826cee75d11a3c';
    const CACHE_KEY = 'cachedWeather';
    const CACHE_DURATION = 1800000;

    const $ = selector => document.querySelector(selector);

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
        getCurrentLocationBtn: $('#get-current-location-btn'),
        getCurrentLocationHeroBtn: $('#get-current-location-hero-btn')
    };

    let leafletMap = null;
    let mapMarker = null;

    const iconUrl = (code, size = "@2x.png") => `https://openweathermap.org/img/wn/${code}${size}`;

    function cacheWeather(name, data) {
        const record = { name, data, time: Date.now() };
        localStorage.setItem(CACHE_KEY, JSON.stringify(record));
    }

    function getCachedWeather() {
        const rawCachedData = localStorage.getItem(CACHE_KEY);
        if (!rawCachedData) return null;
        try {
            const { name, data, time } = JSON.parse(rawCachedData);
            if (Date.now() - time > CACHE_DURATION) {
                localStorage.removeItem(CACHE_KEY);
                return null;
            }
            return { name, data };
        } catch (error) {
            console.error("Error parsing cached weather data:", error);
            localStorage.removeItem(CACHE_KEY);
            return null;
        }
    }

    function getAqiDetails(aqiValue) {
        if (aqiValue == null) return { description: 'N/A', className: 'aqi-na' };
        const aqiMap = [
            null,
            { description: 'Good', className: 'aqi-good' },
            { description: 'Fair', className: 'aqi-fair' },
            { description: 'Moderate', className: 'aqi-moderate' },
            { description: 'Poor', className: 'aqi-poor' },
            { description: 'Very Poor', className: 'aqi-very-poor' },
        ];
        return aqiMap[aqiValue] || { description: 'Unknown', className: 'aqi-unknown' };
    }

    function resetUI(locText = "Loading...", forecastText = "Loading...") {
        ['temp', 'cond', 'wind'].forEach(key => {
            if (elements[key]) elements[key].textContent = 'N/A';
        });
        if (elements.aqi) {
            elements.aqi.textContent = 'N/A';
            elements.aqi.className = 'aqi-value aqi-na';
        }
        if (elements.loc) elements.loc.textContent = locText;
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
            window.initializeSlider?.(elements.slider);
        }
    }

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

    function updateWeekly(forecast) {
        if (!elements.weekly || !forecast?.length) return;
        elements.weekly.innerHTML = '';
        forecast.slice(0, 7).forEach(day => {
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

    function updateHourly(forecast) {
        if (!elements.hourly || !forecast?.length) return;
        elements.hourly.innerHTML = '';
        forecast.slice(0, 24).forEach(hour => {
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
        window.initializeSlider?.(elements.slider);
    }

    function showWeather(data, name) {
        updateCurrent(data.current, name);
        updateWeekly(data.daily);
        updateHourly(data.hourly);
    }

    async function getWeather(queryOrCoords) {
        resetUI("Getting weather...", "Please wait...");
        let lat, lon, locName;
        try {
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

            const weatherResponse = await fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,alerts&appid=${API_KEY}&units=metric`);
            if (!weatherResponse.ok) throw new Error(`Weather API error: ${weatherResponse.statusText} (Code: ${weatherResponse.status})`);
            const weatherData = await weatherResponse.json();

            const aqiResponse = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
            const aqiApiData = aqiResponse.ok ? await aqiResponse.json() : null;
            weatherData.current.aqi = aqiApiData?.list?.[0]?.main?.aqi || null;

            showWeather(weatherData, locName);
            cacheWeather(locName, weatherData);
            if (elements.heroInput) elements.heroInput.value = locName;
        } catch (err) {
            console.error("Error fetching weather data:", err);
            alert(`Failed to fetch weather. ${err.message}. Please check console and try again.`);
            resetUI("Error", "Unable to load forecast.");
            if (elements.cond) elements.cond.textContent = (err.message || 'Unknown error').substring(0, 100);
        }
    }

    function initializeMap() {
        if (!elements.mapContainer || leafletMap) return;
        if (typeof L === 'undefined') {
            console.error("Leaflet library (L) is not loaded!");
            alert("Map library could not be loaded. Please ensure you are online and try again.");
            if (elements.mapModal) elements.mapModal.style.display = 'none';
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
                if (elements.mapModal) elements.mapModal.style.display = 'none';
                getWeather({ lat, lon: lng });
            }, 700);
        });
    }

    async function handleGetCurrentLocation() {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            resetUI("Geolocation N/A", "Feature not supported.");
            return;
        }
        resetUI("Getting your location...", "Please wait...");
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                const currentPath = window.location.pathname;
                if (currentPath.endsWith('index.html') || currentPath === '/' || currentPath.endsWith('/index')) {
                    window.location.href = `forecast.html?lat=${lat}&lon=${lon}`;
                } else {
                    await getWeather({ lat, lon });
                }
            },
            (error) => {
                console.error("Error getting geolocation:", error);
                let message = "Unable to retrieve your location.";
                if (error.code === error.PERMISSION_DENIED) {
                    message = "You denied the request for Geolocation.";
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    message = "Location information is unavailable.";
                } else if (error.code === error.TIMEOUT) {
                    message = "The request to get user location timed out.";
                }
                alert(message);
                resetUI("Location Error", message.substring(0,50));
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    }

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
                if (!leafletMap) initializeMap();
                setTimeout(() => leafletMap?.invalidateSize(), 10);
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
        elements.getCurrentLocationBtn?.addEventListener('click', handleGetCurrentLocation);
        elements.getCurrentLocationHeroBtn?.addEventListener('click', handleGetCurrentLocation);
    }

    function init() {
        if (!elements.aqi && document.getElementById('current-weather-preview')) {
            elements.aqi = $('#current-weather-preview .aqi-value');
        }
        setupCommonEventListeners();

        const urlParams = new URLSearchParams(window.location.search);
        const urlQueryLocation = urlParams.get('location');
        const urlLat = urlParams.get('lat');
        const urlLon = urlParams.get('lon');

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

        if (!hasVisitedBefore && !cachedData) {
            console.log("First visit, no cache. Attempting IP-based auto-detection...");
            fetch('https://ip-api.com/json/')
                .then(response => {
                    if (!response.ok) throw new Error(`IP-API request failed with status ${response.status}`);
                    return response.json();
                })
                .then(apiResponse => {
                    if (apiResponse.status === 'success' && apiResponse.city) {
                        const query = apiResponse.country ? `${apiResponse.city}, ${apiResponse.country}` : apiResponse.city;
                        console.log('Auto-detected location for getWeather:', query);
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
        } else if (cachedData) {
            console.log("Loading weather from cache.");
            showWeather(cachedData.data, cachedData.name);
            if (elements.locInput) elements.locInput.value = cachedData.name;
            if (elements.heroInput) elements.heroInput.value = cachedData.name;
            if (!hasVisitedBefore) localStorage.setItem('cozySkiesVisitedBefore', 'true');
        } else {
            console.log("Visited before, but no cache. Displaying default state.");
            resetUI("Cozy Skies", "Enter a location to begin.");
        }
    }
    init();
});