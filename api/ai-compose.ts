import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req: any, res: any) {
    // CORS headers – support multiple origins but return only one
    const allowedOrigins = (process.env.ALLOWED_ORIGIN || '*')
        .split(',')
        .map((o: string) => o.trim())
        .filter(Boolean);

    const requestOrigin = req.headers.origin;

    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
        res.setHeader('Access-Control-Allow-Origin', requestOrigin);
    } else if (allowedOrigins.length === 1 && allowedOrigins[0] === '*') {
        res.setHeader('Access-Control-Allow-Origin', '*');
    } else {
        // fallback to first allowed origin (or '*')
        res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0] || '*');
    }

    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, relation, memory, tone } = req.body;

    const prompt = `Write a birthday wish for a friend named Samatha.
Visitor's name: ${name || 'Anonymous'}
How they know Samatha: ${relation || 'friend'}
A memory or quality they appreciate: ${memory || 'her kindness'}
Desired tone: ${tone || 'warm'}

Write a sincere, concise message under 120 words. Keep it personal and specific.`;

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
        });

        const generatedMessage = completion.choices[0]?.message?.content || 'Happy birthday, Samatha!';
        res.status(200).json({ generatedMessage });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'AI generation failed' });
    }
}