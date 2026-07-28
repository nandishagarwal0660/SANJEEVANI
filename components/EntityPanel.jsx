'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Panel from './Panel';

function Chip({ children, delay = 0, tone = 'mint' }) {
  const toneClasses = {
    mint: 'border-mint-200 bg-mint-50 text-mint-600',
    crimson: 'border-red-200 bg-red-50 text-red-600',
    cerulean: 'border-cerulean-200 bg-cerulean-50 text-cerulean-600',
  };
  
  const dotColors = {
    mint: 'bg-mint-500',
    crimson: 'bg-red-500',
    cerulean: 'bg-cerulean-500',
  };

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.35, ease: 'easeOut' }}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[12px] font-medium shadow-sm ${toneClasses[tone]}`}
    >
      <motion.span
        animate={{ opacity: [1, 0.4, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, delay }}
        className={`h-1.5 w-1.5 rounded-full ${dotColors[tone]}`}
      />
      {children}
    </motion.span>
  );
}

export default function EntityPanel({ entities, isProcessing }) {
  const hasData = !!entities;

  return (
    <Panel eyebrow="Panel 02" title="Clinical Entity Extraction" statusDot="#34C98E" className="h-full">
      {!hasData && !isProcessing && (
        <p className="font-body text-[13px] leading-relaxed text-slate-500">
          Awaiting patient narrative — extracted symptoms, duration, and pain
          level will populate here as MedGemma detects them.
        </p>
      )}

      {isProcessing && (
        <div className="space-y-3 mt-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              className="h-7 w-3/4 rounded-full bg-slate-100"
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {hasData && (
          <div className="space-y-5 mt-1">
            <div>
              <p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                Symptoms detected
              </p>
              <div className="flex flex-wrap gap-2">
                {entities.symptoms?.map((s, i) => (
                  <Chip key={s} delay={i * 0.12} tone="cerulean">
                    {s}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-2xl bg-slate-50 p-4 border border-slate-100">
              <div>
                <p className="mb-1 font-mono text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  Duration
                </p>
                <p className="font-display text-[15px] font-medium text-slate-700">{entities.duration}</p>
              </div>
              <div>
                <p className="mb-1 font-mono text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  Pain level
                </p>
                <p className="font-display text-[15px] font-medium text-slate-700">
                  {entities.pain_level != null ? `${entities.pain_level} / 10` : '—'}
                </p>
              </div>
            </div>

            {entities.red_flags?.length > 0 && (
              <div>
                <p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-widest text-red-400">
                  Red flags
                </p>
                <div className="flex flex-wrap gap-2">
                  {entities.red_flags.map((f, i) => (
                    <Chip key={f} tone="crimson" delay={i * 0.15}>
                      {f}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </AnimatePresence>
    </Panel>
  );
}
