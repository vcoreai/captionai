import { useState, useEffect, useRef, useCallback } from "react";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const RAZORPAY_KEY = "rzp_test_T1sQVtKcVqlln5";
const FREE_LIMIT = 5;

const PRICING = {
  INR: { symbol: "₹", monthly: 499,  yearly: 2999, save: "Save ₹3,000/yr" },
  USD: { symbol: "$", monthly: 5,    yearly: 29,   save: "Save $31/yr"    },
  EUR: { symbol: "€", monthly: 5,    yearly: 27,   save: "Save €33/yr"    },
  GBP: { symbol: "£", monthly: 4,    yearly: 24,   save: "Save £24/yr"    },
  AED: { symbol: "د.إ", monthly: 18, yearly: 109,  save: "Save د.إ107/yr" },
  SGD: { symbol: "S$", monthly: 7,   yearly: 39,   save: "Save S$45/yr"   },
};
const COUNTRY_CURRENCY = {
  IN:"INR",US:"USD",GB:"GBP",AU:"USD",CA:"USD",DE:"EUR",FR:"EUR",
  IT:"EUR",ES:"EUR",NL:"EUR",AE:"AED",SA:"AED",SG:"SGD",PK:"USD",
  BD:"USD",NG:"USD",KE:"USD",ZA:"USD",PH:"USD",ID:"USD",MY:"USD",
  TH:"USD",VN:"USD",BR:"USD",MX:"USD",EG:"USD",TR:"USD",
};

const TOOLS = [
  { id:"caption",  icon:"✨", label:"Caption",     desc:"Viral social captions",         pro:false },
  { id:"hashtag",  icon:"#️⃣", label:"Hashtags",    desc:"Trending tag bundles",          pro:false },
  { id:"bio",      icon:"👤", label:"Bio Writer",  desc:"Profile bios that convert",     pro:false },
  { id:"rewrite",  icon:"🔄", label:"Rewriter",    desc:"Upgrade existing posts",        pro:false },
  { id:"email",    icon:"📧", label:"Email",       desc:"Professional cold emails",      pro:false },
  { id:"adcopy",   icon:"🎯", label:"Ad Copy",     desc:"High-converting ads",           pro:false },
  { id:"blog",     icon:"📝", label:"Blog Intro",  desc:"Hook readers instantly",        pro:false },
  { id:"thread",   icon:"🧵", label:"Thread",      desc:"Viral Twitter/X threads",       pro:false },
  { id:"youtube",  icon:"▶️", label:"YT Script",   desc:"YouTube video scripts",         pro:true  },
  { id:"seo",      icon:"🔍", label:"SEO Meta",    desc:"Title & meta descriptions",     pro:true  },
  { id:"product",  icon:"🛍️", label:"Product",     desc:"Ecommerce descriptions",        pro:true  },
  { id:"story",    icon:"📖", label:"Story Ideas", desc:"Content story angles",          pro:true  },
];

const PLATFORMS = ["Instagram","Twitter/X","LinkedIn","TikTok","Facebook","YouTube","Pinterest","WhatsApp"];
const TONES     = ["Viral","Professional","Funny","Emotional","Inspirational","Casual","Luxury","Urgent","Sarcastic","Minimal"];
const LANGUAGES = ["English","Hindi","Arabic","Spanish","French","Portuguese","German","Indonesian","Urdu","Bengali","Turkish"];

const PROMPTS = {
  caption:  (t,p,tone,l) => `Write 3 ${tone} ${p} captions for: "${t}". Use emojis, optimize for ${p} engagement. Reply in ${l}. Separate with ---`,
  hashtag:  (t,p,tone,l) => `Generate 30 trending hashtags for a ${p} post about: "${t}". Mix popular/medium/niche. Reply in ${l}. Ready-to-copy block format.`,
  bio:      (t,p,tone,l) => `Write 3 compelling ${p} bios for: "${t}". Punchy, with emojis. Reply in ${l}. Separate with ---`,
  rewrite:  (t,p,tone,l) => `Rewrite this ${p} post to be more ${tone} and viral: "${t}". Give 3 versions in ${l}. Separate with ---`,
  email:    (t,p,tone,l) => `Write a ${tone} professional email about: "${t}". Include subject, greeting, body, CTA, sign-off. Reply in ${l}.`,
  adcopy:   (t,p,tone,l) => `Write 3 high-converting ${tone} ad copies for: "${t}". Hook + benefit + CTA each. Reply in ${l}. Separate with ---`,
  blog:     (t,p,tone,l) => `Write 3 ${tone} blog introductions about: "${t}". Hook reader in first sentence. Reply in ${l}. Separate with ---`,
  thread:   (t,p,tone,l) => `Write a viral Twitter/X thread about: "${t}". 8-10 numbered tweets, ${tone} tone. Reply in ${l}.`,
  youtube:  (t,p,tone,l) => `Write a complete YouTube video script about: "${t}". Include hook (0-30s), intro, 3 main sections, CTA, outro. ${tone} style. Reply in ${l}.`,
  seo:      (t,p,tone,l) => `Write 3 sets of SEO meta tags for: "${t}". Each set: title tag (60 chars), meta description (155 chars), focus keyword. Reply in ${l}. Separate with ---`,
  product:  (t,p,tone,l) => `Write 3 compelling ecommerce product descriptions for: "${t}". Include features, benefits, emotional hook, CTA. ${tone} tone. Reply in ${l}. Separate with ---`,
  story:    (t,p,tone,l) => `Give 5 creative content story angles for: "${t}". Each angle: headline + 2-line concept. ${tone} tone. Reply in ${l}.`,
};

const PLACEHOLDERS = {
  caption:  "Describe your post or moment... (e.g. 'new skincare product launch with glowing results')",
  hashtag:  "What is your post about? (e.g. 'fitness motivation morning workout')",
  bio:      "Tell about yourself or brand... (e.g. 'digital marketing coach helping startups grow')",
  rewrite:  "Paste your existing post here to improve it...",
  email:    "What is the email about? (e.g. 'follow up with client about project proposal')",
  adcopy:   "Describe your product or offer... (e.g. 'weight loss supplement with 30-day results')",
  blog:     "What is your blog post about? (e.g. 'how to earn money with AI tools in 2026')",
  thread:   "What topic for your thread? (e.g. '10 habits of millionaires nobody talks about')",
  youtube:  "What is your YouTube video about? (e.g. 'how to start dropshipping with zero money')",
  seo:      "What page/product needs SEO? (e.g. 'AI writing tool for social media marketers')",
  product:  "Describe your product... (e.g. 'wireless earbuds with 40hr battery, noise cancellation')",
  story:    "What topic needs content ideas? (e.g. 'my fitness journey losing 20kg in 6 months')",
};

