import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers — set before anything else
    res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
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