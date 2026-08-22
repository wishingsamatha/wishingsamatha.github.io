import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, location, message, voiceUrl } = req.body;

// Mandatory name check
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }

  if (!message && !voiceUrl) {
    return res.status(400).json({ error: 'Either message or voiceUrl is required' });
  }

    try {
        // 1. Store in Supabase
        const { error: insertError } = await supabase.from('wishes').insert({
            visitor_name: name.trim(),
            location: location || null,
            message: message || null,
            voice_url: voiceUrl || null,
        });
        if (insertError) throw insertError;

        // 2. Email with attachment
        const emailText = message
            ? message
            : 'A voice message was sent for you! (see attachment)';
        const subject = `New birthday wish from ${name.trim()}`;

        const emailOptions: any = {
            from: 'Birthday Wishes <onboarding@resend.dev>',
            to: process.env.FRIEND_EMAIL!,
            subject,
            text: emailText,
        };

        if (voiceUrl) {
            const audioResponse = await fetch(voiceUrl);
            if (audioResponse.ok) {
                const arrayBuffer = await audioResponse.arrayBuffer();
                const audioBuffer = Buffer.from(arrayBuffer);
                emailOptions.attachments = [
                    {
                        filename: `voice-message-${Date.now()}.webm`,
                        content: audioBuffer,
                    },
                ];
            }
        }

        await resend.emails.send(emailOptions);

        // 3. Telegram delivery with fallback
        const telegramBase = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
        const caption = `New voice wish from ${name.trim()}${message ? ': ' + message : ''}`;

        if (voiceUrl) {
            // Try sendAudio first
            const sendAudioRes = await fetch(`${telegramBase}/sendAudio`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: process.env.TELEGRAM_CHAT_ID,
                    audio: voiceUrl,
                    caption,
                }),
            });

            const audioData = await sendAudioRes.json();

            // If sendAudio fails, fallback to sendDocument
            if (!audioData.ok) {
                await fetch(`${telegramBase}/sendDocument`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: process.env.TELEGRAM_CHAT_ID,
                        document: voiceUrl,
                        caption,
                    }),
                });
            }
        } else {
            // Text only
            await fetch(`${telegramBase}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: process.env.TELEGRAM_CHAT_ID,
                    text: `New birthday wish from ${name.trim()}:\n\n${message}`,
                }),
            });
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Failed to deliver wish',
            details: error instanceof Error ? error.message : String(error),
        });
    }
}