'use client';

import AuthGuard from '@/lib/authGuard';
import AdminDashboard from '@/components/AdminDashboard'; // assume this is your component

export default function Page() {
  return (
    <AuthGuard role="admin">
      <AdminDashboard />
    </AuthGuard>
  );
}
