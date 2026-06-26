'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface Service { id: string; nome: string; preco: number; valor_sinal: number }
interface Client { id: string; nome: string; telefone: string }

interface Appointment {
  id: string;
  data: string;
  horario: string;
  valor_servico: number;
  valor_sinal: number;
  status: string;
  client: Client;
  service: Service;
}

const statusColors: Record<string, string> = {
  disponivel: 'bg-gray-100 text-gray-700 border-gray-200',
  reservado: 'bg-blue-100 text-blue-700 border-blue-200',
  confirmado: 'bg-green-100 text-green-700 border-green-200',
  cancelado: 'bg-red-100 text-red-700 border-red-200',
  expirado: 'bg-amber-100 text-amber-700 border-amber-200',
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [form, setForm] = useState({ client_id: '', service_id: '', horario: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [apps, svcs, clts] = await Promise.all([
        api.get<Appointment[]>(`/appointments?data=${selectedDate}`),
        api.get<Service[]>('/services'),
        api.get<Client[]>('/clients'),
      ]);
      setAppointments(apps);
      setServices(svcs);
      setClients(clts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [selectedDate]);

  const changeDay = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const openCreate = () => {
    setForm({ client_id: '', service_id: '', horario: '' });
    setOpen(true);
  };

  const save = async () => {
    if (!form.client_id || !form.service_id || !form.horario) {
      toast.error('Preencha todos os campos.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/appointments', { ...form, data: selectedDate });
      toast.success('Agendamento criado!');
      setOpen(false);
      load();
    } catch (err: unknown) {
      toast.error((err as { message?: string }).message || 'Erro ao criar agendamento');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/appointments/${id}`, { status });
      toast.success(`Status alterado para "${status}"`);
      load();
    } catch (err: unknown) {
      toast.error((err as { message?: string }).message || 'Erro ao atualizar');
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Agendamentos</h2>
          <p className="text-muted-foreground">Gerencie a agenda do dia</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Novo Agendamento
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

      <div className="space-y-3">
        {loading ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">Carregando...</CardContent></Card>
        ) : appointments.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum agendamento para esta data</CardContent></Card>
        ) : (
          appointments.map(a => (
            <Card key={a.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="text-center min-w-[60px]">
                  <div className="text-lg font-bold">{a.horario}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{a.client.nome}</p>
                  <p className="text-sm text-muted-foreground">{a.service.nome}</p>
                  <p className="text-sm text-muted-foreground">{a.client.telefone}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-medium">R$ {Number(a.valor_servico).toFixed(2)}</p>
                  <p className="text-muted-foreground">Sinal: R$ {Number(a.valor_sinal).toFixed(2)}</p>
                </div>
                <div className="flex flex-col gap-1 min-w-[120px]">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full border text-center ${statusColors[a.status] || ''}`}>
                    {a.status}
                  </span>
                  <div className="flex gap-1">
                    {a.status === 'reservado' && (
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => updateStatus(a.id, 'confirmado')}>
                        Confirmar
                      </Button>
                    )}
                    {a.status !== 'cancelado' && a.status !== 'expirado' && (
                      <Button size="sm" variant="outline" className="text-xs h-7 text-destructive" onClick={() => updateStatus(a.id, 'cancelado')}>
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Agendamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <select className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })}>
                <option value="">Selecione um cliente</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Serviço</Label>
              <select className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={form.service_id} onChange={e => setForm({ ...form, service_id: e.target.value })}>
                <option value="">Selecione um serviço</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.nome} - R$ {Number(s.preco).toFixed(2)}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Horário</Label>
              <Input type="time" value={form.horario} onChange={e => setForm({ ...form, horario: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={save} disabled={saving}>{saving ? 'Criando...' : 'Criar'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
