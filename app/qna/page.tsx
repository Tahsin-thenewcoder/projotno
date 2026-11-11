"use client";

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Plus, ArrowLeft, Search, ImagePlus, X, Edit2, Trash2,
  ThumbsUp, ThumbsDown, RotateCcw, MessageCircle, CheckCircle2, GraduationCap
} from 'lucide-react';
import QnAChat from '@/components/qna/qnachat';
import NotificationBell from '@/components/qna/NotificationBell';
import VoiceRecorder from '@/components/VoiceRecorder';
import AudioPlayer from '@/components/AudioPlayer';
import { ALL_SUBJECTS, SUBJECTS, statusMeta, timeAgo, uploadQnaImage } from '@/lib/qna';

export default function StudentQnAPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<'all' | 'mine'>('all');
  const [subject, setSubject] = useState(ALL_SUBJECTS);
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // প্রশ্ন করার ফর্ম
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [formSubject, setFormSubject] = useState(SUBJECTS[0]);
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const [p, a] = await Promise.all([
      supabase.from('qna_posts').select('*').order('created_at', { ascending: false }),
      supabase.from('qna_answers').select('*').eq('is_active', true).order('created_at', { ascending: true }),
    ]);
    if (p.data) setPosts(p.data);
    if (a.data) setAnswers(a.data);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/login');
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      setProfile(data);
      await load();
      setLoading(false);
      // বেল থেকে এলে ওই প্রশ্ন খুলে দেওয়া
      const postId = new URLSearchParams(window.location.search).get('post');
      if (postId) { setTab('mine'); setOpenId(postId); }
    })();
  }, [load, router]);

  useEffect(() => {
    const ch = supabase
      .channel('qna-student-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'qna_posts' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'qna_answers' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  useEffect(() => {
    if (!loading && openId) {
      setTimeout(() => document.getElementById(`post-${openId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    }
  }, [loading, openId]);

  const resetForm = () => {
    setEditing(null); setTitle(''); setDescription(''); setFormSubject(SUBJECTS[0]); setFile(null); setAudioUrl(''); setShowModal(false);
  };

  const startEdit = (post: any) => {
    setEditing(post); setTitle(post.title); setDescription(post.description);
    setFormSubject(post.subject); setFile(null); setAudioUrl(post.audio_url || ''); setShowModal(true);
  };

  const submitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !profile) return;
    setSubmitting(true);
    try {
      let image_url = editing?.image_url || null;
      if (file) image_url = await uploadQnaImage(file, 'posts');

      if (editing) {
        const { error } = await supabase.from('qna_posts')
          .update({ title: title.trim(), description: description.trim(), subject: formSubject, image_url, audio_url: audioUrl || null })
          .eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('qna_posts').insert({
          user_id: profile.id,
          user_name: profile.full_name || 'Student',
          title: title.trim(),
          description: description.trim(),
          subject: formSubject,
          image_url,
          audio_url: audioUrl || null,
        });
        if (error) throw error;
      }
      resetForm();
      await load();
    } catch (err: any) {
      alert('সমস্যা হয়েছে: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const deletePost = async (post: any) => {
    if (!confirm('প্রশ্নটি মুছে ফেলতে চাও?')) return;
    const { error } = await supabase.from('qna_posts').delete().eq('id', post.id);
    if (error) return alert('মুছতে ব্যর্থ: ' + error.message);
    await load();
  };

  const rate = async (post: any, satisfied: boolean) => {
    setBusyId(post.id);
    const { error } = await supabase.rpc('qna_rate_answer', { p_post_id: post.id, p_satisfied: satisfied });
    setBusyId(null);
    if (error) return alert('সমস্যা হয়েছে: ' + error.message);
    await load();
  };

  const reopenForOther = async (post: any, mentorName: string) => {
    if (!confirm(`${mentorName} আর এই প্রশ্ন দেখতে পাবেন না। অন্য মেন্টররা উত্তর দিতে পারবেন। আপনি কি reopen করতে চান?`)) return;
    setBusyId(post.id);
    const { error } = await supabase.rpc('qna_reopen_for_other', { p_post_id: post.id });
    setBusyId(null);
    if (error) return alert('সমস্যা হয়েছে: ' + error.message);
    setOpenId(null);
    await load();
  };

  const visible = posts.filter((p) => {
    const okTab = tab === 'all' || p.user_id === profile?.id;
    const okSub = subject === ALL_SUBJECTS || p.subject === subject;
    const okSearch = `${p.title} ${p.description}`.toLowerCase().includes(search.toLowerCase());
    return okTab && okSub && okSearch;
  });

  const myCount = posts.filter((p) => p.user_id === profile?.id).length;

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600 font-semibold text-sm">Q&A লোড হচ্ছে...</div>;
  }

  const renderPost = (post: any) => {
    const ans = answers.find((a) => a.post_id === post.id);
    const mine = post.user_id === profile?.id;
    const expanded = openId === post.id;
    const meta = statusMeta(post);
    const busy = busyId === post.id;

    return (
      <div key={post.id} id={`post-${post.id}`} className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-2xs space-y-3 scroll-mt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600">{post.subject}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${meta.cls}`}>{meta.label}</span>
          </div>
          <span className="text-[10px] text-slate-400 shrink-0">{timeAgo(post.created_at)}</span>
        </div>

        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900">{post.title}</h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 whitespace-pre-wrap leading-relaxed">{post.description}</p>
          <p className="text-[10px] text-slate-400 mt-1.5">{mine ? 'আপনার প্রশ্ন' : post.user_name}</p>
        </div>

        {/* প্রশ্নের ভয়েস মেসেজ থাকলে প্লেয়ার দেখাবে */}
        {post.audio_url && (
          <div className="pt-1">
            <AudioPlayer src={post.audio_url} />
          </div>
        )}

        {post.image_url && (
          <a href={post.image_url} target="_blank" rel="noreferrer">
            <img src={post.image_url} alt="প্রশ্নের ছবি" className="max-h-64 rounded-2xl border border-slate-200 object-cover" />
          </a>
        )}

        {/* মেন্টরের প্রথম উত্তর — সবাই দেখবে */}
        {ans && (
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{ans.mentor_name}</p>
                {ans.mentor_college && <p className="text-[10px] text-slate-500 truncate">{ans.mentor_college}</p>}
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{ans.answer_text}</p>
            
            {/* উত্তরের ভয়েস নোট */}
            {ans.audio_url && (
              <div className="pt-1">
                <AudioPlayer src={ans.audio_url} />
              </div>
            )}

            {ans.image_url && (
              <a href={ans.image_url} target="_blank" rel="noreferrer">
                <img src={ans.image_url} alt="উত্তরের ছবি" className="max-h-60 rounded-xl border border-emerald-200 object-cover" />
              </a>
            )}
          </div>
        )}

        {/* শুধু নিজের প্রশ্নে: প্রাইভেট চ্যাট + ফাইন-টিউনড ফিডব্যাক ও Reopen সেকশন */}
{mine && ans && (
  <div className="space-y-3 pt-1">
    {/* প্রাইভেট চ্যাট টগল বাটন */}
    <button
      onClick={() => setOpenId(expanded ? null : post.id)}
      className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-2xl py-2.5 cursor-pointer transition"
    >
      <MessageCircle className="w-4 h-4" />
      {expanded ? 'চ্যাট বন্ধ করুন' : `${ans.mentor_name}-এর সাথে প্রাইভেট চ্যাট`}
    </button>

    {/* প্রাইভেট চ্যাট কম্পোনেন্ট */}
    {expanded && (
      <QnAChat answerId={ans.id} me={profile} otherName={ans.mentor_name} />
    )}

    {/* ফিডব্যাক ও Reopen কার্ড (সবসময় দৃশ্যমান থাকবে) */}
    <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-3.5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold text-slate-700">মেন্টরের উত্তরে আপনি কি সন্তুষ্ট?</p>
        {post.status === 'satisfied' && (
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> সমাধানকৃত
          </span>
        )}
        {post.status === 'unsatisfied' && (
          <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">
            অসন্তুষ্ট
          </span>
        )}
      </div>

      {/* রেটিং বাটন সমূহের ফ্লেক্স লেআউট */}
      <div className="flex gap-2">
        <button
          disabled={busy || post.status === 'satisfied'}
          onClick={() => rate(post, true)}
          className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 rounded-xl border transition cursor-pointer ${
            post.status === 'satisfied'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'
          }`}
        >
          <ThumbsUp className="w-4 h-4" /> সন্তুষ্ট
        </button>

        <button
          disabled={busy || post.status === 'unsatisfied'}
          onClick={() => rate(post, false)}
          className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 rounded-xl border transition cursor-pointer ${
            post.status === 'unsatisfied'
              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
              : 'bg-white text-rose-700 border-rose-300 hover:bg-rose-50'
          }`}
        >
          <ThumbsDown className="w-4 h-4" /> অসন্তুষ্ট
        </button>
      </div>

      {/* অসন্তুষ্ট হলে সাহায্যকারী গাইড ও অন্য টিচারের কাছে পাঠানোর বাটন */}
      {post.status === 'unsatisfied' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
          <p className="text-[11px] text-amber-900 font-medium leading-relaxed">
            💡 চ্যাটে টিচারকে আবারো সরাসরি ভয়েস বা টেক্সটে জিজ্ঞেস করতে পারো। অন্য টিচারের উত্তর চাইলে নিচের বাটনে চাপ দাও:
          </p>
          <button
            disabled={busy}
            onClick={() => reopenForOther(post, ans.mentor_name)}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-amber-800 bg-white hover:bg-amber-100 border border-amber-300 rounded-xl py-2 cursor-pointer transition shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" /> অন্য টিচারের জন্য প্রশ্নটি Reopen করুন
          </button>
        </div>
      )}
    </div>
  </div>
)}

        {/* উত্তরের আগে নিজের প্রশ্ন এডিট/ডিলিট */}
        {mine && !ans && post.status === 'open' && (
          <div className="flex gap-2 pt-1">
            <button onClick={() => startEdit(post)} className="flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl cursor-pointer">
              <Edit2 className="w-3.5 h-3.5" /> এডিট
            </button>
            <button onClick={() => deletePost(post)} className="flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl cursor-pointer">
              <Trash2 className="w-3.5 h-3.5" /> মুছুন
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-24 pt-4 sm:pt-6 px-3 sm:px-4 font-sans">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-600 bg-white px-3.5 py-2.5 rounded-2xl border border-slate-200">
            <ArrowLeft className="w-4 h-4" /> ড্যাশবোর্ড
          </Link>
          <div className="flex items-center gap-2">
            {profile && <NotificationBell userId={profile.id} />}
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs px-4 py-2.5 rounded-2xl transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> প্রশ্ন করুন
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-3.5 sm:p-5 space-y-3.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="প্রশ্ন খুঁজুন..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <button onClick={() => setTab('all')} className={`text-xs font-bold px-3.5 py-1.5 rounded-xl ${tab === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              সর্বশেষ প্রশ্ন ({posts.length})
            </button>
            <button onClick={() => setTab('mine')} className={`text-xs font-bold px-3.5 py-1.5 rounded-xl ${tab === 'mine' ? 'bg-purple-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              আমার প্রশ্ন ({myCount})
            </button>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[ALL_SUBJECTS, ...SUBJECTS].map((s) => (
              <button key={s} onClick={() => setSubject(s)}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap border transition ${subject === s ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {visible.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-3xl py-14 text-center text-xs text-slate-400">
              কোনো প্রশ্ন পাওয়া যায়নি
            </div>
          ) : visible.map(renderPost)}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form onSubmit={submitPost} className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-5 space-y-3.5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-slate-900">{editing ? 'প্রশ্ন এডিট করুন' : 'নতুন প্রশ্ন'}</h2>
              <button type="button" onClick={resetForm} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>

            <select value={formSubject} onChange={(e) => setFormSubject(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
            </select>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="প্রশ্নের শিরোনাম" required
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500" />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="বিস্তারিত লিখুন..." rows={4} required
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500" />

            {/* ছবি ও ভয়েস নোট আপলোড সেকশন */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 border border-slate-200 rounded-xl p-2 bg-slate-50">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-600 cursor-pointer">
                  <ImagePlus className="w-4 h-4 text-emerald-600" /> ছবি যোগ করুন
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </label>

                {/* ভয়েস রেকর্ডার 컴পোনেন্ট */}
                <VoiceRecorder onAudioUploaded={(url) => setAudioUrl(url)} onClearAudio={() => setAudioUrl('')} />
              </div>

              {/* অডিও আপলোড হলে প্রিভিউ দেখাবে */}
              {audioUrl && (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-2 rounded-xl">
                  <AudioPlayer src={audioUrl} />
                  <button type="button" onClick={() => setAudioUrl('')} className="text-xs text-rose-600 font-bold px-2">সরান</button>
                </div>
              )}

              {(file || editing?.image_url) && (
                <div className="mt-2 flex items-center gap-2">
                  <img src={file ? URL.createObjectURL(file) : editing.image_url} alt="" className="w-16 h-16 rounded-xl object-cover border" />
                  {file && <button type="button" onClick={() => setFile(null)} className="text-[11px] text-rose-600 font-bold">সরান</button>}
                </div>
              )}
            </div>

            <button type="submit" disabled={submitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm py-3 rounded-2xl flex items-center justify-center gap-2 cursor-pointer">
              <CheckCircle2 className="w-4 h-4" /> {submitting ? 'জমা হচ্ছে...' : editing ? 'আপডেট করুন' : 'প্রশ্ন জমা দিন'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}