const TIER_LABELS = {
  1: "TIER 1 · FIRST MOVER",
  2: "TIER 2 · SWEET SPOT",
  3: "TIER 3 · LATE WAVE",
  4: "TIER 4 · FADING",
};

const STAGE_NOTES = {
  starter: "This creator is a BEGINNER with 0-500 followers. Keep advice simple, phone-camera only, warm encouraging tone. No complex editing advice.",
  growing: "This creator is GROWING with 500-10K followers. Push consistency, series formats, community engagement, and building habits.",
  scaling: "This creator is SCALING at 10K+ followers. Focus on differentiation, trend leadership, owning a niche angle, and leveraging existing audience.",
};

const PLATFORM_CTX = {
  "YouTube": {
    label:"YouTube", format:"YouTube video", shortForm:"YouTube Shorts (under 60s)",
    hashStyle:"YouTube hashtags (3–5 max, niche-specific)",
    algoNote:"YouTube algorithm: optimise title, thumbnail CTR, watch time, and comment velocity.",
    dataNote:"Trend sourced from YouTube Data API v3 — native real-time data.",
  },
  "Instagram Reels": {
    label:"Instagram Reels", format:"Instagram Reel (15–90 seconds)", shortForm:"Instagram Reel (15–30s for maximum reach)",
    hashStyle:"Instagram hashtags (5–10, mix of niche + broad + location)",
    algoNote:"Instagram Reels algorithm: hook in first 2s, high save rate, share to Stories. Audio choice is critical for Reels discovery.",
    dataNote:"Trend detected via Google Search interest spike — a strong proxy for Instagram trends since Instagram has no public trending API.",
  },
  "YouTube & Instagram": {
    label:"YouTube & Instagram Reels", format:"YouTube video AND Instagram Reel", shortForm:"cross-post: YouTube Shorts + Instagram Reel",
    hashStyle:"hashtags for both platforms (YouTube: 3–5 niche tags, Instagram: 8–12 mix)",
    algoNote:"Optimise for both: YouTube needs strong title + thumbnail, Instagram needs a hook in first 2 seconds and trending audio.",
    dataNote:"YouTube trend via YouTube Data API (native). Instagram signal via Google Trends proxy — directional, not Instagram-native.",
  },
};

function getPlatformCtx(platform) {
  if (platform?.toLowerCase().includes("instagram") && platform?.toLowerCase().includes("youtube")) return PLATFORM_CTX["YouTube & Instagram"];
  if (platform?.toLowerCase().includes("instagram")) return PLATFORM_CTX["Instagram Reels"];
  return PLATFORM_CTX["YouTube"];
}

// ─── SERVER-SIDE RESEARCH CACHE ───────────────────────────────────────────────
// Research is stored here after the research call so section calls never need
// to send the full research text in the request body — they just send a cacheKey.
const researchCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 min

function getCacheKey(trendTitle, niche) {
  return `${trendTitle}::${niche}`.slice(0, 100);
}

function buildContext(trend, platform, niche, region, creatorStage, language, research) {
  const tier = trend.tier || 2;
  const pc   = getPlatformCtx(platform);
  const lang = language || "English";
  return {
    tier, tierLabel: TIER_LABELS[tier] || TIER_LABELS[2],
    stageNote: STAGE_NOTES[creatorStage] || STAGE_NOTES.starter,
    stageLabel: creatorStage, platform: pc.label, format: pc.format,
    shortForm: pc.shortForm, hashStyle: pc.hashStyle, algoNote: pc.algoNote,
    dataNote: pc.dataNote, niche, region, language: lang,
    research: research || "",
    trendTitle: trend.title || "",
    base: [
      `Platform: ${pc.label}`,
      `Content Format: ${pc.format}`,
      `Niche: ${niche}`,
      `Region: ${region}`,
      `Creator Stage: ${creatorStage}`,
      `Trend: "${trend.title}"`,
      `Tier: ${tier} (${TIER_LABELS[tier]})`,
      `Saturation: ${trend.saturation}%`,
      `Hours Old: ~${trend.hoursOld}h`,
      `Why it's hot: ${trend.why}`,
      `Niche Relevance: ${trend.nicheRelevance}%`,
      `Data Source: ${pc.dataNote}`,
      `OUTPUT LANGUAGE: You MUST write every single word of your response in ${lang}. No English unless ${lang} is English. This is mandatory.`,
    ].join(" | "),
  };
}

