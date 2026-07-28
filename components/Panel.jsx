'use client';

export default function Panel({ title, eyebrow, statusDot, className = '', accentColor, children }) {
  return (
    <div className={`glass-card p-5 ${className}`}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
        <div>
          {eyebrow && (
            <p className="mono-tag text-slate-500 mb-1">{eyebrow}</p>
          )}
          <h2 className="font-display text-[15px] font-semibold tracking-wide text-slate-100">
            {title}
          </h2>
        </div>
        {statusDot && (
          <span className="relative flex h-3 w-3 shrink-0">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-40"
              style={{ backgroundColor: statusDot }}
            />
            <span
              className="relative inline-flex h-3 w-3 rounded-full"
              style={{ backgroundColor: statusDot }}
            />
          </span>
        )}
      </div>

      {/* Accent gradient line */}
      {accentColor && (
        <div
          className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[20px]"
          style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }}
        />
      )}

      <div className="relative z-10">{children}</div>
    </div>
  );
}
