'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Check, Calendar, Clock, Scissors } from 'lucide-react';
import { toast } from 'sonner';

interface Professional { nome: string; email: string; telefone: string }
interface Service { id: string; nome: string; descricao: string | null; preco: number }

const formatPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('55') ? digits : `55${digits}`;
};

export default function AgendePage() {
  const { slug } = useParams<{ slug: string }>();
  const [prof, setProf] = useState<Professional | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    Promise.all([
      api.get<Professional>(`/public/${slug}`),
      api.get<Service[]>(`/public/${slug}/services`),
    ]).then(([p, s]) => {
      setProf(p);
      setServices(s);
    }).finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (selectedDate && slug) {
      api.get<string[]>(`/public/${slug}/slots?data=${selectedDate}`).then(setSlots).catch(() => setSlots([]));
    }
  }, [selectedDate, slug]);

  const changeDay = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
    setSelectedSlot('');
  };

  const handleSubmit = async () => {
    if (!selectedService || !selectedSlot || !nome || !telefone) return;
    setSaving(true);
    try {
      await api.post(`/public/${slug}/appointments`, {
        nome, telefone, service_id: selectedService.id, data: selectedDate, horario: selectedSlot,
      });
      setDone(true);
      toast.success('Agendamento confirmado!');
    } catch (err: unknown) {
      toast.error((err as { message?: string }).message || 'Erro ao agendar');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (done && prof?.telefone) {
      const phone = formatPhone(prof.telefone);
      const text = [
        `Olá! 🎉 Novo agendamento recebido:`,
        ``,
        `👤 Cliente: ${nome}`,
        `📅 Data: ${new Date(selectedDate).toLocaleDateString('pt-BR')}`,
        `⏰ Horário: ${selectedSlot}`,
        `💇 Serviço: ${selectedService?.nome}`,
        `💰 Valor: R$ ${Number(selectedService?.preco).toFixed(2)}`,
        `📞 Contato: ${telefone}`,
      ].join('%0A');
      window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
    }
  }, [done]);

  const today = new Date().toISOString().split('T')[0];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!prof) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <Card className="w-full max-w-md">
          <CardContent className="py-8 text-center text-muted-foreground">Profissional não encontrado</CardContent>
        </Card>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/5 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-8 space-y-4">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-xl font-bold">Agendamento Confirmado!</h2>
            <p className="text-muted-foreground">
              {selectedService?.nome} em {new Date(selectedDate).toLocaleDateString('pt-BR')} às {selectedSlot}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/5">
      <div className="max-w-lg mx-auto p-4 py-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{prof.nome}</h1>
          <p className="text-muted-foreground">Agende seu horário online</p>
        </div>

        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {s}
              </div>
              {s < 3 && <div className={`h-0.5 w-8 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Calendar className="h-5 w-5" /> Escolha a data e horário</h2>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => changeDay(-1)}><ChevronLeft className="h-4 w-4" /></Button>
              <Input type="date" value={selectedDate} onChange={e => { setSelectedDate(e.target.value); setSelectedSlot(''); }} className="flex-1" />
              <Button variant="outline" size="icon" onClick={() => changeDay(1)}><ChevronRight className="h-4 w-4" /></Button>
              {selectedDate !== today && <Button variant="ghost" size="sm" onClick={() => { setSelectedDate(today); setSelectedSlot(''); }}>Hoje</Button>}
            </div>

            {slots.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum horário disponível nesta data</CardContent></Card>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {slots.map(slot => (
                  <Button key={slot} variant={selectedSlot === slot ? 'default' : 'outline'} size="sm" onClick={() => setSelectedSlot(slot)}>
                    {slot}
                  </Button>
                ))}
              </div>
            )}

            <div className="flex justify-end">
              <Button disabled={!selectedSlot} onClick={() => setStep(2)}>Continuar</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Scissors className="h-5 w-5" /> Escolha o serviço</h2>
            {services.map(s => (
              <Card key={s.id} className={`cursor-pointer transition-all hover:shadow-md ${selectedService?.id === s.id ? 'ring-2 ring-primary' : ''}`} onClick={() => { setSelectedService(s); setStep(3); }}>
                <CardContent className="py-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{s.nome}</p>
                    {s.descricao && <p className="text-sm text-muted-foreground">{s.descricao}</p>}
                  </div>
                  <p className="font-bold text-lg">R$ {Number(s.preco).toFixed(2)}</p>
                </CardContent>
              </Card>
            ))}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Clock className="h-5 w-5" /> Seus dados</h2>

            <Card>
              <CardContent className="py-3 space-y-1 text-sm">
                <p><strong>Data:</strong> {new Date(selectedDate).toLocaleDateString('pt-BR')}</p>
                <p><strong>Horário:</strong> {selectedSlot}</p>
                <p><strong>Serviço:</strong> {selectedService?.nome}</p>
                <p><strong>Valor:</strong> R$ {Number(selectedService?.preco).toFixed(2)}</p>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Seu nome</Label>
                <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome completo" />
              </div>
              <div className="space-y-1">
                <Label>Seu telefone</Label>
                <Input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(11) 99999-9999" />
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>Voltar</Button>
              <Button onClick={handleSubmit} disabled={saving || !nome || !telefone}>
                {saving ? 'Confirmando...' : 'Confirmar Agendamento'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
