import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

export const metadata: Metadata = {
  title: "drrop.io — Bulk Upload Videos to YouTube",
  description: "Upload up to 20 videos to YouTube at once. Auto naming, Google Sheets logging, credit packs. Start with 3 free uploads.",
};

export default function LandingPage() {
  return (
    <>
      <style>{`
        :root {
          --lime: #c8f55a;
          --orange: #ff6b35;
          --purple: #7c3aed;
          --bg: #0d0d0d;
          --surface: #161616;
          --border: #242424;
          --text: #f0f0f0;
          --muted: #666;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }

        body {
          background: var(--bg);
          color: var(--text);
          font-family: var(--font-inter), sans-serif;
          font-size: 16px;
          line-height: 1.6;
          overflow-x: hidden;
        }

        nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          padding: 1.25rem 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(13,13,13,0.85);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border);
        }

        .nav-logo {
          font-family: var(--font-syne), sans-serif;
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--lime);
          text-decoration: none;
          letter-spacing: -0.03em;
        }
        .nav-logo .rr-first { color: var(--orange); }
        .nav-logo .rr-second { color: #a78bfa; }

        .nav-cta {
          background: var(--lime);
          color: #0d0d0d;
          font-weight: 600;
          font-size: 0.85rem;
          padding: 0.6rem 1.25rem;
          border-radius: 100px;
          text-decoration: none;
          transition: background 0.2s, transform 0.15s;
        }
        .nav-cta:hover { background: #d9ff6a; transform: scale(1.03); }

        .hero {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 8rem 2rem 5rem;
          position: relative;
          overflow: hidden;
        }

        .hero-bg-blob {
          position: absolute;
          width: 600px; height: 600px;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.12;
          pointer-events: none;
        }
        .blob-1 { background: var(--lime); top: -100px; left: -150px; }
        .blob-2 { background: var(--orange); bottom: -100px; right: -150px; }
        .blob-3 { background: var(--purple); top: 50%; left: 50%; transform: translate(-50%,-50%); }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(200,245,90,0.1);
          border: 1px solid rgba(200,245,90,0.25);
          color: var(--lime);
          font-size: 0.8rem;
          font-weight: 500;
          padding: 0.4rem 1rem;
          border-radius: 100px;
          margin-bottom: 2rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .hero-badge span { width: 6px; height: 6px; border-radius: 50%; background: var(--lime); display: inline-block; animation: pulse 2s infinite; }

        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }

        h1 {
          font-family: var(--font-syne), sans-serif;
          font-size: clamp(3rem, 8vw, 6rem);
          font-weight: 800;
          line-height: 1.0;
          letter-spacing: -0.05em;
          margin-bottom: 1.5rem;
          max-width: 900px;
        }

        h1 .accent { color: var(--lime); }
        h1 .accent-orange { color: var(--orange); }

        .flow-strip {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          flex-wrap: wrap;
          margin-bottom: 2.5rem;
          max-width: 760px;
        }

        .flow-item {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 0.6rem 1rem;
          font-size: 0.85rem;
          font-weight: 500;
          color: #ccc;
          white-space: nowrap;
        }
        .flow-item .dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .dot-lime { background: var(--lime); }
        .dot-orange { background: var(--orange); }
        .dot-purple { background: #a78bfa; }
        .dot-blue { background: #38bdf8; }

        .flow-arrow {
          color: var(--muted);
          font-size: 1.1rem;
          padding: 0 0.25rem;
        }

        .naming-example {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1.25rem 1.75rem;
          margin-bottom: 2.5rem;
          max-width: 640px;
          text-align: left;
        }

        .naming-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--muted);
          margin-bottom: 0.75rem;
          font-weight: 600;
        }

        .naming-row {
          display: flex;
          align-items: center;
          gap: 0;
          flex-wrap: wrap;
          margin-bottom: 0.5rem;
          font-size: 0.8rem;
        }

        .naming-chunk {
          padding: 0.3rem 0.6rem;
          border-radius: 6px;
          font-family: var(--font-inter), monospace;
          font-weight: 600;
          font-size: 0.78rem;
          letter-spacing: 0.01em;
        }
        .chunk-filename { background: rgba(200,245,90,0.12); color: var(--lime); }
        .chunk-orient { background: rgba(255,107,53,0.12); color: var(--orange); }
        .chunk-duration { background: rgba(167,139,250,0.12); color: #a78bfa; }
        .chunk-date { background: rgba(56,189,248,0.12); color: #38bdf8; }
        .chunk-sep { color: var(--muted); padding: 0 2px; font-weight: 400; }

        .naming-source {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid var(--border);
        }

        .source-pill {
          font-size: 0.7rem;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          font-weight: 500;
        }

        .hero-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
          justify-content: center;
          margin-bottom: 1rem;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--lime);
          color: #0d0d0d;
          font-weight: 700;
          font-size: 1rem;
          padding: 0.9rem 2rem;
          border-radius: 100px;
          text-decoration: none;
          transition: all 0.2s;
        }
        .btn-primary:hover { background: #d9ff6a; transform: translateY(-2px); }

        .hero-note { font-size: 0.8rem; color: var(--muted); }

        .stats-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 3rem;
          padding: 2rem;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          flex-wrap: wrap;
        }

        .stat-item { text-align: center; }
        .stat-num {
          font-family: var(--font-syne), sans-serif;
          font-size: 2rem;
          font-weight: 800;
          color: var(--lime);
          display: block;
          letter-spacing: -0.03em;
        }
        .stat-label { font-size: 0.8rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; }

        .section {
          max-width: 1100px;
          margin: 0 auto;
          padding: 6rem 2rem;
        }

        .section-label {
          font-size: 0.75rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--lime);
          margin-bottom: 1rem;
          font-weight: 600;
        }

        .section-title {
          font-family: var(--font-syne), sans-serif;
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 800;
          letter-spacing: -0.04em;
          margin-bottom: 1rem;
          line-height: 1.1;
        }

        .section-sub {
          color: #888;
          font-size: 1.05rem;
          max-width: 500px;
          margin-bottom: 4rem;
        }

        .steps {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.5rem;
        }

        .step-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 2rem;
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s, transform 0.2s;
        }
        .step-card:hover { border-color: rgba(200,245,90,0.3); transform: translateY(-3px); }

        .step-num {
          font-family: var(--font-syne), sans-serif;
          font-size: 3.5rem;
          font-weight: 800;
          color: rgba(200,245,90,0.1);
          position: absolute;
          top: 1rem; right: 1.25rem;
          line-height: 1;
        }

        .step-icon {
          width: 44px; height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.25rem;
        }
        .icon-lime { background: rgba(200,245,90,0.12); color: var(--lime); }
        .icon-orange { background: rgba(255,107,53,0.12); color: var(--orange); }
        .icon-purple { background: rgba(124,58,237,0.12); color: #a78bfa; }
        .icon-blue { background: rgba(56,189,248,0.12); color: #38bdf8; }

        .step-card h3 {
          font-family: var(--font-syne), sans-serif;
          font-size: 1.1rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          letter-spacing: -0.02em;
        }
        .step-card p { font-size: 0.9rem; color: #888; line-height: 1.6; }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1px;
          background: var(--border);
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
        }

        .feature-item {
          background: var(--surface);
          padding: 2.5rem 2rem;
          transition: background 0.2s;
        }
        .feature-item:hover { background: #1a1a1a; }

        .feature-icon {
          width: 40px; height: 40px;
          border-radius: 10px;
          margin-bottom: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .feature-item h3 {
          font-family: var(--font-syne), sans-serif;
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          letter-spacing: -0.01em;
        }
        .feature-item p { font-size: 0.875rem; color: #777; line-height: 1.6; }

        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
          margin-top: 3rem;
        }

        .price-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 2rem;
          position: relative;
          transition: transform 0.2s, border-color 0.2s;
        }
        .price-card:hover { transform: translateY(-3px); }
        .price-card.featured { border-color: var(--lime); background: rgba(200,245,90,0.04); }

        .price-badge {
          position: absolute;
          top: -12px; left: 50%;
          transform: translateX(-50%);
          background: var(--lime);
          color: #0d0d0d;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 0.25rem 0.75rem;
          border-radius: 100px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .price-name { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); margin-bottom: 1rem; font-weight: 600; }
        .price-amount { font-family: var(--font-syne), sans-serif; font-size: 3rem; font-weight: 800; letter-spacing: -0.04em; line-height: 1; margin-bottom: 0.25rem; }
        .price-card.featured .price-amount { color: var(--lime); }
        .price-per { font-size: 0.8rem; color: var(--muted); margin-bottom: 1.5rem; }
        .price-credits { font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem; }
        .price-rate { font-size: 0.8rem; color: var(--muted); }
        .price-divider { height: 1px; background: var(--border); margin: 1.5rem 0; }

        .price-feature {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #aaa;
          margin-bottom: 0.5rem;
        }
        .price-feature::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--lime); flex-shrink: 0; }

        .free-banner {
          background: rgba(200,245,90,0.06);
          border: 1px solid rgba(200,245,90,0.2);
          border-radius: 16px;
          padding: 2rem 2.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
          flex-wrap: wrap;
          margin-top: 2rem;
        }
        .free-banner h3 { font-family: var(--font-syne), sans-serif; font-size: 1.3rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 0.25rem; }
        .free-banner p { font-size: 0.9rem; color: #888; }

        .cta-section {
          text-align: center;
          padding: 8rem 2rem;
          position: relative;
          overflow: hidden;
        }
        .cta-bg {
          position: absolute;
          width: 800px; height: 400px;
          background: var(--lime);
          border-radius: 50%;
          filter: blur(150px);
          opacity: 0.06;
          top: 50%; left: 50%;
          transform: translate(-50%,-50%);
          pointer-events: none;
        }
        .cta-section h2 {
          font-family: var(--font-syne), sans-serif;
          font-size: clamp(2.5rem, 5vw, 4rem);
          font-weight: 800;
          letter-spacing: -0.05em;
          margin-bottom: 1rem;
          line-height: 1.05;
        }
        .cta-section p { color: #888; font-size: 1.1rem; margin-bottom: 2.5rem; }

        footer {
          padding: 2rem;
          border-top: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .footer-logo { font-family: var(--font-syne), sans-serif; font-size: 1.1rem; font-weight: 800; letter-spacing: -0.03em; }
        .footer-logo .rr-first { color: var(--orange); }
        .footer-logo .rr-second { color: #a78bfa; }
        .footer-logo .rest { color: var(--lime); }
        .footer-links { display: flex; gap: 1.5rem; }
        .footer-links a { font-size: 0.8rem; color: var(--muted); text-decoration: none; transition: color 0.2s; }
        .footer-links a:hover { color: var(--text); }
        .footer-copy { font-size: 0.8rem; color: var(--muted); }

        @media (max-width: 640px) {
          .stats-bar { gap: 2rem; }
          .free-banner { flex-direction: column; }
          footer { flex-direction: column; align-items: flex-start; }
          .flow-strip { gap: 0.3rem; }
          .naming-row { gap: 2px; }
        }
      `}</style>

      <nav>
        <Link href="/" className="nav-logo">
          d<span className="rr-first">r</span><span className="rr-second">r</span>op.io
        </Link>
        <Link href="/login" className="nav-cta">Get started free →</Link>
      </nav>

      <section className="hero">
        <div className="hero-bg-blob blob-1" />
        <div className="hero-bg-blob blob-2" />
        <div className="hero-bg-blob blob-3" />

        <div className="hero-badge">
          <span />
          Now live — upload up to 20 videos at once
        </div>

        <h1>
          Upload <span className="accent">20 videos</span><br />
          in the time it takes<br />
          to do <span className="accent-orange">one.</span>
        </h1>

        <div className="flow-strip">
          <div className="flow-item"><span className="dot dot-lime" />Upload 20 videos in bulk</div>
          <div className="flow-arrow">→</div>
          <div className="flow-item"><span className="dot dot-orange" />Automatically named</div>
          <div className="flow-arrow">→</div>
          <div className="flow-item"><span className="dot dot-purple" />Auto YouTube categories</div>
          <div className="flow-arrow">→</div>
          <div className="flow-item"><span className="dot dot-blue" />Google Sheet with IDs logged</div>
        </div>

        <div className="naming-example">
          <div className="naming-label">Auto-generated title example</div>
          <div className="naming-row">
            <span className="naming-chunk chunk-filename">SummerCampaign_v3</span>
            <span className="chunk-sep">_</span>
            <span className="naming-chunk chunk-orient">9x16</span>
            <span className="chunk-sep">_</span>
            <span className="naming-chunk chunk-duration">0:30</span>
            <span className="chunk-sep">_</span>
            <span className="naming-chunk chunk-date">2025-06-01</span>
          </div>
          <div className="naming-source">
            <span className="source-pill chunk-filename">filename</span>
            <span style={{ color: "var(--muted)", fontSize: "0.7rem" }}>→</span>
            <span className="source-pill chunk-orient">orientation detected</span>
            <span style={{ color: "var(--muted)", fontSize: "0.7rem" }}>→</span>
            <span className="source-pill chunk-duration">duration detected</span>
            <span style={{ color: "var(--muted)", fontSize: "0.7rem" }}>→</span>
            <span className="source-pill chunk-date">upload date</span>
          </div>
        </div>

        <div className="hero-actions">
          <Link href="/login" className="btn-primary">
            ★ Get started — 3 free uploads
          </Link>
        </div>
        <p className="hero-note">No credit card required &nbsp;·&nbsp; Google sign-in &nbsp;·&nbsp; $1 per upload after free tier</p>
      </section>

      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-num">20×</span>
          <span className="stat-label">Uploads at once</span>
        </div>
        <div className="stat-item">
          <span className="stat-num">3</span>
          <span className="stat-label">Free uploads</span>
        </div>
        <div className="stat-item">
          <span className="stat-num">$1</span>
          <span className="stat-label">Per upload after</span>
        </div>
        <div className="stat-item">
          <span className="stat-num">Auto</span>
          <span className="stat-label">Naming convention</span>
        </div>
      </div>

      <div style={{ textAlign: "center", padding: "4rem 2rem", borderBottom: "1px solid #242424", background: "#0d0d0d" }}>
        <p style={{ fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#c8f55a", fontWeight: 600, marginBottom: "1.25rem" }}>Time saved across all uploads</p>
        <div style={{ display: "inline-flex", alignItems: "baseline", gap: "0.5rem" }}>
          <span id="min-counter" style={{ fontFamily: "var(--font-syne)", fontSize: "clamp(3.5rem,8vw,6rem)", fontWeight: 800, letterSpacing: "-0.04em", color: "#f0f0f0", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>1,247.30</span>
          <span style={{ fontFamily: "var(--font-syne)", fontSize: "clamp(1.25rem,3vw,2rem)", fontWeight: 800, color: "#555", letterSpacing: "-0.03em" }}>min saved</span>
        </div>
        <p style={{ fontSize: "0.82rem", color: "#444", marginTop: "0.75rem" }}>vs uploading one video at a time</p>
        <Script id="min-counter-script" strategy="afterInteractive">{`
          (function(){
            var seed = 1247.30;
            var rate = 0.043;
            var start = Date.now();
            var el = document.getElementById('min-counter');
            function tick(){
              var val = seed + (Date.now()-start)/1000*rate;
              var parts = val.toFixed(2).split('.');
              parts[0] = parts[0].replace(/\\B(?=(\\d{3})+(?!\\d))/g, ',');
              el.textContent = parts.join('.');
              requestAnimationFrame(tick);
            }
            tick();
          })();
        `}</Script>
      </div>

      <section className="section">
        <p className="section-label">How it works</p>
        <h2 className="section-title">From files to YouTube<br />in four steps.</h2>
        <p className="section-sub">No complicated setup. Just drag, configure, and upload.</p>

        <div className="steps">
          <div className="step-card">
            <div className="step-num">01</div>
            <div className="step-icon icon-lime">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <h3>Drop your videos</h3>
            <p>Drag and drop up to 20 video files at once. drrop.io detects orientation and duration automatically.</p>
          </div>

          <div className="step-card">
            <div className="step-num">02</div>
            <div className="step-icon icon-orange">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
            <h3>Set batch metadata</h3>
            <p>Titles are auto-generated from filenames. Set privacy, category, and a title suffix for the whole batch in seconds.</p>
          </div>

          <div className="step-card">
            <div className="step-num">03</div>
            <div className="step-icon icon-purple">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <h3>Upload in parallel</h3>
            <p>Three concurrent uploads run simultaneously via YouTube&apos;s resumable API, cutting your total time by up to 90%.</p>
          </div>

          <div className="step-card">
            <div className="step-num">04</div>
            <div className="step-icon icon-blue">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="3" y1="15" x2="21" y2="15" />
                <line x1="9" y1="3" x2="9" y2="21" />
              </svg>
            </div>
            <h3>Export to Sheets</h3>
            <p>Every video ID and URL is automatically logged to a Google Sheet. One click to view — no copy-pasting.</p>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <p className="section-label">Features</p>
        <h2 className="section-title">Everything a media buyer<br />actually needs.</h2>
        <p className="section-sub">Built for performance marketers who upload at scale — not casual creators.</p>

        <div className="features-grid">
          <div className="feature-item">
            <div className="feature-icon icon-lime">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                <polyline points="13 2 13 9 20 9" />
              </svg>
            </div>
            <h3>Auto naming convention</h3>
            <p>Titles are built from filename, orientation, duration, and date — formatted for ad account naming conventions automatically.</p>
          </div>

          <div className="feature-item">
            <div className="feature-icon icon-orange">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3>Channel selector</h3>
            <p>Sign in once with Google OAuth and choose which YouTube channel to upload to — supports multiple channels.</p>
          </div>

          <div className="feature-item">
            <div className="feature-icon icon-purple">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="3" y1="15" x2="21" y2="15" />
                <line x1="9" y1="3" x2="9" y2="21" />
              </svg>
            </div>
            <h3>Google Sheets logging</h3>
            <p>A new sheet is auto-created on your first upload. Every batch appends video IDs and URLs instantly.</p>
          </div>

          <div className="feature-item">
            <div className="feature-icon icon-blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h3>Privacy controls</h3>
            <p>Set Public, Private, or Unlisted for the entire batch. Made for Kids toggle included.</p>
          </div>

          <div className="feature-item">
            <div className="feature-icon icon-lime">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <h3>Per-video progress</h3>
            <p>Individual progress bars for each file. See exactly what&apos;s uploading, what&apos;s done, and what&apos;s queued.</p>
          </div>

          <div className="feature-item">
            <div className="feature-icon icon-orange">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <h3>Credit packs</h3>
            <p>Buy credits when you need them — no subscription. Packs from $20–$100, credits never expire.</p>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <p className="section-label">Pricing</p>
        <h2 className="section-title">Simple, usage-based pricing.</h2>
        <p className="section-sub">Pay per upload. No monthly fees. Credits never expire.</p>

        <div className="free-banner">
          <div>
            <h3>Start with 3 free uploads.</h3>
            <p>No credit card required. Just sign in with Google and start uploading.</p>
          </div>
          <Link href="/login" className="btn-primary" style={{ flexShrink: 0 }}>Try it free →</Link>
        </div>

        <div className="pricing-grid">
          <div className="price-card">
            <div className="price-name">Starter</div>
            <div className="price-amount">$20</div>
            <div className="price-per">one-time</div>
            <div className="price-credits">20 credits</div>
            <div className="price-rate">$1.00 per upload</div>
            <div className="price-divider" />
            <div className="price-feature">20 video uploads</div>
            <div className="price-feature">Credits never expire</div>
            <div className="price-feature">All features included</div>
          </div>

          <div className="price-card featured">
            <div className="price-badge">Most popular</div>
            <div className="price-name">Pro</div>
            <div className="price-amount">$60</div>
            <div className="price-per">one-time</div>
            <div className="price-credits">60 credits</div>
            <div className="price-rate">$1.00 per upload</div>
            <div className="price-divider" />
            <div className="price-feature">60 video uploads</div>
            <div className="price-feature">Credits never expire</div>
            <div className="price-feature">All features included</div>
          </div>

          <div className="price-card">
            <div className="price-name">Agency</div>
            <div className="price-amount">$100</div>
            <div className="price-per">one-time</div>
            <div className="price-credits">100 credits</div>
            <div className="price-rate">$1.00 per upload</div>
            <div className="price-divider" />
            <div className="price-feature">100 video uploads</div>
            <div className="price-feature">Credits never expire</div>
            <div className="price-feature">All features included</div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-bg" />
        <h2>Stop uploading<br />one at a time.</h2>
        <p>Join media buyers and agencies who upload smarter with drrop.io.</p>
        <Link href="/login" className="btn-primary" style={{ fontSize: "1.1rem", padding: "1rem 2.5rem" }}>
          Get started — 3 free uploads
        </Link>
      </section>

      <footer>
        <div className="footer-logo">
          <span className="rest">d</span><span className="rr-first">r</span><span className="rr-second">r</span><span className="rest">op.io</span>
        </div>
        <div className="footer-links">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <a href="mailto:support@drrop.io">Support</a>
        </div>
        <div className="footer-copy">© 2025 drrop.io</div>
      </footer>
    </>
  );
}
