import { useState, useCallback } from 'react';
import { Equipment, EquipmentStatus } from '@/types/equipment';

const STORAGE_KEY = 'workshop-equipment';

function loadEquipment(): Equipment[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveEquipment(items: Equipment[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function getNextId(items: Equipment[]): number {
  if (items.length === 0) return 1;
  return Math.max(...items.map(i => i.id)) + 1;
}

export function useEquipment() {
  const [items, setItems] = useState<Equipment[]>(loadEquipment);

  const addEquipment = useCallback((data: Omit<Equipment, 'id'>) => {
    setItems(prev => {
      const newItems = [...prev, { ...data, id: getNextId(prev) }];
      saveEquipment(newItems);
      return newItems;
    });
  }, []);

  const updateEquipment = useCallback((id: number, data: Partial<Equipment>) => {
    setItems(prev => {
      const newItems = prev.map(item => item.id === id ? { ...item, ...data } : item);
      saveEquipment(newItems);
      return newItems;
    });
  }, []);

  const deleteEquipment = useCallback((id: number) => {
    setItems(prev => {
      const newItems = prev.filter(item => item.id !== id);
      saveEquipment(newItems);
      return newItems;
    });
  }, []);

  const getStatusCounts = useCallback(() => {
    const counts: Record<EquipmentStatus, number> = {
      'Pendiente': 0,
      'En Reparación': 0,
      'Esperando Repuesto': 0,
      'Listo': 0,
      'Entregado': 0,
    };
    items.forEach(item => { counts[item.status]++; });
    return counts;
  }, [items]);

  return { items, addEquipment, updateEquipment, deleteEquipment, getStatusCounts };
}
