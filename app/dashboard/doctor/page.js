'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { getStoredUser, MOCK_PROFILES, clearStoredUser } from '@/lib/auth';

const SEV_CONFIG = {
  RED:    { bg: 'bg-red-500/15',    border: 'border-red-500/35',    text: 'text-red-400',    dot: 'bg-red-500'    },
  ORANGE: { bg: 'bg-amber-500/15',  border: 'border-amber-500/35',  text: 'text-amber-400',  dot: 'bg-amber-500'  },
  YELLOW: { bg: 'bg-yellow-500/12', border: 'border-yellow-500/30', text: 'text-yellow-400', dot: 'bg-yellow-500' },
  GREEN:  { bg: 'bg-emerald-500/10',border: 'border-emerald-500/25',text: 'text-emerald-400',dot: 'bg-emerald-500'},
};

const MOCK_PATIENTS = [
  {
    patientId: 'PAT-9012',
    name: 'Ramesh Verma',
    age: 54,
    gender: 'Male',
    severity: 'RED',
    acuityScore: 92,
    chiefComplaint: 'Acute crushing chest pain radiating to left jaw & breathlessness',
    vitalSummary: 'HR 124 · BP 165/100 · SpO₂ 89%',
    redFlags: ['ST Elevation Suspected', 'Hypoxia', 'Diaphoresis'],
    differential: [
      { disease: 'Acute Myocardial Infarction (I21.9)', prob: 88 },
      { disease: 'Aortic Dissection (I71.0)', prob: 7 },
      { disease: 'Pulmonary Embolism (I26.9)', prob: 5 },
    ],
    recommendedLabs: ['12-Lead ECG Immediately', 'Troponin-I Stat', 'Chest X-Ray Portable', 'D-Dimer'],
    recommendedCare: 'Emergency Angiography / Cath Lab Activation',
    location: 'En route — Unit 102 (ETA 7 min)',
    language: 'Hindi / English',
    doctorNotes: '',
  },
  {
    patientId: 'PAT-8841',
    name: 'Sunita Devi',
    age: 42,
    gender: 'Female',
    severity: 'ORANGE',
    acuityScore: 78,
    chiefComplaint: 'Severe right lower quadrant abdominal pain with fever',
    vitalSummary: 'HR 98 · BP 130/85 · Temp 38.6°C',
    redFlags: ['Rebound Tenderness', 'High Grade Fever', 'Leukocytosis Suspected'],
    differential: [
      { disease: 'Acute Appendicitis (K35.8)', prob: 82 },
      { disease: 'Ovarian Cyst Rupture (N83.2)', prob: 12 },
      { disease: 'Gastroenteritis (A09)', prob: 6 },
    ],
    recommendedLabs: ['Abdominal Ultrasound Stat', 'CBC with Differential', 'CRP'],
    recommendedCare: 'Surgical Consult & IV Antibiotic Triage',
    location: 'ER Waiting Bay 4',
    language: 'Hindi',
    doctorNotes: '',
  },
  {
    patientId: 'PAT-7203',
    name: 'Anil Sharma',
    age: 67,
    gender: 'Male',
    severity: 'YELLOW',
    acuityScore: 60,
    chiefComplaint: 'Persistent high fever (104°F) with rigors for 3 days',
    vitalSummary: 'HR 102 · BP 118/76 · Temp 39.8°C',
    redFlags: ['High Fever > 3 days', 'Rigors', 'Elderly'],
    differential: [
      { disease: 'Malaria (B50.9)', prob: 65 },
      { disease: 'Typhoid Fever (A01.0)', prob: 25 },
      { disease: 'Dengue Fever (A90)', prob: 10 },
    ],
    recommendedLabs: ['Peripheral Blood Smear', 'Widal Test', 'NS1 Antigen (Dengue)'],
    recommendedCare: 'Antipyretics, IV fluids, Isolation protocol',
    location: 'OPD Room 3',
    language: 'Hindi',
    doctorNotes: '',
  },
];

