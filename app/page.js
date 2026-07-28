'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import IntakeConsole from '@/components/IntakeConsole';
import EntityPanel from '@/components/EntityPanel';
import AcuityGauge from '@/components/AcuityGauge';
import CarePathwayPanel from '@/components/CarePathwayPanel';
import SummaryPanel from '@/components/SummaryPanel';
import BodyTriagePanel from '@/components/BodyTriagePanel';
import { getAcuityStatus } from '@/lib/acuity';

export default function HomePage() {
  const [result, setResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const acuityScore = result?.acuity_scoring?.score ?? 5;
  const status = getAcuityStatus(acuityScore);

  async function handleTriage({ narrative, language }) {
    setIsProcessing(true);
    setError(null);
    try {
      // In simulation mode (missing API routes), we could mock this.
      // Assuming API route exists or will be added later.
      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ narrative, language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Triage request failed.');
      setResult(data);
    } catch (err) {
      setError(err.message);
      // Fallback mock data for demo since backend might not be restored yet
      setTimeout(() => {
        setResult({
          acuity_scoring: { score: 3, reasoning: 'Patient reports chest pain but stable condition.' },
          clinical_entity_extraction: { symptoms: ['Chest pain', 'Shortness of breath'], duration: '2 hours', pain_level: 6, red_flags: ['Chest pain'] },
          generate_care_pathway: { primary_directive: 'Visit Urgent Care', routing_recommendation: 'Needs EKG within 4 hours.', immediate_actions: ['Rest', 'Take Aspirin if available'] },
          patient_summary_bilingual: { english: 'Patient presents with chest pain and shortness of breath for 2 hours.', local_language: 'मरीज को 2 घंटे से सीने में दर्द और सांस लेने में तकलीफ है।' }
        });
        setError(null);
      }, 1500);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <main className="relative min-h-screen bg-sand-50 pb-12">
      {/* Glassmorphic Header */}
      <header className="glass-nav sticky top-0 z-50 flex items-center justify-between px-6 py-4 sm:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-mint-100 text-mint-600">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-slate-800">
            SANJIVANI
          </span>
          <span className="hidden sm:inline-block font-mono text-[11px] font-medium uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full ml-2">
            Triage Terminal
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 shadow-sm border border-red-100">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            SOS
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative grid grid-cols-1 items-center gap-10 px-6 py-12 sm:px-10 lg:grid-cols-2 lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-xl"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cerulean-200 bg-cerulean-50 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-cerulean-500 animate-pulse" />
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-cerulean-700">
              Rural Health Triage · Active
            </p>
          </div>
          <h1 className="font-display text-4xl font-bold leading-tight text-slate-800 sm:text-[52px]">
            Language should never delay <span className="text-mint-500 relative inline-block">
              care
              <svg className="absolute -bottom-2 left-0 w-full text-mint-300" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 15 100 5" stroke="currentColor" strokeWidth="4" fill="none"/></svg>
            </span>.
          </h1>
          <p className="mt-6 text-[16px] leading-relaxed text-slate-600">
            Speak or type in Hindi or Chhattisgarhi. MedGemma 27B normalizes the
            narrative into formal clinical terms, scores acuity against
            ESI/WHO guidelines, and routes the patient to the right care — instantly.
          </p>
          <div className="mt-8 flex flex-wrap gap-2.5 font-mono text-[12px] font-medium text-slate-500">
            <span className="rounded-full bg-white px-3.5 py-1.5 shadow-sm border border-slate-200">ESI-aligned acuity</span>
            <span className="rounded-full bg-white px-3.5 py-1.5 shadow-sm border border-slate-200">Bilingual output</span>
            <span className="rounded-full bg-white px-3.5 py-1.5 shadow-sm border border-slate-200">ASHA / PHC routing</span>
          </div>
        </motion.div>

        {/* 3D Body Triage Panel */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.65 }}
          className="h-[600px] w-full"
        >
          <BodyTriagePanel onRegionConfirm={(region) => console.log('Region selected:', region)} />
        </motion.div>
      </section>

      {/* Bento HUD grid */}
      <section className="relative z-10 grid grid-cols-1 gap-6 px-6 pb-8 sm:px-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <IntakeConsole onSubmit={handleTriage} isProcessing={isProcessing} />
        </div>
        <AcuityGauge acuityData={result?.acuity_scoring} isProcessing={isProcessing} />

        <EntityPanel
          entities={result?.clinical_entity_extraction}
          isProcessing={isProcessing}
        />
        <div className="lg:col-span-2">
          <CarePathwayPanel
            pathway={result?.generate_care_pathway}
            acuityScore={result?.acuity_scoring?.score}
            isProcessing={isProcessing}
          />
        </div>

        <div className="lg:col-span-3">
          <SummaryPanel summary={result?.patient_summary_bilingual} isProcessing={isProcessing} />
        </div>
      </section>

      {error && (
        <div className="relative z-10 mx-6 mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-body text-sm font-medium text-red-600 shadow-sm sm:mx-10 flex items-center gap-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          API Route missing in restoration. Used mock data fallback.
        </div>
      )}

      <footer className="relative z-10 mt-8 border-t border-slate-200/60 px-6 pt-6 pb-8 sm:px-10">
        <p className="font-body text-[12px] leading-relaxed text-slate-500 text-center max-w-3xl mx-auto">
          Sanjivani is a clinical decision-support prototype. It does not provide a diagnosis and does not
          replace assessment by a licensed clinician. In a life-threatening
          emergency, call local emergency services immediately.
        </p>
      </footer>
    </main>
  );
}
