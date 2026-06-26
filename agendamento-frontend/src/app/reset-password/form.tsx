'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (senha !== confirmar) {
      toast.error('Senhas não conferem.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, senha });
      toast.success('Senha alterada com sucesso!');
      router.push('/login');
    } catch (err: unknown) {
      toast.error((err as { message?: string }).message || 'Erro ao redefinir senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Redefinir Senha</CardTitle>
          <CardDescription>Digite sua nova senha</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!searchParams.get('token') && (
              <div className="space-y-2">
                <Label>Token de recuperação</Label>
                <Input value={token} onChange={e => setToken(e.target.value)} placeholder="Cole o token recebido por email" required />
              </div>
            )}
            <div className="space-y-2">
              <Label>Nova senha</Label>
              <Input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="Mínimo 6 caracteres" minLength={6} required />
            </div>
            <div className="space-y-2">
              <Label>Confirmar senha</Label>
              <Input type="password" value={confirmar} onChange={e => setConfirmar(e.target.value)} placeholder="Repita a senha" minLength={6} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Alterando...' : 'Redefinir senha'}
            </Button>
            <Link href="/login" className="block text-center text-sm text-muted-foreground hover:text-foreground underline underline-offset-4">
              Voltar ao login
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
