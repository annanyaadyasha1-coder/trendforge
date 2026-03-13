// pages/api/mapNiche.js
// Takes a free-text description of what a creator does and maps it to
// the best YouTube category + a refined niche label using OpenAI

const VALID_NICHES = [
  "Daily Vlogging","Travel Vlogging","City & Urban Life","Van Life & Nomad",
  "Couple / Family Vlog","Day-in-my-Life","Study With Me / Work With Me","Moving Abroad / Expat Life",
  "Fitness & Gym","Running & Marathon","Mental Health & Wellness","Yoga & Mindfulness",
  "Weight Loss Journey","Nutrition & Meal Prep",
  "Beauty & Skincare","Makeup & GRWM","Fashion & Outfit Ideas","Sustainable Fashion","Men's Grooming & Style",
  "Home Cooking & Recipes","Restaurant Reviews","Street Food","Baking & Desserts","Vegan & Plant-Based",
  "Business & Entrepreneurship","Personal Finance & Investing","Side Hustles","Real Estate","Crypto & Web3",
  "Tech Reviews & Gadgets","Gaming & Esports","AI & Productivity","Coding & Dev Life",
  "Comedy & Skits","Pop Culture & Reactions","Music","Sports","True Crime",
  "Education & Explainers","Motivation & Mindset","Parenting & Family","Relationships & Dating","DIY & Home Decor","Pets & Animals",
  "Film & Animation","Movie Reviews","Anime","Cartoons & Animation","Film Analysis",
];

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { description } = req.body;
  if (!description?.trim()) return res.status(400).json({ error: "Description is required" });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "OPENAI_API_KEY not configured" });

  const prompt = `A content creator describes what they do: "${description}"

Your job is to map this to the best matching niche from this exact list:
${VALID_NICHES.join(", ")}

Also write a short refined niche label (3-6 words, specific) that best describes their content.

Respond ONLY with valid JSON, no markdown, no explanation:
{
  "matchedNiche": "<exact niche from the list above>",
  "refinedLabel": "<short specific label>",
  "confidence": "<high|medium|low>",
  "reason": "<one sentence why this niche fits>"
}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 200,
        messages: [
          { role: "system", content: "You are a content categorisation expert. Always respond with valid JSON only." },
          { role: "user", content: prompt },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "OpenAI error");

    const raw = data.choices?.[0]?.message?.content || "{}";
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("[/api/mapNiche]", err.message);
    return res.status(500).json({ error: err.message });
  }
}
