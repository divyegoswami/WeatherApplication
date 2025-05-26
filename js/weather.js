// weather.js
document.addEventListener('DOMContentLoaded', () => {
    const apiKey = 'c6e99cc6626de28d89826cee75d11a3c'; 
    const weatherSearchForm = document.querySelector('#weather-search form');
    const locationInput = document.getElementById('location');

    // DOM elements for current weather - ensure these IDs/selectors match your HTML
    const currentLocElement = document.querySelector('#current-weather-preview p:nth-child(1) span');
    const currentTempElement = document.querySelector('#current-weather-preview p:nth-child(2) span');
    const currentCondElement = document.querySelector('#current-weather-preview p:nth-child(3) span');
    const currentWindElement = document.querySelector('#current-weather-preview p:nth-child(4) span');
    const currentIconImgElement = document.getElementById('current-weather-icon-img'); // Using the dedicated img tag

    // DOM element for weekly forecast
    const weeklyForecastTableBody = document.querySelector('#weekly-forecast tbody');

    // DOM element for hourly forecast
    const hourlyForecastSlidesContainer = document.querySelector('#hourly-forecast .slides');
    const hourlySliderWrapper = document.querySelector('#hourly-forecast .slider-wrapper');


    if (weatherSearchForm) {
        weatherSearchForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const locationQuery = locationInput.value.trim();
            if (!locationQuery) {
                alert('Please enter a location.');
                return;
            }
            fetchWeatherData(locationQuery);
        });
    }

    function clearWeatherDataUI() {
        if (currentLocElement) currentLocElement.textContent = 'Loading...';
        if (currentTempElement) currentTempElement.textContent = '';
        if (currentCondElement) currentCondElement.textContent = '';
        if (currentWindElement) currentWindElement.textContent = '';
        if (currentIconImgElement) {
            currentIconImgElement.src = '';
            currentIconImgElement.alt = '';
            currentIconImgElement.style.display = 'none';
        }
        if (weeklyForecastTableBody) weeklyForecastTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Loading...</td></tr>';
        if (hourlyForecastSlidesContainer) hourlyForecastSlidesContainer.innerHTML = '<div class="slide" style="display:flex; justify-content:center; align-items:center; width:100%; text-align:center; min-height: 100px;"><p>Loading...</p></div>';
        
        // Attempt to re-initialize slider with empty/loading state if it's robust enough
        if (typeof window.initializeSlider === 'function' && hourlySliderWrapper) {
            window.initializeSlider(hourlySliderWrapper);
        }
    }

    async function fetchWeatherData(locationQuery) {
        clearWeatherDataUI(); // Show loading state

        try {
            // Geocoding
            const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(locationQuery)}&limit=1&appid=${apiKey}`;
            const geoResponse = await fetch(geoUrl);
            if (!geoResponse.ok) {
                const errorData = await geoResponse.json().catch(() => ({ message: `HTTP ${geoResponse.status}: ${geoResponse.statusText}` }));
                throw new Error(`Geocoding failed: ${errorData.message || `HTTP ${geoResponse.status}`}`);
            }
            const geoData = await geoResponse.json();
            if (!geoData || geoData.length === 0) {
                updateCurrentWeather(null, 'Location not found');
                if (weeklyForecastTableBody) weeklyForecastTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Location not found.</td></tr>';
                if (hourlyForecastSlidesContainer) hourlyForecastSlidesContainer.innerHTML = '<div class="slide" style="display:flex; justify-content:center; align-items:center; width:100%; text-align:center; min-height: 100px;"><p>Location not found.</p></div>';
                if (typeof window.initializeSlider === 'function' && hourlySliderWrapper) window.initializeSlider(hourlySliderWrapper); // Re-init slider for empty state
                alert('Location not found. Please try again.');
                return;
            }

            const { lat, lon, name: cityName, country, state } = geoData[0];
            let displayedLocation = cityName;
            if (state) displayedLocation += `, ${state}`;
            if (country) displayedLocation += `, ${country}`;

            // Fetching weather data using One Call API 3.0
            const weatherUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,alerts&appid=${apiKey}&units=metric`;
            const weatherResponse = await fetch(weatherUrl);
            if (!weatherResponse.ok) {
                const errorData = await weatherResponse.json().catch(() => ({ message: `HTTP ${weatherResponse.status}: ${weatherResponse.statusText}` }));
                throw new Error(`Weather data fetch failed: ${errorData.message || `HTTP ${weatherResponse.status}`}`);
            }
            const weatherData = await weatherResponse.json();

            updateCurrentWeather(weatherData.current, displayedLocation);
            updateWeeklyForecast(weatherData.daily);
            updateHourlyForecast(weatherData.hourly);

        } catch (error) {
            console.error('Error in fetchWeatherData:', error);
            alert(`Failed to fetch weather data. ${error.message}`);
            updateCurrentWeather(null, 'Error loading data');
            if (weeklyForecastTableBody) weeklyForecastTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Error: ${error.message}</td></tr>`;
            if (hourlyForecastSlidesContainer) hourlyForecastSlidesContainer.innerHTML = `<div class="slide" style="display:flex; justify-content:center; align-items:center; width:100%; text-align:center; min-height: 100px;"><p>Error: ${error.message}</p></div>`;
            if (typeof window.initializeSlider === 'function' && hourlySliderWrapper) window.initializeSlider(hourlySliderWrapper); // Re-init slider for error state
        }
    }
    
    function getOpenWeatherMapIconUrl(iconCode, size = "@2x.png") {
        return `https://openweathermap.org/img/wn/${iconCode}${size}`;
    }

    function updateCurrentWeather(currentData, locationName) {
        if (currentLocElement) {
            currentLocElement.textContent = locationName || 'N/A';
        }

        if (currentData && currentData.weather && currentData.weather[0]) {
            if (currentTempElement) currentTempElement.textContent = `${Math.round(currentData.temp)}°C`;
            if (currentCondElement) currentCondElement.textContent = currentData.weather[0].description.replace(/\b\w/g, l => l.toUpperCase());
            if (currentWindElement) currentWindElement.textContent = `${Math.round(currentData.wind_speed * 3.6)} km/h`;

            if (currentIconImgElement && currentData.weather[0].icon) {
                currentIconImgElement.src = getOpenWeatherMapIconUrl(currentData.weather[0].icon);
                currentIconImgElement.alt = currentData.weather[0].description;
                currentIconImgElement.style.display = 'inline';
            } else if (currentIconImgElement) {
                currentIconImgElement.style.display = 'none';
            }
        } else { 
            if (currentTempElement) currentTempElement.textContent = 'N/A';
            if (currentCondElement) currentCondElement.textContent = 'Data unavailable';
            if (currentWindElement) currentWindElement.textContent = 'N/A';
            if (currentIconImgElement) {
                currentIconImgElement.src = '';
                currentIconImgElement.alt = '';
                currentIconImgElement.style.display = 'none';
            }
        }
    }

    function updateWeeklyForecast(dailyData) {
        if (!weeklyForecastTableBody) return;
        weeklyForecastTableBody.innerHTML = ''; 

        if (!dailyData || dailyData.length === 0) {
            weeklyForecastTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Weekly forecast data unavailable.</td></tr>';
            return;
        }

        const daysToShow = 7;
        dailyData.slice(0, daysToShow).forEach(day => {
            if (!day.temp || !day.weather || !day.weather[0]) return; // Skip if data is incomplete
            const date = new Date(day.dt * 1000);
            const dayName = date.toLocaleDateString(navigator.language || 'en-US', { weekday: 'long' });
            const highTemp = Math.round(day.temp.max);
            const lowTemp = Math.round(day.temp.min);
            const iconCode = day.weather[0].icon;
            const iconUrl = getOpenWeatherMapIconUrl(iconCode);
            const conditionDescription = day.weather[0].description;

            const row = weeklyForecastTableBody.insertRow();
            row.innerHTML = `
                <td>${dayName}</td>
                <td><img src="${iconUrl}" alt="${conditionDescription}" style="height: 50px; vertical-align: middle;"></td>
                <td>${highTemp}°C</td>
                <td>${lowTemp}°C</td>
            `;
        });
    }

    function updateHourlyForecast(hourlyData) {
        if (!hourlyForecastSlidesContainer) return;
        hourlyForecastSlidesContainer.innerHTML = ''; // Clear previous slides

        if (!hourlyData || hourlyData.length === 0) {
            hourlyForecastSlidesContainer.innerHTML = '<div class="slide" style="display:flex; justify-content:center; align-items:center; width:100%; text-align:center; min-height: 100px;"><p>Hourly forecast data unavailable.</p></div>';
        } else {
            const hoursToShow = 24;
            hourlyData.slice(0, hoursToShow).forEach(hour => {
                if (!hour.temp || !hour.feels_like || !hour.weather || !hour.weather[0]) return; // Skip if data incomplete
                const date = new Date(hour.dt * 1000);
                const timeString = date.toLocaleTimeString(navigator.language || 'en-US', { hour: 'numeric', hour12: true }).replace(/\s/g, '').toUpperCase();
                const temp = Math.round(hour.temp);
                const feelsLikeTemp = Math.round(hour.feels_like);
                const iconCode = hour.weather[0].icon;
                const iconUrl = getOpenWeatherMapIconUrl(iconCode, "@2x.png"); 
                const conditionDescription = hour.weather[0].description;

                const slide = document.createElement('div');
                slide.classList.add('slide');
                slide.style.cssText = `
                    display: flex; 
                    flex-direction: column; 
                    align-items: center; 
                    justify-content: space-around; /* Better distribution */
                    text-align: center; 
                    padding: 10px 5px; /* Add some padding */
                    box-sizing: border-box; /* Include padding in width/height */
                    min-height: 150px; /* Ensure slides have some height */
                `;
                slide.innerHTML = `
                    <time style="font-weight: bold; font-size: 0.9em; margin-bottom: 5px;">${timeString}</time>
                    <img src="${iconUrl}" alt="${conditionDescription}" style="width: 50px; height: 50px; margin-bottom: 5px;" />
                    <div class="temps" style="font-size: 0.9em;">
                      <span class="temp-high">${temp}°C</span><br>
                      <span class="temp-low" style="opacity: 0.8;">Feels: ${feelsLikeTemp}°C</span>
                    </div>
                `;
                hourlyForecastSlidesContainer.appendChild(slide);
            });
        }

        // Re-initialize the slider for the hourly forecast section
        if (typeof window.initializeSlider === 'function' && hourlySliderWrapper) {
            // console.log("Re-initializing hourly forecast slider with new slides.");
            window.initializeSlider(hourlySliderWrapper);
        } else {
            if (!hourlySliderWrapper) console.warn("#hourly-forecast .slider-wrapper not found for re-initialization.");
            if (typeof window.initializeSlider !== 'function') console.warn('window.initializeSlider function not found.');
        }
    }

    // Initial load logic
    if (navigator.geolocation) {
        clearWeatherDataUI(); // Show loading state initially
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                const initialWeatherUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&exclude=minutely,alerts&appid=${apiKey}&units=metric`;
                fetch(initialWeatherUrl)
                    .then(response => {
                        if (!response.ok) {
                            return response.json().then(errData => { // Try to parse error from API
                                throw new Error(`Weather fetch for current location failed (${response.status}): ${errData.message || response.statusText}`);
                            }).catch(() => { // Fallback if error parsing fails
                                throw new Error(`Weather fetch for current location failed (${response.status}): ${response.statusText}`);
                            });
                        }
                        return response.json();
                    })
                    .then(weatherData => {
                        const geoApiForName = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${apiKey}`;
                        fetch(geoApiForName) // Fetch location name separately
                            .then(res => res.json())
                            .then(nameData => {
                                const locName = (nameData && nameData[0]) ? `${nameData[0].name}${nameData[0].state ? ', ' + nameData[0].state : ''}, ${nameData[0].country || ''}`.trim().replace(/,$/, '') : "Your Location";
                                updateCurrentWeather(weatherData.current, locName);
                                updateWeeklyForecast(weatherData.daily);
                                updateHourlyForecast(weatherData.hourly);
                            })
                            .catch(nameError => { // Handle error fetching name, but still show weather
                                console.error("Error fetching location name:", nameError);
                                updateCurrentWeather(weatherData.current, "Your Current Location");
                                updateWeeklyForecast(weatherData.daily);
                                updateHourlyForecast(weatherData.hourly);
                            });
                    })
                    .catch(error => {
                        console.error("Error fetching weather for current location:", error);
                        alert(`Could not fetch weather for your location. ${error.message}. Defaulting to a sample.`);
                        fetchWeatherData('London, GB'); // Fallback
                    });
            },
            error => {
                console.warn("Geolocation denied/unavailable. Error: " + error.message);
                alert('Geolocation is unavailable. Please use the search. Defaulting to a sample location.');
                fetchWeatherData('New York, US'); // Fallback
            }
        );
    } else {
        console.warn("Geolocation is not supported. Loading default location.");
        alert('Geolocation is not supported. Please use the search. Defaulting to a sample location.');
        fetchWeatherData('Paris, FR'); // Fallback
    }
});