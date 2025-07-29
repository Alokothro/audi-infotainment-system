// Audi AI Voice Assistant
class AudiAI {
    constructor() {
        this.isRecording = false;
        this.recognition = null;
        this.recordBtn = document.getElementById('record-btn');
        this.statusText = document.getElementById('ai-status-text');
        this.aiCircleOuter = document.querySelector('.ai-circle-outer');
        this.aiCircleInner = document.querySelector('.ai-circle-inner');
        
        this.initializeSpeechRecognition();
        this.setupEventListeners();
    }
    
    initializeSpeechRecognition() {
        // Check if browser supports speech recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.lang = 'en-US';
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.recognition.maxAlternatives = 1;
            
            this.recognition.onstart = () => {
                this.isRecording = true;
                this.recordBtn.classList.add('recording');
                this.statusText.textContent = 'Listening...';
                this.animateListening(true);
            };
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript.toLowerCase();
                
                if (event.results[0].isFinal) {
                    this.statusText.textContent = `"${transcript}"`;
                    this.processCommand(transcript);
                }
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                if (event.error === 'network') {
                    this.statusText.textContent = 'Speech recognition requires internet connection';
                } else if (event.error === 'not-allowed') {
                    this.statusText.textContent = 'Microphone permission denied';
                } else {
                    this.statusText.textContent = 'Error: ' + event.error;
                }
                this.stopRecording();
            };
            
