'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MOCK_PROFILES, setStoredUser } from '@/lib/auth';

export default function RoleAuthModal({ isOpen, onClose }) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState('ambulance'); // ambulance, doctor, hospital

  if (!isOpen) return null;

  function handleLogin(role) {
    const profile = MOCK_PROFILES[role];
    setStoredUser(profile);
    onClose();
    router.push(`/dashboard/${role}`);
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0f1118] p-6 shadow-2xl"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-blue-500 to-emerald-500" />

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-white/20 text-slate-100 font-bold text-lg">
                🩺
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-slate-100">Sanjeevani Portal Login</h2>
                <p className="text-xs text-slate-400">Select your emergency medical profile</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 text-sm font-mono p-1"
            >
              ✕
            </button>
          </div>

          {/* Role selector tabs */}
          <div className="grid grid-cols-3 gap-2 mb-6 p-1 rounded-xl bg-white/5 border border-white/10">
            <button
              onClick={() => setSelectedRole('ambulance')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold font-display flex flex-col items-center gap-1 transition-all ${
                selectedRole === 'ambulance'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="text-base">🚑</span>
              <span>Ambulance</span>
            </button>

            <button
              onClick={() => setSelectedRole('doctor')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold font-display flex flex-col items-center gap-1 transition-all ${
                selectedRole === 'doctor'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="text-base">👨‍⚕️</span>
              <span>Doctor</span>
            </button>

            <button
              onClick={() => setSelectedRole('hospital')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold font-display flex flex-col items-center gap-1 transition-all ${
                selectedRole === 'hospital'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="text-base">🏥</span>
              <span>Hospital</span>
            </button>
          </div>

          {/* Selected Role Card preview & Quick demo access */}
          {selectedRole === 'ambulance' && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 mb-6 space-y-2">
              <div className="flex items-center justify-between text-xs text-red-300">
                <span className="font-bold">PARAMEDIC & DISPATCH CONSOLE</span>
                <span className="font-mono bg-red-500/20 px-2 py-0.5 rounded">UNIT AMB-102</span>
              </div>
              <p className="text-xs text-slate-300">
                Access emergency telemetry dispatch, GPS navigation, and broadcast pre-arrival trauma alerts to ER.
              </p>
            </div>
          )}

          {selectedRole === 'doctor' && (
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 mb-6 space-y-2">
              <div className="flex items-center justify-between text-xs text-blue-300">
                <span className="font-bold">CLINICAL TRIAGE & TELEHEALTH</span>
                <span className="font-mono bg-blue-500/20 px-2 py-0.5 rounded">DOC-8842</span>
              </div>
              <p className="text-xs text-slate-300">
                Review MedGemma 27B AI differential diagnosis, launch 1-click video calls, and sign clinical orders.
              </p>
            </div>
          )}

          {selectedRole === 'hospital' && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 mb-6 space-y-2">
              <div className="flex items-center justify-between text-xs text-emerald-300">
                <span className="font-bold">HOSPITAL ER & CAPACITY DESK</span>
                <span className="font-mono bg-emerald-500/20 px-2 py-0.5 rounded">HOSP-001</span>
              </div>
              <p className="text-xs text-slate-300">
                Monitor ICU & ER bed capacity, manage incoming ambulance pre-arrival board, and control intake diversion.
              </p>
            </div>
          )}

          {/* Login Actions */}
          <div className="space-y-3">
            <button
              onClick={() => handleLogin(selectedRole)}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm text-white transition-all shadow-lg flex items-center justify-center gap-2 ${
                selectedRole === 'ambulance' ? 'bg-red-600 hover:bg-red-500 shadow-red-600/30' :
                selectedRole === 'doctor' ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30' :
                'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
              }`}
            >
              <span>Quick Login as {MOCK_PROFILES[selectedRole].name}</span>
              <span>→</span>
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-[11px] text-slate-500">
              Sanjeevani MedGemma 27B Secured Health Network
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
