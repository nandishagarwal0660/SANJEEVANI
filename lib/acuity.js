export function getAcuityStatus(score) {
  if (score == null) return { level: 5, color: '#34C98E', textClass: 'text-mint-500', label: 'Level 5 (Non-Urgent)' };
  
  if (score <= 2) {
    return { level: score, color: '#EF4444', textClass: 'text-crimson-signal', label: `Level ${score} (Resuscitation / Emergent)`, jitter: 1.5, rotationSpeed: 2.0 };
  } else if (score === 3) {
    return { level: 3, color: '#F59E0B', textClass: 'text-amber-500', label: 'Level 3 (Urgent)', jitter: 0.5, rotationSpeed: 1.0 };
  } else {
    return { level: score, color: '#34C98E', textClass: 'text-mint-500', label: `Level ${score} (Less/Non-Urgent)`, jitter: 0.1, rotationSpeed: 0.5 };
  }
}
