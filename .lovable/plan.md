# Plan de actualización FullCell Service

Voy a implementar 5 mejoras agrupadas. Algunas son de UI/UX, otras tocan base de datos y hooks. Todo respeta los datos existentes (no se borra nada).

## 1. Realtime multiusuario simultáneo
- Habilitar replicación realtime en las tablas: `equipment`, `cash_entries`, `modules_inventory`, `general_products`, `sales_history`, `course_students`, `profiles` (vía migración `ALTER PUBLICATION supabase_realtime ADD TABLE ...`).
- En los hooks (`useEquipmentDB`, `useCashDB`, `useProfileDB`, y los `useEffect` de carga dentro de `ModulesInventory`, `AccessoriesPOS`, `CursoPanel`, `AdminPanel`): agregar `supabase.channel('<tabla>-<userId>').on('postgres_changes', { event: '*', schema: 'public', table: '<tabla>' }, () => refetch())`, con cleanup en el unmount.
- No tocar la persistencia de sesión (ya está en `localStorage` y Supabase permite múltiples sesiones por defecto). Confirmar que no hay lógica de "sesión única" en `useAuth`.

## 2. Nombre del cliente en recibo de Inventario General
- En `AccessoriesPOS.tsx`: agregar un `Input` "Nombre del Cliente" arriba/al lado del carrito. Estado `customerName`.
- Al confirmar venta: incluir `customer_name` en el insert a `sales_history` (la columna `items_sold` jsonb ya puede llevarlo, pero además añadimos columna dedicada `customer_name TEXT DEFAULT 'Consumidor Final'` vía migración).
- En el recibo generado (modal/imagen): mostrar `Cliente: {customerName || 'Consumidor Final'}` en la cabecera.

## 3. Renombrar a "Inventario General"
- `src/pages/Index.tsx`: cambiar el label del menú lateral y header de `Ventas y Stock de Accesorios` → `Inventario General`. El `Page` key se mantiene `accessories` internamente (no hay rutas de React Router separadas para esta vista; todo se renderiza condicional desde `Index`).

## 4. Diseño responsive móvil
- El `Sidebar` de shadcn ya es colapsable/offcanvas en mobile vía `SidebarTrigger`. Asegurar que el botón hamburguesa (`SidebarTrigger`) sea siempre visible en el header (ya lo está).
- Revisar tablas en `EquipmentTable`, `ModulesInventory`, `AccessoriesPOS`: envolver en `<div className="overflow-x-auto -mx-4 px-4">` y aumentar tap targets (`h-10` en botones de acción mobile).
- Ajustar paddings del header y main (`px-3 sm:px-6`) y grids (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`) donde haga falta.

## 5. Panel de Apariencia Premium en Ajustes
- Nuevo componente `src/components/AppearanceSettings.tsx`:
  - Switch Claro/Oscuro (reutiliza la lógica de `ThemeToggle`).
  - Grid de 7 botones circulares con paletas predefinidas: Zafiro `#1E40AF`, Esmeralda `#059669`, Oro Rosa `#E11D88` (rosa premium), Carmesí `#DC2626`, Titanio `#475569`, Amatista `#7C3AED`, Sunset `#F59E0B`. Cada uno es un círculo con `style={{background: hex}}` y nombre debajo.
  - `<input type="color">` oculto camuflado bajo un botón elegante que muestra el HEX actual.
- Aplicación dinámica: una utilidad `applyPrimaryColor(hex)` convierte HEX → HSL y actualiza `document.documentElement.style.setProperty('--primary', 'H S% L%')` y `--ring`. Persistencia en `localStorage` con clave `app-primary-color`.
- Bootstrap al inicio: en `src/main.tsx` (o `App.tsx`) leer `localStorage` y aplicar al cargar para evitar flash.
- Integrar el nuevo panel dentro de `BusinessProfileSettings` (sección "Apariencia") o como card aparte renderizada antes del perfil en la página `settings`.

## Detalles técnicos

**Conversión HEX → HSL** (utilitario en `src/lib/color.ts`):
```ts
export function hexToHsl(hex: string): string {
  // returns "H S% L%" tokens compatible con index.css
}
export function applyPrimary(hex: string) {
  const hsl = hexToHsl(hex);
  document.documentElement.style.setProperty('--primary', hsl);
  document.documentElement.style.setProperty('--ring', hsl);
  localStorage.setItem('app-primary-color', hex);
}
```

**Migración SQL** (una sola migración):
```sql
ALTER TABLE public.sales_history ADD COLUMN IF NOT EXISTS customer_name TEXT NOT NULL DEFAULT 'Consumidor Final';
ALTER PUBLICATION supabase_realtime ADD TABLE public.equipment;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cash_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.modules_inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE public.general_products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.course_students;
ALTER TABLE public.equipment REPLICA IDENTITY FULL;
ALTER TABLE public.cash_entries REPLICA IDENTITY FULL;
ALTER TABLE public.modules_inventory REPLICA IDENTITY FULL;
ALTER TABLE public.general_products REPLICA IDENTITY FULL;
ALTER TABLE public.sales_history REPLICA IDENTITY FULL;
ALTER TABLE public.course_students REPLICA IDENTITY FULL;
```

## Archivos a crear / editar
- **Crear**: `src/components/AppearanceSettings.tsx`, `src/lib/color.ts`, una migración SQL.
- **Editar**: `src/pages/Index.tsx`, `src/components/AccessoriesPOS.tsx`, `src/components/ModulesInventory.tsx`, `src/components/BusinessProfileSettings.tsx`, `src/hooks/useEquipmentDB.ts`, `src/hooks/useCashDB.ts`, `src/hooks/useProfileDB.ts`, `src/main.tsx` (bootstrap color), `src/components/CursoPanel.tsx` y `src/components/AdminPanel.tsx` (realtime).

¿Confirmás que avance con todo esto?