'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface AvailabilityBlock {
  id: string;
  data: string;
  horario_inicio: string;
  horario_fim: string;
  duracao_minutos: number;
}

export default function AvailabilityPage() {
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [form, setForm] = useState({ horario_inicio: '08:00', horario_fim: '18:00', duracao_minutos: 30 });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [blocksData, slotsData] = await Promise.all([
        api.get<AvailabilityBlock[]>(`/availability?data=${selectedDate}`),
        api.get<string[]>(`/availability/slots?data=${selectedDate}`).catch(() => [] as string[]),
      ]);
      setBlocks(blocksData);
      setSlots(slotsData);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => { load(); }, [load]);

  const changeDay = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const today = new Date().toISOString().split('T')[0];

  const openCreate = () => {
    const currentDate = new Date();
    setForm({ horario_inicio: '08:00', horario_fim: '12:00', duracao_minutos: 30 });
    setOpen(true);
  };

  const save = async () => {
    if (!form.horario_inicio || !form.horario_fim) {
      toast.error('Preencha horário de início e fim.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/availability', { ...form, data: selectedDate });
      toast.success('Disponibilidade adicionada!');
      setOpen(false);
      load();
    } catch (err: unknown) {
      toast.error((err as { message?: string }).message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Remover este período de disponibilidade?')) return;
    try {
      await api.delete(`/availability/${id}`);
      toast.success('Disponibilidade removida!');
      load();
    } catch (err: unknown) {
      toast.error((err as { message?: string }).message || 'Erro ao remover');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Disponibilidade</h2>
          <p className="text-muted-foreground">Defina seus horários de atendimento</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Adicionar Período
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => changeDay(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="w-fit"
        />
        <Button variant="outline" size="icon" onClick={() => changeDay(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        {selectedDate !== today && (
          <Button variant="ghost" size="sm" onClick={() => setSelectedDate(today)}>Hoje</Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Períodos de Atendimento</h3>
          {loading ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Carregando...</CardContent></Card>
          ) : blocks.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">
              Nenhum período cadastrado para esta data
            </CardContent></Card>
          ) : (
            blocks.map(block => (
              <Card key={block.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium">
                      {block.horario_inicio} às {block.horario_fim}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Slots de {block.duracao_minutos} min
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => remove(block.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Slots Gerados</h3>
          {loading ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Carregando...</CardContent></Card>
          ) : slots.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">
              Nenhum slot disponível para esta data
            </CardContent></Card>
          ) : (
            <Card>
              <CardContent className="py-4">
                <div className="flex flex-wrap gap-2">
                  {slots.map(slot => (
                    <span key={slot} className="px-3 py-1.5 bg-primary/10 text-primary rounded-md text-sm font-medium">
                      {slot}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Período de Disponibilidade</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={selectedDate} disabled />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Horário Início</Label>
                <Input type="time" value={form.horario_inicio} onChange={e => setForm({ ...form, horario_inicio: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Horário Fim</Label>
                <Input type="time" value={form.horario_fim} onChange={e => setForm({ ...form, horario_fim: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Duração por Slot (minutos)</Label>
              <Input type="number" min="5" step="5" value={form.duracao_minutos} onChange={e => setForm({ ...form, duracao_minutos: Number(e.target.value) })} />
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm text-muted-foreground mb-2">Prévia dos slots que serão gerados:</p>
              <div className="flex flex-wrap gap-1">
                {(() => {
                  const preview: string[] = [];
                  const [hI, mI] = form.horario_inicio.split(':').map(Number);
                  const [hF, mF] = form.horario_fim.split(':').map(Number);
                  const start = hI * 60 + mI;
                  const end = hF * 60 + mF;
                  for (let m = start; m + form.duracao_minutos <= end; m += form.duracao_minutos) {
                    const h = Math.floor(m / 60);
                    const min = m % 60;
                    preview.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
                  }
                  return preview.slice(0, 20).map(s => (
                    <span key={s} className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">{s}</span>
                  ));
                })()}
                {(() => {
                  const [hI, mI] = form.horario_inicio.split(':').map(Number);
                  const [hF, mF] = form.horario_fim.split(':').map(Number);
                  const start = hI * 60 + mI;
                  const end = hF * 60 + mF;
                  const count = Math.floor((end - start) / form.duracao_minutos);
                  return count > 20 ? <span className="text-xs text-muted-foreground">...e mais {count - 20}</span> : null;
                })()}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={save} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
