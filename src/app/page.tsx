'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white">
      <div className="bg-white text-black p-10 rounded-xl shadow-xl text-center max-w-md w-full">
        <h1 className="text-3xl font-bold mb-6">Intern Allocation Portal</h1>
        <p className="mb-4">Welcome! Choose an option to continue:</p>
        <div className="flex flex-col gap-4">
          <Link href="/login" className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">
            Login
          </Link>
          <Link href="/signup" className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded">
            Sign Up
          </Link>
          <button
  onClick={async () => {
    const res = await fetch('/api/allocate', { method: 'POST' });
    const json = await res.json();
    alert(json.message);
  }}
  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
>
  Run Auto Allocation
</button>

        </div>
      </div>
    </main>
  );
}
