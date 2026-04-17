import { Button } from '@/components/ui/button';
import { ShieldX, CalendarX } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function Unauthorized() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { signOut } = useAuth();
  const reason = params.get('reason');
  const isExpired = reason === 'plan-expired';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
          {isExpired ? (
            <CalendarX className="h-7 w-7 text-destructive" />
          ) : (
            <ShieldX className="h-7 w-7 text-destructive" />
          )}
        </div>
        <h1 className="text-xl font-bold">
          {isExpired ? 'Plan Vencido' : 'Acceso restringido'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isExpired
            ? 'Tu plan ha vencido. Comunicate con el administrador para renovar tu suscripción.'
            : 'Solo personal autorizado puede acceder a esta sección.'}
        </p>
        <div className="flex gap-2 justify-center">
          {isExpired ? (
            <Button variant="outline" onClick={() => signOut()}>
              Cerrar sesión
            </Button>
          ) : (
            <Button variant="outline" onClick={() => navigate('/')}>
              Volver al inicio
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
