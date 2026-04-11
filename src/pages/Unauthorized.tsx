import { Button } from '@/components/ui/button';
import { ShieldX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <ShieldX className="h-7 w-7 text-destructive" />
        </div>
        <h1 className="text-xl font-bold">Acceso restringido</h1>
        <p className="text-sm text-muted-foreground">
          Solo personal autorizado puede acceder a esta sección.
        </p>
        <Button variant="outline" onClick={() => navigate('/')}>
          Volver al inicio
        </Button>
      </div>
    </div>
  );
}
