"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  User, 
  LogOut, 
  MessageSquare, 
  ShieldAlert,
  ShieldCheck,
  HelpCircle,
  CheckCircle2,
  HeartHandshake,
  Bell,
  Home,
  X,
  UserCheck
} from 'lucide-react';

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [pendingMentors, setPendingMentors] = useState<any[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      router.push('/login');
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (data) {
      setProfile(data);
      if (data.role === 'admin' || data.role === 'mentor') {
        await loadPendingMentors();
      }
    }

    await loadNotifications(session.user.id);
    setLoading(false);
  };

  const loadPendingMentors = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'pending_mentor')
      .order('created_at', { ascending: false });
    if (data) setPendingMentors(data);
  };

  const loadNotifications = async (userId: string) => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (data) setNotifications(data);
  };

  const markNotifAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleApproveMentor = async (mentorId: string) => {
    setApprovingId(mentorId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'mentor' })
        .eq('id', mentorId);

      if (error) throw error;

      alert('মেন্টর আবেদন সফলভাবে অ্যাপ্রুভ করা হয়েছে!');
      setPendingMentors(pendingMentors.filter(m => m.id !== mentorId));
    } catch (err: any) {
      alert('অ্যাপ্রুভ করতে সমস্যা হয়েছে: ' + err.message);
    } finally {
      setApprovingId(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600 font-semibold text-sm">
        ডাটা লোড হচ্ছে...
      </div>
    );
  }

  const isAdmin = profile?.role === 'admin' || profile?.role === 'mentor';
  const unreadNotifs = notifications.filter(n => !n.is_read);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-28 sm:pb-8 pt-4 sm:pt-8 px-3 sm:px-4 font-sans">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Top Navbar Header */}
        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-11 h-11 sm:w-14 sm:h-14 bg-emerald-100 text-emerald-700 rounded-xl sm:rounded-2xl flex items-center justify-center font-bold text-lg sm:text-xl shrink-0">
              {profile?.full_name?.charAt(0) || 'P'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h1 className="text-base sm:text-xl font-bold text-slate-900 truncate">{profile?.full_name}</h1>
                {isAdmin ? (
                  <span className="bg-purple-100 text-purple-700 border border-purple-200 text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                    <ShieldCheck className="w-3 h-3" /> Mentor / Senior
                  </span>
                ) : (
                  <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0">
                    Junior Student
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">SSC ব্যাচ: {profile?.ssc_batch}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="p-2 sm:p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 hover:text-emerald-600 transition relative cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center animate-pulse">
                    {unreadNotifs.length}
                  </span>
                )}
              </button>

              {/* Notification Menu */}
              {showNotifMenu && (
                <>
                  <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 sm:hidden" onClick={() => setShowNotifMenu(false)} />
                  <div className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-auto mt-2 w-[92vw] sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 space-y-2">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h3 className="font-bold text-xs text-slate-700">নোটিফিকেশন সমূহ</h3>
                      <button onClick={() => setShowNotifMenu(false)} className="sm:hidden text-slate-400"><X className="w-4 h-4" /></button>
                    </div>
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">কোনো নতুন নোটিফিকেশন নেই</p>
                    ) : (
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {notifications.map((n) => (
                          <div 
                            key={n.id} 
                            onClick={() => markNotifAsRead(n.id)}
                            className={`p-2.5 rounded-xl text-xs cursor-pointer transition ${
                              n.is_read ? 'bg-slate-50 text-slate-500' : 'bg-emerald-50 text-slate-800 font-semibold border border-emerald-100'
                            }`}
                          >
                            <p>{n.message}</p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(n.created_at).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <button 
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-4 py-2.5 rounded-xl transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              লগআউট
            </button>
          </div>
        </div>

        {/* Dynamic Main Section */}
        {isAdmin ? (
          <div className="space-y-4 sm:space-y-6">
            {/* Mentor Modules */}
            <div className="bg-white border border-purple-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3 sm:pb-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-purple-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0" />
                    সিনিয়র মেন্টর প্যানেল
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-500">জুনিয়রদের প্রশ্নের সমাধান দিন</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 pt-1">
                <Link 
                  href="/qna"
                  className="border border-slate-200 rounded-2xl p-4 sm:p-5 hover:border-purple-400 transition bg-slate-50/50 block group cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <HelpCircle className="w-6 h-6 text-purple-600 mb-2" />
                    <h3 className="font-bold text-slate-800 text-sm group-hover:text-purple-600 transition">নতুন অপঠিত প্রশ্নাবলী</h3>
                    <p className="text-xs text-slate-500 mt-1">জুনিয়রদের পেন্ডিং পোস্ট দেখে উত্তর দিন।</p>
                  </div>
                  <span className="mt-4 text-center text-xs font-bold bg-purple-600 text-white px-4 py-2.5 rounded-xl group-hover:bg-purple-700 transition w-full sm:w-max block">
                    উত্তর দিন &rarr;
                  </span>
                </Link>

                <Link 
                  href="/qna"
                  className="border border-slate-200 rounded-2xl p-4 sm:p-5 hover:border-emerald-400 transition bg-slate-50/50 block group cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 mb-2" />
                    <h3 className="font-bold text-slate-800 text-sm group-hover:text-emerald-600 transition">আমার উত্তর দেওয়া থ্রেড</h3>
                    <p className="text-xs text-slate-500 mt-1">যেসব প্রশ্নের উত্তর অলরেডি দিয়েছ।</p>
                  </div>
                  <span className="mt-4 text-center text-xs font-bold bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl group-hover:bg-slate-300 transition w-full sm:w-max block">
                    থ্রেড দেখুন &rarr;
                  </span>
                </Link>

                <Link 
                  href="/anonymous-help"
                  className="border border-slate-200 rounded-2xl p-4 sm:p-5 hover:border-purple-500 transition bg-purple-50/40 block group cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <HeartHandshake className="w-6 h-6 text-purple-600 mb-2" />
                    <h3 className="font-bold text-purple-900 text-sm group-hover:text-purple-700 transition">বেনামী হেল্প সাপোর্ট</h3>
                    <p className="text-xs text-slate-500 mt-1">জুনিয়রদের পাঠানো গোপন মানসিক সহায়তার মেসেজ।</p>
                  </div>
                  <span className="mt-4 text-center text-xs font-bold bg-purple-600 text-white px-4 py-2.5 rounded-xl group-hover:bg-purple-700 transition w-full sm:w-max block">
                    গোপন চ্যাট &rarr;
                  </span>
                </Link>
              </div>
            </div>

            {/* FIXED MOBILE LAYOUT: Pending Mentor Applications */}
            <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 shrink-0" />
                  <span>পেন্ডিং মেন্টর আবেদনসমূহ ({pendingMentors.length})</span>
                </h3>
                <span className="self-start sm:self-auto text-[9px] sm:text-[10px] bg-purple-100 text-purple-700 font-bold px-2.5 py-1 rounded-full border border-purple-200">
                  Admin Verification
                </span>
              </div>

              {pendingMentors.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">কোনো নতুন মেন্টর আবেদন পেন্ডিং নেই</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {pendingMentors.map((m) => (
                    <div key={m.id} className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900 text-sm truncate">{m.full_name}</span>
                          <span className="bg-amber-100 text-amber-700 text-[9px] px-2 py-0.5 rounded-full font-bold shrink-0">Pending</span>
                        </div>
                        <p className="text-slate-600 font-semibold">{m.current_college}</p>
                        <p className="text-slate-400 text-[11px]">SSC ব্যাচ: {m.ssc_batch} • ফোন: {m.phone || 'N/A'}</p>
                      </div>

                      <button
                        onClick={() => handleApproveMentor(m.id)}
                        disabled={approvingId === m.id}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        {approvingId === m.id ? 'অ্যাপ্রুভ হচ্ছে...' : 'Approve as Mentor'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Student View */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs space-y-3">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2 border-b pb-2 sm:pb-3">
                <User className="w-4 h-4 text-emerald-600" />
                প্রোফাইল তথ্য
              </h2>
              <div className="space-y-2.5 text-xs sm:text-sm">
                <div>
                  <span className="text-slate-400 text-[11px] block">বর্তমান কলেজ</span>
                  <span className="font-semibold text-slate-700">{profile?.current_college || 'দেওয়া হয়নি'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">অ্যাডমিশন টার্গেট</span>
                  <span className="inline-block mt-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {profile?.target_field}
                  </span>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Link 
                href="/qna" 
                className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs hover:border-emerald-500 transition group cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-2 sm:space-y-3">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-emerald-600 transition">একাডেমিক Q&A ফোরাম</h3>
                  <p className="text-xs text-slate-500">পড়াশোনা বা ভর্তি পরীক্ষার যেকোনো প্রশ্ন সূচনা সংগঠনের বড় ভাইদের কাছে করো।</p>
                </div>
                <span className="text-xs font-bold text-emerald-600 mt-4 block">প্রশ্ন করুন &rarr;</span>
              </Link>

              <Link 
                href="/anonymous-help"
                className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs hover:border-purple-500 transition group cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-2 sm:space-y-3">
                  <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-purple-600 transition">বেনামী হেল্প সাপোর্ট</h3>
                  <p className="text-xs text-slate-500">মানসিক চাপ বা যেকোনো সমস্যার কথা পরিচয় গোপন রেখে শেয়ার করো।</p>
                </div>
                <span className="text-xs font-bold text-purple-600 mt-4 block">কথা বলুন &rarr;</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Fixed Bottom App Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2.5 px-6 sm:hidden flex justify-around items-center z-40 shadow-lg">
        <Link href="/dashboard" className="flex flex-col items-center gap-1 text-emerald-600 font-bold">
          <Home className="w-5 h-5" />
          <span className="text-[10px]">হোম</span>
        </Link>
        <Link href="/qna" className="flex flex-col items-center gap-1 text-slate-500 hover:text-emerald-600">
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px]">Q&A</span>
        </Link>
        <Link href="/anonymous-help" className="flex flex-col items-center gap-1 text-slate-500 hover:text-purple-600">
          <ShieldAlert className="w-5 h-5" />
          <span className="text-[10px]">হেল্প</span>
        </Link>
        <button onClick={handleLogout} className="flex flex-col items-center gap-1 text-rose-500">
          <LogOut className="w-5 h-5" />
          <span className="text-[10px]">লগআউট</span>
        </button>
      </div>
    </div>
  );
}