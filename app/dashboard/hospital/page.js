'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getStoredUser, MOCK_PROFILES, clearStoredUser } from '@/lib/auth';

export default function HospitalDashboard() {
  const [user, setUser] = useState(MOCK_PROFILES.hospital);
  const [dataSource, setDataSource] = useState('connecting...');

  const [capacity, setCapacity] = useState({
    icuTotal: 20,
    icuFree: 3,
    erBedsTotal: 45,
    erBedsFree: 8,
    ventilatorsTotal: 15,
    ventilatorsFree: 2,
    traumaBaysTotal: 6,
    traumaBaysFree: 1,
  });

  const [erStatus, setErStatus] = useState('NORMAL_INTAKE');
  const [incomingAmbulances, setIncomingAmbulances] = useState([
    {
      unit: 'Ambulance Unit 102',
      caseId: 'CAS-9921',
      patientName: 'Ramesh Verma (54M)',
      condition: 'Acute STEMI / Severe Dyspnea',
      severity: 'RED',
      etaMinutes: 7,
      assignedBay: 'Trauma Bay 2',
      status: 'EN ROUTE'
    },
    {
      unit: 'Ambulance Unit 205',
      caseId: 'CAS-9944',
      patientName: 'Pooja Nair (31F)',
      condition: 'Multiple Trauma / Road Incident',
      severity: 'RED',
      etaMinutes: 14,
      assignedBay: 'Trauma Bay 1',
      status: 'EN ROUTE'
    }
  ]);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored && stored.role === 'hospital') {
      setUser(stored);
    }

    async function loadHospitalMongo() {
      try {
        const res = await fetch('/api/hospital');
        const data = await res.json();
        if (data.success && data.hospital) {
          if (data.hospital.capacity) setCapacity(data.hospital.capacity);
          if (data.hospital.erStatus) setErStatus(data.hospital.erStatus);
          setDataSource(data.source === 'mongodb' ? 'MongoDB Real-Time' : 'Local Cache');
        }
        if (data.success && data.incomingAmbulances) {
          setIncomingAmbulances(data.incomingAmbulances);
        }
      } catch (err) {
        console.error('Failed to load MongoDB hospital data:', err);
      }
    }
    loadHospitalMongo();
  }, []);

  async function adjustBed(key, delta) {
    const updatedCapacity = {
      ...capacity,
      [key]: Math.max(0, Math.min(capacity[key + 'Total'] || 99, capacity[key] + delta))
    };
    setCapacity(updatedCapacity);

    // Sync capacity update to MongoDB via API
    try {
      await fetch('/api/hospital', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capacity: updatedCapacity, erStatus })
      });
    } catch (e) {
      console.error('Error updating capacity in MongoDB:', e);
    }
  }

  async function handleToggleStatus() {
    const nextStatus = erStatus === 'NORMAL_INTAKE' ? 'DIVERSION' : 'NORMAL_INTAKE';
    setErStatus(nextStatus);
    try {
      await fetch('/api/hospital', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capacity, erStatus: nextStatus })
      });
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 font-sans p-4 md:p-8">
      {/* Top Header */}
      <header className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10 mb-8">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-lg group-hover:scale-105 transition-transform">
              🏥
            </div>
            <div>
              <span className="font-display font-bold text-lg text-slate-100 tracking-tight flex items-center gap-2">
                SANJEEVANI <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-mono">HOSPITAL ER COMMAND</span>
              </span>
              <p className="text-[12px] text-slate-400">Resource Capacity & Emergency Intake Console</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-mono flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>DB Sync: {dataSource}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs">
            <span className="text-slate-400">Facility:</span> <strong className="text-emerald-400">{user.name}</strong>
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
        
        {/* Left Column: Real-time Bed & Resource Management */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Facility Operational Status */}
          <div className="rounded-2xl bg-[#0f1118] border border-emerald-500/30 p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-400 uppercase font-mono block">EMERGENCY DEPARTMENT INTAKE STATUS</span>
              <h2 className="font-display text-lg font-bold text-slate-100 flex items-center gap-2 mt-0.5">
                <span className={`h-3 w-3 rounded-full ${erStatus === 'NORMAL_INTAKE' ? 'bg-emerald-400 animate-ping' : 'bg-red-500 animate-ping'}`} />
                {erStatus === 'NORMAL_INTAKE' ? 'ACCEPTING ALL TRIAGE LEVELS (LEVEL 1 TRAUMA)' : 'DIVERSION ACTIVE - CRITICAL ICU FULL'}
              </h2>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleToggleStatus}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  erStatus === 'NORMAL_INTAKE'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                }`}
              >
                Toggle {erStatus === 'NORMAL_INTAKE' ? 'Diversion Mode' : 'Normal Intake'}
              </button>
            </div>
          </div>

          {/* Real-time Bed Occupancy Grid */}
          <div className="rounded-2xl bg-[#0f1118] border border-white/10 p-6 shadow-xl space-y-4">
            <h3 className="font-display font-semibold text-slate-200 flex items-center justify-between">
              <span>REAL-TIME BED & CRITICAL CAPACITY</span>
              <span className="text-xs text-emerald-400 font-mono">Synced to MongoDB</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* ICU Beds */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-medium">ICU Beds</span>
                  <span className="text-xs text-slate-400 font-mono">{capacity.icuFree} / {capacity.icuTotal} Free</span>
                </div>
                <div className="text-2xl font-bold text-emerald-400 font-mono">{capacity.icuFree} Available</div>
                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                  <button onClick={() => adjustBed('icuFree', -1)} className="px-2 py-1 bg-white/10 rounded hover:bg-white/20">- Occupy</button>
                  <button onClick={() => adjustBed('icuFree', 1)} className="px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded hover:bg-emerald-500/30">+ Discharge</button>
                </div>
              </div>

              {/* ER Emergency Beds */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-medium">ER Ward Beds</span>
                  <span className="text-xs text-slate-400 font-mono">{capacity.erBedsFree} / {capacity.erBedsTotal} Free</span>
                </div>
                <div className="text-2xl font-bold text-sky-400 font-mono">{capacity.erBedsFree} Available</div>
                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                  <button onClick={() => adjustBed('erBedsFree', -1)} className="px-2 py-1 bg-white/10 rounded hover:bg-white/20">- Occupy</button>
                  <button onClick={() => adjustBed('erBedsFree', 1)} className="px-2 py-1 bg-sky-500/20 text-sky-300 rounded hover:bg-sky-500/30">+ Discharge</button>
                </div>
              </div>

              {/* Ventilators */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-medium">Ventilator Units</span>
                  <span className="text-xs text-slate-400 font-mono">{capacity.ventilatorsFree} / {capacity.ventilatorsTotal} Free</span>
                </div>
                <div className="text-2xl font-bold text-amber-400 font-mono">{capacity.ventilatorsFree} Available</div>
                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                  <button onClick={() => adjustBed('ventilatorsFree', -1)} className="px-2 py-1 bg-white/10 rounded hover:bg-white/20">- Occupy</button>
                  <button onClick={() => adjustBed('ventilatorsFree', 1)} className="px-2 py-1 bg-amber-500/20 text-amber-300 rounded hover:bg-amber-500/30">+ Discharge</button>
                </div>
              </div>

              {/* Trauma Bays */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-medium">Trauma Resuscitation Bays</span>
                  <span className="text-xs text-slate-400 font-mono">{capacity.traumaBaysFree} / {capacity.traumaBaysTotal} Free</span>
                </div>
                <div className="text-2xl font-bold text-red-400 font-mono">{capacity.traumaBaysFree} Available</div>
                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                  <button onClick={() => adjustBed('traumaBaysFree', -1)} className="px-2 py-1 bg-white/10 rounded hover:bg-white/20">- Occupy</button>
                  <button onClick={() => adjustBed('traumaBaysFree', 1)} className="px-2 py-1 bg-red-500/20 text-red-300 rounded hover:bg-red-500/30">+ Release</button>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Right Column: Incoming Ambulance Dispatch Board */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="rounded-2xl bg-[#0f1118] border border-red-500/30 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-sm text-red-400 flex items-center gap-2">
                <span>🚑 INCOMING AMBULANCE DISPATCHES</span>
              </h3>
              <span className="animate-pulse h-2 w-2 rounded-full bg-red-500" />
            </div>

            <div className="space-y-4">
              {incomingAmbulances.map((amb, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-200 font-mono">{amb.unit || amb.caseId}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-red-500/20 text-red-400 border border-red-500/30">
                      ETA {amb.etaMinutes || 7}m
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-slate-100">{amb.patientName}</h4>
                    <p className="text-xs text-amber-400 mt-0.5">{amb.condition}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
