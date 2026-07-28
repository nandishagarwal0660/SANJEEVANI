'use client';

import { useState, useRef } from 'react';
import Panel from './Panel';

const LANGUAGES = [
  { code: 'hi', label: 'हिंदी' },
  { code: 'hne', label: 'छत्तीसगढ़ी' },
  { code: 'en', label: 'English' },
];

const SAMPLE_NARRATIVES = [
  'Mere seene mein bahut tez dard ho raha hai, saans lene mein takleef ho rahi hai, 2 ghante se.',
  'Do din se halka bukhar hai aur sardi khansi bhi hai, baaki thik hoon.',
  'Bacchi ko ulti ho rahi hai aur pait mein dard hai, kal raat se.',
];

export default function IntakeConsole({ onSubmit, isProcessing }) {
  const [narrative, setNarrative] = useState('');
  const [language, setLanguage] = useState('hi');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  function handleSubmit(e) {
    e.preventDefault();
    if (!narrative.trim() || isProcessing) return;
    onSubmit({ narrative: narrative.trim(), language });
  }

  function loadSample() {
    const pick = SAMPLE_NARRATIVES[Math.floor(Math.random() * SAMPLE_NARRATIVES.length)];
    setNarrative(pick);
  }

  function toggleVoice() {
    const SpeechRecognition =
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (!SpeechRecognition) {
      setIsListening(false);
      loadSample();
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'en' ? 'en-IN' : 'hi-IN';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setNarrative(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }

  return (
    <Panel
      eyebrow="Panel 01"
      title="Patient Intake — Live Transcript"
      statusDot={isListening ? '#EF4444' : '#34C98E'}
      className="h-full"
    >
      <div className="mb-4 flex gap-2">
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => setLanguage(l.code)}
            className={`rounded-full border px-3.5 py-1.5 font-display text-[12px] font-semibold transition-all ${
              language === l.code
                ? 'border-mint-200 bg-mint-50 text-mint-600 shadow-sm'
                : 'border-slate-200 bg-white text-slate-500 hover:border-mint-200 hover:text-mint-500'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="relative">
          <textarea
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            placeholder="Bolein ya type karein... (e.g. Mere seene mein dard ho raha hai)"
            rows={5}
            className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/50 p-4 font-mono text-[14px] leading-relaxed text-slate-700 placeholder:text-slate-400 focus:border-mint-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-mint-50 transition-all"
          />
          {!narrative && (
            <span className="clinical-caret pointer-events-none absolute left-4 top-4 font-mono text-[14px]" />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={toggleVoice}
            className={`flex min-h-[44px] items-center gap-2 rounded-xl border px-4 py-2 font-display text-[13px] font-medium transition-all ${
              isListening
                ? 'border-crimson-signal/30 bg-red-50 text-crimson-signal shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:border-cerulean-300 hover:text-cerulean-600 hover:bg-cerulean-50/50'
            }`}
          >
            <span className={`h-2.5 w-2.5 rounded-full ${isListening ? 'bg-crimson-signal animate-pulse' : 'bg-slate-300'}`} />
            {isListening ? 'Listening…' : 'Voice Input'}
          </button>

          <button
            type="button"
            onClick={loadSample}
            className="min-h-[44px] rounded-xl border border-slate-200 bg-white px-4 py-2 font-display text-[13px] font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-colors"
          >
            Load sample
          </button>

          <button
            type="submit"
            disabled={isProcessing || !narrative.trim()}
            className="ml-auto min-h-[44px] rounded-xl border border-mint-500 bg-mint-500 px-5 py-2 font-display text-[14px] font-semibold text-white shadow-[0_2px_10px_rgba(52,201,142,0.25)] transition-all hover:bg-mint-600 hover:border-mint-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
          >
            {isProcessing ? 'Analyzing…' : 'Run Triage →'}
          </button>
        </div>
      </form>
    </Panel>
  );
}
