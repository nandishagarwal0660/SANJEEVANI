'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { getStoredUser, MOCK_PROFILES, clearStoredUser } from '@/lib/auth';

export default function AmbulanceDashboard() {
  const [user, setUser] = useState(MOCK_PROFILES.ambulance);
  const [dataSource, setDataSource] = useState('connecting...');
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

  // Fetch initial data from MongoDB API
  useEffect(() => {
    const stored = getStoredUser();
    if (stored && stored.role === 'ambulance') {
      setUser(stored);
    }

    async function loadMongoData() {
      try {
        const res = await fetch('/api/ambulance');
        const data = await res.json();
        if (data.success && data.dispatches && data.dispatches.length > 0) {
          setActiveCall(data.dispatches[0]);
          setDataSource(data.source === 'mongodb' ? 'MongoDB Real-Time' : 'Local Cache');
        }
      } catch (err) {
        console.error('Failed to load MongoDB ambulance data:', err);
      }
    }
    loadMongoData();
  }, []);

  // Simulate live vitals fluctuation & sync to MongoDB
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCall((prev) => {
        const newHr = prev.vitals.hr + Math.floor(Math.random() * 5) - 2;
        const newSpo2 = Math.min(100, Math.max(80, prev.vitals.spo2 + (Math.random() > 0.5 ? 1 : -1)));
        const updatedVitals = {
          ...prev.vitals,
          hr: newHr,
          spo2: newSpo2
        };

        // Sync vitals to MongoDB via API
        fetch('/api/ambulance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ caseId: prev.caseId, vitals: updatedVitals })
        }).catch((e) => console.error(e));

        return { ...prev, vitals: updatedVitals };
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  async function handleSendEmergencyAlert() {
    setErAlertSent(true);
    try {
      await fetch('/api/ambulance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId: activeCall.caseId, erNotified: true, status: 'TRAUMA_ALERT_SENT' })
      });
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => setErAlertSent(false), 4000);
  }

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 font-sans p-4 md:p-8">
      {/* Top Navbar */}
      <header className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10 mb-8">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-10 w-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 font-bold text-lg group-hover:scale-105 transition-transform">
              🚑
            </div>
            <div>
              <span className="font-display font-bold text-lg text-slate-100 tracking-tight flex items-center gap-2">
                SANJEEVANI <span className="text-[11px] px-2 py-0.5 rounded-md bg-red-500/20 border border-red-500/30 text-red-400 font-mono">AMBULANCE CONSOLE</span>
              </span>
              <p className="text-[12px] text-slate-400">Emergency Medical Dispatch & Live Telemetry</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-mono flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>DB Sync: {dataSource}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs">
            <span className="text-slate-400">Unit ID:</span> <strong className="text-red-400">{user.id}</strong> ({user.driver})
          </div>
          <Link
            href="/"
            onClick={() => clearStoredUser()}
            className="px-3 py-1.5 text-xs rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors"
          >
            Switch Role / Logout
          </Link>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Active SOS Dispatch (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Active Call Card */}
          <div className="rounded-2xl bg-[#0f1118] border border-red-500/30 p-6 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-red-500 via-amber-500 to-red-500 animate-pulse" />

            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span className="font-mono text-xs font-semibold text-red-400 uppercase tracking-widest">
                  CRITICAL DISPATCH ACTIVE • {activeCall.caseId}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                  ACUITY SCORE: {activeCall.acuityScore}/100 (HIGH SEVERITY)
                </span>
              </div>
            </div>

            {/* Patient Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/5 mb-6">
              <div>
                <p className="text-[11px] text-slate-400 uppercase font-mono">Patient Name</p>
                <p className="font-semibold text-slate-100 text-base">{activeCall.patientName}</p>
                <p className="text-xs text-slate-400">{activeCall.age} yrs • {activeCall.gender}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 uppercase font-mono">Reported Symptom</p>
                <p className="font-semibold text-amber-300 text-base">{activeCall.condition}</p>
                <p className="text-xs text-slate-400">Suspected Acute Coronary Syndrome</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 uppercase font-mono">Destination ER</p>
                <p className="font-semibold text-emerald-400 text-base">{activeCall.destination}</p>
                <p className="text-xs text-emerald-300/80 font-mono">ETA: {activeCall.etaMinutes} mins remaining</p>
              </div>
            </div>

            {/* Live Telemetry Vitals Display */}
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center justify-between">
              <span>LIVE PARAMEDIC TELEMETRY</span>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" /> STREAMING TO MONGO & ER
              </span>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {/* HR */}
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <div className="flex items-center justify-between text-xs text-red-300 mb-1">
                  <span>Heart Rate</span>
                  <span>BPM</span>
                </div>
                <div className="text-3xl font-bold text-red-400 font-mono">{activeCall.vitals.hr}</div>
                <div className="text-[11px] text-red-400/80 mt-1">Tachycardia Warning</div>
              </div>

              {/* BP */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center justify-between text-xs text-amber-300 mb-1">
                  <span>Blood Pressure</span>
                  <span>mmHg</span>
                </div>
                <div className="text-3xl font-bold text-amber-400 font-mono">{activeCall.vitals.bp}</div>
                <div className="text-[11px] text-amber-400/80 mt-1">Elevated Systolic</div>
              </div>

              {/* SpO2 */}
              <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/20">
                <div className="flex items-center justify-between text-xs text-sky-300 mb-1">
                  <span>Oxygen SpO2</span>
                  <span>%</span>
                </div>
                <div className="text-3xl font-bold text-sky-400 font-mono">{activeCall.vitals.spo2}%</div>
                <div className="text-[11px] text-sky-400/80 mt-1">Supplemental O2 On</div>
              </div>

              {/* Temp */}
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <div className="flex items-center justify-between text-xs text-purple-300 mb-1">
                  <span>Body Temp</span>
                  <span>°C</span>
                </div>
                <div className="text-3xl font-bold text-purple-400 font-mono">{activeCall.vitals.temp}</div>
                <div className="text-[11px] text-purple-400/80 mt-1">Normothermic</div>
              </div>
            </div>

            {/* Quick Action Controls */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={handleSendEmergencyAlert}
                className="flex-1 min-w-[200px] py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 font-semibold text-sm text-white transition-all shadow-lg shadow-red-600/30 flex items-center justify-center gap-2"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                Broadcast ER Pre-Arrival Trauma Alert
              </button>

              <button
                onClick={() => alert("Calling Apex City Hospital ER Trauma Line (+91 1800-419-8080)...")}
                className="py-3 px-5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 font-semibold text-sm text-slate-200 transition-all flex items-center gap-2"
              >
                📞 Call ER Desk Direct
              </button>
            </div>

            {erAlertSent && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs text-center font-mono"
              >
                ✓ PRE-ARRIVAL TRAUMA ALERT TRANSMITTED TO MONGODB & APEX CITY ER
              </motion.div>
            )}

          </div>

          {/* Route & Navigation Simulator */}
          <div className="rounded-2xl bg-[#0f1118] border border-white/10 p-6 shadow-xl">
            <h3 className="font-display font-semibold text-slate-200 mb-4 flex items-center justify-between">
              <span>LIVE GPS NAVIGATION & TRAFFIC CORRIDOR</span>
              <span className="text-xs text-sky-400 font-mono">Green Wave Signal: ACTIVE</span>
            </h3>

            <div className="relative h-48 rounded-xl bg-[#08090d] border border-white/5 overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
              
              <div className="relative z-10 flex flex-col items-center gap-3 text-center p-4">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="h-10 w-10 rounded-full bg-red-500/20 border border-red-500 text-red-400 flex items-center justify-center font-bold">
                      🚑
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">Unit 102</span>
                  </div>

                  <div className="w-40 md:w-64 h-1.5 bg-slate-800 rounded-full relative overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400"
                      initial={{ width: '20%' }}
                      animate={{ width: '75%' }}
                      transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>

                  <div className="text-center">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 flex items-center justify-center font-bold">
                      🏥
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">Apex ER</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-300 font-mono mt-2 bg-white/5 px-4 py-2 rounded-lg border border-white/10">
                  <span>Distance: 3.4 km</span>
                  <span>•</span>
                  <span>Speed: 68 km/h</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-semibold">Priority Traffic Signal Clearance</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Hospital ER Availability */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="rounded-2xl bg-[#0f1118] border border-white/10 p-6 shadow-xl">
            <h3 className="font-display font-semibold text-slate-200 mb-4 flex items-center justify-between">
              <span>RECEIVING HOSPITALS</span>
              <span className="text-xs text-slate-400">Live Status</span>
            </h3>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-xs text-emerald-300">Apex City Emergency Hospital</h4>
                  <p className="text-[11px] text-slate-400">ICU Beds: 3 Free • Cath Lab: Ready</p>
                </div>
                <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">
                  ACCEPTED
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-xs text-slate-200">Metro Heart & Trauma Center</h4>
                  <p className="text-[11px] text-slate-400">ICU Beds: 1 Free • ER: Standby</p>
                </div>
                <span className="px-2 py-1 rounded bg-white/10 text-slate-400 font-mono text-[10px]">
                  AVAILABLE
                </span>
              </div>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
