const { fetchTrends } = require("../../lib/trendFetcher");
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.YOUTUBE_API_KEY) {
    return res.status(500).json({
      error: "YOUTUBE_API_KEY is not set.",
      hint: "Add it to your Vercel environment variables."
    });
  }
  const { window: w = "24", region = "global", niche = "", platform = "youtube" } = req.query;
  if (!["6","24","48"].includes(w)) {
    return res.status(400).json({ error: `Invalid window "${w}". Must be 6, 24, or 48.` });
  }
  const cacheKey = `${w}:${region}:${niche}:${platform}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    res.setHeader("X-Cache", "HIT");
    return res.status(200).json(cached.data);
  }
  try {
    const result = await fetchTrends({ window: w, region, niche, platform });
    cache.set(cacheKey, { data: result, ts: Date.now() });
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Cache", "MISS");
    return res.status(200).json(result);
  } catch (err) {
    console.error("[/api/trends]", err.message);
    const isQuota = err.message.toLowerCase().includes("quota");
    return res.status(500).json({
      error: err.message,
      hint: isQuota
        ? "YouTube API quota exceeded. Resets every 24h."
        : err.message.includes("KEY")
        ? "Check your YOUTUBE_API_KEY in Vercel environment variables."
        : "Trend fetch failed. Check server logs.",
    });
  }
}
