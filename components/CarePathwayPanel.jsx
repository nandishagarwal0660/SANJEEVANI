'use client';

import { motion } from 'framer-motion';
import Panel from './Panel';
import { getAcuityStatus } from '@/lib/acuity';

export default function CarePathwayPanel({ pathway, acuityScore, isProcessing }) {
  const hasData = !!pathway;
  const status = getAcuityStatus(acuityScore);

  return (
    <Panel eyebrow="Panel 04" title="Recommended Care Pathway" statusDot={hasData ? status.color : '#4DA6D9'} className="h-full">
      {!hasData && !isProcessing && (
        <p className="font-body text-[13px] leading-relaxed text-slate-500">
          Awaiting triage. Action directives (e.g., "Visit Urgent Care", "Home Care") will appear here.
        </p>
      )}

      {isProcessing && (
        <div className="space-y-4">
          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }} className="h-12 w-full rounded-xl bg-slate-100" />
          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} className="h-24 w-full rounded-xl bg-slate-50" />
        </div>
      )}

      {hasData && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col gap-4">
          
          {/* Action Directive Card */}
          <div className={`flex items-start gap-4 rounded-2xl border p-4 ${
            acuityScore <= 2 ? 'border-red-200 bg-red-50' :
            acuityScore === 3 ? 'border-amber-200 bg-amber-50' :
            'border-mint-200 bg-mint-50'
          }`}>
            <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              acuityScore <= 2 ? 'bg-red-100 text-red-600' :
              acuityScore === 3 ? 'bg-amber-100 text-amber-600' :
              'bg-mint-100 text-mint-600'
            }`}>
              {/* Contextual Icon based on severity */}
              {acuityScore <= 2 ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              ) : acuityScore === 3 ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="M9 15h6"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              )}
            </div>
            <div>
              <h3 className={`font-display text-[17px] font-bold ${
                acuityScore <= 2 ? 'text-red-700' :
                acuityScore === 3 ? 'text-amber-700' :
                'text-mint-700'
              }`}>
                {pathway.primary_directive || 'Follow up with provider'}
              </h3>
              <p className={`mt-1 font-body text-[13px] leading-relaxed ${
                acuityScore <= 2 ? 'text-red-600' :
                acuityScore === 3 ? 'text-amber-700' :
                'text-mint-600'
              }`}>
                {pathway.routing_recommendation}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <h4 className="font-mono text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Immediate Steps</h4>
            <ul className="space-y-2">
              {pathway.immediate_actions?.map((action, idx) => (
                <li key={idx} className="flex items-start gap-2.5 font-body text-[14px] text-slate-600">
                  <span className="mt-1 flex h-1.5 w-1.5 shrink-0 rounded-full bg-cerulean-400" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </Panel>
  );
}
