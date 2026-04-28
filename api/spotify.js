export default async function handler(req, res) {
  try {
    const client_id = process.env.SPOTIFY_CLIENT_ID;
    const client_secret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!client_id || !client_secret) {
      return res.status(500).json({
        error: "Missing environment variables",
      });
    }

    const { mood } = req.query;

    const queryMap = {
      Happy: "happy hits",
      Sad: "sad songs",
      Angry: "workout",
      Neutral: "chill",
      Surprise: "party",
    };

    const searchQuery = queryMap[mood] || "chill";

    // 🔑 STEP 1: Get access token
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${client_id}:${client_secret}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    // SAFELY PARSE RESPONSE
    const tokenText = await tokenRes.text();

    let tokenData;
    try {
      tokenData = JSON.parse(tokenText);
    } catch (err) {
      return res.status(500).json({
        error: "Spotify token response not JSON",
        raw: tokenText,
      });
    }

    const access_token = tokenData.access_token;

    if (!access_token) {
      return res.status(500).json({
        error: "No access token",
        details: tokenData,
      });
    }

    // 🎵 STEP 2: Search playlist
    const apiRes = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(
        searchQuery
      )}&type=playlist&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const apiText = await apiRes.text();

    let data;
    try {
      data = JSON.parse(apiText);
    } catch (err) {
      return res.status(500).json({
        error: "Spotify search response not JSON",
        raw: apiText,
      });
    }

    if (!data.playlists || !data.playlists.items.length) {
      return res.status(200).json({
        name: "No playlist found",
        url: "#",
      });
    }

    const playlist = data.playlists.items[0];

    return res.status(200).json({
      name: playlist.name,
      url: playlist.external_urls.spotify,
    });

  } catch (err) {
    return res.status(500).json({
      error: "Server crashed",
      message: err.message,
    });
  }
}
