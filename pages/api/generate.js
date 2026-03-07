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

function buildContext(trend, platform, niche, region, creatorStage, language) {
  const tier = trend.tier || 2;
  const pc   = getPlatformCtx(platform);
  const lang = language || "English";
  return {
    tier, tierLabel:TIER_LABELS[tier]||TIER_LABELS[2],
    stageNote:STAGE_NOTES[creatorStage]||STAGE_NOTES.starter,
    stageLabel:creatorStage, platform:pc.label, format:pc.format,
    shortForm:pc.shortForm, hashStyle:pc.hashStyle, algoNote:pc.algoNote,
    dataNote:pc.dataNote, niche, region, language:lang,
    base:[
      `Platform: ${pc.label}`, `Content Format: ${pc.format}`,
      `Niche: ${niche}`, `Region: ${region}`, `Creator Stage: ${creatorStage}`,
      `Trend: "${trend.title}"`, `Tier: ${tier} (${TIER_LABELS[tier]})`,
      `Saturation: ${trend.saturation}%`, `Hours Old: ~${trend.hoursOld}h`,
      `Why it's hot: ${trend.why}`, `Niche Relevance: ${trend.nicheRelevance}%`,
      `Data Source: ${pc.dataNote}`,
      `OUTPUT LANGUAGE: You MUST write every single word of your response in ${lang}. No English unless ${lang} is English. This is mandatory.`,
    ].join(" | "),
  };
}

