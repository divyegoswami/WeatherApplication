document.addEventListener('DOMContentLoaded', () => {
    const apiKey = 'd0a944f3be20203867f8876f74122885'; 
    const weatherSearchForm = document.querySelector('#weather-search form');
    const locationInput = document.getElementById('location');

    // DOM elements for current weather
    const currentLocElement = document.querySelector('#current-weather-preview p:nth-child(1) span');
    const currentTempElement = document.querySelector('#current-weather-preview p:nth-child(2) span');
    const currentCondElement = document.querySelector('#current-weather-preview p:nth-child(3) span');
    const currentWindElement = document.querySelector('#current-weather-preview p:nth-child(4) span');
    const currentIconElement = document.createElement('img'); // Create an img element for the icon
    currentIconElement.style.height = '50px'; // Optional: style it
    currentIconElement.style.verticalAlign = 'middle';
    // Try to insert icon next to conditions, or adjust as per your layout preference
    if (currentCondElement && currentCondElement.parentNode) {
        currentCondElement.parentNode.insertBefore(currentIconElement, currentCondElement.nextSibling);
        // Add a space for better visual separation
        const space = document.createTextNode(' ');
        currentCondElement.parentNode.insertBefore(space, currentIconElement);
    }


    // DOM element for weekly forecast
    const weeklyForecastTableBody = document.querySelector('#weekly-forecast tbody');

    // DOM element for hourly forecast
    const hourlyForecastSlidesContainer = document.querySelector('#hourly-forecast .slides');

    weatherSearchForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const locationQuery = locationInput.value.trim();
        if (!locationQuery) {
            alert('Please enter a location.');
            return;
        }
        fetchWeatherData(locationQuery);
    });

    async function fetchWeatherData(locationQuery) {
        try {
            const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(locationQuery)}&limit=1&appid=${apiKey}`;
            const geoResponse = await fetch(geoUrl);
            if (!geoResponse.ok) {
                const errorData = await geoResponse.json().catch(() => ({ message: geoResponse.statusText }));
                throw new Error(`Geocoding failed: ${errorData.message || geoResponse.statusText}`);
            }
            const geoData = await geoResponse.json();
            if (!geoData || geoData.length === 0) {
                alert('Location not found. Please try again (e.g., "City, Country Code" or "City, State, Country Code").');
                return;
            }

            const { lat, lon, name: cityName, country, state } = geoData[0];
            let displayedLocation = cityName;
            if (state) displayedLocation += `, ${state}`;
            if (country) displayedLocation += `, ${country}`;

            // Use OpenWeatherMap One Call API 3.0
            // IMPORTANT: Ensure your API key is subscribed to the One Call API 3.0 plan.
            const weatherUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,alerts&appid=${apiKey}&units=metric`;

            const weatherResponse = await fetch(weatherUrl);
            if (!weatherResponse.ok) {
                const errorData = await weatherResponse.json().catch(() => ({ message: weatherResponse.statusText }));
                throw new Error(`Weather data fetch failed: ${errorData.message || weatherResponse.statusText}`);
            }
            const weatherData = await weatherResponse.json();

            updateCurrentWeather(weatherData.current, displayedLocation);
            updateWeeklyForecast(weatherData.daily);
            updateHourlyForecast(weatherData.hourly);

        } catch (error) {
            console.error('Error fetching weather data:', error);
            alert(`Failed to fetch weather data. Check console for details. Message: ${error.message}`);
        }
    }

    function getOpenWeatherMapIconUrl(iconCode, size = "@2x.png") {
        // Example: 01d -> https://openweathermap.org/img/wn/01d@2x.png
        return `https://openweathermap.org/img/wn/${iconCode}${size}`;
    }

    function updateCurrentWeather(currentData, locationName) {
        if (currentLocElement) currentLocElement.textContent = locationName;
        if (currentTempElement) currentTempElement.textContent = `${Math.round(currentData.temp)}°C`;
        if (currentCondElement) currentCondElement.textContent = currentData.weather[0].description.replace(/\b\w/g, l => l.toUpperCase());
        if (currentWindElement) currentWindElement.textContent = `${Math.round(currentData.wind_speed * 3.6)} km/h`; // m/s to km/h

        // Update current weather icon
        if (currentIconElement && currentData.weather[0].icon) {
            currentIconElement.src = getOpenWeatherMapIconUrl(currentData.weather[0].icon);
            currentIconElement.alt = currentData.weather[0].description;
        }
    }

    function updateWeeklyForecast(dailyData) {
        if (!weeklyForecastTableBody) return;
        weeklyForecastTableBody.innerHTML = ''; // Clear existing forecast

        const daysToShow = 7;
        dailyData.slice(0, daysToShow).forEach(day => {
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
        hourlyForecastSlidesContainer.innerHTML = ''; // Clear existing slides

        const hoursToShow = 24;
        hourlyData.slice(0, hoursToShow).forEach(hour => {
            const date = new Date(hour.dt * 1000);
            const timeString = date.toLocaleTimeString(navigator.language || 'en-US', { hour: 'numeric', hour12: true }).replace(' ', '').toUpperCase();
            const temp = Math.round(hour.temp);
            // OpenWeatherMap provides feels_like, not necessarily a low for the hour.
            // If you want high/low for the hour, this API structure doesn't provide it directly per hour.
            // Using `temp` for both, or `temp` for high and `feels_like` for "low" as in your original structure.
            const feelsLikeTemp = Math.round(hour.feels_like);
            const iconCode = hour.weather[0].icon;
            const iconUrl = getOpenWeatherMapIconUrl(iconCode, "@2x.png"); // Can use smaller icon if needed e.g. "" or "@1x.png" (but OWM usually serves 50x50 for no suffix)
            const conditionDescription = hour.weather[0].description;

            const slide = document.createElement('div');
            slide.classList.add('slide');
            slide.innerHTML = `
                <time>${timeString}</time>
                <img src="${iconUrl}" alt="${conditionDescription}" style="width: 50px; height: 50px;" /> <!-- Adjust style as needed -->
                <div class="temps">
                  <span class="temp-high">${temp}°C</span>
                  <span class="temp-low">${feelsLikeTemp}°C</span> <!-- Using feels_like as the "low" temp -->
                </div>
            `;
            hourlyForecastSlidesContainer.appendChild(slide);
        });

        // Re-initialize or update your slider if necessary
        // Example: if (typeof window.reinitializeSlider === 'function') { window.reinitializeSlider(); }
        // Check your js/slider.js for how to do this.
    }

    // Optional: Load default weather on page load or use geolocation
    // To make the page useful on first load without a search.
    // fetchWeatherData('Hamilton, Ontario'); // Default location

    // Geolocation option (more user-friendly initial load)
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            // For One Call API 3.0, we don't get city name directly.
            // We'll fetch weather first, then try to get a city name via reverse geocoding.
            const weatherUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&exclude=minutely,alerts&appid=${apiKey}&units=metric`;
            fetch(weatherUrl)
                .then(response => {
                    if (!response.ok) throw new Error(`Weather fetch for current location failed: ${response.statusText}`);
                    return response.json();
                })
                .then(weatherData => {
                    const geoApiForName = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${apiKey}`;
                    fetch(geoApiForName)
                        .then(res => res.json())
                        .then(nameData => {
                            const locName = (nameData && nameData[0]) ? `${nameData[0].name}${nameData[0].state ? ', ' + nameData[0].state : ''}, ${nameData[0].country}` : "Your Location";
                            updateCurrentWeather(weatherData.current, locName);
                            updateWeeklyForecast(weatherData.daily);
                            updateHourlyForecast(weatherData.hourly);
                        })
                        .catch(nameError => {
                            console.error("Error fetching location name:", nameError);
                            updateCurrentWeather(weatherData.current, "Your Current Location"); // Fallback
                            updateWeeklyForecast(weatherData.daily);
                            updateHourlyForecast(weatherData.hourly);
                        });
                })
                .catch(error => {
                    console.error("Error fetching weather for current location:", error);
                    alert('Could not fetch weather for your location. Please use the search. Defaulting to a sample location.');
                    fetchWeatherData('London, GB'); // Fallback to a default city
                });
        }, error => {
            console.warn("Geolocation denied or unavailable. Error code: " + error.code + " - " + error.message);
            alert('Geolocation is unavailable. Please use the search. Defaulting to a sample location.');
            fetchWeatherData('New York, US'); // Fallback to default if geolocation fails
        });
    } else {
        console.warn("Geolocation is not supported by this browser. Loading default location.");
        alert('Geolocation is not supported. Please use the search. Defaulting to a sample location.');
        fetchWeatherData('Paris, FR'); // Fallback to default if no geolocation
    }
});