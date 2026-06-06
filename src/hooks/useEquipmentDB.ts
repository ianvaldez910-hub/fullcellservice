import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Tables } from '@/integrations/supabase/types';
import type { EquipmentStatus } from '@/types/equipment';

type EquipmentRow = Tables<'equipment'>;

export interface EquipmentItem {
  id: number;
  orderNumber: number;
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
  warranty: number;
  internalNotes: string;
  images: string[];
  hasHumidity: boolean;
}

function rowToItem(row: EquipmentRow): EquipmentItem {
  return {
    id: row.id,
    orderNumber: row.order_number,
    clientName: row.client_name,
    phone: row.phone || '',
    altPhone: row.alt_phone || '',
    brand: row.brand,
    model: row.model,
    security: row.security_text || '',
    securityPattern: row.security_pattern || [],
    dateIn: row.date_in,
    dateEstimated: row.date_estimated || '',
    problem: row.problem,
    budget: Number(row.budget) || 0,
    deposit: Number(row.deposit) || 0,
    status: row.status as EquipmentStatus,
    warranty: row.warranty,
    internalNotes: row.internal_notes || '',
    images: row.images || [],
    hasHumidity: row.has_humidity,
  };
}

export function useEquipmentDB() {
  const { user } = useAuth();
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('equipment')
      .select('*')
      .eq('user_id', user.id)
      .order('order_number', { ascending: false });
    setItems((data || []).map(rowToItem));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // Realtime: refetch on any change to equipment for this user (multiusuario)
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`equipment-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipment', filter: `user_id=eq.${user.id}` }, () => {
        fetchItems();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchItems]);

  const addEquipment = useCallback(async (data: Omit<EquipmentItem, 'id' | 'orderNumber'>) => {
    if (!user) return;
    const { data: nextNum } = await supabase.rpc('next_order_number', { _user_id: user.id });
    const { error } = await supabase.from('equipment').insert({
      user_id: user.id,
      order_number: nextNum || 1,
      client_name: data.clientName,
      phone: data.phone,
      alt_phone: data.altPhone,
      brand: data.brand,
      model: data.model,
      security_text: data.security,
      security_pattern: data.securityPattern,
      date_in: data.dateIn,
      date_estimated: data.dateEstimated || null,
      problem: data.problem,
      budget: data.budget,
      deposit: data.deposit,
      status: data.status as any,
      warranty: data.warranty,
      internal_notes: data.internalNotes,
      images: data.images,
      has_humidity: data.hasHumidity,
    });
    if (!error) {
      // Auto-register deposit as cash entry if deposit > 0
      if (data.deposit > 0) {
        await supabase.from('cash_entries').insert({
          user_id: user.id,
          date: data.dateIn,
          order_id: nextNum || 1,
          client_name: data.clientName,
          amount: data.deposit,
          concept: `Seña - ${data.brand} ${data.model}`,
        });
      }
      await fetchItems();
    }
    return { error };
  }, [user, fetchItems]);

  const updateEquipment = useCallback(async (id: number, data: Partial<EquipmentItem>) => {
    if (!user) return { error: new Error('No user') };

    // Get current item to detect status change
    const currentItem = items.find(i => i.id === id);

    const update: any = {};
    if (data.clientName !== undefined) update.client_name = data.clientName;
    if (data.phone !== undefined) update.phone = data.phone;
    if (data.altPhone !== undefined) update.alt_phone = data.altPhone;
    if (data.brand !== undefined) update.brand = data.brand;
    if (data.model !== undefined) update.model = data.model;
    if (data.security !== undefined) update.security_text = data.security;
    if (data.securityPattern !== undefined) update.security_pattern = data.securityPattern;
    if (data.dateIn !== undefined) update.date_in = data.dateIn;
    if (data.dateEstimated !== undefined) update.date_estimated = data.dateEstimated || null;
    if (data.problem !== undefined) update.problem = data.problem;
    if (data.budget !== undefined) update.budget = data.budget;
    if (data.deposit !== undefined) update.deposit = data.deposit;
    if (data.status !== undefined) update.status = data.status;
    if (data.warranty !== undefined) update.warranty = data.warranty;
    if (data.internalNotes !== undefined) update.internal_notes = data.internalNotes;
    if (data.images !== undefined) update.images = data.images;
    if (data.hasHumidity !== undefined) update.has_humidity = data.hasHumidity;

    const { error } = await supabase.from('equipment').update(update).eq('id', id);
    if (!error) {
      // Auto-register balance as cash entry when status changes to Entregado
      if (data.status === 'Entregado' && currentItem && currentItem.status !== 'Entregado') {
        const budget = Number(currentItem.budget) || 0;
        const deposit = Number(currentItem.deposit) || 0;
        const balance = budget - deposit;
        if (balance > 0) {
          const today = new Date().toISOString().split('T')[0];
          try {
            await supabase.from('cash_entries').insert({
              user_id: user.id,
              date: today,
              order_id: currentItem.orderNumber,
              client_name: currentItem.clientName || '',
              amount: balance,
              concept: `Saldo - ${currentItem.brand || ''} ${currentItem.model || ''}`.trim(),
            });
          } catch (e) {
            console.error('Failed to auto-register cash entry:', e);
          }
        }
      }
      await fetchItems();
    }
    return { error };
  }, [user, items, fetchItems]);

  const deleteEquipment = useCallback(async (id: number) => {
    const { error } = await supabase.from('equipment').delete().eq('id', id);
    if (!error) await fetchItems();
    return { error };
  }, [fetchItems]);

  const getStatusCounts = useCallback(() => {
    const counts: Record<EquipmentStatus, number> = {
      'Pendiente': 0, 'En Reparación': 0, 'Esperando Repuesto': 0, 'Listo': 0, 'Entregado': 0,
    };
    items.forEach(item => { counts[item.status]++; });
    return counts;
  }, [items]);

  return { items, loading, addEquipment, updateEquipment, deleteEquipment, getStatusCounts, refetch: fetchItems };
}
