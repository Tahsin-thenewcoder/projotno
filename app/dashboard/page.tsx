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
  UserCheck,
  Star,
  Award,
  Zap,
  TrendingUp,
  GraduationCap,
  Phone
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

  const getBadgeTitle = (helps: number) => {
    if (helps >= 50) return { name: 'Legend 👑', color: 'bg-amber-400 text-amber-950 border-amber-300' };
    if (helps >= 20) return { name: 'Top Helper 🥇', color: 'bg-purple-300 text-purple-950 border-purple-200' };
    if (helps >= 5) return { name: 'Active ⭐', color: 'bg-blue-300 text-blue-950 border-blue-200' };
    return { name: 'Rising Star 🚀', color: 'bg-emerald-300 text-emerald-950 border-emerald-200' };
  };

  const mentorBadge = getBadgeTitle(profile?.total_helps || 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-28 sm:pb-8 pt-3 sm:pt-6 px-3 sm:px-4 font-sans">
      <div className="max-w-5xl mx-auto space-y-3.5 sm:space-y-6">
        
        {/* Compact Mobile Header Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center font-bold text-base sm:text-xl shrink-0 border border-purple-200">
                {profile?.full_name?.charAt(0) || 'M'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h1 className="text-sm sm:text-lg font-bold text-slate-900 truncate">{profile?.full_name}</h1>
                  {isAdmin ? (
                    <span className="bg-purple-100 text-purple-700 border border-purple-200 text-[9px] font-bold px-1.5 py-0.2 rounded-md shrink-0">
                      Mentor
                    </span>
                  ) : (
                    <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-[9px] font-bold px-1.5 py-0.2 rounded-md shrink-0">
                      Student
                    </span>
                  )}
                </div>
                <p className="text-[10px] sm:text-xs text-slate-500 truncate">SSC: {profile?.ssc_batch || '2020'}</p>
              </div>
            </div>

            {/* Notification & Logout Compact Action Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="relative">
                <button 
                  onClick={() => setShowNotifMenu(!showNotifMenu)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition relative cursor-pointer"
                  title="নোটিফিকেশন"
                >
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                  {unreadNotifs.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                      {unreadNotifs.length}
                    </span>
                  )}
                </button>

                {showNotifMenu && (
                  <>
                    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 sm:hidden" onClick={() => setShowNotifMenu(false)} />
                    <div className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-auto mt-2 w-[90vw] sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-3.5 z-50 space-y-2">
                      <div className="flex items-center justify-between border-b pb-2">
                        <h3 className="font-bold text-xs text-slate-700">নোটিফিকেশন সমূহ</h3>
                        <button onClick={() => setShowNotifMenu(false)} className="sm:hidden text-slate-400"><X className="w-4 h-4" /></button>
                      </div>
                      {notifications.length === 0 ? (
                        <p className="text-xs text-slate-400 py-3 text-center">কোনো নতুন নোটিফিকেশন নেই</p>
                      ) : (
                        <div className="max-h-56 overflow-y-auto space-y-1.5">
                          {notifications.map((n) => (
                            <div 
                              key={n.id} 
                              onClick={() => markNotifAsRead(n.id)}
                              className={`p-2 rounded-xl text-xs cursor-pointer transition ${
                                n.is_read ? 'bg-slate-50 text-slate-500' : 'bg-emerald-50 text-slate-800 font-semibold border border-emerald-100'
                              }`}
                            >
                              <p>{n.message}</p>
                              <span className="text-[9px] text-slate-400 mt-0.5 block">
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
                className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-2 rounded-xl transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                লগআউট
              </button>
            </div>
          </div>

          {/* Compact Info Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-[11px]">
            {profile?.current_college && (
              <span className="flex items-center gap-1 font-semibold text-purple-900 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100">
                <GraduationCap className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                {profile.current_college}
              </span>
            )}
            {profile?.phone && (
              <span className="flex items-center gap-1 text-slate-600 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                {profile.phone}
              </span>
            )}
          </div>
        </div>

        {/* Dynamic Main Section */}
        {isAdmin ? (
          <div className="space-y-3.5 sm:space-y-6">
            
            {/* Optimized Mobile Performance Card */}
            <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-2xl p-4 sm:p-6 text-white shadow-xs space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-purple-700/60 pb-2.5">
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 shrink-0" />
                  <h2 className="text-xs sm:text-base font-bold">ব্যাজ ও পারফর্মেন্স</h2>
                </div>
                <span className={`text-[10px] sm:text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${mentorBadge.color}`}>
                  {mentorBadge.name}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-0.5">
                <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2 sm:p-3 border border-white/10">
                  <div className="flex items-center justify-center gap-0.5 text-amber-400 font-extrabold text-base sm:text-xl">
                    <Star className="w-3.5 h-3.5 fill-amber-400 shrink-0" />
                    <span>{profile?.avg_rating || '5.0'}</span>
                  </div>
                  <p className="text-[9px] sm:text-xs text-purple-200 mt-0.5">গড় রেটিং</p>
                </div>

                <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2 sm:p-3 border border-white/10">
                  <div className="flex items-center justify-center gap-0.5 text-emerald-400 font-extrabold text-base sm:text-xl">
                    <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                    <span>{profile?.total_helps || 0}</span>
                  </div>
                  <p className="text-[9px] sm:text-xs text-purple-200 mt-0.5">মোট সাহায্য</p>
                </div>

                <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2 sm:p-3 border border-white/10">
                  <div className="flex items-center justify-center gap-0.5 text-cyan-300 font-extrabold text-base sm:text-xl">
                    <Zap className="w-3.5 h-3.5 shrink-0" />
                    <span>{profile?.total_points || 0}</span>
                  </div>
                  <p className="text-[9px] sm:text-xs text-purple-200 mt-0.5">পয়েন্ট</p>
                </div>
              </div>
            </div>

            {/* Mentor Modules Grid */}
            <div className="bg-white border border-purple-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-3">
              <div className="border-b pb-2.5">
                <h2 className="text-sm sm:text-base font-bold text-purple-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                  সিনিয়র মেন্টর প্যানেল
                </h2>
                <p className="text-[10px] sm:text-xs text-slate-500">জুনিয়রদের বিভিন্ন প্রশ্নের যথাযথ উত্তর ও প্রয়োজনীয় দিকনির্দেশনা দিন</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-4">
                <Link 
                  href="/mentor/qna"
                  className="border border-slate-200 rounded-xl p-3.5 hover:border-purple-400 transition bg-slate-50/50 block group cursor-pointer"
                >
                  <div className="flex items-center justify-between sm:block">
                    <div className="flex items-center gap-2.5 sm:block">
                      <HelpCircle className="w-5 h-5 text-purple-600 sm:mb-2 shrink-0" />
                      <div>
                        <h3 className="font-bold text-slate-800 text-xs sm:text-sm group-hover:text-purple-600 transition">অপঠিত প্রশ্নাবলী</h3>
                        <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">জুনিয়রদের একাডেমিক সমস্যা সমাধানে পরামর্শ ও দিকনির্দেশনা প্রদান।</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold bg-purple-600 text-white px-2.5 py-1 rounded-lg shrink-0">
                      উত্তর দিন &rarr;
                    </span>
                  </div>
                </Link>

                <Link 
                  href="/mentor/qna"
                  className="border border-slate-200 rounded-xl p-3.5 hover:border-emerald-400 transition bg-slate-50/50 block group cursor-pointer"
                >
                  <div className="flex items-center justify-between sm:block">
                    <div className="flex items-center gap-2.5 sm:block">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 sm:mb-2 shrink-0" />
                      <div>
                        <h3 className="font-bold text-slate-800 text-xs sm:text-sm group-hover:text-emerald-600 transition">আমার প্রদত্ত উত্তর</h3>
                        <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">পুরোনো থ্রেড দেখুন</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg shrink-0">
                      দেখুন &rarr;
                    </span>
                  </div>
                </Link>

                <Link 
                  href="/anonymous-help"
                  className="border border-slate-200 rounded-xl p-3.5 hover:border-purple-500 transition bg-purple-50/40 block group cursor-pointer"
                >
                  <div className="flex items-center justify-between sm:block">
                    <div className="flex items-center gap-2.5 sm:block">
                      <HeartHandshake className="w-5 h-5 text-purple-600 sm:mb-2 shrink-0" />
                      <div>
                        <h3 className="font-bold text-purple-900 text-xs sm:text-sm group-hover:text-purple-700 transition">বেনামী সাপোর্ট</h3>
                        <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">জুনিয়র সদস্যদের ব্যক্তিগত সমস্যার সমাধানে সুচিন্তিত পরামর্শ ও প্রয়োজনীয় দিকনির্দেশনা প্রদান।</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold bg-purple-600 text-white px-2.5 py-1 rounded-lg shrink-0">
                      চ্যাট &rarr;
                    </span>
                  </div>
                </Link>
              </div>
            </div>

            {/* Admin Verification Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between gap-2 border-b pb-2.5">
                <h3 className="font-bold text-slate-900 text-xs sm:text-base flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>পেন্ডিং আবেদন ({pendingMentors.length})</span>
                </h3>
                <span className="text-[9px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-md border border-purple-200">
                  Admin
                </span>
              </div>

              {pendingMentors.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">কোনো পেন্ডিং মেন্টর আবেদন নেই</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {pendingMentors.map((m) => (
                    <div key={m.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-2 text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900 text-xs truncate">{m.full_name}</span>
                          <span className="bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.2 rounded-md font-bold shrink-0">Pending</span>
                        </div>
                        <p className="text-slate-600 font-medium text-[11px]">{m.current_college}</p>
                        <p className="text-slate-400 text-[10px]">SSC: {m.ssc_batch} • ফোন: {m.phone || 'N/A'}</p>
                      </div>

                      <button
                        onClick={() => handleApproveMentor(m.id)}
                        disabled={approvingId === m.id}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold py-2 rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        {approvingId === m.id ? 'অ্যাপ্রুভ হচ্ছে...' : 'Approve Mentor'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Student View */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-3">
              <h2 className="text-xs sm:text-base font-bold text-slate-900 flex items-center gap-1.5 border-b pb-2">
                <User className="w-4 h-4 text-emerald-600" />
                প্রোফাইল তথ্য
              </h2>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">বর্তমান কলেজ</span>
                  <span className="font-semibold text-slate-700">{profile?.current_college || 'দেওয়া হয়নি'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">অ্যাডমিশন টার্গেট</span>
                  <span className="inline-block mt-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold px-2 py-0.5 rounded-md">
                    {profile?.target_field}
                  </span>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
              <Link 
                href="/qna" 
                className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs hover:border-emerald-500 transition group cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="w-9 h-9 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-xs sm:text-base group-hover:text-emerald-600 transition">একাডেমিক Q&A ফোরাম</h3>
                  <p className="text-[11px] sm:text-xs text-slate-500">পড়াশোনা বা ভর্তি পরীক্ষার যেকোনো প্রশ্ন সিনিয়র মেন্টরদের কাছে করো।</p>
                </div>
                <span className="text-xs font-bold text-emerald-600 mt-3 block">প্রশ্ন করুন &rarr;</span>
              </Link>

              <Link 
                href="/anonymous-help"
                className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs hover:border-purple-500 transition group cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="w-9 h-9 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-xs sm:text-base group-hover:text-purple-600 transition">বেনামী হেল্প সাপোর্ট</h3>
                  <p className="text-[11px] sm:text-xs text-slate-500">মানসিক চাপ বা যেকোনো সমস্যার কথা পরিচয় গোপন রেখে শেয়ার করো।</p>
                </div>
                <span className="text-xs font-bold text-purple-600 mt-3 block">কথা বলুন &rarr;</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Fixed Bottom App Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2 px-4 sm:hidden flex justify-around items-center z-40 shadow-lg">
        <Link href="/dashboard" className="flex flex-col items-center gap-0.5 text-emerald-600 font-bold">
          <Home className="w-4 h-4" />
          <span className="text-[9px]">হোম</span>
        </Link>
        <Link href="/qna" className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-emerald-600">
          <MessageSquare className="w-4 h-4" />
          <span className="text-[9px]">Q&A</span>
        </Link>
        <Link href="/anonymous-help" className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-purple-600">
          <ShieldAlert className="w-4 h-4" />
          <span className="text-[9px]">হেল্প</span>
        </Link>
        <button onClick={handleLogout} className="flex flex-col items-center gap-0.5 text-rose-500">
          <LogOut className="w-4 h-4" />
          <span className="text-[9px]">লগআউট</span>
        </button>
      </div>
    </div>
  );
}