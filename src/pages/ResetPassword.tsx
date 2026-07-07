import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wrench, Loader2, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase recovery link sets a session in the URL hash. Wait until it's parsed.
    const hash = window.location.hash || '';
    const isRecovery = hash.includes('type=recovery') || hash.includes('access_token');
    if (!isRecovery) {
      // Still allow if there's already a session (e.g. OTP flow)
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) setReady(true);
        else toast.error('Enlace de recuperación inválido o expirado');
      });
      return;
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true);
    });
    // Fallback: check current session right away
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error('La contraseña debe tener al menos 6 caracteres');
    if (password !== confirm) return toast.error('Las contraseñas no coinciden');
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDone(true);
    toast.success('Contraseña actualizada. Redirigiendo...');
    setTimeout(() => { window.location.href = '/'; }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-primary flex items-center justify-center">
            <Wrench className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Nueva Contraseña</h1>
          <p className="text-sm text-muted-foreground">Elegí una contraseña única para tu cuenta.</p>
        </div>

        {!ready ? (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Verificando enlace...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nueva contraseña</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} disabled={loading || done} />
            </div>
            <div className="space-y-2">
              <Label>Confirmar contraseña</Label>
              <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={6} disabled={loading || done} />
            </div>
            <Button type="submit" className="w-full gap-2" disabled={loading || done}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</> : <><KeyRound className="h-4 w-4" /> Actualizar contraseña</>}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}