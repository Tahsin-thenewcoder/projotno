"use client";

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, 
  ShieldAlert, 
  Send, 
  UserX, 
  MessageCircle, 
  HeartHandshake,
  Home,
  MessageSquare,
  ChevronLeft
} from 'lucide-react';

export default function AnonymousHelpPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [threads, setThreads] = useState<any[]>([]);
  const [activeThread, setActiveThread] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Mobile View Switch State (List vs Chat Window)
  const [showMobileChat, setShowMobileChat] = useState(false);

  // New Thread Form State
  const [topic, setTopic] = useState('');
  const [initialMsg, setInitialMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reply Input
  const [replyText, setReplyText] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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

    await loadThreads(session.user.id, profileData?.role);
    setLoading(false);
  };

  const loadThreads = async (userId: string, role?: string) => {
    const isSenior = role === 'admin' || role === 'mentor';
    
    let query = supabase.from('anonymous_threads').select(`
      *,
      anonymous_messages (*)
    `);

    if (isSenior) {
      query = query.or(`assigned_mentor_id.eq.${userId},assigned_mentor_id.is.null`);
    } else {
      query = query.eq('user_id', userId);
    }

    const { data } = await query.order('created_at', { ascending: false });
    if (data) setThreads(data);
  };

  const loadMessages = async (threadId: string) => {
    const { data } = await supabase
      .from('anonymous_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const handleSelectThread = (thread: any) => {
    setActiveThread(thread);
    loadMessages(thread.id);
    setShowMobileChat(true); // Open chat view on mobile
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !initialMsg.trim()) return;

    setSubmitting(true);
    try {
      const anonCode = Math.floor(1000 + Math.random() * 9000);
      const anonName = `Anonymous Student #${anonCode}`;

      const { data: threadData, error: tErr } = await supabase
        .from('anonymous_threads')
        .insert([
          {
            user_id: user.id,
            anonymous_name: anonName,
            topic: topic,
            status: 'pending',
          },
        ])
        .select()
        .single();

      if (tErr) throw tErr;

      const { error: mErr } = await supabase.from('anonymous_messages').insert([
        {
          thread_id: threadData.id,
          sender_id: user.id,
          sender_type: 'student',
          sender_name: anonName,
          message: initialMsg,
        },
      ]);

      if (mErr) throw mErr;

      setTopic('');
      setInitialMsg('');
      await loadThreads(user.id, profile?.role);
      handleSelectThread(threadData);
    } catch (err: any) {
      alert('সমস্যা হয়েছে: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!replyText.trim() || !activeThread) return;

    const isSenior = profile?.role === 'admin' || profile?.role === 'mentor';
    const senderType = isSenior ? 'mentor' : 'student';
    const senderName = isSenior ? (profile?.full_name || 'Senior Mentor') : activeThread.anonymous_name;

    try {
      const { error: msgErr } = await supabase.from('anonymous_messages').insert([
        {
          thread_id: activeThread.id,
          sender_id: user.id,
          sender_type: senderType,
          sender_name: senderName,
          message: replyText,
        },
      ]);

      if (msgErr) throw msgErr;

      let updatedThread = { ...activeThread };

      if (isSenior) {
        const { error: updateErr } = await supabase
          .from('anonymous_threads')
          .update({ 
            assigned_mentor_id: user.id,
            status: 'answered'
          })
          .eq('id', activeThread.id);

        if (!updateErr) {
          updatedThread.assigned_mentor_id = user.id;
          updatedThread.status = 'answered';
        }
      }

      setReplyText('');
      setActiveThread(updatedThread);
      await loadMessages(activeThread.id);
      await loadThreads(user.id, profile?.role);
    } catch (err: any) {
      alert('মেসেজ পাঠাতে সমস্যা হয়েছে: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600 font-semibold text-sm">
        ডাটা লোড হচ্ছে...
      </div>
    );
  }

  const isSenior = profile?.role === 'admin' || profile?.role === 'mentor';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pt-4 sm:pt-8 pb-24 sm:pb-8 px-3 sm:px-4">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Top Navbar */}
        <div className="flex items-center justify-between">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-purple-600 transition bg-white px-3 py-2 sm:px-4 sm:py-2 rounded-xl border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            ড্যাশবোর্ড
          </Link>
          <span className="text-[11px] sm:text-xs text-slate-500 font-medium">
            পরিচয় গোপন থাকবে 🔒
          </span>
        </div>

        {/* Header Banner */}
        <div className="bg-white border border-purple-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 text-purple-700 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
            <UserX className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-xl font-bold text-slate-900">বেনামী হেল্প সাপোর্ট (Anonymous Help)</h1>
            <p className="text-[11px] sm:text-xs text-slate-500">মানসিক চাপ বা যেকোনো সমস্যা গোপন রেখে মেন্টরের সাথে শেয়ার করো। ভয় নেই। আমরা বড়ভাইরা তোমার পাশে আছি।</p>
          </div>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          
          {/* Left Column: Form & List (Hidden on Mobile if Chat view is active) */}
          <div className={`space-y-4 sm:space-y-6 ${showMobileChat ? 'hidden md:block' : 'block'}`}>
            {!isSenior && (
              <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-2">
                  <ShieldAlert className="w-4 h-4 text-purple-600" />
                  নতুন বেনামী মেসেজ লিখুন
                </h2>
                <form onSubmit={handleCreateThread} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">সমস্যার বিষয় / টপিক</label>
                    <input 
                      type="text" 
                      required
                      placeholder="যেমন: পড়া মনে থাকে না / মানসিক চাপ"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">বিস্তারিত বার্তা</label>
                    <textarea 
                      required
                      rows={3}
                      placeholder="তোমার পরিচয় লুকিয়ে এই মেসেজ মেন্টরের কাছে যাবে..."
                      value={initialMsg}
                      onChange={(e) => setInitialMsg(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md shadow-purple-600/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {submitting ? 'পাঠানো হচ্ছে...' : 'গোপনে বার্তা পাঠান'}
                  </button>
                </form>
              </div>
            )}

            {/* Existing Threads List */}
            <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b pb-2">
                {isSenior ? 'মেন্টরশিপ থ্রেডসমূহ' : 'আমার গোপন কনভারসেশন'} ({threads.length})
              </h2>

              {threads.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">কোনো চ্যাট থ্রেড নেই</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {threads.map((t) => {
                    const hasMentorReplied = t.anonymous_messages?.some((m: any) => m.sender_type === 'mentor');
                    const isAnswered = hasMentorReplied || t.assigned_mentor_id || t.status === 'answered';

                    return (
                      <div 
                        key={t.id}
                        onClick={() => handleSelectThread(t)}
                        className={`p-3 rounded-2xl border text-xs cursor-pointer transition ${
                          activeThread?.id === t.id 
                            ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-500/10' 
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-800 truncate max-w-[140px] sm:max-w-[160px]">{t.anonymous_name}</span>
                          {isAnswered ? (
                            <span className="text-[9px] bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                              Answered
                            </span>
                          ) : (
                            <span className="text-[9px] bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                              Pending
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 font-medium truncate">{t.topic}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Chat Box (Visible on Desktop OR Mobile when active) */}
          <div className={`md:col-span-2 ${!showMobileChat ? 'hidden md:block' : 'block'}`}>
            {activeThread ? (
              <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col h-[480px] sm:h-[520px]">
                {/* Chat Header */}
                <div className="flex items-center justify-between border-b pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    {/* Mobile Back Button to list */}
                    <button 
                      onClick={() => setShowMobileChat(false)}
                      className="md:hidden p-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                        <HeartHandshake className="w-4 h-4 text-purple-600 shrink-0" />
                        <span className="truncate max-w-[160px] sm:max-w-none">{activeThread.topic}</span>
                      </h3>
                      <span className="text-[10px] sm:text-[11px] text-slate-400">{activeThread.anonymous_name}</span>
                    </div>
                  </div>
                  <span className="text-[9px] sm:text-[10px] bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-semibold">
                    1-on-1 Confidential
                  </span>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3">
                  {messages.map((m) => {
                    const isMe = m.sender_id === user.id;
                    return (
                      <div 
                        key={m.id} 
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-bold text-slate-500">{m.sender_name}</span>
                          {m.sender_type === 'mentor' && (
                            <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 rounded font-extrabold">Mentor</span>
                          )}
                        </div>
                        <div className={`p-3 sm:p-3.5 rounded-2xl max-w-[85%] sm:max-w-sm text-xs leading-relaxed whitespace-pre-line shadow-sm ${
                          isMe 
                            ? 'bg-purple-600 text-white rounded-br-none' 
                            : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200'
                        }`}>
                          {m.message}
                        </div>
                        <span className="text-[9px] text-slate-400 mt-1">
                          {new Date(m.created_at).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Controls */}
                <div className="flex gap-2 border-t pt-3">
                  <input 
                    type="text" 
                    placeholder="মেসেজ লিখুন..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 px-3.5 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-purple-500"
                  />
                  <button 
                    onClick={handleSendMessage}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center gap-1 shadow-md shadow-purple-600/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    পাঠান
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center h-[480px] sm:h-[520px] space-y-3">
                <MessageCircle className="w-10 h-10 text-slate-300" />
                <p>লিস্ট থেকে কোনো কনভারসেশন সিলেক্ট করো অথবা নতুন বার্তা পাঠাও।</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Fixed Bottom App Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2 px-6 sm:hidden flex justify-around items-center z-40 shadow-lg">
        <Link href="/dashboard" className="flex flex-col items-center gap-1 text-slate-500 hover:text-emerald-600">
          <Home className="w-5 h-5" />
          <span className="text-[10px]">হোম</span>
        </Link>
        <Link href="/qna" className="flex flex-col items-center gap-1 text-slate-500 hover:text-emerald-600">
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px]">Q&A</span>
        </Link>
        <Link href="/anonymous-help" className="flex flex-col items-center gap-1 text-purple-600 font-bold">
          <ShieldAlert className="w-5 h-5" />
          <span className="text-[10px]">হেল্প</span>
        </Link>
      </div>
    </div>
  );
}