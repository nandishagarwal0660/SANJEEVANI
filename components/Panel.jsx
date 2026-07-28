'use client';

export default function Panel({ title, eyebrow, statusDot, className = '', children }) {
  return (
    <div className={`clay-card p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between border-b border-black/5 pb-3">
        <div>
          {eyebrow && (
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-400 mb-1">
              {eyebrow}
            </p>
          )}
          <h2 className="font-display text-base font-semibold tracking-wide text-slate-800">
            {title}
          </h2>
        </div>
        {statusDot && (
          <span className="relative flex h-3 w-3">
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
      <div className="relative z-10">{children}</div>
    </div>
  );
}
