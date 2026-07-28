/**
 * app/api/nearby-care/route.js
 * Proxies Google Maps Places API to find nearby hospitals or clinics.
 */

import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { lat, lng, facility_type = 'hospital' } = await request.json();

    if (!lat || !lng) {
      return NextResponse.json({ error: 'lat and lng required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      // Return mock facilities
      return NextResponse.json({ facilities: getMockFacilities(), _source: 'mock' });
    }

    const type = facility_type === 'clinic' ? 'doctor' : 'hospital';
    const radius = facility_type === 'clinic' ? 3000 : 10000;

    const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
    url.searchParams.set('location', `${lat},${lng}`);
    url.searchParams.set('radius', radius);
    url.searchParams.set('type', type);
    url.searchParams.set('key', apiKey);

    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      return NextResponse.json({ error: data.status, facilities: getMockFacilities(), _source: 'mock' });
    }

    const facilities = (data.results || []).slice(0, 5).map((p) => ({
      place_id: p.place_id,
      name: p.name,
      vicinity: p.vicinity,
      rating: p.rating ?? null,
      open_now: p.opening_hours?.open_now ?? null,
      lat: p.geometry.location.lat,
      lng: p.geometry.location.lng,
      maps_url: `https://www.google.com/maps/place/?q=place_id:${p.place_id}`,
    }));

    return NextResponse.json({ facilities, _source: 'google_maps' });
  } catch (err) {
    console.error('[nearby-care]', err);
    return NextResponse.json({ facilities: getMockFacilities(), _source: 'mock_error' });
  }
}

function getMockFacilities() {
  return [
    { name: 'District Government Hospital', vicinity: 'Near Bus Stand, Main Road', rating: 3.8, open_now: true, maps_url: '#', lat: 0, lng: 0 },
    { name: 'PHC Rampur', vicinity: '2.1 km — Rampur Village Road', rating: 3.5, open_now: true, maps_url: '#', lat: 0, lng: 0 },
    { name: 'Jan Aushadhi Medical Centre', vicinity: '3.4 km — Market Area', rating: 4.1, open_now: true, maps_url: '#', lat: 0, lng: 0 },
    { name: 'Apollo Clinic', vicinity: '5.2 km — Civil Lines', rating: 4.5, open_now: false, maps_url: '#', lat: 0, lng: 0 },
    { name: 'ASHA Health Point', vicinity: '6.0 km — Sector 3', rating: 3.9, open_now: true, maps_url: '#', lat: 0, lng: 0 },
  ];
}
