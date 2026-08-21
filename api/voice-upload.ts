
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: any, res: any) {
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

    const { audioBase64 } = req.body;
    if (!audioBase64) return res.status(400).json({ error: 'audioBase64 is required' });

    const buffer = Buffer.from(audioBase64, 'base64');
    const filename = `voice-${Date.now()}.webm`;

    const { data, error } = await supabase.storage
        .from('wishes')
        .upload(`audio/${filename}`, buffer, { contentType: 'audio/webm' });

    if (error) {
        console.error(error);
        return res.status(500).json({ error: 'Upload failed' });
    }

    const audioUrl = supabase.storage.from('wishes').getPublicUrl(`audio/${filename}`).data.publicUrl;
    res.status(200).json({ audioUrl });
}