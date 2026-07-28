'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MOCK_PROFILES, setStoredUser } from '@/lib/auth';

export default function RoleAuthModal({ isOpen, onClose }) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState('hospital'); // hospital, doctor, ambulance
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form Fields State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [location, setLocation] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [license, setLicense] = useState('');
  const [unitId, setUnitId] = useState('');
  const [driver, setDriver] = useState('');

  if (!isOpen) return null;

  function handleQuickDemoLogin(role) {
    const profile = MOCK_PROFILES[role];
    setStoredUser(profile);
    onClose();
    router.push(`/dashboard/${role}`);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: authMode,
          role: selectedRole,
          email,
          password,
          name,
          code,
          location,
          specialty,
          license,
          unitId,
          driver
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Store authenticated profile in localStorage
      setStoredUser(data.profile);
      onClose();
      router.push(`/dashboard/${selectedRole}`);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
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
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-red-500" />

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-white/20 text-slate-100 font-bold text-lg">
                🩺
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-slate-100">
                  {authMode === 'login' ? 'Sanjeevani Access Portal' : 'Register New Account'}
                </h2>
                <p className="text-xs text-slate-400">
                  {authMode === 'login' ? 'Sign in to your medical dashboard' : 'Create account & connect to MongoDB'}
                </p>
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
          <div className="grid grid-cols-3 gap-2 mb-4 p-1 rounded-xl bg-white/5 border border-white/10">
            <button
              onClick={() => setSelectedRole('hospital')}
              className={`py-2 px-2 rounded-lg text-xs font-semibold font-display flex flex-col items-center gap-1 transition-all ${
                selectedRole === 'hospital'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="text-base">🏥</span>
              <span>Hospital</span>
            </button>

            <button
              onClick={() => setSelectedRole('doctor')}
              className={`py-2 px-2 rounded-lg text-xs font-semibold font-display flex flex-col items-center gap-1 transition-all ${
                selectedRole === 'doctor'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="text-base">👨‍⚕️</span>
              <span>Doctor</span>
            </button>

            <button
              onClick={() => setSelectedRole('ambulance')}
              className={`py-2 px-2 rounded-lg text-xs font-semibold font-display flex flex-col items-center gap-1 transition-all ${
                selectedRole === 'ambulance'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="text-base">🚑</span>
              <span>Ambulance</span>
            </button>
          </div>

          {/* Mode Switcher (Sign In vs Register) */}
          <div className="flex rounded-xl bg-white/5 p-1 mb-5 border border-white/5">
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setErrorMessage(''); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                authMode === 'login' ? 'bg-white/10 text-slate-100 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('register'); setErrorMessage(''); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                authMode === 'register' ? 'bg-white/10 text-slate-100 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Register New {selectedRole.toUpperCase()}
            </button>
          </div>

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-3 mb-4">
            {authMode === 'register' && (
              <>
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">
                    {selectedRole === 'hospital' ? 'Hospital Facility Name' : selectedRole === 'doctor' ? 'Full Doctor Name' : 'Paramedic / Driver Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={selectedRole === 'hospital' ? 'City General Hospital' : selectedRole === 'doctor' ? 'Dr. Rajesh Mehta, MD' : 'Rajesh Kumar'}
                    className="w-full rounded-xl bg-[#08090d] border border-white/10 px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {selectedRole === 'hospital' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Facility Code</label>
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="HOSP-404"
                        className="w-full rounded-xl bg-[#08090d] border border-white/10 px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Location Zone</label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Sector 4, Central"
                        className="w-full rounded-xl bg-[#08090d] border border-white/10 px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}

                {selectedRole === 'doctor' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Specialty</label>
                      <input
                        type="text"
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        placeholder="Emergency Medicine"
                        className="w-full rounded-xl bg-[#08090d] border border-white/10 px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">MCI License ID</label>
                      <input
                        type="text"
                        value={license}
                        onChange={(e) => setLicense(e.target.value)}
                        placeholder="MCI-2022-881"
                        className="w-full rounded-xl bg-[#08090d] border border-white/10 px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}

                {selectedRole === 'ambulance' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Unit ID</label>
                      <input
                        type="text"
                        value={unitId}
                        onChange={(e) => setUnitId(e.target.value)}
                        placeholder="AMB-305"
                        className="w-full rounded-xl bg-[#08090d] border border-white/10 px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Driver Name</label>
                      <input
                        type="text"
                        value={driver}
                        onChange={(e) => setDriver(e.target.value)}
                        placeholder="Suresh Kumar"
                        className="w-full rounded-xl bg-[#08090d] border border-white/10 px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@hospital.org"
                className="w-full rounded-xl bg-[#08090d] border border-white/10 px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl bg-[#08090d] border border-white/10 px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {errorMessage && (
              <p className="text-xs text-red-400 font-mono text-center pt-1">{errorMessage}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white transition-all shadow-lg flex items-center justify-center gap-2 mt-2 ${
                selectedRole === 'ambulance' ? 'bg-red-600 hover:bg-red-500 shadow-red-600/30' :
                selectedRole === 'doctor' ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30' :
                'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
              }`}
            >
              {loading ? 'Authenticating...' : authMode === 'login' ? `Sign In as ${selectedRole.toUpperCase()} →` : `Register & Create ${selectedRole.toUpperCase()} →`}
            </button>
          </form>

          {/* Quick Demo Login Option */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-slate-400">Or use instant access:</span>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin(selectedRole)}
              className="text-emerald-400 hover:text-emerald-300 font-bold underline transition-colors"
            >
              Quick Demo Login ({selectedRole})
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
