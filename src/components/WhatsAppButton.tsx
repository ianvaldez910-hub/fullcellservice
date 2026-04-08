import { Equipment } from '@/types/equipment';
import { buildWhatsAppReadyMessage, openWhatsApp } from '@/lib/whatsapp';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface WhatsAppButtonProps {
  item: Equipment;
  size?: 'icon' | 'default';
  businessName?: string;
}

export function WhatsAppButton({ item, size = 'icon', businessName }: WhatsAppButtonProps) {
  const message = buildWhatsAppReadyMessage(item, businessName);
  const hasAlt = !!item.altPhone;

  const handleSend = (phone: string) => {
    openWhatsApp(phone, message);
  };

  if (!item.phone && !item.altPhone) return null;

  if (!hasAlt || !item.phone) {
    const phone = item.phone || item.altPhone;
    return (
      <Button
        variant="ghost"
        size={size === 'icon' ? 'icon' : 'default'}
        className={size === 'icon' ? 'h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50' : 'gap-2 text-green-600'}
        onClick={() => handleSend(phone)}
        title="Enviar WhatsApp"
      >
        <MessageCircle className="h-4 w-4" />
        {size !== 'icon' && 'WhatsApp'}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={size === 'icon' ? 'icon' : 'default'}
          className={size === 'icon' ? 'h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50' : 'gap-2 text-green-600'}
          title="Enviar WhatsApp"
        >
          <MessageCircle className="h-4 w-4" />
          {size !== 'icon' && 'WhatsApp'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => handleSend(item.phone)}>
          📱 Principal: {item.phone}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSend(item.altPhone)}>
          📞 Alternativo: {item.altPhone}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
