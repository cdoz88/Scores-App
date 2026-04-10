import express from "express";
import { createServer as createViteServer } from "vite";
import session from "express-session";
import axios from "axios";
import cors from "cors";
import path from "path";
import crypto from "crypto";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());
  
  // Set up session middleware for storing OAuth tokens
  app.use(session({
    secret: process.env.SESSION_SECRET || crypto.randomBytes(20).toString('hex'),
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      httpOnly: true,
    }
  }));

  // Yahoo OAuth Endpoints
  const YAHOO_CLIENT_ID = process.env.YAHOO_CLIENT_ID;
  const YAHOO_CLIENT_SECRET = process.env.YAHOO_CLIENT_SECRET;
  const REDIRECT_URI = process.env.APP_URL ? `${process.env.APP_URL}/auth/yahoo/callback` : `http://localhost:${PORT}/auth/yahoo/callback`;

  app.get('/api/auth/yahoo/url', (req, res) => {
    if (!YAHOO_CLIENT_ID) {
      return res.status(500).json({ error: 'YAHOO_CLIENT_ID is not configured' });
    }
    
    const params = new URLSearchParams({
      client_id: YAHOO_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      prompt: 'login',
    });
    
    const authUrl = `https://api.login.yahoo.com/oauth2/request_auth?${params.toString()}`;
    res.json({ url: authUrl });
  });

  app.get(['/auth/yahoo/callback', '/auth/yahoo/callback/'], async (req, res) => {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).send('Missing authorization code');
    }

    try {
      const tokenResponse = await axios.post('https://api.login.yahoo.com/oauth2/get_token', new URLSearchParams({
        client_id: YAHOO_CLIENT_ID!,
        client_secret: YAHOO_CLIENT_SECRET!,
        redirect_uri: REDIRECT_URI,
        code: code as string,
        grant_type: 'authorization_code'
      }).toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const { access_token, refresh_token, expires_in } = tokenResponse.data;
      
      // Store tokens in session
      (req.session as any).yahoo = {
        access_token,
        refresh_token,
        expires_at: Date.now() + expires_in * 1000
      };

      // Send success message to parent window and close popup
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'YAHOO_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error('Error exchanging code for token:', error.response?.data || error.message);
      res.status(500).send('Failed to authenticate with Yahoo');
    }
  });

  // Proxy endpoint for Yahoo Fantasy API
  app.get('/api/yahoo/*', async (req, res) => {
    const yahooSession = (req.session as any).yahoo;
    
    if (!yahooSession || !yahooSession.access_token) {
      return res.status(401).json({ error: 'Not authenticated with Yahoo' });
    }

    // Refresh token if expired
    if (Date.now() > yahooSession.expires_at) {
      try {
        const tokenResponse = await axios.post('https://api.login.yahoo.com/oauth2/get_token', new URLSearchParams({
          client_id: YAHOO_CLIENT_ID!,
          client_secret: YAHOO_CLIENT_SECRET!,
          redirect_uri: REDIRECT_URI,
          refresh_token: yahooSession.refresh_token,
          grant_type: 'refresh_token'
        }).toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });

        yahooSession.access_token = tokenResponse.data.access_token;
        yahooSession.refresh_token = tokenResponse.data.refresh_token;
        yahooSession.expires_at = Date.now() + tokenResponse.data.expires_in * 1000;
      } catch (error: any) {
        console.error('Error refreshing token:', error.response?.data || error.message);
        return res.status(401).json({ error: 'Failed to refresh Yahoo token' });
      }
    }

    const endpoint = req.params[0];
    const queryParams = new URLSearchParams(req.query as any).toString();
    const url = `https://fantasysports.yahooapis.com/fantasy/v2/${endpoint}${queryParams ? `?${queryParams}` : ''}`;

    try {
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${yahooSession.access_token}`,
          'Accept': 'application/json' // Yahoo supports JSON if we pass format=json, but let's see
        }
      });
      res.json(response.data);
    } catch (error: any) {
      console.error('Error fetching from Yahoo API:', error.response?.data || error.message);
      res.status(error.response?.status || 500).json(error.response?.data || { error: 'Failed to fetch from Yahoo API' });
    }
  });

  app.get('/api/auth/yahoo/status', (req, res) => {
    const yahooSession = (req.session as any).yahoo;
    res.json({ isAuthenticated: !!(yahooSession && yahooSession.access_token) });
  });

  app.post('/api/auth/yahoo/logout', (req, res) => {
    if ((req.session as any).yahoo) {
      delete (req.session as any).yahoo;
    }
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
