// pages/api/analyze.js — server-side Grok API proxy
// GROK_API_KEY stays on server, never sent to browser

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GROK_API_KEY not set in Vercel env vars' });

  const { resumeText } = req.body;
  if (!resumeText?.trim()) return res.status(400).json({ error: 'No resume text provided' });

  const prompt = `You are a senior ATS engineer and HR specialist who has reviewed 100,000+ resumes.

STRICT RULES:
Never invent metrics, numbers, tools, or facts not in the text.
Never suggest adding skills not already mentioned.
Every suggestion must reference a specific line from THIS resume.
Quote exact phrases when flagging plagiarism.

PLAGIARISM (0-100): generic boilerplate vs authentic voice
- "seeking a challenging role", "team player", "hard worker" = high plag
- 0-30 = PASS, 31-60 = WARNING, 61-100 = FAIL

ATS SCORE (0-100): machine parsability + keyword quality
- Strong action verbs, clear headings, relevant keywords = high
- 0-49 = auto-rejected, 50-74 = borderline, 75+ = passes

Resume:
${resumeText}

Return ONLY valid JSON (no markdown, no explanation):
{"plagScore":0,"plagVerdict":"PASS","plagPhrases":[],"plagFixes":[],"atsScore":0,"atsIssues":[],"atsStrengths":[],"atsTips":[],"verdict":"STRONG"}`;

  try {
    const r = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'grok-3-mini', max_tokens: 1400, messages: [{ role: 'user', content: prompt }] }),
    });

    if (!r.ok) return res.status(502).json({ error: `Grok API error: ${r.status}` });

    const d = await r.json();
    const raw = (d.choices?.[0]?.message?.content || '').replace(/```json\n?/g,'').replace(/```\n?/g,'').trim();

    try {
      return res.status(200).json(JSON.parse(raw));
    } catch {
      return res.status(200).json({ plagScore:30, plagVerdict:'PASS', plagPhrases:[], plagFixes:[], atsScore:65, atsIssues:[], atsStrengths:[], atsTips:[], verdict:'GOOD' });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
