/**
 * app/api/triage/route.js
 * Core triage API — MedGemma-27B via HF Inference → Gemini fallback → Mock data fallback.
 */

import { NextResponse } from 'next/server';
import { SANJEEVANI_SYSTEM_PROMPT } from '@/lib/systemPrompt';

// ── Emergency keyword detection (force RED) ────────────────────────
const EMERGENCY_PATTERNS = [
  /chest\s*pain/i,
  /heart\s*attack/i, /dil\s*ka\s*daura/i, /dil\s*mein\s*dard/i,
  /stroke/i, /brain\s*attack/i,
  /unconscious/i, /behosh/i, /hosh\s*nahi/i,
  /not\s*breathing/i, /saans\s*nahi/i,
  /severe\s*bleed/i, /bahut\s*khoon/i,
  /difficulty\s*breathing/i, /saans\s*lene\s*mein\s*takleef/i,
  /respiratory\s*distress/i,
  /unresponsive/i,
  /paralysis/i, /lakwa/i,
  /severe\s*head(ache)?/i, /sar\s*mein\s*bahut\s*tez\s*dard/i,
];

function detectEmergency(text) {
  return EMERGENCY_PATTERNS.some((re) => re.test(text));
}

// ── Build the user message from inputs ─────────────────────────────
function buildUserMessage({ narrative, language, biometrics, bodyRegion }) {
  let msg = `Patient complaint (language: ${language || 'auto-detect'}):\n${narrative}`;

  if (biometrics) {
    const b = biometrics;
    const bLines = [];
    if (b.spo2)        bLines.push(`SpO2: ${b.spo2}%`);
    if (b.bpm)         bLines.push(`Heart Rate: ${b.bpm} BPM`);
    if (b.bpSystolic && b.bpDiastolic)
                       bLines.push(`Blood Pressure: ${b.bpSystolic}/${b.bpDiastolic} mmHg`);
    if (b.temperature) bLines.push(`Temperature: ${b.temperature}°F`);
    if (bLines.length) msg += `\n\nVital Signs:\n${bLines.join('\n')}`;
  }

  if (bodyRegion) {
    msg += `\n\nAffected body region reported by patient: ${bodyRegion}`;
  }

  msg += '\n\nRespond ONLY with valid JSON.';
  return msg;
}

