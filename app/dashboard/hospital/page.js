'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { getStoredUser, MOCK_PROFILES, clearStoredUser } from '@/lib/auth';

const STATUS_CONFIG = {
  NORMAL_INTAKE:     { label: 'Normal Intake',     color: 'emerald', bg: 'bg-emerald-500/15', border: 'border-emerald-500/35', text: 'text-emerald-400' },
  HIGH_LOAD:         { label: 'High Load',         color: 'amber',   bg: 'bg-amber-500/15',  border: 'border-amber-500/35',  text: 'text-amber-400'  },
  CRITICAL_LOAD:     { label: 'Critical Load',     color: 'red',     bg: 'bg-red-500/15',    border: 'border-red-500/35',    text: 'text-red-400'    },
  DIVERT_REQUESTED:  { label: 'Divert Requested',  color: 'red',     bg: 'bg-red-500/20',    border: 'border-red-500/50',    text: 'text-red-300'    },
};

function CapacityBar({ used, total, colorClass }) {
  const pct = total > 0 ? Math.round(((total - used) / total) * 100) : 0;
  return (
    <div className="h-1.5 bg-white/8 rounded-full overflow-hidden mt-2">
      <motion.div
        className={`h-full rounded-full ${colorClass}`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      />
    </div>
  );
}

function BedControl({ label, freeKey, total, free, onAdjust, color }) {
  const occupied = total - free;
  const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;
  const criticalPct = pct >= 85;

  return (
    <div className={`rounded-2xl border p-4 transition-all hover-lift ${
      criticalPct ? 'bg-red-500/8 border-red-500/25 card-glow-red' : 'bg-white/4 border-white/8'
    }`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-slate-300">{label}</span>
        {criticalPct && (
          <span className="text-[10px] font-mono text-red-400 bg-red-500/15 px-2 py-0.5 rounded-full border border-red-500/30 alert-pulse">
            CRITICAL
          </span>
        )}
      </div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <span className={`vital-number font-mono ${criticalPct ? 'text-red-400' : `text-${color}-400`}`}>{free}</span>
          <span className="text-xs text-slate-500 ml-1">/ {total} free</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onAdjust(freeKey, -1)}
            className="h-7 w-7 rounded-lg bg-white/8 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-slate-300 hover:text-red-300 flex items-center justify-center text-sm font-bold transition-all btn-press"
            disabled={free <= 0}
          >−</button>
          <button
            onClick={() => onAdjust(freeKey, 1)}
            className="h-7 w-7 rounded-lg bg-white/8 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/30 text-slate-300 hover:text-emerald-300 flex items-center justify-center text-sm font-bold transition-all btn-press"
            disabled={free >= total}
          >+</button>
        </div>
      </div>
      <CapacityBar used={free} total={total} colorClass={criticalPct ? 'bg-red-500' : `bg-${color}-500`} />
      <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
        <span>{occupied} occupied</span>
        <span>{pct}% utilization</span>
      </div>
    </div>
  );
}

export default function HospitalDashboard() {
  const [user, setUser] = useState(MOCK_PROFILES.hospital);
  const [dataSource, setDataSource] = useState('connecting...');
  const [dbConnected, setDbConnected] = useState(false);
  const [capacity, setCapacity] = useState({
    icuTotal: 20, icuFree: 3,
    erBedsTotal: 45, erBedsFree: 8,
    ventilatorsTotal: 15, ventilatorsFree: 2,
    traumaBaysTotal: 6, traumaBaysFree: 1,
  });
  const [erStatus, setErStatus] = useState('NORMAL_INTAKE');
  const [saveMsg, setSaveMsg] = useState('');
  const [incomingAmbulances, setIncomingAmbulances] = useState([
    { unit: 'Unit 102', caseId: 'CAS-9921', patientName: 'Ramesh Verma (54M)', condition: 'Acute STEMI / Dyspnea', severity: 'RED', etaMinutes: 7, assignedBay: 'Trauma Bay 2', status: 'EN ROUTE' },
    { unit: 'Unit 205', caseId: 'CAS-9944', patientName: 'Pooja Nair (31F)', condition: 'Multiple Trauma / MVA', severity: 'RED', etaMinutes: 14, assignedBay: 'Trauma Bay 1', status: 'EN ROUTE' },
  ]);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored && stored.role === 'hospital') setUser(stored);

    async function load() {
      try {
        const res = await fetch('/api/hospital');
        const data = await res.json();
        if (data.success && data.hospital) {
          if (data.hospital.capacity) setCapacity(data.hospital.capacity);
          if (data.hospital.erStatus) setErStatus(data.hospital.erStatus);
          const isLive = data.source === 'mongodb';
          setDataSource(isLive ? 'MongoDB Real-Time' : 'Local Cache');
          setDbConnected(isLive);
        }
        if (data.success && data.incomingAmbulances) setIncomingAmbulances(data.incomingAmbulances);
      } catch {}
    }
    load();
  }, []);

  async function adjustBed(key, delta) {
    const totalKey = key.replace('Free', 'Total');
    const newVal = Math.max(0, Math.min(capacity[totalKey] || 99, capacity[key] + delta));
    const updated = { ...capacity, [key]: newVal };
    setCapacity(updated);

    try {
      await fetch('/api/hospital', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capacity: updated, erStatus }),
      });
      setSaveMsg('Synced to MongoDB');
    } catch {
      setSaveMsg('Saved locally');
    }
    setTimeout(() => setSaveMsg(''), 2500);
  }

  async function handleStatusChange(status) {
    setErStatus(status);
    try {
      await fetch('/api/hospital', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capacity, erStatus: status }),
      });
    } catch {}
  }

  const statusCfg = STATUS_CONFIG[erStatus] || STATUS_CONFIG.NORMAL_INTAKE;
  const totalFree = capacity.icuFree + capacity.erBedsFree + capacity.ventilatorsFree + capacity.traumaBaysFree;

  return (
    <div className="min-h-screen bg-[#07080c] text-slate-100" style={{ fontFamily: 'var(--font-body)' }}>
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[500px] h-[350px] bg-emerald-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-blue-500/4 rounded-full blur-[90px]" />
      </div>

      {/* Navbar */}
      <header className="relative z-30 border-b border-white/8 bg-[#07080c]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xl group-hover:scale-105 transition-transform shrink-0">
              🏥
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-slate-100 tracking-tight">SANJEEVANI</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-mono">HOSPITAL CONSOLE</span>
              </div>
              <p className="text-[11px] text-slate-500">{user.name} — Capacity & ER Management</p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono ${dbConnected ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-400'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${dbConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span className="hidden md:inline">{dataSource}</span>
            </div>
            {saveMsg && (
              <span className="text-xs text-emerald-400 font-mono bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                ✓ {saveMsg}
              </span>
            )}
            <Link href="/" onClick={() => clearStoredUser()}
              className="px-3 py-1.5 text-xs rounded-lg bg-white/5 hover:bg-emerald-500/15 border border-white/10 hover:border-emerald-500/30 text-slate-300 hover:text-emerald-300 transition-all">
              <span className="hidden sm:inline">Switch / </span>Logout
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Top KPI Row ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'ICU Free', value: capacity.icuFree, total: capacity.icuTotal, color: 'text-sky-400', subcolor: 'text-sky-400' },
            { label: 'ER Beds Free', value: capacity.erBedsFree, total: capacity.erBedsTotal, color: 'text-emerald-400', subcolor: 'text-emerald-400' },
            { label: 'Ventilators', value: capacity.ventilatorsFree, total: capacity.ventilatorsTotal, color: 'text-purple-400', subcolor: 'text-purple-400' },
            { label: 'Trauma Bays', value: capacity.traumaBaysFree, total: capacity.traumaBaysTotal, color: 'text-amber-400', subcolor: 'text-amber-400' },
          ].map(({ label, value, total, color }) => {
            const pct = total > 0 ? Math.round(((total - value) / total) * 100) : 0;
            return (
              <div key={label} className={`rounded-2xl border p-4 hover-lift transition-all ${pct >= 90 ? 'bg-red-500/8 border-red-500/25' : 'bg-[#0d0f16] border-white/8'}`}>
                <p className="text-[10px] text-slate-500 font-mono uppercase mb-1.5">{label}</p>
                <div className="flex items-baseline gap-1.5">
                  <span className={`vital-number font-mono ${pct >= 90 ? 'text-red-400' : color}`}>{value}</span>
                  <span className="text-xs text-slate-500">/ {total}</span>
                </div>
                <div className="h-1 bg-white/8 rounded-full overflow-hidden mt-2">
                  <div className={`h-full rounded-full transition-all progress-bar ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ── Left: Capacity Management ── */}
          <div className="lg:col-span-8 space-y-5">

            {/* ER Status Control */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="rounded-2xl bg-[#0d0f16] border border-white/8 p-5 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-semibold text-sm text-slate-200 mb-1">ER Intake Status</h3>
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${statusCfg.bg} ${statusCfg.border}`}>
                    <span className={`h-2 w-2 rounded-full ${statusCfg.text.replace('text-', 'bg-')} ${erStatus !== 'NORMAL_INTAKE' ? 'animate-pulse' : ''}`} />
                    <span className={`text-xs font-bold font-mono ${statusCfg.text}`}>{statusCfg.label}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => handleStatusChange(key)}
                    className={`py-2.5 px-3 rounded-xl text-[11px] font-bold border transition-all btn-press ${
                      erStatus === key
                        ? `${cfg.bg} ${cfg.border} ${cfg.text}`
                        : 'bg-white/4 border-white/8 text-slate-400 hover:bg-white/8'
                    }`}
                  >
                    {cfg.label}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Capacity Controls */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="rounded-2xl bg-[#0d0f16] border border-white/8 overflow-hidden shadow-xl">
              <div className="px-5 py-4 border-b border-white/6 flex items-center justify-between">
                <h3 className="font-semibold text-sm text-slate-200">Live Bed Management</h3>
                <span className="text-[10px] text-slate-500 font-mono">{totalFree} total free</span>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <BedControl label="ICU Beds" freeKey="icuFree" total={capacity.icuTotal} free={capacity.icuFree} onAdjust={adjustBed} color="sky" />
                <BedControl label="ER Beds" freeKey="erBedsFree" total={capacity.erBedsTotal} free={capacity.erBedsFree} onAdjust={adjustBed} color="emerald" />
                <BedControl label="Ventilators" freeKey="ventilatorsFree" total={capacity.ventilatorsTotal} free={capacity.ventilatorsFree} onAdjust={adjustBed} color="purple" />
                <BedControl label="Trauma Bays" freeKey="traumaBaysFree" total={capacity.traumaBaysTotal} free={capacity.traumaBaysFree} onAdjust={adjustBed} color="amber" />
              </div>
            </motion.div>
          </div>

          {/* ── Right: Incoming Ambulances ── */}
          <div className="lg:col-span-4 space-y-5">
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 }}
              className="rounded-2xl bg-[#0d0f16] border border-white/8 overflow-hidden shadow-xl">
              <div className="px-5 py-4 border-b border-white/6 flex items-center justify-between">
                <h3 className="font-semibold text-sm text-slate-200">Incoming Ambulances</h3>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-red-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                  LIVE
                </div>
              </div>
              <div className="divide-y divide-white/5">
                {incomingAmbulances.map((amb, i) => (
                  <motion.div
                    key={amb.caseId}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] text-red-400 font-bold">🚑 {amb.unit}</span>
                      <span className="text-[10px] font-mono text-slate-500">{amb.caseId}</span>
                    </div>
                    <p className="font-semibold text-sm text-slate-100">{amb.patientName}</p>
                    <p className="text-xs text-amber-300 mt-0.5">{amb.condition}</p>
                    <div className="flex items-center justify-between mt-2.5">
                      <div className="flex items-center gap-2 text-[10px] font-mono">
                        <span className="text-emerald-400">Bay: {amb.assignedBay}</span>
                        <span className="text-slate-600">|</span>
                        <span className="text-amber-400">ETA: {amb.etaMinutes}m</span>
                      </div>
                      <span className="text-[10px] font-bold font-mono text-red-400 bg-red-500/15 px-2 py-0.5 rounded-md border border-red-500/25">
                        {amb.severity}
                      </span>
                    </div>
                    {/* ETA progress */}
                    <div className="h-1 bg-white/8 rounded-full overflow-hidden mt-2">
                      <motion.div
                        className="h-full bg-gradient-to-r from-red-500 to-amber-500 rounded-full"
                        initial={{ width: '10%' }}
                        animate={{ width: `${100 - (amb.etaMinutes / 20) * 100}%` }}
                        transition={{ duration: amb.etaMinutes * 60, ease: 'linear' }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Department Quick Status */}
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.18 }}
              className="rounded-2xl bg-[#0d0f16] border border-white/8 shadow-xl">
              <div className="px-5 py-4 border-b border-white/6">
                <h3 className="font-semibold text-sm text-slate-200">Department Status</h3>
              </div>
              <div className="p-4 space-y-2">
                {[
                  { dept: 'Cardiology / Cath Lab', status: 'ON STANDBY', ready: true },
                  { dept: 'Radiology (CT/MRI)', status: 'READY',      ready: true  },
                  { dept: 'General Surgery',      status: 'READY',      ready: true  },
                  { dept: 'Blood Bank',           status: 'LOW STOCK',  ready: false },
                  { dept: 'Pharmacy',             status: 'OPERATIONAL',ready: true  },
                ].map(({ dept, status, ready }) => (
                  <div key={dept} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-xs text-slate-300">{dept}</span>
                    <span className={`text-[10px] font-bold font-mono ${ready ? 'text-emerald-400' : 'text-red-400'}`}>{status}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
