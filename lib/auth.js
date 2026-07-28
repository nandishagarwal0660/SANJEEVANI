// Role-based authentication helper for Sanjeevani

export const MOCK_PROFILES = {
  ambulance: {
    role: 'ambulance',
    name: 'Paramedic Team Alpha (Unit 102)',
    id: 'AMB-102',
    hospitalAssigned: 'Apex City Hospital - Emergency Response',
    vehicle: 'Type III ALS Ambulance',
    driver: 'Rajesh Kumar (ALS Certified)',
    status: 'ON CALL - Dispatch Active',
    badgeColor: '#EF4444'
  },
  doctor: {
    role: 'doctor',
    name: 'Dr. Ananya Sharma, MD',
    id: 'DOC-8842',
    specialty: 'Emergency Medicine & Critical Triage',
    hospital: 'Apex City Hospital',
    license: 'MCI-2018-9941',
    status: 'On Duty - Triage Active',
    badgeColor: '#3B82F6'
  },
  hospital: {
    role: 'hospital',
    name: 'Apex City Emergency & Trauma Center',
    id: 'HOSP-001',
    code: 'ACH-TRAUMA-1',
    location: 'Sector 4, Central Healthcare Zone',
    status: 'L1 Trauma Center - Active Intake',
    badgeColor: '#10B981'
  }
};

export function getStoredUser() {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem('sanjeevani_user');
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
}

export function setStoredUser(profile) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('sanjeevani_user', JSON.stringify(profile));
}

export function clearStoredUser() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('sanjeevani_user');
}
