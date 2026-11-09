"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';

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

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // 1. Create Auth User
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

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
        setSubmitted(true);
      }
    } catch (err: any) {
      alert('আবেদনে সমস্যা হয়েছে: ' + err.message);
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
          <div className="bg-white border border-emerald-200 rounded-3xl p-8 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">আবেদন সফলভাবে জমা হয়েছে!</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              ধন্যবাদ <strong>{fullName}</strong>! আপনার মেন্টরশিপ আবেদনটি সূচনা এডমিন প্যানেলে জমা হয়েছে। এডমিন ভেরিফাই করে অ্যাপ্রুভ করলে আপনি ড্যাশবোর্ডে ঢুকতে পারবেন।
            </p>
            <Link href="/login" className="inline-block w-full bg-emerald-600 text-white font-bold py-3 rounded-xl text-xs transition hover:bg-emerald-700">
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
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SSC ব্যাচ *</label>
                  <input 
                    type="text" 
                    required
                    value={sscBatch}
                    onChange={(e) => setSscBatch(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">মোবাইল নম্বর *</label>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">বর্তমান বিশ্ববিদ্যালয় / প্রতিষ্ঠান *</label>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">পাসওয়ার্ড *</label>
                <input 
                  type="password" 
                  required
                  placeholder="নূন্যতম ৬ অক্ষর"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-purple-500"
                />
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