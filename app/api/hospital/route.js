import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { INITIAL_HOSPITALS, INITIAL_DISPATCHES } from '../seed/route';

export async function GET() {
  try {
    const db = await getDatabase();
    if (!db) {
      return NextResponse.json({
        success: true,
        hospital: INITIAL_HOSPITALS[0],
        incomingAmbulances: INITIAL_DISPATCHES,
        source: 'mock'
      });
    }

    let hospital = await db.collection('hospitals').findOne({ hospitalId: 'HOSP-001' });
    if (!hospital) {
      await db.collection('hospitals').insertMany(INITIAL_HOSPITALS);
      hospital = INITIAL_HOSPITALS[0];
    }

    const dispatches = await db.collection('dispatches').find({}).toArray();

    return NextResponse.json({
      success: true,
      hospital,
      incomingAmbulances: dispatches.length ? dispatches : INITIAL_DISPATCHES,
      source: 'mongodb'
    });
  } catch (error) {
    console.error('Hospital API GET Error:', error);
    return NextResponse.json({
      success: true,
      hospital: INITIAL_HOSPITALS[0],
      incomingAmbulances: INITIAL_DISPATCHES,
      source: 'mock',
      error: error.message
    });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { capacity, erStatus } = body;

    const db = await getDatabase();
    if (!db) {
      return NextResponse.json({ success: true, message: 'Hospital capacity updated locally (No Mongo URI set)', data: body });
    }

    const updateFields = { updatedAt: new Date() };
    if (capacity) updateFields.capacity = capacity;
    if (erStatus) updateFields.erStatus = erStatus;

    await db.collection('hospitals').updateOne(
      { hospitalId: 'HOSP-001' },
      { $set: updateFields },
      { upsert: true }
    );

    return NextResponse.json({ success: true, message: 'Hospital capacity updated in MongoDB', data: updateFields });
  } catch (error) {
    console.error('Hospital API POST Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
