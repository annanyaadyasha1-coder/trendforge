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
    sys: c => `You are a brutally honest content strategist who thinks like a top Indian creator. You don't write safe advice. You write what actually works. Plain text only. No markdown. Max 150 words. CRITICAL: Respond entirely in ${c.language}.`,
    usr: c => `${c.base}\n\nRESEARCH INTEL:\n${c.research}\n\nWrite a trend brief for a "${c.niche}" creator. Be brutally specific — no fluff, no encouragement, no "you got this" energy.\n\nTell them:\n1. What's ACTUALLY happening (specific names, facts, numbers from research)\n2. Why people can't stop watching/sharing this — the exact emotional hook (not "curiosity", be specific)\n3. The ONE angle a "${c.niche}" creator can own that nobody is doing yet — think laterally, be specific\n4. How long they have before this dies — be honest\n\nWrite like a blunt friend who knows content, not a consultant writing a report.`,
  },
  videoIdeas: {
    sys: c => `You are a top Indian content strategist who's helped creators go viral. You think in angles nobody else sees. Plain text only. Max 220 words. CRITICAL: Respond entirely in ${c.language}.`,
    usr: c => `${c.base}\n\nRESEARCH INTEL:\n${c.research}\n\nGive exactly 3 video ideas for a "${c.niche}" creator. These must be ideas that make a creator say "oh THAT'S smart" — not "yeah I've seen that".\n\nFor each idea:\n- TITLE IN CAPS (punchy, under 65 chars, sounds like something you'd actually click)\n- The specific twist that makes it different from what everyone else is doing\n- The exact emotion it triggers in the viewer (not "engagement" — be specific: jealousy/FOMO/validation/shock)\n- One sentence on why it will perform based on what's actually working right now\n\nIdea 1: Smartest angle (low risk, high reward)\nIdea 2: The contrarian take (challenges the obvious narrative)\nIdea 3: The one that could genuinely go viral if executed right\n\nNo generic titles. If a title sounds like every other creator's video, rewrite it.`,
  },
  viralHooks: {
    sys: c => `You are Tanmay Bhatt's content strategist. You've studied every viral Indian reel from 2020-2025. You know that most AI-generated hooks are trash because they're too clean, too complete, too safe. Your hooks are weird, unfinished, or say something that makes people go "wait what?". You write for performers who pick up their phone mid-thought. Plain text only. CRITICAL: Respond entirely in ${c.language}.`,
    usr: c => `${c.base}\n\nRESEARCH INTEL:\n${c.research}\n\nYou are writing hooks for a "${c.niche}" creator on ${c.platform}. Use the research to make every hook specific to THIS trend.\n\nBefore writing, identify:\n- The RELATABLE TRUTH about this trend for a "${c.niche}" creator\n- The MISUNDERSTANDING people have about it\n- The EMOTIONAL TRIGGER: ego / confusion / love / irritation / shock\n\nThen write exactly 5 hooks. Each hook is max 6-8 words. Punchy. Incomplete sentence is fine. Curiosity gap — don't reveal the answer.\n\nHOOK 1 (Pattern break — confusing/weird/unexpected):\nHOOK 2 (Personal tension — specific to "${c.niche}" life):\nHOOK 3 (Emotional trigger — raw, no selling):\nHOOK 4 (Specific shocking detail from research):\nHOOK 5 (Conflict — the specific controversy right now):\n\nThen add:\nSAVAGE VERSION: 1 controversial/bold take nobody is saying\nCOMMENT BAIT LINE: 1 ultra-relatable line people will screenshot or reply to\n\nRules: No "Hey guys". No explaining. No clean sentences. Sound like a real person picked up their phone mid-thought.`,
  },

  captions: {
    sys: c => `You are a ${c.platform} caption expert for everyday creators. Plain text only. Max 220 words. ${c.stageNote} CRITICAL: Respond entirely in ${c.language}.`,
    usr: c => `${c.base}\n\nRESEARCH INTEL:\n${c.research}\n\nWrite 2 captions for a "${c.niche}" creator. Tease payoff, never give it away.\n\nCAPTION 1 (30-50 words): Hook on the specific emotion this trend triggers. Promise something surprising. Personal to "${c.niche}" life. End with a question the audience is actually asking. + ${c.hashStyle}\n\nCAPTION 2 (80-100 words): Open with the specific tension/controversy from research. Build to the "${c.niche}" personal angle. Reference a specific detail mid-way. End with a question mirroring the real audience conversation. Raw and genuine tone. + region hashtags for ${c.region}.`,
  },

  script: {
    sys: c => `You are a viral content performer who's helped Indian creators get 10M+ views. You've studied Tanmay Bhatt, Prajakta Koli, Niharika NM, and every top Indian short-form creator. You know the difference between a script that performs and one that just reads well. Scripts that perform are CHAOTIC, SPECIFIC, and leave gaps. They make the viewer feel something before they understand what's happening. You do NOT write clean scripts. You write scripts that feel like they were filmed in one take because the creator was actually feeling something. Plain text only. CRITICAL: Respond entirely in ${c.language}.`,
    usr: c => `${c.base}\n\nRESEARCH INTEL (mine this for specific details — every fact you use makes the script 10x more real):\n${c.research}\n\nWrite a viral ${c.shortForm} script for a "${c.niche}" creator about this trend.\n\nFIRST — identify these three things (write them out before the script):\nRELATABLE TRUTH: [what does EVERY "${c.niche}" person secretly feel about this but never says?]\nMISUNDERSTANDING: [what's the thing everyone gets wrong about this trend?]\nEMOTIONAL TRIGGER: [pick ONE — ego / confusion / love / irritation / shock / FOMO / validation]\n\nTHEN write the script:\n\nHOOK (0-2 sec):\n[CUT] One line. Weird, incomplete, or says something that makes no sense without context. Max 7 words. Does NOT start with "Hey guys" or any greeting. Does NOT explain what the video is about.\n\nOPEN LOOP (2-8 sec):\n[ZOOM] 2-3 lines. Still don't explain the hook. Make it worse. Add more confusion or tension. Each line under 10 words. Broken sentences. "..." okay.\n\nESCALATION (8-25 sec):\n[CUT] [CUT] This is where the real story lives. 3-4 lines max. Use a SPECIFIC detail from the research — a real number, name, or moment. Build tension without resolving it. Hinglish natural here. Short punchy reactions okay ("main toh shock ho gayi", "bro seriously?", "matlab ek second...").\n\nTWIST (25-35 sec):\n[PAUSE] The reveal. But NOT the obvious one. Subvert expectations. Specific to "${c.niche}" life. Should make viewer go "ohhhh" not "okay yeah obviously".\n\nAFTERSHOCK (35-45 sec):\nNo CTA. No "subscribe". End on a line that makes people COMMENT. Either:\n- A question they have a strong opinion about\n- A relatable punchline they want to share\n- Something that makes them tag someone\n\nHARD RULES:\nX No "Hey guys" / "Hi everyone"\nX No "So basically" / "In the end" / "To summarize"\nX No paragraphs longer than 2 lines\nX No explaining what you're about to do — just do it\nX No generic emotional language ("I felt so inspired", "it really made me think")\nX No clean storytelling — real life is messy, this should feel messy\n✓ [CUT] [ZOOM] [PAUSE] where the edit should happen\n✓ Interruptions (...) where the creator would pause or hesitate\n✓ Specific details from research — names, numbers, real moments\n✓ Hinglish where it feels natural for "${c.niche}"\n\nThen write 5 TONE VARIANTS (hook + first 3 lines only for each):\nFUNNY: [comedic angle, self-deprecating]\nSARCASTIC: [roast energy, side-eye tone]\nDRAMATIC: [emotional, high stakes]\nABSURD: [unexpected, doesn't make sense at first]\nULTRA-RELATABLE: [every "${c.niche}" person will send this to someone]\n\nFINAL SELF-CHECK before submitting:\nRead the hook out loud. If it sounds like something a brand would say — rewrite it.\nIf the script explains too much — cut it.\nIf there's no moment that makes you feel something — rewrite the twist.`,
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
      max_tokens: 1200,
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
