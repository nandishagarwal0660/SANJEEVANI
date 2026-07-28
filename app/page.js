'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import IntakeConsole    from '@/components/IntakeConsole';
import TriageResult     from '@/components/TriageResult';
import AmbulanceModal   from '@/components/AmbulanceModal';
import CarePathwayPanel from '@/components/CarePathwayPanel';
import EntityPanel      from '@/components/EntityPanel';
import SummaryPanel     from '@/components/SummaryPanel';
import AcuityGauge      from '@/components/AcuityGauge';
import NearbyFacilities from '@/components/NearbyFacilities';
import RoleAuthModal    from '@/components/RoleAuthModal';

export default function HomePage() {
  const [result, setResult]               = useState(null);
  const [isProcessing, setIsProcessing]   = useState(false);
  const [sosOpen, setSosOpen]             = useState(false);
  const [careType, setCareType]           = useState(null);
  const [careTrigger, setCareTrigger]     = useState(0);
  const [showTelehealth, setShowTelehealth] = useState(false);
  const [bodyRegion, setBodyRegion]       = useState(null);

  // Auth modal states
  const [authOpen, setAuthOpen]           = useState(false);
  const [authMode, setAuthMode]           = useState('login'); // 'login' | 'register'

  // Theme: 'dark' | 'light'
  const [theme, setTheme]                 = useState('dark');
  const [isMounted, setIsMounted]         = useState(false);

  // Chat messages (general comment/chat)
  const [chatMessages, setChatMessages]   = useState([
    { id: 1, from: 'ai', text: 'Namaste 🙏 I am your AI health triage assistant. Describe your symptoms below, or ask me anything about health.', time: '10:00 PM' },
  ]);
  const [chatInput, setChatInput]         = useState('');
  const chatEndRef                        = useRef(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  function getFormattedNow() {
    return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  function sendChatMessage(e) {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = { id: Date.now(), from: 'user', text: chatInput.trim(), time: getFormattedNow() };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    // Simulate AI reply after short delay
    setTimeout(() => {
      setChatMessages((prev) => [...prev, {
        id: Date.now() + 1,
        from: 'ai',
        text: 'I understand your concern. For accurate triage, please fill in your symptoms in the form below and click "Run Triage →". For emergencies, call 112 immediately.',
        time: getFormattedNow(),
      }]);
    }, 900);
  }

  async function handleTriage(inputs) {
    setIsProcessing(true);
    setResult(null);
    setCareType(null);
    setShowTelehealth(false);
    // Add user symptom as chat bubble
    setChatMessages((prev) => [...prev, {
      id: Date.now(),
      from: 'user',
      text: `🩺 Triage submitted: "${inputs.narrative.slice(0, 80)}${inputs.narrative.length > 80 ? '…' : ''}"`,
      time: getFormattedNow(),
    }]);

    try {
      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...inputs, bodyRegion }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Triage failed');
      setResult(data);
      setChatMessages((prev) => [...prev, {
        id: Date.now() + 1,
        from: 'ai',
        text: `✅ Triage complete! Severity: ${data.Severity_Color ?? 'Unknown'}. See results below.`,
        time: getFormattedNow(),
      }]);
      if (data.Severity_Color === 'RED' || data.ambulance_triggered) {
        setSosOpen(true);
      }
    } catch (err) {
      console.error(err);
      setChatMessages((prev) => [...prev, {
        id: Date.now() + 2,
        from: 'ai',
        text: '⚠️ Could not complete triage. Please check your connection or try again.',
        time: getFormattedNow(),
      }]);
    } finally {
      setIsProcessing(false);
    }
  }

  function handleFindCare(type) {
    setCareType(type);
    setCareTrigger((p) => p + 1);
  }

  const isDark = theme === 'dark';

  return (
    <div className={`app-shell ${isDark ? 'theme-dark' : 'theme-light'}`}>

      {/* ── SOS Modal ─────────────────────────────── */}
      <AmbulanceModal
        isOpen={sosOpen}
        onClose={() => setSosOpen(false)}
        severityColor={result?.Severity_Color}
      />

      {/* ── Role Auth Modal (Ambulance / Doctor / Hospital) ─── */}
      <RoleAuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />

      {/* ── Navbar ────────────────────────────────── */}
      <header className="glass-nav sticky top-0 z-40 flex items-center justify-between px-6 py-3.5 sm:px-10">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-mint-500/15 border border-mint-500/30 text-mint-400">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <div>
            <span className="font-display text-[17px] font-bold tracking-tight nav-brand">SANJEEVANI</span>
            <span className="ml-2 hidden sm:inline-block mono-tag text-slate-600 bg-white/5 px-2 py-0.5 rounded-full">
              AI Triage · MedGemma-27B
            </span>
          </div>
        </div>

        {/* Right nav actions */}
        <div className="flex items-center gap-2">
          {/* Live badge */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-white/8 bg-white/5 px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-mint-400 animate-pulse" />
            <span className="mono-tag text-slate-500">MedGemma-27B · Live</span>
          </div>

          {/* Theme Toggle */}
          <button
            id="theme-toggle-btn"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="theme-toggle-btn flex h-9 w-9 items-center justify-center rounded-full border transition-all"
          >
            <AnimatePresence mode="wait">
              {isDark ? (
                <motion.svg key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </motion.svg>
              ) : (
                <motion.svg key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </motion.svg>
              )}
            </AnimatePresence>
          </button>

          {/* SOS — direct call to 112 */}
          <a
            id="header-sos-btn"
            href="tel:112"
            className="sos-pulse-btn flex items-center gap-2 rounded-full border border-red-500/40 bg-red-950/50 px-4 py-2 font-display text-[13px] font-bold text-red-300 hover:bg-red-900/60 transition-all"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            SOS
          </a>

          {/* Login/Register Button */}
          <button
            id="login-btn"
            onClick={() => { setAuthMode('login'); setAuthOpen(true); }}
            className="login-nav-btn flex items-center gap-2 rounded-full border px-4 py-2 font-display text-[13px] font-semibold transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Login
          </button>
        </div>
      </header>

      {/* ── Main Split Layout ─────────────────────── */}
      <main className="split-layout dot-grid">

        {/* ════════ LEFT PANEL — Description ════════ */}
        <motion.aside className="left-panel"
          initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>

          {/* Status pill */}
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-mint-500/25 bg-mint-500/8 px-3.5 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-mint-400 animate-pulse" />
            <p className="mono-tag text-mint-400">Rural Health Triage · Active</p>
          </div>

          <h1 className="left-headline font-display text-4xl font-bold leading-tight sm:text-[48px] lg:text-[52px]">
            Language should<br/>never delay{' '}
            <span className="relative inline-block text-mint-400">
              care
              <svg className="absolute -bottom-2 left-0 w-full text-mint-500/40" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 15 100 5" stroke="currentColor" strokeWidth="4" fill="none"/>
              </svg>
            </span>.
          </h1>

          <p className="left-body mt-7 text-[15px] leading-relaxed max-w-lg">
            Speak or type in <span className="left-emphasis font-medium">Hindi, Bhojpuri, Marathi</span> or Chhattisgarhi.
            MedGemma-27B normalizes your symptoms into clinical terms, scores severity against{' '}
            <span className="text-mint-400">WHO triage guidelines</span>, and routes you to the right care — instantly.
          </p>
          <p className="left-body-muted mt-4 text-[14px] leading-relaxed max-w-lg">
            Designed for <span className="left-emphasis font-medium">rural &amp; semi-urban India</span> — covering areas with limited
            healthcare access and multilingual populations.
          </p>

          {/* Feature tags */}
          <div className="mt-8 flex flex-wrap gap-2">
            {['WHO-aligned triage', 'Multilingual AI', 'Emergency SOS', 'Biometric inputs', 'ASHA/PHC routing', 'Offline-capable'].map((tag) => (
              <span key={tag} className="feature-tag rounded-full border px-3.5 py-1.5 font-mono text-[11px] font-medium transition-all cursor-default">
                {tag}
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { val: '27B', label: 'Model Params', color: 'text-mint-400' },
              { val: '5+',  label: 'Languages',    color: 'text-cerulean-500' },
              { val: '<3s', label: 'Avg. Triage',  color: 'text-amber-400' },
            ].map(({ val, label, color }) => (
              <div key={label} className="stat-card rounded-2xl border p-4 text-center backdrop-blur-sm transition-all">
                <p className={`font-display text-2xl font-bold ${color}`}>{val}</p>
                <p className="stat-label mono-tag mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* SOS CTA — direct call */}
          <div className="mt-10">
            <a
              id="left-sos-btn"
              href="tel:112"
              className="sos-hero-btn group relative flex w-full items-center justify-between overflow-hidden rounded-2xl border border-red-500/50 bg-red-950/40 px-6 py-4 transition-all hover:bg-red-950/60 hover:border-red-400/70 active:scale-[0.98]"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'radial-gradient(ellipse at center, rgba(239,68,68,0.08) 0%, transparent 70%)' }} />
              <div className="relative flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-red-500 bg-red-950">
                  <span className="text-xl">🚑</span>
                  <span className="absolute -inset-1 rounded-full border border-red-500/30 animate-ping" />
                </div>
                <div className="text-left">
                  <p className="font-display text-[15px] font-bold text-red-300">Emergency SOS — Call 112</p>
                  <p className="text-[12px] text-red-400/70">Tap to call · Ambulance · Critical Care</p>
                </div>
              </div>
              <svg className="relative h-5 w-5 text-red-400/60 group-hover:text-red-300 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 0 1 2-2h3.28a1 1 0 0 1 .948.684l1.498 4.493a1 1 0 0 1-.502 1.21l-2.257 1.13a11.042 11.042 0 0 0 5.516 5.516l1.13-2.257a1 1 0 0 1 1.21-.502l4.493 1.498a1 1 0 0 1 .684.949V19a2 2 0 0 1-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
              </svg>
            </a>
          </div>

          {/* Powered by */}
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-white/6 bg-white/3 px-4 py-3">
            <span className="text-lg">⚕</span>
            <p className="text-[12px] text-slate-600 font-mono leading-relaxed">
              Powered by <span className="text-slate-400">google/medgemma-27b-it</span> · WHO ICD-11 ·{' '}
              <span className="text-red-500/80">Not a substitute for emergency services</span>
            </p>
          </div>
        </motion.aside>

        {/* ════════ RIGHT PANEL — Chat + Form ════════ */}
        <motion.section className="right-panel"
          initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.15 }}>
          <div className="right-panel-inner">

            {/* Panel header */}
            <div className="right-panel-header">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint-500/15 border border-mint-500/30">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34C98E" strokeWidth="2.5">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="panel-title font-display text-[14px] font-bold">Symptom Triage Console</h2>
                  <p className="panel-subtitle text-[11px] font-mono">AI-powered · Real-time analysis</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-mint-500/20 bg-mint-500/8 px-2.5 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-mint-400 animate-pulse" />
                <span className="mono-tag text-mint-500">Live</span>
              </div>
            </div>

            {/* ── Chat / Message history ── */}
            <div className="right-panel-scroll" id="chat-scroll-area">
              {/* AI + user chat messages */}
              <div className="space-y-3 mb-3">
                {chatMessages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`flex gap-2.5 ${msg.from === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {msg.from === 'ai' && (
                      <div className="ai-avatar shrink-0 mt-0.5">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                        </svg>
                      </div>
                    )}
                    {msg.from === 'user' && (
                      <div className="user-avatar shrink-0 mt-0.5">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                        </svg>
                      </div>
                    )}
                    <div className={`max-w-[85%] ${msg.from === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai-msg'}`}>
                      {msg.from === 'ai' && <p className="text-[11px] font-semibold text-mint-400 mb-1">Sanjeevani AI</p>}
                      <p className="text-[13px] leading-relaxed chat-msg-text">{msg.text}</p>
                      <p className="text-[10px] mt-1 chat-time">
                        {typeof msg.time === 'string' ? msg.time : msg.time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Triage Result */}
              <TriageResult
                result={result}
                isProcessing={isProcessing}
                onSOS={() => window.location.href = 'tel:112'}
                onFindCare={handleFindCare}
                onTelehealth={() => setShowTelehealth(true)}
              />

              {/* HUD panels */}
              {(result || isProcessing) && (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <CarePathwayPanel result={result} isProcessing={isProcessing} />
                    <EntityPanel result={result} isProcessing={isProcessing} />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <SummaryPanel result={result} isProcessing={isProcessing} />
                    <AcuityGauge result={result} isProcessing={isProcessing} />
                  </div>
                </div>
              )}

              {/* Nearby Facilities */}
              {careType && (
                <div className="mt-4">
                  <NearbyFacilities facilityType={careType} trigger={careTrigger} />
                </div>
              )}

              {/* Telehealth */}
              {showTelehealth && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-4 glass-card p-5 border-cerulean-500/30">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xl">📱</span>
                    <div>
                      <h3 className="font-display text-sm font-bold text-slate-100">Telehealth Consultation</h3>
                      <p className="text-[12px] text-slate-400">
                        Specialization: <span className="text-cerulean-300 font-medium">{result?.Required_Specialization ?? 'General Physician'}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <a href="https://esanjeevani.mohfw.gov.in" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-xl border border-cerulean-500/30 bg-cerulean-950/40 px-4 py-2 font-display text-[12px] font-semibold text-cerulean-300 hover:bg-cerulean-950/60 transition-all">
                      🏛 eSanjeevani OPD (Govt)
                    </a>
                    <button onClick={() => setShowTelehealth(false)}
                      className="rounded-xl border border-white/10 px-4 py-2 font-display text-[12px] text-slate-500 hover:text-slate-300 transition-all">
                      Dismiss
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* ── Chat input box ── */}
            <div className="chat-input-bar">
              <form onSubmit={sendChatMessage} className="flex items-center gap-2">
                <input
                  id="chat-comment-input"
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask a health question or comment…"
                  className="chat-text-input flex-1 rounded-xl px-4 py-2.5 text-[13px] font-mono focus:outline-none transition-all"
                />
                <button
                  id="chat-send-btn"
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="chat-send-btn flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all disabled:opacity-40"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </form>
            </div>

            {/* ── Triage form (fixed at bottom) ── */}
            <div className="right-panel-form">
              <IntakeConsole onSubmit={handleTriage} isProcessing={isProcessing} />
            </div>
          </div>
        </motion.section>
      </main>

      {/* ── Footer ──────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-4 sm:px-10 text-center">
        <p className="font-mono text-[11px] text-slate-700 max-w-3xl mx-auto leading-relaxed">
          ⚕ Sanjeevani is an AI clinical decision-support tool powered by MedGemma-27B. It does not provide a diagnosis and does not
          replace assessment by a licensed clinician. In any life-threatening emergency, call{' '}
          <a href="tel:112" className="text-red-500 font-bold hover:underline">112</a> immediately.
          &nbsp;·&nbsp; Designed for rural &amp; semi-urban populations of India.
        </p>
      </footer>
    </div>
  );
}
