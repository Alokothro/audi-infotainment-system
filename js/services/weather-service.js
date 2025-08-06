// Weather Service with Lambda Functions
class WeatherService {
    constructor() {
        // Try to get API key from server/environment, fallback to demo
        this.apiKey = null;
        this.loadApiKey();
        this.baseUrl = 'https://api.openweathermap.org/data/2.5';
        this.currentWeather = null;
        this.lastUpdate = null;
        
        // Lambda function for temperature conversion
        this.convertTemp = {
            toFahrenheit: (celsius) => Math.round(celsius * 9/5 + 32),
            toCelsius: (fahrenheit) => Math.round((fahrenheit - 32) * 5/9),
            format: (temp, unit) => `${temp}°${unit}`
        };
        
        // Lambda function for weather condition mapping
        this.getWeatherIcon = (iconCode) => {
            const iconMap = {
                '01d': 'fas fa-sun',           // clear sky day
                '01n': 'fas fa-moon',          // clear sky night
                '02d': 'fas fa-cloud-sun',     // few clouds day
                '02n': 'fas fa-cloud-moon',    // few clouds night
                '03d': 'fas fa-cloud',         // scattered clouds
                '03n': 'fas fa-cloud',
                '04d': 'fas fa-clouds',        // broken clouds
                '04n': 'fas fa-clouds',
                '09d': 'fas fa-cloud-rain',    // shower rain
                '09n': 'fas fa-cloud-rain',
                '10d': 'fas fa-cloud-sun-rain', // rain day
                '10n': 'fas fa-cloud-moon-rain', // rain night
                '11d': 'fas fa-bolt',          // thunderstorm
                '11n': 'fas fa-bolt',
                '13d': 'fas fa-snowflake',     // snow
                '13n': 'fas fa-snowflake',
                '50d': 'fas fa-smog',          // mist
                '50n': 'fas fa-smog'
            };
            return iconMap[iconCode] || 'fas fa-question';
        };
        
        // Start automatic weather updates after API key is loaded
        this.startAutoUpdate();
    }
    
    // Lambda function for loading API key from server
    loadApiKey = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/weather-key');
            const data = await response.json();
            this.apiKey = data.apiKey || 'demo-key';
            console.log('Weather API key loaded:', this.apiKey ? 'Yes' : 'No');
        } catch (error) {
            console.warn('Failed to load weather API key, using demo mode');
            this.apiKey = 'demo-key';
        }
    };
    
    // Lambda function for getting current location
    getCurrentLocation = () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                // Success callback (lambda)
                (position) => resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                }),
                // Error callback (lambda)
                (error) => reject(error),
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
            );
        });
    };
    
    // Lambda function for fetching weather data
    fetchWeatherData = async (lat, lon) => {
        const url = `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Weather API error: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch weather:', error);
            // Return mock data for demo purposes
            return this.getMockWeatherData();
        }
    };
    
    // Lambda function for processing weather data
    processWeatherData = (data) => {
        const currentDriver = localStorage.getItem('audi_current_driver');
        let tempUnit = 'F'; // Default
        
        // Get temperature unit from driver profile
        if (window.driverProfileManager && currentDriver) {
            const profile = window.driverProfileManager.profiles[currentDriver];
            if (profile) {
                tempUnit = profile.preferences.vehicle.temperatureUnit === 'Celsius' ? 'C' : 'F';
            }
        }
        
        const tempInCelsius = Math.round(data.main.temp);
        const temperature = tempUnit === 'F' 
            ? this.convertTemp.toFahrenheit(tempInCelsius)
            : tempInCelsius;
        
        return {
            temperature: this.convertTemp.format(temperature, tempUnit),
            condition: data.weather[0].description,
            icon: data.weather[0].icon,
            humidity: data.main.humidity,
            windSpeed: Math.round(data.wind.speed * 2.237), // Convert m/s to mph
            location: data.name,
            rawTemp: temperature
        };
    };
    
    // Lambda function for updating UI
    updateWeatherDisplay = (weatherData) => {
        // Update temperature in header
        const tempElement = document.querySelector('[data-weather="temperature"]');
        if (tempElement) {
            tempElement.textContent = weatherData.temperature;
        }
        
        // Update weather icon
        const iconElement = document.querySelector('.weather-icon');
        if (iconElement) {
            const iconClass = this.getWeatherIcon(weatherData.icon);
            iconElement.className = `weather-icon ${iconClass}`;
            iconElement.title = weatherData.condition;
        }
        
        // Dispatch custom event for other components
        document.dispatchEvent(new CustomEvent('weatherUpdated', {
            detail: weatherData
        }));
    };
    
    // Main weather update function using lambda chain
    updateWeather = async () => {
        try {
            const location = await this.getCurrentLocation();
            const rawData = await this.fetchWeatherData(location.latitude, location.longitude);
            const processedData = this.processWeatherData(rawData);
            
            this.currentWeather = processedData;
            this.lastUpdate = new Date();
            
            this.updateWeatherDisplay(processedData);
            
            console.log('Weather updated:', processedData);
        } catch (error) {
            console.error('Weather update failed:', error);
            // Fall back to mock data
            const mockData = this.processWeatherData(this.getMockWeatherData());
            this.updateWeatherDisplay(mockData);
        }
    };
    
    // Lambda function for automatic updates
    startAutoUpdate = () => {
        // Wait for API key to load, then update immediately
        const tryUpdate = () => {
            if (this.apiKey) {
                this.updateWeather();
                // Then update every 10 minutes
                setInterval(() => this.updateWeather(), 10 * 60 * 1000);
            } else {
                // Retry in 1 second if API key not loaded yet
                setTimeout(tryUpdate, 1000);
            }
        };
        tryUpdate();
    };
    
    // Lambda function for mock data (for demo/development)
    getMockWeatherData = () => ({
        main: {
            temp: 22, // Celsius
            humidity: 65
        },
        weather: [{
            description: 'partly cloudy',
            icon: '02d'
        }],
        wind: {
            speed: 3.5 // m/s
        },
        name: 'Current Location'
    });
    
    // Lambda function for manual refresh
    refreshWeather = () => {
        console.log('Manual weather refresh requested');
        this.updateWeather();
    };
    
    // Lambda functions for weather-based suggestions
    getWeatherSuggestions = () => {
        if (!this.currentWeather) return [];
        
        const suggestions = [];
        const temp = this.currentWeather.rawTemp;
        
        // Temperature-based suggestions (using lambda functions)
        const tempSuggestions = [
            { condition: () => temp > 80, message: "It's hot outside! Consider using A/C." },
            { condition: () => temp < 40, message: "It's cold! Pre-heat your car." },
            { condition: () => temp > 60 && temp < 80, message: "Perfect weather for a drive!" }
        ];
        
        tempSuggestions.forEach(suggestion => {
            if (suggestion.condition()) {
                suggestions.push(suggestion.message);
            }
        });
        
        // Weather condition suggestions
        if (this.currentWeather.condition.includes('rain')) {
            suggestions.push("Rain detected. Drive carefully!");
        }
        
        return suggestions;
    };
}

// Create global instance
window.weatherService = new WeatherService();

// Export for potential future use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WeatherService;
}