// ─── STORAGE HELPERS ──────────────────────────────────────────────────────────
const store = {
  getUses() {
    try {
      const d = JSON.parse(localStorage.getItem("cai_uses") || "{}");
      return d.date === new Date().toDateString() ? (d.count || 0) : 0;
    } catch { return 0; }
  },
  addUse() {
    try {
      const count = this.getUses() + 1;
      localStorage.setItem("cai_uses", JSON.stringify({ date: new Date().toDateString(), count }));
    } catch {}
  },
  isPremium() { try { return localStorage.getItem("cai_pro") === "true"; } catch { return false; } },
  setPremium() { try { localStorage.setItem("cai_pro", "true"); } catch {} },
  getHistory() { try { return JSON.parse(localStorage.getItem("cai_hist") || "[]"); } catch { return []; } },
  addHistory(item) {
    try {
      const h = this.getHistory();
      h.unshift(item);
      localStorage.setItem("cai_hist", JSON.stringify(h.slice(0, 30)));
    } catch {}
  },
  getFavs() { try { return JSON.parse(localStorage.getItem("cai_favs") || "[]"); } catch { return []; } },
  toggleFav(id) {
    try {
      const favs = this.getFavs();
      const idx = favs.indexOf(id);
      if (idx > -1) favs.splice(idx, 1); else favs.push(id);
      localStorage.setItem("cai_favs", JSON.stringify(favs));
      return favs;
    } catch { return []; }
  },
  getReferralCode() {
    try {
      let code = localStorage.getItem("cai_ref");
      if (!code) { code = "CAI" + Math.random().toString(36).substr(2,6).toUpperCase(); localStorage.setItem("cai_ref", code); }
      return code;
    } catch { return "CAIXXXXX"; }
  },
  getReferrals() { try { return parseInt(localStorage.getItem("cai_refs") || "0"); } catch { return 0; } },
  addReferral() { try { localStorage.setItem("cai_refs", this.getReferrals() + 1); } catch {} },
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function CaptionAI() {
  const [page, setPage]           = useState("landing"); // landing|app|history|referral|settings
  const [tool, setTool]           = useState("caption");
  const [platform, setPlatform]   = useState("Instagram");
  const [tone, setTone]           = useState("Viral");
  const [lang, setLang]           = useState("English");
  const [input, setInput]         = useState("");
  const [output, setOutput]       = useState("");
  const [loading, setLoading]     = useState(false);
  const [dark, setDark]           = useState(true);
  const [isPro, setIsPro]         = useState(store.isPremium());
  const [usesLeft, setUsesLeft]   = useState(FREE_LIMIT - store.getUses());
  const [currency, setCurrency]   = useState("USD");
  const [billing, setBilling]     = useState("yearly");
  const [showPayModal, setShowPayModal] = useState(false);
  const [payLoading, setPayLoading]     = useState(false);
  const [toast, setToast]         = useState(null);
  const [history, setHistory]     = useState(store.getHistory());
  const [favs, setFavs]           = useState(store.getFavs());
  const [copied, setCopied]       = useState(null);
  const [charCount, setCharCount] = useState(0);
  const [tab, setTab]             = useState("all"); // all | pro
  const [referralCode]            = useState(store.getReferralCode());
  const [referrals, setReferrals] = useState(store.getReferrals());
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [streaming, setStreaming] = useState("");
  const outputRef = useRef(null);
  const fileRef   = useRef(null);

  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then(r => r.json())
      .then(d => { const c = COUNTRY_CURRENCY[d.country_code] || "USD"; setCurrency(c); })
      .catch(() => setCurrency("USD"));
  }, []);

  const price = PRICING[currency] || PRICING.USD;

  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const copyText = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
    notify("Copied!");
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!input.trim() && !imageFile) return;
    if (!isPro && store.getUses() >= FREE_LIMIT) { setShowPayModal(true); return; }
    setLoading(true); setOutput(""); setStreaming(""); setCopied(null);

    try {
      let messages;
      if (imageFile && tool === "caption") {
        const base64 = imagePreview.split(",")[1];
        const mtype  = imageFile.type || "image/jpeg";
        messages = [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mtype, data: base64 } },
            { type: "text",  text: `Write 3 ${tone} ${platform} captions for this image${input ? `: context: "${input}"` : ""}. Include emojis. Reply in ${lang}. Separate with ---` }
          ]
        }];
      } else {
        messages = [{ role: "user", content: PROMPTS[tool](input, platform, tone, lang) }];
      }

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, messages }),
      });
      const data = await res.json();
      const text = data.content?.map(c => c.text || "").join("") || "Something went wrong. Please try again.";
      setOutput(text);
      setCharCount(text.length);

      if (!isPro) { store.addUse(); setUsesLeft(FREE_LIMIT - store.getUses()); }

      const histItem = { id: Date.now(), tool, platform, tone, lang, input: input.slice(0,80), output: text, date: new Date().toLocaleDateString(), hasImage: !!imageFile };
      store.addHistory(histItem);
      setHistory(store.getHistory());
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    } catch {
      setOutput("Connection error. Please check your internet and try again.");
    }
    setLoading(false);
  };

  const loadRazorpay = () => new Promise(resolve => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

  const handlePayment = async () => {
    setPayLoading(true);
    const ok = await loadRazorpay();
    if (!ok) { notify("Payment unavailable. Try again.", "error"); setPayLoading(false); return; }
    const amt = (billing === "monthly" ? price.monthly : price.yearly) * 100;
    const opts = {
      key: RAZORPAY_KEY, amount: amt, currency,
      name: "CaptionAI", description: billing === "monthly" ? "Premium Monthly" : "Premium Yearly",
      handler() {
        store.setPremium(); setIsPro(true); setUsesLeft(9999);
        setShowPayModal(false); notify("🎉 Premium activated! Enjoy unlimited access.");
      },
      prefill: { name: "", email: "", contact: "" },
      theme: { color: "#6d28d9" },
      modal: { ondismiss: () => setPayLoading(false) },
    };
    try {
      const rzp = new window.Razorpay(opts);
      rzp.on("payment.failed", () => { notify("Payment failed. Try again.", "error"); setPayLoading(false); });
      rzp.open();
    } catch { notify("Could not open payment.", "error"); }
    setPayLoading(false);
  };

  // ── THEME ──
  const T = {
    bg:     dark ? "#080810" : "#f1f2f8",
    card:   dark ? "#0f0f1e" : "#ffffff",
    card2:  dark ? "#16162a" : "#f5f5ff",
    border: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)",
    text:   dark ? "#eeeeff" : "#080810",
    muted:  dark ? "#7070a0" : "#505080",
    accent: "#6d28d9",
    grad:   "linear-gradient(135deg,#6d28d9,#1d4ed8)",
  };

  const outputBlocks = output ? output.split("---").map(b => b.trim()).filter(Boolean) : [];
  const visibleTools = tab === "pro" ? TOOLS.filter(t => t.pro) : TOOLS;

  // ════════════════════════════════════════════════════════════
  // LANDING PAGE
  // ════════════════════════════════════════════════════════════
  if (page === "landing") return (
    <div style={{ minHeight:"100vh", background:"#080810", fontFamily:"'Inter','Segoe UI',system-ui,sans-serif", color:"#eeeeff", overflowX:"hidden" }}>
      {/* Nav */}
      <nav style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 32px", borderBottom:"1px solid rgba(255,255,255,0.05)", backdropFilter:"blur(10px)", position:"sticky", top:0, zIndex:100, background:"rgba(8,8,16,0.9)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:24 }}>✨</span>
          <span style={{ fontWeight:900, fontSize:20, background:"linear-gradient(90deg,#a78bfa,#60a5fa)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>CaptionAI</span>
        </div>
        <div style={{ display:"flex", gap:12 }}>
          <button onClick={() => setPage("app")} style={{ background:"rgba(109,40,217,0.15)", border:"1px solid rgba(109,40,217,0.3)", borderRadius:10, padding:"8px 20px", color:"#a78bfa", fontSize:14, fontWeight:600, cursor:"pointer" }}>Sign In</button>
          <button onClick={() => setPage("app")} style={{ background:T.grad, border:"none", borderRadius:10, padding:"8px 20px", color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer" }}>Start Free →</button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth:800, margin:"0 auto", padding:"80px 24px 60px", textAlign:"center" }}>
        <div style={{ display:"inline-block", background:"rgba(109,40,217,0.15)", border:"1px solid rgba(109,40,217,0.3)", borderRadius:20, padding:"6px 16px", fontSize:12, color:"#a78bfa", fontWeight:700, marginBottom:28, letterSpacing:1 }}>
          🚀 POWERED BY CLAUDE AI · TRUSTED BY 50,000+ CREATORS
        </div>
        <h1 style={{ fontSize:"clamp(36px,6vw,72px)", fontWeight:900, lineHeight:1.1, margin:"0 0 24px", letterSpacing:-2 }}>
          Write{" "}
          <span style={{ background:"linear-gradient(90deg,#a78bfa,#60a5fa,#34d399)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>viral content</span>
          <br />in seconds with AI
        </h1>
        <p style={{ fontSize:"clamp(16px,2vw,20px)", color:"#7070a0", maxWidth:560, margin:"0 auto 40px", lineHeight:1.7 }}>
          Captions, hashtags, ad copy, emails, threads & more — for every platform, in 11 languages, for creators worldwide.
        </p>
        <div style={{ display:"flex", gap:16, justifyContent:"center", flexWrap:"wrap" }}>
          <button onClick={() => setPage("app")} style={{ background:T.grad, border:"none", borderRadius:16, padding:"18px 40px", color:"#fff", fontSize:18, fontWeight:800, cursor:"pointer", boxShadow:"0 8px 40px rgba(109,40,217,0.45)" }}>
            Start Creating Free →
          </button>
          <button onClick={() => setShowPayModal(true)} style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:16, padding:"18px 32px", color:"#eeeeff", fontSize:16, fontWeight:600, cursor:"pointer" }}>
            View Pricing
          </button>
        </div>
        <p style={{ fontSize:13, color:"#444466", marginTop:16 }}>5 free generations daily · No sign up required</p>
      </div>

      {/* Stats */}
      <div style={{ display:"flex", justifyContent:"center", gap:48, padding:"32px 24px", borderTop:"1px solid rgba(255,255,255,0.05)", borderBottom:"1px solid rgba(255,255,255,0.05)", flexWrap:"wrap" }}>
        {[["12", "AI Tools"],["11", "Languages"],["8", "Platforms"],["135+", "Countries"],["50K+", "Users"]].map(([n,l]) => (
          <div key={l} style={{ textAlign:"center" }}>
            <div style={{ fontSize:32, fontWeight:900, background:"linear-gradient(90deg,#a78bfa,#60a5fa)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>{n}</div>
            <div style={{ fontSize:13, color:"#7070a0", marginTop:4 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Tools showcase */}
      <div style={{ maxWidth:900, margin:"0 auto", padding:"72px 24px" }}>
        <h2 style={{ textAlign:"center", fontSize:"clamp(24px,4vw,40px)", fontWeight:900, marginBottom:48, letterSpacing:-1 }}>
          Everything you need to go viral
        </h2>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:16 }}>
          {TOOLS.map(t => (
            <div key={t.id} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:18, padding:"20px", transition:"all 0.2s", cursor:"pointer" }}
              onClick={() => { setPage("app"); setTool(t.id); }}>
              <div style={{ fontSize:28, marginBottom:10 }}>{t.icon}</div>
              <div style={{ fontWeight:700, fontSize:15, marginBottom:4, color:"#eeeeff" }}>{t.label}</div>
              <div style={{ fontSize:12, color:"#7070a0" }}>{t.desc}</div>
              {t.pro && <div style={{ marginTop:10, display:"inline-block", background:"rgba(109,40,217,0.2)", border:"1px solid rgba(109,40,217,0.4)", borderRadius:6, padding:"2px 8px", fontSize:10, color:"#a78bfa", fontWeight:700 }}>PRO</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Pricing section */}
      <div style={{ maxWidth:700, margin:"0 auto", padding:"0 24px 80px" }}>
        <h2 style={{ textAlign:"center", fontSize:"clamp(24px,4vw,40px)", fontWeight:900, marginBottom:12, letterSpacing:-1 }}>Simple pricing</h2>
        <p style={{ textAlign:"center", color:"#7070a0", marginBottom:48 }}>Start free. Upgrade when you're ready.</p>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
          {/* Free */}
          <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:20, padding:"28px 24px" }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#7070a0", marginBottom:12, letterSpacing:1 }}>FREE</div>
            <div style={{ fontSize:40, fontWeight:900, marginBottom:4 }}>$0<span style={{ fontSize:16, color:"#7070a0", fontWeight:400 }}>/mo</span></div>
            <p style={{ color:"#7070a0", fontSize:13, marginBottom:24 }}>Perfect to try it out</p>
            {["5 free generations/day","8 basic tools","All platforms & tones","8 languages"].map(f => (
              <div key={f} style={{ display:"flex", gap:8, marginBottom:8, fontSize:13, color:"#aaaacc" }}><span style={{ color:"#34d399" }}>✓</span>{f}</div>
            ))}
            <button onClick={() => setPage("app")} style={{ width:"100%", marginTop:24, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, padding:"12px", color:"#eeeeff", fontSize:14, fontWeight:700, cursor:"pointer" }}>Get Started Free</button>
          </div>
          {/* Pro */}
          <div style={{ background:"linear-gradient(135deg,rgba(109,40,217,0.25),rgba(29,78,216,0.25))", border:"1px solid rgba(109,40,217,0.5)", borderRadius:20, padding:"28px 24px", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:16, right:16, background:T.grad, borderRadius:8, padding:"3px 10px", fontSize:10, fontWeight:800, color:"#fff" }}>MOST POPULAR</div>
            <div style={{ fontSize:13, fontWeight:700, color:"#a78bfa", marginBottom:12, letterSpacing:1 }}>PRO</div>
            <div style={{ fontSize:40, fontWeight:900, marginBottom:4 }}>{price.symbol}{price.monthly}<span style={{ fontSize:16, color:"#7070a0", fontWeight:400 }}>/mo</span></div>
            <p style={{ color:"#7070a0", fontSize:13, marginBottom:24 }}>For serious creators</p>
            {["Unlimited generations","All 12 tools","Image caption (upload photo)","Save history (30 items)","Referral rewards","Priority AI speed"].map(f => (
              <div key={f} style={{ display:"flex", gap:8, marginBottom:8, fontSize:13, color:"#c4b5fd" }}><span style={{ color:"#34d399" }}>✓</span>{f}</div>
            ))}
            <button onClick={() => { setShowPayModal(true); }} style={{ width:"100%", marginTop:24, background:T.grad, border:"none", borderRadius:12, padding:"12px", color:"#fff", fontSize:14, fontWeight:800, cursor:"pointer", boxShadow:"0 4px 20px rgba(109,40,217,0.4)" }}>Upgrade to Pro</button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop:"1px solid rgba(255,255,255,0.05)", padding:"32px 24px", textAlign:"center", color:"#444466", fontSize:13 }}>
        <span style={{ fontWeight:700, color:"#a78bfa" }}>CaptionAI</span> · Built with Claude AI · Available worldwide · {new Date().getFullYear()}
      </div>

      {/* Pay modal from landing */}
      {showPayModal && <PayModal price={price} currency={currency} billing={billing} setBilling={setBilling} setCurrency={setCurrency} payLoading={payLoading} onPay={handlePayment} onClose={() => setShowPayModal(false)} dark={dark} T={T} />}
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // HISTORY PAGE
  // ════════════════════════════════════════════════════════════
  if (page === "history") return (
    <div style={{ minHeight:"100vh", background:T.bg, fontFamily:"'Inter','Segoe UI',system-ui,sans-serif", color:T.text }}>
      <TopBar T={T} dark={dark} setDark={setDark} isPro={isPro} usesLeft={usesLeft} setShowPayModal={setShowPayModal} setPage={setPage} back="app" title="📋 History" />
      <div style={{ maxWidth:640, margin:"0 auto", padding:"20px 16px 80px" }}>
        {history.length === 0
          ? <EmptyState icon="📭" msg="No history yet. Generate something first!" />
          : history.map((item,i) => (
            <div key={item.id} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:18, padding:"18px", marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontSize:11, color:"#a78bfa", fontWeight:800, textTransform:"uppercase", letterSpacing:0.5 }}>
                  {TOOLS.find(t=>t.id===item.tool)?.icon} {item.tool} · {item.platform} · {item.lang}
                </span>
                <span style={{ fontSize:11, color:T.muted }}>{item.date}</span>
              </div>
              <p style={{ fontSize:13, color:T.muted, margin:"0 0 10px", fontStyle:"italic" }}>"{item.input}..."</p>
              <p style={{ fontSize:13, color:T.text, margin:"0 0 14px", lineHeight:1.65 }}>{item.output.slice(0,180)}...</p>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={() => copyText(item.output, `h${i}`)} style={{ background:`${copied===`h${i}`?"rgba(16,185,129,0.2)":"rgba(109,40,217,0.15)"}`, border:`1px solid ${copied===`h${i}`?"rgba(16,185,129,0.4)":"rgba(109,40,217,0.3)"}`, borderRadius:8, padding:"6px 14px", fontSize:12, color:copied===`h${i}`?"#34d399":"#a78bfa", cursor:"pointer", fontWeight:700 }}>
                  {copied===`h${i}`?"✓ Copied":"Copy"}
                </button>
                <button onClick={() => { const f = store.toggleFav(item.id); setFavs([...f]); }} style={{ background:"rgba(255,255,255,0.04)", border:`1px solid ${T.border}`, borderRadius:8, padding:"6px 14px", fontSize:12, color:favs.includes(item.id)?"#fbbf24":T.muted, cursor:"pointer" }}>
                  {favs.includes(item.id) ? "★ Saved" : "☆ Save"}
                </button>
              </div>
            </div>
          ))
        }
      </div>
      {showPayModal && <PayModal price={price} currency={currency} billing={billing} setBilling={setBilling} setCurrency={setCurrency} payLoading={payLoading} onPay={handlePayment} onClose={() => setShowPayModal(false)} dark={dark} T={T} />}
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // REFERRAL PAGE
  // ════════════════════════════════════════════════════════════
  if (page === "referral") return (
    <div style={{ minHeight:"100vh", background:T.bg, fontFamily:"'Inter','Segoe UI',system-ui,sans-serif", color:T.text }}>
      <TopBar T={T} dark={dark} setDark={setDark} isPro={isPro} usesLeft={usesLeft} setShowPayModal={setShowPayModal} setPage={setPage} back="app" title="🎁 Refer & Earn" />
      <div style={{ maxWidth:480, margin:"0 auto", padding:"32px 16px 80px", textAlign:"center" }}>
        <div style={{ fontSize:64, marginBottom:16 }}>🎁</div>
        <h2 style={{ fontSize:26, fontWeight:900, marginBottom:8 }}>Invite friends, earn rewards</h2>
        <p style={{ color:T.muted, marginBottom:32, lineHeight:1.6 }}>Share your referral link. When a friend upgrades to Pro, you both get 7 days free!</p>

        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:18, padding:"24px", marginBottom:24 }}>
          <div style={{ fontSize:12, color:T.muted, marginBottom:8, fontWeight:700, letterSpacing:0.5 }}>YOUR REFERRAL CODE</div>
          <div style={{ fontSize:32, fontWeight:900, color:"#a78bfa", letterSpacing:4, marginBottom:16 }}>{referralCode}</div>
          <div style={{ background:T.card2, border:`1px solid ${T.border}`, borderRadius:12, padding:"12px 16px", fontSize:13, color:T.muted, marginBottom:16, wordBreak:"break-all" }}>
            captionai.app/ref/{referralCode}
          </div>
          <button onClick={() => { copyText(`Join CaptionAI — AI writing for social media! Use my code ${referralCode} at captionai.app/ref/${referralCode}`, "ref"); }}
            style={{ width:"100%", background:T.grad, border:"none", borderRadius:12, padding:"13px", color:"#fff", fontSize:14, fontWeight:800, cursor:"pointer" }}>
            {copied==="ref" ? "✓ Link Copied!" : "📋 Copy Referral Link"}
          </button>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:24 }}>
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:"20px" }}>
            <div style={{ fontSize:36, fontWeight:900, color:"#a78bfa" }}>{referrals}</div>
            <div style={{ fontSize:13, color:T.muted, marginTop:4 }}>Friends Invited</div>
          </div>
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:"20px" }}>
            <div style={{ fontSize:36, fontWeight:900, color:"#34d399" }}>{referrals * 7}</div>
            <div style={{ fontSize:13, color:T.muted, marginTop:4 }}>Days Earned</div>
          </div>
        </div>

        <div style={{ display:"flex", gap:12, flexWrap:"wrap", justifyContent:"center" }}>
          {[["WhatsApp","#25D366"],["Twitter","#1DA1F2"],["Telegram","#0088cc"]].map(([name,color]) => (
            <button key={name} onClick={() => notify(`Opening ${name}...`)} style={{ background:`${color}22`, border:`1px solid ${color}44`, borderRadius:12, padding:"10px 20px", color, fontSize:13, fontWeight:700, cursor:"pointer" }}>
              Share on {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // SETTINGS PAGE
  // ════════════════════════════════════════════════════════════
  if (page === "settings") return (
    <div style={{ minHeight:"100vh", background:T.bg, fontFamily:"'Inter','Segoe UI',system-ui,sans-serif", color:T.text }}>
      <TopBar T={T} dark={dark} setDark={setDark} isPro={isPro} usesLeft={usesLeft} setShowPayModal={setShowPayModal} setPage={setPage} back="app" title="⚙️ Settings" />
      <div style={{ maxWidth:480, margin:"0 auto", padding:"24px 16px 80px" }}>

        <SettingsSection title="Appearance">
          <SettingsRow label="Dark Mode" sub="Easy on eyes at night">
            <Toggle on={dark} onToggle={() => setDark(!dark)} />
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="Currency & Billing">
          <SettingsRow label="Currency" sub={`Currently: ${currency}`}>
            <select value={currency} onChange={e => setCurrency(e.target.value)}
              style={{ background:T.card2, border:`1px solid ${T.border}`, borderRadius:8, padding:"6px 10px", color:T.text, fontSize:13, outline:"none", cursor:"pointer" }}>
              {Object.keys(PRICING).map(c => <option key={c} value={c} style={{ background:"#1a1a2e" }}>{c}</option>)}
            </select>
          </SettingsRow>
          {!isPro && (
            <SettingsRow label="Plan" sub="Free — 5 generations/day">
              <button onClick={() => setShowPayModal(true)} style={{ background:T.grad, border:"none", borderRadius:10, padding:"7px 16px", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>Upgrade</button>
            </SettingsRow>
          )}
          {isPro && (
            <SettingsRow label="Plan" sub="Pro — Unlimited access">
              <span style={{ background:"rgba(52,211,153,0.15)", border:"1px solid rgba(52,211,153,0.3)", borderRadius:8, padding:"4px 12px", fontSize:12, color:"#34d399", fontWeight:700 }}>Active ✓</span>
            </SettingsRow>
          )}
        </SettingsSection>

        <SettingsSection title="Data">
          <SettingsRow label="Clear History" sub="Remove all saved generations">
            <button onClick={() => { localStorage.removeItem("cai_hist"); setHistory([]); notify("History cleared"); }}
              style={{ background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:10, padding:"7px 14px", color:"#f87171", fontSize:13, fontWeight:700, cursor:"pointer" }}>Clear</button>
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="About">
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"16px" }}>
            {[["App","CaptionAI"],["Version","2.0.0"],["AI Model","Claude Sonnet"],["Payment","Razorpay"],["Support","support@captionai.app"]].map(([k,v]) => (
              <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:`1px solid ${T.border}`, fontSize:13 }}>
                <span style={{ color:T.muted }}>{k}</span>
                <span style={{ color:T.text, fontWeight:600 }}>{v}</span>
              </div>
            ))}
          </div>
        </SettingsSection>
      </div>
      {showPayModal && <PayModal price={price} currency={currency} billing={billing} setBilling={setBilling} setCurrency={setCurrency} payLoading={payLoading} onPay={handlePayment} onClose={() => setShowPayModal(false)} dark={dark} T={T} />}
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // MAIN APP
  // ════════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight:"100vh", background:T.bg, fontFamily:"'Inter','Segoe UI',system-ui,sans-serif", color:T.text }}>
      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", top:20, left:"50%", transform:"translateX(-50%)", background:toast.type==="error"?"#ef4444":"#10b981", color:"#fff", borderRadius:12, padding:"10px 22px", fontSize:13, fontWeight:700, zIndex:9999, boxShadow:"0 4px 24px rgba(0,0,0,0.4)", whiteSpace:"nowrap", pointerEvents:"none" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header style={{ background:T.card, borderBottom:`1px solid ${T.border}`, padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100, backdropFilter:"blur(12px)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:20 }}>✨</span>
          <span style={{ fontWeight:900, fontSize:17, background:"linear-gradient(90deg,#a78bfa,#60a5fa)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>CaptionAI</span>
          <span style={{ background:"rgba(52,211,153,0.12)", border:"1px solid rgba(52,211,153,0.25)", borderRadius:6, padding:"2px 7px", fontSize:9, color:"#34d399", fontWeight:800, letterSpacing:0.5 }}>LIVE</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button onClick={() => setDark(!dark)} style={{ background:T.card2, border:`1px solid ${T.border}`, borderRadius:8, padding:"6px 9px", fontSize:14, cursor:"pointer", color:T.text }}>{dark?"☀️":"🌙"}</button>
          <button onClick={() => setPage("history")} style={{ background:T.card2, border:`1px solid ${T.border}`, borderRadius:8, padding:"6px 9px", fontSize:14, cursor:"pointer", color:T.text }}>📋</button>
          <button onClick={() => setPage("referral")} style={{ background:T.card2, border:`1px solid ${T.border}`, borderRadius:8, padding:"6px 9px", fontSize:14, cursor:"pointer", color:T.text }}>🎁</button>
          <button onClick={() => setPage("settings")} style={{ background:T.card2, border:`1px solid ${T.border}`, borderRadius:8, padding:"6px 9px", fontSize:14, cursor:"pointer", color:T.text }}>⚙️</button>
          {!isPro && <div style={{ background:"rgba(109,40,217,0.15)", border:"1px solid rgba(109,40,217,0.3)", borderRadius:20, padding:"4px 10px", fontSize:11, color:"#a78bfa", fontWeight:700 }}>{usesLeft} free</div>}
          {isPro
            ? <div style={{ background:T.grad, borderRadius:20, padding:"4px 12px", fontSize:11, color:"#fff", fontWeight:800 }}>⭐ PRO</div>
            : <button onClick={() => setShowPayModal(true)} style={{ background:T.grad, color:"#fff", border:"none", borderRadius:20, padding:"7px 16px", fontSize:12, fontWeight:700, cursor:"pointer" }}>Upgrade</button>
          }
        </div>
      </header>

      <div style={{ maxWidth:660, margin:"0 auto", padding:"18px 14px 100px" }}>

        {/* Tool tabs */}
        <div style={{ display:"flex", gap:8, marginBottom:14 }}>
          {["all","pro"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ background:tab===t?T.grad:"rgba(255,255,255,0.04)", border:`1px solid ${tab===t?"transparent":T.border}`, borderRadius:10, padding:"7px 18px", color:tab===t?"#fff":T.muted, fontSize:12, fontWeight:700, cursor:"pointer", letterSpacing:0.5 }}>
              {t==="all"?"All Tools":"⭐ Pro Tools"}
            </button>
          ))}
        </div>

        {/* Tool grid */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:18 }}>
          {visibleTools.map(t => (
            <button key={t.id} onClick={() => { if (t.pro && !isPro) { setShowPayModal(true); return; } setTool(t.id); setOutput(""); setInput(""); setImageFile(null); setImagePreview(null); }}
              style={{ background:tool===t.id?"linear-gradient(135deg,rgba(109,40,217,0.4),rgba(29,78,216,0.4))":T.card2, border:`1px solid ${tool===t.id?"rgba(167,139,250,0.5)":T.border}`, borderRadius:14, padding:"12px 6px", textAlign:"center", cursor:"pointer", transition:"all 0.2s", position:"relative" }}>
              {t.pro && !isPro && <div style={{ position:"absolute", top:6, right:6, background:"rgba(109,40,217,0.8)", borderRadius:4, padding:"1px 5px", fontSize:8, color:"#fff", fontWeight:800 }}>PRO</div>}
              <div style={{ fontSize:18, marginBottom:4 }}>{t.icon}</div>
              <div style={{ fontSize:10, fontWeight:700, color:tool===t.id?"#c4b5fd":T.muted, lineHeight:1.3 }}>{t.label}</div>
            </button>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:14 }}>
          {[
            { label:"PLATFORM", value:platform, setter:setPlatform, opts:PLATFORMS },
            { label:"TONE",     value:tone,     setter:setTone,     opts:TONES     },
            { label:"LANGUAGE", value:lang,     setter:setLang,     opts:LANGUAGES },
          ].map(({label,value,setter,opts}) => (
            <div key={label}>
              <div style={{ fontSize:9, color:T.muted, fontWeight:800, marginBottom:5, letterSpacing:0.8 }}>{label}</div>
              <select value={value} onChange={e => setter(e.target.value)}
                style={{ width:"100%", background:T.card2, border:`1px solid ${T.border}`, borderRadius:10, padding:"9px 8px", color:T.text, fontSize:12, outline:"none", cursor:"pointer", appearance:"none" }}>
                {opts.map(o => <option key={o} value={o} style={{ background:dark?"#1a1a2e":"#fff" }}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>

        {/* Image upload (caption tool only) */}
        {tool === "caption" && (
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:9, color:T.muted, fontWeight:800, marginBottom:5, letterSpacing:0.8 }}>UPLOAD IMAGE (optional)</div>
            <div onClick={() => fileRef.current?.click()}
              style={{ background:T.card2, border:`2px dashed ${imagePreview?"rgba(109,40,217,0.5)":T.border}`, borderRadius:14, padding:"16px", cursor:"pointer", textAlign:"center", transition:"all 0.2s", position:"relative" }}>
              {imagePreview
                ? <div style={{ position:"relative" }}>
                    <img src={imagePreview} alt="preview" style={{ maxHeight:140, borderRadius:10, maxWidth:"100%", objectFit:"cover" }} />
                    <button onClick={e => { e.stopPropagation(); setImageFile(null); setImagePreview(null); }}
                      style={{ position:"absolute", top:-8, right:-8, background:"#ef4444", border:"none", borderRadius:"50%", width:24, height:24, color:"#fff", fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900 }}>×</button>
                  </div>
                : <div style={{ color:T.muted, fontSize:13 }}>
                    <div style={{ fontSize:28, marginBottom:6 }}>🖼️</div>
                    <span>Tap to upload photo → get AI captions</span>
                    {!isPro && <div style={{ fontSize:11, color:"#a78bfa", marginTop:4 }}>⭐ Pro feature</div>}
                  </div>
              }
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={e => { if (!isPro) { setShowPayModal(true); return; } handleImageUpload(e); }} style={{ display:"none" }} />
          </div>
        )}

        {/* Text input */}
        <div style={{ marginBottom:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
            <span style={{ fontSize:9, color:T.muted, fontWeight:800, letterSpacing:0.8 }}>YOUR INPUT</span>
            <span style={{ fontSize:10, color:T.muted }}>{input.length} chars</span>
          </div>
          <textarea value={input} onChange={e => setInput(e.target.value)}
            placeholder={PLACEHOLDERS[tool]} rows={4}
            style={{ width:"100%", background:T.card2, border:`1px solid ${T.border}`, borderRadius:14, padding:"14px", color:T.text, fontSize:14, resize:"none", outline:"none", boxSizing:"border-box", lineHeight:1.65, fontFamily:"inherit", transition:"border 0.2s" }} />
        </div>

        {/* Generate button */}
        <button onClick={handleGenerate} disabled={loading || (!input.trim() && !imageFile)}
          style={{ width:"100%", background:loading||(!input.trim()&&!imageFile)?"rgba(109,40,217,0.2)":T.grad, color:loading||(!input.trim()&&!imageFile)?T.muted:"#fff", border:"none", borderRadius:14, padding:"15px", fontSize:15, fontWeight:800, cursor:loading||(!input.trim()&&!imageFile)?"not-allowed":"pointer", marginBottom:20, boxShadow:loading||(!input.trim()&&!imageFile)?"none":"0 4px 24px rgba(109,40,217,0.4)", transition:"all 0.2s" }}>
          {loading
            ? <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
                <span style={{ display:"inline-block", width:15, height:15, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />
                AI is writing...
              </span>
            : `${TOOLS.find(t=>t.id===tool)?.icon} Generate with AI`}
        </button>

        {/* Output */}
        {output && (
          <div ref={outputRef} style={{ background:T.card, border:"1px solid rgba(109,40,217,0.25)", borderRadius:20, padding:"20px", marginBottom:18 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <span style={{ fontSize:10, color:"#a78bfa", fontWeight:800, letterSpacing:0.8 }}>✨ AI RESULT · {outputBlocks.length > 1 ? `${outputBlocks.length} versions` : "ready"} · {charCount} chars</span>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={() => copyText(output, "all")} style={{ background:copied==="all"?"rgba(16,185,129,0.2)":"rgba(255,255,255,0.06)", border:`1px solid ${copied==="all"?"rgba(16,185,129,0.4)":T.border}`, borderRadius:8, padding:"5px 12px", fontSize:11, color:copied==="all"?"#34d399":T.muted, cursor:"pointer", fontWeight:700 }}>
                  {copied==="all" ? "✓ Copied" : "Copy All"}
                </button>
              </div>
            </div>
            {outputBlocks.length > 1
              ? outputBlocks.map((block,i) => (
                <div key={i} style={{ background:T.card2, borderRadius:14, padding:"14px", marginBottom:i<outputBlocks.length-1?10:0, border:`1px solid ${T.border}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                    <span style={{ fontSize:10, color:"#a78bfa", fontWeight:800 }}>VERSION {i+1}</span>
                    <button onClick={() => copyText(block, `b${i}`)} style={{ background:copied===`b${i}`?"rgba(16,185,129,0.15)":"rgba(109,40,217,0.12)", border:`1px solid ${copied===`b${i}`?"rgba(16,185,129,0.35)":"rgba(109,40,217,0.25)"}`, borderRadius:7, padding:"3px 10px", fontSize:11, color:copied===`b${i}`?"#34d399":"#a78bfa", cursor:"pointer", fontWeight:700 }}>
                      {copied===`b${i}` ? "✓" : "Copy"}
                    </button>
                  </div>
                  <p style={{ fontSize:13, lineHeight:1.75, color:T.text, margin:0, whiteSpace:"pre-wrap" }}>{block}</p>
                </div>
              ))
              : <p style={{ fontSize:14, lineHeight:1.8, color:T.text, margin:0, whiteSpace:"pre-wrap" }}>{output}</p>
            }
          </div>
        )}

        {/* Usage tracker */}
        {!isPro && (
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:"16px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, color:T.muted, marginBottom:8 }}>Today's usage ({FREE_LIMIT - usesLeft}/{FREE_LIMIT})</div>
              <div style={{ display:"flex", gap:4 }}>
                {Array.from({length:FREE_LIMIT}).map((_,i) => (
                  <div key={i} style={{ flex:1, height:5, borderRadius:3, background:i<(FREE_LIMIT-usesLeft)?"#6d28d9":T.card2, transition:"background 0.3s" }} />
                ))}
              </div>
            </div>
            <button onClick={() => setShowPayModal(true)} style={{ background:T.grad, color:"#fff", border:"none", borderRadius:10, padding:"9px 16px", fontSize:12, fontWeight:800, cursor:"pointer", whiteSpace:"nowrap" }}>Unlimited ✨</button>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:T.card, borderTop:`1px solid ${T.border}`, padding:"10px 0 16px", display:"flex", justifyContent:"space-around", zIndex:100 }}>
        {[["app","🏠","Home"],["history","📋","History"],["referral","🎁","Refer"],["settings","⚙️","Settings"]].map(([p,icon,label]) => (
          <button key={p} onClick={() => setPage(p)}
            style={{ background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3, padding:"0 16px" }}>
            <span style={{ fontSize:20 }}>{icon}</span>
            <span style={{ fontSize:10, color:page===p?"#a78bfa":T.muted, fontWeight:page===p?800:500 }}>{label}</span>
          </button>
        ))}
      </div>

      {showPayModal && <PayModal price={price} currency={currency} billing={billing} setBilling={setBilling} setCurrency={setCurrency} payLoading={payLoading} onPay={handlePayment} onClose={() => setShowPayModal(false)} dark={dark} T={T} />}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        textarea::placeholder { color: #44446a; }
        select, textarea, input { font-family: inherit; }
        body { margin: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #333350; border-radius: 4px; }
      `}</style>
    </div>
  );
}

// ─── SUB COMPONENTS ───────────────────────────────────────────────────────────
function TopBar({ T, dark, setDark, isPro, usesLeft, setShowPayModal, setPage, back, title }) {
  return (
    <div style={{ background:T.card, borderBottom:`1px solid ${T.border}`, padding:"13px 16px", display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:100 }}>
      <button onClick={() => setPage(back)} style={{ background:"rgba(109,40,217,0.12)", border:"none", borderRadius:10, padding:"7px 14px", color:"#a78bfa", cursor:"pointer", fontSize:13, fontWeight:700 }}>← Back</button>
      <span style={{ fontWeight:800, fontSize:16, flex:1 }}>{title}</span>
      <button onClick={() => setDark(!dark)} style={{ background:T.card2, border:`1px solid ${T.border}`, borderRadius:8, padding:"6px 9px", fontSize:14, cursor:"pointer", color:T.text }}>{dark?"☀️":"🌙"}</button>
    </div>
  );
}

function EmptyState({ icon, msg }) {
  return (
    <div style={{ textAlign:"center", padding:"80px 20px", color:"#7070a0" }}>
      <div style={{ fontSize:52, marginBottom:14 }}>{icon}</div>
      <p style={{ fontSize:15 }}>{msg}</p>
    </div>
  );
}

function SettingsSection({ title, children }) {
  return (
    <div style={{ marginBottom:24 }}>
      <div style={{ fontSize:11, fontWeight:800, color:"#7070a0", letterSpacing:1, marginBottom:10, paddingLeft:4 }}>{title.toUpperCase()}</div>
      {children}
    </div>
  );
}

function SettingsRow({ label, sub, children }) {
  return (
    <div style={{ background:"#0f0f1e", border:"1px solid rgba(255,255,255,0.06)", borderRadius:14, padding:"14px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
      <div>
        <div style={{ fontSize:14, fontWeight:600, color:"#eeeeff" }}>{label}</div>
        {sub && <div style={{ fontSize:12, color:"#7070a0", marginTop:2 }}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ on, onToggle }) {
  return (
    <div onClick={onToggle} style={{ width:44, height:24, borderRadius:12, background:on?"#6d28d9":"rgba(255,255,255,0.1)", cursor:"pointer", position:"relative", transition:"background 0.3s", border:"1px solid rgba(255,255,255,0.1)" }}>
      <div style={{ position:"absolute", top:2, left:on?20:2, width:18, height:18, borderRadius:"50%", background:"#fff", transition:"left 0.2s", boxShadow:"0 1px 4px rgba(0,0,0,0.3)" }} />
    </div>
  );
}

function PayModal({ price, currency, billing, setBilling, setCurrency, payLoading, onPay, onClose, dark, T }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:2000 }} onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:dark?"#0f0f1e":"#fff", borderRadius:"24px 24px 0 0", padding:"28px 22px 40px", width:"100%", maxWidth:520, border:"1px solid rgba(109,40,217,0.35)", maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ textAlign:"center", marginBottom:20 }}>
          <div style={{ fontSize:40, marginBottom:8 }}>⭐</div>
          <h2 style={{ fontSize:22, fontWeight:900, margin:"0 0 6px", color:T.text }}>Unlock Pro</h2>
          <p style={{ color:T.muted, fontSize:13, margin:0 }}>Unlimited AI generations + all 12 tools</p>
        </div>

        {/* Currency */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:14 }}>
          <span style={{ fontSize:12, color:T.muted }}>Currency:</span>
          <select value={currency} onChange={e => setCurrency(e.target.value)}
            style={{ background:"rgba(109,40,217,0.15)", border:"1px solid rgba(109,40,217,0.3)", borderRadius:8, padding:"4px 10px", color:"#a78bfa", fontSize:12, fontWeight:700, outline:"none", cursor:"pointer" }}>
            {Object.keys(PRICING).map(c => <option key={c} value={c} style={{ background:"#1a1a2e" }}>{c}</option>)}
          </select>
          <span style={{ fontSize:11, color:"#34d399" }}>🌍 Auto-detected</span>
        </div>

        {/* Billing toggle */}
        <div style={{ display:"flex", background:"rgba(255,255,255,0.04)", borderRadius:14, padding:4, marginBottom:16, border:`1px solid ${T.border}` }}>
          {["monthly","yearly"].map(c => (
            <button key={c} onClick={() => setBilling(c)}
              style={{ flex:1, background:billing===c?"linear-gradient(135deg,#6d28d9,#1d4ed8)":"transparent", color:billing===c?"#fff":T.muted, border:"none", borderRadius:10, padding:"10px", fontSize:13, fontWeight:700, cursor:"pointer", transition:"all 0.2s" }}>
              {c==="monthly" ? "Monthly" : "Yearly 🔥 Best Value"}
            </button>
          ))}
        </div>

        {/* Price */}
        <div style={{ background:"rgba(109,40,217,0.1)", border:"1px solid rgba(109,40,217,0.25)", borderRadius:16, padding:"16px", textAlign:"center", marginBottom:16 }}>
          <div style={{ fontSize:36, fontWeight:900, color:"#a78bfa" }}>
            {price.symbol}{billing==="monthly"?price.monthly:price.yearly}
            <span style={{ fontSize:14, color:T.muted, fontWeight:400 }}>/{billing==="monthly"?"mo":"yr"}</span>
          </div>
          {billing==="yearly" && <div style={{ fontSize:12, color:"#34d399", fontWeight:700, marginTop:4 }}>{price.save}</div>}
          <div style={{ fontSize:11, color:T.muted, marginTop:6 }}>Billed in {currency} · UPI, Cards, Wallets accepted</div>
        </div>

        {/* Features */}
        <div style={{ marginBottom:18 }}>
          {["Unlimited AI generations daily","All 12 tools (incl. YouTube, SEO, Product)","Image upload → AI caption","Save & access 30 results","Referral rewards program","11 languages + 10 platforms","Priority AI response speed","All future features free"].map(f => (
            <div key={f} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
              <span style={{ color:"#34d399", fontWeight:800, fontSize:15 }}>✓</span>
              <span style={{ fontSize:13, color:T.text }}>{f}</span>
            </div>
          ))}
        </div>

        <button onClick={onPay} disabled={payLoading}
          style={{ width:"100%", background:payLoading?"rgba(109,40,217,0.35)":"linear-gradient(135deg,#6d28d9,#1d4ed8)", color:"#fff", border:"none", borderRadius:16, padding:"16px", fontSize:15, fontWeight:800, cursor:payLoading?"not-allowed":"pointer", marginBottom:12, boxShadow:"0 6px 28px rgba(109,40,217,0.45)" }}>
          {payLoading ? "Opening payment..." : `Pay ${price.symbol}${billing==="monthly"?price.monthly:price.yearly} via Razorpay`}
        </button>
        <button onClick={onClose} style={{ width:"100%", background:"transparent", border:"none", color:T.muted, fontSize:13, cursor:"pointer", padding:"8px" }}>Maybe later</button>
      </div>
    </div>
  );
}
