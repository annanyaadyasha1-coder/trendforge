// pages/api/competitorVideos.js
// Fetches real competing videos from YouTube API for a given trend
// Shows creators exactly what they're up against

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "YOUTUBE_API_KEY not configured" });

  const { trendTitle, region = "IN", maxResults = 5 } = req.query;
  if (!trendTitle) return res.status(400).json({ error: "trendTitle required" });

  const regionCode = region === "india" ? "IN" : region.toUpperCase().slice(0, 2);
  const publishedAfter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  try {
    // Search for real competing videos
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(trendTitle)}&type=video&order=viewCount&publishedAfter=${publishedAfter}&regionCode=${regionCode}&maxResults=${maxResults}&key=${apiKey}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchRes.ok) throw new Error(searchData.error?.message || "YouTube search failed");

    const videoIds = (searchData.items || [])
      .map(i => i.id?.videoId)
      .filter(Boolean)
      .join(",");

    if (!videoIds) return res.status(200).json({ videos: [] });

    // Get stats for those videos
    const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds}&key=${apiKey}`;
    const statsRes = await fetch(statsUrl);
    const statsData = await statsRes.json();

    const videos = (statsData.items || []).map(item => ({
      id: item.id,
      title: item.snippet?.title || "",
      channel: item.snippet?.channelTitle || "",
      publishedAt: item.snippet?.publishedAt || "",
      thumbnail: item.snippet?.thumbnails?.medium?.url || "",
      views: parseInt(item.statistics?.viewCount || 0),
      likes: parseInt(item.statistics?.likeCount || 0),
      comments: parseInt(item.statistics?.commentCount || 0),
      url: `https://youtube.com/watch?v=${item.id}`,
      hoursOld: Math.round((Date.now() - new Date(item.snippet?.publishedAt).getTime()) / (1000 * 60 * 60)),
    })).sort((a, b) => b.views - a.views);

    return res.status(200).json({ videos });
  } catch (err) {
    console.error("[/api/competitorVideos]", err.message);
    return res.status(500).json({ error: err.message });
  }
}
