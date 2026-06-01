// OpenWeatherMap API Configuration
const API_KEY = 'YOUR_OPENWEATHERMAP_API_KEY'; // Replace with your API key from https://openweathermap.org/api
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Indian cities for autocomplete
const INDIAN_CITIES = [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata',
    'Pune', 'Jaipur', 'Lucknow', 'Chandigarh', 'Ahmedabad', 'Surat',
    'Indore', 'Patna', 'Bhopal', 'Coimbatore', 'Kochi', 'Visakhapatnam',
    'Nagpur', 'Thiruvananthapuram', 'Goa', 'Aurangabad', 'Amritsar',
    'Vadodara', 'Guwahati', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot',
    'Varanasi', 'Jodhpur', 'Madurai', 'Agra', 'Gurgaon', 'Noida'
];

// Weather icon mapping
const WEATHER_ICONS = {
    '01d': '☀️',  // clear sky day
    '01n': '🌙',  // clear sky night
    '02d': '⛅',  // few clouds day
    '02n': '☁️',  // few clouds night
    '03d': '☁️',  // scattered clouds day
    '03n': '☁️',  // scattered clouds night
    '04d': '☁️',  // broken clouds day
    '04n': '☁️',  // broken clouds night
    '09d': '🌧️',  // shower rain day
    '09n': '🌧️',  // shower rain night
    '10d': '🌦️',  // rain day
    '10n': '🌧️',  // rain night
    '11d': '⛈️',  // thunderstorm day
    '11n': '⛈️',  // thunderstorm night
    '13d': '❄️',  // snow day
    '13n': '❄️',  // snow night
    '50d': '🌫️',  // mist day
    '50n': '🌫️'   // mist night
};

// Color mapping by weather condition
const WEATHER_COLORS = {
    'Clear': { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', accentStart: '#FFD93D', accentEnd: '#FF6B6B' },
    'Clouds': { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', accentStart: '#95E1D3', accentEnd: '#C8E9E9' },
    'Rain': { bg: 'linear-gradient(135deg, #2E86AB 0%, #A23B72 100%)', accentStart: '#30B0C5', accentEnd: '#6F86D6' },
    'Thunderstorm': { bg: 'linear-gradient(135deg, #1a202c 0%, #4A5568 100%)', accentStart: '#FFD93D', accentEnd: '#FF6B6B' },
    'Snow': { bg: 'linear-gradient(135deg, #D4F1F4 0%, #B0E0E6 100%)', accentStart: '#4A90E2', accentEnd: '#50C878' },
    'Mist': { bg: 'linear-gradient(135deg, #A9B5C4 0%, #8896BB 100%)', accentStart: '#CBD5E0', accentEnd: '#A0AEC0' }
};

// AI Response Templates for Weather Queries
const AI_RESPONSES = {
    greeting: [
        'Hello! How can I help you with weather information today? 🌤️',
        'Hi there! What would you like to know about the weather? 😊',
        'Namaste! Ask me anything about Indian weather! 🇮🇳'
    ],
    temperature: [
        'The current temperature in {city} is {temp}°C. Perfect for {activity}! 🌡️',
        'It\'s {temp}°C in {city}. {activity_advice} 🌍',
        'Temperature in {city}: {temp}°C. {wear_advice} 👕'
    ],
    rain: [
        'There\'s a {chance}% chance of rain in {city}. Don\'t forget your umbrella! ☔',
        'Rain expected in {city}. Humidity: {humidity}%. 💧',
        '{city} has moisture in the air. Pack an umbrella just in case! 🌧️'
    ],
    hot: [
        'It\'s quite hot in {city} at {temp}°C. Stay hydrated and use sunscreen! 🌞',
        'Very warm weather in {city}! Temperature: {temp}°C. Drink plenty of water. 💧',
        '{city} is experiencing high heat at {temp}°C. Wear light, breathable clothes. 👕'
    ],
    cold: [
        'It\'s cold in {city} at {temp}°C. Wear warm clothes! 🧥',
        'Chilly weather in {city} ({temp}°C). Bundle up! 🥶',
        '{city} is cool at {temp}°C. Don\'t forget your jacket! 🧤'
    ],
    humidity: [
        'Humidity in {city} is {humidity}%. The air feels {feel}. 💧',
        '{city} has {humidity}% humidity. It\'s {feel} outside. 🌡️',
        'Moisture level: {humidity}%. Air quality: {feel} 🌬️'
    ],
    wind: [
        'Wind speed in {city} is {wind} km/h. {safety_advice} 💨',
        '{city} has winds at {wind} km/h. {activity_advice} 🌪️',
        'Wind in {city}: {wind} km/h. {weather_advice} 🌬️'
    ]
};

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const weatherContainer = document.getElementById('weatherContainer');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const chatMessages = document.getElementById('chatMessages');
const suggestionsDiv = document.getElementById('suggestions');
const cityBtns = document.querySelectorAll('.city-btn');
const chatHeader = document.querySelector('.chat-header');
const toggleBtn = document.getElementById('toggleChat');
const chatContainer = document.getElementById('chatContainer');

// Current weather data (global scope for chatbot)
let currentWeather = null;
let currentCity = '';
let autoRefreshInterval = null;
let isAutoRefreshing = false;

// Event Listeners
searchBtn.addEventListener('click', searchWeather);
cityInput.addEventListener('keypress', (e) => e.key === 'Enter' && searchWeather());
cityInput.addEventListener('input', showSuggestions);
sendBtn.addEventListener('click', sendChatMessage);
chatInput.addEventListener('keypress', (e) => e.key === 'Enter' && sendChatMessage());
chatHeader.addEventListener('click', toggleChatWindow);
cityBtns.forEach(btn => btn.addEventListener('click', () => searchWeatherByCity(btn.dataset.city)));

// Document click to close suggestions
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
        suggestionsDiv.classList.remove('active');
    }
});

