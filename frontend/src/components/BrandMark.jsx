function BrandMark({ className = "", sizeClass = "h-12 w-12", textClass = "text-sm" }) {
  return (
    <div
      className={`grid place-items-center rounded-2xl border border-cyan-200/20 bg-[radial-gradient(circle_at_30%_30%,rgba(34,211,238,0.95),rgba(6,24,35,0.92)_68%)] font-black uppercase tracking-[0.22em] text-white shadow-lg shadow-cyan-500/15 ${sizeClass} ${className}`.trim()}
      aria-hidden="true"
    >
      <span className={textClass}>CS</span>
    </div>
  );
}

export default BrandMark;
