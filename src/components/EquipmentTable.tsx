import { Equipment, STATUS_CONFIG, STATUS_OPTIONS, EquipmentStatus } from '@/types/equipment';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Pencil, Trash2, FileText } from 'lucide-react';

interface EquipmentTableProps {
  items: Equipment[];
  onEdit: (item: Equipment) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: EquipmentStatus) => void;
  onReceipt: (item: Equipment) => void;
}

function daysSinceDate(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export function EquipmentTable({ items, onEdit, onDelete, onStatusChange, onReceipt }: EquipmentTableProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-4xl mb-3">📱</p>
        <p className="font-medium">No hay equipos registrados</p>
        <p className="text-sm mt-1">Agrega una nueva orden para comenzar</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-3 pr-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">#</th>
            <th className="pb-3 pr-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Cliente</th>
            <th className="pb-3 pr-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Equipo</th>
            <th className="pb-3 pr-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Problema</th>
            <th className="pb-3 pr-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Ingreso</th>
            <th className="pb-3 pr-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Presupuesto</th>
            <th className="pb-3 pr-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Saldo</th>
            <th className="pb-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => {
            const config = STATUS_CONFIG[item.status];
            const isPendingLong = item.status === 'Pendiente' && daysSinceDate(item.dateIn) > 3;
            return (
              <tr key={item.id} className={`border-b border-border/50 hover:bg-muted/50 transition-colors ${isPendingLong ? 'bg-destructive/10 hover:bg-destructive/15' : ''}`}>
                <td className="py-3 pr-4 font-mono font-bold text-muted-foreground">
                  {item.id}
                  {isPendingLong && <span className="ml-1 text-destructive text-xs" title="Más de 3 días pendiente">⚠️</span>}
                </td>
                <td className="py-3 pr-4">
                  <div className="font-medium">{item.clientName}</div>
                  {item.phone && <div className="text-xs text-muted-foreground">{item.phone}</div>}
                </td>
                <td className="py-3 pr-4">
                  <span className="font-medium">{item.brand}</span>
                  <span className="text-muted-foreground ml-1">{item.model}</span>
                </td>
                <td className="py-3 pr-4 max-w-48 truncate text-muted-foreground">{item.problem}</td>
                <td className="py-3 pr-4 font-mono text-xs">{item.dateIn}</td>
                <td className="py-3 pr-4">
                  <span className="font-mono font-semibold">${item.budget.toLocaleString()}</span>
                  {item.deposit > 0 && (
                    <span className="text-xs text-muted-foreground ml-1">(Seña: ${item.deposit.toLocaleString()})</span>
                  )}
                </td>
                <td className="py-3 pr-4">
                  <Select value={item.status} onValueChange={v => onStatusChange(item.id, v as EquipmentStatus)}>
                    <SelectTrigger className={`h-8 text-xs w-44 border-0 ${config.bg} ${config.color} font-semibold`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(s => (
                        <SelectItem key={s} value={s}>{STATUS_CONFIG[s].icon} {s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="py-3">
                  <div className="flex gap-1">
                    <WhatsAppButton item={item} />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onReceipt(item)} title="Recibo">
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(item)} title="Editar">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(item.id)} title="Eliminar">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
