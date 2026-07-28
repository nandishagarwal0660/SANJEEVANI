'use client';

import { motion, AnimatePresence } from 'framer-motion';
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
                    <p className="text-[13px] text-slate-400 mt-0.5">
                      Specialization: <span className={`font-semibold ${sev.text}`}>{result.Required_Specialization}</span>
                    </p>
                  </div>
                </div>

                {/* Patient Communication (local language) */}
                <div className={`rounded-xl border px-4 py-3 ${sev.border} bg-black/20 mb-4`}>
                  <p className="mono-tag text-slate-500 mb-2">Patient Communication ({result._source || 'AI'})</p>
                  <p className="font-body text-[14px] leading-relaxed text-slate-200 whitespace-pre-wrap">
                    {result.Patient_Communication}
                  </p>
                </div>

                {/* Immediate Actions */}
                {result.Immediate_Actions?.length > 0 && (
                  <div className="mb-4">
                    <p className="mono-tag text-slate-500 mb-2">Immediate Steps</p>
                    <ul className="space-y-1.5">
                      {result.Immediate_Actions.map((action, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-[13px] text-slate-300">
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
                      🚑 Book Ambulance NOW
                    </button>
                  )}
                  {(result.Severity_Color === 'RED' || result.Severity_Color === 'YELLOW') && (
                    <button
                      id="find-hospital-btn"
                      onClick={() => onFindCare('hospital')}
                      className={`flex items-center gap-2 rounded-xl border px-5 py-2.5 font-display text-[13px] font-semibold text-white transition-all active:scale-95 ${sev.ctaClass}`}
                    >
                      🏥 Find Nearest Hospital
                    </button>
                  )}
                  {(result.Severity_Color === 'GREEN' || result.Severity_Color === 'BLUE') && (
                    <>
                      <button
                        id="find-clinic-btn"
                        onClick={() => onFindCare('clinic')}
                        className={`flex items-center gap-2 rounded-xl border px-5 py-2.5 font-display text-[13px] font-semibold text-white transition-all active:scale-95 ${sev.ctaClass}`}
                      >
                        🩺 Find a Specialist
                      </button>
                      <button
                        id="telehealth-btn"
                        onClick={onTelehealth}
                        className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 font-display text-[13px] font-semibold text-slate-300 hover:border-cerulean-500/50 hover:text-cerulean-300 transition-all active:scale-95"
                      >
                        📱 Book Telehealth
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
