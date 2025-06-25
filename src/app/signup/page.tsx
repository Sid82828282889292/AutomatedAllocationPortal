'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'intern' | 'admin'>('intern');
  const [error, setError] = useState('');

  const handleSignup = async () => {
    setError('');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      return;
    }

    const userId = data.user?.id;

    if (userId) {
      // Add the user into `users` table with role
      const { error: insertError } = await supabase.from('users').insert({
        id: userId,
        email,
        role,
      });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      // Redirect to correct dashboard
      router.push(role === 'admin' ? '/dashboard/admin' : '/dashboard/intern');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h1 className="text-2xl font-bold mb-4">Sign Up</h1>
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 mb-2 border border-gray-300 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 mb-4 border border-gray-300 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="mb-4">
          <label className="mr-2">Role:</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'intern' | 'admin')}
            className="border p-2 rounded"
          >
            <option value="intern">Intern</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button
          className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
          onClick={handleSignup}
        >
          Sign Up
        </button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>
    </div>
  );
}