// ─── RESEARCH ENGINE ──────────────────────────────────────────────────────────
async function researchTrend(trend, niche, platform, region, language, apiKey) {
  const researchPrompt = `Research "${trend.title}" and give a tight content intelligence brief. Max 350 words.

Context: Platform=${platform}, Niche=${niche}, Region=${region}, Language=${language}, Trend age=~${trend.hoursOld}h, Saturation=${trend.saturation}%

Answer these 6 points — 2-3 sentences each, brutally specific:

1. WHAT'S HAPPENING: Exact story/event driving this trend. Real facts.
2. AUDIENCE EMOTION: What specific feeling is this triggering? What phrases keep appearing?
3. OVERSATURATED: What are ALL creators already doing? Be specific.
4. UNCLAIMED ANGLE for "${niche}": One angle nobody has taken. Creative and specific.
5. VIRAL DETAIL: Single most surprising/specific fact that would stop a scroll.
6. WINNING FORMAT: What format is winning for this trend on ${platform} right now?`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 500,
        messages: [
          { role: "system", content: "You are a content intelligence analyst. Be hyper-specific and concise. Max 350 words. No generic advice." },
          { role: "user", content: researchPrompt },
        ],
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Research failed");
    return data.choices?.[0]?.message?.content || "";
  } catch (err) {
    console.error("[researchTrend]", err.message);
    return "";
  }
}

