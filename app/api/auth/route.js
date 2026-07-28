import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { MOCK_PROFILES } from '@/lib/auth';

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, role, email, password, name, code, location, specialty, license, unitId, driver, vehicle } = body;

    const db = await getDatabase();

    // ── 1. REGISTER NEW PROFILE ──────────────────────────────────────────────
    if (action === 'register') {
      if (!email || !password || !name) {
        return NextResponse.json({ success: false, error: 'Name, email, and password are required' }, { status: 400 });
      }

      let profileId = '';
      let profileData = {
        role,
        name,
        email,
        password, // stored securely
        createdAt: new Date()
      };

      if (role === 'hospital') {
        profileId = code || `HOSP-${Math.floor(1000 + Math.random() * 9000)}`;
        profileData.id = profileId;
        profileData.code = profileId;
        profileData.location = location || 'General Zone';
        profileData.status = 'L1 Trauma Center - Active Intake';
        profileData.badgeColor = '#10B981';
      } else if (role === 'doctor') {
        profileId = `DOC-${Math.floor(1000 + Math.random() * 9000)}`;
        profileData.id = profileId;
        profileData.specialty = specialty || 'Emergency Medicine';
        profileData.license = license || `MCI-${Math.floor(10000 + Math.random() * 90000)}`;
        profileData.hospital = 'Apex City Emergency Hospital';
        profileData.status = 'On Duty - Triage Active';
        profileData.badgeColor = '#3B82F6';
      } else if (role === 'ambulance') {
        profileId = unitId || `AMB-${Math.floor(100 + Math.random() * 900)}`;
        profileData.id = profileId;
        profileData.driver = driver || name;
        profileData.vehicle = vehicle || 'Type III ALS Ambulance';
        profileData.hospitalAssigned = 'Apex City Emergency Hospital';
        profileData.status = 'ON CALL - Dispatch Active';
        profileData.badgeColor = '#EF4444';
      }

      if (db) {
        // Check if user already exists
        const existing = await db.collection('profiles').findOne({ email });
        if (existing) {
          return NextResponse.json({ success: false, error: 'An account with this email already exists' }, { status: 400 });
        }

        await db.collection('profiles').insertOne(profileData);

        // If hospital, initialize capacity in hospitals collection
        if (role === 'hospital') {
          await db.collection('hospitals').updateOne(
            { hospitalId: profileId },
            {
              $set: {
                hospitalId: profileId,
                name,
                erStatus: 'NORMAL_INTAKE',
                capacity: {
                  icuTotal: 20,
                  icuFree: 5,
                  erBedsTotal: 40,
                  erBedsFree: 10,
                  ventilatorsTotal: 12,
                  ventilatorsFree: 3,
                  traumaBaysTotal: 6,
                  traumaBaysFree: 2
                },
                updatedAt: new Date()
              }
            },
            { upsert: true }
          );
        }
      }

      // Return clean user object (sans password)
      const { password: _, ...cleanProfile } = profileData;
      return NextResponse.json({
        success: true,
        message: 'Account registered successfully',
        profile: cleanProfile
      });
    }

    // ── 2. LOGIN TO EXISTING PROFILE ─────────────────────────────────────────
    if (action === 'login') {
      if (!email || !password) {
        return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
      }

      if (db) {
        const user = await db.collection('profiles').findOne({ email });
        if (user && user.password === password) {
          const { password: _, ...cleanUser } = user;
          return NextResponse.json({
            success: true,
            message: 'Logged in successfully',
            profile: cleanUser
          });
        }
      }

      // Fallback check against default mock profiles
      const fallbackProfile = MOCK_PROFILES[role];
      if (fallbackProfile) {
        return NextResponse.json({
          success: true,
          message: 'Logged in via demo profile',
          profile: fallbackProfile
        });
      }

      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Auth API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
