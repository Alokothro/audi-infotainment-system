# API Key Setup

## Important: Protecting Your API Keys

This project uses API keys that should NEVER be committed to public repositories.

### Setup Instructions

1. **Create a `.env` file** in the root directory (if it doesn't exist)
2. **Add your API keys** to the `.env` file:

```env
CLAUDE_API_KEY=your_claude_api_key_here
PORT=3001
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

3. **Never commit the `.env` file** - it's already in `.gitignore`

### For Google Maps API

1. The API key is loaded dynamically from the server
2. Make sure your backend server is running (`npm run server`)
3. The frontend will fetch the API key from `http://localhost:3001/api/maps-key`

### For Production/Amplify Deployment

When deploying to AWS Amplify:

1. Go to your Amplify app in AWS Console
2. Navigate to "Environment variables"
3. Add these variables:
   - `CLAUDE_API_KEY`
   - `GOOGLE_MAPS_API_KEY`
   - `PORT` (if needed)

### Security Best Practices

- Restrict your Google Maps API key to specific domains
- Use different API keys for development and production
- Rotate keys regularly
- Monitor usage in Google Cloud Console

### If You See a Security Alert

If GitHub detects your API key:
1. Immediately revoke the exposed key
2. Generate a new key
3. Update your `.env` file
4. Never commit API keys directly in code