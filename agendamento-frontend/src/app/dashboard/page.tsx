'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scissors, Users, Calendar, DollarSign, Clock } from 'lucide-react';

interface RecentAppointment {
  id: string;
  data: string;
  horario: string;
  status: string;
  created_at: string;
  client: { nome: string; telefone: string };
  service: { nome: string; preco: number };
}

export default function DashboardPage() {
  const [stats, setStats] = useState({ services: 0, clients: 0, appointments: 0 });
  const [recent, setRecent] = useState<RecentAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ length: number }[]>('/services'),
      api.get<{ length: number }[]>('/clients'),
      api.get<{ length: number }[]>('/appointments'),
      api.get<RecentAppointment[]>('/appointments'),
    ]).then(([services, clients, appointments, allApps]) => {
      setStats({ services: services.length, clients: clients.length, appointments: appointments.length });
      const sorted = (allApps as RecentAppointment[]).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setRecent(sorted.slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  const cards = [
    { title: 'Serviços', value: stats.services, icon: Scissors, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Clientes', value: stats.clients, icon: Users, color: 'text-green-600', bg: 'bg-green-100' },
    { title: 'Agendamentos', value: stats.appointments, icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-100' },
    { title: 'Faturamento', value: '---', icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  const isRecent = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    return diff < 24 * 60 * 60 * 1000;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Visão geral do seu negócio</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? '...' : card.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Agendamentos Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : recent.length === 0 ? (
              <p className="text-muted-foreground">Nenhum agendamento ainda</p>
            ) : (
              <div className="space-y-3">
                {recent.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{a.client.nome}</p>
                        {isRecent(a.created_at) && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                            Novo!
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {a.service.nome} - {new Date(a.data).toLocaleDateString('pt-BR')} às {a.horario}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      a.status === 'reservado' ? 'bg-blue-100 text-blue-700' :
                      a.status === 'confirmado' ? 'bg-green-100 text-green-700' :
                      a.status === 'cancelado' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bem-vinda ao Ateliê!</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <p>Gerencie seus serviços, clientes e agendamentos em um só lugar.</p>
            <p className="mt-2">Use o menu ao lado para navegar entre as seções.</p>
            <p className="mt-4 text-sm">
              <strong>Novidades:</strong> Agora você pode definir sua disponibilidade de atendimento em{' '}
              <strong>Disponibilidade</strong> no menu lateral.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
