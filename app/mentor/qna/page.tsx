"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, ImagePlus, X, Edit2, Trash2, MessageCircle, Send, Inbox, BookOpen } from 'lucide-react';
import QnAChat from '@/components/qna/qnachat';
import NotificationBell from '@/components/qna/NotificationBell';
import VoiceRecorder from '@/components/VoiceRecorder';
import AudioPlayer from '@/components/AudioPlayer';
import { ALL_SUBJECTS, SUBJECTS, statusMeta, timeAgo, uploadQnaImage } from '@/lib/qna';

export default function MentorQnAPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<'unsolved' | 'mine'>('unsolved');
  const [subject, setSubject] = useState(ALL_SUBJECTS);
  const [openId, setOpenId] = useState<string | null>(null);

  // উত্তর দেওয়া / এডিট
  const [target, setTarget] = useState<any>(null);        // যে প্রশ্নের উত্তর দিচ্ছি
  const [editingAns, setEditingAns] = useState<any>(null);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const [p, a] = await Promise.all([
      supabase.from('qna_posts').select('*').order('created_at', { ascending: false }),
      supabase.from('qna_answers').select('*').order('created_at', { ascending: true }),
    ]);
    if (p.data) setPosts(p.data);
    if (a.data) setAnswers(a.data);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/login');
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (!data || !['mentor', 'admin'].includes(data.role)) return router.push('/qna');
      setProfile(data);
      await load();
      setLoading(false);
      const postId = new URLSearchParams(window.location.search).get('post');
      if (postId) { setTab('mine'); setOpenId(postId); }
    })();
  }, [load, router]);

  useEffect(() => {
    const ch = supabase
      .channel('qna-mentor-live')
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

  // আমার জন্য অমীমাংসিত: কেউ উত্তর দেয়নি + আমি excluded নই
  const unsolved = useMemo(
    () => posts.filter((p) => p.status === 'open' && !(p.excluded_mentor_ids || []).includes(profile?.id)),
    [posts, profile]
  );

  const countBySubject = useMemo(() => {
    const m: Record<string, number> = {};
    unsolved.forEach((p) => { m[p.subject] = (m[p.subject] || 0) + 1; });
    return m;
  }, [unsolved]);

  const unsolvedShown = unsolved.filter((p) => subject === ALL_SUBJECTS || p.subject === subject);

  const myAnswers = answers.filter((a) => a.mentor_id === profile?.id);
  const myPosts = posts
    .filter((p) => myAnswers.some((a) => a.post_id === p.id))
    .filter((p) => subject === ALL_SUBJECTS || p.subject === subject);

  const closeModal = () => { setTarget(null); setEditingAns(null); setText(''); setFile(null); setAudioUrl(''); };

  const startAnswer = (post: any) => { setTarget(post); setEditingAns(null); setText(''); setFile(null); setAudioUrl(''); };
  const startEdit = (post: any, ans: any) => { setTarget(post); setEditingAns(ans); setText(ans.answer_text); setFile(null); setAudioUrl(ans.audio_url || ''); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!text.trim() && !audioUrl) || !target || submitting) return;
    setSubmitting(true);
    try {
      let image_url: string | null = editingAns?.image_url || null;
      if (file) image_url = await uploadQnaImage(file, 'answers');

      const { error } = editingAns
        ? await supabase.rpc('qna_edit_answer', { p_answer_id: editingAns.id, p_text: text, p_image: image_url, p_audio: audioUrl || null })
        : await supabase.rpc('qna_submit_answer', { p_post_id: target.id, p_text: text, p_image: image_url, p_audio: audioUrl || null });
      
      // যদি RPC সরাসরি p_audio না নেয়, তবে ফলব্যাক আপডেট
      if (error && error.message.includes('p_audio')) {
        const { error: fallbackErr } = editingAns
          ? await supabase.from('qna_answers').update({ answer_text: text, image_url, audio_url: audioUrl || null }).eq('id', editingAns.id)
          : await supabase.from('qna_answers').insert({ post_id: target.id, mentor_id: profile.id, mentor_name: profile.full_name, answer_text: text, image_url, audio_url: audioUrl || null });
        if (fallbackErr) throw fallbackErr;
      } else if (error) {
        throw error;
      }

      closeModal();
      await load();
      if (!editingAns) setTab('mine');
    } catch (err: any) {
      alert(err.message);
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  const deleteAnswer = async (ans: any) => {
    if (!confirm('উত্তর ও চ্যাট মুছে ফেললে প্রশ্নটি আবার অমীমাংসিত হবে। নিশ্চিত?')) return;
    const { error } = await supabase.rpc('qna_delete_answer', { p_answer_id: ans.id });
    if (error) return alert(error.message);
    await load();
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600 font-semibold text-sm">মেন্টর Q&A লোড হচ্ছে...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-24 pt-4 sm:pt-6 px-3 sm:px-4 font-sans">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-purple-600 bg-white px-3.5 py-2.5 rounded-2xl border border-slate-200">
            <ArrowLeft className="w-4 h-4" /> ড্যাশবোর্ড
          </Link>
          {profile && <NotificationBell userId={profile.id} />}
        </div>

        {/* ক্যাটাগরি অনুযায়ী অমীমাংসিত সংখ্যা */}
        <div className="bg-white border border-slate-200 rounded-3xl p-3.5 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="font-extrabold text-slate-900 text-base sm:text-lg">মেন্টর Q&A</h1>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
              মোট অমীমাংসিত: {unsolved.length}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SUBJECTS.map((s) => {
              const n = countBySubject[s] || 0;
              const active = subject === s;
              return (
                <button key={s}
                  onClick={() => { setSubject(active ? ALL_SUBJECTS : s); setTab('unsolved'); }}
                  className={`text-left rounded-2xl border px-3 py-2.5 transition cursor-pointer ${active ? 'border-purple-500 bg-purple-50' : 'border-slate-200 bg-white hover:border-purple-300'}`}>
                  <p className="text-[11px] font-bold text-slate-700 truncate">{s}</p>
                  <p className={`text-lg font-extrabold ${n > 0 ? 'text-rose-600' : 'text-slate-300'}`}>
                    {n} <span className="text-[10px] font-semibold text-slate-400">অমীমাংসিত</span>
                  </p>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
            <button onClick={() => setTab('unsolved')} className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl ${tab === 'unsolved' ? 'bg-purple-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              <Inbox className="w-3.5 h-3.5" /> অমীমাংসিত ({unsolvedShown.length})
            </button>
            <button onClick={() => setTab('mine')} className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl ${tab === 'mine' ? 'bg-purple-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              <BookOpen className="w-3.5 h-3.5" /> আমার উত্তর ({myPosts.length})
            </button>
            {subject !== ALL_SUBJECTS && (
              <button onClick={() => setSubject(ALL_SUBJECTS)} className="ml-auto text-[11px] font-bold text-slate-500 flex items-center gap-1">
                {subject} <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* অমীমাংসিত তালিকা */}
        {tab === 'unsolved' && (
          <div className="space-y-3">
            {unsolvedShown.length === 0 && (
              <div className="bg-white border border-dashed border-slate-300 rounded-3xl py-14 text-center text-xs text-slate-400">
                🎉 এই ক্যাটাগরিতে কোনো অমীমাংসিত প্রশ্ন নেই
              </div>
            )}
            {unsolvedShown.map((post) => (
              <div key={post.id} className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600">{post.subject}</span>
                  <span className="text-[10px] text-slate-400">{post.user_name} · {timeAgo(post.created_at)}</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{post.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap leading-relaxed">{post.description}</p>
                </div>
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
                <button onClick={() => startAnswer(post)}
                  className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-xs px-4 py-2.5 rounded-2xl cursor-pointer">
                  <Send className="w-4 h-4" /> উত্তর দিন
                </button>
              </div>
            ))}
          </div>
        )}

        {/* আমার উত্তর + প্রাইভেট চ্যাট */}
        {tab === 'mine' && (
          <div className="space-y-3">
            {myPosts.length === 0 && (
              <div className="bg-white border border-dashed border-slate-300 rounded-3xl py-14 text-center text-xs text-slate-400">
                এখনও কোনো উত্তর দেননি
              </div>
            )}
            {myPosts.map((post) => {
              const ans = myAnswers.filter((a) => a.post_id === post.id).slice(-1)[0];
              const active = ans?.is_active;
              const meta = statusMeta(post);
              const expanded = openId === post.id;
              return (
                <div key={post.id} id={`post-${post.id}`} className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 space-y-3 scroll-mt-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600">{post.subject}</span>
                      {active ? (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${meta.cls}`}>{meta.label}</span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg border bg-slate-100 text-slate-500 border-slate-200">
                          শিক্ষার্থী অন্য টিচারের কাছে পাঠিয়েছে
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">{post.user_name}</span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{post.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap">{post.description}</p>
                  </div>

                  {post.audio_url && (
                    <div className="pt-1">
                      <AudioPlayer src={post.audio_url} />
                    </div>
                  )}

                  {post.image_url && <img src={post.image_url} alt="" className="max-h-52 rounded-2xl border border-slate-200 object-cover" />}

                  <div className="bg-purple-50/60 border border-purple-200 rounded-2xl p-3.5 space-y-2">
                    <p className="text-[10px] font-bold text-purple-700">আমার উত্তর</p>
                    <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">{ans.answer_text}</p>
                    
                    {ans.audio_url && (
                      <div className="pt-1">
                        <AudioPlayer src={ans.audio_url} />
                      </div>
                    )}

                    {ans.image_url && <img src={ans.image_url} alt="" className="max-h-52 rounded-xl border border-purple-200 object-cover" />}
                    {active && (
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => startEdit(post, ans)} className="flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl cursor-pointer">
                          <Edit2 className="w-3.5 h-3.5" /> এডিট
                        </button>
                        <button onClick={() => deleteAnswer(ans)} className="flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" /> মুছুন
                        </button>
                      </div>
                    )}
                  </div>

                  {active && (
                    <>
                      <button onClick={() => setOpenId(expanded ? null : post.id)}
                        className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-2xl py-2.5 cursor-pointer">
                        <MessageCircle className="w-4 h-4" />
                        {expanded ? 'চ্যাট বন্ধ করুন' : `${post.user_name}-এর সাথে প্রাইভেট চ্যাট`}
                      </button>
                      {expanded && <QnAChat answerId={ans.id} me={profile} otherName={post.user_name} />}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* উত্তর লেখার মডাল */}
      {target && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-end sm:items-center justify-center sm:p-4">
          <form onSubmit={submit} className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-5 space-y-3.5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-slate-900">{editingAns ? 'উত্তর এডিট' : 'উত্তর দিন'}</h2>
              <button type="button" onClick={closeModal} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-1.5">
              <p className="text-xs font-bold text-slate-800">{target.title}</p>
              <p className="text-[11px] text-slate-600 whitespace-pre-wrap">{target.description}</p>
              {target.audio_url && (
                <div className="pt-1">
                  <AudioPlayer src={target.audio_url} />
                </div>
              )}
              {target.image_url && <img src={target.image_url} alt="" className="max-h-40 rounded-xl border object-cover" />}
            </div>

            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder="সহজ ভাষায় ধাপে ধাপে বুঝিয়ে লিখুন..."
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-purple-500" />

            {/* ছবি ও ভয়েস নোট আপলোড সেকশন */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 border border-slate-200 rounded-xl p-2 bg-slate-50">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-purple-600 cursor-pointer">
                  <ImagePlus className="w-4 h-4 text-purple-600" /> সমাধানের ছবি যোগ করুন
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </label>

                {/* ভয়েস রেকর্ডার কম্পোনেন্ট */}
                <VoiceRecorder onAudioUploaded={(url) => setAudioUrl(url)} onClearAudio={() => setAudioUrl('')} />
              </div>

              {/* ভয়েস রেকর্ড করা হলে প্রিভিউ দেখাবে */}
              {audioUrl && (
                <div className="flex items-center justify-between bg-purple-50 border border-purple-200 p-2 rounded-xl">
                  <AudioPlayer src={audioUrl} />
                  <button type="button" onClick={() => setAudioUrl('')} className="text-xs text-rose-600 font-bold px-2">সরান</button>
                </div>
              )}

              {(file || editingAns?.image_url) && (
                <div className="mt-2 flex items-center gap-2">
                  <img src={file ? URL.createObjectURL(file) : editingAns.image_url} alt="" className="w-16 h-16 rounded-xl object-cover border" />
                  {file && <button type="button" onClick={() => setFile(null)} className="text-[11px] text-rose-600 font-bold">সরান</button>}
                </div>
              )}
            </div>

            <button type="submit" disabled={submitting || (!text.trim() && !audioUrl)}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-sm py-3 rounded-2xl flex items-center justify-center gap-2 cursor-pointer">
              <Send className="w-4 h-4" /> {submitting ? 'জমা হচ্ছে...' : editingAns ? 'আপডেট করুন' : 'উত্তর জমা দিন'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}