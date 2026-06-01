// Dashboard Application
const API_KEY = 'YOUR_OPENWEATHERMAP_API_KEY'; // Replace with your API key
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5';
const ONE_CALL_API = 'https://api.openweathermap.org/data/3.0/onecall';

// Indian cities
const INDIAN_CITIES = [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata',
    'Pune', 'Jaipur', 'Lucknow', 'Chandigarh', 'Ahmedabad', 'Surat',
    'Indore', 'Patna', 'Bhopal', 'Coimbatore', 'Kochi', 'Visakhapatnam',
    'Nagpur', 'Thiruvananthapuram', 'Goa', 'Aurangabad', 'Amritsar'
];

// Weather icon mapping
const WEATHER_ICONS = {
    '01d': '☀️',   '01n': '🌙',
    '02d': '⛅',   '02n': '☁️',
    '03d': '☁️',   '03n': '☁️',
    '04d': '☁️',   '04n': '☁️',
    '09d': '🌧️',   '09n': '🌧️',
    '10d': '🌦️',   '10n': '🌧️',
    '11d': '⛈️',   '11n': '⛈️',
    '13d': '❄️',   '13n': '❄️',
    '50d': '🌫️',   '50n': '🌫️'
};

// State
let currentWeatherData = null;
let currentCity = '';
let tempUnit = 'metric';
let windUnit = 'kmh';
let comparisonCities = [];
let charts = {};

// DOM Elements
const navItems = document.querySelectorAll('.nav-item');
const views = document.querySelectorAll('.view');
const dashboardSearch = document.getElementById('dashboardSearch');
const dashboardSuggestions = document.getElementById('dashboardSuggestions');
const refreshBtn = document.getElementById('refreshBtn');
const settingsBtn = document.getElementById('settingsBtn');
const modal = document.getElementById('forecastModal');
const closeModal = document.querySelector('.close-modal');
const forecastContainer = document.getElementById('forecastContainer');
const comparisonCityInput = document.getElementById('comparisonCityInput');
const addComparisonBtn = document.getElementById('addComparisonBtn');
const clearComparisonBtn = document.getElementById('clearComparisonBtn');
const comparisonSuggestions = document.getElementById('comparisonSuggestions');
const alertsContainer = document.getElementById('alertsContainer');
const autoRefreshCheckbox = document.getElementById('autoRefresh');

// Event Listeners
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.dataset.view;
        switchView(view);
        updateActiveNav(item);
    });
});

dashboardSearch.addEventListener('input', showSearchSuggestions);
dashboardSearch.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchCity(dashboardSearch.value);
    }
});

refreshBtn.addEventListener('click', refreshData);
settingsBtn.addEventListener('click', () => switchView('settings'));
addComparisonBtn.addEventListener('click', addComparisonCity);
clearComparisonBtn.addEventListener('click', clearComparison);
comparisonCityInput.addEventListener('input', showComparisonSuggestions);
comparisonCityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addComparisonCity();
});

closeModal.addEventListener('click', () => modal.classList.remove('active'));
modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
});

// Settings
document.querySelectorAll('input[name="tempUnit"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        tempUnit = e.target.value;
        updateWeatherDisplay();
    });
});

document.querySelectorAll('input[name="windUnit"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        windUnit = e.target.value;
        updateWeatherDisplay();
    });
});

document.querySelectorAll('input[name="displayMode"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.value === 'dark') {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    });
});

// View switching
function switchView(viewName) {
    views.forEach(view => view.classList.remove('active'));
    const viewElement = document.getElementById(`${viewName}-view`);
    if (viewElement) {
        viewElement.classList.add('active');
        
        // Initialize charts when analytics view is opened
        if (viewName === 'analytics' && currentWeatherData) {
            setTimeout(() => initializeCharts(), 100);
        }
    }
}

function updateActiveNav(activeItem) {
    navItems.forEach(item => item.classList.remove('active'));
    activeItem.classList.add('active');
}

// Search functionality
function showSearchSuggestions() {
    const input = dashboardSearch.value.toLowerCase();
    
    if (input.length === 0) {
        dashboardSuggestions.classList.remove('active');
        return;
    }
    
    const matches = INDIAN_CITIES.filter(city => 
        city.toLowerCase().includes(input)
    ).slice(0, 8);
    
    if (matches.length === 0) {
        dashboardSuggestions.classList.remove('active');
        return;
    }
    
    dashboardSuggestions.innerHTML = matches
        .map(city => `<div class="suggestion-item" onclick="searchCity('${city}')">${city}</div>`)
        .join('');
    
    dashboardSuggestions.classList.add('active');
}

