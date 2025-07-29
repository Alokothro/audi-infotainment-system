const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Claude client
const anthropic = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY,
});

// AI Assistant endpoint
app.post('/api/ai-assistant', async (req, res) => {
    try {
        const { command } = req.body;
        
        const message = await anthropic.messages.create({
            model: 'claude-3-sonnet-20240229',
            max_tokens: 1024,
            messages: [{
                role: 'user',
                content: `You are an Audi AI assistant integrated into a car's infotainment system. 
                         The user said: "${command}". 
                         
                         Available actions you can trigger:
                         - tire_pressure: Check tire pressure
                         - fuel_level: Show fuel level
                         - oil_life: Check oil life
                         - odometer: Show odometer
                         - climate_set: Set climate temperature (extract number)
                         - music_play: Play music
                         - navigate: Navigate somewhere
                         - home: Go to home screen
                         
                         Respond naturally as a helpful car assistant. Keep responses concise and conversational.
                         Return JSON with format: 
                         { 
                           "action": "action_name or null", 
                           "response": "your natural response",
                           "parameters": {} // any extracted parameters like temperature
                         }`
            }]
        });
        
        // Parse Claude's response
        const content = message.content[0].text;
        let aiResponse;
        
        try {
            aiResponse = JSON.parse(content);
        } catch (e) {
            // If Claude didn't return valid JSON, create a simple response
            aiResponse = {
                action: null,
                response: content,
                parameters: {}
            };
        }
        
        res.json(aiResponse);
    } catch (error) {
        console.error('Claude API error:', error);
        res.status(500).json({ 
            error: 'AI service temporarily unavailable',
            fallback: true 
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', ai: 'Claude' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Audi AI backend running on port ${PORT}`);
    console.log('Claude API key loaded:', process.env.CLAUDE_API_KEY ? 'Yes' : 'No');
});