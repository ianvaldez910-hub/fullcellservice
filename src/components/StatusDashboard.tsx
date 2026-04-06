import { EquipmentStatus, STATUS_CONFIG, STATUS_OPTIONS } from '@/types/equipment';

interface StatusDashboardProps {
  counts: Record<EquipmentStatus, number>;
  onFilterByStatus: (status: EquipmentStatus | null) => void;
  activeFilter: EquipmentStatus | null;
}

export function StatusDashboard({ counts, onFilterByStatus, activeFilter }: StatusDashboardProps) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <button
        onClick={() => onFilterByStatus(null)}
        className={`rounded-xl border p-4 text-left transition-all hover:shadow-md ${
          activeFilter === null ? 'ring-2 ring-primary shadow-md' : ''
        } bg-card`}
      >
        <p className="text-2xl font-bold font-mono text-foreground">{total}</p>
        <p className="text-xs font-medium text-muted-foreground mt-1">Total</p>
      </button>
      {STATUS_OPTIONS.map(status => {
        const config = STATUS_CONFIG[status];
        const isActive = activeFilter === status;
        return (
          <button
            key={status}
            onClick={() => onFilterByStatus(isActive ? null : status)}
            className={`rounded-xl border p-4 text-left transition-all hover:shadow-md ${config.bg} ${
              isActive ? 'ring-2 ring-primary shadow-md' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold font-mono">{counts[status]}</span>
              <span className="text-lg">{config.icon}</span>
            </div>
            <p className={`text-xs font-medium mt-1 ${config.color}`}>{status}</p>
          </button>
        );
      })}
    </div>
  );
}
