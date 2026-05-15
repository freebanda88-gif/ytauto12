"use client";
import { useState, useRef, useEffect } from "react";

const T = {
  bg: "#07090f", card: "#0d1117", border: "#1c2433",
  accent: "#3b82f6", green: "#22c55e", yellow: "#eab308",
  red: "#ef4444", text: "#e2e8f0", muted: "#64748b",
};

function Spinner() {
  return (
    <span style={{
      display: "inline-block", width: 13, height: 13,
      border: "2px solid " + T.muted, borderTopColor: T.accent,
      borderRadius: "50%", animation: "spin .6s linear infinite",
      verticalAlign: "middle",
    }} />
  );
}

function Alert({ msg, kind }) {
  if (!msg) return null;
  const c = kind === "ok" ? T.green : kind === "err" ? T.red : T.accent;
  return (
    <div style={{
      marginTop: 10, padding: "9px 13px",
      background: c + "18", border: "1px solid " + c + "55",
      borderRadius: 7, fontSize: 12, color: c, lineHeight: 1.5,
    }}>
      {kind === "ok" ? "✓ " : kind === "err" ? "✗ " : "› "}{msg}
    </div>
  );
}

function Card({ title, badge, children }) {
  return (
    <div style={{
      background: T.card, border: "1px solid " + T.border,
      borderRadius: 10, marginBottom: 14, overflow: "hidden",
    }}>
      {title && (
        <div style={{
          borderBottom: "1px solid " + T.border, padding: "9px 14px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: 11, color: T.accent, fontWeight: 700, letterSpacing: "0.08em" }}>{title}</span>
          {badge && (
            <span style={{
              fontSize: 10, padding: "2px 8px", borderRadius: 4,
              background: T.green + "22", color: T.green, border: "1px solid " + T.green + "44",
            }}>{badge}</span>
          )}
        </div>
      )}
      <div style={{ padding: 14 }}>{children}</div>
    </div>
  );
}

function Inp({ style, ...props }) {
  return (
    <input {...props} style={{
      width: "100%", background: T.bg, border: "1px solid " + T.border,
      borderRadius: 6, padding: "9px 11px", color: T.text,
      fontSize: 12, fontFamily: "inherit", outline: "none", ...style,
    }} />
  );
}

function TA({ style, ...props }) {
  return (
    <textarea {...props} style={{
      width: "100%", background: T.bg, border: "1px solid " + T.border,
      borderRadius: 6, padding: "9px 11px", color: T.text,
      fontSize: 12, fontFamily: "inherit", outline: "none",
      resize: "vertical", lineHeight: 1.65, ...style,
    }} />
  );
}

function Btn({ children, onClick, disabled, color, block }) {
  const c = color || T.accent;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? T.muted + "22" : c + "1a",
      border: "1px solid " + (disabled ? T.muted : c),
      color: disabled ? T.muted : c,
      padding: "9px 18px", borderRadius: 6, fontSize: 12, fontWeight: 700,
      cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit",
      display: "inline-flex", alignItems: "center", gap: 7,
      width: block ? "100%" : undefined, justifyContent: block ? "center" : undefined,
      opacity: disabled ? 0.55 : 1, transition: "opacity .15s",
    }}>
      {children}
    </button>
  );
}

