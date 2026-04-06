export type EquipmentStatus = 
  | 'Pendiente'
  | 'En Reparación'
  | 'Esperando Repuesto'
  | 'Listo'
  | 'Entregado';

export interface Equipment {
  id: number;
  clientName: string;
  brand: string;
  model: string;
  security: string;
  dateIn: string;
  dateEstimated: string;
  problem: string;
  budget: number;
  deposit: number;
  status: EquipmentStatus;
  internalNotes: string;
}

export const STATUS_OPTIONS: EquipmentStatus[] = [
  'Pendiente',
  'En Reparación',
  'Esperando Repuesto',
  'Listo',
  'Entregado',
];

export const STATUS_CONFIG: Record<EquipmentStatus, { color: string; bg: string; icon: string }> = {
  'Pendiente': { color: 'text-status-pending', bg: 'bg-status-pending-bg', icon: '⏳' },
  'En Reparación': { color: 'text-status-repair', bg: 'bg-status-repair-bg', icon: '🔧' },
  'Esperando Repuesto': { color: 'text-status-waiting', bg: 'bg-status-waiting-bg', icon: '📦' },
  'Listo': { color: 'text-status-ready', bg: 'bg-status-ready-bg', icon: '✅' },
  'Entregado': { color: 'text-status-delivered', bg: 'bg-status-delivered-bg', icon: '🤝' },
};