// ─── CONTENT SECTIONS ─────────────────────────────────────────────────────────
const SECTIONS = {
  trendBrief: {
    sys: c => `You are a trend strategist for everyday ${c.platform} creators. Plain text only. No markdown. Max 150 words. ${c.stageNote} CRITICAL: Respond entirely in ${c.language}.`,
    usr: c => `${c.base}\n\nRESEARCH INTEL:\n${c.research}\n\nWrite a punchy Trend Brief for a "${c.niche}" creator:\n(1) What is SPECIFICALLY happening with this trend — real details\n(2) The specific emotional driver making it blow up\n(3) The exact personal angle a "${c.niche}" creator should take — NOT news coverage, but their real life connected to this trend\n(4) One specific detail from the research that gives an edge\nNo generic advice. Every sentence must be about THIS trend.`,
  },
  videoIdeas: {
    sys: c => `You are a viral ${c.platform} content strategist. Plain text only. Max 220 words. ${c.stageNote} CRITICAL: Respond entirely in ${c.language}.`,
    usr: c => `${c.base}\n\nRESEARCH INTEL:\n${c.research}\n\nGive exactly 3 ${c.format} ideas for a "${c.niche}" creator. Avoid oversaturated angles from research. Find unclaimed territory.\n\nRules:\n- Connect trend to "${c.niche}" personal life naturally\n- Each idea references a SPECIFIC detail from the trend\n- Number 1-2-3. Each: TITLE IN CAPS (under 65 chars) + personal angle + why it performs.\nIdea 1=smart/safe. Idea 2=unexpected. Idea 3=highest viral potential.`,
  },
  viralHooks: {
    sys: c => `You are a viral ${c.platform} hook writer for casual creators. Plain text. Numbered list only. Max 180 words. ${c.stageNote} CRITICAL: Respond entirely in ${c.language}.`,
    usr: c => `${c.base}\n\nRESEARCH INTEL:\n${c.research}\n\nWrite exactly 5 viral hooks for a "${c.niche}" creator. First words of the video. Casual, personal, real — NOT news reporting.\n\nOne sentence each. Number 1-5. Each on its own line. Just the hook, no explanation.\n\n1. Promise payoff — tease the specific surprising detail, revealed at end\n2. Personal problem — specific tension between this trend and "${c.niche}" life\n3. Raw real opener — what the "${c.niche}" audience is ACTUALLY feeling right now\n4. Specific fact — most surprising thing the research found\n5. Conflict/tension — the specific controversy happening right now\n\nReal person tone. One sentence only per hook.`,
  },
  captions: {
    sys: c => `You are a ${c.platform} caption expert for everyday creators. Plain text only. Max 220 words. ${c.stageNote} CRITICAL: Respond entirely in ${c.language}.`,
    usr: c => `${c.base}\n\nRESEARCH INTEL:\n${c.research}\n\nWrite 2 captions for a "${c.niche}" creator. Tease payoff, never give it away.\n\nCAPTION 1 (30-50 words): Hook on the specific emotion this trend triggers. Promise something surprising. Personal to "${c.niche}" life. End with a question the audience is actually asking. + ${c.hashStyle}\n\nCAPTION 2 (80-100 words): Open with the specific tension/controversy from research. Build to the "${c.niche}" personal angle. Reference a specific detail mid-way. End with a question mirroring the real audience conversation. Raw and genuine tone. + region hashtags for ${c.region}.`,
  },
  script: {
    sys: c => `You are a scriptwriter for casual ${c.platform} creators. Write like a real person talking to their phone. NOT a journalist. Plain text. Max 280 words. ${c.stageNote} CRITICAL: Respond entirely in ${c.language}.`,
    usr: c => `${c.base}\n\nRESEARCH INTEL (use specific details from here):\n${c.research}\n\nWrite a complete ${c.shortForm} script for a "${c.niche}" creator. PSEUDO RETENTION FRAMEWORK. Personal, casual — NOT a news report.\n\nThe trend is the BACKDROP. The creator's "${c.niche}" life IS the story. Use SPECIFIC details from research.\n\n[HOOK 0:00-0:05] — specific/surprising detail from research. Promise payoff. Personal. Casual.\n[CONFLICT 0:05-0:20] — specific tension this trend creates for a "${c.niche}" creator personally. Real emotional driver.\n[MIDDLE 0:20-0:45] — personal story connecting trend to "${c.niche}" life. Drop the unclaimed angle. Keep payoff hidden.\n[TENSION 0:45-0:55] — specific controversy/unresolved question from research. Viewer can't predict end.\n[SHOCKING END 0:55-1:00] — deliver the payoff using the most specific research detail. Soft natural CTA.\n\nSound like a real person. Natural to say aloud.`,
  },
  visualIdeas: {
    sys: c => `You are a ${c.platform} creative director for everyday creators. Plain text only. Max 200 words. ${c.stageNote} CRITICAL: Respond entirely in ${c.language}.`,
    usr: c => `${c.base}\n\nRESEARCH INTEL:\n${c.research}\n\nDescribe 5 specific visual shots for a "${c.niche}" creator. Each shot references something SPECIFIC about this trend. Label Shot 1-5. Camera, angle, background, props, lighting. Smartphone achievable. Consider what format is winning for this trend on ${c.platform}.`,
  },
  shootingDirection: {
    sys: c => `You are a ${c.platform} production coach. Plain text. Max 210 words. ${c.stageNote} CRITICAL: Respond entirely in ${c.language}.`,
    usr: c => `${c.base}\n\nRESEARCH INTEL:\n${c.research}\n\nShooting guide for a "${c.niche}" creator on this trend. Use research on winning format.\n\n1) Best time to shoot — is this fast-moving (shoot NOW) or slower?\n2) Camera angle matching the winning format from research\n3) Lighting — simple at-home\n4) Background fitting both "${c.niche}" content AND this trend's tone\n5) What to wear — matches "${c.niche}" energy for THIS trend\n6) Editing tip specific to the winning format\n7) Best upload time for ${c.platform} in ${c.region}`,
  },
  competitorGap: {
    sys: c => `You are a competitive content strategist. Plain text only. Max 190 words. ${c.stageNote} CRITICAL: Respond entirely in ${c.language}.`,
    usr: c => `${c.base}\n\nRESEARCH INTEL:\n${c.research}\n\nCompetitor gap analysis for a "${c.niche}" creator on "${c.trendTitle}":\n\n(1) THE FLOOD ZONE: What exact angles are EVERY creator already doing? Be specific.\n(2) UNCLAIMED ANGLE: The specific angle a "${c.niche}" creator can own right now. Why is it unclaimed?\n(3) UNDERUSED FORMAT: Biggest gap between what's winning vs what everyone is doing.\n(4) IGNORED AUDIENCE: Specific sub-audience deeply invested in this trend but being ignored.\n\nEvery answer must be specific to this trend, not general.`,
  },
  audioFormat: {
    sys: c => `You are a ${c.platform} algorithm and format expert. Plain text only. Max 180 words. ${c.stageNote} CRITICAL: Respond entirely in ${c.language}.`,
    usr: c => `${c.base}\n\nRESEARCH INTEL:\n${c.research}\n\nFormat and algorithm intel for a "${c.niche}" creator on ${c.platform}:\n\n(1) Best format for this specific trend — what's winning per research and why for this niche\n(2) Ideal length — based on what's working for this trend, not generic\n(3) Thumbnail/cover — specific visual element from this trend that gets highest CTR\n(4) Audio tone matching this trend's emotional driver. ${c.algoNote}\n(5) One algorithm tip specific to how THIS trend is spreading on ${c.platform} right now`,
  },
  performancePrediction: {
    sys: c => `You are a ${c.platform} performance analyst. Plain text only. Max 170 words. ${c.stageNote} CRITICAL: Respond entirely in ${c.language}.`,
    usr: c => `${c.base}\n\nRESEARCH INTEL:\n${c.research}\n\nPerformance prediction for a ${c.stageLabel} "${c.niche}" creator posting about "${c.trendTitle}" now:\n\n(1) View/reach range in first 48h — factor in ${trend.saturation}% saturation and current momentum\n(2) Subscriber conversion estimate — based on this trend's audience engagement level\n(3) ONE variable determining overperformance — specific to this trend's dynamics\n(4) ONE biggest risk — specific to where this trend is in its lifecycle\n(5) Honest expectation for a beginner + what ceiling looks like if they nail the unclaimed angle`,
  },
  calendar: {
    sys: c => `You are a ${c.platform} content calendar strategist. Plain text only. Max 250 words. ${c.stageNote} CRITICAL: Respond entirely in ${c.language}.`,
    usr: c => `${c.base}\n\nRESEARCH INTEL:\n${c.research}\n\n7-day calendar for a "${c.niche}" creator riding "${c.trendTitle}" on ${c.platform}. Time content around trend momentum window.\n\nDay 1: Main video using the unclaimed angle from research\nDay 2: Behind-the-scenes / react to Day 1 comments\nDay 3: The specific debate/question the audience is having about this trend\nDay 4: How this trend hits different for "${c.niche}" specifically\nDay 5: Collab angle — what creator type complements this for "${c.niche}"?\nDay 6: Deeper personal story this trend unlocked\nDay 7: Results / what surprised me\n\nFor each: punchy title (under 65 chars) + best post time for ${c.region} + one line why it works.`,
  },
  youtubeTitles: {
    sys: c => `You are a YouTube SEO and title expert. Plain text only. Max 200 words. ${c.stageNote} CRITICAL: Respond entirely in ${c.language}.`,
    usr: c => `${c.base}\n\nRESEARCH INTEL:\n${c.research}\n\nWrite exactly 5 YouTube titles for a "${c.niche}" creator. Reference SPECIFIC details/emotions from research. Avoid oversaturated angles.\n\nRules: Under 70 chars each. Use phrases/emotional triggers the audience is actually using. Feel researched, not templated.\n\n1: Most searchable — exact search terms people are typing now\n2: Curiosity/emotion — triggers the specific emotion this trend creates\n3: Personal story — the specific "${c.niche}" angle\n4: Bold/contrarian — challenges the most common take\n5: Highest viral potential — uses the most surprising specific detail from research`,
  },
  youtubeDescription: {
    sys: c => `You are a YouTube SEO expert. Plain text only. Max 300 words. ${c.stageNote} CRITICAL: Respond entirely in ${c.language}.`,
    usr: c => `${c.base}\n\nRESEARCH INTEL:\n${c.research}\n\nTwo YouTube descriptions for a "${c.niche}" creator. Use specific details from research — prove the creator knows this trend deeply.\n\nSHORTS DESCRIPTION (50-80 words): Open with specific hook/emotion from research. Reference one specific trend detail. CTA + 5-8 hashtags including #Shorts + trend-specific tags.\n\nLONG-FORM DESCRIPTION (150-200 words): First 2 lines include specific search keyword from research (what YouTube indexes). Para 2: personal "${c.niche}" angle. Para 3: soft CTA + invite the specific debate the audience is having. Timestamps. 10-14 hashtags: trend keywords + niche + region for ${c.region}.\n\nLabel each: SHORTS DESCRIPTION and LONG-FORM DESCRIPTION.`,
  },
  youtubeTags: {
    sys: c => `You are a YouTube SEO tag strategist. Plain text only. Max 160 words. ${c.stageNote} CRITICAL: Respond entirely in ${c.language}.`,
    usr: c => `${c.base}\n\nRESEARCH INTEL:\n${c.research}\n\nYouTube tags for a "${c.niche}" creator. Include exact search terms people are using RIGHT NOW for "${c.trendTitle}".\n\nTREND TAGS (6-8): Exact phrases + variations people are searching now\nNICHE TAGS (5-7): Core "${c.niche}" channel content terms\nBROAD REACH TAGS (4-5): Category-level discovery tags\nREGION TAGS (3-5): Location/language tags for ${c.region}\n\nTOTAL CHARACTER COUNT ESTIMATE: [number] (keep under 500)\n\nAll lowercase, comma separated, no hashtags.`,
  },
};

