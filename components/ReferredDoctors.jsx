'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Stethoscope, Star, MapPin, Phone, ArrowRight, CheckCircle } from 'lucide-react';
import { getDoctorsBySpec } from '@/lib/doctors';

export default function ReferredDoctors({ specialization }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      // Show max 2 doctors in the preview card
      setDoctors(getDoctorsBySpec(specialization).slice(0, 2));
      setLoading(false);
    }, 800);
    return () => clearTimeout(t);
  }, [specialization]);

  return (
    <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-blue-500/15">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
            <Stethoscope size={15} />
          </div>
          <div>
            <p className="font-display text-[13px] font-bold text-blue-300">Recommended Specialists</p>
            {specialization && (
              <p className="text-[11px] text-blue-400/60 font-mono">{specialization}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => router.push(`/specialists?spec=${encodeURIComponent(specialization || '')}`)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-500/20 border border-blue-500/30 px-3 py-1.5 text-[11px] font-semibold text-blue-300 hover:bg-blue-500/30 transition-all"
        >
          See All <ArrowRight size={12} />
        </button>
      </div>

      {/* Body */}
      <div className="divide-y divide-blue-500/10">
        {loading ? (
          /* Skeleton */
          [0, 1].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
              <div className="h-9 w-9 rounded-full bg-white/5 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-2/5 rounded bg-white/5" />
                <div className="h-2 w-3/5 rounded bg-white/5" />
              </div>
              <div className="h-7 w-7 rounded-full bg-white/5" />
            </div>
          ))
        ) : (
          doctors.map((doc, i) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3 px-4 py-3"
            >
              {/* Avatar */}
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/20 shrink-0">
                <Stethoscope size={15} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-display text-[13px] font-semibold text-slate-200 truncate">{doc.name}</p>
                <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                  <span className="text-blue-400 font-medium">{doc.spec}</span>
                  <span className="text-slate-600">·</span>
                  <span className="flex items-center gap-0.5 text-amber-400">
                    <Star size={10} fill="currentColor" /> {doc.rating}
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="flex items-center gap-0.5 text-slate-500">
                    <MapPin size={10} /> {doc.distance}
                  </span>
                </div>
                {doc.available && (
                  <p className="flex items-center gap-1 text-[10px] text-emerald-400 mt-0.5">
                    <CheckCircle size={9} /> {doc.availableSlot}
                  </p>
                )}
              </div>

              {/* Call button */}
              <a
                href={`tel:${doc.phone}`}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 border border-white/10 text-slate-300 hover:bg-blue-500/20 hover:border-blue-500/30 hover:text-blue-300 transition-all"
              >
                <Phone size={13} />
              </a>
            </motion.div>
          ))
        )}
      </div>

    </div>
  );
}
