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
  GraduationCap,
  Phone,
  Users,
  Search,
  RefreshCw,
  Clock,
  BarChart3
} from 'lucide-react';

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [pendingMentors, setPendingMentors] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [showStudentList, setShowStudentList] = useState(false);
  const [selectedField, setSelectedField] = useState<string>('ALL');
  const [stats, setStats] = useState({ pendingQna: 0, solvedQna: 0, totalStudents: 0 });
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
      const role = data.role?.toLowerCase();
      if (role === 'admin' || role === 'mentor') {
        await Promise.all([
          loadPendingMentors(),
          loadStudentsAndStats()
        ]);
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

  const loadStudentsAndStats = async () => {
    const [studentsRes, pendingQnaRes, solvedQnaRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, ssc_batch, current_college, target_field, created_at')
        .eq('role', 'student')
        .order('created_at', { ascending: false }),
      supabase
        .from('qna_posts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'open'),
      supabase
        .from('qna_posts')
        .select('id', { count: 'exact', head: true })
        .in('status', ['answered', 'resolved'])
    ]);

    const studentList = studentsRes.data || [];
    setStudents(studentList);
    setStats({
      pendingQna: pendingQnaRes.count || 0,
      solvedQna: solvedQnaRes.count || 0,
      totalStudents: studentList.length
    });
  };

  const loadNotifications = async (userId: string) => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (data) setNotifications(data);
  };

  const handleNotifClick = async (n: any) => {
    if (!n.is_read) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', n.id);
      setNotifications((prev) => prev.map((item) => (item.id === n.id ? { ...item, is_read: true } : item)));
    }
    setShowNotifMenu(false);

    if (n.link) {
      router.push(n.link);
    } else if (n.post_id) {
      const basePath = ['mentor', 'admin'].includes(profile?.role?.toLowerCase()) ? '/mentor/qna' : '/qna';
      router.push(`${basePath}?post=${n.post_id}`);
    }
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

  // Pending Mentor হোল্ডিং স্ক্রিন
  if (profile?.role?.toLowerCase() === 'pending_mentor') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white border border-amber-200 rounded-3xl p-6 sm:p-8 shadow-lg text-center space-y-4">
          <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <span className="inline-block bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              Verification Pending
            </span>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">
              স্বাগতম, {profile?.full_name}!
            </h1>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            আপনার প্রোফাইল এখনো <strong>অ্যাডমিন কর্তৃক ভেরিফাই করা হয়নি</strong>। অ্যাডমিন অ্যাপ্রুভালের পর আপনি মেন্টর হিসেবে পূর্ণ অ্যাক্সেস পাবেন।
          </p>

          <div className="p-3.5 bg-purple-50 border border-purple-100 rounded-2xl text-xs text-purple-900 font-medium leading-relaxed">
            দ্রুত ভেরিফিকেশনের জন্য অনুগ্রহ করে কর্তৃপক্ষের সাথে যোগাযোগ করুন।
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 py-2.5 px-4 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              স্ট্যাটাস রিফ্রেশ করুন
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              লগআউট
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = ['admin', 'mentor'].includes(profile?.role?.toLowerCase());
  const unreadNotifs = notifications.filter(n => !n.is_read);

  // কোন ফিল্ডে কতজন স্টুডেন্ট আগ্রহী তার হিসাব
  const fieldCounts = {
    Engineering: students.filter((s) => s.target_field === 'Engineering').length,
    Medical: students.filter((s) => s.target_field === 'Medical').length,
    Varsity: students.filter((s) => s.target_field === 'Varsity').length,
    Defence: students.filter((s) => s.target_field === 'Defence').length,
  };

  // ফিল্ড ফিল্টার + সার্চ ফিল্টার
  const filteredStudents = students.filter((s) => {
    const matchesField = selectedField === 'ALL' || s.target_field === selectedField;
    const q = studentSearch.toLowerCase().trim();
    if (!q) return matchesField;
    return (
      matchesField &&
      (s.full_name?.toLowerCase().includes(q) ||
        s.current_college?.toLowerCase().includes(q) ||
        s.ssc_batch?.toLowerCase().includes(q) ||
        s.target_field?.toLowerCase().includes(q))
    );
  });

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
                              onClick={() => handleNotifClick(n)}
                              className={`p-2.5 rounded-xl text-xs cursor-pointer transition ${
                                n.is_read ? 'bg-slate-50 text-slate-500 hover:bg-slate-100' : 'bg-emerald-50 text-slate-800 border border-emerald-100 hover:bg-emerald-100/70'
                              }`}
                            >
                              {n.title && <p className="font-bold text-slate-900">{n.title}</p>}
                              {n.message && <p className={n.title ? 'text-[11px] text-slate-600 mt-0.5' : 'font-semibold'}>{n.message}</p>}
                              <span className="text-[9px] text-slate-400 mt-1 block">
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
            
            {/* Real-time Platform Stats Card */}
            <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-2xl p-4 sm:p-6 text-white shadow-xs space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-purple-700/60 pb-2.5">
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-300 shrink-0" />
                  <h2 className="text-xs sm:text-base font-bold">প্ল্যাটফর্ম লাইভ আপডেট</h2>
                </div>
                <span className="text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/15 text-purple-100 border border-white/20">
                  Live Status
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-0.5">
                <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2 sm:p-3 border border-white/10">
                  <div className="flex items-center justify-center gap-1 text-amber-300 font-extrabold text-base sm:text-xl">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>{stats.pendingQna}</span>
                  </div>
                  <p className="text-[9px] sm:text-xs text-purple-200 mt-0.5">অপেক্ষমাণ প্রশ্ন</p>
                </div>

                <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2 sm:p-3 border border-white/10">
                  <div className="flex items-center justify-center gap-1 text-emerald-300 font-extrabold text-base sm:text-xl">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{stats.solvedQna}</span>
                  </div>
                  <p className="text-[9px] sm:text-xs text-purple-200 mt-0.5">মোট সমাধান</p>
                </div>

                <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2 sm:p-3 border border-white/10">
                  <div className="flex items-center justify-center gap-1 text-cyan-300 font-extrabold text-base sm:text-xl">
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span>{stats.totalStudents}</span>
                  </div>
                  <p className="text-[9px] sm:text-xs text-purple-200 mt-0.5">নিবন্ধিত শিক্ষার্থী</p>
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

            {/* Registered Student List & Field Interest Breakdown (Collapsible) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-2 border-b pb-3">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                  <h3 className="font-bold text-slate-900 text-xs sm:text-base">
                    নিবন্ধিত শিক্ষার্থী ও লক্ষ্যভিত্তিক আগ্রহ ({students.length})
                  </h3>
                </div>

                <button
                  onClick={() => setShowStudentList(!showStudentList)}
                  className="text-[11px] font-bold px-3 py-1.5 rounded-xl border transition cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 shrink-0"
                >
                  {showStudentList ? 'তালিকা লুকান ▲' : 'তালিকা দেখুন ▼'}
                </button>
              </div>

              {/* Field-wise Interest Counter Pills (ক্লিক করলেই তালিকা ওপেন ও ফিল্টার হবে) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <button
                  onClick={() => {
                    if (showStudentList && selectedField === 'ALL') {
                      setShowStudentList(false);
                    } else {
                      setSelectedField('ALL');
                      setShowStudentList(true);
                    }
                  }}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    showStudentList && selectedField === 'ALL'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-[10px] opacity-80 block">সকল শিক্ষার্থী</span>
                  <span className="text-sm sm:text-base font-extrabold">{students.length} জন</span>
                </button>

                {[
                  { id: 'Engineering', label: 'Engineering', count: fieldCounts.Engineering, activeClass: 'bg-blue-600 text-white border-blue-600' },
                  { id: 'Medical', label: 'Medical', count: fieldCounts.Medical, activeClass: 'bg-emerald-600 text-white border-emerald-600' },
                  { id: 'Varsity', label: 'Varsity', count: fieldCounts.Varsity, activeClass: 'bg-purple-600 text-white border-purple-600' },
                  { id: 'Defence', label: 'Defence', count: fieldCounts.Defence, activeClass: 'bg-amber-600 text-white border-amber-600' },
                ].map((f) => {
                  const isActive = showStudentList && selectedField === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => {
                        if (isActive) {
                          setShowStudentList(false);
                        } else {
                          setSelectedField(f.id);
                          setShowStudentList(true);
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        isActive
                          ? `${f.activeClass} shadow-xs`
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-[10px] opacity-80 block">{f.label}</span>
                      <span className="text-sm sm:text-base font-extrabold">{f.count} জন</span>
                    </button>
                  );
                })}
              </div>

              {/* শুধুমাত্র ক্লিক করলেই সার্চ বার ও স্টুডেন্ট কার্ড লিস্ট দেখাবে */}
              {showStudentList && (
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-slate-500">
                      দেখানো হচ্ছে: <strong className="text-slate-800">{selectedField === 'ALL' ? 'সকল বিভাগ' : selectedField}</strong> ({filteredStudents.length} জন)
                    </span>

                    <div className="relative w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        placeholder="নাম, কলেজ বা ব্যাচ খুঁজুন..."
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {filteredStudents.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">কোনো শিক্ষার্থী খুঁজে পাওয়া যায়নি।</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-80 overflow-y-auto pr-0.5">
                      {filteredStudents.map((s) => (
                        <div
                          key={s.id}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition space-y-1.5 text-xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-slate-900 truncate">{s.full_name}</span>
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0">
                              SSC {s.ssc_batch}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-0.5">
                            <p className="text-[11px] text-slate-600 flex items-center gap-1 truncate">
                              <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{s.current_college || 'কলেজ দেওয়া হয়নি'}</span>
                            </p>

                            <span className="font-semibold text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100 shrink-0">
                              {s.target_field || 'General'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Admin Verification Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between gap-2 border-b pb-2.5">
                <h3 className="font-bold text-slate-900 text-xs sm:text-base flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>পেন্ডিং মেন্টর আবেদন ({pendingMentors.length})</span>
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
                <span className="text-xs font-bold text-emerald-600 mt-3 block">প্রশ্ন করো &rarr;</span>
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
                <span className="text-xs font-bold text-purple-600 mt-3 block">কথা বলো &rarr;</span>
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
        
        <Link 
          href={isAdmin ? "/mentor/qna" : "/qna"} 
          className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-emerald-600"
        >
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