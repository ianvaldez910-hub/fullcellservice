import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Shield, CheckCircle, XCircle, Zap } from 'lucide-react';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'> & {
  plan_activo?: string | null;
  fecha_inicio_plan?: string | null;
  fecha_vencimiento_plan?: string | null;
};

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

const PLAN_OPTIONS = [
  { value: '1', label: '1 mes' },
  { value: '3', label: '3 meses' },
  { value: '6', label: '6 meses' },
  { value: '12', label: '12 meses' },
];

function getPlanInfo(p: Profile) {
  if (!p.fecha_vencimiento_plan) return null;
  const expiry = new Date(p.fecha_vencimiento_plan);
  const diffMs = expiry.getTime() - Date.now();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return { expiry, days, expired: diffMs <= 0 };
}

export function AdminPanel() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [activating, setActivating] = useState<string | null>(null);

  const fetchProfiles = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    setProfiles((data as Profile[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

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

  const activatePlan = async (userId: string) => {
    const months = Number(selected[userId]);
    if (!months) {
      toast.error('Seleccioná un plan primero');
      return;
    }
    setActivating(userId);
    const { error } = await supabase.rpc('activate_plan' as any, {
      _user_id: userId,
      _months: months,
    });
    setActivating(null);
    if (error) {
      toast.error('Error activando plan: ' + error.message);
    } else {
      toast.success(`Plan de ${months} meses activado`);
      fetchProfiles();
    }
  };

  if (loading)
    return <div className="p-8 text-center text-muted-foreground">Cargando usuarios...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
          <Shield className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Panel de Administración</h2>
          <p className="text-xs text-muted-foreground">
            {profiles.length} usuarios registrados
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="border-b">
              <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                Negocio
              </th>
              <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                Email
              </th>
              <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                Estado
              </th>
              <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                Plan / Días
              </th>
              <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                Activar plan
              </th>
              <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => {
              const planInfo = getPlanInfo(p);
              const isTrialExpired =
                p.license_status === 'trial' && new Date(p.trial_ends_at) < new Date();
              return (
                <tr key={p.id} className="border-b border-border/50 hover:bg-muted/50">
                  <td className="p-3 font-medium">{p.business_name}</td>
                  <td className="p-3 text-muted-foreground">{p.email}</td>
                  <td className="p-3">
                    <Badge className={`${STATUS_COLORS[p.license_status]} border-0`}>
                      {isTrialExpired ? '⚠️ Vencido' : STATUS_LABELS[p.license_status]}
                    </Badge>
                  </td>
                  <td className="p-3">
                    {p.plan_activo ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium">{p.plan_activo}</span>
                        {planInfo && (
                          <Badge
                            className={`border-0 w-fit text-xs ${
                              planInfo.expired
                                ? 'bg-destructive/10 text-destructive'
                                : planInfo.days <= 7
                                  ? 'bg-status-pending-bg text-status-pending'
                                  : 'bg-status-ready-bg text-status-ready'
                            }`}
                          >
                            {planInfo.expired
                              ? '⚠️ Vencido'
                              : `${planInfo.days} día${planInfo.days === 1 ? '' : 's'} restantes`}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sin plan</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1 items-center">
                      <Select
                        value={selected[p.user_id] || ''}
                        onValueChange={(v) =>
                          setSelected((prev) => ({ ...prev, [p.user_id]: v }))
                        }
                      >
                        <SelectTrigger className="h-8 w-28 text-xs">
                          <SelectValue placeholder="Plan" />
                        </SelectTrigger>
                        <SelectContent>
                          {PLAN_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        className="gap-1 text-xs h-8"
                        disabled={!selected[p.user_id] || activating === p.user_id}
                        onClick={() => activatePlan(p.user_id)}
                      >
                        <Zap className="h-3 w-3" />
                        Activar
                      </Button>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      {p.license_status !== 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-xs h-7"
                          onClick={() => updateLicense(p.user_id, 'active')}
                        >
                          <CheckCircle className="h-3 w-3" /> Activar
                        </Button>
                      )}
                      {p.license_status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-xs h-7 text-destructive"
                          onClick={() => updateLicense(p.user_id, 'inactive')}
                        >
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
