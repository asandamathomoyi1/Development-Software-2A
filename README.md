# Digital Mental Health Platform

## Music feature with Spotify (no user auth)

This project includes a simple Spotify-based music feature that uses the Spotify Client Credentials flow. It does not require end-user OAuth login.

### Files
- `server.js` - Express server with new Spotify routes:
  - `/spotify/search?q=...` - search Spotify tracks
  - `/spotify/track/:id` - fetch track metadata
- `music_feature/music.html` - frontend search UI
- `music_feature/music.js` - client script for search and preview playback
- `music_feature/musicstyle.css` - UI styling

### Required environment variables
Create a `.env` file in the project root or set these in your environment:

```env
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

If you are using other features already, also keep the existing env vars such as:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password
GOOGLE_CLIENT_ID=your_google_client_id
GEMINI_API_KEY=your_gemini_api_key
ADMIN_USER=admin
ADMIN_PASS=admin123
```

### Run the app

Install dependencies (if not already installed):

```bash
npm install
```

Start the server:

```bash
npm start
```

Open the music UI in your browser:

```text
http://localhost:3001/music_feature/music.html
```

### Notes
- The Spotify client credentials flow only supports public Spotify data and preview URLs.
- If a track has no `preview_url`, the UI opens the track in Spotify instead.
