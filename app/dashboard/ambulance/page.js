'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { getStoredUser, MOCK_PROFILES, clearStoredUser } from '@/lib/auth';

const VITALS_THRESHOLDS = {
  hr: { danger: 120, warning: 100 },
  spo2: { danger: 90, warning: 94 },
};

function VitalCard({ label, unit, value, subtext, colorClass, bgClass, borderClass, icon }) {
  const [flash, setFlash] = useState(false);
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current !== value) {
      setFlash(true);
      prev.current = value;
      const t = setTimeout(() => setFlash(false), 600);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <div className={`relative rounded-2xl p-4 border ${bgClass} ${borderClass} overflow-hidden group hover-lift`}>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.03), transparent 70%)' }} />
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[11px] font-mono font-semibold uppercase tracking-wider ${colorClass}`}>{label}</span>
        <span className={`text-[10px] font-mono ${colorClass} opacity-70`}>{unit}</span>
      </div>
      <div className={`vital-number font-mono font-bold transition-colors duration-300 ${flash ? 'text-white' : colorClass}`}>
        {value}
      </div>
      <div className={`text-[11px] mt-1 ${colorClass} opacity-70`}>{subtext}</div>
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${borderClass} opacity-60`} />
    </div>
  );
}

function StatusDot({ active }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      {active && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />}
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${active ? 'bg-red-500' : 'bg-slate-500'}`} />
    </span>
  );
}

export default function AmbulanceDashboard() {
  const [user, setUser] = useState(MOCK_PROFILES.ambulance);
  const [dataSource, setDataSource] = useState('connecting...');
  const [dbConnected, setDbConnected] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeCall, setActiveCall] = useState({
    caseId: 'CAS-9921',
    patientName: 'Ramesh Verma',
    age: 54,
    gender: 'Male',
    condition: 'Acute Chest Pain & Severe Dyspnea',
    acuityScore: 92,
    severity: 'RED',
    vitals: { hr: 124, bp: '165/100', spo2: 89, temp: '37.8°C' },
    destination: 'Apex City Emergency & Trauma Center',
    etaMinutes: 7,
    status: 'EN ROUTE',
    erNotified: true,
  });
  const [erAlertSent, setErAlertSent] = useState(false);
  const [alertLog, setAlertLog] = useState([
    { time: '14:32', msg: 'Dispatch assigned — Unit 102', type: 'info' },
    { time: '14:34', msg: 'Patient contact: Ramesh Verma (54M)', type: 'info' },
    { time: '14:36', msg: 'Critical HR detected — 124 BPM', type: 'warn' },
    { time: '14:38', msg: 'SpO₂ below 90% — O₂ administered', type: 'danger' },
  ]);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored && stored.role === 'ambulance') setUser(stored);

    async function loadMongoData() {
      try {
        const res = await fetch('/api/ambulance');
        const data = await res.json();
        if (data.success && data.dispatches && data.dispatches.length > 0) {
          setActiveCall(data.dispatches[0]);
          const isLive = data.source === 'mongodb';
          setDataSource(isLive ? 'MongoDB Real-Time' : 'Local Cache');
          setDbConnected(isLive);
        }
      } catch (err) {
        setDataSource('Offline Mode');
      }
    }
    loadMongoData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCall((prev) => {
        const newHr = Math.max(60, Math.min(180, prev.vitals.hr + Math.floor(Math.random() * 7) - 3));
        const newSpo2 = Math.min(100, Math.max(80, prev.vitals.spo2 + (Math.random() > 0.5 ? 1 : -1)));
        const updatedVitals = { ...prev.vitals, hr: newHr, spo2: newSpo2 };

        fetch('/api/ambulance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ caseId: prev.caseId, vitals: updatedVitals }),
        }).catch(() => {});

        return { ...prev, vitals: updatedVitals };
      });
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  async function handleSendEmergencyAlert() {
    setErAlertSent(true);
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    setAlertLog((prev) => [{ time: now, msg: 'Pre-Arrival Trauma Alert transmitted to ER', type: 'success' }, ...prev]);
    try {
      await fetch('/api/ambulance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId: activeCall.caseId, erNotified: true, status: 'TRAUMA_ALERT_SENT' }),
      });
    } catch (e) {}
    setTimeout(() => setErAlertSent(false), 4000);
  }

  const hrDanger = activeCall.vitals.hr > VITALS_THRESHOLDS.hr.danger;
  const spo2Danger = activeCall.vitals.spo2 < VITALS_THRESHOLDS.spo2.danger;

  return (
    <div className="min-h-screen bg-[#07080c] text-slate-100" style={{ fontFamily: 'var(--font-body)' }}>
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-red-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-amber-500/4 rounded-full blur-[100px]" />
      </div>

      {/* Top Navbar */}
      <header className="relative z-30 border-b border-white/8 bg-[#07080c]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 font-bold text-base group-hover:scale-105 transition-transform shrink-0">
              🚑
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-slate-100 tracking-tight">SANJEEVANI</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-red-500/20 border border-red-500/30 text-red-400 font-mono">AMBULANCE</span>
              </div>
              <p className="text-[11px] text-slate-500">Emergency Medical Dispatch Console</p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* DB status */}
            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono ${dbConnected ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-400'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${dbConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span className="hidden md:inline">{dataSource}</span>
              <span className="md:hidden">DB</span>
            </div>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs">
              <span className="text-slate-400">Unit:</span>
              <strong className="text-red-400">{user.id}</strong>
            </div>

            <Link
              href="/"
              onClick={() => clearStoredUser()}
              className="px-3 py-1.5 text-xs rounded-lg bg-white/5 hover:bg-red-500/15 border border-white/10 hover:border-red-500/30 text-slate-300 hover:text-red-300 transition-all"
            >
              <span className="hidden sm:inline">Switch Role / </span>Logout
            </Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Left: Active Dispatch ── (8 cols) */}
        <div className="lg:col-span-8 space-y-5">

          {/* Active Call Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-[#0d0f16] border border-red-500/30 overflow-hidden shadow-2xl shadow-red-500/5"
          >
            {/* Top accent bar */}
            <div className="h-1 w-full gradient-border-anim" />

            <div className="p-5 sm:p-6">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                  <StatusDot active={true} />
                  <span className="font-mono text-xs font-bold text-red-400 uppercase tracking-widest">
                    CRITICAL DISPATCH • {activeCall.caseId}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${hrDanger || spo2Danger ? 'bg-red-500/25 text-red-300 border-red-500/40 alert-pulse' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                    ACUITY: {activeCall.acuityScore}/100
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-600/20 text-red-300 border border-red-500/30 font-mono">
                    {activeCall.severity}
                  </span>
                </div>
              </div>

              {/* Patient Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/6 mb-5">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-mono mb-1">Patient</p>
                  <p className="font-semibold text-slate-100 text-sm">{activeCall.patientName}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{activeCall.age} yrs · {activeCall.gender}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-mono mb-1">Chief Complaint</p>
                  <p className="font-semibold text-amber-300 text-sm leading-snug">{activeCall.condition}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Suspected ACS</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-mono mb-1">Destination ER</p>
                  <p className="font-semibold text-emerald-400 text-sm leading-snug">{activeCall.destination}</p>
                  <p className="text-[11px] text-emerald-300/80 font-mono mt-0.5">ETA: {activeCall.etaMinutes} min</p>
                </div>
              </div>

              {/* Telemetry Header */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#34C98E" strokeWidth="2.5">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                  Live Paramedic Telemetry
                </h3>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  STREAMING LIVE
                </span>
              </div>

              {/* Vitals Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <VitalCard
                  label="Heart Rate" unit="BPM" value={activeCall.vitals.hr}
                  subtext={hrDanger ? '⚠ Tachycardia' : 'Elevated'}
                  colorClass={hrDanger ? 'text-red-400' : 'text-red-300'}
                  bgClass={hrDanger ? 'bg-red-500/15' : 'bg-red-500/8'}
                  borderClass={hrDanger ? 'border-red-500/40' : 'border-red-500/20'}
                />
                <VitalCard
                  label="Blood Pressure" unit="mmHg" value={activeCall.vitals.bp}
                  subtext="Elevated Systolic"
                  colorClass="text-amber-400" bgClass="bg-amber-500/8" borderClass="border-amber-500/20"
                />
                <VitalCard
                  label="SpO₂" unit="%" value={`${activeCall.vitals.spo2}%`}
                  subtext={spo2Danger ? '⚠ O₂ Administered' : 'O₂ On'}
                  colorClass={spo2Danger ? 'text-sky-300' : 'text-sky-400'}
                  bgClass={spo2Danger ? 'bg-sky-500/15' : 'bg-sky-500/8'}
                  borderClass={spo2Danger ? 'border-sky-500/40' : 'border-sky-500/20'}
                />
                <VitalCard
                  label="Body Temp" unit="°C" value={activeCall.vitals.temp}
                  subtext="Normothermic"
                  colorClass="text-purple-400" bgClass="bg-purple-500/8" borderClass="border-purple-500/20"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleSendEmergencyAlert}
                  className="flex-1 min-w-[180px] py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 font-semibold text-sm text-white transition-all shadow-lg shadow-red-600/25 flex items-center justify-center gap-2 btn-press"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  Broadcast Pre-Arrival Alert
                </button>
                <button
                  onClick={() => alert('Calling Apex City Hospital ER Trauma Line...')}
                  className="py-2.5 px-4 rounded-xl bg-white/8 hover:bg-white/12 border border-white/15 font-semibold text-sm text-slate-200 transition-all flex items-center gap-2 btn-press"
                >
                  📞 Call ER Direct
                </button>
              </div>

              <AnimatePresence>
                {erAlertSent && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-xs text-center font-mono"
                  >
                    ✓ PRE-ARRIVAL TRAUMA ALERT TRANSMITTED TO ER
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Route Navigator */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-[#0d0f16] border border-white/8 overflow-hidden shadow-xl"
          >
            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm text-slate-200 flex items-center gap-2">
                  🗺️ Live GPS Corridor
                </h3>
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">
                  Green Wave: ACTIVE
                </span>
              </div>

              <div className="relative h-40 rounded-xl bg-[#08090d] border border-white/5 overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:18px_18px] opacity-30" />
                <div className="relative z-10 flex flex-col items-center gap-4 px-6 w-full">
                  <div className="flex items-center w-full max-w-sm mx-auto gap-4">
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className="h-10 w-10 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center text-lg">🚑</div>
                      <span className="text-[10px] text-slate-400">Unit 102</span>
                    </div>
                    <div className="flex-1 relative h-2 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400 rounded-full"
                        initial={{ width: '15%' }}
                        animate={{ width: '80%' }}
                        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                      />
                    </div>
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className="h-10 w-10 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-lg">🏥</div>
                      <span className="text-[10px] text-slate-400">Apex ER</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-300 font-mono bg-white/5 px-4 py-2 rounded-lg border border-white/10 flex-wrap justify-center gap-y-1">
                    <span>Distance: 3.4 km</span>
                    <span className="text-slate-600">|</span>
                    <span>Speed: 68 km/h</span>
                    <span className="text-slate-600">|</span>
                    <span className="text-emerald-400 font-semibold">Signal Clearance Active</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Right: Sidebar ── (4 cols) */}
        <div className="lg:col-span-4 space-y-5">

          {/* Alert Log */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl bg-[#0d0f16] border border-white/8 overflow-hidden shadow-xl"
          >
            <div className="px-5 py-4 border-b border-white/6 flex items-center justify-between">
              <h3 className="font-semibold text-sm text-slate-200">Dispatch Log</h3>
              <span className="text-[10px] font-mono text-slate-500">{alertLog.length} events</span>
            </div>
            <div className="p-4 space-y-2 max-h-52 overflow-y-auto">
              {alertLog.map((log, i) => (
                <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-lg text-xs ${
                  log.type === 'danger' ? 'bg-red-500/10 border border-red-500/20' :
                  log.type === 'warn' ? 'bg-amber-500/10 border border-amber-500/20' :
                  log.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20' :
                  'bg-white/4 border border-white/8'
                }`}>
                  <span className="font-mono text-[10px] text-slate-500 shrink-0 mt-0.5">{log.time}</span>
                  <span className={`${
                    log.type === 'danger' ? 'text-red-300' :
                    log.type === 'warn' ? 'text-amber-300' :
                    log.type === 'success' ? 'text-emerald-300' : 'text-slate-300'
                  }`}>{log.msg}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Receiving Hospitals */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-[#0d0f16] border border-white/8 shadow-xl"
          >
            <div className="px-5 py-4 border-b border-white/6 flex items-center justify-between">
              <h3 className="font-semibold text-sm text-slate-200">Receiving Hospitals</h3>
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
              </span>
            </div>
            <div className="p-4 space-y-3">
              {[
                { name: 'Apex City Emergency', details: 'ICU: 3 Free · Cath Lab: Ready', status: 'ACCEPTED', color: 'emerald' },
                { name: 'Metro Heart & Trauma', details: 'ICU: 1 Free · ER: Standby', status: 'AVAILABLE', color: 'slate' },
                { name: 'City District Hospital', details: 'ICU: 0 Free · Divert', status: 'DIVERT', color: 'red' },
              ].map(({ name, details, status, color }) => (
                <div key={name}
                  className={`p-3.5 rounded-xl flex items-center justify-between gap-2 hover-lift cursor-default transition-all ${
                    color === 'emerald' ? 'bg-emerald-500/8 border border-emerald-500/20' :
                    color === 'red' ? 'bg-red-500/8 border border-red-500/20' :
                    'bg-white/4 border border-white/8'
                  }`}
                >
                  <div className="min-w-0">
                    <h4 className={`font-semibold text-xs truncate ${
                      color === 'emerald' ? 'text-emerald-300' :
                      color === 'red' ? 'text-red-300' : 'text-slate-200'
                    }`}>{name}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">{details}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-md font-mono text-[10px] font-bold shrink-0 ${
                    color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' :
                    color === 'red' ? 'bg-red-500/20 text-red-400' :
                    'bg-white/10 text-slate-400'
                  }`}>{status}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Unit Status */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-2xl bg-[#0d0f16] border border-white/8 shadow-xl p-5"
          >
            <h3 className="font-semibold text-sm text-slate-200 mb-3">Unit Status</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Status', value: 'EN ROUTE', color: 'text-amber-400' },
                { label: 'Driver', value: user.driver || 'Rajesh Kumar', color: 'text-slate-100' },
                { label: 'Paramedic', value: user.paramedic || 'Dr. Priya S.', color: 'text-slate-100' },
                { label: 'Fuel', value: '74%', color: 'text-emerald-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white/4 border border-white/8 rounded-xl p-3">
                  <p className="text-[10px] text-slate-500 font-mono uppercase mb-0.5">{label}</p>
                  <p className={`text-xs font-semibold ${color}`}>{value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