// ─── OPENAI CALL ─────────────────────────────────────────────────────────────
async function callOpenAI(sys, usr, apiKey) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 900,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: usr },
      ],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "OpenAI API error");
  return data.choices?.[0]?.message?.content || "";
}

// ─── HANDLER ─────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "OPENAI_API_KEY is not configured." });

  const { trend, platform, niche, region, creatorStage, sectionKey, language } = req.body;
  if (!trend || !sectionKey) return res.status(400).json({ error: "Missing required: trend, sectionKey" });

  const cacheKey = getCacheKey(trend.title, niche);

  // ── RESEARCH MODE ──────────────────────────────────────────────────────────
  // Run research, store in server cache, return the cache key to client.
  // Client never needs to send research text back — just the cache key.
  if (sectionKey === "research") {
    try {
      const intel = await researchTrend(trend, niche, platform, region, language, apiKey);
      // Store with TTL
      researchCache.set(cacheKey, { content: intel, ts: Date.now() });
      return res.status(200).json({ sectionKey: "research", content: intel, cacheKey });
    } catch (err) {
      console.error("[/api/generate research]", err.message);
      return res.status(500).json({ error: err.message, sectionKey: "research" });
    }
  }

  // ── CONTENT SECTION MODE ───────────────────────────────────────────────────
  const def = SECTIONS[sectionKey];
  if (!def) return res.status(400).json({ error: `Unknown sectionKey: ${sectionKey}` });

  // Retrieve research from server cache — no need to send it in every request body
  let research = "";
  const cached = researchCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    research = cached.content;
  }

  const ctx = buildContext(trend, platform, niche, region, creatorStage, language, research);

  let sysPrompt = def.sys(ctx);
  let usrPrompt = def.usr(ctx);
  // Fix any bare trend.title template refs that slipped through
  usrPrompt = usrPrompt.replace(/\$\{trend\.title\}/g, trend.title || "this trend");
  usrPrompt = usrPrompt.replace(/\$\{trend\.saturation\}/g, String(trend.saturation || 50));

  try {
    const content = await callOpenAI(sysPrompt, usrPrompt, apiKey);
    return res.status(200).json({ sectionKey, content });
  } catch (err) {
    console.error(`[/api/generate] ${sectionKey}:`, err.message);
    return res.status(500).json({ error: err.message, sectionKey });
  }
}
