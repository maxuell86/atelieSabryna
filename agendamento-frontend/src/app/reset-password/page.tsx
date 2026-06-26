'use client';

import { Suspense } from 'react';
import { ResetPasswordForm } from './form';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Carregando...</p></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
