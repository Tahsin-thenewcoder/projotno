"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, 
  MessageSquare, 
  Send, 
  HelpCircle, 
  ShieldCheck,
  Clock,
  Bell,
  Lock,
  Home,
  ShieldAlert,
  X
} from 'lucide-react';

export default function QnAForum() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'my_threads'>('pending');
  const [loading, setLoading] = useState(true);

  // New Question Form State (Student only)
  const [subject, setSubject] = useState('Physics');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Answer / Reply Input State per Question
  const [replyInputs, setReplyInputs] = useState<{ [key: string]: string }>({});

  const router = useRouter();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    setUser(session.user);

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    if (profileData) setProfile(profileData);

    await loadNotifications(session.user.id);
    await loadQuestions();
    setLoading(false);
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

  const loadQuestions = async () => {
    const { data: qData } = await supabase
      .from('questions')
      .select(`*, answers (*)`)
      .order('created_at', { ascending: false });

    if (qData) {
      const sorted = qData.map((q: any) => ({
        ...q,
        answers: q.answers ? q.answers.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) : []
      }));
      setQuestions(sorted);
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('questions').insert([
        {
          user_id: user.id,
          author_name: profile?.full_name || 'Student',
          ssc_batch: profile?.ssc_batch || 'N/A',
          subject,
          title,
          content,
        },
      ]);

      if (error) throw error;

      setTitle('');
      setContent('');
      await loadQuestions();
    } catch (err: any) {
      alert('প্রশ্ন পোস্ট করতে সমস্যা হয়েছে: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostReply = async (question: any) => {
    const text = replyInputs[question.id];
    if (!text || !text.trim()) return;

    const isSenior = profile?.role === 'admin' || profile?.role === 'mentor';

    try {
      // 1. Post Answer/Reply
      const { error: ansError } = await supabase.from('answers').insert([
        {
          question_id: question.id,
          user_id: user.id,
          author_name: profile?.full_name || 'User',
          role: profile?.role || 'student',
          content: text,
        },
      ]);

      if (ansError) throw ansError;

      // 2. If mentor answers for the first time, claim this question
      if (isSenior && !question.assigned_mentor_id) {
        await supabase
          .from('questions')
          .update({ assigned_mentor_id: user.id })
          .eq('id', question.id);
      }

      // 3. Send Notifications
      if (isSenior) {
        await supabase.from('notifications').insert([
          {
            user_id: question.user_id,
            question_id: question.id,
            message: `${profile?.full_name || 'মেন্টর'} তোমার প্রশ্নের উত্তর দিয়েছে!`,
          }
        ]);
      } else {
        if (question.assigned_mentor_id) {
          await supabase.from('notifications').insert([
            {
              user_id: question.assigned_mentor_id,
              question_id: question.id,
              message: `${profile?.full_name || 'ছাত্র'} ফলো-আপ প্রশ্ন করেছে!`,
            }
          ]);
        }
      }

      setReplyInputs({ ...replyInputs, [question.id]: '' });
      await loadQuestions();
    } catch (err: any) {
      alert('মেসেজ পাঠাতে সমস্যা হয়েছে: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600 font-semibold text-sm">
        ফোরাম লোড হচ্ছে...
      </div>
    );
  }

  const isSenior = profile?.role === 'admin' || profile?.role === 'mentor';
  const unreadNotifs = notifications.filter(n => !n.is_read);

  // Filter Questions Logic
  const filteredQuestions = questions.filter((q) => {
    if (isSenior) {
      if (activeTab === 'pending') {
        return !q.assigned_mentor_id;
      } else {
        return q.assigned_mentor_id === user.id;
      }
    } else {
      if (activeTab === 'my_threads') {
        return q.user_id === user.id;
      }
      return true;
    }
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pt-4 sm:pt-8 pb-24 sm:pb-8 px-3 sm:px-4">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Top Navbar */}
        <div className="flex items-center justify-between relative">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-emerald-600 transition bg-white px-3 py-2 sm:px-4 sm:py-2 rounded-xl border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            ড্যাশবোর্ড
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="p-2 sm:p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-600 hover:text-emerald-600 transition relative cursor-pointer"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
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

            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              অ্যাকাউন্ট: <strong className="text-slate-800">{profile?.full_name}</strong> {isSenior && '(Mentor)'}
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 text-emerald-700 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-xl font-bold text-slate-900">
              {isSenior ? 'মেন্টরশিপ Q&A প্যানেল' : 'একাডেমিক Q&A ফোরাম'}
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500">পড়াশোনা, অ্যাডমিশন বুক লিস্ট কিংবা চ্যাপ্টার গাইডেন্স নিয়ে সরাসরি প্রশ্ন করো</p>
          </div>
        </div>

        {/* Ask Question Form (STUDENT ONLY) */}
        {!isSenior && (
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-3 sm:space-y-4">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2 border-b pb-2.5">
              <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
              নতুন প্রশ্ন জমা দিন
            </h2>
            <form onSubmit={handleCreateQuestion} className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-[11px] sm:text-xs font-semibold text-slate-700 mb-1">বিষয় সিলেক্ট কর</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Physics">পদার্থবিজ্ঞান (Physics)</option>
                    <option value="Chemistry">রসায়ন (Chemistry)</option>
                    <option value="Higher Math">উচ্চতর গণিত (Higher Math)</option>
                    <option value="Biology">জীববিজ্ঞান (Biology)</option>
                    <option value="Admission Strategy">অ্যাডমিশন গাইডলাইন</option>
                    <option value="General">অন্যান্য (General)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] sm:text-xs font-semibold text-slate-700 mb-1">প্রশ্নের মূল বিষয় / শিরোনাম *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="যেমন: প্রস্তুতি কীভাবে নেব?"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-slate-700 mb-1">প্রশ্নের বিস্তারিত বর্ণনা *</label>
                <textarea 
                  required
                  rows={3}
                  placeholder="তোমার প্রশ্নটি বিস্তারিতভাবে লেখো..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm transition shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'পোস্ট হচ্ছে...' : 'প্রশ্ন সাবমিট করুন'}
              </button>
            </form>
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 gap-3 sm:gap-4 overflow-x-auto">
          {isSenior ? (
            <>
              <button
                onClick={() => setActiveTab('pending')}
                className={`pb-2.5 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap ${
                  activeTab === 'pending'
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                নতুন অপঠিত প্রশ্ন ({questions.filter(q => !q.assigned_mentor_id).length})
              </button>
              <button
                onClick={() => setActiveTab('my_threads')}
                className={`pb-2.5 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap ${
                  activeTab === 'my_threads'
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                আমার উত্তর দেওয়া থ্রেড ({questions.filter(q => q.assigned_mentor_id === user.id).length})
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('pending')}
                className={`pb-2.5 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap ${
                  activeTab === 'pending'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                সব প্রশ্ন (Public)
              </button>
              <button
                onClick={() => setActiveTab('my_threads')}
                className={`pb-2.5 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap ${
                  activeTab === 'my_threads'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                আমার প্রশ্নসমূহ ({questions.filter(q => q.user_id === user.id).length})
              </button>
            </>
          )}
        </div>

        {/* Feed of Questions */}
        <div className="space-y-3 sm:space-y-4">
          {filteredQuestions.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-6 text-center text-slate-400 text-xs sm:text-sm">
              এই সেকশনে কোনো প্রশ্ন নেই।
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const answersList = q.answers || [];
              const isMyQuestion = q.user_id === user.id;
              const isAssignedMentor = q.assigned_mentor_id === user.id;
              const hasMentorAnswered = answersList.some((ans: any) => ans.role === 'admin' || ans.role === 'mentor');

              return (
                <div key={q.id} className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-3 sm:space-y-4">
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm shrink-0">
                        {q.author_name?.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm text-slate-900">{q.author_name}</span>
                          <span className="bg-slate-100 text-slate-600 text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-md font-semibold">
                            SSC {q.ssc_batch}
                          </span>
                        </div>
                        <span className="text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> {new Date(q.created_at).toLocaleDateString('bn-BD')}
                        </span>
                      </div>
                    </div>

                    <span className="self-start sm:self-center bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] sm:text-xs font-bold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full">
                      {q.subject}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="space-y-1">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">{q.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">{q.content}</p>
                  </div>

                  {/* Answers & Chat Section */}
                  <div className="pt-2 sm:pt-3 border-t space-y-2.5 sm:space-y-3">
                    <h4 className="text-[11px] sm:text-xs font-bold text-slate-500">
                      উত্তর ও আলোচনা ({answersList.length}):
                    </h4>

                    {answersList.length > 0 && (
                      <div className="space-y-2 sm:space-y-3 pl-2 sm:pl-4 border-l-2 border-emerald-300">
                        {answersList.map((ans: any) => {
                          const ansIsMentor = ans.role === 'admin' || ans.role === 'mentor';
                          return (
                            <div 
                              key={ans.id} 
                              className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 space-y-1 border ${
                                ansIsMentor 
                                  ? 'bg-emerald-50/70 border-emerald-200' 
                                  : 'bg-slate-50 border-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-900">{ans.author_name}</span>
                                {ansIsMentor && (
                                  <span className="bg-purple-100 text-purple-700 border border-purple-200 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                    <ShieldCheck className="w-3 h-3" /> Mentor
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">{ans.content}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* DYNAMIC INPUT CONTROL LOGIC */}
                    <div className="pt-1 sm:pt-2">
                      {/* CASE 1: MENTOR GIVING 1ST ANSWER */}
                      {isSenior && !q.assigned_mentor_id && (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input 
                            type="text" 
                            placeholder="সিনিয়র মেন্টর হিসেবে উত্তর লিখুন..."
                            value={replyInputs[q.id] || ''}
                            onChange={(e) => setReplyInputs({ ...replyInputs, [q.id]: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && handlePostReply(q)}
                            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 transition"
                          />
                          <button 
                            onClick={() => handlePostReply(q)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
                          >
                            <Send className="w-3.5 h-3.5" />
                            উত্তর দিন
                          </button>
                        </div>
                      )}

                      {/* CASE 2: FOLLOW-UP CHAT */}
                      {(isAssignedMentor || (isMyQuestion && hasMentorAnswered)) && (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input 
                            type="text" 
                            placeholder={isMyQuestion ? "মেন্টরকে ফলো-আপ প্রশ্ন করুন..." : "ফলো-আপ উত্তর লিখুন..."}
                            value={replyInputs[q.id] || ''}
                            onChange={(e) => setReplyInputs({ ...replyInputs, [q.id]: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && handlePostReply(q)}
                            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 transition"
                          />
                          <button 
                            onClick={() => handlePostReply(q)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
                          >
                            <Send className="w-3.5 h-3.5" />
                            পাঠান
                          </button>
                        </div>
                      )}

                      {/* CASE 3: STUDENT WAITING */}
                      {isMyQuestion && !hasMentorAnswered && (
                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-[11px] sm:text-xs text-amber-700 font-medium">
                          <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          মেন্টরের উত্তরের জন্য অপেক্ষা করা হচ্ছে... উত্তর দিলে তুমি ফলো-আপ মেসেজ দিতে পারবে।
                        </div>
                      )}

                      {/* CASE 4: PUBLIC VIEW */}
                      {!isSenior && !isMyQuestion && (
                        <div className="text-[10px] sm:text-[11px] text-slate-400 italic">
                          * এটি একটি পাবলিক প্রশ্ন। কেবল মেন্টর ও প্রশ্নকারী ছাত্র এখানে ফলো-আপ কথা বলতে পারবে।
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Mobile Fixed Bottom App Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2 px-6 sm:hidden flex justify-around items-center z-40 shadow-lg">
        <Link href="/dashboard" className="flex flex-col items-center gap-1 text-slate-500 hover:text-emerald-600">
          <Home className="w-5 h-5" />
          <span className="text-[10px]">হোম</span>
        </Link>
        <Link href="/qna" className="flex flex-col items-center gap-1 text-emerald-600 font-bold">
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px]">Q&A</span>
        </Link>
        <Link href="/anonymous-help" className="flex flex-col items-center gap-1 text-slate-500 hover:text-purple-600">
          <ShieldAlert className="w-5 h-5" />
          <span className="text-[10px]">হেল্প</span>
        </Link>
        <button onClick={() => setShowNotifMenu(true)} className="flex flex-col items-center gap-1 text-slate-500 relative">
          <Bell className="w-5 h-5" />
          {unreadNotifs.length > 0 && (
            <span className="absolute -top-1 right-2 bg-rose-500 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
              {unreadNotifs.length}
            </span>
          )}
          <span className="text-[10px]">নোটিফিকেশন</span>
        </button>
      </div>
    </div>
  );
}