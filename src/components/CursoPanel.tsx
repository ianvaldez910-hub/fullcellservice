import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DialogFooter } from '@/components/ui/dialog';
import { GraduationCap, Plus, Trash2, Loader2, Receipt, Download, Image as ImageIcon, Users, Pencil } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';

interface Student {
  id: string;
  nombre: string;
  apellido: string;
  dni?: string | null;
  telefono: string;
  estado_pago: string;
  monto_abonado: number;
  curso: string;
  fecha_registro: string;
  edition?: string | null;
  clase_1?: boolean;
  clase_2?: boolean;
  clase_3?: boolean;
  clase_4?: boolean;
}

const ESTADOS = [
  { value: 'pagado', label: 'Pagado' },
  { value: 'señado', label: 'Señado' },
];

const money = (n: number) => `$${(Number(n) || 0).toLocaleString('es-AR')}`;

interface EditionRow { id: string; name: string; }

function estadoBadge(estado: string) {
  if (estado === 'pagado') {
    return <Badge className="bg-green-600 hover:bg-green-600 text-white border-0">Pagado</Badge>;
  }
  return <Badge className="bg-red-600 hover:bg-red-600 text-white border-0">Señado</Badge>;
}

export function CursoPanel() {
  const { profile, isAdmin } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [editionsList, setEditionsList] = useState<EditionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nombre: '', apellido: '', dni: '', telefono: '', estado_pago: 'señado',
    monto_abonado: 0, curso: '', edition: '',
  });
  const [activeEdition, setActiveEdition] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [receiptStudent, setReceiptStudent] = useState<Student | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Edition management modal
  const [editionModalOpen, setEditionModalOpen] = useState(false);
  const [editionForm, setEditionForm] = useState<{ id: string | null; name: string }>({ id: null, name: '' });
  const [editionSaving, setEditionSaving] = useState(false);

  const bName = profile?.business_name || 'Mi Taller';
  const bAddress = (profile as any)?.address ? `${(profile as any).address}${(profile as any).city ? `, ${(profile as any).city}` : ''}` : '';
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

  const fetchEditions = async () => {
    const { data, error } = await supabase
      .from('course_editions' as any)
      .select('*')
      .order('created_at', { ascending: true });
    if (error) {
      toast.error('Error cargando ediciones');
    } else {
      setEditionsList((data as unknown as EditionRow[]) || []);
    }
  };

  useEffect(() => { fetchStudents(); fetchEditions(); }, []);

  const handleAdd = async () => {
    if (!form.nombre.trim()) {
      toast.error('Ingresá el nombre');
      return;
    }
    if (!form.dni.trim() || form.dni.trim().length < 6) {
      toast.error('Ingresá un DNI válido (mínimo 6 caracteres)');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('course_students' as any).insert({
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      dni: form.dni.trim(),
      telefono: form.telefono.trim(),
      estado_pago: form.estado_pago,
      monto_abonado: Number(form.monto_abonado) || 0,
      curso: form.curso.trim(),
      edition: form.edition || null,
    });
    setSaving(false);
    if (error) {
      toast.error('No se pudo guardar: ' + error.message);
      return;
    }
    toast.success('Alumno registrado');
    setForm({ nombre: '', apellido: '', dni: '', telefono: '', estado_pago: 'señado', monto_abonado: 0, curso: '', edition: form.edition });
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

  const updateEdition = async (id: string, edition: string) => {
    setStudents(s => s.map(st => st.id === id ? { ...st, edition } : st));
    const { error } = await supabase.from('course_students' as any).update({ edition }).eq('id', id);
    if (error) toast.error('Error actualizando edición');
  };

  const updateDni = async (id: string, dni: string) => {
    setStudents(s => s.map(st => st.id === id ? { ...st, dni } : st));
    const { error } = await supabase.from('course_students' as any).update({ dni }).eq('id', id);
    if (error) toast.error('Error actualizando DNI');
  };

  const toggleClase = async (id: string, field: 'clase_1' | 'clase_2' | 'clase_3' | 'clase_4', value: boolean) => {
    setStudents(s => s.map(st => st.id === id ? { ...st, [field]: value } : st));
    const { error } = await supabase.from('course_students' as any).update({ [field]: value }).eq('id', id);
    if (error) toast.error('Error actualizando asistencia');
  };

  // Editions come from DB + any historical edition present in student rows
  const editions = useMemo(() => {
    const set = new Set<string>();
    editionsList.forEach(e => set.add(e.name));
    students.forEach(s => { if (s.edition) set.add(s.edition); });
    return Array.from(set);
  }, [students, editionsList]);

  // Keep the "new student" form edition valid as editions load/change
  useEffect(() => {
    if (!form.edition && editions.length > 0) {
      setForm(f => ({ ...f, edition: editions[0] }));
    }
  }, [editions, form.edition]);

  const openNewEdition = () => { setEditionForm({ id: null, name: '' }); setEditionModalOpen(true); };
  const openEditEdition = (e: EditionRow) => { setEditionForm({ id: e.id, name: e.name }); setEditionModalOpen(true); };

  const saveEdition = async () => {
    const name = editionForm.name.trim();
    if (!name) { toast.error('Ingresá el nombre de la edición'); return; }
    setEditionSaving(true);
    if (editionForm.id) {
      const oldName = editionsList.find(e => e.id === editionForm.id)?.name;
      const { error } = await supabase.from('course_editions' as any).update({ name }).eq('id', editionForm.id);
      if (!error && oldName && oldName !== name) {
        // propagate rename to students
        await supabase.from('course_students' as any).update({ edition: name }).eq('edition', oldName);
      }
      if (error) { toast.error('No se pudo actualizar: ' + error.message); setEditionSaving(false); return; }
      toast.success('Edición actualizada');
    } else {
      const { error } = await supabase.from('course_editions' as any).insert({ name });
      if (error) { toast.error('No se pudo crear: ' + error.message); setEditionSaving(false); return; }
      toast.success('Edición creada');
    }
    setEditionSaving(false);
    setEditionModalOpen(false);
    await fetchEditions();
    await fetchStudents();
  };

  const deleteEdition = async (e: EditionRow) => {
    if (!confirm(`¿Eliminar "${e.name}"? Los alumnos asignados quedarán sin edición.`)) return;
    const { error } = await supabase.from('course_editions' as any).delete().eq('id', e.id);
    if (error) { toast.error('No se pudo eliminar: ' + error.message); return; }
    toast.success('Edición eliminada');
    if (activeEdition === e.name) setActiveEdition('all');
    await fetchEditions();
  };

  // Group by edition
  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matches = (s: Student) => {
      if (!q) return true;
      const dni = (s.dni || '').toLowerCase().replace(/\./g, '');
      const nq = q.replace(/\./g, '');
      return (
        (s.nombre || '').toLowerCase().includes(q) ||
        (s.apellido || '').toLowerCase().includes(q) ||
        dni.includes(nq) ||
        (s.telefono || '').includes(q)
      );
    };
    const list = activeEdition === 'all' ? editions : [activeEdition];
    return list.map(ed => ({
      edition: ed,
      students: students.filter(s => (s.edition || 'Sin asignar') === ed && matches(s)),
    })).concat(
      activeEdition === 'all'
        ? [{ edition: 'Sin asignar', students: students.filter(s => !s.edition && matches(s)) }]
        : []
    ).filter(g => g.students.length > 0 || activeEdition !== 'all');
  }, [students, editions, activeEdition, search]);

  const openReceipt = (s: Student) => {
    setReceiptStudent(s);
    setReceiptOpen(true);
  };

  const genReceiptBlob = async (): Promise<Blob | null> => {
    if (!receiptRef.current) return null;
    const canvas = await html2canvas(receiptRef.current, { backgroundColor: '#ffffff', scale: 2, useCORS: true, logging: false });
    return await new Promise(res => canvas.toBlob(b => res(b), 'image/png', 0.95));
  };

  const downloadReceipt = async () => {
    try {
      const blob = await genReceiptBlob();
      if (!blob || !receiptStudent) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Recibo-${receiptStudent.nombre}-${receiptStudent.apellido}.png`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast.success('Imagen descargada');
    } catch (e: any) { toast.error(e?.message || 'Error al descargar'); }
  };

  const shareReceipt = async () => {
    try {
      const blob = await genReceiptBlob();
      if (!blob || !receiptStudent) return;
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        toast.success('¡Recibo copiado! Presiona Ctrl+V en WhatsApp para enviarlo');
      } catch {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `Recibo-${receiptStudent.nombre}-${receiptStudent.apellido}.png`;
        document.body.appendChild(a); a.click(); a.remove();
        URL.revokeObjectURL(url);
        toast.info('Imagen descargada. Adjuntala en WhatsApp.');
      }
      const phone = (receiptStudent.telefono || '').replace(/\D/g, '');
      const waUrl = phone ? `https://wa.me/${phone}` : 'https://wa.me/';
      window.open(waUrl, '_blank');
    } catch (e: any) { toast.error(e?.message || 'Error generando recibo'); }
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

      {/* Filtros por Edición */}
      <div className="flex flex-wrap gap-2 items-center bg-card border rounded-xl p-3">
        <span className="text-xs font-semibold text-muted-foreground mr-1">Edición:</span>
        <Button size="sm" variant={activeEdition === 'all' ? 'default' : 'outline'} onClick={() => setActiveEdition('all')}>Ver Todos</Button>
        {editions.map(ed => (
          <Button
            key={ed}
            size="sm"
            variant={activeEdition === ed ? 'default' : 'outline'}
            className={activeEdition === ed ? 'bg-pink-600 hover:bg-pink-700 text-white' : ''}
            onClick={() => setActiveEdition(ed)}
          >
            {ed}
          </Button>
        ))}
        {isAdmin && (
          <>
            <div className="w-px h-6 bg-border mx-1" />
            <Button size="sm" onClick={openNewEdition} className="bg-pink-600 hover:bg-pink-700 text-white gap-1">
              <Plus className="h-4 w-4" /> Nueva Edición
            </Button>
            {activeEdition !== 'all' && editionsList.some(e => e.name === activeEdition) && (
              <>
                <Button size="sm" variant="outline" className="gap-1" onClick={() => {
                  const e = editionsList.find(x => x.name === activeEdition);
                  if (e) openEditEdition(e);
                }}>
                  <Pencil className="h-3.5 w-3.5" /> Renombrar
                </Button>
                <Button size="sm" variant="outline" className="gap-1 text-destructive" onClick={() => {
                  const e = editionsList.find(x => x.name === activeEdition);
                  if (e) deleteEdition(e);
                }}>
                  <Trash2 className="h-3.5 w-3.5" /> Eliminar
                </Button>
              </>
            )}
          </>
        )}
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
            placeholder="DNI (obligatorio)"
            value={form.dni}
            onChange={e => setForm(f => ({ ...f, dni: e.target.value }))}
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
          <Select value={form.edition} onValueChange={v => setForm(f => ({ ...f, edition: v }))}>
            <SelectTrigger><SelectValue placeholder="Edición" /></SelectTrigger>
            <SelectContent>
              {editions.map(ed => <SelectItem key={ed} value={ed}>{ed}</SelectItem>)}
            </SelectContent>
          </Select>
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

      {loading ? (
        <div className="p-8 text-center text-muted-foreground bg-card rounded-xl border">Cargando alumnos...</div>
      ) : students.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground bg-card rounded-xl border">Sin alumnos todavía.</div>
      ) : (
        <div className="space-y-5">
          {grouped.map(group => {
            const total = group.students.length;
            const totalClases = total * 4;
            const completadas = group.students.reduce((acc, st) =>
              acc + (st.clase_1 ? 1 : 0) + (st.clase_2 ? 1 : 0) + (st.clase_3 ? 1 : 0) + (st.clase_4 ? 1 : 0), 0);
            const pct = totalClases > 0 ? Math.round((completadas / totalClases) * 100) : 0;
            return (
              <div key={group.edition} className="border-l-4 border-pink-500 bg-card rounded-r-xl rounded-l-md border shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-pink-500/5 border-b flex flex-wrap items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-pink-500/15 flex items-center justify-center">
                    <Users className="h-4 w-4 text-pink-500" />
                  </div>
                  <div className="flex-1 min-w-[160px]">
                    <h3 className="font-bold text-base">{group.edition}</h3>
                    <p className="text-xs text-muted-foreground">{total} alumno{total !== 1 ? 's' : ''} inscrito{total !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex items-center gap-2 min-w-[160px]">
                    <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-pink-500 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">{pct}%</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  {group.students.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground">Sin alumnos en esta edición.</div>
                  ) : (
                    <table className="w-full text-sm min-w-[1050px]">
                      <thead>
                        <tr className="border-b">
                          <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Alumno</th>
                          <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Teléfono</th>
                          <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Monto</th>
                          <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Estado</th>
                          <th className="p-3 text-center text-xs font-semibold uppercase text-muted-foreground">C1</th>
                          <th className="p-3 text-center text-xs font-semibold uppercase text-muted-foreground">C2</th>
                          <th className="p-3 text-center text-xs font-semibold uppercase text-muted-foreground">C3</th>
                          <th className="p-3 text-center text-xs font-semibold uppercase text-muted-foreground">C4</th>
                          <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Edición</th>
                          <th className="p-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.students.map(s => (
                          <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="p-3">
                              <div className="font-medium">{s.nombre || '—'} {s.apellido || ''}</div>
                              <div className="text-[10px] text-muted-foreground">{s.curso || ''}</div>
                            </td>
                            <td className="p-3 font-mono text-xs">{s.telefono || '—'}</td>
                            <td className="p-3">
                              <Input
                                type="number" inputMode="decimal" className="h-8 w-24 text-xs"
                                value={s.monto_abonado ?? 0}
                                onFocus={e => { if (e.target.value === '0') e.target.select(); }}
                                onChange={e => updateMonto(s.id, Number(e.target.value) || 0)}
                              />
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                {estadoBadge(s.estado_pago)}
                                <Select value={s.estado_pago} onValueChange={v => updateEstado(s.id, v)}>
                                  <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {ESTADOS.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                            </td>
                            {(['clase_1','clase_2','clase_3','clase_4'] as const).map(field => (
                              <td key={field} className="p-3 text-center">
                                <Checkbox
                                  checked={!!(s as any)[field]}
                                  onCheckedChange={(v) => toggleClase(s.id, field, !!v)}
                                />
                              </td>
                            ))}
                            <td className="p-3">
                              <Select value={s.edition || ''} onValueChange={v => updateEdition(s.id, v)}>
                                <SelectTrigger className="h-7 w-28 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                                <SelectContent>
                                  {editions.map(ed => <SelectItem key={ed} value={ed}>{ed}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex justify-end gap-1">
                                <Button size="sm" className="gap-1 h-8 bg-[#25D366] hover:bg-[#1da851] text-white" onClick={() => openReceipt(s)}>
                                  <Receipt className="h-3.5 w-3.5" /> Recibo
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
              </div>
            );
          })}
        </div>
      )}

      {/* Receipt Dialog — mismo formato visual que la venta de accesorios */}
      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Recibo de Curso</DialogTitle>
          </DialogHeader>
          {receiptStudent && (
            <div ref={receiptRef} className="space-y-3 font-mono text-sm border rounded-lg p-5 bg-white text-black">
              <div className="text-center border-b border-dashed border-gray-400 pb-3">
                {logoUrl && <img src={logoUrl} alt={bName} crossOrigin="anonymous" className="h-14 w-14 rounded-full object-cover mx-auto mb-2 border" />}
                <p className="text-lg font-bold">{bName}</p>
                {bAddress && <p className="text-[10px] opacity-70">{bAddress}</p>}
                <p className="text-xs opacity-70 mt-1">Recibo · {new Date().toLocaleString('es-AR')}</p>
              </div>
              <div className="space-y-1.5">
                <div className="text-xs">
                  <div className="flex justify-between gap-2">
                    <span className="flex-1">Alumno: <span className="font-bold">{receiptStudent.nombre} {receiptStudent.apellido}</span></span>
                  </div>
                  <div className="flex justify-between gap-2 mt-1">
                    <span className="flex-1">1 x {receiptStudent.curso || 'Curso'}</span>
                    <span className="font-mono">{money(receiptStudent.monto_abonado)}</span>
                  </div>
                  <div className="text-[10px] opacity-70 pl-3 flex items-center gap-1">
                    Estado:
                    <span
                      className="px-1.5 py-0.5 rounded text-white text-[10px] font-bold"
                      style={{ backgroundColor: receiptStudent.estado_pago === 'pagado' ? '#16a34a' : '#dc2626' }}
                    >
                      {receiptStudent.estado_pago === 'pagado' ? 'PAGADO' : 'SEÑADO'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="border-t border-dashed border-gray-400 pt-2 flex justify-between font-bold text-base">
                <span>TOTAL</span>
                <span className="font-mono">{money(receiptStudent.monto_abonado)}</span>
              </div>
              <div className="text-center text-xs opacity-70 pt-1">¡Gracias por confiar en nosotros!</div>
            </div>
          )}
          <DialogFooter className="flex-wrap gap-2">
            <Button variant="outline" onClick={() => setReceiptOpen(false)}>Cerrar</Button>
            <Button variant="outline" className="gap-2" onClick={downloadReceipt}><Download className="h-4 w-4" />Descargar Imagen</Button>
            <Button className="gap-2 bg-[#25D366] hover:bg-[#1da851] text-white" onClick={shareReceipt}>
              <ImageIcon className="h-4 w-4" />Copiar y Enviar por WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: crear / editar edición (solo admin) */}
      <Dialog open={editionModalOpen} onOpenChange={setEditionModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editionForm.id ? 'Editar Edición' : 'Nueva Edición'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <label className="text-xs font-semibold text-muted-foreground">Nombre de la Edición</label>
            <Input
              autoFocus
              placeholder="Ej: Edición 5"
              value={editionForm.name}
              onChange={e => setEditionForm(f => ({ ...f, name: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter') saveEdition(); }}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditionModalOpen(false)}>Cancelar</Button>
            <Button onClick={saveEdition} disabled={editionSaving} className="bg-pink-600 hover:bg-pink-700 text-white gap-2">
              {editionSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
