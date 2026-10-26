export interface KpiCell {
  label: string;
  value: string | number;
  caption: string;
}

export function KpiStrip({ cells }: { cells: KpiCell[] }) {
  return (
    <div
      className="grid overflow-hidden rounded-[20px] bg-surface"
      style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}
    >
      {cells.map((cell, index) => (
        <div
          key={cell.label}
          className={`min-w-0 px-3 py-3 sm:px-[14px] ${index > 0 ? 'border-l border-rule' : ''}`}
        >
          <div className="text-[12px] leading-4 text-muted">{cell.label}</div>
          <div className="mt-1 text-[24px] font-normal leading-none tabular-nums text-white">
            {cell.value}
          </div>
          <div className="mt-1.5 text-[12px] leading-snug text-faint">{cell.caption}</div>
        </div>
      ))}
    </div>
  );
}