async function searchCity(city) {
    try {
        dashboardSearch.value = city;
        dashboardSuggestions.classList.remove('active');
        
        const response = await fetch(
            `${API_BASE_URL}/weather?q=${city},IN&units=${tempUnit}&appid=${API_KEY}`
        );
        
        if (!response.ok) throw new Error('City not found');
        
        const data = await response.json();
        currentWeatherData = data;
        currentCity = data.name;
        
        updateWeatherDisplay();
        switchView('current');
        
        // Fetch 5-day forecast
        fetchForecast(data.coord.lat, data.coord.lon);
    } catch (error) {
        showError(`Error: ${error.message}`);
    }
}

// Fetch forecast data
async function fetchForecast(lat, lon) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=${tempUnit}&appid=${API_KEY}`
        );
        
        if (!response.ok) throw new Error('Forecast not found');
        
        const data = await response.json();
        displayForecast(data.list);
    } catch (error) {
        console.error('Forecast error:', error);
    }
}

// Update weather display
function updateWeatherDisplay() {
    if (!currentWeatherData) return;
    
    const { name, sys, main, weather, wind, clouds, visibility } = currentWeatherData;
    const icon = WEATHER_ICONS[weather[0].icon] || '🌤️';
    const tempSymbol = tempUnit === 'metric' ? '°C' : '°F';
    const windSpeedValue = getWindSpeed(wind.speed);
    
    // Update current weather section
    document.getElementById('cityTitle').textContent = name;
    document.getElementById('locationInfo').textContent = `📍 ${sys.country}`;
    document.getElementById('mainIcon').textContent = icon;
    document.getElementById('mainTemp').textContent = Math.round(main.temp);
    document.querySelector('.unit').textContent = tempSymbol;
    document.getElementById('weatherDesc').textContent = `${weather[0].main} - ${weather[0].description}`;
    document.getElementById('feelsLike').textContent = `Feels like ${Math.round(main.feels_like)}${tempSymbol}`;
    document.getElementById('humidity').textContent = `${main.humidity}%`;
    document.getElementById('windSpeed').textContent = `${windSpeedValue}`;
    document.getElementById('pressure').textContent = `${main.pressure} mb`;
    document.getElementById('visibility').textContent = `${(visibility / 1000).toFixed(1)} km`;
    document.getElementById('clouds').textContent = `${clouds.all}%`;
    
    const sunrise = new Date(sys.sunrise * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const sunset = new Date(sys.sunset * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('sunrise').textContent = sunrise;
    document.getElementById('sunset').textContent = sunset;
    document.getElementById('lastUpdate').textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
    
    // UV Index (mock data)
    const uvIndex = Math.random() * 12;
    document.getElementById('uvIndex').textContent = uvIndex.toFixed(1);
}

// Get wind speed based on unit
function getWindSpeed(speedMs) {
    switch(windUnit) {
        case 'ms':
            return `${speedMs.toFixed(1)} m/s`;
        case 'mph':
            return `${(speedMs * 2.237).toFixed(1)} mph`;
        case 'kmh':
        default:
            return `${(speedMs * 3.6).toFixed(1)} km/h`;
    }
}

// Display 5-day forecast
function displayForecast(forecastList) {
    const dailyForecasts = {};
    
    forecastList.forEach(item => {
        const date = new Date(item.dt * 1000).toLocaleDateString();
        if (!dailyForecasts[date]) {
            dailyForecasts[date] = item;
        }
    });
    
    forecastContainer.innerHTML = Object.entries(dailyForecasts).slice(1, 6).map(([date, data]) => {
        const icon = WEATHER_ICONS[data.weather[0].icon] || '🌤️';
        const tempSymbol = tempUnit === 'metric' ? '°C' : '°F';
        const dateObj = new Date(date);
        const dayName = dateObj.toLocaleDateString('en-IN', { weekday: 'short' });
        
        return `
            <div class="forecast-card" onclick="showForecastDetail('${date}', '${JSON.stringify(data)}')
