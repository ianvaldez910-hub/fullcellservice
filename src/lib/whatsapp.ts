import { Equipment } from '@/types/equipment';

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
  const remaining = (item.budget || 0) - (item.deposit || 0);
  const from = businessName || 'el servicio técnico';
  let msg = `Hola ${item.clientName}, te informamos desde ${from} que tu ${item.brand} ${item.model} ya se encuentra listo para retirar. El saldo pendiente es de $${remaining.toLocaleString()}. ¡Te esperamos!`;
  if (item.hasHumidity) {
    msg += `\n\n⚠️ Nota: El equipo fue ingresado con evidencia de humedad/sulfato.`;
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
