export function Mark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M12.4 16h7.2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <circle cx="9.2" cy="16" r="3.4" fill="currentColor" />
      <circle cx="22.8" cy="16" r="3.4" fill="currentColor" />
    </svg>
  );
}
