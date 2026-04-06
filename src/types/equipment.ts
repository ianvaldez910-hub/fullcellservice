export type EquipmentStatus = 
  | 'Pendiente'
  | 'En Reparación'
  | 'Esperando Repuesto'
  | 'Listo'
  | 'Entregado';

export type WarrantyDays = 0 | 30 | 60 | 90;

export interface Equipment {
  id: number;
  clientName: string;
  phone: string;
  altPhone: string;
  brand: string;
  model: string;
  security: string;
  securityPattern: number[];
  dateIn: string;
  dateEstimated: string;
  problem: string;
  budget: number;
  deposit: number;
  status: EquipmentStatus;
  warranty: WarrantyDays;
  internalNotes: string;
  images: string[]; // base64 encoded
}

export interface CashEntry {
  id: number;
  date: string;
  orderId: number;
  clientName: string;
  amount: number;
  concept: string;
}

export const STATUS_OPTIONS: EquipmentStatus[] = [
  'Pendiente',
  'En Reparación',
  'Esperando Repuesto',
  'Listo',
  'Entregado',
];

export const WARRANTY_OPTIONS: { value: WarrantyDays; label: string }[] = [
  { value: 0, label: 'Sin garantía' },
  { value: 30, label: '30 días' },
  { value: 60, label: '60 días' },
  { value: 90, label: '90 días' },
];

export const STATUS_CONFIG: Record<EquipmentStatus, { color: string; bg: string; icon: string }> = {
  'Pendiente': { color: 'text-status-pending', bg: 'bg-status-pending-bg', icon: '⏳' },
  'En Reparación': { color: 'text-status-repair', bg: 'bg-status-repair-bg', icon: '🔧' },
  'Esperando Repuesto': { color: 'text-status-waiting', bg: 'bg-status-waiting-bg', icon: '📦' },
  'Listo': { color: 'text-status-ready', bg: 'bg-status-ready-bg', icon: '✅' },
  'Entregado': { color: 'text-status-delivered', bg: 'bg-status-delivered-bg', icon: '🤝' },
};