">
                <div class="forecast-date">${dayName}</div>
                <div class="forecast-icon">${icon}</div>
                <div class="forecast-temp">
                    <span class="forecast-high">${Math.round(data.main.temp_max)}${tempSymbol}</span>
                    <span class="forecast-low">${Math.round(data.main.temp_min)}${tempSymbol}</span>
                </div>
                <div class="forecast-desc">${data.weather[0].main}</div>
                <div class="forecast-details">
                    <div class="detail-row">
                        <span>💧</span>
                        <span>${data.main.humidity}%</span>
                    </div>
                    <div class="detail-row">
                        <span>💨</span>
                        <span>${getWindSpeed(data.wind.speed)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Show forecast detail
function showForecastDetail(date, dataJson) {
    const data = JSON.parse(dataJson);
    const tempSymbol = tempUnit === 'metric' ? '°C' : '°F';
    const icon = WEATHER_ICONS[data.weather[0].icon] || '🌤️';
    
    const html = `
        <h2>${new Date(date).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
        <div style="text-align: center; padding: 2rem 0;">
            <div style="font-size: 3rem;">${icon}</div>
            <p style="font-size: 1.5rem; margin: 1rem 0;">${data.weather[0].main}</p>
            <p style="color: #64748b;">${data.weather[0].description}</p>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div>
                <strong>Temperature:</strong> ${Math.round(data.main.temp)}${tempSymbol}
            </div>
            <div>
                <strong>Feels Like:</strong> ${Math.round(data.main.feels_like)}${tempSymbol}
            </div>
            <div>
                <strong>Min:</strong> ${Math.round(data.main.temp_min)}${tempSymbol}
            </div>
            <div>
                <strong>Max:</strong> ${Math.round(data.main.temp_max)}${tempSymbol}
            </div>
            <div>
                <strong>Humidity:</strong> ${data.main.humidity}%
            </div>
            <div>
                <strong>Wind:</strong> ${getWindSpeed(data.wind.speed)}
            </div>
            <div>
                <strong>Pressure:</strong> ${data.main.pressure} mb
            </div>
            <div>
                <strong>Clouds:</strong> ${data.clouds.all}%
            </div>
        </div>
    `;
    
    document.getElementById('modalBody').innerHTML = html;
    modal.classList.add('active');
}

// Initialize charts
function initializeCharts() {
    if (!currentWeatherData) return;
    
    // Temperature chart
    const tempCtx = document.getElementById('tempChart')?.getContext('2d');
    if (tempCtx && !charts.temp) {
        charts.temp = new Chart(tempCtx, {
            type: 'line',
            data: {
                labels: generateHours(),
                datasets: [{
                    label: 'Temperature (°C)',
                    data: generateTemperatureData(),
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: false } }
            }
        });
    }
    
    // Humidity & Pressure chart
    const humidityCtx = document.getElementById('humidityChart')?.getContext('2d');
    if (humidityCtx && !charts.humidity) {
        charts.humidity = new Chart(humidityCtx, {
            type: 'line',
            data: {
                labels: generateHours(),
                datasets: [
                    {
                        label: 'Humidity (%)',
                        data: generateHumidityData(),
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y',
                        fill: true
                    },
                    {
                        label: 'Pressure (mb)',
                        data: generatePressureData(),
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y1',
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { position: 'top' } },
                scales: {
                    y: { type: 'linear', position: 'left', title: { display: true, text: 'Humidity (%)' } },
                    y1: { type: 'linear', position: 'right', title: { display: true, text: 'Pressure (mb)' } }
                }
            }
        });
    }
    
    // Wind chart
    const windCtx = document.getElementById('windChart')?.getContext('2d');
    if (windCtx && !charts.wind) {
        charts.wind = new Chart(windCtx, {
            type: 'bar',
            data: {
                labels: generateHours(),
                datasets: [{
                    label: 'Wind Speed (km/h)',
                    data: generateWindData(),
                    backgroundColor: 'rgba(239, 68, 68, 0.6)',
                    borderColor: '#ef4444',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            }
        });
    }
    
    // Weather distribution
    const weatherCtx = document.getElementById('weatherChart')?.getContext('2d');
    if (weatherCtx && !charts.weather) {
        charts.weather = new Chart(weatherCtx, {
            type: 'doughnut',
            data: {
                labels: ['Clear', 'Cloudy', 'Rainy', 'Stormy'],
                datasets: [{
                    data: [40, 30, 20, 10],
                    backgroundColor: ['#2563eb', '#64748b', '#10b981', '#ef4444']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }
}

// Chart data generators
function generateHours() {
    return Array.from({length: 24}, (_, i) => `${i}:00`);
}

function generateTemperatureData() {
    const base = currentWeatherData?.main.temp || 25;
    return Array.from({length: 24}, () => base + (Math.random() - 0.5) * 8);
}

function generateHumidityData() {
    const base = currentWeatherData?.main.humidity || 60;
    return Array.from({length: 24}, () => Math.min(100, base + (Math.random() - 0.5) * 20));
}

function generatePressureData() {
    const base = currentWeatherData?.main.pressure || 1013;
    return Array.from({length: 24}, () => base + (Math.random() - 0.5) * 10);
}

function generateWindData() {
    const base = currentWeatherData?.wind.speed * 3.6 || 15;
    return Array.from({length: 24}, () => base + (Math.random() - 0.5) * 10);
}

// Comparison functionality
function showComparisonSuggestions() {
    const input = comparisonCityInput.value.toLowerCase();
    
    if (input.length === 0) {
        comparisonSuggestions.classList.remove('active');
        return;
    }
    
    const matches = INDIAN_CITIES.filter(city => 
        city.toLowerCase().includes(input) && !comparisonCities.includes(city)
    ).slice(0, 5);
    
    if (matches.length === 0) {
        comparisonSuggestions.classList.remove('active');
        return;
    }
    
    comparisonSuggestions.innerHTML = matches
        .map(city => `<div class="suggestion-item" onclick="addCityFromSuggestion('${city}')">${city}</div>`)
        .join('');
    
    comparisonSuggestions.classList.add('active');
}

function addCityFromSuggestion(city) {
    comparisonCityInput.value = city;
    addComparisonCity();
}

async function addComparisonCity() {
    const city = comparisonCityInput.value.trim();
    if (!city || comparisonCities.includes(city)) return;
    
    try {
        const response = await fetch(
            `${API_BASE_URL}/weather?q=${city},IN&units=${tempUnit}&appid=${API_KEY}`
        );
        
        if (!response.ok) throw new Error('City not found');
        
        comparisonCities.push(city);
        comparisonCityInput.value = '';
        comparisonSuggestions.classList.remove('active');
        updateComparisonTable();
    } catch (error) {
        showError(`Could not add ${city}: ${error.message}`);
    }
}

function clearComparison() {
    comparisonCities = [];
    document.getElementById('comparisonTable').innerHTML = '';
}

async function updateComparisonTable() {
    const tableContainer = document.getElementById('comparisonTable');
    
    const weatherData = await Promise.all(
        comparisonCities.map(city =>
            fetch(`${API_BASE_URL}/weather?q=${city},IN&units=${tempUnit}&appid=${API_KEY}`)
                .then(r => r.json())
        )
    );
    
    const tempSymbol = tempUnit === 'metric' ? '°C' : '°F';
    
    const tableHTML = `
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>City</th>
                        <th>Temperature</th>
                        <th>Weather</th>
                        <th>Humidity</th>
                        <th>Wind Speed</th>
                        <th>Pressure</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${weatherData.map(data => `
                        <tr>
                            <td class="city-name-col">${data.name}</td>
                            <td>${Math.round(data.main.temp)}${tempSymbol}</td>
                            <td>${data.weather[0].main}</td>
                            <td>${data.main.humidity}%</td>
                            <td>${getWindSpeed(data.wind.speed)}</td>
                            <td>${data.main.pressure} mb</td>
                            <td>
                                <button class="remove-city" onclick="removeComparisonCity('${data.name}')">Remove</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    tableContainer.innerHTML = tableHTML;
}

function removeComparisonCity(city) {
    comparisonCities = comparisonCities.filter(c => c !== city);
    updateComparisonTable();
}

// Refresh data
async function refreshData() {
    if (!currentCity) return;
    
    refreshBtn.classList.add('spinning');
    try {
        await searchCity(currentCity);
    } finally {
        refreshBtn.classList.remove('spinning');
    }
}

// Error handling
function showError(message) {
    alert(message); // In production, use a toast notification
}

// Initialize on page load
window.addEventListener('load', () => {
    // Default to Mumbai
    searchCity('Mumbai');
    
    // Auto-refresh every 10 minutes
    setInterval(() => {
        if (autoRefreshCheckbox?.checked) {
            refreshData();
        }
    }, 600000);
});

// Close suggestions when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-bar')) {
        dashboardSuggestions.classList.remove('active');
    }
});