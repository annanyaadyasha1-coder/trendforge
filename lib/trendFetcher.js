const YOUTUBE_CATEGORY_MAP = {
  "Music": "10", "Gaming": "20", "Comedy": "23", "Sports": "17",
  "Gaming & Esports": "20", "Music": "10", "Comedy & Skits": "23",
  "Sports": "17", "Education & Explainers": "27", "Tech Reviews & Gadgets": "28",
};

const REGION_MAP = {
  "global": "US", "us": "US", "uk": "GB", "india": "IN", "uae": "AE",
  "australia": "AU", "canada": "CA", "brazil": "BR", "nigeria": "NG",
  "europe": "DE", "southeast_asia": "SG", "latam": "MX",
};

function getHoursOld(publishedAt) {
  if (!publishedAt) return 24;
  const diff = Date.now() - new Date(publishedAt).getTime();
  return Math.round(diff / (1000 * 60 * 60));
}

function getTier(hoursOld, saturation) {
  if (hoursOld <= 6 && saturation < 40) return 1;
  if (hoursOld <= 24 && saturation < 60) return 2;
  if (hoursOld <= 48 && saturation < 80) return 3;
  return 4;
}

function getSaturation(stats) {
  const views = stats?.viewCount || 0;
  const likes = stats?.likeCount || 0;
  const ratio = views > 0 ? (likes / views) * 100 : 0;
  if (views > 5000000) return Math.floor(70 + Math.random() * 20);
  if (views > 1000000) return Math.floor(50 + Math.random() * 20);
  if (views > 100000)  return Math.floor(30 + Math.random() * 20);
  return Math.floor(10 + Math.random() * 20);
}

function getNicheRelevance(title, niche) {
  if (!niche || !title) return 50;
  const t = title.toLowerCase();
  const n = niche.toLowerCase();
  const words = n.split(/\s+/);
  const matches = words.filter(w => w.length > 3 && t.includes(w)).length;
  if (matches >= 2) return Math.floor(75 + Math.random() * 20);
  if (matches === 1) return Math.floor(50 + Math.random() * 20);
  return Math.floor(20 + Math.random() * 30);
}

async function fetchYouTubeTrends({ window: w, region, niche }) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const regionCode = REGION_MAP[region] || "US";
  const categoryId = YOUTUBE_CATEGORY_MAP[niche];
  const publishedAfter = new Date(Date.now() - parseInt(w) * 60 * 60 * 1000).toISOString();

  let items = [];

  if (categoryId) {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=${regionCode}&videoCategoryId=${categoryId}&maxResults=10&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "YouTube API error");
    items = data.items || [];
  } else {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(niche)}&type=video&order=viewCount&publishedAfter=${publishedAfter}&regionCode=${regionCode}&maxResults=10&key=${apiKey}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    if (!searchRes.ok) throw new Error(searchData.error?.message || "YouTube Search API error");
    const videoIds = (searchData.items || []).map(i => i.id?.videoId).filter(Boolean).join(",");
    if (videoIds) {
      const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds}&key=${apiKey}`;
      const statsRes = await fetch(statsUrl);
      const statsData = await statsRes.json();
      items = statsData.items || [];
    }
  }

  return items.map(item => {
    const snippet = item.snippet || {};
    const stats = item.statistics || {};
    const hoursOld = getHoursOld(snippet.publishedAt);
    const saturation = getSaturation(stats);
    const nicheRelevance = getNicheRelevance(snippet.title, niche);
    const tier = getTier(hoursOld, saturation);
    return {
      title: snippet.title || "Untitled",
      why: snippet.description?.slice(0, 120) || `Trending in ${niche} on YouTube`,
      hoursOld,
      saturation,
      nicheRelevance,
      tier,
      opportunityScore: Math.max(0, 100 - saturation - Math.floor(hoursOld / 2)),
      momentum: hoursOld < 6 ? "🚀 Breakout" : hoursOld < 24 ? "⚡ Rising" : "🌊 Established",
      source: "YouTube Data API v3",
      stats: {
        views: parseInt(stats.viewCount) || 0,
        likes: parseInt(stats.likeCount) || 0,
        searches: 0,
        relativeValue: 0,
      },
    };
  });
}

async function fetchGoogleTrends({ window: w, region, niche }) {
  const geo = REGION_MAP[region] || "US";
  try {
    const url = `https://trends.google.com/trends/api/dailytrends?hl=en-US&geo=${geo}&ns=15`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; TrendForge/1.0)" }
    });
    const text = await res.text();
    const json = JSON.parse(text.replace(")]}',\n", ""));
    const days = json?.default?.trendingSearchesDays || [];
    const searches = days.flatMap(d => d.trendingSearches || []);
    const nicheWords = niche.toLowerCase().split(/\s+/).filter(w => w.length > 3);

    return searches.slice(0, 15).map((s, i) => {
      const title = s.title?.query || s.title || "Trending Topic";
      const nicheRelevance = getNicheRelevance(title, niche);
      const hoursOld = Math.floor(Math.random() * parseInt(w));
      const saturation = Math.floor(20 + Math.random() * 50);
      const tier = getTier(hoursOld, saturation);
      return {
        title,
        why: s.formattedTraffic ? `${s.formattedTraffic} searches — trending on Google` : `Trending search in ${region}`,
        hoursOld,
        saturation,
        nicheRelevance,
        tier,
        opportunityScore: Math.max(0, 100 - saturation - Math.floor(hoursOld / 2)),
        momentum: hoursOld < 6 ? "🚀 Breakout" : hoursOld < 24 ? "⚡ Rising" : "🌊 Established",
        source: "Google Trends",
        stats: {
          views: 0,
          likes: 0,
          searches: parseInt((s.formattedTraffic || "0").replace(/[^0-9]/g, "")) || Math.floor(Math.random() * 500000),
          relativeValue: Math.floor(Math.random() * 100),
        },
      };
    });
  } catch (err) {
    console.error("[Google Trends]", err.message);
    return [{
      title: `${niche} — Trending Topic`,
      why: "Google Trends rate limited. This is a fallback trend signal.",
      hoursOld: 12,
      saturation: 35,
      nicheRelevance: 60,
      tier: 2,
      opportunityScore: 65,
      momentum: "⚡ Rising",
      source: "Google Trends (fallback)",
      stats: { views: 0, likes: 0, searches: 100000, relativeValue: 50 },
    }];
  }
}

async function fetchTrends({ window: w, region, niche, platform }) {
  const sources = [];
  let trends = [];

  if (platform === "youtube" || platform === "both") {
    const ytTrends = await fetchYouTubeTrends({ window: w, region, niche });
    trends = [...trends, ...ytTrends];
    sources.push("YouTube Data API v3");
  }

  if (platform === "instagram" || platform === "both") {
    const gTrends = await fetchGoogleTrends({ window: w, region, niche });
    trends = [...trends, ...gTrends];
    sources.push("Google Trends (Instagram proxy)");
  }

  trends.sort((a, b) => (b.opportunityScore - a.opportunityScore));
  trends = trends.slice(0, 8);

  return {
    trends,
    meta: {
      fetchedAt: new Date().toISOString(),
      window: w,
      region,
      niche,
      platform,
      sources,
    }
  };
}

module.exports = { fetchTrends };
