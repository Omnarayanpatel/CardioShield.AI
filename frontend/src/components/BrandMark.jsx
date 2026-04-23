function BrandMark({ className = "", sizeClass = "h-12 w-12", textClass = "text-sm" }) {
  return (
    <div className={`grid place-items-center overflow-hidden bg-transparent ${sizeClass} ${className}`.trim()} aria-hidden="true">
      <img src="/shield-icon.svg" alt="" className={`h-full w-full object-contain drop-shadow-[0_10px_24px_rgba(15,23,42,0.25)] ${textClass}`} />
    </div>
  );
}

export default BrandMark;
