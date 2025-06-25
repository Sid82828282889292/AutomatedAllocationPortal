'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabaseClient';

type Props = {
  children: React.ReactNode;
  role?: 'admin' | 'intern'; // Optional
};

export default function AuthGuard({ children, role }: Props) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error || !data) {
        router.push('/login');
        return;
      }

      if (role && data.role !== role) {
        router.push('/'); // Or show access denied
        return;
      }

      setAuthorized(true);
    };

    checkAuth();
  }, [router, role]);

  if (!authorized) return <div className="p-8">Checking access...</div>;

  return <>{children}</>;
}
