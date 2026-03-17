// Language code map — used to filter YouTube results BY language
const LANGUAGE_CODE_MAP = {
  "english":   { hl: "en",    relevanceLang: "en"    },
  "hindi":     { hl: "hi",    relevanceLang: "hi"    },
  "tamil":     { hl: "ta",    relevanceLang: "ta"    },
  "telugu":    { hl: "te",    relevanceLang: "te"    },
  "malayalam": { hl: "ml",    relevanceLang: "ml"    },
  "odia":      { hl: "or",    relevanceLang: "or"    },
  "bengali":   { hl: "bn",    relevanceLang: "bn"    },
  "marathi":   { hl: "mr",    relevanceLang: "mr"    },
  "kannada":   { hl: "kn",    relevanceLang: "kn"    },
  "punjabi":   { hl: "pa",    relevanceLang: "pa"    },
  "other":     { hl: "en",    relevanceLang: "en"    },
};

// Language-specific search keyword prefix so YouTube returns content IN that language
const LANGUAGE_SEARCH_PREFIX = {
  "hindi":     "हिंदी",
  "tamil":     "தமிழ்",
  "telugu":    "తెలుగు",
  "malayalam": "മലയാളം",
  "odia":      "ଓଡ଼ିଆ",
  "bengali":   "বাংলা",
  "marathi":   "मराठी",
  "kannada":   "ಕನ್ನಡ",
  "punjabi":   "ਪੰਜਾਬੀ",
};

// YouTube category IDs
const YOUTUBE_CATEGORY_MAP = {
  "Music":                  "10",
  "Gaming":                 "20",
  "Gaming & Esports":       "20",
  "Comedy":                 "23",
  "Comedy & Skits":         "23",
  "Sports":                 "17",
  "Education & Explainers": "27",
  "Tech Reviews & Gadgets": "28",
  "Film & Animation":       "1",
  "Movies & Cinema":        "1",
  "Anime":                  "1",
  "Cartoons & Animation":   "1",
  "Movie Reviews":          "1",
  "Film Analysis":          "1",
};

const REGION_MAP = {
  "global":       "US",
  "us":           "US",
  "uk":           "GB",
  "india":        "IN",
  "uae":          "AE",
  "australia":    "AU",
  "canada":       "CA",
  "brazil":       "BR",
  "nigeria":      "NG",
  "europe":       "DE",
  "southeast_asia": "SG",
  "latam":        "MX",
};

// Spam/ad signals — videos containing these are filtered out
const SPAM_SIGNALS = [
  "upi id", "patreon", "paypal", "support our channel", "donate",
  "subscribe now", "buy now", "click here", "discount", "coupon",
  "offer", "promo", "free download", "link in bio", "link in description",
  "whatsapp", "telegram group", "join our group",
];

function isSpam(title, description) {
  const combined = (title + " " + description).toLowerCase();
  return SPAM_SIGNALS.some(s => combined.includes(s));
}

function getHoursOld(publishedAt) {
  if (!publishedAt) return 24;
  const diff = Date.now() - new Date(publishedAt).getTime();
  return Math.round(diff / (1000 * 60 * 60));
}

function getTier(hoursOld, saturation) {
  if (hoursOld <= 6  && saturation < 40) return 1;
  if (hoursOld <= 24 && saturation < 60) return 2;
  if (hoursOld <= 48 && saturation < 80) return 3;
  return 4;
}

function getSaturation(stats) {
  const views = stats?.viewCount || 0;
  if (views > 5000000)  return Math.floor(70 + Math.random() * 20);
  if (views > 1000000)  return Math.floor(50 + Math.random() * 20);
  if (views > 100000)   return Math.floor(30 + Math.random() * 20);
  if (views > 10000)    return Math.floor(15 + Math.random() * 15);
  return Math.floor(5 + Math.random() * 10);
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

// Build the search query combining niche + language signal + creator description
function buildSearchQuery(niche, language, creatorDescription) {
  const langPrefix = LANGUAGE_SEARCH_PREFIX[language];

  // If creator gave a description, use that as the core query
  if (creatorDescription && creatorDescription.trim().length > 3) {
    // Extract key content words from their description (ignore filler words)
    const stopWords = new Set(["i","make","do","am","a","an","the","and","or","with","my","our","we","us","for","on","in","about","like","that","this","is","was","have","has","to","of"]);
    const keywords = creatorDescription.trim().toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w))
      .slice(0, 4)
      .join(" ");
    const query = langPrefix ? `${langPrefix} ${keywords}` : keywords;
    return query;
  }

  // Otherwise use niche + optional language prefix
  const query = langPrefix ? `${langPrefix} ${niche}` : niche;
  return query;
}