// ── MedGemma via HF Inference API ─────────────────────────────────
async function callMedGemma(userMessage) {
  const hfToken = process.env.HF_TOKEN;
  if (!hfToken) throw new Error('HF_TOKEN not set');

  const response = await fetch(
    'https://api-inference.huggingface.co/models/google/medgemma-27b-it',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${hfToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: `<start_of_turn>system\n${SANJEEVANI_SYSTEM_PROMPT}<end_of_turn>\n<start_of_turn>user\n${userMessage}<end_of_turn>\n<start_of_turn>model\n`,
        parameters: {
          max_new_tokens: 1200,
          temperature: 0.2,
          do_sample: true,
          return_full_text: false,
        },
      }),
      signal: AbortSignal.timeout(30000),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`HF API error ${response.status}: ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  // HF returns [{ generated_text: "..." }]
  const raw = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text;
  if (!raw) throw new Error('Empty response from HF');
  return raw;
}

// ── Gemini fallback ────────────────────────────────────────────────
async function callGemini(userMessage) {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) throw new Error('GEMINI_API_KEY not set');

  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(geminiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: SANJEEVANI_SYSTEM_PROMPT,
    generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
  });

  const result = await model.generateContent(userMessage);
  return result.response.text();
}

// ── Parse JSON from model output ───────────────────────────────────
function parseTriageJSON(raw) {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON found in model output');
  return JSON.parse(match[0]);
}

// ── Mock fallback data ─────────────────────────────────────────────
function getMockData(narrative, isEmergency) {
  if (isEmergency) {
    return {
      Severity_Color: 'RED',
      Recommended_Action: 'Hospital+Ambulance',
      Required_Specialization: 'Emergency Medicine / Cardiologist',
      Clinical_Reasoning: 'Emergency keywords detected: chest pain or critical symptom reported. Forced RED triage per safety protocol.',
      Patient_Communication: 'Aapki halat bahut gambhir lag rahi hai. Abhi turant ambulance bulao — 112 pe call karo. Seedha let jao aur hilne ki koshish mat karo. Main yahan hoon, ghabrao mat.\n\nDisclaimer: Main ek AI assistant hoon — yeh diagnosis nahi hai. Turant 112 call karein.',
      Immediate_Actions: ['Abhi 112 call karein', 'Seedha let jao', 'Tight kapde dhile karo', 'Kuch bhi khane ya pine se bachein'],
      Red_Flags_Detected: ['Chest pain / Emergency symptom detected'],
      Extracted_Symptoms: ['Chest pain / Critical symptom'],
      Estimated_Duration: 'Unknown',
      Pain_Level_Estimate: 8,
      _source: 'mock_emergency',
    };
  }
  return {
    Severity_Color: 'GREEN',
    Recommended_Action: 'Doctor Only',
    Required_Specialization: 'General Physician',
    Clinical_Reasoning: 'Symptoms suggest a non-urgent condition. Normal biometrics assumed. Mocked response — configure HF_TOKEN or GEMINI_API_KEY for live analysis.',
    Patient_Communication: 'Aapki takleef samajh aa rahi hai. Abhi koi emergency nahi hai, lekin ek doctor se milna zaroori hai. Aaram karein, paani peete rahein, aur agar symptoms badh jayein toh turant doctor ke paas jaayen.\n\nDisclaimer: Main ek AI assistant hoon — yeh diagnosis nahi hai. Life-threatening emergency mein turant 112 call karein.',
    Immediate_Actions: ['Aaram karein', 'Paani aur ORS peete rahein', 'Bukhar ho toh paracetamol lein (doctor ki salah se)', '24 ghante mein doctor se milein'],
    Red_Flags_Detected: [],
    Extracted_Symptoms: narrative.split(' ').slice(0, 3),
    Estimated_Duration: 'Unknown',
    Pain_Level_Estimate: 3,
    _source: 'mock_fallback',
  };
}

// ── Main handler ───────────────────────────────────────────────────
export async function POST(request) {
  try {
    const body = await request.json();
    const { narrative, language, biometrics, bodyRegion } = body;

    if (!narrative?.trim()) {
      return NextResponse.json({ error: 'Narrative is required.' }, { status: 400 });
    }

    const isEmergency = detectEmergency(narrative);

    // Check critical biometrics
    const bm = biometrics || {};
    const bioCritical =
      (bm.spo2 && Number(bm.spo2) < 90) ||
      (bm.bpm && (Number(bm.bpm) > 130 || Number(bm.bpm) < 40)) ||
      (bm.bpSystolic && (Number(bm.bpSystolic) > 180 || Number(bm.bpSystolic) < 90));

    const forceRed = isEmergency || bioCritical;

    // If force-RED, short-circuit with emergency response
    if (forceRed && !process.env.HF_TOKEN && !process.env.GEMINI_API_KEY) {
      const result = getMockData(narrative, true);
      return NextResponse.json({ ...result, ambulance_triggered: true });
    }

    const userMessage = buildUserMessage({ narrative, language, biometrics, bodyRegion });
    let raw = null;
    let source = 'unknown';

    // Try MedGemma first
    try {
      raw = await callMedGemma(userMessage);
      source = 'medgemma-27b';
    } catch (hfErr) {
      console.warn('[Sanjeevani] HF failed, trying Gemini:', hfErr.message);
      try {
        raw = await callGemini(userMessage);
        source = 'gemini-2.0-flash';
      } catch (geminiErr) {
        console.warn('[Sanjeevani] Gemini failed, using mock:', geminiErr.message);
        const mock = getMockData(narrative, forceRed);
        return NextResponse.json({ ...mock, ambulance_triggered: forceRed });
      }
    }

    let parsed;
    try {
      parsed = parseTriageJSON(raw);
    } catch {
      console.warn('[Sanjeevani] JSON parse failed, using mock');
      const mock = getMockData(narrative, forceRed);
      return NextResponse.json({ ...mock, ambulance_triggered: forceRed });
    }

    // Safety override: if emergency detected, never downgrade below RED
    if (forceRed) {
      parsed.Severity_Color = 'RED';
      parsed.Recommended_Action = 'Hospital+Ambulance';
    }

    return NextResponse.json({
      ...parsed,
      _source: source,
      ambulance_triggered: parsed.Severity_Color === 'RED',
    });
  } catch (err) {
    console.error('[Sanjeevani] Triage API error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
