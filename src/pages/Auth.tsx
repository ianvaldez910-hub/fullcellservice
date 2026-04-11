import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wrench, LogIn, UserPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Auth() {
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = isLogin
      ? await signIn(email, password)
      : await signUp(email, password);
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else if (!isLogin) {
      toast.success('¡Cuenta creada! Revisa tu correo para confirmar.');
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
            <Label>Correo Electrónico</Label>
            <Input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
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
          </div>
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

        <p className="text-center text-sm text-muted-foreground">
          {isLogin ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}{' '}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary font-medium hover:underline"
            disabled={loading}
          >
            {isLogin ? 'Registrate gratis' : 'Iniciá sesión'}
          </button>
        </p>
      </div>
    </div>
  );
}
