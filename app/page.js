'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

import IntakeConsole    from '@/components/IntakeConsole';
import TriageResult     from '@/components/TriageResult';
import AmbulanceModal   from '@/components/AmbulanceModal';
import CarePathwayPanel from '@/components/CarePathwayPanel';
import EntityPanel      from '@/components/EntityPanel';
import SummaryPanel     from '@/components/SummaryPanel';
import AcuityGauge      from '@/components/AcuityGauge';
import NearbyFacilities from '@/components/NearbyFacilities';

export default function HomePage() {
  const [result, setResult]               = useState(null);
  const [isProcessing, setIsProcessing]   = useState(false);
  const [sosOpen, setSosOpen]             = useState(false);
  const [careType, setCareType]           = useState(null);
  const [careTrigger, setCareTrigger]     = useState(0);
  const [showTelehealth, setShowTelehealth] = useState(false);
  const [loginOpen, setLoginOpen]         = useState(false);
  const [bodyRegion, setBodyRegion]       = useState(null);

  async function handleTriage(inputs) {
    setIsProcessing(true);
    setResult(null);
    setCareType(null);
    setShowTelehealth(false);

    try {
      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...inputs, bodyRegion }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Triage failed');
      setResult(data);
      if (data.Severity_Color === 'RED' || data.ambulance_triggered) {
        setSosOpen(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }

  function handleFindCare(type) {
    setCareType(type);
    setCareTrigger((p) => p + 1);
  }

  return (
    <div className="app-shell">
      {/* ── SOS Modal ─────────────────────────────── */}
      <AmbulanceModal
        isOpen={sosOpen}
        onClose={() => setSosOpen(false)}
        severityColor={result?.Severity_Color}
      />

      {/* ── Login Modal ───────────────────────────── */}
      <AnimatePresence>
        {loginOpen && (
          <motion.div
            className="sos-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLoginOpen(false)}
          >
            <motion.div
              className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-[#0f1117] shadow-2xl"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top gradient accent */}
              <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #34C98E, #4DA6D9, #34C98E)' }} />
              <div className="p-6">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint-500/15 border border-mint-500/30 text-mint-400">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="font-display text-[17px] font-bold text-slate-100">Welcome back</h2>
                    <p className="text-[12px] text-slate-500">Sign in to Sanjeevani</p>
                  </div>
                </div>

                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <div>
                    <label className="mono-tag text-slate-500 block mb-1.5">Email / Phone</label>
                    <input
                      type="text"
                      id="login-email"
                      placeholder="you@example.com or +91 XXXXXX"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 text-[13px] placeholder:text-slate-600 focus:outline-none focus:border-mint-500/60 transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="mono-tag text-slate-500 block mb-1.5">Password</label>
                    <input
                      type="password"
                      id="login-password"
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 text-[13px] placeholder:text-slate-600 focus:outline-none focus:border-mint-500/60 transition-all font-mono"
                    />
                  </div>
                  <button
                    id="login-submit-btn"
                    type="submit"
                    className="w-full rounded-xl bg-mint-600 border border-mint-500/70 py-2.5 font-display text-[14px] font-semibold text-white hover:bg-mint-500 transition-all active:scale-[0.98]"
                  >
                    Sign In
                  </button>
                  <p className="text-center text-[12px] text-slate-600">
                    No account?{' '}
                    <button className="text-mint-400 hover:text-mint-300 transition-colors" onClick={() => {}}>
                      Register free
                    </button>
                  </p>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
            <span className="font-display text-[17px] font-bold tracking-tight text-slate-100">SANJEEVANI</span>
            <span className="ml-2 hidden sm:inline-block mono-tag text-slate-600 bg-white/5 px-2 py-0.5 rounded-full">
              AI Triage · MedGemma-27B
            </span>
          </div>
        </div>

        {/* Right nav actions */}
        <div className="flex items-center gap-2.5">
          {/* Live model badge */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-white/8 bg-white/5 px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-mint-400 animate-pulse" />
            <span className="mono-tag text-slate-500">MedGemma-27B · Live</span>
          </div>

          {/* SOS Button */}
          <button
            id="header-sos-btn"
            onClick={() => setSosOpen(true)}
            className="sos-pulse-btn flex items-center gap-2 rounded-full border border-red-500/40 bg-red-950/50 px-4 py-2 font-display text-[13px] font-bold text-red-300 hover:bg-red-900/60 transition-all"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            SOS
          </button>

          {/* Login Button */}
          <button
            id="login-btn"
            onClick={() => setLoginOpen(true)}
            className="flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 font-display text-[13px] font-semibold text-slate-200 hover:bg-white/15 hover:border-white/25 transition-all"
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

        {/* ════════════ LEFT PANEL — Description ════════════ */}
        <motion.aside
          className="left-panel"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >
          {/* Status pill */}
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-mint-500/25 bg-mint-500/8 px-3.5 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-mint-400 animate-pulse" />
            <p className="mono-tag text-mint-400">Rural Health Triage · Active</p>
          </div>

          {/* Headline */}
          <h1 className="font-display text-4xl font-bold leading-tight text-slate-50 sm:text-[48px] lg:text-[52px]">
            Language should<br/>never delay{' '}
            <span className="relative inline-block text-mint-400">
              care
              <svg className="absolute -bottom-2 left-0 w-full text-mint-500/40" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 15 100 5" stroke="currentColor" strokeWidth="4" fill="none"/>
              </svg>
            </span>.
          </h1>

          {/* Description paragraphs */}
          <p className="mt-7 text-[15px] leading-relaxed text-slate-400 max-w-lg">
            Speak or type in <span className="text-slate-200 font-medium">Hindi, Bhojpuri, Marathi</span> or Chhattisgarhi.
            MedGemma-27B normalizes your symptoms into clinical terms, scores severity against{' '}
            <span className="text-mint-400">WHO triage guidelines</span>, and routes you to the right care — instantly.
          </p>
          <p className="mt-4 text-[14px] leading-relaxed text-slate-500 max-w-lg">
            Designed for <span className="text-slate-300 font-medium">rural & semi-urban India</span> — covering areas with limited 
            healthcare access and multilingual populations. No data leaves your device without consent.
          </p>

          {/* Feature tags */}
          <div className="mt-8 flex flex-wrap gap-2">
            {['WHO-aligned triage', 'Multilingual AI', 'Emergency SOS', 'Biometric inputs', 'ASHA/PHC routing', 'Offline-capable'].map((tag) => (
              <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 font-mono text-[11px] font-medium text-slate-400 hover:border-mint-500/30 hover:text-mint-300 transition-all cursor-default">
                {tag}
              </span>
            ))}
          </div>

          {/* Stats row */}
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { val: '27B', label: 'Model Params', color: 'text-mint-400' },
              { val: '5+', label: 'Languages', color: 'text-cerulean-400' },
              { val: '<3s', label: 'Avg. Triage', color: 'text-amber-400' },
            ].map(({ val, label, color }) => (
              <div key={label} className="stat-card rounded-2xl border border-white/8 bg-white/5 p-4 text-center backdrop-blur-sm hover:border-white/15 transition-all">
                <p className={`font-display text-2xl font-bold ${color}`}>{val}</p>
                <p className="mono-tag text-slate-500 mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Big SOS CTA */}
          <div className="mt-10">
            <button
              id="left-sos-btn"
              onClick={() => setSosOpen(true)}
              className="sos-hero-btn group relative w-full overflow-hidden rounded-2xl border border-red-500/50 bg-red-950/40 px-6 py-4 transition-all hover:bg-red-950/60 hover:border-red-400/70 active:scale-[0.98]"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'radial-gradient(ellipse at center, rgba(239,68,68,0.08) 0%, transparent 70%)' }} />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-red-500 bg-red-950">
                    <span className="text-xl">🚑</span>
                    <span className="absolute -inset-1 rounded-full border border-red-500/30 animate-ping" />
                  </div>
                  <div className="text-left">
                    <p className="font-display text-[15px] font-bold text-red-300">Emergency SOS</p>
                    <p className="text-[12px] text-red-400/70">Call 112 · Ambulance · Critical Care</p>
                  </div>
                </div>
                <svg className="h-5 w-5 text-red-400/60 group-hover:text-red-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </button>
          </div>

          {/* Powered by banner */}
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-white/6 bg-white/3 px-4 py-3">
            <span className="text-lg">⚕</span>
            <p className="text-[12px] text-slate-600 font-mono leading-relaxed">
              Powered by <span className="text-slate-400">google/medgemma-27b-it</span> · WHO ICD-11 aligned ·{' '}
              <span className="text-red-500/80">Not a substitute for emergency services</span>
            </p>
          </div>
        </motion.aside>

        {/* ════════════ RIGHT PANEL — Chat / Form ════════════ */}
        <motion.section
          className="right-panel"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
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
                  <h2 className="font-display text-[14px] font-bold text-slate-100">Symptom Triage Console</h2>
                  <p className="text-[11px] text-slate-500 font-mono">AI-powered · Real-time analysis</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-mint-500/20 bg-mint-500/8 px-2.5 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-mint-400 animate-pulse" />
                <span className="mono-tag text-mint-500">Live</span>
              </div>
            </div>

            {/* Scrollable content area */}
            <div className="right-panel-scroll">
              {/* Chat-style welcome message */}
              {!result && !isProcessing && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="chat-bubble-ai mb-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="ai-avatar shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] font-semibold text-mint-300 mb-1">Sanjeevani AI</p>
                      <p className="text-[13px] text-slate-300 leading-relaxed">
                        Namaste 🙏 I am your AI health triage assistant. Please describe your symptoms below in Hindi, English, Marathi, Bhojpuri, or Chhattisgarhi. I will analyze them and provide immediate guidance.
                      </p>
                      <p className="text-[11px] text-slate-600 mt-2 font-mono">
                        आपके लक्षण बताएं और हम तुरंत मार्गदर्शन करेंगे।
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Triage Result — shown as chat response */}
              <TriageResult
                result={result}
                isProcessing={isProcessing}
                onSOS={() => setSosOpen(true)}
                onFindCare={handleFindCare}
                onTelehealth={() => setShowTelehealth(true)}
              />

              {/* HUD panels below result */}
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
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 glass-card p-5 border-cerulean-500/30"
                >
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

            {/* ── Fixed intake form at bottom ── */}
            <div className="right-panel-form">
              <IntakeConsole onSubmit={handleTriage} isProcessing={isProcessing} />
            </div>
          </div>
        </motion.section>
      </main>

      {/* ── Footer ──────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-5 sm:px-10 text-center">
        <p className="font-mono text-[11px] text-slate-700 max-w-3xl mx-auto leading-relaxed">
          ⚕ Sanjeevani is an AI clinical decision-support tool powered by MedGemma-27B. It does not provide a diagnosis and does not
          replace assessment by a licensed clinician. In any life-threatening emergency, call <strong className="text-red-500">112</strong> immediately.
          &nbsp;·&nbsp; Designed for rural &amp; semi-urban populations of India.
        </p>
      </footer>
    </div>
  );
}