export default function App() {
  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  const [tab, setTab]               = useState(0);
  const [topic, setTopic]           = useState("");
  const [titleVal, setTitleVal]     = useState("");
  const [descVal, setDescVal]       = useState("");
  const [tagsVal, setTagsVal]       = useState("");
  const [scriptVal, setScriptVal]   = useState("");
  const [audioURL, setAudioURL]     = useState(null);
  const [audioBlob, setAudioBlob]   = useState(null);
  const [token, setToken]           = useState(null);
  const [videoFile, setVideoFile]   = useState(null);
  const [uploadedId, setUploadedId] = useState(null);
  const [pct, setPct]               = useState(0);
  const [voices, setVoices]         = useState([]);

  const [scriptLoad, setScriptLoad] = useState(false);
  const [scriptMsg,  setScriptMsg]  = useState({ msg: "", kind: "" });
  const [voiceLoad,  setVoiceLoad]  = useState(false);
  const [voiceMsg,   setVoiceMsg]   = useState({ msg: "", kind: "" });
  const [uploadLoad, setUploadLoad] = useState(false);
  const [uploadMsg,  setUploadMsg]  = useState({ msg: "", kind: "" });

  const fileRef   = useRef(null);
  const recRef    = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.getElementById("__gis")) return;
    const s = document.createElement("script");
    s.id = "__gis"; s.src = "https://accounts.google.com/gsi/client"; s.async = true;
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const load = () => { const v = window.speechSynthesis.getVoices(); if (v.length) setVoices(v); };
    load();
    window.speechSynthesis.onvoiceschanged = load;
  }, []);

  function getBestVoice() {
    return (
      voices.find(v => v.lang === "en-US" && v.name.includes("Google US English")) ||
      voices.find(v => v.lang === "en-US" && v.name.includes("Google")) ||
      voices.find(v => v.lang === "en-US") ||
      voices.find(v => v.lang.startsWith("en")) ||
      (voices.length ? voices[0] : null)
    );
  }

  async function generateScript() {
    if (!topic.trim()) { setScriptMsg({ msg: "Topic daalna zaroori hai!", kind: "err" }); return; }
    setScriptLoad(true);
    setScriptMsg({ msg: "Claude AI script likh raha hai... (10-15 sec)", kind: "info" });
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Server error");
      setTitleVal(data.title || topic);
      setDescVal(data.desc || "");
      setTagsVal(data.tags || "");
      setScriptVal(data.script || "");
      setScriptMsg({ msg: "Script ready! Review karo phir voice banao.", kind: "ok" });
      setTimeout(() => setTab(2), 1000);
    } catch (e) {
      setScriptMsg({ msg: "Error: " + e.message, kind: "err" });
    }
    setScriptLoad(false);
  }

  function generateVoice() {
    if (!scriptVal.trim()) { setVoiceMsg({ msg: "Pehle script generate karo!", kind: "err" }); return; }
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setVoiceMsg({ msg: "Browser speech not supported. Chrome use karo.", kind: "err" }); return;
    }
    window.speechSynthesis.cancel();
    setVoiceLoad(true); setAudioURL(null); setAudioBlob(null); chunksRef.current = [];

    const voice = getBestVoice();
    if (!voice) {
      setVoiceMsg({ msg: "Voice load nahi hui. Page refresh karo ya Chrome use karo.", kind: "err" });
      setVoiceLoad(false); return;
    }

    let recorder = null;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const dest = ctx.createMediaStreamDestination();
      recorder = new MediaRecorder(dest.stream);
      recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob); setAudioURL(URL.createObjectURL(blob));
        setVoiceMsg({ msg: "Voice ready! Download karo aur CapCut mein use karo.", kind: "ok" });
        setVoiceLoad(false);
        try { ctx.close(); } catch (_) {}
      };
      recorder.start(200); recRef.current = recorder;
    } catch (_) { recorder = null; }

    const raw = scriptVal.replace(/\n+/g, " ").trim();
    const parts = raw.match(/[^.!?]+[.!?]*/g) || [raw];
    const segments = [];
    let buf = "";
    for (const p of parts) {
      if (buf.length + p.length > 200) { if (buf.trim()) segments.push(buf.trim()); buf = p; }
      else buf += p;
    }
    if (buf.trim()) segments.push(buf.trim());

    let idx = 0;
    function next() {
      if (idx >= segments.length) {
        if (recorder && recorder.state === "recording") recorder.stop();
        else { setVoiceMsg({ msg: "Done! ElevenLabs se better quality milegi.", kind: "ok" }); setVoiceLoad(false); }
        return;
      }
      const u = new SpeechSynthesisUtterance(segments[idx++]);
      u.voice = voice; u.lang = "en-US"; u.rate = 0.92; u.pitch = 1.0; u.volume = 1.0;
      u.onend = next;
      u.onerror = function(ev) {
        if (ev.error !== "interrupted" && ev.error !== "canceled") {
          setVoiceMsg({ msg: "Voice error: " + ev.error, kind: "err" }); setVoiceLoad(false);
        }
      };
      window.speechSynthesis.speak(u);
    }
    setVoiceMsg({ msg: "Speaking with " + voice.name + "...", kind: "info" });
    next();
  }

  function stopVoice() {
    if (typeof window !== "undefined") window.speechSynthesis && window.speechSynthesis.cancel();
    if (recRef.current && recRef.current.state === "recording") recRef.current.stop();
    else { setVoiceLoad(false); setVoiceMsg({ msg: "Stopped.", kind: "info" }); }
  }

  function downloadAudio() {
    if (!audioBlob || !audioURL) return;
    const a = document.createElement("a");
    a.href = audioURL;
    a.download = (titleVal || "voice").replace(/[^a-z0-9]/gi, "_").slice(0, 40) + ".webm";
    a.click();
  }

  function signIn() {
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.includes("APNA-CLIENT")) {
      setUploadMsg({ msg: "config.js mein GOOGLE_CLIENT_ID daalo pehle!", kind: "err" }); return;
    }
    function attempt() {
      if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
        setTimeout(attempt, 1000); return;
      }
      try {
        window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube",
          callback: function(resp) {
            if (resp && resp.access_token) {
              setToken(resp.access_token);
              setUploadMsg({ msg: "Google connected! Video file select karo.", kind: "ok" });
            } else {
              setUploadMsg({ msg: "Sign-in cancel ho gaya.", kind: "err" });
            }
          },
          error_callback: function(e) {
            setUploadMsg({ msg: "OAuth error: " + (e.type || JSON.stringify(e)), kind: "err" });
          },
        }).requestAccessToken({ prompt: "consent" });
      } catch (e) { setUploadMsg({ msg: e.message, kind: "err" }); }
    }
    attempt();
  }

  async function uploadVideo() {
    if (!token) { setUploadMsg({ msg: "Pehle Google sign in karo!", kind: "err" }); return; }
    if (!videoFile) { setUploadMsg({ msg: "Video file select karo!", kind: "err" }); return; }
    setUploadLoad(true); setPct(1);
    setUploadMsg({ msg: "Upload initialize ho raha hai...", kind: "info" });
    try {
      const tagList = tagsVal.split(",").map(t => t.trim()).filter(Boolean).slice(0, 15);
      const meta = {
        snippet: {
          title: (titleVal || topic).slice(0, 100),
          description: (descVal || topic) + "\n\n" + tagList.map(t => "#" + t).join(" "),
          tags: tagList, categoryId: "28",
          defaultLanguage: "en", defaultAudioLanguage: "en",
        },
        status: { privacyStatus: "private", selfDeclaredMadeForKids: false },
      };

      const initRes = await fetch(
        "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
        {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json; charset=UTF-8",
            "X-Upload-Content-Type": videoFile.type || "video/mp4",
            "X-Upload-Content-Length": String(videoFile.size),
          },
          body: JSON.stringify(meta),
        }
      );

      if (!initRes.ok) {
        const err = await initRes.json().catch(() => ({}));
        throw new Error(
          (err && err.error && err.error.message)
            ? err.error.message
            : "Init failed HTTP " + initRes.status + " — Google Console mein Authorized Origins check karo"
        );
      }

      const uploadURI = initRes.headers.get("location");
      if (!uploadURI) throw new Error("Upload URI nahi mila. Google Console mein apna Vercel URL authorized origins mein add karo.");

      const CHUNK = 5 * 1024 * 1024;
      let offset = 0;
      while (offset < videoFile.size) {
        const end = Math.min(offset + CHUNK - 1, videoFile.size - 1);
        const percent = Math.round((offset / videoFile.size) * 95) + 3;
        setPct(percent); setUploadMsg({ msg: "Uploading... " + percent + "%", kind: "info" });

        const chunkRes = await fetch(uploadURI, {
          method: "PUT",
          headers: {
            "Content-Range": "bytes " + offset + "-" + end + "/" + videoFile.size,
            "Content-Type": videoFile.type || "video/mp4",
          },
          body: videoFile.slice(offset, end + 1),
        });

        if (chunkRes.status === 308) {
          const rng = chunkRes.headers.get("range");
          offset = rng ? parseInt(rng.split("-")[1]) + 1 : end + 1;
        } else if (chunkRes.status === 200 || chunkRes.status === 201) {
          const result = await chunkRes.json();
          setUploadedId(result.id); setPct(100);
          setUploadMsg({ msg: "Video upload ho gaya! ID: " + result.id, kind: "ok" });
          break;
        } else {
          const err = await chunkRes.json().catch(() => ({}));
          throw new Error(
            (err && err.error && err.error.message) ? err.error.message : "Chunk error HTTP " + chunkRes.status
          );
        }
      }
    } catch (e) { setUploadMsg({ msg: e.message, kind: "err" }); }
    setUploadLoad(false);
  }

  const tabLabels = ["⚙️ Setup", "📝 Script", "🎤 Voice", "📤 Upload"];
  const done = [true, scriptVal.length > 50, !!audioURL, !!uploadedId];

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: T.bg, minHeight: "100vh", color: T.text }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input, textarea, button { font-family: inherit; }
        input:focus, textarea:focus { border-color: #3b82f6 !important; outline: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #07090f; }
        ::-webkit-scrollbar-thumb { background: #1c2433; border-radius: 2px; }
        a { color: #3b82f6; }
        button:hover:not(:disabled) { opacity: 0.85; }
      `}</style>

      {/* Header */}
      <div style={{
        background: T.card, borderBottom: "1px solid " + T.border,
        padding: "12px 16px", position: "sticky", top: 0, zIndex: 10,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{ fontSize: 20 }}>▶</span>
        <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.02em" }}>
          YT<span style={{ color: T.accent }}>AUTO</span>
        </span>
        <span style={{ fontSize: 10, color: T.muted, display: "none" }}>|</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 4, flexWrap: "wrap" }}>
          {tabLabels.map((label, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              background: tab === i ? T.accent + "22" : "transparent",
              border: "1px solid " + (tab === i ? T.accent : done[i] && i !== tab ? T.green + "77" : T.border),
              color: tab === i ? T.accent : done[i] && i !== tab ? T.green : T.muted,
              padding: "5px 10px", borderRadius: 5, fontSize: 11,
              cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
            }}>
              {done[i] && i !== tab ? "✓ " : ""}{label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 660, margin: "0 auto", padding: "18px 14px" }}>

        {/* TAB 0: SETUP */}
        {tab === 0 && (
          <div>
            <Card title="SETUP GUIDE — SIRF YEH KARO">
              <div style={{
                background: T.green + "10", border: "1px solid " + T.green + "44",
                borderRadius: 8, padding: "12px 14px", marginBottom: 16,
                fontSize: 12, color: T.green, lineHeight: 2,
              }}>
                ✅ Step 1: <code style={{ background: T.bg, padding: "1px 6px", borderRadius: 3, color: T.yellow }}>config.js</code> file mein apni keys daalo<br />
                ✅ Step 2: GitHub pe push karo → Vercel pe deploy karo<br />
                ✅ Step 3: Google Client ID setup karo (YouTube upload ke liye)
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: T.accent, marginBottom: 8, fontWeight: 700 }}>
                  STEP 1 — config.js EDIT KARO
                </div>
                <div style={{
                  background: T.bg, border: "1px solid " + T.border,
                  borderRadius: 7, padding: "14px", fontFamily: "monospace", fontSize: 12,
                  lineHeight: 1.9, color: T.text,
                }}>
                  <div style={{ color: T.muted, marginBottom: 8, fontSize: 10 }}>📁 config.js (root folder mein hai)</div>
                  <div><span style={{ color: T.muted }}>ANTHROPIC_API_KEY: </span><span style={{ color: T.green }}>"sk-ant-YOUR-KEY"</span></div>
                  <div style={{ marginTop: 4 }}><span style={{ color: T.muted }}>GOOGLE_CLIENT_ID: </span><span style={{ color: T.green }}>"xxxxx.apps.googleusercontent.com"</span></div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: T.accent, marginBottom: 8, fontWeight: 700 }}>
                  STEP 2 — KEYS KAHAN SE LO
                </div>
                {[
                  ["🤖 Anthropic Key", "console.anthropic.com → API Keys → Create Key", "https://console.anthropic.com"],
                  ["📺 Google Client ID", "console.cloud.google.com → Credentials → OAuth 2.0", "https://console.cloud.google.com"],
                ].map(([label, desc, href], i) => (
                  <div key={i} style={{
                    display: "flex", gap: 10, alignItems: "flex-start",
                    padding: "10px 12px", background: T.bg,
                    border: "1px solid " + T.border, borderRadius: 7, marginBottom: 8,
                  }}>
                    <span style={{ fontSize: 18 }}>{label.split(" ")[0]}</span>
                    <div>
                      <div style={{ fontSize: 12, color: T.text, marginBottom: 3 }}>{label.slice(3)}</div>
                      <div style={{ fontSize: 11, color: T.muted }}>{desc}</div>
                      <a href={href} target="_blank" rel="noreferrer" style={{ fontSize: 11 }}>→ Open</a>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: T.accent, marginBottom: 8, fontWeight: 700 }}>
                  STEP 3 — GOOGLE CLIENT ID SETUP (YouTube upload ke liye)
                </div>
                {[
                  "console.cloud.google.com → New Project → Name: YTAuto",
                  "APIs & Services → Library → YouTube Data API v3 → Enable",
                  "Credentials → Create Credentials → OAuth 2.0 Client ID",
                  "Configure Consent Screen → External → App name → Save",
                  "Application type: Web Application",
                  "Authorized JS Origins → ADD: https://your-app.vercel.app",
                  "Create → Copy Client ID → config.js mein paste karo",
                ].map((step, i) => (
                  <div key={i} style={{
                    display: "flex", gap: 9, padding: "6px 0",
                    borderBottom: i < 6 ? "1px solid " + T.border : "none",
                    alignItems: "flex-start",
                  }}>
                    <span style={{
                      minWidth: 22, height: 22, background: T.accent + "22", color: T.accent,
                      borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 700, flexShrink: 0,
                    }}>{i + 1}</span>
                    <span style={{ fontSize: 12, color: T.text, lineHeight: 1.5 }}>{step}</span>
                  </div>
                ))}
              </div>

              <Btn color={T.green} onClick={() => setTab(1)}>
                Setup ho gayi? → Video Banate Hain 🚀
              </Btn>
            </Card>

            {/* Status check */}
            <Card title="CURRENT STATUS">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  {
                    label: "Anthropic API Key",
                    ok: GOOGLE_CLIENT_ID.length > 10,
                    msg: "config.js mein ANTHROPIC_API_KEY set karo",
                  },
                  {
                    label: "Google Client ID",
                    ok: GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.includes("APNA-CLIENT"),
                    msg: "config.js mein GOOGLE_CLIENT_ID set karo",
                  },
                ].map((item, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 10px", background: T.bg,
                    border: "1px solid " + (item.ok ? T.green + "44" : T.border), borderRadius: 6,
                  }}>
                    <span style={{ fontSize: 12, color: T.text }}>{item.label}</span>
                    <span style={{ fontSize: 11, color: item.ok ? T.green : T.yellow }}>
                      {item.ok ? "✓ Set" : "⚠ " + item.msg}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* TAB 1: SCRIPT */}
        {tab === 1 && (
          <div>
            <Card title="AI SCRIPT GENERATOR" badge="Claude AI">
              <p style={{ fontSize: 11, color: T.muted, marginBottom: 10 }}>
                Topic likho → AI poora script + title + tags + description likhega
              </p>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: T.accent, marginBottom: 5 }}>VIDEO TOPIC</div>
                <Inp
                  placeholder="e.g. Top 5 FREE AI tools to replace Photoshop in 2026"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !scriptLoad) generateScript(); }}
                />
              </div>
              <Btn onClick={generateScript} disabled={scriptLoad || !topic.trim()}>
                {scriptLoad ? <><Spinner /> Generating...</> : "⚡ Generate Script + Title + Tags"}
              </Btn>
              <Alert {...scriptMsg} />
            </Card>

            {scriptVal.length > 0 && (
              <>
                <Card title="YOUTUBE TITLE">
                  <Inp value={titleVal} onChange={e => setTitleVal(e.target.value)} style={{ fontSize: 13 }} />
                  <div style={{ fontSize: 10, color: titleVal.length > 65 ? T.red : T.muted, marginTop: 5 }}>
                    {titleVal.length}/65 chars {titleVal.length > 65 ? "— Thoda chota karo!" : "✓"}
                  </div>
                </Card>
                <Card title="DESCRIPTION">
                  <TA value={descVal} onChange={e => setDescVal(e.target.value)} rows={4} />
                </Card>
                <Card title="TAGS">
                  <Inp value={tagsVal} onChange={e => setTagsVal(e.target.value)} placeholder="tag1, tag2, tag3..." />
                  <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {tagsVal.split(",").filter(t => t.trim()).map((t, i) => (
                      <span key={i} style={{
                        fontSize: 10, padding: "2px 8px", borderRadius: 20,
                        background: T.accent + "18", color: T.accent, border: "1px solid " + T.accent + "44",
                      }}>{"#" + t.trim()}</span>
                    ))}
                  </div>
                </Card>
                <Card title="NARRATION SCRIPT" badge={scriptVal.split(" ").length + " words"}>
                  <TA value={scriptVal} onChange={e => setScriptVal(e.target.value)} rows={14} style={{ fontSize: 11, lineHeight: 1.8 }} />
                  <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                    <Btn color={T.muted} onClick={() => navigator.clipboard.writeText(scriptVal).then(() => setScriptMsg({ msg: "Copied!", kind: "ok" }))}>
                      📋 Copy
                    </Btn>
                    <Btn color={T.green} onClick={() => setTab(2)}>Next: Voice →</Btn>
                  </div>
                </Card>
              </>
            )}
          </div>
        )}

        {/* TAB 2: VOICE */}
        {tab === 2 && (
          <div>
            <Card title="AI VOICE GENERATOR" badge="Free — No Key">
              <div style={{
                padding: "9px 12px", marginBottom: 12, borderRadius: 6,
                background: T.green + "12", border: "1px solid " + T.green + "44",
                fontSize: 11, color: T.green, lineHeight: 1.7,
              }}>
                ✓ Browser built-in US English voice — zero API key<br />
                ✓ Chrome mein best quality milegi
              </div>
              <div style={{
                background: T.bg, border: "1px solid " + T.border,
                borderRadius: 6, padding: "10px 12px", marginBottom: 12, fontSize: 11,
              }}>
                <div style={{ color: T.muted, marginBottom: 3 }}>Topic</div>
                <div style={{ color: T.text, marginBottom: 8 }}>{topic || "—"}</div>
                <div style={{ color: T.muted, marginBottom: 3 }}>Voice</div>
                <div style={{ color: T.accent }}>
                  {getBestVoice() ? getBestVoice().name : "Loading... Chrome use karo"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Btn onClick={generateVoice} disabled={voiceLoad || !scriptVal.trim()}>
                  {voiceLoad ? <><Spinner /> Recording...</> : "🎤 Generate Voiceover"}
                </Btn>
                {voiceLoad && <Btn color={T.red} onClick={stopVoice}>⏹ Stop</Btn>}
              </div>
              <Alert {...voiceMsg} />
              <div style={{
                marginTop: 12, padding: "9px 12px", borderRadius: 6,
                background: T.yellow + "10", border: "1px solid " + T.yellow + "44",
                fontSize: 11, color: T.yellow, lineHeight: 1.7,
              }}>
                💡 Premium quality chahiye?{" "}
                <a href="https://elevenlabs.io/speech-synthesis" target="_blank" rel="noreferrer"
                  onClick={() => navigator.clipboard.writeText(scriptVal).catch(() => {})}>
                  ElevenLabs.io
                </a>
                {" "}→ Script paste karo → MP3 download karo (free: 10K chars/month)
              </div>
            </Card>

            {audioURL && (
              <Card title="VOICEOVER READY" badge="✓ Done">
                <audio controls src={audioURL} style={{ width: "100%", marginBottom: 12 }} />
                <div style={{
                  padding: "10px 12px", marginBottom: 12, borderRadius: 6,
                  background: T.yellow + "10", border: "1px solid " + T.yellow + "44",
                  fontSize: 11, color: T.yellow, lineHeight: 1.9,
                }}>
                  📱 NEXT STEPS:<br />
                  1. Download audio ⬇ (WebM — CapCut support karta hai)<br />
                  2. CapCut → New project → <a href="https://pexels.com" target="_blank" rel="noreferrer">Pexels.com</a> se footage lo<br />
                  3. Audio import → Export MP4 1080p<br />
                  4. Upload tab mein aao → YouTube pe upload!
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Btn color={T.green} onClick={downloadAudio}>⬇ Download Audio</Btn>
                  <Btn onClick={() => setTab(3)}>Next: Upload →</Btn>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* TAB 3: UPLOAD */}
        {tab === 3 && (
          <div>
            <Card title="YOUTUBE UPLOADER" badge="Data API v3">
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 8 }}>A — GOOGLE ACCOUNT CONNECT</div>
                {token ? (
                  <div style={{
                    padding: "9px 12px", borderRadius: 6,
                    background: T.green + "15", border: "1px solid " + T.green + "44",
                    fontSize: 12, color: T.green,
                  }}>✓ Google connected! Video file select karo.</div>
                ) : (
                  <Btn onClick={signIn}>🔑 Sign in with Google</Btn>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 8 }}>B — VIDEO FILE SELECT KARO</div>
                <input ref={fileRef} type="file" accept="video/*" style={{ display: "none" }}
                  onChange={e => setVideoFile(e.target.files[0])} />
                <div
                  onClick={() => fileRef.current && fileRef.current.click()}
                  style={{
                    cursor: "pointer", border: "1px dashed " + (videoFile ? T.green : T.border),
                    borderRadius: 7, padding: "22px", textAlign: "center",
                    background: videoFile ? T.green + "08" : "transparent", transition: "all .15s",
                  }}
                >
                  {videoFile ? (
                    <div>
                      <div style={{ color: T.green, fontSize: 13, marginBottom: 3 }}>✓ {videoFile.name}</div>
                      <div style={{ color: T.muted, fontSize: 11 }}>{(videoFile.size / 1024 / 1024).toFixed(1)} MB</div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 30, marginBottom: 6 }}>📁</div>
                      <div style={{ fontSize: 12, color: T.muted }}>Click to select video</div>
                      <div style={{ fontSize: 10, color: T.border, marginTop: 4 }}>MP4 · MOV · WebM</div>
                    </div>
                  )}
                </div>
              </div>

              {titleVal && (
                <div style={{
                  background: T.bg, border: "1px solid " + T.border,
                  borderRadius: 6, padding: "9px 12px", marginBottom: 12, fontSize: 11, lineHeight: 1.7,
                }}>
                  <span style={{ color: T.muted }}>Title: </span>
                  <span style={{ color: T.text }}>{titleVal.slice(0, 60)}{titleVal.length > 60 ? "..." : ""}</span>
                  <br />
                  <span style={{ color: T.yellow, fontSize: 10 }}>⚠ PRIVATE upload hogi — Studio mein baad mein Public karo</span>
                </div>
              )}

              {uploadLoad && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.muted, marginBottom: 4 }}>
                    <span>Uploading...</span><span>{pct}%</span>
                  </div>
                  <div style={{ background: T.border, borderRadius: 4, height: 5 }}>
                    <div style={{
                      width: pct + "%", height: "100%", borderRadius: 4,
                      background: "linear-gradient(90deg, " + T.accent + ", " + T.green + ")",
                      transition: "width .4s ease",
                    }} />
                  </div>
                </div>
              )}

              <Btn block color={T.green} disabled={uploadLoad || !token || !videoFile} onClick={uploadVideo}>
                {uploadLoad ? <><Spinner /> {"Uploading " + pct + "%"}...</> : "🚀 Upload to YouTube"}
              </Btn>
              <Alert {...uploadMsg} />
            </Card>

            {uploadedId && (
              <Card title="🎉 VIDEO UPLOADED!">
                <div style={{ textAlign: "center", padding: "10px 0" }}>
                  <div style={{ fontSize: 44, marginBottom: 10 }}>🎬</div>
                  <div style={{ fontSize: 14, color: T.green, fontWeight: 700, marginBottom: 5 }}>
                    Video successfully uploaded!
                  </div>
                  <div style={{ fontSize: 11, color: T.muted, marginBottom: 16 }}>
                    Video ID: <code style={{ color: T.accent, background: T.bg, padding: "2px 6px", borderRadius: 3 }}>{uploadedId}</code>
                  </div>
                  <a
                    href={"https://studio.youtube.com/video/" + uploadedId + "/edit"}
                    target="_blank" rel="noreferrer"
                    style={{
                      display: "inline-block", background: T.red + "20",
                      border: "1px solid " + T.red + "66", color: T.red,
                      padding: "9px 20px", borderRadius: 6, fontSize: 12,
                      textDecoration: "none", fontWeight: 700,
                    }}
                  >Open YouTube Studio →</a>
                  <div style={{ marginTop: 14, fontSize: 11, color: T.muted, lineHeight: 2 }}>
                    1. Thumbnail add karo (Canva free mein banao)<br />
                    2. Private → Public karo<br />
                    3. Affiliate links description mein daalo<br />
                    4. Publish karo! 🔥
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
