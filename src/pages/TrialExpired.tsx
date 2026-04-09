import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Wrench, LogOut, MessageCircle } from 'lucide-react';

export default function TrialExpired() {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <Wrench className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Período de Prueba Vencido</h1>
          <p className="text-muted-foreground">
            Tu período de prueba ha vencido. Contacta a <strong>Ian Valdez</strong> para activar tu licencia permanente.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Button
            className="gap-2"
            onClick={() => window.open('https://wa.me/5491155667788?text=Hola%20Ian%2C%20quiero%20activar%20mi%20licencia%20de%20FullCell%20Service', '_blank')}
          >
            <MessageCircle className="h-4 w-4" />
            Contactar a Ian Valdez
          </Button>
          <Button variant="outline" className="gap-2" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </div>
  );
}
