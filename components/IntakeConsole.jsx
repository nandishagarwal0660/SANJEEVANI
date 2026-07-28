'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Panel from './Panel';

const LANGUAGES = [
  { code: 'hi',  label: 'हिंदी',       name: 'Hindi' },
  { code: 'hne', label: 'छत्तीसगढ़ी',  name: 'Chhattisgarhi' },
  { code: 'bho', label: 'भोजपुरी',      name: 'Bhojpuri' },
  { code: 'mr',  label: 'मराठी',        name: 'Marathi' },
  { code: 'en',  label: 'English',      name: 'English' },
];

const SAMPLE_NARRATIVES = [
  { lang: 'hi', text: 'Mere seene mein bahut tez dard ho raha hai, saans lene mein bhi takleef ho rahi hai. Yeh 2 ghante se ho raha hai, bahut ghabra raha hoon.' },
  { lang: 'hi', text: 'Do din se halka bukhar hai, 99-100 degree. Naak beh rahi hai, khansi bhi hai. Baaki thik hoon.' },
  { lang: 'hi', text: 'Meri bacchi ko 3 din se ulti ho rahi hai aur pet mein dard hai. Kuch kha nahi pa rahi. Umar 5 saal hai.' },
  { lang: 'en', text: 'I have a severe headache for the past 6 hours, along with blurred vision and I feel dizzy when I stand up.' },
];

const EMERGENCY_WORDS = [
  'chest pain', 'seene mein dard', 'heart attack', 'dil ka daura',
  'saans nahi', 'behosh', 'unconscious', 'stroke', 'khoon',
  'breathing', 'unresponsive', 'paralysis',
];

function detectLocalEmergency(text) {
  const lower = text.toLowerCase();
  return EMERGENCY_WORDS.some((w) => lower.includes(w));
}

