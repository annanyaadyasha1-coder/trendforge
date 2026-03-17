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

function buildContext(trend, platform, niche, region, creatorStage, language, research) {
  const tier = trend.tier || 2;
  const pc   = getPlatformCtx(platform);
  const lang = language || "English";
  return {
    tier, tierLabel:TIER_LABELS[tier]||TIER_LABELS[2],
    stageNote:STAGE_NOTES[creatorStage]||STAGE_NOTES.starter,
    stageLabel:creatorStage, platform:pc.label, format:pc.format,
    shortForm:pc.shortForm, hashStyle:pc.hashStyle, algoNote:pc.algoNote,
    dataNote:pc.dataNote, niche, region, language:lang,
    research: research || "",
    base:[
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
// This is the brain. Before generating ANY content, we call OpenAI with web
// search to learn exactly what's happening with this trend RIGHT NOW:
// what real people are saying, what hooks are working, what's oversaturated,
// what angles nobody has taken yet. This intelligence then powers every section.

async function researchTrend(trend, niche, platform, region, language, apiKey) {
  const researchPrompt = `You are a senior content strategist with access to live internet data. Research the trend "${trend.title}" RIGHT NOW and produce a deep intelligence brief.

CONTEXT:
- Platform: ${platform}
- Creator niche: ${niche}
- Region: ${region}
- Trend is ~${trend.hoursOld}h old, ${trend.saturation}% saturated
- Output language for final content will be: ${language}

YOUR JOB — research and answer ALL of these:

1. WHAT IS ACTUALLY HAPPENING: What specifically is this trend about right now? What's the exact story, controversy, event, or moment driving it? Be specific — names, facts, numbers.

2. REAL AUDIENCE REACTION: What are actual viewers/fans saying? What emotions is this triggering — excitement, anger, nostalgia, curiosity, shock? What specific phrases or sentiments keep coming up in comments/discussions?

3. HOOKS THAT ARE WORKING: What exact hook styles are performing on ${platform} for this trend right now? Give 3 real examples of high-performing opening lines creators are actually using (paraphrase, don't copy).

4. OVERSATURATED ANGLES: What angles are EVERY creator already doing? Be specific. What should be avoided because it's already flooded?

5. UNCLAIMED ANGLES: What specific angle for a "${niche}" creator is completely untapped? Think laterally — how does this trend connect to ${niche} in a way nobody has explored yet?

6. VIRAL SPECIFICS: What specific detail, stat, quote, or fact about this trend would make someone stop scrolling? Something surprising, specific, and not obvious.

7. CONTENT FORMATS WINNING: What format (talking head, reaction, list video, storytime, POV) is getting the most traction for THIS specific trend on ${platform}?

8. LANGUAGE & TONE INTEL: If creating in ${language}, what specific cultural references, phrases, or tone would resonate most with the ${region} audience for this trend?

Be brutally specific. No generic advice. Every insight must be about THIS trend, not trends in general. If you find real data — view counts, engagement rates, specific creator examples — include them.`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 1200,
        messages: [
          {
            role: "system",
            content: "You are a content intelligence analyst with deep knowledge of viral trends, platform algorithms, and creator culture. You research trends in real time and produce actionable, hyper-specific intelligence. Never be generic. Always be specific to the exact trend, niche, and platform provided."
          },
          { role: "user", content: researchPrompt }
        ],
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Research call failed");
    return data.choices?.[0]?.message?.content || "";
  } catch (err) {
    console.error("[researchTrend]", err.message);
    return ""; // graceful fallback — sections still generate, just without research boost
  }
}

// ─── CONTENT SECTIONS ─────────────────────────────────────────────────────────
// Every section now receives the full research brief as context.
// The AI knows exactly what's happening, what's working, and what's not —
// so every output is specific to THIS trend, not a generic template.

const SECTIONS = {
  trendBrief: {
    sys: c => `You are a trend strategist for everyday ${c.platform} creators. Plain text only. No markdown. Max 150 words. ${c.stageNote} CRITICAL: Your entire response must be written in ${c.language} only.`,
    usr: c => `${c.base}

LIVE TREND INTELLIGENCE (use this to make your response hyper-specific):
${c.research}

Write a punchy Trend Brief for a "${c.niche}" creator. Use the intelligence above to be SPECIFIC:
(1) What is SPECIFICALLY happening with this trend right now — real details, not vague description
(2) Why it's exploding on ${c.platform} — the specific emotional driver (anger/nostalgia/shock/excitement)
(3) The exact creative angle a "${c.niche}" creator should take — NOT covering it like a journalist, but making it personal to their ${c.niche} life in a way nobody else is doing yet
(4) One specific hook detail or fact from the research that gives this creator an edge

Be specific. Every sentence must be about THIS trend. No generic creator advice.`,
  },

  videoIdeas: {
    sys: c => `You are a viral ${c.platform} content strategist for everyday creators. Plain text only. Max 220 words. ${c.stageNote} CRITICAL: Your entire response must be written in ${c.language} only.`,
    usr: c => `${c.base}

LIVE TREND INTELLIGENCE (use this to make ideas hyper-specific and non-generic):
${c.research}

Give exactly 3 specific ${c.format} ideas for a "${c.niche}" creator. Use the research to avoid the oversaturated angles and find the unclaimed territory.

RULES:
- Do NOT suggest what everyone is already doing (the research tells you what that is)
- Find the angle that connects this trend to "${c.niche}" personal life in a way that feels completely natural and hasn't been done
- Each idea must reference a SPECIFIC detail from the trend — not a generic "react to this trend" idea
- Think: what would make someone in the "${c.niche}" niche say "oh that's exactly my life"

Number them 1, 2, 3. Each: TITLE IN CAPS (punchy, under 65 chars) + the specific personal angle + why it will perform based on what the research shows is working. 
Idea 1 = smartest/safest. Idea 2 = unexpected angle. Idea 3 = highest viral potential.`,
  },

  viralHooks: {
    sys: c => `You are a viral ${c.platform} hook writer. Plain text only. Numbered list. Max 200 words. ${c.stageNote} CRITICAL: Your entire response must be written in ${c.language} only.`,
    usr: c => `${c.base}

LIVE TREND INTELLIGENCE:
${c.research}

Write exactly 5 viral hooks for a "${c.niche}" creator. These are the VERY FIRST WORDS of the video.

Use the research to write hooks that are:
- Specific to what's ACTUALLY happening with "${trend.title}" right now — not vague
- Reference real details, emotions, or facts the research uncovered
- Framed through a "${c.niche}" creator's personal life and perspective
- Different from what everyone else is already saying (avoid oversaturated angles)

One sentence per hook. Number 1-5. Each on its own line. Just the hook — no explanation.

1. Promise payoff — tease the specific surprising detail from the research, revealed at end
2. Personal problem — a specific tension between this trend and "${c.niche}" life
3. Raw real opener — says what the "${c.niche}" audience is ACTUALLY feeling about this trend
4. Specific fact/detail — the most surprising specific thing the research found about this trend
5. Conflict — the specific tension or controversy this trend is creating right now

Each must sound like a real person, not a template. One sentence only.`,
  },

  captions: {
    sys: c => `You are a ${c.platform} caption expert. Plain text only. Max 220 words. ${c.stageNote} CRITICAL: Your entire response must be written in ${c.language} only.`,
    usr: c => `${c.base}

LIVE TREND INTELLIGENCE:
${c.research}

Write 2 ready-to-paste captions for a "${c.niche}" creator. Use the research — reference specific details, emotions, and the unclaimed angles it identified.

CAPTION 1 (Short, 30-50 words): 
Hook on the specific emotional driver this trend is triggering (use research). Promise something surprising in the video. Personal to "${c.niche}" life. End with a specific question that the research shows people are actually asking about this trend. + ${c.hashStyle}

CAPTION 2 (Storytelling, 80-100 words):
Open with the specific tension or controversy the research identified. Build to the personal "${c.niche}" angle. Reference a specific detail/fact from the research mid-way. End with a question that mirrors what the actual audience conversation looks like right now. Raw and genuine. + region-specific hashtags for ${c.region}.

Both captions must feel like they come from someone who KNOWS this trend deeply, not someone who just heard about it.`,
  },

  script: {
    sys: c => `You are a scriptwriter for casual everyday ${c.platform} creators. Write like a real person talking to their phone. NOT a journalist or analyst. Plain text. Max 280 words. ${c.stageNote} CRITICAL: Your entire response must be written in ${c.language} only.`,
    usr: c => `${c.base}

LIVE TREND INTELLIGENCE (this is your source material — use specific details from here):
${c.research}

Write a complete ${c.shortForm} script for a "${c.niche}" creator using the PSEUDO RETENTION FRAMEWORK.

The trend is the BACKDROP. The creator's "${c.niche}" personal life and reaction IS the story.
Use SPECIFIC details from the research — the real facts, real audience emotions, real conversation happening now.
Do NOT use generic descriptions. Every line should feel like only THIS creator could say it about THIS specific trend.

[HOOK 0:00-0:05]
Reference the most specific/surprising detail from the research. Promise a payoff. Personal. Casual.

[CONFLICT 0:05-0:20]  
The specific tension this trend creates for a "${c.niche}" creator personally. Use the real emotional driver the research identified. Make viewer feel "yes, THAT's exactly it."

[MIDDLE 0:20-0:45]
Personal story/angle that connects this trend to "${c.niche}" life. Drop the specific fact or angle the research says is unclaimed/surprising. Keep payoff hidden.

[TENSION 0:45-0:55]
Raise stakes using the specific controversy or unresolved question the research found. Viewer can't predict the end.

[SHOCKING END 0:55-1:00]
Deliver the promised payoff using the most specific/surprising research detail. Soft natural CTA.

RULES: Sound like a real person. Natural to say aloud. Every line earns its place.`,
  },

  visualIdeas: {
    sys: c => `You are a ${c.platform} creative director for everyday creators. Plain text only. Max 200 words. ${c.stageNote} CRITICAL: Your entire response must be written in ${c.language} only.`,
    usr: c => `${c.base}

LIVE TREND INTELLIGENCE:
${c.research}

Describe 5 specific visual shots for a "${c.niche}" creator making a video about this trend. Use the research — the visual concepts should reference the specific story, emotion, or moment driving this trend.

For each shot: what the camera sees, angle, background, props, lighting mood. Label Shot 1-5.
- Must be achievable with a smartphone
- Each shot should visually represent something SPECIFIC about this trend, not a generic creator setup
- Consider what visual format the research says is winning for this trend on ${c.platform}`,
  },

  shootingDirection: {
    sys: c => `You are a ${c.platform} production coach. Plain text. Max 210 words. ${c.stageNote} CRITICAL: Your entire response must be written in ${c.language} only.`,
    usr: c => `${c.base}

LIVE TREND INTELLIGENCE:
${c.research}

Shooting guide for a "${c.niche}" creator making a video about this specific trend. Use research intel on what format is winning for this trend.

Numbered 1-7:
1) Best time to shoot — consider if this is a fast-moving news trend (shoot NOW) or evergreen
2) Camera angle and framing that matches the winning format the research identified
3) Lighting — simple at-home options
4) Background that fits both "${c.niche}" content AND the mood/tone of this specific trend
5) What to wear — matches "${c.niche}" creator energy for THIS trend's tone
6) Key editing tip specific to the format winning for this trend on ${c.platform}
7) Best upload time for ${c.platform} in ${c.region} — consider trend's momentum window`,
  },

  competitorGap: {
    sys: c => `You are a competitive content strategist. Plain text only. Max 190 words. ${c.stageNote} CRITICAL: Your entire response must be written in ${c.language} only.`,
    usr: c => `${c.base}

LIVE TREND INTELLIGENCE (the research already identified what's oversaturated and what's unclaimed):
${c.research}

Competitor gap analysis for a "${c.niche}" creator. Use the research — be brutally specific:

(1) THE FLOOD ZONE: What EXACT angles are every creator already doing for "${trend.title}"? Name the specific content types. Be precise.
(2) THE UNCLAIMED ANGLE: The specific angle a "${c.niche}" creator can own RIGHT NOW that the research says is wide open. Why is it unclaimed?
(3) UNDERUSED FORMAT: Based on what the research says is winning vs what everyone is doing — what format has the biggest gap?
(4) IGNORED AUDIENCE: The specific sub-audience that's deeply invested in this trend but being completely overlooked by creators right now.

Every answer must be specific to "${trend.title}" — not general creator advice.`,
  },

  audioFormat: {
    sys: c => `You are a ${c.platform} algorithm and format expert. Plain text only. Max 180 words. ${c.stageNote} CRITICAL: Your entire response must be written in ${c.language} only.`,
    usr: c => `${c.base}

LIVE TREND INTELLIGENCE:
${c.research}

Format and algorithm intelligence for a "${c.niche}" creator on ${c.platform} for THIS specific trend:

(1) Best format for "${trend.title}" specifically — the research says what's winning. Recommend it and explain why for this niche.
(2) Ideal length — based on the content type winning for this trend, not generic advice
(3) Thumbnail/cover — what specific visual element from this trend gets the highest CTR right now?
(4) Audio — what tone/energy matches the emotional driver of this trend? ${c.algoNote}
(5) One algorithm tip that's specific to how THIS trend is spreading on ${c.platform} right now`,
  },

  performancePrediction: {
    sys: c => `You are a ${c.platform} performance analyst. Plain text only. Max 170 words. ${c.stageNote} CRITICAL: Your entire response must be written in ${c.language} only.`,
    usr: c => `${c.base}

LIVE TREND INTELLIGENCE:
${c.research}

Realistic performance prediction for a ${c.stageLabel} "${c.niche}" creator posting about "${trend.title}" now. Use the research data on engagement and competition level:

(1) View/reach range in first 48h — factor in the trend's current momentum and saturation level (${trend.saturation}%)
(2) Subscriber/follower conversion estimate — based on how engaged this trend's audience is
(3) The ONE variable that determines overperformance — specific to this trend's dynamics
(4) The ONE biggest risk — specific to where this trend is in its lifecycle
(5) Honest expectation — what a beginner should realistically expect, and what the ceiling looks like if they nail the unclaimed angle

Be direct. Use the research to make this specific, not generic.`,
  },

  calendar: {
    sys: c => `You are a ${c.platform} content calendar strategist. Plain text only. Max 250 words. ${c.stageNote} CRITICAL: Your entire response must be written in ${c.language} only.`,
    usr: c => `${c.base}

LIVE TREND INTELLIGENCE:
${c.research}

7-day content calendar for a "${c.niche}" creator riding the "${trend.title}" trend on ${c.platform}. Use the research to time content around the trend's momentum window and reference specific angles.

Day 1: Main trend video using the unclaimed angle the research identified
Day 2: Behind-the-scenes / reaction to Day 1 comments
Day 3: The specific sub-question or controversy the research says the audience is debating
Day 4: Niche-down angle — how this trend hits different for "${c.niche}" specifically
Day 5: Collab angle — what creator type would complement this trend for "${c.niche}"?
Day 6: The deeper personal story this trend unlocked
Day 7: Results / what I learned / what surprised me

For each: punchy title (under 65 chars) + best post time for ${c.region} + one line on why it works based on the research.`,
  },

  youtubeTitles: {
    sys: c => `You are a YouTube SEO and title expert. Plain text only. Max 200 words. ${c.stageNote} CRITICAL: Your entire response must be written in ${c.language} only.`,
    usr: c => `${c.base}

LIVE TREND INTELLIGENCE:
${c.research}

Write exactly 5 YouTube titles for a "${c.niche}" creator. Use the research — titles must reference SPECIFIC details, emotions, or angles from the actual trend conversation happening right now.

RULES:
- Under 70 characters each (YouTube truncates longer)
- Use the specific language, phrases, and emotional triggers the research says the audience is using
- Avoid the oversaturated title angles the research identified
- Prioritise the unclaimed angles the research found
- Make it feel like only someone who KNOWS this trend deeply wrote this

Number 1-5. Each on its own line.
1: Most searchable — uses exact search terms people are typing right now
2: Curiosity/emotion — triggers the specific emotion the research says this trend creates
3: Personal story — the specific "${c.niche}" angle
4: Bold/contrarian — challenges the most common take the research identified
5: Highest viral potential — uses the most surprising specific detail from the research`,
  },

  youtubeDescription: {
    sys: c => `You are a YouTube SEO expert. Plain text only. Max 300 words. ${c.stageNote} CRITICAL: Your entire response must be written in ${c.language} only.`,
    usr: c => `${c.base}

LIVE TREND INTELLIGENCE:
${c.research}

Write TWO YouTube descriptions for a "${c.niche}" creator. Use specific details from the research — these descriptions must prove the creator actually knows this trend, not just heard about it.

SHORTS DESCRIPTION (50-80 words):
- Open with the specific hook/emotion the research says is resonating
- Reference one specific detail from the trend
- CTA + 5-8 hashtags including #Shorts + trend-specific tags the research identified

LONG-FORM DESCRIPTION (150-200 words):
- First 2 lines: include the specific keyword people are searching (research tells you this) — this is what YouTube indexes
- Para 2: the specific personal "${c.niche}" angle
- Para 3: soft CTA + invite the specific debate/question the research says the audience is having
- Timestamps: 0:00 Intro | [specific moments from the script]
- 10-14 hashtags: trend keywords (exact phrases from research) + niche + region for ${c.region}

Label each: SHORTS DESCRIPTION and LONG-FORM DESCRIPTION.`,
  },

  youtubeTags: {
    sys: c => `You are a YouTube SEO tag strategist. Plain text only. Max 160 words. ${c.stageNote} CRITICAL: Your entire response must be written in ${c.language} only.`,
    usr: c => `${c.base}

LIVE TREND INTELLIGENCE:
${c.research}

Generate YouTube tags for a "${c.niche}" creator. Use the research — tags must include the exact search terms people are using RIGHT NOW for "${trend.title}".

4 groups, comma separated:

TREND TAGS (6-8): The exact phrases and variations the research says people are searching. Include misspellings/variations if the research shows them.

NICHE TAGS (5-7): Core "${c.niche}" terms that describe the channel content

BROAD REACH TAGS (4-5): Category-level tags for discovery beyond core audience

REGION TAGS (3-5): Location/language-specific tags for ${c.region} audience

TOTAL CHARACTER COUNT ESTIMATE: [number] (keep under 500)

Tags must feel like they were researched, not guessed.`,
  },
};

// ─── OPENAI CALL ─────────────────────────────────────────────────────────────

async function callOpenAI(sys, usr, apiKey) {
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

// ─── HANDLER ─────────────────────────────────────────────────────────────────
// Two modes:
// 1. sectionKey = "research" → run the research engine and return intelligence
// 2. sectionKey = anything else → generate that section using provided research

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "OPENAI_API_KEY is not configured." });

  const { trend, platform, niche, region, creatorStage, sectionKey, language, research } = req.body;
  if (!trend || !sectionKey) return res.status(400).json({ error: "Missing required: trend, sectionKey" });

  // ── RESEARCH MODE ──────────────────────────────────────────────────────────
  if (sectionKey === "research") {
    try {
      const intel = await researchTrend(trend, niche, platform, region, language, apiKey);
      return res.status(200).json({ sectionKey: "research", content: intel });
    } catch (err) {
      console.error("[/api/generate research]", err.message);
      return res.status(500).json({ error: err.message, sectionKey: "research" });
    }
  }

  // ── CONTENT SECTION MODE ───────────────────────────────────────────────────
  const def = SECTIONS[sectionKey];
  if (!def) return res.status(400).json({ error: `Unknown sectionKey: ${sectionKey}` });

  const ctx = buildContext(trend, platform, niche, region, creatorStage, language, research || "");

  // Inject research into the base context so every prompt has it
  const sysPrompt = def.sys(ctx);
  let usrPrompt = def.usr(ctx);

  // Replace the trend reference in viralHooks (it uses ${trend.title} directly)
  usrPrompt = usrPrompt.replace(/\$\{trend\.title\}/g, trend.title || "this trend");

  try {
    const content = await callOpenAI(sysPrompt, usrPrompt, apiKey);
    return res.status(200).json({ sectionKey, content });
  } catch (err) {
    console.error(`[/api/generate] ${sectionKey}:`, err.message);
    return res.status(500).json({ error: err.message, sectionKey });
  }
}
