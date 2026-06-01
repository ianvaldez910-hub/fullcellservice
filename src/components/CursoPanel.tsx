import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GraduationCap, Plus, Trash2, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';

interface Student {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string;
  estado_pago: string;
  monto_abonado: number;
  curso: string;
  fecha_registro: string;
}

const ESTADOS = [
  { value: 'pagado', label: 'Pagado' },
  { value: 'señado', label: 'Señado' },
];

const money = (n: number) => `$${(Number(n) || 0).toLocaleString('es-AR')}`;

function estadoBadge(estado: string) {
  if (estado === 'pagado') {
    return <Badge className="bg-green-600 hover:bg-green-600 text-white border-0">Pagado</Badge>;
  }
  return <Badge className="bg-red-600 hover:bg-red-600 text-white border-0">Señado</Badge>;
}

export function CursoPanel() {
  const { profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nombre: '', apellido: '', telefono: '', estado_pago: 'señado',
    monto_abonado: 0, curso: '',
  });
  const [receiptStudent, setReceiptStudent] = useState<Student | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const bName = profile?.business_name || 'Mi Taller';
  const logoUrl = (profile as any)?.logo_url as string | undefined;

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
      monto_abonado: Number(form.monto_abonado) || 0,
      curso: form.curso.trim(),
    });
    setSaving(false);
    if (error) {
      toast.error('No se pudo guardar: ' + error.message);
      return;
    }
    toast.success('Alumno registrado');
    setForm({ nombre: '', apellido: '', telefono: '', estado_pago: 'señado', monto_abonado: 0, curso: '' });
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

  const updateMonto = async (id: string, monto: number) => {
    setStudents(s => s.map(st => st.id === id ? { ...st, monto_abonado: monto } : st));
    const { error } = await supabase
      .from('course_students' as any)
      .update({ monto_abonado: monto })
      .eq('id', id);
    if (error) toast.error('Error actualizando monto');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este alumno?')) return;
    const { error } = await supabase.from('course_students' as any).delete().eq('id', id);
    if (error) { toast.error('Error eliminando'); return; }
    setStudents(s => s.filter(st => st.id !== id));
    toast.success('Alumno eliminado');
  };

  const sendReceipt = async (s: Student) => {
    setReceiptStudent(s);
    // wait for render
    await new Promise(r => setTimeout(r, 100));
    try {
      if (!receiptRef.current) throw new Error('Recibo no disponible');
      const canvas = await html2canvas(receiptRef.current, { backgroundColor: '#ffffff', scale: 2, useCORS: true, logging: false });
      const blob: Blob | null = await new Promise(res => canvas.toBlob(b => res(b), 'image/png', 0.95));
      if (!blob) throw new Error('No se pudo generar la imagen');

      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        toast.success('¡Recibo del alumno copiado! Presiona Ctrl+V en WhatsApp para enviarlo');
      } catch {
        // Fallback: download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `Recibo-${s.nombre}-${s.apellido}.png`;
        document.body.appendChild(a); a.click(); a.remove();
        URL.revokeObjectURL(url);
        toast.info('Imagen descargada. Adjuntala en WhatsApp.');
      }

      // Open WhatsApp chat
      const phone = (s.telefono || '').replace(/\D/g, '');
      const waUrl = phone ? `https://wa.me/${phone}` : 'https://wa.me/';
      window.open(waUrl, '_blank');
    } catch (e: any) {
      toast.error(e?.message || 'Error generando recibo');
    } finally {
      setTimeout(() => setReceiptStudent(null), 600);
    }
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
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
          <Input
            placeholder="Curso (ej: Reparación de celulares)"
            value={form.curso}
            onChange={e => setForm(f => ({ ...f, curso: e.target.value }))}
          />
          <Input
            type="number"
            inputMode="decimal"
            placeholder="Monto abonado / señado ($)"
            value={form.monto_abonado}
            onFocus={e => { if (e.target.value === '0') e.target.value = ''; }}
            onChange={e => setForm(f => ({ ...f, monto_abonado: Number(e.target.value) || 0 }))}
          />
          <Select value={form.estado_pago} onValueChange={v => setForm(f => ({ ...f, estado_pago: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ESTADOS.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={handleAdd} disabled={saving} className="gap-2 sm:col-span-2 lg:col-span-1">
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
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Nombre</th>
                <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Apellido</th>
                <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Teléfono</th>
                <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Curso</th>
                <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Monto</th>
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
                  <td className="p-3 text-xs">{s.curso || '—'}</td>
                  <td className="p-3">
                    <Input
                      type="number"
                      inputMode="decimal"
                      className="h-8 w-24 text-xs"
                      value={s.monto_abonado ?? 0}
                      onFocus={e => { if (e.target.value === '0') e.target.select(); }}
                      onChange={e => updateMonto(s.id, Number(e.target.value) || 0)}
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {estadoBadge(s.estado_pago)}
                      <Select value={s.estado_pago} onValueChange={v => updateEstado(s.id, v)}>
                        <SelectTrigger className="h-7 w-24 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ESTADOS.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge variant="secondary" className="text-xs">
                      {new Date(s.fecha_registro).toLocaleDateString('es-AR')}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        className="gap-1 h-8 bg-[#25D366] hover:bg-[#1da851] text-white"
                        onClick={() => sendReceipt(s)}
                      >
                        <Send className="h-3.5 w-3.5" />
                        Generar y Enviar Recibo
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(s.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Hidden receipt for rendering */}
      {receiptStudent && (
        <div className="fixed -left-[9999px] top-0">
          <div
            ref={receiptRef}
            className="w-[360px] bg-white text-black p-5 font-mono text-sm space-y-3"
          >
            <div className="text-center border-b border-dashed border-gray-400 pb-3">
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt={bName}
                  crossOrigin="anonymous"
                  className="h-14 w-14 rounded-full object-cover mx-auto mb-2 border"
                />
              )}
              <p className="text-lg font-bold">{bName}</p>
              <p className="text-xs opacity-70 mt-1">Recibo de Academia</p>
              <p className="text-[10px] opacity-60">{new Date().toLocaleString('es-AR')}</p>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between"><span className="opacity-70">Alumno:</span><span className="font-bold">{receiptStudent.nombre} {receiptStudent.apellido}</span></div>
              <div className="flex justify-between"><span className="opacity-70">Curso:</span><span>{receiptStudent.curso || '—'}</span></div>
              <div className="flex justify-between items-center">
                <span className="opacity-70">Estado:</span>
                <span
                  className="px-2 py-0.5 rounded text-white text-[11px] font-bold"
                  style={{ backgroundColor: receiptStudent.estado_pago === 'pagado' ? '#16a34a' : '#dc2626' }}
                >
                  {receiptStudent.estado_pago === 'pagado' ? 'PAGADO' : 'SEÑADO'}
                </span>
              </div>
            </div>
            <div className="border-t border-dashed border-gray-400 pt-2 flex justify-between font-bold text-base">
              <span>MONTO</span>
              <span className="font-mono">{money(receiptStudent.monto_abonado)}</span>
            </div>
            <div className="text-center text-[10px] opacity-70 pt-1">¡Gracias por confiar en nosotros!</div>
          </div>
        </div>
      )}
    </div>
  );
}
