"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, ArrowLeft, GraduationCap } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg('ইমেল বা পাসওয়ার্ড ভুল হয়েছে। আবার চেষ্টা করো।');
        return;
      }

      // Check if email is verified
      if (data.user && !data.user.email_confirmed_at) {
        alert("আপনার ইমেইলটি এখনো ভেরিফাই করা হয়নি! দয়া করে আপনার ইনবক্স থেকে ইমেইল কনফার্ম করুন।");
        await supabase.auth.signOut();
        return;
      }

      // লগইন সফল হলে ড্যাশবোর্ডে রিডাইরেক্ট
      router.push('/dashboard');
    } catch (error: any) {
      setErrorMsg('লগইন করতে সমস্যা হয়েছে। আবার চেষ্টা করো।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-emerald-500 selection:text-white py-12 px-4 flex flex-col justify-center">
      <div className="max-w-md mx-auto w-full">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-600 transition mb-6 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          হোমপেজে ফিরে যান
        </Link>

        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xl p-6 sm:p-8 backdrop-blur-xl">
          <div className="text-center mb-8 space-y-2">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              প্রযত্ন-এ লগইন করুন
            </h1>
            <p className="text-slate-500 text-xs">
              account খুলার সময় যে ইমেল ব্যবহার করেছিলে, সেই ইমেল এবং পাসওয়ার্ড দিয়ে লগইন করো।
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">ইমেইল এড্রেস</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                <input 
                  type="email" 
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white text-slate-800 text-sm transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">পাসওয়ার্ড</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                <input 
                  type="password" 
                  required
                  placeholder="পাসওয়ার্ড লিখুন"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white text-slate-800 text-sm transition"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] mt-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'লগইন হচ্ছে...' : 'লগইন করুন'}
            </button>

            <p className="text-center text-xs text-slate-500 mt-4">
              একাউন্ট তৈরি করা নেই?{' '}
              <Link href="/register" className="text-emerald-600 font-bold hover:underline">
                রেজিস্ট্রেশন করুন
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}