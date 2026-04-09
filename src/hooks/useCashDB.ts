import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface CashEntryItem {
  id: number;
  date: string;
  orderId: number;
  clientName: string;
  amount: number;
  concept: string;
}

export function useCashDB() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<CashEntryItem[]>([]);

  const fetchEntries = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('cash_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setEntries((data || []).map(e => ({
      id: e.id,
      date: e.date,
      orderId: e.order_id || 0,
      clientName: e.client_name,
      amount: Number(e.amount) || 0,
      concept: e.concept || '',
    })));
  }, [user]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const addEntry = useCallback(async (entry: Omit<CashEntryItem, 'id'>) => {
    if (!user) return;
    await supabase.from('cash_entries').insert({
      user_id: user.id,
      date: entry.date,
      order_id: entry.orderId,
      client_name: entry.clientName,
      amount: entry.amount,
      concept: entry.concept,
    });
    await fetchEntries();
  }, [user, fetchEntries]);

  const deleteEntry = useCallback(async (id: number) => {
    await supabase.from('cash_entries').delete().eq('id', id);
    await fetchEntries();
  }, [fetchEntries]);

  return { entries, addEntry, deleteEntry, refetch: fetchEntries };
}
