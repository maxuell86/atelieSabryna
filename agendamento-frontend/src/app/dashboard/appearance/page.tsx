'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Image, Palette, Type, PaintBucket, RotateCcw, Save, Upload } from 'lucide-react';

interface Theme {
  primary_color: string;
  background_type: string;
  background_value: string;
  background_image_url: string | null;
  logo_url: string | null;
  font_family: string;
}

const GRADIENTS = [
  { label: 'Rosa para Roxo', value: 'linear-gradient(135deg, #f472b6, #8b5cf6)' },
  { label: 'Azul para Ciano', value: 'linear-gradient(135deg, #3b82f6, #06b6d4)' },
  { label: 'Laranja para Rosa', value: 'linear-gradient(135deg, #f97316, #ec4899)' },
  { label: 'Verde para Azul', value: 'linear-gradient(135deg, #22c55e, #3b82f6)' },
  { label: 'Roxo para Azul', value: 'linear-gradient(135deg, #a855f7, #3b82f6)' },
  { label: 'Vinho para Rosa', value: 'linear-gradient(135deg, #be123c, #f43f5e)' },
  { label: 'Amarelo para Laranja', value: 'linear-gradient(135deg, #eab308, #f97316)' },
  { label: 'Cinza Claro para Cinza', value: 'linear-gradient(135deg, #f1f5f9, #94a3b8)' },
];

