// ============================================================
//   YTAUTO CONFIG — APNI KEYS YAHAN DAALO
//   Sirf yeh file edit karni hai, baaki kuch mat chhedo!
// ============================================================

const CONFIG = {

  // 1. Anthropic API Key
  //    Yahan se lo: https://console.anthropic.com → API Keys
  ANTHROPIC_API_KEY: "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",

  // 2. Google OAuth Client ID (YouTube upload ke liye)
  //    Yahan se lo: https://console.cloud.google.com
  //    → APIs & Services → Credentials → OAuth 2.0 Client ID
  //    → Authorized JS origins mein apna Vercel URL daalo
  GOOGLE_CLIENT_ID: "816516674845-hafgqavj5gkc5k1u6k5v4cr5regnj8q2.apps.googleusercontent.com",

};

module.exports = CONFIG;
