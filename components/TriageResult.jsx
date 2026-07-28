'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Ambulance, Building2, Stethoscope, Smartphone } from 'lucide-react';
import { getSevConfig } from '@/lib/acuity';

export default function TriageResult({ result, isProcessing, onSOS, onFindCare, onTelehealth }) {
  if (!result && !isProcessing) return null;

  const sev = result ? getSevConfig(result.Severity_Color) : null;

  return (
    <AnimatePresence>
      {(result || isProcessing) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5 }}
          className={`relative overflow-hidden rounded-2xl border p-6 ${
            sev ? `${sev.bg} ${sev.border}` : 'bg-white/5 border-white/10'
          }`}
          style={sev ? { boxShadow: sev.glowShadow } : {}}
        >
          {/* Top accent line */}
          {sev && (
            <div
              className="absolute top-0 left-0 right-0 h-[3px]"
              style={{ background: `linear-gradient(90deg, transparent 5%, ${sev.color} 50%, transparent 95%)` }}
            />
          )}

          {isProcessing && !result && (
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <div className="h-16 w-16 rounded-full bg-white/5 skeleton" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="h-5 w-1/3 rounded skeleton" />
                <div className="h-4 w-3/4 rounded skeleton" />
                <div className="h-4 w-2/3 rounded skeleton" />
              </div>
            </div>
          )}

          {result && sev && (
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              {/* Severity Badge */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div
                  className={`sev-ring ${sev.ring} flex h-20 w-20 flex-col items-center justify-center rounded-full border-2`}
                  style={{ borderColor: sev.color, background: `${sev.color}18` }}
                >
                  <span className="text-2xl leading-none">{sev.emoji}</span>
                  <span className="font-mono text-[10px] font-bold tracking-widest mt-0.5" style={{ color: sev.color }}>
                    {result.Severity_Color}
                  </span>
                </div>
                <span className={`mono-tag ${sev.text}`}>{sev.label}</span>
              </div>

              {/* Main content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start gap-3 mb-3">
                  <div>
                    <h2 className={`font-display text-xl font-bold ${sev.textStrong}`}>
                      {sev.action}
                    </h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-2)', margin: '4px 0 0 0' }}>
                      Specialization: <span style={{ fontWeight: 600, color: sev.color }}>{result.Required_Specialization}</span>
                    </p>
                  </div>
                </div>

                {/* Patient Communication (local language) */}
                <div className="rounded-xl border px-4 py-3 mb-4" style={{ borderColor: sev.color + '40', background: sev.color + '10' }}>
                  <p className="mono-tag mb-2" style={{ color: 'var(--text-3)' }}>Patient Communication ({result._source || 'AI'})</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', lineHeight: '1.65', color: 'var(--text-1)', whiteSpace: 'pre-wrap', margin: 0 }}>
                    {result.Patient_Communication}
                  </p>
                </div>

                {/* Immediate Actions */}
                {result.Immediate_Actions?.length > 0 && (
                  <div className="mb-3">
                    <p className="mono-tag mb-2" style={{ color: 'var(--text-3)' }}>Immediate Steps</p>
                    <ul className="space-y-1.5">
                      {result.Immediate_Actions.map((action, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: 'var(--text-1)' }}>
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: sev.color }} />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* CTA Buttons */}
                <div className="flex flex-wrap gap-3">
                  {result.Severity_Color === 'RED' && (
                    <button
                      id="sos-ambulance-btn"
                      onClick={onSOS}
                      className="flex items-center gap-2 rounded-xl border border-red-500 bg-red-600 px-5 py-2.5 font-display text-[13px] font-bold text-white shadow-lg shadow-red-900/40 hover:bg-red-500 active:scale-95 transition-all animate-sev-pulse-red"
                    >
                      <Ambulance size={16} /> Book Ambulance NOW
                    </button>
                  )}
                  {(result.Severity_Color === 'RED' || result.Severity_Color === 'YELLOW') && (
                    <button
                      id="find-hospital-btn"
                      onClick={() => onFindCare('hospital')}
                      className={`flex items-center gap-2 rounded-xl border px-5 py-2.5 font-display text-[13px] font-semibold text-white transition-all active:scale-95 ${sev.ctaClass}`}
                    >
                      <Building2 size={16} /> Find Nearest Hospital
                    </button>
                  )}
                  {(result.Severity_Color === 'GREEN' || result.Severity_Color === 'BLUE') && (
                    <>
                      <button
                        id="find-clinic-btn"
                        onClick={() => onFindCare('clinic')}
                        className={`flex items-center gap-2 rounded-xl border px-5 py-2.5 font-display text-[13px] font-semibold text-white transition-all active:scale-95 ${sev.ctaClass}`}
                      >
                        <Stethoscope size={16} /> Find a Specialist
                      </button>
                      <button
                        id="telehealth-btn"
                        onClick={onTelehealth}
                        className="flex items-center gap-2 rounded-xl border px-5 py-2.5 font-display text-[13px] font-semibold transition-all active:scale-95"
                        style={{ borderColor: 'var(--border)', background: 'var(--bg-card)', color: 'var(--text-2)' }}
                      >
                        <Smartphone size={16} /> Book Telehealth
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
