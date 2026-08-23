import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers – support multiple origins but return only one
  const allowedOrigins = (process.env.ALLOWED_ORIGIN || "*")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  const requestOrigin = req.headers.origin;

  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    res.setHeader("Access-Control-Allow-Origin", requestOrigin);
  } else if (allowedOrigins.length === 1 && allowedOrigins[0] === "*") {
    res.setHeader("Access-Control-Allow-Origin", "*");
  } else {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigins[0] || "*");
  }

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { messagePassword } = req.body || {};
  const isFullAccess = Boolean(process.env.VIEW_MESSAGES_PASSWORD) &&
    messagePassword === process.env.VIEW_MESSAGES_PASSWORD;

  try {
    const { data, error } = await supabase
      .from("wishes")
      .select(isFullAccess ? "*" : "id, visitor_name, location, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.status(200).json({ wishes: data || [], fullAccess: isFullAccess });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to fetch wishes",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}