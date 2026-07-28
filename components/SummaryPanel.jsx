'use client';

import { motion } from 'framer-motion';
import Panel from './Panel';

export default function SummaryPanel({ summary, isProcessing }) {
  const hasData = !!summary;

  return (
    <Panel eyebrow="Panel 05" title="Bilingual Clinical Summary" statusDot="#4DA6D9" className="h-full">
      {!hasData && !isProcessing && (
        <p className="font-body text-[13px] leading-relaxed text-slate-500">
          Awaiting triage. A generated summary for the provider in both English and the patient's language will appear here.
        </p>
      )}

      {isProcessing && (
        <div className="space-y-3">
          <motion.div animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 1.2, repeat: Infinity }} className="h-4 w-full rounded bg-slate-100" />
          <motion.div animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.1 }} className="h-4 w-5/6 rounded bg-slate-100" />
          <motion.div animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }} className="h-4 w-4/6 rounded bg-slate-100" />
        </div>
      )}

      {hasData && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="grid grid-cols-1 gap-6 md:grid-cols-2">
          
          {/* English Summary */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
            <div className="mb-3 flex items-center gap-2 border-b border-slate-200 pb-2">
              <span className="font-display text-[13px] font-semibold text-slate-700">English Medical Summary</span>
            </div>
            <p className="font-body text-[14px] leading-relaxed text-slate-600 whitespace-pre-wrap">
              {summary.english}
            </p>
          </div>

          {/* Local Language Summary */}
          <div className="rounded-2xl border border-cerulean-100 bg-cerulean-50/50 p-5">
            <div className="mb-3 flex items-center gap-2 border-b border-cerulean-200 pb-2">
              <span className="font-display text-[13px] font-semibold text-cerulean-700">Patient Language (Local)</span>
            </div>
            <p className="font-body text-[15px] leading-relaxed text-slate-700 whitespace-pre-wrap font-medium">
              {summary.local_language}
            </p>
          </div>

        </motion.div>
      )}
    </Panel>
  );
}