const FONTS = [
  { label: 'Inter', value: 'Inter' },
  { label: 'Playfair Display', value: 'Playfair Display' },
  { label: 'Roboto', value: 'Roboto' },
  { label: 'Poppins', value: 'Poppins' },
  { label: 'Lora', value: 'Lora' },
  { label: 'Montserrat', value: 'Montserrat' },
  { label: 'Dancing Script', value: 'Dancing Script' },
  { label: 'Raleway', value: 'Raleway' },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api';

export default function AppearancePage() {
  const [theme, setTheme] = useState<Theme>({
    primary_color: '#000000',
    background_type: 'color',
    background_value: '#ffffff',
    background_image_url: null,
    logo_url: null,
    font_family: 'Inter',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    api.get<Theme>('/theme').then(data => {
      setTheme(data);
    }).catch(() => {
      toast.error('Erro ao carregar tema');
    }).finally(() => setLoading(false));
  }, []);

  const update = (key: keyof Theme, value: string | null) => {
    setTheme(prev => ({ ...prev, [key]: value }));
  };

  const handleBgImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBg(true);
    try {
      const { url } = await api.uploadFile('/theme/upload', file);
      update('background_image_url', `${API_URL.replace('/api', '')}${url}`);
      toast.success('Imagem de fundo enviada!');
    } catch {
      toast.error('Erro ao enviar imagem');
    } finally {
      setUploadingBg(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const { url } = await api.uploadFile('/theme/upload', file);
      update('logo_url', `${API_URL.replace('/api', '')}${url}`);
      toast.success('Logo enviada!');
    } catch {
      toast.error('Erro ao enviar logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/theme', theme);
      toast.success('Tema salvo com sucesso!');
    } catch {
      toast.error('Erro ao salvar tema');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    const defaults = {
      primary_color: '#000000',
      background_type: 'color',
      background_value: '#ffffff',
      background_image_url: null,
      logo_url: null,
      font_family: 'Inter',
    };
    setTheme(defaults);
    setSaving(true);
    try {
      await api.put('/theme', defaults);
      toast.success('Tema restaurado ao padrão!');
    } catch {
      toast.error('Erro ao restaurar tema');
    } finally {
      setSaving(false);
    }
  };

  const getBackgroundStyle = () => {
    if (theme.background_type === 'gradient') return theme.background_value;
    if (theme.background_type === 'image' && theme.background_image_url) {
      return `url(${theme.background_image_url}) center/cover no-repeat`;
    }
    return theme.background_value;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Aparência</h1>
          <p className="text-muted-foreground">Personalize a página pública da sua maquiadora</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}><RotateCcw className="h-4 w-4 mr-2" />Restaurar Padrão</Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />{saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Palette className="h-5 w-5" />Cor Principal</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={theme.primary_color}
                  onChange={e => update('primary_color', e.target.value)}
                  className="h-10 w-10 rounded border cursor-pointer"
                />
                <Input
                  value={theme.primary_color}
                  onChange={e => update('primary_color', e.target.value)}
                  placeholder="#000000"
                  maxLength={7}
                  className="font-mono"
                />
              </div>
              <p className="text-xs text-muted-foreground">Usada em botões, links e destaques na página pública</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><PaintBucket className="h-5 w-5" />Plano de Fundo</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                {(['color', 'gradient', 'image'] as const).map(type => (
                  <Button
                    key={type}
                    variant={theme.background_type === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      update('background_type', type);
                      if (type === 'color') update('background_value', '#ffffff');
                      else if (type === 'gradient') update('background_value', GRADIENTS[0].value);
                    }}
                  >
                    {type === 'color' ? 'Cor' : type === 'gradient' ? 'Gradiente' : 'Imagem'}
                  </Button>
                ))}
              </div>

              {theme.background_type === 'color' && (
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={theme.background_value}
                    onChange={e => update('background_value', e.target.value)}
                    className="h-10 w-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={theme.background_value}
                    onChange={e => update('background_value', e.target.value)}
                    placeholder="#ffffff"
                    maxLength={7}
                    className="font-mono"
                  />
                </div>
              )}

              {theme.background_type === 'gradient' && (
                <div className="grid grid-cols-2 gap-2">
                  {GRADIENTS.map(g => (
                    <button
                      key={g.value}
                      onClick={() => update('background_value', g.value)}
                      className={`h-16 rounded-lg border-2 transition-all ${theme.background_value === g.value ? 'border-primary ring-2 ring-primary/30' : 'border-transparent hover:border-muted-foreground/30'}`}
                      style={{ background: g.value }}
                      title={g.label}
                    />
                  ))}
                </div>
              )}

              {theme.background_type === 'image' && (
                <div className="space-y-3">
                  <Label htmlFor="bg-image" className="cursor-pointer">
                    <div className="flex items-center gap-2 p-3 border-2 border-dashed rounded-lg hover:bg-muted/50 transition-colors">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {uploadingBg ? 'Enviando...' : 'Clique para enviar imagem'}
                      </span>
                    </div>
                    <input id="bg-image" type="file" accept="image/*" className="hidden" onChange={handleBgImageUpload} disabled={uploadingBg} />
                  </Label>
                  {theme.background_image_url && (
                    <div className="relative h-24 rounded-lg overflow-hidden border">
                      <img src={theme.background_image_url} alt="Fundo" className="w-full h-full object-cover" />
                      <button
                        onClick={() => update('background_image_url', null)}
                        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/50 text-white flex items-center justify-center text-xs hover:bg-black/70"
                      >✕</button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Image className="h-5 w-5" />Logo</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Label htmlFor="logo-image" className="cursor-pointer">
                <div className="flex items-center gap-2 p-3 border-2 border-dashed rounded-lg hover:bg-muted/50 transition-colors">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {uploadingLogo ? 'Enviando...' : 'Clique para enviar logo'}
                  </span>
                </div>
                <input id="logo-image" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
              </Label>
              {theme.logo_url && (
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 rounded-lg border overflow-hidden bg-white flex items-center justify-center">
                    <img src={theme.logo_url} alt="Logo" className="max-h-full max-w-full object-contain" />
                  </div>
                  <Button variant="outline" size="sm" onClick={() => update('logo_url', null)}>Remover</Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Type className="h-5 w-5" />Fonte</CardTitle></CardHeader>
            <CardContent>
              <select
                value={theme.font_family}
                onChange={e => update('font_family', e.target.value)}
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                style={{ fontFamily: theme.font_family }}
              >
                {FONTS.map(f => (
                  <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
                ))}
              </select>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Prévia da Página Pública</h3>
          <div className="sticky top-6 rounded-xl border overflow-hidden shadow-lg" style={{ fontFamily: theme.font_family }}>
            <div
              className="min-h-[500px] p-6 flex flex-col items-center justify-center gap-4"
              style={{
                background: getBackgroundStyle(),
                '--preview-primary': theme.primary_color,
              } as React.CSSProperties}
            >
              {theme.logo_url && (
                <img src={theme.logo_url} alt="Logo" className="h-20 w-20 rounded-full object-cover border-2 shadow-md" style={{ borderColor: theme.primary_color }} />
              )}
              <div className="text-center">
                <h2 className="text-2xl font-bold" style={{ color: theme.primary_color }}>Maquiadora Profissional</h2>
                <p className="text-sm mt-1" style={{ color: theme.primary_color, opacity: 0.7 }}>Agende seu horário online</p>
              </div>
              <div className="flex gap-2 mt-2">
                <span className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: theme.primary_color }}>09:00</span>
                <span className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: theme.primary_color }}>09:30</span>
                <span className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: theme.primary_color }}>10:00</span>
              </div>
              <div className="w-full max-w-xs mt-4 p-4 rounded-lg bg-white/90 backdrop-blur text-center text-sm">
                <p className="font-medium" style={{ color: theme.primary_color }}>Maquiagem Social</p>
                <p className="text-muted-foreground">R$ 150,00</p>
                <button className="mt-3 w-full py-2 rounded-lg text-white font-medium" style={{ backgroundColor: theme.primary_color }}>
                  Agendar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
