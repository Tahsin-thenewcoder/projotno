"use client";

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { uploadQnaImage } from '@/lib/qna';
import VoiceRecorder from '@/components/VoiceRecorder';
import AudioPlayer from '@/components/AudioPlayer';
import {
  ArrowLeft,
  ShieldAlert,
  UserCheck,
  EyeOff,
  User,
  Lock,
  Send,
  ImagePlus,
  Trash2,
  CheckCircle2,
  HeartHandshake,
  MessageCircle,
  X
} from 'lucide-react';

export default function HelpCounsellingPage() {
  const [profile, setProfile] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // নতুন হেল্প রিকোয়েস্ট ফর্ম স্টেট
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [postAudioUrl, setPostAudioUrl] = useState('');
  const [postRecKey, setPostRecKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // অ্যাক্টিভ চ্যাট স্টেট
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (prof) {
      setProfile(prof);
      await loadSessions(prof);
    }
    setLoading(false);
  };

  const isMentor = ['mentor', 'admin'].includes(profile?.role?.toLowerCase());

  const loadSessions = async (prof: any) => {
    const mentorRole = ['mentor', 'admin'].includes(prof?.role?.toLowerCase());
    let query = supabase
      .from('help_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    // স্টুডেন্ট শুধু নিজের সেশনগুলো দেখবে, মেন্টররা সব সেশন দেখবে
    if (!mentorRole) {
      query = query.eq('student_id', prof.id);
    }

    const { data } = await query;
    if (data) setSessions(data);
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !description.trim() || submitting) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('help_sessions').insert({
        student_id: profile.id,
        student_name: isAnonymous ? 'বেনামী শিক্ষার্থী' : profile.full_name,
        student_college: isAnonymous ? null : profile.current_college,
        is_anonymous: isAnonymous,
        topic: topic.trim(),
        description: description.trim(),
        audio_url: postAudioUrl || null,
      });

      if (error) throw error;

      setTopic('');
      setDescription('');
      setPostAudioUrl('');
      setPostRecKey((k) => k + 1);
      await loadSessions(profile);
    } catch (err: any) {
      alert('সমস্যা শেয়ার করা যায়নি: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClaimSession = async (sessionId: string) => {
    setBusyId(sessionId);
    try {
      const { error } = await supabase.rpc('claim_help_session', { p_session_id: sessionId });
      if (error) throw error;
      await loadSessions(profile);
      setActiveSessionId(sessionId);
    } catch (err: any) {
      alert(err.message);
      await loadSessions(profile);
    } finally {
      setBusyId(null);
    }
  };

  const handleCloseAndDelete = async (sessionId: string) => {
    const ok = confirm(
      'তুমি কি নিশ্চিত যে তোমার কাউন্সিলিং সম্পন্ন হয়েছে? এটি কনফার্ম করলে এই সেশন এবং সমস্ত চ্যাট ডাটাবেজ থেকে স্থায়ীভাবে মুছে যাবে।'
    );
    if (!ok) return;

    setBusyId(sessionId);
    try {
      const { error } = await supabase.rpc('close_and_delete_help_session', { p_session_id: sessionId });
      if (error) throw error;
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) setActiveSessionId(null);
    } catch (err: any) {
      alert('ডিলিট করতে সমস্যা হয়েছে: ' + err.message);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs font-semibold text-slate-500">
        লোড হচ্ছে...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 pt-4 px-3 sm:px-5 font-sans">
      <div className="max-w-3xl mx-auto space-y-5">
        
        {/* Header */}
        <div className="bg-white border border-purple-200 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-purple-950 flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-purple-600" />
                হেল্প ও ১-অন-১ কাউন্সিলিং
              </h1>
              <p className="text-[11px] text-slate-500">
                {isMentor
                  ? 'যেকোনো একটি সেশনের দায়িত্ব নিয়ে ১-অন-১ পরামর্শ দিন'
                  : 'মানসিক চাপ, পড়াশোনা বা ব্যক্তিগত যেকোনো সমস্যা শেয়ার করো। ভয় নেই, আমরা বড়ভাইরা তোমার পাশে আছি।'}
              </p>
            </div>
          </div>
        </div>

        {/* স্টুডেন্টের জন্য নতুন সমস্যা শেয়ার করার ফর্ম */}
        {!isMentor && (
          <form
            onSubmit={handleCreateSession}
            className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4"
          >
            {/* Identity Toggle Switch */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">পরিচয় গোপন রাখতে চাইলে Anonymous নির্বাচন করো:</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setIsAnonymous(true)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                    isAnonymous
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  Anonymous (গোপন)
                </button>

                <button
                  type="button"
                  onClick={() => setIsAnonymous(false)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                    !isAnonymous
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  নিজের পরিচয়সহ
                </button>
              </div>
              <p className="text-[10px] text-slate-500 px-1">
                {isAnonymous
                  ? '🔒 তোমার নাম বা কলেজ কোনো মেন্টর দেখতে পাবেন না।'
                  : `👤 তোমার নাম (${profile?.full_name}) মেন্টরের কাছে দৃশ্যমান থাকবে।`}
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="বিষয় লিখ (যেমন: পড়াশোনায় মনোযোগ বসছে না / ডিপ্রেশন)"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-purple-500"
              />

              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="তোমার সমস্যার কথা বিস্তারিত লিখ..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-purple-500 resize-none"
              />

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <VoiceRecorder
                  key={postRecKey}
                  onAudioUploaded={(url) => setPostAudioUrl(url)}
                  onClearAudio={() => setPostAudioUrl('')}
                />

                <button
                  type="submit"
                  disabled={submitting || !topic.trim() || !description.trim()}
                  className="ml-auto px-5 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs"
                >
                  {submitting ? 'পাঠানো হচ্ছে...' : 'সাহায্য চাও'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* সেশন লিস্ট */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-600 px-1">
            {isMentor ? `চলমান হেল্প রিকোয়েস্ট সমূহ (${sessions.length})` : `তোমার চলমান সেশন সমূহ (${sessions.length})`}
          </h2>

          {sessions.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-400">
              বর্তমানে কোনো হেল্প সেশন নেই।
            </div>
          ) : (
            sessions.map((s) => {
              const isClaimed = s.status === 'claimed';
              const isClaimedByMe = s.claimed_by === profile?.id;
              const isMyPost = s.student_id === profile?.id;
              const canChat = isMyPost || isClaimedByMe;
              const isOpenChat = activeSessionId === s.id;

              return (
                <div
                  key={s.id}
                  className={`bg-white border rounded-2xl p-4 shadow-xs space-y-3 transition ${
                    isClaimed && !canChat
                      ? 'border-slate-200 opacity-85 bg-slate-50/60'
                      : 'border-purple-200'
                  }`}
                >
                  {/* কার্ড হেডার */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {s.is_anonymous ? (
                          <span className="inline-flex items-center gap-1 bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                            <EyeOff className="w-3 h-3" /> বেনামী শিক্ষার্থী
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                            <User className="w-3 h-3" /> {s.student_name} {s.student_college ? `(${s.student_college})` : ''}
                          </span>
                        )}

                        {isClaimed ? (
                          <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                            <Lock className="w-3 h-3" /> দায়িত্বে: {s.claimed_mentor_name}
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                            মেন্টরের অপেক্ষায়
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm">{s.topic}</h3>
                    </div>

                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(s.created_at).toLocaleDateString('bn-BD')}
                    </span>
                  </div>

                  {/* বর্ণনা ও অডিও */}
                  <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{s.description}</p>
                  {s.audio_url && <AudioPlayer src={s.audio_url} />}

                  {/* অ্যাকশন বাটন সমূহ */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    {/* মেন্টর ভিউ */}
                    {isMentor && !isClaimed && (
                      <button
                        disabled={busyId === s.id}
                        onClick={() => handleClaimSession(s.id)}
                        className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition"
                      >
                        <UserCheck className="w-4 h-4" />
                        {busyId === s.id ? 'যুক্ত হচ্ছে...' : 'দায়িত্ব নিন (Accept 1-on-1)'}
                      </button>
                    )}

                    {isMentor && isClaimed && !isClaimedByMe && (
                      <div className="w-full py-2 px-3 bg-slate-100 border border-slate-200 rounded-xl text-[11px] text-slate-500 font-semibold flex items-center justify-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        এই সেশনটি {s.claimed_mentor_name} নিয়েছেন (Read-Only)
                      </div>
                    )}

                    {/* ১-অন-১ চ্যাট টগল বাটন (শুধু স্টুডেন্ট ও ক্লেইম করা মেন্টরের জন্য) */}
                    {canChat && (
                      <button
                        onClick={() => setActiveSessionId(isOpenChat ? null : s.id)}
                        className="flex-1 py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition"
                      >
                        <MessageCircle className="w-4 h-4" />
                        {isOpenChat ? 'চ্যাট বন্ধ করুন' : '১-অন-১ প্রাইভেট চ্যাট খুলুন'}
                      </button>
                    )}

                    {/* স্টুডেন্টের জন্য সেশন Close ও Delete বাটন */}
                    {isMyPost && (
                      <button
                        disabled={busyId === s.id}
                        onClick={() => handleCloseAndDelete(s.id)}
                        className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer transition"
                        title="কাউন্সিলিং শেষ হলে সেশনটি ডিলিট করো"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        সেশন ক্লোজ ও ডিলিট
                      </button>
                    )}
                  </div>

                  {/* ১-অন-১ প্রাইভেট চ্যাট বক্স */}
                  {canChat && isOpenChat && (
                    <HelpChatBox
                      sessionId={s.id}
                      me={profile}
                      isMentor={isMentor}
                      otherLabel={
                        isMentor
                          ? s.is_anonymous
                            ? 'বেনামী শিক্ষার্থী'
                            : s.student_name
                          : s.claimed_mentor_name || 'মেন্টর'
                      }
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ১-অন-১ হেল্প চ্যাট কম্পোনেন্ট (মোবাইল-ফ্রেন্ডলি ২-লাইন লেআউট সহ)
function HelpChatBox({
  sessionId,
  me,
  isMentor,
  otherLabel,
}: {
  sessionId: string;
  me: any;
  isMentor: boolean;
  otherLabel: string;
}) {
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [recKey, setRecKey] = useState(0);
  const [sending, setSending] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    supabase
      .from('help_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .then(({ data }) => alive && data && setMsgs(data));

    const channel = supabase
      .channel(`help-chat-${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'help_messages', filter: `session_id=eq.${sessionId}` },
        (payload) => setMsgs((cur) => (cur.some((m) => m.id === payload.new.id) ? cur : [...cur, payload.new]))
      )
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [msgs.length]);

  const send = async () => {
    const clean = text.trim();
    if ((!clean && !file && !audioUrl) || sending) return;
    setSending(true);
    try {
      const image_url = file ? await uploadQnaImage(file, 'chat') : null;
      const { data, error } = await supabase
        .from('help_messages')
        .insert({
          session_id: sessionId,
          sender_id: me.id,
          sender_name: isMentor ? me.full_name : 'শিক্ষার্থী',
          sender_role: isMentor ? 'mentor' : 'student',
          message_text: clean,
          image_url,
          audio_url: audioUrl || null,
        })
        .select()
        .single();

      if (error) throw error;
      setMsgs((cur) => (cur.some((m) => m.id === data.id) ? cur : [...cur, data]));
      setText('');
      setFile(null);
      setAudioUrl('');
      setRecKey((k) => k + 1);
    } catch (err: any) {
      alert('মেসেজ পাঠানো যায়নি: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border border-purple-200 rounded-2xl overflow-hidden bg-slate-50 mt-2">
      <div className="flex items-center gap-1.5 px-3 py-2 bg-purple-900 text-white text-[11px] font-semibold">
        <Lock className="w-3 h-3 shrink-0" />
        <span className="truncate">গোপন ১-অন-১ চ্যাট — আপনি ও {otherLabel}</span>
      </div>

      <div ref={boxRef} className="max-h-72 overflow-y-auto p-3 space-y-2">
        {msgs.length === 0 && (
          <p className="text-center text-xs text-slate-400 py-6">
            কথোপকথন শুরু করুন। এখানে পাঠানো সব মেসেজ সেশন ক্লোজ করলে মুছে যাবে।
          </p>
        )}
        {msgs.map((m) => {
          const mine = m.sender_id === me.id;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs space-y-1.5 ${
                  mine
                    ? 'bg-purple-700 text-white rounded-br-sm'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                }`}
              >
                {m.image_url && (
                  <a href={m.image_url} target="_blank" rel="noreferrer">
                    <img src={m.image_url} alt="সংযুক্তি" className="max-h-48 rounded-xl object-cover" />
                  </a>
                )}
                {m.audio_url && (
                  <div className="text-slate-800">
                    <AudioPlayer src={m.audio_url} />
                  </div>
                )}
                {m.message_text && <p className="whitespace-pre-wrap leading-relaxed">{m.message_text}</p>}
                <p className={`text-[9px] ${mine ? 'text-purple-200' : 'text-slate-400'}`}>
                  {new Date(m.created_at).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {file && (
        <div className="px-3 py-2 bg-white border-t border-slate-200 flex items-center gap-2">
          <img src={URL.createObjectURL(file)} alt="" className="w-11 h-11 rounded-lg object-cover border" />
          <span className="text-[11px] text-slate-500 truncate flex-1">{file.name}</span>
          <button type="button" onClick={() => setFile(null)} className="text-slate-400 hover:text-rose-500 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="p-2.5 bg-white border-t border-slate-200 space-y-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={2}
          placeholder="মেসেজ লিখুন..."
          className="w-full resize-none px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-purple-500"
        />

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <label className="p-2 rounded-xl text-slate-500 hover:text-purple-600 hover:bg-purple-50 cursor-pointer shrink-0 transition">
              <ImagePlus className="w-4 h-4" />
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>

            <VoiceRecorder
              key={recKey}
              onAudioUploaded={(url) => setAudioUrl(url)}
              onClearAudio={() => setAudioUrl('')}
            />
          </div>

          <button
            type="button"
            onClick={send}
            disabled={sending || (!text.trim() && !file && !audioUrl)}
            className="px-3.5 py-2 bg-purple-700 hover:bg-purple-800 disabled:opacity-40 text-white text-xs font-bold rounded-xl shrink-0 cursor-pointer flex items-center gap-1.5 transition"
          >
            <span>পাঠান</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}