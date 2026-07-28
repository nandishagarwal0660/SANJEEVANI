'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { getStoredUser, MOCK_PROFILES, clearStoredUser } from '@/lib/auth';

export default function DoctorDashboard() {
  const [user, setUser] = useState(MOCK_PROFILES.doctor);
  const [dataSource, setDataSource] = useState('connecting...');
  const [patientQueue, setPatientQueue] = useState([
    {
      patientId: 'PAT-9012',
      name: 'Ramesh Verma',
      age: 54,
      gender: 'Male',
      severity: 'RED',
      acuityScore: 92,
      chiefComplaint: 'Acute crushing chest pain radiating to left jaw & breathlessness',
      vitalSummary: 'HR 124, BP 165/100, SpO2 89%',
      redFlags: ['ST Elevation Suspected', 'Hypoxia', 'Diaphoresis'],
      differential: [
        { disease: 'Acute Myocardial Infarction (ICD-10 I21.9)', prob: '88%' },
        { disease: 'Aortic Dissection (ICD-10 I71.0)', prob: '7%' },
        { disease: 'Pulmonary Embolism (ICD-10 I26.9)', prob: '5%' }
      ],
      recommendedLabs: ['12-Lead ECG Immediately', 'Troponin-I Stat', 'Chest X-Ray Portable', 'D-Dimer'],
      recommendedCare: 'Emergency Angiography / Cath Lab Activation',
      location: 'En route in Ambulance Unit 102 (ETA 7m)',
      language: 'Hindi / English',
      doctorNotes: ''
    },
    {
      patientId: 'PAT-8841',
      name: 'Sunita Devi',
      age: 42,
      gender: 'Female',
      severity: 'ORANGE',
      acuityScore: 78,
      chiefComplaint: 'Sudden onset severe right lower quadrant abdominal pain with fever',
      vitalSummary: 'HR 98, BP 130/85, Temp 38.6°C',
      redFlags: ['Rebound Tenderness', 'High Grade Fever', 'Leukocytosis Suspected'],
      differential: [
        { disease: 'Acute Appendicitis (ICD-10 K35.8)', prob: '82%' },
        { disease: 'Ovarian Cyst Rupture (ICD-10 N83.2)', prob: '12%' },
        { disease: 'Gastroenteritis (ICD-10 A09)', prob: '6%' }
      ],
      recommendedLabs: ['Abdominal Ultrasound Stat', 'CBC with Differential', 'CRP'],
      recommendedCare: 'Surgical Consult & IV Antibiotic Triage',
      location: 'ER Waiting Bay 4',
      language: 'Hindi',
      doctorNotes: ''
    }
  ]);

  const [selectedPatient, setSelectedPatient] = useState(0);
  const [showTelehealthModal, setShowTelehealthModal] = useState(false);
  const [rxNotes, setRxNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored && stored.role === 'doctor') {
      setUser(stored);
    }

    async function loadMongoPatients() {
      try {
        const res = await fetch('/api/doctor');
        const data = await res.json();
        if (data.success && data.patients && data.patients.length > 0) {
          setPatientQueue(data.patients);
          setDataSource(data.source === 'mongodb' ? 'MongoDB Real-Time' : 'Local Cache');
          if (data.patients[0].doctorNotes) {
            setRxNotes(data.patients[0].doctorNotes);
          }
        }
      } catch (err) {
        console.error('Failed to load MongoDB patients:', err);
      }
    }
    loadMongoPatients();
  }, []);

  const patient = patientQueue[selectedPatient] || patientQueue[0];

  async function handleSaveNotes() {
    try {
      await fetch('/api/doctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: patient.patientId, doctorNotes: rxNotes })
      });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save notes to MongoDB:', err);
    }
  }

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 font-sans p-4 md:p-8">
      {/* Header */}
      <header className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10 mb-8">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-10 w-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold text-lg group-hover:scale-105 transition-transform">
              👨‍⚕️
            </div>
            <div>
              <span className="font-display font-bold text-lg text-slate-100 tracking-tight flex items-center gap-2">
                SANJEEVANI <span className="text-[11px] px-2 py-0.5 rounded-md bg-blue-500/20 border border-blue-500/30 text-blue-400 font-mono">CLINICAL DOCTOR CONSOLE</span>
              </span>
              <p className="text-[12px] text-slate-400">MedGemma 27B AI Triage & Teleconsultation</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-mono flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>DB Sync: {dataSource}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs">
            <span className="text-slate-400">Physician:</span> <strong className="text-blue-400">{user.name}</strong> ({user.specialty})
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

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Triage Patient Queue */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-display font-bold text-sm text-slate-200">PRIORITIZED TRIAGE QUEUE</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-mono font-bold">
              {patientQueue.length} PATIENTS
            </span>
          </div>

          <div className="space-y-3">
            {patientQueue.map((p, idx) => (
              <button
                key={p.patientId || idx}
                onClick={() => {
                  setSelectedPatient(idx);
                  setRxNotes(p.doctorNotes || '');
                }}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedPatient === idx
                    ? 'bg-blue-600/15 border-blue-500 shadow-lg shadow-blue-500/10'
                    : 'bg-[#0f1118] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                    p.severity === 'RED' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    p.severity === 'ORANGE' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }`}>
                    {p.severity} • ACUITY {p.acuityScore}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">{p.patientId}</span>
                </div>

                <h4 className="font-semibold text-slate-100 text-sm">{p.name}</h4>
                <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{p.chiefComplaint}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: MedGemma Case Analysis & Clinical Workspace */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Patient Overview Header Card */}
          <div className="rounded-2xl bg-[#0f1118] border border-white/10 p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="font-display text-xl font-bold text-slate-100">{patient.name}</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                    patient.severity === 'RED' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    patient.severity === 'ORANGE' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }`}>
                    TRIAGE LEVEL: {patient.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Patient ID: <span className="font-mono text-slate-300">{patient.patientId}</span> • {patient.age} years old • {patient.gender}
                </p>
              </div>

              <button
                onClick={() => setShowTelehealthModal(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-xs text-white transition-all shadow-md shadow-blue-600/30 flex items-center gap-2"
              >
                📹 Launch Teleconsultation Call
              </button>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div>
                <span className="text-slate-400">Initial Vitals:</span>{' '}
                <strong className="text-emerald-400 font-mono">{patient.vitalSummary}</strong>
              </div>
              <div>
                <span className="text-slate-400">Location:</span>{' '}
                <strong className="text-sky-300 font-mono">{patient.location}</strong>
              </div>
            </div>
          </div>

          {/* MedGemma AI Differential Diagnosis & Red Flags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="rounded-2xl bg-[#0f1118] border border-blue-500/20 p-5 shadow-xl">
              <h3 className="font-display text-xs font-bold text-blue-400 tracking-wider uppercase mb-4">
                🧠 MedGemma 27B AI Differential
              </h3>

              <div className="space-y-3">
                {patient.differential?.map((d, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-slate-200">{d.disease}</span>
                      <span className="font-mono text-xs text-emerald-400 font-bold">{d.prob}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: d.prob }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-[#0f1118] border border-amber-500/20 p-5 shadow-xl">
              <h3 className="font-display text-xs font-bold text-amber-400 tracking-wider uppercase mb-4">
                ⚠️ Clinical Red Flags & Orders
              </h3>

              <div className="space-y-4">
                <div>
                  <p className="text-[11px] text-slate-400 mb-1.5 uppercase font-mono">Detected Red Flags</p>
                  <div className="flex flex-wrap gap-2">
                    {patient.redFlags?.map((rf, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-medium">
                        • {rf}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] text-slate-400 mb-1.5 uppercase font-mono">Recommended STAT Lab / Imaging</p>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {patient.recommendedLabs?.map((lab, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="text-blue-400">✓</span> {lab}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

          </div>

          {/* Doctor Prescription & Clinical Notes Drawer */}
          <div className="rounded-2xl bg-[#0f1118] border border-white/10 p-6 shadow-xl">
            <h3 className="font-display font-semibold text-slate-200 mb-3 flex items-center justify-between">
              <span>DOCTOR CLINICAL IMPRESSION & RX NOTES</span>
              <span className="text-xs text-slate-400 font-mono">Save to MongoDB</span>
            </h3>

            <textarea
              value={rxNotes}
              onChange={(e) => setRxNotes(e.target.value)}
              placeholder={`Enter prescription notes or clinical orders for ${patient.name}...`}
              rows={4}
              className="w-full p-4 rounded-xl bg-[#08090d] border border-white/10 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono mb-4"
            />

            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-400">
                Signing Physician: <span className="text-slate-200 font-semibold">{user.name}</span>
              </div>

              <button
                onClick={handleSaveNotes}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-xs text-white transition-all shadow-md shadow-emerald-600/30"
              >
                Approve & Save to MongoDB
              </button>
            </div>

            {notesSaved && (
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-emerald-400 mt-3 text-right font-mono"
              >
                ✓ Clinical notes saved to MongoDB successfully.
              </motion.p>
            )}
          </div>

        </div>

      </main>
    </div>
  );
}
