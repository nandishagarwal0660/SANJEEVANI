'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

import IntakeConsole    from '@/components/IntakeConsole';
import TriageResult     from '@/components/TriageResult';
import EntityPanel      from '@/components/EntityPanel';
import AcuityGauge      from '@/components/AcuityGauge';
import CarePathwayPanel from '@/components/CarePathwayPanel';
import SummaryPanel     from '@/components/SummaryPanel';
import NearbyFacilities from '@/components/NearbyFacilities';
import AmbulanceModal   from '@/components/AmbulanceModal';

// Three.js must be client-only
const BodyTriagePanel = dynamic(() => import('@/components/BodyTriagePanel'), { ssr: false });

export default function HomePage() {
  const [result, setResult]               = useState(null);
  const [isProcessing, setIsProcessing]   = useState(false);
  const [bodyRegion, setBodyRegion]       = useState(null);
  const [sosOpen, setSosOpen]             = useState(false);
  const [careType, setCareType]           = useState(null);   // 'hospital' | 'clinic' | null
  const [careTrigger, setCareTrigger]     = useState(0);      // increment to re-trigger fetch
  const [showTelehealth, setShowTelehealth] = useState(false);

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

      // Auto-trigger SOS for RED
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
    <main className="relative min-h-screen dot-grid pb-16">
      {/* ── Ambulance SOS Modal ─────────────────────────────────── */}
      <AmbulanceModal
        isOpen={sosOpen}
        onClose={() => setSosOpen(false)}
        severityColor={result?.Severity_Color}
      />

      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="glass-nav sticky top-0 z-40 flex items-center justify-between px-6 py-3.5 sm:px-10">
        <div className="flex items-center gap-3">
          {/* Logo */}
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

        <div className="flex items-center gap-3">
          {/* Model badge */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-white/8 bg-white/5 px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-mint-400 animate-pulse" />
            <span className="mono-tag text-slate-500">google/medgemma-27b-it</span>
          </div>

          {/* SOS button */}
          <button
            id="header-sos-btn"
            onClick={() => setSosOpen(true)}
            className="flex items-center gap-2 rounded-full border border-red-500/40 bg-red-950/50 px-4 py-2 font-display text-[13px] font-bold text-red-300 hover:bg-red-900/60 transition-all"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            SOS
          </button>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative grid grid-cols-1 items-center gap-8 px-6 py-12 sm:px-10 lg:grid-cols-2 lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
          className="relative z-10 max-w-xl"
        >
          {/* Status pill */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-mint-500/25 bg-mint-500/8 px-3.5 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-mint-400 animate-pulse" />
            <p className="mono-tag text-mint-400">Rural Health Triage · Active</p>
          </div>

          <h1 className="font-display text-4xl font-bold leading-tight text-slate-50 sm:text-[52px]">
            Language should<br/>never delay{' '}
            <span className="relative inline-block text-mint-400">
              care
              <svg className="absolute -bottom-2 left-0 w-full text-mint-500/40" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 15 100 5" stroke="currentColor" strokeWidth="4" fill="none"/>
              </svg>
            </span>.
          </h1>

          <p className="mt-6 text-[16px] leading-relaxed text-slate-400">
            Speak or type in <span className="text-slate-200 font-medium">Hindi, Bhojpuri, Marathi</span> or Chhattisgarhi.
            MedGemma-27B normalizes your symptoms into clinical terms, scores severity against{' '}
            <span className="text-mint-400">WHO triage guidelines</span>, and routes you to the right care — instantly.
          </p>

          <div className="mt-8 flex flex-wrap gap-2.5">
            {['WHO-aligned triage', 'Multilingual AI', 'Emergency SOS', 'Biometric inputs', 'ASHA/PHC routing'].map((tag) => (
              <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 font-mono text-[11px] font-medium text-slate-400">
                {tag}
              </span>
            ))}
          </div>
        </motion.div>

        {/* 3D Body Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.65 }}
          className="h-[560px] w-full"
        >
          <BodyTriagePanel onRegionConfirm={setBodyRegion} />
        </motion.div>
      </section>

      {/* ── Intake + Results ────────────────────────────────────── */}
      <section className="relative z-10 px-6 pb-8 sm:px-10 space-y-6">

        {/* Intake Console */}
        <IntakeConsole onSubmit={handleTriage} isProcessing={isProcessing} />

        {/* Triage Result (full width hero card) */}
        <TriageResult
          result={result}
          isProcessing={isProcessing}
          onSOS={() => setSosOpen(true)}
          onFindCare={handleFindCare}
          onTelehealth={() => setShowTelehealth(true)}
        />

        {/* HUD grid — only show when there's data */}
        {(result || isProcessing) && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <CarePathwayPanel result={result} isProcessing={isProcessing} />
            </div>
            <EntityPanel result={result} isProcessing={isProcessing} />

            <div className="lg:col-span-2">
              <SummaryPanel result={result} isProcessing={isProcessing} />
            </div>
            <AcuityGauge result={result} isProcessing={isProcessing} />
          </div>
        )}

        {/* Nearby Care Facilities */}
        {careType && (
          <NearbyFacilities facilityType={careType} trigger={careTrigger} />
        )}

        {/* Telehealth placeholder */}
        {showTelehealth && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 border-cerulean-500/30"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">📱</span>
              <div>
                <h3 className="font-display text-base font-bold text-slate-100">Telehealth Consultation</h3>
                <p className="text-[13px] text-slate-400">
                  Specialization: <span className="text-cerulean-300 font-medium">{result?.Required_Specialization ?? 'General Physician'}</span>
                </p>
              </div>
            </div>
            <p className="text-[13px] text-slate-400 mb-4">
              Connect with a licensed doctor from anywhere. Telehealth integration (eSanjeevani / 1mg / Practo) can be wired to the{' '}
              <code className="text-cerulean-400 bg-white/5 px-1.5 py-0.5 rounded text-[12px]">book_telehealth_consult()</code> function.
            </p>
            <div className="flex gap-3 flex-wrap">
              <a href="https://esanjeevani.mohfw.gov.in" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl border border-cerulean-500/30 bg-cerulean-950/40 px-4 py-2.5 font-display text-[13px] font-semibold text-cerulean-300 hover:bg-cerulean-950/60 transition-all">
                🏛 eSanjeevani OPD (Govt)
              </a>
              <button
                onClick={() => setShowTelehealth(false)}
                className="rounded-xl border border-white/10 px-4 py-2.5 font-display text-[13px] text-slate-500 hover:text-slate-300 transition-all">
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/5 px-6 pt-6 pb-8 sm:px-10">
        <p className="font-mono text-[11px] leading-relaxed text-slate-600 text-center max-w-3xl mx-auto">
          ⚕ Sanjeevani is an AI clinical decision-support tool powered by MedGemma-27B. It does not provide a diagnosis and does not
          replace assessment by a licensed clinician. In any life-threatening emergency, call <strong className="text-red-500">112</strong> immediately.
          &nbsp;·&nbsp; Designed for rural & semi-urban populations of India.
        </p>
      </footer>
    </main>
  );
}