export default function DoctorDashboard() {
  const [user, setUser] = useState(MOCK_PROFILES.doctor);
  const [dataSource, setDataSource] = useState('connecting...');
  const [dbConnected, setDbConnected] = useState(false);
  const [patientQueue, setPatientQueue] = useState(MOCK_PATIENTS);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [rxNotes, setRxNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);
  const [showTelehealthModal, setShowTelehealthModal] = useState(false);
  const [activeTab, setActiveTab] = useState('differential');

  useEffect(() => {
    const stored = getStoredUser();
    if (stored && stored.role === 'doctor') setUser(stored);

    async function loadData() {
      try {
        const res = await fetch('/api/doctor');
        const data = await res.json();
        if (data.success && data.patients && data.patients.length > 0) {
          setPatientQueue(data.patients);
          const isLive = data.source === 'mongodb';
          setDataSource(isLive ? 'MongoDB Real-Time' : 'Local Cache');
          setDbConnected(isLive);
          if (data.patients[0].doctorNotes) setRxNotes(data.patients[0].doctorNotes);
        }
      } catch {}
    }
    loadData();
  }, []);

  async function handleSaveNotes() {
    const patient = patientQueue[selectedIdx];
    try {
      await fetch('/api/doctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: patient.patientId, doctorNotes: rxNotes }),
      });
    } catch {}
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 3000);
  }

  const patient = patientQueue[selectedIdx];
  const sev = SEV_CONFIG[patient?.severity] || SEV_CONFIG.GREEN;

  return (
    <div className="min-h-screen bg-[#07080c] text-slate-100" style={{ fontFamily: 'var(--font-body)' }}>
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[350px] bg-blue-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 left-0 w-[400px] h-[300px] bg-emerald-500/4 rounded-full blur-[90px]" />
      </div>

      {/* Navbar */}
      <header className="relative z-30 border-b border-white/8 bg-[#07080c]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-xl group-hover:scale-105 transition-transform shrink-0">
              👨‍⚕️
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-slate-100 tracking-tight">SANJEEVANI</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/20 border border-blue-500/30 text-blue-400 font-mono">DOCTOR CONSOLE</span>
              </div>
              <p className="text-[11px] text-slate-500">{user.name} · {user.specialization}</p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono ${dbConnected ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-400'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${dbConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span className="hidden md:inline">{dataSource}</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs">
              <span className="text-slate-400">ID:</span>
              <strong className="text-blue-400">{user.id}</strong>
            </div>
            <Link href="/" onClick={() => clearStoredUser()}
              className="px-3 py-1.5 text-xs rounded-lg bg-white/5 hover:bg-blue-500/15 border border-white/10 hover:border-blue-500/30 text-slate-300 hover:text-blue-300 transition-all">
              <span className="hidden sm:inline">Switch / </span>Logout
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Left: Queue ── */}
        <div className="lg:col-span-4 space-y-4">
          {/* Summary Stats */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-3 gap-3">
            {[
              { label: 'Critical', value: patientQueue.filter(p => p.severity === 'RED').length, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
              { label: 'Pending', value: patientQueue.length, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
              { label: 'Today', value: 14, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`rounded-xl border p-3 text-center ${bg}`}>
                <p className={`text-xl font-bold font-mono ${color}`}>{value}</p>
                <p className="text-[10px] text-slate-500 font-mono uppercase mt-0.5">{label}</p>
              </div>
            ))}
          </motion.div>

          {/* Patient Queue */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="rounded-2xl bg-[#0d0f16] border border-white/8 overflow-hidden shadow-xl">
            <div className="px-4 py-3.5 border-b border-white/6 flex items-center justify-between">
              <h3 className="font-semibold text-sm text-slate-200">Patient Queue</h3>
              <span className="text-[10px] font-mono text-slate-500">{patientQueue.length} patients</span>
            </div>
            <div className="divide-y divide-white/5">
              {patientQueue.map((p, i) => {
                const s = SEV_CONFIG[p.severity] || SEV_CONFIG.GREEN;
                return (
                  <button
                    key={p.patientId}
                    onClick={() => { setSelectedIdx(i); setActiveTab('differential'); setRxNotes(p.doctorNotes || ''); }}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/4 transition-all ${selectedIdx === i ? 'bg-white/6' : ''}`}
                  >
                    <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${s.dot}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm text-slate-100 truncate">{p.name}</span>
                        <span className={`text-[10px] font-bold font-mono shrink-0 ${s.text}`}>{p.severity}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{p.chiefComplaint}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* ── Right: Patient Detail ── */}
        <div className="lg:col-span-8 space-y-5">
          {patient && (
            <>
              {/* Patient header card */}
              <motion.div
                key={patient.patientId}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                className={`rounded-2xl border overflow-hidden shadow-xl ${sev.bg} ${sev.border}`}
              >
                <div className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`h-2.5 w-2.5 rounded-full ${sev.dot}`} />
                        <span className={`font-mono text-xs font-bold ${sev.text} uppercase tracking-widest`}>
                          {patient.severity} — Acuity {patient.acuityScore}/100
                        </span>
                      </div>
                      <h2 className="font-bold text-xl text-slate-100">{patient.name}</h2>
                      <p className="text-sm text-slate-400 mt-0.5">{patient.age} yrs · {patient.gender} · {patient.patientId}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowTelehealthModal(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all btn-press shadow-lg shadow-blue-600/20"
                      >
                        📱 Telehealth
                      </button>
                    </div>
                  </div>

                  {/* Info row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-black/20 border border-white/6 mb-5">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-mono mb-0.5">Chief Complaint</p>
                      <p className={`text-sm font-semibold ${sev.text} leading-snug`}>{patient.chiefComplaint}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-mono mb-0.5">Vitals Summary</p>
                      <p className="text-sm text-slate-200 font-mono">{patient.vitalSummary}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-mono mb-0.5">Location</p>
                      <p className="text-sm text-slate-200">{patient.location}</p>
                    </div>
                  </div>

                  {/* Red Flags */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {patient.redFlags.map((flag) => (
                      <span key={flag} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                        {flag}
                      </span>
                    ))}
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-1 bg-white/4 border border-white/8 rounded-xl p-1 mb-5 overflow-x-auto">
                    {['differential', 'labs', 'treatment', 'notes'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                          activeTab === tab
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {tab === 'differential' ? 'Dx. Differential' :
                         tab === 'labs' ? 'Recommended Labs' :
                         tab === 'treatment' ? 'Treatment Plan' : 'Rx Notes'}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <AnimatePresence mode="wait">
                    {activeTab === 'differential' && (
                      <motion.div key="diff" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="space-y-2.5">
                        {patient.differential.map((dx) => (
                          <div key={dx.disease} className="flex items-center gap-3">
                            <div className="flex-1 relative">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-200 font-medium">{dx.disease}</span>
                                <span className={`font-mono font-bold ${dx.prob >= 80 ? 'text-red-400' : dx.prob >= 30 ? 'text-amber-400' : 'text-slate-400'}`}>
                                  {dx.prob}%
                                </span>
                              </div>
                              <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                                <motion.div
                                  className={`h-full rounded-full ${dx.prob >= 80 ? 'bg-red-500' : dx.prob >= 30 ? 'bg-amber-500' : 'bg-slate-500'}`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${dx.prob}%` }}
                                  transition={{ duration: 0.7, ease: 'easeOut' }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                    {activeTab === 'labs' && (
                      <motion.div key="labs" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {patient.recommendedLabs.map((lab) => (
                          <div key={lab} className="flex items-center gap-2.5 p-3 rounded-xl bg-white/4 border border-white/8">
                            <div className="h-6 w-6 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
                              </svg>
                            </div>
                            <span className="text-xs text-slate-200">{lab}</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                    {activeTab === 'treatment' && (
                      <motion.div key="treatment" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <div className="p-4 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-emerald-400">⚕</span>
                            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Recommended Treatment</span>
                          </div>
                          <p className="text-sm text-slate-100 font-semibold">{patient.recommendedCare}</p>
                        </div>
                      </motion.div>
                    )}
                    {activeTab === 'notes' && (
                      <motion.div key="notes" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <textarea
                          value={rxNotes}
                          onChange={(e) => setRxNotes(e.target.value)}
                          placeholder="Enter clinical notes, prescription, or follow-up plan..."
                          className="w-full h-36 rounded-xl bg-white/4 border border-white/10 focus:border-blue-500/50 text-sm text-slate-200 p-3.5 font-mono resize-none focus:outline-none transition-all"
                        />
                        <div className="flex items-center justify-between mt-3">
                          <button
                            onClick={handleSaveNotes}
                            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all btn-press"
                          >
                            Save Notes
                          </button>
                          {notesSaved && (
                            <span className="text-emerald-400 text-xs font-mono">✓ Saved to MongoDB</span>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </main>

      {/* Telehealth Modal */}
      <AnimatePresence>
        {showTelehealthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowTelehealthModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 32 }}
              className="bg-[#0f1117] border border-white/12 rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-bold text-lg text-slate-100 mb-1">Telehealth Session</h3>
              <p className="text-sm text-slate-400 mb-5">Connect to patient remotely</p>
              <div className="space-y-3">
                <a href="https://esanjeevani.mohfw.gov.in" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all">
                  <span className="text-lg">🏛</span>
                  <div>
                    <p className="font-semibold text-sm">eSanjeevani OPD (Govt.)</p>
                    <p className="text-xs text-blue-200">Official Ministry of Health Platform</p>
                  </div>
                </a>
              </div>
              <button onClick={() => setShowTelehealthModal(false)}
                className="mt-4 w-full py-2.5 rounded-xl border border-white/10 text-sm text-slate-400 hover:text-slate-200 transition-all">
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
