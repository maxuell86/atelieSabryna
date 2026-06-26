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

interface Theme {
  primary_color: string;
  background_type: string;
  background_value: string;
  background_image_url: string | null;
  logo_url: string | null;
  font_family: string;
}

interface Professional { nome: string; email: string; telefone: string; theme?: Theme }
interface Service { id: string; nome: string; descricao: string | null; preco: number; valor_sinal: number }

const formatPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('55') ? digits : `55${digits}`;
};

function getBackgroundStyle(theme?: Theme): string {
  if (!theme) return '';
  if (theme.background_type === 'gradient') return theme.background_value;
  if (theme.background_type === 'image' && theme.background_image_url) {
    return `url(${theme.background_image_url}) center/cover no-repeat`;
  }
  return theme.background_value;
}

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
        `💰 Sinal: R$ ${Number(selectedService?.valor_sinal).toFixed(2)}`,
        `📞 Contato: ${telefone}`,
      ].join('%0A');
      window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
    }
  }, [done]);

  useEffect(() => {
    const font = prof?.theme?.font_family;
    if (font && font !== 'Inter' && font !== '') {
      const existing = document.querySelector(`link[data-font="${font}"]`);
      if (!existing) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.dataset.font = font;
        link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, '+')}:wght@400;500;600;700&display=swap`;
        document.head.appendChild(link);
      }
    }
  }, [prof?.theme?.font_family]);

  const today = new Date().toISOString().split('T')[0];
  const theme = prof?.theme;
  const bgStyle = getBackgroundStyle(theme);

  const content = (
    <>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      ) : !prof ? (
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="py-8 text-center text-muted-foreground">Profissional não encontrado</CardContent>
          </Card>
        </div>
      ) : done ? (
        <div className="min-h-screen flex items-center justify-center p-4">
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
      ) : (
        <div className="max-w-lg mx-auto p-4 py-8 space-y-6">
          {theme?.logo_url && (
            <div className="flex justify-center">
              <img src={theme.logo_url} alt="Logo" className="h-24 w-24 rounded-full object-cover border-2 shadow-md" style={{ borderColor: theme.primary_color }} />
            </div>
          )}
          <div className="text-center">
            <h1 className="text-2xl font-bold" style={{ color: theme?.primary_color }}>{prof.nome}</h1>
            <p className="text-muted-foreground">Agende seu horário online</p>
          </div>

          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= s ? 'text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                  style={step >= s ? { backgroundColor: theme?.primary_color } : undefined}
                >{s}</div>
                {s < 3 && <div className={`h-0.5 w-8 ${step > s ? '' : 'bg-muted'}`}
                  style={step > s ? { backgroundColor: theme?.primary_color } : undefined}
                />}
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
                  {slots.map(slot => {
                    const isSelected = selectedSlot === slot;
                    return (
                      <Button
                        key={slot}
                        variant={isSelected ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedSlot(slot)}
                        style={isSelected ? { backgroundColor: theme?.primary_color } : undefined}
                      >{slot}</Button>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-end">
                <Button disabled={!selectedSlot} onClick={() => setStep(2)}
                  style={{ backgroundColor: theme?.primary_color }}
                  className="text-white"
                >Continuar</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Scissors className="h-5 w-5" /> Escolha o serviço</h2>
              {services.map(s => (
                <Card key={s.id} className={`cursor-pointer transition-all hover:shadow-md`}
                  style={selectedService?.id === s.id ? { borderColor: theme?.primary_color, boxShadow: `0 0 0 2px ${theme?.primary_color}` } : {}}
                  onClick={() => { setSelectedService(s); setStep(3); }}>
                  <CardContent className="py-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{s.nome}</p>
                      {s.descricao && <p className="text-sm text-muted-foreground">{s.descricao}</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">R$ {Number(s.preco).toFixed(2)}</p>
                      {Number(s.valor_sinal) > 0 && (
                        <p className="text-xs text-muted-foreground">Sinal: R$ {Number(s.valor_sinal).toFixed(2)}</p>
                      )}
                    </div>
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
                  {Number(selectedService?.valor_sinal) > 0 && (
                    <p><strong>Sinal:</strong> R$ {Number(selectedService?.valor_sinal).toFixed(2)}</p>
                  )}
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
                <Button onClick={handleSubmit} disabled={saving || !nome || !telefone}
                  style={{ backgroundColor: theme?.primary_color }}
                  className="text-white"
                >{saving ? 'Confirmando...' : 'Confirmar Agendamento'}</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );

  if (!theme) {
    return (
      <div className="bg-gradient-to-br from-primary/5 via-background to-primary/5 min-h-screen">
        {content}
      </div>
    );
  }

  return (
    <div
      style={{
        '--primary': theme.primary_color,
        '--primary-foreground': '#ffffff',
        fontFamily: theme.font_family,
        background: bgStyle,
        minHeight: '100vh',
      } as React.CSSProperties}
    >
      {content}
    </div>
  );
}
