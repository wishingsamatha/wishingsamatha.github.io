import { useState, useEffect } from "react";
import type { Wish } from "../types";

export function ViewWishes({ onBack }: { onBack: () => void }) {
  const [messagePassword, setMessagePassword] = useState("");
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [selectedGroupName, setSelectedGroupName] = useState<string | null>(null);
  const [fullAccess, setFullAccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [visibleCount, setVisibleCount] = useState(5);

  const PAGE_PASSWORD = "";
  const API_BASE = import.meta.env.DEV ? "" : (import.meta.env.VITE_API_BASE || "https://wishingsamatha-github-io-5f.vercel.app");

  const fetchWishes = async (withMessages = false) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/wishes-list`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: PAGE_PASSWORD,
          messagePassword: withMessages ? messagePassword : undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Unable to load wishes");
        return;
      }
      setWishes(data.wishes || []);
      setVisibleCount(5);
      if (withMessages) setFullAccess(Boolean(data.fullAccess));
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchWishes();
  }, []);

  const grouped = wishes.reduce<Record<string, Wish[]>>((groups, wish) => {
    const key = (wish.visitor_name || "Anonymous").trim().toLowerCase();
    (groups[key] ||= []).push(wish);
    return groups;
  }, {});

  const groupSummaries = Object.entries(grouped)
    .map(([key, items]) => {
      items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const latest = items[items.length - 1];
      return { key, displayName: items[0].visitor_name?.trim() || "Anonymous", preview: latest.message?.trim() || (latest.voice_url ? "Voice note" : "Message locked"), location: latest.location, lastDate: latest.created_at, messages: items, count: items.length };
    })
    .sort((a, b) => new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime());

  const visibleGroups = groupSummaries.slice(0, visibleCount);
  const selectedGroup = groupSummaries.find((group) => group.key === selectedGroupName) || null;

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row px-4 py-6 gap-4"
      style={{
        background: "radial-gradient(ellipse at 50% 10%, #1c1220 0%, #0c0a10 65%)",
        fontFamily: "var(--font-outfit)",
      }}
    >
      <button
        onClick={onBack}
        className="absolute top-5 left-5 z-20 px-4 py-2 rounded-xl text-sm transition-all"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)" }}
      >
        ← Back
      </button>

      <div className={`${selectedGroupName ? "hidden md:block" : "block"} w-full md:w-[320px] md:shrink-0 glass rounded-3xl p-4 overflow-y-auto`} style={{ maxHeight: "calc(100vh - 3rem)", marginTop: "3rem" }}>
        <h2 className="text-xl font-light mb-4" style={{ fontFamily: "var(--font-fraunces)", color: "#f5f0eb" }}>Wishes</h2>
        {loading && wishes.length === 0 && <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Loading…</p>}
        {error && <p className="text-xs text-red-400 mb-4">{error}</p>}
        {!loading && wishes.length === 0 && !error && <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>No wishes yet.</p>}
        <div className="space-y-2">
          {visibleGroups.map((group) => (
            <button
              key={group.key}
              onClick={() => { setSelectedGroupName(group.key); setError(""); }}
              className="w-full flex items-center gap-3 rounded-2xl p-3 text-left transition-all hover:scale-[1.01]"
              style={{ background: selectedGroupName === group.key ? "rgba(232,131,106,0.15)" : "rgba(255,255,255,0.04)", border: selectedGroupName === group.key ? "1px solid rgba(232,131,106,0.4)" : "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0" style={{ background: "linear-gradient(135deg, #e8836a, #c4604a)", color: "#fff" }}>
                {group.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate" style={{ color: "#f5f0eb" }}>{group.displayName}</p>
                  <span className="text-xs ml-2" style={{ color: "rgba(255,255,255,0.35)" }}>{group.count} msg{group.count > 1 ? "s" : ""}</span>
                </div>
                <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.35)" }}>{group.preview} · {group.location || "No location"} · {new Date(group.lastDate).toLocaleDateString()}</p>
              </div>
            </button>
          ))}
        </div>
        {groupSummaries.length > visibleCount && (
          <button
            onClick={() => setVisibleCount((previous) => Math.min(previous + 5, groupSummaries.length))}
            className="w-full mt-4 py-2.5 rounded-xl text-sm transition-all hover:scale-[1.01]"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
          >
            View More ({groupSummaries.length - visibleCount} remaining)
          </button>
        )}
      </div>

      <div className={`${selectedGroupName ? "flex-1 block" : "hidden md:flex flex-1"} glass rounded-3xl p-5 md:p-7 overflow-y-auto`} style={{ maxHeight: "calc(100vh - 3rem)", marginTop: "3rem", minHeight: 400 }}>
        {selectedGroupName && (
          <button
            onClick={() => setSelectedGroupName(null)}
            className="md:hidden mb-4 px-3 py-1.5 rounded-lg text-xs"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)" }}
          >
            ← Back to wishes
          </button>
        )}

        {!selectedGroup && <div className="h-full flex flex-col items-center justify-center text-center"><p style={{ color: "rgba(255,255,255,0.35)" }}>Select a person from the left to view their wishes</p></div>}

        {selectedGroup && !fullAccess && (
          <div className="h-full flex flex-col items-center justify-center max-w-sm mx-auto text-center">
            <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.6)" }}>Enter the secret code to reveal {selectedGroup.displayName}'s messages</p>
            <input type="password" value={messagePassword} onChange={(event) => setMessagePassword(event.target.value)} placeholder="Message password" className="w-full rounded-xl px-4 py-3 text-sm outline-none mb-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "white" }} />
            <button onClick={() => void fetchWishes(true)} disabled={loading} className="w-full py-3 rounded-xl text-sm text-white" style={{ background: "linear-gradient(135deg, #e8836a, #c4604a)", boxShadow: "0 8px 28px rgba(232,131,106,0.32)" }}>{loading ? "Unlocking…" : "Reveal messages"}</button>
            {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
          </div>
        )}

        {selectedGroup && fullAccess && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-white/10">
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold" style={{ background: "linear-gradient(135deg, #e8836a, #c4604a)", color: "#fff" }}>{selectedGroup.displayName.charAt(0).toUpperCase()}</div>
              <div>
                <p className="font-medium" style={{ color: "#f5f0eb" }}>{selectedGroup.displayName}</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{selectedGroup.location || "No location"} · {selectedGroup.count} message{selectedGroup.count > 1 ? "s" : ""}</p>
              </div>
            </div>
            {selectedGroup.messages.map((wish) => (
              <div key={wish.id} className="space-y-2">
                {wish.message && <div className="flex justify-start"><div className="max-w-[80%] rounded-2xl rounded-tl-none px-4 py-3 text-sm" style={{ background: "rgba(232,131,106,0.12)", border: "1px solid rgba(232,131,106,0.25)", color: "rgba(255,255,255,0.9)", lineHeight: 1.6 }}>{wish.message}</div></div>}
                {wish.voice_url && <div className="flex justify-start"><div className="rounded-2xl rounded-tl-none px-4 py-3" style={{ background: "rgba(232,131,106,0.12)", border: "1px solid rgba(232,131,106,0.25)" }}><audio controls src={wish.voice_url} className="w-full max-w-sm" /></div></div>}
                <p className="text-xs text-right" style={{ color: "rgba(255,255,255,0.3)" }}>{new Date(wish.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

