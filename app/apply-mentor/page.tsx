"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, ArrowLeft, Send, CheckCircle2, AlertTriangle, Eye, EyeOff } from 'lucide-react';

export default function ApplyMentorPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sscBatch, setSscBatch] = useState('2020');
  const [institution, setInstitution] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const redirectUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/login?verified=true`
          : 'https://projotno-bkhs.vercel.app/login?verified=true';

      // 1. Create Auth User with login redirect
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (authError) throw authError;

      if (authData.user?.identities && authData.user.identities.length === 0) {
        throw new Error('এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট খোলা আছে! অনুগ্রহ করে লগইন করুন অথবা নতুন ইমেইল ব্যবহার করুন।');
      }

      if (authData.user) {
        // 2. Insert into profiles as pending_mentor
        const { error: profileError } = await supabase.from('profiles').insert([
          {
            id: authData.user.id,
            full_name: fullName,
            ssc_batch: sscBatch,
            current_college: `${institution} (${department})`,
            target_field: 'Mentor / Senior',
            phone: phone,
            role: 'pending_mentor',
          },
        ]);

        if (profileError) throw profileError;

        // ভেরিফিকেশনের আগে যেন অটো-লগইন হয়ে ড্যাশবোর্ডে না ঢোকে
        if (authData.session) {
          await supabase.auth.signOut();
        }

        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'আবেদনে সমস্যা হয়েছে, আবার চেষ্টা করুন।');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans py-8 px-4 flex items-center justify-center">
      <div className="max-w-md w-full space-y-6">
        <Link 
          href="/" 
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-purple-600 transition bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          হোম পেজে ফিরে যান
        </Link>

        {submitted ? (
          <div className="bg-white border border-emerald-200 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">আবেদন সফলভাবে জমা হয়েছে!</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              ধন্যবাদ <strong>{fullName}</strong>! আপনার প্রদত্ত ইমেইলে (<span className="font-semibold text-slate-800">{email}</span>) একটি ভেরিফিকেশন লিংক পাঠানো হয়েছে। ইমেইল ভেরিফাই করে লগইন করুন।
            </p>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2 text-left">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-900 font-medium leading-relaxed">
                <strong>গুরুত্বপূর্ণ:</strong> ইনবক্সে ভেরিফিকেশন ইমেইলটি না পেলে অবশ্যই আপনার ইমেইলের <strong>Spam / Junk</strong> ফোল্ডার চেক করুন। ইমেইল ভেরিফাই ও অ্যাডমিন অ্যাপ্রুভালের পর আপনি মেন্টর হিসেবে পূর্ণ অ্যাক্সেস পাবেন।
              </p>
            </div>

            <Link href="/login" className="inline-block w-full bg-purple-600 text-white font-bold py-3 rounded-xl text-xs transition hover:bg-purple-700">
              লগইন পেজে যান
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-purple-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">সিনিয়র মেন্টর হিসেবে যোগ দিন</h1>
              <p className="text-xs text-slate-500">please fill out the form below to apply. Be a mentor! it will help you connect with students who need guidance.</p>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium leading-relaxed">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">পূর্ণ নাম *</label>
                <input 
                  type="text" 
                  required
                  placeholder="আপনার নাম লিখুন"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col justify-between">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SSC ব্যাচ *</label>
                  <input 
                    type="text" 
                    required
                    value={sscBatch}
                    onChange={(e) => setSscBatch(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="flex flex-col justify-between">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">মোবাইল নম্বর (WhatsApp আছে এমন) *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="01800000000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">বর্তমান বিশ্ববিদ্যালয় / প্রতিষ্ঠান *</label>
                <input 
                  type="text" 
                  required
                  placeholder="যেমন: Dhaka University / চট্টগ্রাম বিশ্ববিদ্যালয় / চমেক"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">বিভাগ / সাবজেক্ট *</label>
                <input 
                  type="text" 
                  required
                  placeholder="যেমন: EEE / Computer Science / MBBS"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ইমেইল ঠিকানা *</label>
                <input 
                  type="email" 
                  required
                  placeholder="your.email@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">পাসওয়ার্ড *</label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    required
                    minLength={6}
                    placeholder="নূন্যতম ৬ অক্ষর"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-600 transition cursor-pointer"
                    title={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl text-xs transition shadow-md shadow-purple-600/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'আবেদন পাঠানো হচ্ছে...' : 'আবেদন জমা দিন'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}