import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();
const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Spotify backend is running!");
});

// Step 1: Redirect user to Spotify login
app.get("/login", (req, res) => {
    const scopes = [
      "user-read-private",
      "user-read-email",
      "user-top-read",
      "playlist-read-private",
      "user-read-playback-state"
    ].join(" ");
  
    const queryParams = new URLSearchParams({
      client_id: process.env.CLIENT_ID,
      response_type: "code",
      redirect_uri: process.env.REDIRECT_URI,
      scope: scopes,
    });
  
    res.redirect("https://accounts.spotify.com/authorize?" + queryParams.toString());
  });
  
  // Step 2: Handle callback and exchange code for token
  app.get("/callback", async (req, res) => {
    const code = req.query.code;
  
    try {
      const response = await axios.post(
        "https://accounts.spotify.com/api/token",
        new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: process.env.REDIRECT_URI,
          client_id: process.env.CLIENT_ID,
          client_secret: process.env.CLIENT_SECRET,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
  
      const { access_token, refresh_token, expires_in } = response.data;
  
      res.json({
        access_token,
        refresh_token,
        expires_in,
      });
  
    } catch (err) {
      console.error("Error exchanging code for token:", err.response?.data || err.message);
      res.status(500).json({ error: "Token exchange failed" });
    }
  });

  app.get("/me", async (req, res) => {
    const access_token = req.headers.authorization?.split(" ")[1];
  
    if (!access_token) {
      return res.status(401).json({ error: "Missing access token" });
    }
  
    try {
      const response = await axios.get("https://api.spotify.com/v1/me", {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
  
      res.json(response.data);
    } catch (err) {
      console.error("Error fetching profile:", err.response?.data || err.message);
      res.status(500).json({ error: "Failed to fetch user profile" });
    }
  });

app.listen(PORT, () => {
  console.log(`Server is running at http://127.0.0.1:${PORT}`);
});
