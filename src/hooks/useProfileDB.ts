import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useProfileDB() {
  const { profile, refreshProfile } = useAuth();

  const updateProfile = useCallback(async (data: {
    business_name?: string;
    whatsapp_number?: string;
    email?: string;
    address?: string;
    city?: string;
    business_hours?: string;
  }) => {
    if (!profile) return;
    await supabase
      .from('profiles')
      .update(data)
      .eq('user_id', profile.user_id);
    await refreshProfile();
  }, [profile, refreshProfile]);

  return { profile, updateProfile };
}
