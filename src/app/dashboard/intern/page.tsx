'use client';

import AuthGuard from '@/lib/authGuard';
import InternDashboard from '@/components/InternDashboard';

export default function Page() {
  return (
    <AuthGuard role="intern">
      <InternDashboard />
    </AuthGuard>
  );
}
