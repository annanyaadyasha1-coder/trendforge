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
    sys: c => `You are a trend strategist for everyday ${c.platform} creators. Plain text only. No markdown. Max 130 words. ${c.stageNote} CRITICAL: Your entire response must be written in ${c.language} only. Do not use any other language.`,
    usr: c => `${c.base}\n\nWrite a punchy Trend Brief for a "${c.niche}" creator: (1) What this trend is right now in simple words, (2) Why it's blowing up on ${c.platform}, (3) The specific creative angle a "${c.niche}" creator should take — NOT covering the trend like a news channel or analyst, but finding a natural fun connection to their daily "${c.niche}" content and life. A couple vlogger connects it to their relationship. A food creator ties it to food. A fitness creator ties it to their gym life. (4) One sentence on how long the opportunity window lasts.`,
  },

  videoIdeas: {
    sys: c => `You are a viral ${c.platform} content strategist for everyday creators. Plain text only. Max 200 words. ${c.stageNote} CRITICAL: Your entire response must be written in ${c.language} only. Do not use any other language.`,
    usr: c => `${c.base}\n\nGive exactly 3 specific ${c.format} ideas for a ${c.stageLabel} "${c.niche}" creator in ${c.region}.\n\nCRITICAL RULE: Do NOT suggest covering the trend like a journalist, reporter, or analyst. Instead find a creative personal angle that CONNECTS this trend naturally to their "${c.niche}" content style and daily life. Think: how would a real person in this niche make this trend about THEIR life?\n\nExamples of good thinking:\n- Couple vlogger + cricket trend = "We tried predicting every ball for 1 hour and this happened..."\n- Food creator + cricket trend = "Making the perfect match-day snack plate"\n- Fitness creator + cricket trend = "I trained like a cricketer for 7 days"\n- Anime creator + movie trend = "Why this movie reminds me of [anime] and nobody's talking about it"\n\nNumber them 1, 2, 3. Each: TITLE IN CAPS + the personal niche angle + why it performs. Idea 1 = safest. Idea 2 = medium bold. Idea 3 = most viral.`,
  },

  viralHooks: {
    sys: c => `You are a viral ${c.platform} hook writer for casual everyday creators. NOT for journalists or analysts. Plain text only. Numbered list only. Max 180 words. ${c.stageNote} CRITICAL: Your entire response must be written in ${c.language} only. Do not use any other language.`,
    usr: c => `${c.base}\n\nWrite exactly 5 viral hooks for a "${c.niche}" creator. These are the VERY FIRST WORDS spoken in the video — casual, personal, real. NOT news reporting. NOT analysis. Think: a real person picking up their phone and talking.\n\nWrite ONE short punchy sentence per hook. Number them 1-5. Each on its own line. No explanations, no paragraphs — just the hook sentence itself.\n\n1. Promise payoff — tease something exciting only revealed at the end, framed through "${c.niche}" life\n2. Problem or curiosity hook — a personal problem or question a "${c.niche}" creator would actually have related to this trend\n3. Raw relatable opener — sounds like something a real "${c.niche}" creator would genuinely say, no selling\n4. Shocking or surprising angle — a fact or twist that connects the trend to "${c.niche}" in an unexpected way\n5. Tension or conflict hook — something from a "${c.niche}" creator's real life that makes viewer think "what happens next?"\n\nEach must sound like a REAL PERSON, not a news anchor. One sentence only per hook. No extra text.`,
  },

  captions: {
    sys: c => `You are a ${c.platform} caption expert for everyday creators. Plain text only. Max 200 words. ${c.stageNote} CRITICAL: Your entire response must be written in ${c.language} only. Do not use any other language.`,
    usr: c => `${c.base}\n\nWrite 2 ready-to-paste captions for a "${c.niche}" creator using the RETENTION FRAMEWORK — tease the payoff, never give it away upfront.\n\nCAPTION 1 (Short, 30-50 words): Establish a problem or curiosity from a "${c.niche}" perspective. Promise something surprising revealed in the video. Punchy, personal tone + ${c.hashStyle}.\n\nCAPTION 2 (Storytelling, 80-100 words): Open with a conflict or tension from "${c.niche}" life connected to this trend. Build mid-way, hint at a shocking twist or revelation at the end. Raw and genuine tone — sounds like a real person, not a brand. End with a soft question to drive comments + region-specific hashtags for ${c.region}.\n\nBoth captions must feel personal and real, not like a news post or event promotion.`,
  },

  script: {
    sys: c => `You are a scriptwriter for casual everyday ${c.platform} creators. Write like a real person talking naturally to their phone camera — warm, genuine, conversational. NOT a journalist, NOT a sports analyst, NOT a news anchor. Plain text only. Max 260 words. ${c.stageNote} CRITICAL: Your entire response must be written in ${c.language} only. Do not use any other language.`,
    usr: c => `${c.base}\n\nWrite a complete video script for a ${c.shortForm} for a "${c.niche}" creator using the PSEUDO RETENTION FRAMEWORK. This is a personal, casual, relatable video — NOT a news report, NOT match analysis, NOT expert commentary.\n\nThe trend is the BACKDROP. The creator's "${c.niche}" life, personality, and story IS the content.\n\nWrite each section clearly labeled:\n\n[HOOK 0:00-0:05]\nOne punchy sentence. Personal. Casual. Promises a payoff revealed only at the end. Sounds like a real "${c.niche}" creator picking up their phone.\n\n[CONFLICT 0:05-0:20]\nEstablish a problem, tension, or curiosity that connects this trend to the creator's real "${c.niche}" life. Keep viewer guessing. Make them feel something.\n\n[MIDDLE 0:20-0:45]\nBuild the story. Share a personal angle, insight, or experience. Keep the promised payoff hidden. Conversational and relatable — like talking to a friend. Fresh perspective, not something everyone is saying.\n\n[TENSION 0:45-0:55]\nRaise the stakes. Viewer still can't predict the ending. Keep energy up.\n\n[SHOCKING END 0:55-1:00]\nDeliver the promised payoff with a surprising or satisfying reveal. Then a soft natural CTA — comment, follow, or share that fits the casual tone.\n\nRULES:\n- Sound like a REAL PERSON, not a broadcaster\n- Natural to say aloud — no stiff or formal language\n- Every line must feel like it belongs to a "${c.niche}" creator's life`,
  },

  visualIdeas: {
    sys: c => `You are a ${c.platform} creative director for everyday creators. Plain text only. Max 180 words. ${c.stageNote} CRITICAL: Your entire response must be written in ${c.language} only. Do not use any other language.`,
    usr: c => `${c.base}\n\nDescribe 5 specific visual shots for this ${c.format} made by a "${c.niche}" creator. For each: what the camera sees, angle, background, props, lighting mood. Label Shot 1-5. Must be achievable with a smartphone at home or a casual location. Consider the visual aesthetic popular on ${c.platform} in ${c.region} for "${c.niche}" content.`,
  },

  shootingDirection: {
    sys: c => `You are a ${c.platform} production coach for beginner creators. Plain text. Max 200 words. ${c.stageNote} CRITICAL: Your entire response must be written in ${c.language} only. Do not use any other language.`,
    usr: c => `${c.base}\n\nComplete shooting guide for a "${c.niche}" creator, numbered 1-7:\n1) Best time of day to shoot this\n2) Camera angle and framing for ${c.platform}\n3) Lighting setup (simple, at-home options)\n4) Best background or location for ${c.region} that fits "${c.niche}" content\n5) What to wear that matches "${c.niche}" creator style\n6) One key editing tip for ${c.platform}\n7) Best upload day and time for ${c.platform} in ${c.region}`,
  },

  competitorGap: {
    sys: c => `You are a competitive content strategist for ${c.platform}. Plain text only. Max 170 words. ${c.stageNote} CRITICAL: Your entire response must be written in ${c.language} only. Do not use any other language.`,
    usr: c => `${c.base}\n\nCompetitor gap analysis for a "${c.niche}" creator:\n(1) The angle EVERYONE is taking on ${c.platform} right now — avoid this\n(2) The specific unclaimed personal angle a "${c.niche}" creator can own right now\n(3) One underused format for this trend in the "${c.niche}" space\n(4) One audience sub-segment being completely ignored\nBe brutally specific and actionable.`,
  },

  audioFormat: {
    sys: c => `You are a ${c.platform} algorithm and format expert. Plain text only. Max 160 words. ${c.stageNote} CRITICAL: Your entire response must be written in ${c.language} only. Do not use any other language.`,
    usr: c => `${c.base}\n\nFormat and algorithm intelligence for a "${c.niche}" creator on ${c.platform}:\n(1) Best format: talking-head / B-roll+voiceover / text-on-screen / POV / reaction — and why for this niche\n(2) Ideal length in seconds for maximum watch time\n(3) Thumbnail or cover frame advice for "${c.niche}" content\n(4) Best audio approach. Note: ${c.algoNote}\n(5) One ${c.platform} algorithm tip specific to this trend right now`,
  },

  performancePrediction: {
    sys: c => `You are a ${c.platform} performance analyst. Plain text only. Max 150 words. ${c.stageNote} CRITICAL: Your entire response must be written in ${c.language} only. Do not use any other language.`,
    usr: c => `${c.base}\n\nRealistic performance prediction for a ${c.stageLabel} "${c.niche}" creator posting this ${c.format} now:\n(1) Realistic view/reach range in first 48 hours\n(2) Follower/subscriber conversion estimate\n(3) Key variable that will determine if it overperforms\n(4) Key risk that could cause underperformance\n(5) One honest expectation-setter so a beginner doesn't quit after a normal result\nBe direct and realistic.`,
  },

  calendar: {
    sys: c => `You are a ${c.platform} content calendar strategist. Plain text only. Max 230 words. ${c.stageNote} CRITICAL: Your entire response must be written in ${c.language} only. Do not use any other language.`,
    usr: c => `${c.base}\n\n7-day content calendar for a ${c.stageLabel} "${c.niche}" creator on ${c.platform}:\nDay 1: Main trend ${c.format} with personal "${c.niche}" angle\nDay 2: Behind-the-scenes of making Day 1\nDay 3: Respond to a comment or reaction from Day 1\nDay 4: Niche-down version for a specific sub-audience within "${c.niche}"\nDay 5: Collab or duet/stitch angle\nDay 6: Deeper or extended version with more personal story\nDay 7: Reflection / results / what I learned\nFor each: content title + best posting time for ${c.region} + one sentence on why it works.`,
  },

  youtubeTitles: {
    sys: c => `You are a YouTube SEO and title expert. Plain text only. Max 180 words. ${c.stageNote} CRITICAL: Your entire response must be written in ${c.language} only. Do not use any other language.`,
    usr: c => `${c.base}\n\nWrite exactly 5 YouTube video titles for a "${c.niche}" creator targeting this trend. These titles must be optimised for maximum clicks AND search discovery.\n\nRULES:\n- Each title under 70 characters (YouTube cuts off longer ones)\n- Use proven formats: curiosity gap, number lists, "I did X for Y days", "Why I...", "The truth about..."\n- Include the main trend keyword naturally\n- Make it feel personal to a "${c.niche}" creator — not a news headline\n- No clickbait that doesn't deliver — every title must match what the video actually shows\n\nNumber them 1-5. Each on its own line.\nTitle 1: Safest, most searchable\nTitle 2: Curiosity/emotion driven\nTitle 3: Story-based personal angle\nTitle 4: Bold or contrarian\nTitle 5: Highest viral potential`,
  },

  youtubeDescription: {
    sys: c => `You are a YouTube SEO expert who writes descriptions that rank AND convert viewers to subscribers. Plain text only. Max 280 words. ${c.stageNote} CRITICAL: Your entire response must be written in ${c.language} only. Do not use any other language.`,
    usr: c => `${c.base}\n\nWrite TWO YouTube descriptions for a "${c.niche}" creator — one for a Short, one for a long-form video.\n\nSHORTS DESCRIPTION (50-80 words):\n- Hook sentence that continues the video energy\n- 1-2 sentences of context\n- Call to action (subscribe/follow/comment)\n- 5-8 relevant hashtags including #Shorts and niche-specific tags\n- Keep it punchy — Shorts viewers don't read long descriptions\n\nLONG-FORM DESCRIPTION (150-200 words):\n- Paragraph 1: Hook + what this video covers (include main keyword naturally in first 2 lines — this is what YouTube indexes)\n- Paragraph 2: Why this matters to a "${c.niche}" creator/viewer\n- Paragraph 3: Soft CTA — subscribe, comment, related video\n- Timestamps placeholder: "0:00 Intro | 0:30 [main point] | 1:00 [twist]"\n- 8-12 hashtags: mix of trend keywords + "${c.niche}" niche tags + region tags for ${c.region}\n\nLabel each section clearly: SHORTS DESCRIPTION and LONG-FORM DESCRIPTION.`,
  },

  youtubeTags: {
    sys: c => `You are a YouTube SEO tag strategist. Plain text only. Max 150 words. ${c.stageNote} CRITICAL: Your entire response must be written in ${c.language} only. Do not use any other language.`,
    usr: c => `${c.base}\n\nGenerate a complete YouTube tag set for a "${c.niche}" creator making a video about this trend. YouTube allows up to 500 characters of tags.\n\nProvide tags in 4 groups, comma separated:\n\nTREND TAGS (5-7 tags): Exact trend keywords and variations people are searching right now\n\nNICHE TAGS (5-7 tags): Core "${c.niche}" terms that describe the channel and video content\n\nBROAD REACH TAGS (4-6 tags): Wider category tags to catch discovery traffic beyond the core niche\n\nREGION TAGS (3-5 tags): Location/region-specific tags for ${c.region} audience discovery\n\nAfter the tags, add one line: TOTAL CHARACTER COUNT ESTIMATE: [number] (keep under 500 for YouTube's limit)\n\nAll tags should be lowercase, no hashtags, comma separated.`,
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
