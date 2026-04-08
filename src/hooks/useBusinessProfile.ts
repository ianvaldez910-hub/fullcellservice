import { useState, useCallback } from 'react';

export interface BusinessProfile {
  businessName: string;
  whatsappNumber: string;
}

const PROFILE_KEY = 'workshop-profile';

function loadProfile(): BusinessProfile {
  try {
    const data = localStorage.getItem(PROFILE_KEY);
    if (data) return JSON.parse(data);
  } catch {}
  return { businessName: 'FullCell Service', whatsappNumber: '' };
}

function saveProfile(profile: BusinessProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function useBusinessProfile() {
  const [profile, setProfile] = useState<BusinessProfile>(loadProfile);

  const updateProfile = useCallback((data: Partial<BusinessProfile>) => {
    setProfile(prev => {
      const updated = { ...prev, ...data };
      saveProfile(updated);
      return updated;
    });
  }, []);

  return { profile, updateProfile };
}