// Check API Key on load
function checkApiKey() {
    if (API_KEY === 'YOUR_OPENWEATHERMAP_API_KEY') {
        displayError('⚠️ API Key not configured. Please get one from https://openweathermap.org/api and update the API_KEY in app.js');
        return false;
    }
    return true;
}

// Search weather function
function searchWeather() {
    if (!checkApiKey()) return;
    const city = cityInput.value.trim();
    if (city) {
        searchWeatherByCity(city);
        suggestionsDiv.classList.remove('active');
    }
}

// Search weather by city name
async function searchWeatherByCity(city) {
    if (!checkApiKey()) return;
    
    weatherContainer.innerHTML = '<div class="loading">🔄 Loading weather data...</div>';
    
    try {
        const response = await fetch(
            `${API_BASE_URL}/weather?q=${city},IN&units=metric&appid=${API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error('City not found');
        }
        
        const data = await response.json();
        currentWeather = data;
        currentCity = data.name;
        cityInput.value = data.name;
        displayWeather(data);
        startAutoRefresh();
    } catch (error) {
        displayError(`❌ Error: ${error.message}. Please check the city name or API key.`);
    }
}

// Display weather data with live status
function displayWeather(data) {
    const { name, sys, main, weather, wind, clouds, visibility } = data;
    const icon = WEATHER_ICONS[weather[0].icon] || '🌤️';
    const sunrise = new Date(sys.sunrise * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const sunset = new Date(sys.sunset * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const weatherMain = weather[0].main;
    const colors = WEATHER_COLORS[weatherMain] || WEATHER_COLORS['Clear'];
    
    // Determine status
    const status = getWeatherStatus(main.temp);
    
    const weatherHTML = `
        <div class="weather-card" style="background: ${colors.bg};">
            <div class="live-status">
                <span class="status-badge">🔴 LIVE</span>
                <span class="last-updated">Updated: ${new Date().toLocaleTimeString()}</span>
            </div>
            <h2 class="city-name">📍 ${name}</h2>
            <p class="location-info">${sys.country}</p>
            <div class="weather-icon-large">${icon}</div>
            <div class="temperature-display">${Math.round(main.temp)}°C</div>
            <p class="weather-description">${weather[0].main} - ${weather[0].description}</p>
            <p class="status-text" style="color: ${colors.accentStart};">${status}</p>
            
            <div class="weather-details">
                <div class="detail-item">
                    <div class="detail-label">Feels Like</div>
                    <div class="detail-value">${Math.round(main.feels_like)}°C</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Humidity</div>
                    <div class="detail-value">${main.humidity}%</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Wind Speed</div>
                    <div class="detail-value">${Math.round(wind.speed * 3.6)} km/h</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Pressure</div>
                    <div class="detail-value">${main.pressure} mb</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Visibility</div>
                    <div class="detail-value">${(visibility / 1000).toFixed(1)} km</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Cloud Cover</div>
                    <div class="detail-value">${clouds.all}%</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Sunrise</div>
                    <div class="detail-value">${sunrise}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Sunset</div>
                    <div class="detail-value">${sunset}</div>
                </div>
            </div>
        </div>
    `;
    
    weatherContainer.innerHTML = weatherHTML;
}

// Get weather status message
function getWeatherStatus(temp) {
    if (temp > 35) return '🔥 Very Hot - Stay Hydrated!';
    if (temp > 25) return '☀️ Warm & Pleasant - Great Day!';
    if (temp > 15) return '🌤️ Mild Weather - Comfortable';
    if (temp > 5) return '❄️ Cool - Wear a Jacket';
    return '🥶 Very Cold - Bundle Up!';
}

// Auto refresh weather every 10 minutes
function startAutoRefresh() {
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    
    autoRefreshInterval = setInterval(() => {
        if (currentCity && !isAutoRefreshing) {
            isAutoRefreshing = true;
            searchWeatherByCity(currentCity).finally(() => {
                isAutoRefreshing = false;
            });
        }
    }, 600000); // 10 minutes
}

// Display error
function displayError(message) {
    weatherContainer.innerHTML = `<div class="error">${message}</div>`;
}

// Show city suggestions
function showSuggestions() {
    const input = cityInput.value.toLowerCase();
    
    if (input.length === 0) {
        suggestionsDiv.classList.remove('active');
        return;
    }
    
    const matches = INDIAN_CITIES.filter(city => 
        city.toLowerCase().includes(input)
    ).slice(0, 8);
    
    if (matches.length === 0) {
        suggestionsDiv.classList.remove('active');
        return;
    }
    
    suggestionsDiv.innerHTML = matches
        .map(city => `<div class="suggestion-item" onclick="searchWeatherByCity('${city}')">${city}</div>`)
        .join('');
    
    suggestionsDiv.classList.add('active');
}

// Chat functionality
function sendChatMessage() {
    const message = chatInput.value.trim();
    
    if (!message) return;
    
    // Add user message
    addChatMessage(message, 'user');
    chatInput.value = '';
    
    // Generate AI response
    const response = generateAIResponse(message);
    
    // Simulate typing delay
    setTimeout(() => {
        addChatMessage(response, 'bot');
    }, 500);
}

// Add message to chat
function addChatMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    messageDiv.innerHTML = `<p>${escapeHtml(text)}</p>`;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Generate AI response based on user input
function generateAIResponse(userMessage) {
    const message = userMessage.toLowerCase();
    const greetings = ['hi', 'hello', 'hey', 'namaste', 'hola', 'hey there'];
    
    // Greeting
    if (greetings.some(g => message.includes(g))) {
        return getRandomResponse(AI_RESPONSES.greeting);
    }
    
    // If no weather data, prompt to search
    if (!currentWeather) {
        return 'Please search for a city first to get detailed weather information! 🏙️';
    }
    
    const { main, weather, wind, clouds } = currentWeather;
    const temp = Math.round(main.temp);
    const humidity = main.humidity;
    const windSpeed = Math.round(wind.speed * 3.6);
    const description = weather[0].main.toLowerCase();
    
    // Temperature queries
    if (message.includes('temperature') || message.includes('temp') || message.includes('how hot')) {
        if (temp > 35) {
            return `It's very hot in ${currentCity}! Temperature is ${temp}°C. 🌡️ Stay hydrated and apply sunscreen regularly.`;
        } else if (temp > 25) {
            return `Pleasant warmth in ${currentCity}! Current temperature: ${temp}°C. ☀️ Perfect weather for outdoor activities!`;
        } else if (temp < 10) {
            return `It's quite cold in ${currentCity}! Temperature: ${temp}°C. 🥶 Bundle up with warm clothing.`;
        } else {
            return `Temperature in ${currentCity}: ${temp}°C. 🌡️ Mild and comfortable weather!`;
        }
    }
    
    // Rain queries
    if (message.includes('rain') || message.includes('umbrella') || message.includes('wet')) {
        if (description.includes('rain')) {
            return `☔ It's raining in ${currentCity}! Humidity: ${humidity}%. Don't forget your umbrella and stay safe on wet roads.`;
        } else if (clouds.all > 70) {
            return `⛅ ${currentCity} has ${clouds.all}% cloud coverage. There's a chance of rain. Keep an umbrella handy!`;
        } else {
            return `☀️ No rain expected in ${currentCity} currently. Great day to go outside!`;
        }
    }
    
    // Humidity queries
    if (message.includes('humidity') || message.includes('moist') || message.includes('damp')) {
        const feel = humidity > 70 ? 'quite humid and sticky' : humidity > 50 ? 'moderately humid' : 'dry and comfortable';
        return `Humidity in ${currentCity} is ${humidity}%. The air feels ${feel}. 💧`;
    }
    
    // Wind queries
    if (message.includes('wind') || message.includes('breeze')) {
        if (windSpeed > 40) {
            return `🌪️ Strong winds in ${currentCity}! Wind speed: ${windSpeed} km/h. Be careful with loose items and avoid tall structures.`;
        } else if (windSpeed > 20) {
            return `💨 Moderate winds in ${currentCity}: ${windSpeed} km/h. Good for kite flying!`;
        } else {
            return `🌬️ Light breeze in ${currentCity}: ${windSpeed} km/h. Pleasant winds!`;
        }
    }
    
    // Clothing advice
    if (message.includes('wear') || message.includes('clothes') || message.includes('dress')) {
        if (temp > 35) {
            return `👕 For ${temp}°C weather in ${currentCity}, wear light, breathable cotton clothes, a hat, and sunglasses. Don't forget sunscreen!`;
        } else if (temp < 10) {
            return `🧥 For ${temp}°C weather in ${currentCity}, wear a warm jacket, sweater, and long pants. A scarf and gloves would be nice!`;
        } else {
            return `👖 For ${temp}°C weather in ${currentCity}, casual clothing like jeans and a shirt should be comfortable.`;
        }
    }
    
    // Activity suggestions
    if (message.includes('activity') || message.includes('outdoor') || message.includes('play')) {
        if (description.includes('rain')) {
            return `🏠 It's rainy in ${currentCity}! Perfect time for indoor activities like movies, reading, or games.`;
        } else if (temp > 35) {
            return `🏊 ${currentCity} is hot! Water activities like swimming or visiting water parks would be great!`;
        } else if (temp < 10) {
            return `⛷️ Cold weather in ${currentCity}! Perfect for hot beverages and cozy indoor activities.`;
        } else {
            return `🏃 Perfect weather in ${currentCity} for outdoor activities! Go for a walk, jog, or picnic!`;
        }
    }
    
    // General weather description
    if (message.includes('weather') || message.includes('condition') || message.includes('outlook')) {
        return `🌤️ Current conditions in ${currentCity}: ${description}, ${temp}°C. Humidity: ${humidity}%, Wind: ${windSpeed} km/h.`;
    }
    
    // Default response
    return `I can help you with weather information for ${currentCity}! Ask me about temperature, rain, humidity, wind, what to wear, or activities! 🌍`;
}

// Toggle chat window
function toggleChatWindow() {
    chatContainer.style.display = chatContainer.style.display === 'none' ? 'flex' : 'none';
    toggleBtn.classList.toggle('collapsed');
}

// Utility function to get random response
function getRandomResponse(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize app
function init() {
    console.log('✅ WeatherHub India initialized!');
    if (!checkApiKey()) {
        console.error('⚠️ API Key not configured');
    }
}

init();