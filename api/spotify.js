export default async function handler(req, res) {
  const client_id = process.env.SPOTIFY_CLIENT_ID;
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET;

  const { mood } = req.query;

  const queryMap = {
    Happy: "happy hits",
    Sad: "sad songs",
    Angry: "workout",
    Neutral: "chill",
    Surprise: "party"
  };

  const searchQuery = queryMap[mood] || "chill";

  // 🔑 Step 1: Get access token
  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Authorization":
        "Basic " + Buffer.from(client_id + ":" + client_secret).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });

  const tokenData = await tokenRes.json();
  const access_token = tokenData.access_token;

  // 🎵 Step 2: Search playlist
  const apiRes = await fetch(
    `https://api.spotify.com/v1/search?q=${searchQuery}&type=playlist&limit=1`,
    {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    }
  );

  const data = await apiRes.json();

  if (!data.playlists.items.length) {
    return res.status(200).json({ name: "No playlist", url: "#" });
  }

  const playlist = data.playlists.items[0];

  res.status(200).json({
    name: playlist.name,
    url: playlist.external_urls.spotify
  });
}
