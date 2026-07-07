import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Wrench, LogIn, UserPlus, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { lovable } from '@/integrations/lovable/index';

// Detects if an input string looks like a phone number (digits, +, spaces, dashes)
function isPhone(v: string) {
  const s = v.trim();
  if (s.includes('@')) return false;
  return /^[+\d][\d\s\-()]{5,}$/.test(s);
}
function normalizePhone(v: string) {
  const s = v.trim().replace(/[\s\-()]/g, '');
  return s.startsWith('+') ? s : `+${s}`;
}

export default function Auth() {
  const { signIn } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [identifier, setIdentifier] = useState(''); // email or phone
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Forgot password modal
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotId, setForgotId] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = identifier.trim();
    if (!id) return toast.error('Ingresá tu correo o teléfono');
    if (password.length < 6) return toast.error('La contraseña debe tener al menos 6 caracteres');

    if (!isLogin && password !== confirmPassword) {
      return toast.error('Las contraseñas no coinciden');
    }

    const usingPhone = isPhone(id);
    setLoading(true);

    try {
      if (isLogin) {
        if (usingPhone) {
          const { error } = await supabase.auth.signInWithPassword({
            phone: normalizePhone(id), password,
          });
          if (error) toast.error(error.message);
        } else {
          const { error } = await signIn(id, password);
          if (error) toast.error(error.message);
        }
      } else {
        if (usingPhone) {
          const { error } = await supabase.auth.signUp({
            phone: normalizePhone(id), password,
          });
          if (error) toast.error(error.message);
          else toast.success('¡Cuenta creada! Verificá el código enviado por SMS.');
        } else {
          const redirectTo = `${window.location.origin}/`;
          const { error } = await supabase.auth.signUp({
            email: id, password,
            options: { emailRedirectTo: redirectTo },
          });
          if (error) toast.error(error.message);
          else toast.success('¡Cuenta creada! Revisá tu correo para confirmar.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = forgotId.trim();
    if (!id) return toast.error('Ingresá tu correo o teléfono');
    setForgotLoading(true);
    try {
      if (isPhone(id)) {
        const { error } = await supabase.auth.signInWithOtp({ phone: normalizePhone(id) });
        if (error) toast.error(error.message);
        else toast.success('Enviamos un código de recuperación por SMS.');
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(id, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) toast.error(error.message);
        else toast.success('Te enviamos un enlace de recuperación a tu correo.');
      }
      setForgotOpen(false);
      setForgotId('');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const redirectTo = window.location.origin;
      console.info('[auth] google OAuth start', { redirectTo, host: window.location.host });
      const result = await lovable.auth.signInWithOAuth('google', { redirect_uri: redirectTo });
      if (result.error) {
        console.error('[auth] google OAuth error', result.error);
        toast.error((result.error as any)?.message || 'No se pudo iniciar sesión con Google');
        setGoogleLoading(false);
        return;
      }
      if (result.redirected) {
        console.info('[auth] google OAuth redirect issued');
        return;
      }
      console.info('[auth] google OAuth session set');
    } catch (e: any) {
      console.error('[auth] google OAuth threw', { message: e?.message, stack: e?.stack });
      toast.error(e?.message || 'Error con Google');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-primary flex items-center justify-center">
            <Wrench className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">FullCell Service</h1>
          <p className="text-sm text-muted-foreground">
            {isLogin ? 'Inicia sesión en tu cuenta' : 'Crea tu cuenta — 3 días de prueba gratis'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Correo o Teléfono</Label>
            <Input
              type="text"
              inputMode="email"
              autoComplete={isLogin ? 'username' : 'email'}
              placeholder="tu@email.com o +54 9 11..."
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label>Contraseña</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading}
            />
            {!isLogin && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                Creá una contraseña única para tu cuenta de FullCell. Por tu seguridad, no uses la misma contraseña de tu correo personal.
              </p>
            )}
          </div>
          {!isLogin && (
            <div className="space-y-2">
              <Label>Confirmar contraseña</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
              />
            </div>
          )}
          {isLogin && (
            <div className="flex justify-end -mt-2">
              <button
                type="button"
                onClick={() => { setForgotId(identifier); setForgotOpen(true); }}
                className="text-xs text-primary hover:underline"
                disabled={loading}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}
          <Button type="submit" className="w-full gap-2" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando...
              </>
            ) : isLogin ? (
              <>
                <LogIn className="h-4 w-4" />
                Iniciar Sesión
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Registrarse
              </>
            )}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">o</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full gap-3 bg-white text-gray-800 hover:bg-gray-50 hover:text-gray-900 border-gray-300"
          onClick={handleGoogle}
          disabled={googleLoading || loading}
        >
          {googleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          Continuar con Google
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {isLogin ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}{' '}
          <button
            type="button"
            onClick={() => { setIsLogin(!isLogin); setConfirmPassword(''); }}
            className="text-primary font-medium hover:underline"
            disabled={loading}
          >
            {isLogin ? 'Registrate gratis' : 'Iniciá sesión'}
          </button>
        </p>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> Recuperar contraseña
            </DialogTitle>
            <DialogDescription>
              Ingresá tu correo o teléfono y te enviaremos un enlace o código para restablecer tu contraseña.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgot} className="space-y-4">
            <div className="space-y-2">
              <Label>Correo o Teléfono</Label>
              <Input
                type="text"
                placeholder="tu@email.com o +54 9 11..."
                value={forgotId}
                onChange={e => setForgotId(e.target.value)}
                required
                disabled={forgotLoading}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setForgotOpen(false)} disabled={forgotLoading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={forgotLoading} className="gap-2">
                {forgotLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Enviar enlace
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
