interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  highlight?: boolean;
  accent?: boolean;
}

export function StatCard({ label, value, change, highlight, accent }: StatCardProps) {
  return (
    <div className={`stat-card ${highlight ? 'highlight' : ''}`}>
      <div className="stat-label">{label}</div>
      <div className={`stat-value ${accent ? 'accent' : ''}`}>{value}</div>
      {change && <div className="stat-change">{change}</div>}
    </div>
  );
}