const SECTIONS = {
  trendBrief: {
    sys: c => `You are a trend analyst for ${c.platform} creators. Plain text only. No markdown. Max 130 words. ${c.stageNote} CRITICAL: Your entire response must be written in ${c.language} only. Do not use any other language.`,
    usr: c => `${c.base}\n\nWrite a punchy Trend Brief: (1) What this trend is right now, (2) Why it's spreading on ${c.platform}, (3) Who is watching it and why, (4) The exact angle a ${c.stageLabel} creator in "${c.niche}" should take for ${c.region}. End with one sentence on how long the opportunity window lasts.`,
  },
  videoIdeas: {
    sys: c => `You are a viral ${c.platform} content strategist. Plain text only. Max 190 words. ${c.stageNote} CRITICAL: Your entire response must be written in ${c.language} only. Do not use any other language.`,
    usr: c => `${c.base}\n\nGive exactly 3 specific ${c.format} ideas for this trend tailored to ${c.region} and a ${c.stageLabel} creator in "${c.niche}". Number them 1, 2, 3. Each: TITLE IN CAPS + one sentence on the unique angle + one sentence on why it'll perform. Idea 1 = safest. Idea 2 = medium bold. Idea 3 = highest viral potential.`,
  },
  viralHooks: {
    sys: c => `You are a viral ${c.platform} hook writer. Plain text only. Max 150 words. ${c.stageNote} CRITICAL: Your entire response must be written in ${c.language} only. Do not use any other language.`,
    usr: c => `${c.base}\n\nWrite 5 viral opening hooks (first 2–3 seconds). One each for:\n1) Curiosity gap\n2) Bold controversial statement\n3) Relatable personal story opener\n4) Shocking stat or fact\n5) Direct challenge to the viewer\nEach must make someone stop scrolling on ${c.platform} immediately. Number them 1-5.`,
  },
  captions: {
    sys: c => `You are a ${c.platform} caption expert. Plain text only. Max 180 words. ${c.stageNote} CRITICAL: Your entire response must be written in ${c.language} only. Do not use any other language.`,
    usr: c => `${c.base}\n\nWrite 2 ready-to-paste captions for ${c.platform} in ${c.region}.\nCAPTION 1: Short punchy (30-50 words) + ${c.hashStyle}.\nCAPTION 2: Storytelling style (80-100 words, strong first line) + more hashtags including region-specific ones for ${c.region}.`,
  },
  script: {
    sys: c => `You are an elite ${c.platform} scriptwriter. Plain text. Max 230 words. ${c.stageNote} CRITICAL: Your entire response must be written in ${c.language} only. Do not use any other language.`,
    usr: c => `${c.base}\n\nWrite a complete script for a ${c.shortForm}:\n[HOOK 0:00-0:05] — stops the scroll\n[BODY 0:05-0:45] — core value or story\n[CTA 0:45-0:60] — call to action for a ${c.stageLabel} creator\nConversational, natural to say aloud. Optimised for ${c.platform}.`,
  },
  visualIdeas: {
    sys: c => `You are a ${c.platform} creative director. Plain text only. Max 180 words. ${c.stageNote} CRITICAL: Your entire response must be written in ${c.language} only. Do not use any other language.`,
    usr: c => `${c.base}\n\nDescribe 5 specific visual shots for this ${c.format}. For each: what the camera sees, angle, background, props, lighting mood. Label Shot 1-5. Must be achievable with a smartphone. Consider the visual aesthetic popular on ${c.platform} in ${c.region}.`,
  },
  shootingDirection: {
    sys: c => `You are a ${c.platform} production coach for beginners. Plain text. Max 200 words. ${c.stageNote} CRITICAL: Your entire response must be written in ${c.language} only. Do not use any other language.`,
    usr: c => `${c.base}\n\nComplete shooting guide numbered 1-7:\n1) Best time of day\n2) Camera angle and framing for ${c.platform}\n3) Lighting setup\n4) Background or location for ${c.region}\n5) What to wear\n6) One key editing tip for ${c.platform}\n7) Best upload day and time for ${c.platform} in ${c.region}`,
  },
  competitorGap: {
    sys: c => `You are a competitive content strategist for ${c.platform}. Plain text only. Max 170 words. ${c.stageNote} CRITICAL: Your entire response must be written in ${c.language} only. Do not use any other language.`,
    usr: c => `${c.base}\n\nCompetitor gap analysis:\n(1) The angle EVERYONE is taking on ${c.platform} right now — avoid this\n(2) The specific unclaimed angle with the best chance of standing out NOW\n(3) One underused format for this trend\n(4) One audience sub-segment being completely ignored\nBe brutally specific and actionable.`,
  },
  audioFormat: {
    sys: c => `You are a ${c.platform} algorithm and format expert. Plain text only. Max 160 words. ${c.stageNote} CRITICAL: Your entire response must be written in ${c.language} only. Do not use any other language.`,
    usr: c => `${c.base}\n\nFormat and algorithm intelligence for ${c.platform}:\n(1) Best format: talking-head / B-roll+voiceover / text-on-screen / POV / reaction — and why\n(2) Ideal length in seconds for maximum watch time\n(3) Thumbnail or cover frame advice\n(4) Best audio approach. Note: ${c.algoNote}\n(5) One ${c.platform} algorithm tip specific to this trend right now`,
  },
  performancePrediction: {
    sys: c => `You are a ${c.platform} performance analyst. Plain text only. Max 150 words. ${c.stageNote} CRITICAL: Your entire response must be written in ${c.language} only. Do not use any other language.`,
    usr: c => `${c.base}\n\nRealistic performance prediction for a ${c.stageLabel} creator posting this ${c.format} now:\n(1) Realistic view/reach range in first 48 hours\n(2) Follower/subscriber conversion estimate\n(3) Key variable that will determine if it overperforms\n(4) Key risk that could cause underperformance\n(5) One honest expectation-setter so a beginner doesn't quit after a normal result\nBe direct and realistic.`,
  },
  calendar: {
    sys: c => `You are a ${c.platform} content calendar strategist. Plain text only. Max 230 words. ${c.stageNote} CRITICAL: Your entire response must be written in ${c.language} only. Do not use any other language.`,
    usr: c => `${c.base}\n\n7-day content calendar for a ${c.stageLabel} creator on ${c.platform}:\nDay 1: Main trend ${c.format}\nDay 2: Behind-the-scenes\nDay 3: Respond to a comment / engagement content\nDay 4: Niche-down version for a specific sub-audience\nDay 5: Collab or duet/stitch angle\nDay 6: Deeper or extended version\nDay 7: Reflection / results / what I learned\nFor each: content title + best posting time for ${c.region} + one sentence on why it works.`,
  },
};

async function callClaude(sys, usr) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 1000,
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

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error:"Method not allowed" });
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error:"OPENAI_API_KEY is not configured." });
  const { trend, platform, niche, region, creatorStage, sectionKey, language } = req.body;
  if (!trend || !sectionKey) return res.status(400).json({ error:"Missing required: trend, sectionKey" });
  const def = SECTIONS[sectionKey];
  if (!def) return res.status(400).json({ error:`Unknown sectionKey: ${sectionKey}` });
  const ctx = buildContext(trend, platform, niche, region, creatorStage, language);
  try {
    const content = await callClaude(def.sys(ctx), def.usr(ctx));
    return res.status(200).json({ sectionKey, content });
  } catch(err) {
    console.error(`[/api/generate] ${sectionKey}:`, err.message);
    return res.status(500).json({ error:err.message, sectionKey });
  }
}