export default function IntakeConsole({ onSubmit, isProcessing }) {
  const [narrative, setNarrative]       = useState('');
  const [language, setLanguage]         = useState('hi');
  const [isListening, setIsListening]   = useState(false);
  const [showBiometrics, setShowBiometrics] = useState(false);
  const [biometrics, setBiometrics]     = useState({ spo2: '', bpm: '', bpSystolic: '', bpDiastolic: '', temperature: '' });
  const [bodyRegion, setBodyRegion]     = useState('');
  const [emergencyFlash, setEmergencyFlash] = useState(false);
  const recognitionRef = useRef(null);

  const isEmergency = detectLocalEmergency(narrative);

  function handleNarrativeChange(val) {
    setNarrative(val);
    if (detectLocalEmergency(val)) {
      setEmergencyFlash(true);
      setTimeout(() => setEmergencyFlash(false), 3000);
    }
  }

  function handleBiometric(key, val) {
    setBiometrics((p) => ({ ...p, [key]: val }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!narrative.trim() || isProcessing) return;
    const bm = Object.fromEntries(Object.entries(biometrics).filter(([, v]) => v !== ''));
    onSubmit({
      narrative: narrative.trim(),
      language,
      biometrics: Object.keys(bm).length ? bm : undefined,
      bodyRegion: bodyRegion || undefined,
    });
  }

  function loadSample() {
    const langSamples = SAMPLE_NARRATIVES.filter((s) => s.lang === language);
    const pool = langSamples.length ? langSamples : SAMPLE_NARRATIVES;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setNarrative(pick.text);
    setLanguage(pick.lang);
  }

  function toggleVoice() {
    const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) { loadSample(); return; }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const rec = new SR();
    rec.lang = language === 'en' ? 'en-IN' : 'hi-IN';
    rec.interimResults = true;
    rec.continuous = true;
    rec.onresult = (e) => {
      let t = '';
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      handleNarrativeChange(t);
    };
    rec.onend  = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    recognitionRef.current = rec;
    rec.start();
    setIsListening(true);
  }

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-slate-200 text-[13px] placeholder:text-slate-600 focus:outline-none focus:border-mint-500/60 focus:bg-white/8 transition-all font-mono';

  return (
    <Panel eyebrow="Panel 01" title="Patient Intake — Live Transcript" statusDot={isListening ? '#EF4444' : '#34C98E'} accentColor="#34C98E" className="h-full">

      {/* Emergency flash banner */}
      {emergencyFlash && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="mb-4 flex items-center gap-3 rounded-xl border border-red-500/40 bg-red-950/60 px-4 py-3"
        >
          <span className="text-xl">🚨</span>
          <div>
            <p className="font-display text-[13px] font-bold text-red-300">Emergency keyword detected</p>
            <p className="text-[12px] text-red-400/80">Triage will be auto-set to RED. Please confirm the narrative is correct.</p>
          </div>
        </motion.div>
      )}

      {/* Language selector */}
      <div className="mb-4 flex flex-wrap gap-2">
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => setLanguage(l.code)}
            className={`rounded-full border px-3.5 py-1.5 font-display text-[12px] font-semibold transition-all ${
              language === l.code
                ? 'border-mint-500/50 bg-mint-500/15 text-mint-300'
                : 'border-white/10 bg-white/5 text-slate-400 hover:border-mint-500/30 hover:text-mint-400'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Narrative textarea */}
        <div className="relative">
          <textarea
            id="narrative-input"
            value={narrative}
            onChange={(e) => handleNarrativeChange(e.target.value)}
            placeholder="Bolein ya type karein... (e.g. Mere seene mein dard ho raha hai)"
            rows={5}
            className={`w-full resize-none rounded-2xl border px-4 py-3.5 font-mono text-[14px] leading-relaxed transition-all placeholder:text-slate-600 focus:outline-none focus:ring-0 ${
              isEmergency
                ? 'border-red-500/50 bg-red-950/30 text-slate-100 focus:border-red-400/60'
                : 'border-white/10 bg-white/5 text-slate-200 focus:border-mint-500/50 focus:bg-white/8'
            }`}
          />
          {!narrative && (
            <span className="clinical-caret pointer-events-none absolute left-4 top-4 font-mono text-[14px]" />
          )}
        </div>

        {/* Biometric toggle */}
        <button
          type="button"
          onClick={() => setShowBiometrics((p) => !p)}
          className="flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/5 px-4 py-1.5 font-display text-[12px] font-medium text-slate-400 hover:border-cerulean-500/40 hover:text-cerulean-300 transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          {showBiometrics ? 'Hide' : 'Add'} Vitals (SpO₂, BPM, BP, Temp)
        </button>

        {/* Biometric inputs */}
        {showBiometrics && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            className="grid grid-cols-2 gap-3 overflow-hidden sm:grid-cols-4"
          >
            {[
              { key: 'spo2',        label: 'SpO₂ (%)',     placeholder: 'e.g. 97', min: 50, max: 100 },
              { key: 'bpm',         label: 'Heart Rate (BPM)', placeholder: 'e.g. 78', min: 20, max: 250 },
              { key: 'bpSystolic',  label: 'BP Systolic',  placeholder: 'e.g. 120', min: 50, max: 250 },
              { key: 'bpDiastolic', label: 'BP Diastolic', placeholder: 'e.g. 80',  min: 30, max: 150 },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="mono-tag text-slate-500 block mb-1.5">{label}</label>
                <input
                  type="number"
                  value={biometrics[key]}
                  onChange={(e) => handleBiometric(key, e.target.value)}
                  placeholder={placeholder}
                  className={inputCls}
                />
              </div>
            ))}
            <div>
              <label className="mono-tag text-slate-500 block mb-1.5">Temp (°F)</label>
              <input
                type="number"
                step="0.1"
                value={biometrics.temperature}
                onChange={(e) => handleBiometric('temperature', e.target.value)}
                placeholder="e.g. 100.4"
                className={inputCls}
              />
            </div>
          </motion.div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={toggleVoice}
            id="voice-input-btn"
            className={`flex min-h-[42px] items-center gap-2 rounded-xl border px-4 py-2 font-display text-[13px] font-medium transition-all ${
              isListening
                ? 'border-red-500/40 bg-red-950/50 text-red-300'
                : 'border-white/10 bg-white/5 text-slate-400 hover:border-cerulean-500/40 hover:text-cerulean-300 hover:bg-cerulean-950/20'
            }`}
          >
            <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${isListening ? 'bg-red-400 animate-pulse' : 'bg-slate-600'}`} />
            {isListening ? 'Listening…' : '🎤 Voice Input'}
          </button>

          <button
            type="button"
            onClick={loadSample}
            id="load-sample-btn"
            className="min-h-[42px] rounded-xl border border-white/10 bg-white/5 px-4 py-2 font-display text-[13px] font-medium text-slate-400 hover:border-white/20 hover:text-slate-200 transition-colors"
          >
            Load Sample
          </button>

          <button
            type="submit"
            id="run-triage-btn"
            disabled={isProcessing || !narrative.trim()}
            className={`ml-auto min-h-[42px] rounded-xl border px-5 py-2 font-display text-[14px] font-semibold text-white shadow-lg transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${
              isEmergency
                ? 'border-red-500 bg-red-600 shadow-red-900/40 hover:bg-red-500'
                : 'border-mint-500/70 bg-mint-600 shadow-mint-900/30 hover:bg-mint-500'
            }`}
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/></svg>
                Analyzing…
              </span>
            ) : isEmergency ? '🚨 Emergency Triage →' : 'Run Triage →'}
          </button>
        </div>
      </form>
    </Panel>
  );
}
