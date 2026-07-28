'use client';

import { motion } from 'framer-motion';
import Panel from './Panel';
import { getAcuityStatus } from '@/lib/acuity';

export default function AcuityGauge({ acuityData, isProcessing }) {
  const hasData = !!acuityData;
  const score = acuityData?.score ?? 5;
  const status = getAcuityStatus(score);

  return (
    <Panel eyebrow="Panel 03" title="ESI Acuity Level" statusDot={status.color} className="h-full">
      {!hasData && !isProcessing && (
        <p className="font-body text-[13px] leading-relaxed text-slate-500">
          Awaiting analysis. MedGemma will assign an ESI severity score based on extracted symptoms and red flags.
        </p>
      )}

      {isProcessing && (
        <div className="flex flex-col items-center justify-center py-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="h-10 w-10 rounded-full border-4 border-slate-100 border-t-mint-400"
          />
        </div>
      )}

      {hasData && !isProcessing && (
        <div className="flex flex-col items-center py-2">
          {/* Gauge Visualization */}
          <div className="relative flex items-center justify-center mb-4">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle cx="64" cy="64" r="56" fill="none" stroke="#F1F5F9" strokeWidth="12" />
              <motion.circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke={status.color}
                strokeWidth="12"
                strokeDasharray={351.8}
                strokeDashoffset={351.8 - (351.8 * ((6 - score) / 5))}
                initial={{ strokeDashoffset: 351.8 }}
                animate={{ strokeDashoffset: 351.8 - (351.8 * ((6 - score) / 5)) }}
                transition={{ duration: 1, ease: 'easeOut' }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">Level</span>
              <span className={`font-display text-4xl font-bold ${status.textClass}`}>{score}</span>
            </div>
          </div>

          <div className="text-center">
            <h3 className={`font-display text-lg font-semibold ${status.textClass} flex items-center justify-center gap-2`}>
              {/* Alert icon for higher severity */}
              {score <= 2 && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
              )}
              {score === 3 && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4l3 3"></path></svg>
              )}
              {status.label.split(' (')[1].replace(')', '')}
            </h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed font-body">
              {acuityData?.reasoning || 'Severity score computed based on clinical indicators.'}
            </p>
          </div>
        </div>
      )}
    </Panel>
  );
}
