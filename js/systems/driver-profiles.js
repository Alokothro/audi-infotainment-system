// Driver Profile Management System
class DriverProfileManager {
    constructor() {
        this.currentDriver = null;
        this.profiles = {
            driver1: this.loadProfile('driver1') || this.getDefaultProfile('Driver 1'),
            driver2: this.loadProfile('driver2') || this.getDefaultProfile('Driver 2')
        };
    }
    
    getDefaultProfile(name) {
        return {
            name: name,
            preferences: {
                // Climate settings
                climate: {
                    driverTemp: 72,
                    passengerTemp: 72,
                    fanSpeed: 5,
                    auto: true,
                    ac: true,
                    dualZone: false,
                    seatHeatDriver: false,
                    seatCoolDriver: false,
                    seatHeatPassenger: false,
                    seatCoolPassenger: false
                },
                
                // Media settings
                media: {
                    lastSource: 'Radio',
                    volume: 50,
                    lastRadioStation: 0, // Station index
                    favoriteStations: [],
                    touchSounds: true
                },
                
                // Display settings
                display: {
                    brightness: 80,
                    nightMode: false,
                    theme: 'dark'
                },
                
                // Navigation
                navigation: {
                    homeAddress: '',
                    workAddress: '',
                    recentDestinations: []
                },
                
                // Vehicle
                vehicle: {
                    preferredUnits: 'imperial', // or 'metric'
                    driveMode: 'comfort' // sport, eco, comfort
                },
                
                // System
                system: {
                    language: 'en',
                    keyClickSound: true,
                    startupSound: true
                }
            },
            
            // Last state when driver exited
            lastState: {
                lastScreen: 'home',
                timestamp: new Date().toISOString()
            }
        };
    }
    
    loadProfile(driverId) {
        const stored = localStorage.getItem(`audi_profile_${driverId}`);
        return stored ? JSON.parse(stored) : null;
    }
    
    saveProfile(driverId) {
        const profile = this.profiles[driverId];
        if (profile) {
            localStorage.setItem(`audi_profile_${driverId}`, JSON.stringify(profile));
        }
    }
    
    setCurrentDriver(driverId) {
        this.currentDriver = driverId;
        localStorage.setItem('audi_current_driver', driverId);
        this.applyProfile(driverId);
    }
    
    getCurrentDriver() {
        return this.currentDriver || localStorage.getItem('audi_current_driver');
    }
    
    applyProfile(driverId) {
        const profile = this.profiles[driverId];
        if (!profile) return;
        
        // Apply climate settings
        this.applyClimateSettings(profile.preferences.climate);
        
        // Apply media settings
        this.applyMediaSettings(profile.preferences.media);
        
        // Apply display settings
        this.applyDisplaySettings(profile.preferences.display);
        
        // Apply other preferences
        this.applySystemSettings(profile.preferences.system);
        
        console.log(`Profile loaded for ${profile.name}`);
    }
    
    applyClimateSettings(climate) {
        // Update climate UI
        const updateTempDisplay = (selector, value) => {
            const elem = document.querySelector(selector);
            if (elem) elem.textContent = `${value}°F`;
        };
        
        updateTempDisplay('.climate-zone:first-child .temp-value', climate.driverTemp);
        updateTempDisplay('.climate-zone:last-child .temp-value', climate.passengerTemp);
        
        // Update fan speed
        const fanSlider = document.querySelector('.fan-slider');
        if (fanSlider) fanSlider.value = climate.fanSpeed;
        
        // Update climate buttons
        this.updateButton('#auto-btn', climate.auto);
        this.updateButton('#ac-btn', climate.ac);
        this.updateButton('#dual-btn', climate.dualZone);
        
        // Store in app state
        if (window.climateState) {
            Object.assign(window.climateState, climate);
        }
    }
    
    applyMediaSettings(media) {
        // Set volume
        const volumeSlider = document.querySelector('.volume-slider');
        if (volumeSlider) volumeSlider.value = media.volume;
        
        // Set last source
        if (window.currentMediaSource) {
            window.currentMediaSource = media.lastSource;
        }
        
        // Set radio station
        if (window.radioPlayer && window.radioPlayer.stations) {
            window.radioPlayer.currentStation = media.lastRadioStation;
        }
        
        // Apply touch sounds
        if (window.audioManager) {
            window.audioManager.touchSoundsEnabled = media.touchSounds;
        }
    }
    
    applyDisplaySettings(display) {
        // Set brightness
        const brightnessSlider = document.getElementById('brightness-slider');
        if (brightnessSlider) {
            brightnessSlider.value = display.brightness;
            document.body.style.filter = `brightness(${display.brightness}%)`;
        }
        
        // Set theme
        document.body.classList.toggle('night-mode', display.nightMode);
        
        // Update settings UI
        const nightModeToggle = document.getElementById('night-mode');
        if (nightModeToggle) nightModeToggle.checked = display.nightMode;
    }
    
    applySystemSettings(system) {
        // Apply key click sounds
        const touchSoundsToggle = document.getElementById('touch-sounds');
        if (touchSoundsToggle) touchSoundsToggle.checked = system.keyClickSound;
        
        // Store in audio manager
        if (window.audioManager) {
            window.audioManager.touchSoundsEnabled = system.keyClickSound;
        }
    }
    
    updateButton(selector, active) {
        const btn = document.querySelector(selector);
        if (btn) {
            btn.classList.toggle('active', active);
        }
    }
    
    saveCurrentState() {
        if (!this.currentDriver) return;
        
        const profile = this.profiles[this.currentDriver];
        if (!profile) return;
        
        // Save current climate state
        if (window.climateState) {
            Object.assign(profile.preferences.climate, window.climateState);
        }
        
        // Save current media state
        profile.preferences.media.volume = document.querySelector('.volume-slider')?.value || 50;
        profile.preferences.media.lastSource = window.currentMediaSource || 'Radio';
        if (window.radioPlayer) {
            profile.preferences.media.lastRadioStation = window.radioPlayer.currentStation || 0;
        }
        
        // Save display settings
        const brightnessSlider = document.getElementById('brightness-slider');
        if (brightnessSlider) {
            profile.preferences.display.brightness = parseInt(brightnessSlider.value);
        }
        profile.preferences.display.nightMode = document.body.classList.contains('night-mode');
        
        // Save system settings
        profile.preferences.system.keyClickSound = 
            document.getElementById('touch-sounds')?.checked || true;
        
        // Update last state
        profile.lastState = {
            lastScreen: window.currentScreen || 'home',
            timestamp: new Date().toISOString()
        };
        
        // Persist to localStorage
        this.saveProfile(this.currentDriver);
    }
    
    // Call this when any setting changes
    onSettingChanged() {
        this.saveCurrentState();
    }
}

// Create global instance
window.driverProfileManager = new DriverProfileManager();

// Auto-save on certain events
document.addEventListener('DOMContentLoaded', () => {
    // Save when switching screens
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            window.driverProfileManager.saveCurrentState();
        });
    });
    
    // Save when changing settings
    const settingsInputs = document.querySelectorAll(
        '.setting-slider, .toggle-switch input, .setting-select'
    );
    settingsInputs.forEach(input => {
        input.addEventListener('change', () => {
            window.driverProfileManager.onSettingChanged();
        });
    });
    
    // Save periodically
    setInterval(() => {
        window.driverProfileManager.saveCurrentState();
    }, 30000); // Every 30 seconds
    
    // Save on page unload
    window.addEventListener('beforeunload', () => {
        window.driverProfileManager.saveCurrentState();
    });
});