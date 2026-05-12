import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { GraduationCap, Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Student {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string;
  estado_pago: string;
  fecha_registro: string;
}

const ESTADOS = [
  { value: 'pagado', label: 'Pagado' },
  { value: 'señado', label: 'Señado' },
];

export function CursoPanel() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nombre: '', apellido: '', telefono: '', estado_pago: 'señado',
  });

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('course_students' as any)
      .select('*')
      .order('fecha_registro', { ascending: false });
    if (error) {
      toast.error('Error cargando alumnos');
    } else {
      setStudents((data as unknown as Student[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchStudents(); }, []);

  const handleAdd = async () => {
    if (!form.nombre.trim()) {
      toast.error('Ingresá el nombre');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('course_students' as any).insert({
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      telefono: form.telefono.trim(),
      estado_pago: form.estado_pago,
    });
    setSaving(false);
    if (error) {
      toast.error('No se pudo guardar: ' + error.message);
      return;
    }
    toast.success('Alumno registrado');
    setForm({ nombre: '', apellido: '', telefono: '', estado_pago: 'señado' });
    fetchStudents();
  };

  const updateEstado = async (id: string, estado: string) => {
    const { error } = await supabase
      .from('course_students' as any)
      .update({ estado_pago: estado })
      .eq('id', id);
    if (error) {
      toast.error('Error actualizando');
      return;
    }
    setStudents(s => s.map(st => st.id === id ? { ...st, estado_pago: estado } : st));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este alumno?')) return;
    const { error } = await supabase.from('course_students' as any).delete().eq('id', id);
    if (error) { toast.error('Error eliminando'); return; }
    setStudents(s => s.filter(st => st.id !== id));
    toast.success('Alumno eliminado');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
          <GraduationCap className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Curso</h2>
          <p className="text-xs text-muted-foreground">
            {students.length} alumno{students.length !== 1 ? 's' : ''} registrado{students.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm p-4 space-y-3">
        <h3 className="font-semibold text-sm">Nuevo alumno</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          <Input
            placeholder="Nombre"
            value={form.nombre}
            onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
          />
          <Input
            placeholder="Apellido"
            value={form.apellido}
            onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))}
          />
          <Input
            placeholder="Teléfono"
            inputMode="numeric"
            value={form.telefono}
            onChange={e => setForm(f => ({ ...f, telefono: e.target.value.replace(/\D/g, '') }))}
          />
          <Select value={form.estado_pago} onValueChange={v => setForm(f => ({ ...f, estado_pago: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ESTADOS.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={handleAdd} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {saving ? 'Guardando...' : 'Agregar'}
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Cargando alumnos...</div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Sin alumnos todavía.</div>
        ) : (
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Nombre</th>
                <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Apellido</th>
                <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Teléfono</th>
                <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Estado</th>
                <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Fecha</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id} className="border-b border-border/50 hover:bg-muted/50">
                  <td className="p-3 font-medium">{s.nombre || '—'}</td>
                  <td className="p-3">{s.apellido || '—'}</td>
                  <td className="p-3 font-mono text-xs">{s.telefono || '—'}</td>
                  <td className="p-3">
                    <Select value={s.estado_pago} onValueChange={v => updateEstado(s.id, v)}>
                      <SelectTrigger className="h-8 w-28 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ESTADOS.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3">
                    <Badge variant="secondary" className="text-xs">
                      {new Date(s.fecha_registro).toLocaleDateString('es-AR')}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(s.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
