import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { name, message, voiceUrl } = req.body;

    if (!message && !voiceUrl) return res.status(400).json({ error: 'Either message or voiceUrl is required' });

    try {
        // 1. Store in Supabase
        await supabase.from('wishes').insert({
            visitor_name: name || 'Anonymous',
            message: message || null,
            voice_url: voiceUrl || null,
        });

        // 2. Send email
        await resend.emails.send({
            from: 'Birthday Wishes <onboarding@resend.dev>',
            to: process.env.FRIEND_EMAIL!,
            subject: `New birthday wish from ${name || 'Anonymous'}`,
            text: message || 'A voice message was sent for you!',
        });

        // 3. Send Telegram message
        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: process.env.TELEGRAM_CHAT_ID,
                text: `New birthday wish from ${name || 'Anonymous'}:\n\n${message || 'Voice message attached.'}`,
            }),
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to deliver wish' });
    }
}