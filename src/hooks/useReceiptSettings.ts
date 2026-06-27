import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type ReceiptSettings = {
  logo_url: string | null;
  bg_color: string;
  accent_color: string;
  text_color: string;
  font_family: string;
  header_text: string;
  footer_text: string;
};

export const DEFAULT_RECEIPT_SETTINGS: ReceiptSettings = {
  logo_url: null,
  bg_color: '#ffffff',
  accent_color: '#ec4899',
  text_color: '#0f172a',
  font_family: 'monospace',
  header_text: '',
  footer_text: 'Gracias por su compra',
};

export function useReceiptSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ReceiptSettings>(DEFAULT_RECEIPT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('receipt_settings' as any)
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) setSettings({ ...DEFAULT_RECEIPT_SETTINGS, ...(data as any) });
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user?.id]);

  const save = async (next: ReceiptSettings) => {
    if (!user) return { error: new Error('No auth') };
    const payload = { ...next, user_id: user.id };
    const { error } = await supabase.from('receipt_settings' as any).upsert(payload, { onConflict: 'user_id' });
    if (!error) setSettings(next);
    return { error };
  };

  return { settings, setSettings, save, loading, reload: load };
}