            this.recognition.onend = () => {
                this.stopRecording();
            };
        } else {
            this.statusText.textContent = 'Speech recognition not supported';
            this.recordBtn.disabled = true;
        }
    }
    
    setupEventListeners() {
        if (this.recordBtn) {
            this.recordBtn.addEventListener('click', () => {
                if (this.isRecording) {
                    this.stopRecording();
                } else {
                    this.startRecording();
                }
            });
            
            // Add keyboard shortcut for testing (press 'T' to test)
            document.addEventListener('keypress', (e) => {
                if (e.key === 't' || e.key === 'T') {
                    this.testCommand();
                }
            });
        }
        
        // Text input fallback
        const textInput = document.getElementById('ai-text-input');
        const sendBtn = document.getElementById('ai-send-btn');
        
        if (sendBtn && textInput) {
            sendBtn.addEventListener('click', () => {
                const command = textInput.value.trim();
                if (command) {
                    this.statusText.textContent = `"${command}"`;
                    this.processCommand(command);
                    textInput.value = '';
                }
            });
            
            textInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    sendBtn.click();
                }
            });
        }
    }
    
    testCommand() {
        // Test command without speech recognition
        const testCommands = [
            "What's my tire pressure?",
            "Show me the fuel level",
            "Check oil life",
            "Navigate to the nearest gas station"
        ];
        const randomCommand = testCommands[Math.floor(Math.random() * testCommands.length)];
        
        this.statusText.textContent = `Testing: "${randomCommand}"`;
        this.processCommand(randomCommand);
    }
    
    startRecording() {
        if (this.recognition) {
            // Play sound effect
            if (window.soundManager) {
                window.soundManager.playBeep();
            }
            
            this.recognition.start();
        }
    }
    
    stopRecording() {
        if (this.recognition) {
            this.recognition.stop();
        }
        
        this.isRecording = false;
        this.recordBtn.classList.remove('recording');
        this.animateListening(false);
        
        // Reset status after a delay
        setTimeout(() => {
            if (!this.isRecording) {
                this.statusText.textContent = 'Tap to speak';
            }
        }, 3000);
    }
    
    animateListening(start) {
        if (start) {
            this.aiCircleOuter.style.animation = 'pulse-outer 1s ease-in-out infinite';
            this.aiCircleInner.style.animation = 'pulse-inner 1s ease-in-out infinite';
        } else {
            this.aiCircleOuter.style.animation = 'pulse-outer 2s ease-in-out infinite';
            this.aiCircleInner.style.animation = 'pulse-inner 2s ease-in-out infinite';
        }
    }
    
    async processCommand(command) {
        try {
            // Try to use Claude API first
            const response = await fetch('http://localhost:3001/api/ai-assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command })
            });
            
            if (response.ok) {
                const data = await response.json();
                
                // Speak Claude's response
                this.speak(data.response);
                this.statusText.textContent = 'Processing...';
                
                // Execute the suggested action
                if (data.action) {
                    setTimeout(() => {
                        this.executeAction(data.action, data.parameters);
                    }, 1000);
                }
            } else {
                // Fallback to local processing
                this.processCommandLocally(command);
            }
        } catch (error) {
            console.log('Claude API not available, using local processing');
            // Fallback to local command processing
            this.processCommandLocally(command);
        }
    }
    
    executeAction(action, parameters = {}) {
        switch(action) {
            case 'tire_pressure':
                this.executeTirePressureCommand();
                break;
            case 'fuel_level':
                this.executeFuelCommand();
                break;
            case 'oil_life':
                this.executeOilCommand();
                break;
            case 'odometer':
                this.executeOdometerCommand();
                break;
            case 'climate_set':
                if (parameters.temperature) {
                    this.executeClimateCommand(`set temperature to ${parameters.temperature} degrees`);
                }
                break;
            case 'music_play':
                this.executeMusicCommand();
                break;
            case 'navigate':
                this.executeNavigationCommand(parameters.destination || '');
                break;
            case 'home':
                this.executeHomeCommand();
                break;
        }
    }
    
    processCommandLocally(command) {
        // Local fallback processing
        if (command.includes('tire pressure') || command.includes('tyre pressure')) {
            this.executeTirePressureCommand();
        } else if (command.includes('fuel') || command.includes('gas')) {
            this.executeFuelCommand();
        } else if (command.includes('oil')) {
            this.executeOilCommand();
        } else if (command.includes('odometer') || command.includes('mileage')) {
            this.executeOdometerCommand();
        } else if (command.includes('temperature') || command.includes('climate')) {
            this.executeClimateCommand(command);
        } else if (command.includes('music') || command.includes('play')) {
            this.executeMusicCommand();
        } else if (command.includes('navigate') || command.includes('directions')) {
            this.executeNavigationCommand(command);
        } else if (command.includes('home')) {
            this.executeHomeCommand();
        } else {
            this.statusText.textContent = 'Command not recognized';
            this.speak('Sorry, I didn\'t understand that command.');
        }
    }
    
    executeTirePressureCommand() {
        this.statusText.textContent = 'Opening tire pressure...';
        this.speak('Checking tire pressure');
        
        // Open tire pressure overlay
        const overlay = document.getElementById('tire-pressure-overlay');
        if (overlay) {
            overlay.classList.add('active');
            
            // Update tire pressure values
            if (window.updateTirePressure) {
                window.updateTirePressure();
            }
        }
    }
    
    executeFuelCommand() {
        this.statusText.textContent = 'Opening fuel level...';
        this.speak('Checking fuel level');
        
        // Open fuel overlay
        const overlay = document.getElementById('fuel-overlay');
        if (overlay) {
            overlay.classList.add('active');
        }
    }
    
    executeOilCommand() {
        this.statusText.textContent = 'Opening oil life...';
        this.speak('Checking oil life');
        
        // Open oil overlay
        const overlay = document.getElementById('oil-overlay');
        if (overlay) {
            overlay.classList.add('active');
        }
    }
    
    executeOdometerCommand() {
        this.statusText.textContent = 'Opening odometer...';
        this.speak('Showing odometer');
        
        // Open odometer overlay
        const overlay = document.getElementById('odometer-overlay');
        if (overlay) {
            overlay.classList.add('active');
        }
    }
    
    executeClimateCommand(command) {
        // Extract temperature from command
        const tempMatch = command.match(/(\d+)\s*degrees?/);
        if (tempMatch) {
            const temperature = parseInt(tempMatch[1]);
            this.statusText.textContent = `Setting temperature to ${temperature}°F...`;
            this.speak(`Setting temperature to ${temperature} degrees`);
            
            // Navigate to climate screen
            this.navigateToScreen('climate');
            
            // Set temperature
            setTimeout(() => {
                const tempDisplays = document.querySelectorAll('.temp-value');
                tempDisplays.forEach(display => {
                    display.textContent = temperature + '°F';
                });
            }, 500);
        } else {
            this.navigateToScreen('climate');
            this.speak('Opening climate controls');
        }
    }
    
    executeMusicCommand() {
        this.statusText.textContent = 'Opening media player...';
        this.speak('Opening media player');
        this.navigateToScreen('media');
        
        // Auto-play music
        setTimeout(() => {
            const playBtn = document.querySelector('.main-btn');
            if (playBtn && !window.isPlaying) {
                playBtn.click();
            }
        }, 500);
    }
    
    executeNavigationCommand(command) {
        this.statusText.textContent = 'Opening navigation...';
        this.navigateToScreen('navigation');
        
        // Extract destination if mentioned
        if (command.includes('gas station') || command.includes('petrol station')) {
            this.speak('Finding nearest gas station');
            setTimeout(() => {
                const searchInput = document.querySelector('.search-input');
                if (searchInput) {
                    searchInput.value = 'gas station near me';
                    const searchBtn = document.querySelector('.search-btn');
                    if (searchBtn) searchBtn.click();
                }
            }, 500);
        } else {
            this.speak('Opening navigation');
        }
    }
    
    executeHomeCommand() {
        this.statusText.textContent = 'Going home...';
        this.speak('Going to home screen');
        this.navigateToScreen('home');
    }
    
    navigateToScreen(screenName) {
        // Find and click the appropriate nav button
        const navBtn = document.querySelector(`[data-screen="${screenName}"]`);
        if (navBtn) {
            navBtn.click();
        }
    }
    
    speak(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 0.8;
            
            // Try to use a female voice if available
            const voices = window.speechSynthesis.getVoices();
            const femaleVoice = voices.find(voice => 
                voice.name.includes('Female') || 
                voice.name.includes('Samantha') || 
                voice.name.includes('Victoria')
            );
            
            if (femaleVoice) {
                utterance.voice = femaleVoice;
            }
            
            window.speechSynthesis.speak(utterance);
        }
    }
}

// Initialize Audi AI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize when on AI screen
    const aiScreen = document.getElementById('audi-ai-screen');
    if (aiScreen) {
        // Initialize when navigating to AI screen
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            if (btn.getAttribute('data-screen') === 'audi-ai') {
                btn.addEventListener('click', () => {
                    if (!window.audiAI) {
                        window.audiAI = new AudiAI();
                    }
                });
            }
        });
    }
    
    // Make updateTirePressure globally accessible
    if (typeof updateTirePressure !== 'undefined') {
        window.updateTirePressure = updateTirePressure;
    }
});