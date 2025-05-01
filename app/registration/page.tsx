'use client';

import Link from 'next/link';
import RegistrationForm from '../../components/forms/RegistrationForm';

export default function Registration() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <header className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-3xl font-light">AliveHere<span className="text-blue-400">.com</span></Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto bg-slate-800/50 p-8 rounded-lg border border-slate-700">
          <h1 className="text-3xl font-light mb-6 text-center">Begin Your Legacy</h1>
          <p className="text-slate-300 mb-8 text-center">
            Enter your information below to start preserving your voice and story for future generations.
          </p>

          <RegistrationForm />
        </div>
      </main>

      <footer className="bg-slate-950 py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-slate-500">
          <p>&copy; {new Date().getFullYear()} AliveHere. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}