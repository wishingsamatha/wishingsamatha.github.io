export const AI_STEPS = [
  { key: "name", question: "What's your name?" },
  { key: "relation", question: "How do you know Samatha?" },
  { key: "memory", question: "Any special memory you share?" },
  { key: "tone", question: "What tone would you like?", chips: ["Warm & heartfelt", "Short & sweet", "Deeply emotional", "Playful & funny"] },
];

export const ENGLISH_BANNED_WORDS = ["fuck", "lanza", "pooku", "gudda", "Denggutha", "munda", "balisindda", "gudda balisindda", "shit", "bitch", "asshole", "bastard", "damn", "cunt", "dick", "piss", "slut", "whore", "motherfucker", "fucker", "douchebag", "wanker", "twat", "prick", "dickhead", "ass", "arse", "bugger", "bollocks", "wank", "tosser"];
export const TELUGU_BANNED_WORDS = ["లంజ", "లంజోడుకా", "గుడ్డ", "గుడ్డ బలిసిన", "దెంగై", "దెంగుతా", "మొడ్డ", "పూకు", "పూక", "సుల్లి", "సుల్లి గుడ్డ", "బొంద", "బలిసిన", "నా మొడ్డ", "నీ మొడ్డ", "అమ్మ", "నీ అమ్మ", "చెత్త", "చెత్త నా కొడకా", "వెధవ", "వెధవా", "పిచ్చోడా", "ఎర్రి పూకా", "ఎర్రి పూక", "దెంగు", "దెంగుతున్నా", "గాడిద", "గాడిద కొడకా", "కుక్క", "కుక్క కొడకా", "పంది", "పంది కొడకా", "లంజ కొడకా"];

export const TONE_DRAFTS: Record<string, string> = {
  "Warm & heartfelt": "Samatha, knowing you has been one of the quiet gifts I never expected. You have this rare way of making the people around you feel truly seen. On this birthday, I hope the warmth you pour into the world comes rushing back to you tenfold. Happy birthday — you deserve every beautiful thing.",
  "Short & sweet": "Happy birthday, Samatha! Wishing you a day as wonderful as you are. Here's to another year of laughing too hard and making memories worth keeping. 🎂",
  "Deeply emotional": "Samatha — there are people who change the texture of your days simply by existing in your life. You are one of those people for me. Today I want you to know how deeply you matter, not just for what you do, but for who you are. Happy birthday, with all my heart.",
  "Playful & funny": "Happy birthday to someone who somehow gets better-looking AND funnier every year. Truly unfair for the rest of us. May your cake be huge, your candles few, and your selfies always fire. You absolute legend.",
};

export const CONFETTI_PIECES = Array.from({ length: 18 }, (_, i) => ({ id: i, color: ["#E8A598", "#C9748F", "#D4A574", "rgba(255,255,255,0.6)"][i % 4], left: `${5 + (i * 5.2) % 90}%`, delay: `${(i * 0.12).toFixed(2)}s`, size: i % 3 === 0 ? 6 : i % 3 === 1 ? 4 : 5 }));
export const HERO_PHOTOS = [
  { url: "/images/Photo 1.jpg", alt: "Samatha celebrating her birthday" },
  { url: "/images/Photo 2.jpg", alt: "Samatha smiling in a birthday portrait" },
  { url: "/images/Photo 3.jpg", alt: "Samatha in a festive portrait" },
  { url: "/images/Photo 4.jpg", alt: "Samatha posing for a birthday photo" },
  { url: "/images/Photo 5.jpg", alt: "Samatha in a joyful birthday portrait" },
];