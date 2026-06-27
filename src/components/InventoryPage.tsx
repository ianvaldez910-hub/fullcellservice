import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Boxes, Wrench } from 'lucide-react';
import { ModulesInventory } from './ModulesInventory';
import { SparePartsInventory } from './SparePartsInventory';
import { useAuth } from '@/hooks/useAuth';

export function InventoryPage() {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState<'modules' | 'parts'>('modules');

  return (
    <div className="p-2 sm:p-4 space-y-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList className="grid grid-cols-2 max-w-md">
          <TabsTrigger value="modules" className="gap-2"><Boxes className="h-4 w-4" />Ver Módulos</TabsTrigger>
          <TabsTrigger value="parts" className="gap-2" disabled={!isAdmin}><Wrench className="h-4 w-4" />Ver Repuestos</TabsTrigger>
        </TabsList>
        <TabsContent value="modules" className="mt-4">
          <div key="modules"><ModulesInventory /></div>
        </TabsContent>
        <TabsContent value="parts" className="mt-4">
          <div key="parts">
            {isAdmin ? <SparePartsInventory /> : <div className="text-center text-muted-foreground py-8">Acceso restringido</div>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}