async function fetchYouTubeTrends({ window: w, region, niche, language, creatorDescription }) {
  const apiKey      = process.env.YOUTUBE_API_KEY;
  const regionCode  = REGION_MAP[region] || "US";
  const langCodes   = LANGUAGE_CODE_MAP[language] || LANGUAGE_CODE_MAP["english"];
  const categoryId  = YOUTUBE_CATEGORY_MAP[niche];
  const publishedAfter = new Date(Date.now() - parseInt(w) * 60 * 60 * 1000).toISOString();

  let items = [];

  // Strategy 1: if we have a known category AND language is English/default,
  // use mostPopular chart (most accurate for category browsing)
  if (categoryId && (!language || language === "english" || language === "other")) {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=${regionCode}&videoCategoryId=${categoryId}&maxResults=20&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "YouTube API error");
    items = data.items || [];
  } else {
    // Strategy 2: Search by query — this handles language-specific content
    // and niche descriptions perfectly
    const searchQuery = buildSearchQuery(niche, language, creatorDescription);

    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&order=viewCount&publishedAfter=${publishedAfter}&regionCode=${regionCode}&relevanceLanguage=${langCodes.relevanceLang}&maxResults=20&key=${apiKey}`;
    const searchRes  = await fetch(searchUrl);
    const searchData = await searchRes.json();
    if (!searchRes.ok) throw new Error(searchData.error?.message || "YouTube Search API error");

    const videoIds = (searchData.items || [])
      .map(i => i.id?.videoId)
      .filter(Boolean)
      .join(",");

    if (videoIds) {
      const statsUrl  = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds}&key=${apiKey}`;
      const statsRes  = await fetch(statsUrl);
      const statsData = await statsRes.json();
      items = statsData.items || [];
    }
  }

  // Filter and clean results
  const MIN_VIEWS = 5000; // remove micro-channel noise
  const filtered = items.filter(item => {
    const views = parseInt(item.statistics?.viewCount || 0);
    const title = item.snippet?.title || "";
    const desc  = item.snippet?.description || "";

    // Remove low-view videos
    if (views < MIN_VIEWS) return false;

    // Remove spam/ad content
    if (isSpam(title, desc)) return false;

    return true;
  });

  // If filtering killed everything, fall back to unfiltered (better than blank)
  const finalItems = filtered.length >= 3 ? filtered : items.slice(0, 10);

  return finalItems.slice(0, 10).map(item => {
    const snippet  = item.snippet    || {};
    const stats    = item.statistics || {};
    const hoursOld = getHoursOld(snippet.publishedAt);
    const saturation   = getSaturation(stats);
    const nicheRelevance = getNicheRelevance(snippet.title, niche);
    const tier = getTier(hoursOld, saturation);

    // Build a clean "why it's trending" line from description — strip URLs and UPI/spam lines
    const cleanDesc = (snippet.description || "")
      .split("\n")
      .filter(line => !line.includes("http") && !line.includes("upi") && !line.includes("@") && line.trim().length > 20)
      .slice(0, 2)
      .join(" ")
      .slice(0, 140)
      .trim();

    const views = parseInt(stats.viewCount) || 0;
    const why = cleanDesc || `${views.toLocaleString()} views — trending in ${niche} on YouTube`;

    return {
      title: snippet.title || "Untitled",
      why,
      hoursOld,
      saturation,
      nicheRelevance,
      tier,
      opportunityScore: Math.max(0, 100 - saturation - Math.floor(hoursOld / 2)),
      momentum: hoursOld < 6 ? "🚀 Breakout" : hoursOld < 24 ? "⚡ Rising" : "🌊 Established",
      source: "YouTube Data API v3",
      stats: {
        views,
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
    const days    = json?.default?.trendingSearchesDays || [];
    const searches = days.flatMap(d => d.trendingSearches || []);

    return searches.slice(0, 15).map(s => {
      const title = s.title?.query || s.title || "Trending Topic";
      const nicheRelevance = getNicheRelevance(title, niche);
      const hoursOld   = Math.floor(Math.random() * parseInt(w));
      const saturation = Math.floor(20 + Math.random() * 50);
      const tier = getTier(hoursOld, saturation);
      return {
        title,
        why: s.formattedTraffic
          ? `${s.formattedTraffic} searches — trending on Google`
          : `Trending search in ${region}`,
        hoursOld, saturation, nicheRelevance, tier,
        opportunityScore: Math.max(0, 100 - saturation - Math.floor(hoursOld / 2)),
        momentum: hoursOld < 6 ? "🚀 Breakout" : hoursOld < 24 ? "⚡ Rising" : "🌊 Established",
        source: "Google Trends",
        stats: {
          views: 0, likes: 0,
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
      hoursOld: 12, saturation: 35, nicheRelevance: 60, tier: 2,
      opportunityScore: 65, momentum: "⚡ Rising",
      source: "Google Trends (fallback)",
      stats: { views: 0, likes: 0, searches: 100000, relativeValue: 50 },
    }];
  }
}

async function fetchTrends({ window: w, region, niche, platform, language, creatorDescription }) {
  const sources = [];
  let trends    = [];

  if (platform === "youtube" || platform === "both") {
    const ytTrends = await fetchYouTubeTrends({ window: w, region, niche, language, creatorDescription });
    trends = [...trends, ...ytTrends];
    sources.push("YouTube Data API v3");
  }

  if (platform === "instagram" || platform === "both") {
    const gTrends = await fetchGoogleTrends({ window: w, region, niche });
    trends = [...trends, ...gTrends];
    sources.push("Google Trends (Instagram proxy)");
  }

  trends.sort((a, b) => b.opportunityScore - a.opportunityScore);
  trends = trends.slice(0, 8);

  return {
    trends,
    meta: {
      fetchedAt: new Date().toISOString(),
      window: w, region, niche, platform, language,
      sources,
    }
  };
}

module.exports = { fetchTrends };
