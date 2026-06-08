import { Equipment } from '@/types/equipment';

const TRACKING_BASE_URL =
  (typeof window !== 'undefined' ? window.location.origin : 'https://fullcellservice.lovable.app');

const STATUS_EMOJI: Record<string, string> = {
  'Pendiente': '⏳',
  'En Reparación': '🛠️',
  'Esperando Repuesto': '📦',
  'Listo': '✅',
  'Entregado': '🤝',
};

/**
 * Format phone for Argentina WhatsApp: expects number without 0 or 15
 * e.g. "1155667788" → "5491155667788"
 */
export function formatPhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('549')) return digits;
  if (digits.startsWith('54')) return digits;
  return `549${digits}`;
}

export function buildWhatsAppReadyMessage(item: Equipment, businessName?: string): string {
  const from = businessName || 'FullCell Service';
  const emoji = STATUS_EMOJI[item.status] || '🔔';
  const trackingUrl = `${TRACKING_BASE_URL}/seguimiento?orden=${item.id}`;
  let msg =
    `¡Hola ${item.clientName}! 👋 Te informamos desde ${from} que el estado de tu ` +
    `${item.brand} ${item.model} ha cambiado a: ${emoji} ${item.status}.`;
  if (item.status === 'Listo') {
    const remaining = (item.budget || 0) - (item.deposit || 0);
    msg += ` Saldo pendiente: $${remaining.toLocaleString()}.`;
  }
  msg += `\n\nSeguimiento en vivo: ${trackingUrl}`;
  if (item.hasHumidity) {
    msg += `\n\n⚠️ Nota: el equipo fue ingresado con evidencia de humedad/sulfato.`;
  }
  return msg;
}

export function openWhatsApp(phone: string, message: string) {
  const formatted = formatPhoneForWhatsApp(phone);
  const url = `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

export function validateArgPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 13;
}
