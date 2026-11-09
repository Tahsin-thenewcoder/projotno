"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  User, 
  Phone, 
  School, 
  ArrowLeft, 
  CheckCircle2, 
  Sparkles,
  Globe,
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    facebookUrl: '',
    sscBatch: '2021',
    currentCollege: '',
    targetField: 'Engineering',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Supabase Auth-এ অ্যাকাউন্ট তৈরি
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      const user = authData.user;
      if (!user) {
        throw new Error('User creation failed. Please check your Supabase Email Auth settings.');
      }

      // 2. Profiles টেবিলে ডাটা সেভ
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: user.id,
          full_name: formData.fullName,
          phone: formData.phone,
          ssc_batch: formData.sscBatch,
          current_college: formData.currentCollege,
          target_field: formData.targetField,
          facebook_url: formData.facebookUrl,
        },
      ]);

      if (profileError) {
        throw new Error(profileError.message);
      }

      setSubmitted(true);
    } catch (error: any) {
      console.error('Registration Error Details:', error);
      setErrorMsg(error?.message || 'রেজিস্ট্রেশন করতে সমস্যা হয়েছে, আবার চেষ্টা করো।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-emerald-500 selection:text-white py-8 px-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 -right-40 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-2xl mx-auto relative z-10">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-600 transition mb-6 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          হোমপেজে ফিরে যান
        </Link>

        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xl p-6 sm:p-10 backdrop-blur-xl">
          <div className="text-center mb-8 space-y-2">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              প্রযত্ন-এ একাউন্ট তৈরি করুন
            </h1>
            <p className="text-slate-500 text-sm">
              Star চিহ্নিত ফিল্ডগুলো অবশ্যই পূরণ করতে হবে। 
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          {submitted ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">রেজিস্ট্রেশন সফল হয়েছে!</h2>
              <p className="text-slate-600 text-sm max-w-md mx-auto">
                ধন্যবাদ, <span className="font-bold text-emerald-600">{formData.fullName}</span>! তোমার একাউন্ট তৈরি হয়েছে। এখন তুমি লগইন করতে পারো।
              </p>
              <div className="pt-4">
                <Link 
                  href="/login" 
                  className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl transition shadow-md shadow-emerald-600/20"
                >
                  লগইন করুন
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">পূর্ণ নাম *</label>
                <div className="relative">
                  <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                  <input 
                    type="text" 
                    required
                    placeholder="যেমন: তানজিম আহমেদ"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white text-slate-800 text-sm transition"
                  />
                </div>
              </div>

              {/* Email & Password Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">ইমেইল এড্রেস *</label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                    <input 
                      type="email" 
                      required
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white text-slate-800 text-sm transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">পাসওয়ার্ড *</label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required
                      minLength={6}
                      placeholder="সর্বনিম্ন ৬ অক্ষর"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white text-slate-800 text-sm transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* SSC Batch */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">বহদ্দারকাটা উচ্চ বিদ্যালয় SSC ব্যাচ *</label>
                <div className="flex flex-wrap gap-2">
                  {['2025', '2026', '2027'].map((batch) => (
                    <button
                      key={batch}
                      type="button"
                      onClick={() => setFormData({...formData, sscBatch: batch})}
                      className={`px-4 py-2 rounded-xl text-sm border transition-all ${
                        formData.sscBatch === batch
                          ? 'border-emerald-500 bg-emerald-600 text-white shadow-md font-bold'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 font-medium'
                      }`}
                    >
                      SSC {batch}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">মোবাইল নম্বর *</label>
                <div className="relative">
                  <Phone className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                  <input 
                    type="tel" 
                    required
                    placeholder="01XXXXXXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white text-slate-800 text-sm transition"
                  />
                </div>
              </div>

              {/* Current College */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">বর্তমান কলেজ ও অবস্থান *</label>
                <div className="relative">
                  <School className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                  <input 
                    type="text" 
                    required
                    placeholder="যেমন: চট্টগ্রাম কলেজ"
                    value={formData.currentCollege}
                    onChange={(e) => setFormData({...formData, currentCollege: e.target.value})}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white text-slate-800 text-sm transition"
                  />
                </div>
              </div>

              {/* Target / Goal Field */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">অ্যাডমিশন লক্ষ্য *</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'Engineering', label: 'Engineering', desc: 'বুয়েট, রুয়েট, চুয়েট' },
                    { id: 'Medical', label: 'Medical', desc: 'মেডিকেল ও ডেন্টাল' },
                    { id: 'Varsity', label: 'Varsity (A/B/C)', desc: 'ঢাবি, চবি, রাবি, গুচ্ছ' },
                    { id: 'Defence', label: 'Armed Forces', desc: 'সেনা, নৌ, বিমানবাহিনী' },
                  ].map((field) => (
                    <div
                      key={field.id}
                      onClick={() => setFormData({...formData, targetField: field.id})}
                      className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                        formData.targetField === field.id
                          ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-slate-800 text-sm">{field.label}</span>
                        {formData.targetField === field.id && (
                          <Sparkles className="w-4 h-4 text-emerald-600" />
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500">{field.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Facebook Profile Link */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">ফেসবুক প্রোফাইল লিংক (ঐচ্ছিক)</label>
                <div className="relative">
                  <Globe className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                  <input 
                    type="url" 
                    placeholder="https://facebook.com/your.id"
                    value={formData.facebookUrl}
                    onChange={(e) => setFormData({...formData, facebookUrl: e.target.value})}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white text-slate-800 text-sm transition"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] mt-4 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'একাউন্ট তৈরি হচ্ছে...' : 'একাউন্ট তৈরি সম্পন্ন করুন'}
              </button>

              <p className="text-center text-xs text-slate-500 mt-4">
                আগে থেকেই একাউন্ট আছে?{' '}
                <Link href="/login" className="text-emerald-600 font-bold hover:underline">
                  লগইন করুন
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}