import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;

const STATUS_COLORS: Record<string, string> = {
  trial: 'bg-status-pending-bg text-status-pending',
  active: 'bg-status-ready-bg text-status-ready',
  inactive: 'bg-destructive/10 text-destructive',
};

const STATUS_LABELS: Record<string, string> = {
  trial: 'Prueba',
  active: 'Activo',
  inactive: 'Inactivo',
};

export function AdminPanel() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfiles = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setProfiles(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchProfiles(); }, []);

  const updateLicense = async (userId: string, status: 'active' | 'inactive') => {
    const { error } = await supabase
      .from('profiles')
      .update({ license_status: status })
      .eq('user_id', userId);
    if (error) {
      toast.error('Error actualizando licencia');
    } else {
      toast.success(`Licencia ${status === 'active' ? 'activada' : 'desactivada'}`);
      fetchProfiles();
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Cargando usuarios...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
          <Shield className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Panel de Administración</h2>
          <p className="text-xs text-muted-foreground">{profiles.length} usuarios registrados</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Negocio</th>
              <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Email</th>
              <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Estado</th>
              <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Prueba hasta</th>
              <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map(p => {
              const isExpired = p.license_status === 'trial' && new Date(p.trial_ends_at) < new Date();
              return (
                <tr key={p.id} className="border-b border-border/50 hover:bg-muted/50">
                  <td className="p-3 font-medium">{p.business_name}</td>
                  <td className="p-3 text-muted-foreground">{p.email}</td>
                  <td className="p-3">
                    <Badge className={`${STATUS_COLORS[p.license_status]} border-0`}>
                      {isExpired ? '⚠️ Vencido' : STATUS_LABELS[p.license_status]}
                    </Badge>
                  </td>
                  <td className="p-3 font-mono text-xs">
                    {new Date(p.trial_ends_at).toLocaleDateString('es-AR')}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      {p.license_status !== 'active' && (
                        <Button size="sm" variant="outline" className="gap-1 text-xs h-7"
                          onClick={() => updateLicense(p.user_id, 'active')}>
                          <CheckCircle className="h-3 w-3" /> Activar
                        </Button>
                      )}
                      {p.license_status === 'active' && (
                        <Button size="sm" variant="outline" className="gap-1 text-xs h-7 text-destructive"
                          onClick={() => updateLicense(p.user_id, 'inactive')}>
                          <XCircle className="h-3 w-3" /> Desactivar
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
