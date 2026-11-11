"use client";

import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { uploadQnaImage } from '@/lib/qna';
import { Send, ImagePlus, X, Lock } from 'lucide-react';
import VoiceRecorder from '@/components/VoiceRecorder';
import AudioPlayer from '@/components/AudioPlayer';

type Props = {
  answerId: string;
  me: { id: string; full_name?: string };
  otherName: string;
};

// স্টুডেন্ট ও উত্তরদাতা মেন্টরের মধ্যে প্রাইভেট চ্যাট (দুই পাশেই একই কম্পোনেন্ট)
export default function QnAChat({ answerId, me, otherName }: Props) {
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [recorderKey, setRecorderKey] = useState(0);
  const [sending, setSending] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    supabase
      .from('qna_comments')
      .select('*')
      .eq('answer_id', answerId)
      .order('created_at', { ascending: true })
      .then(({ data }) => alive && data && setMsgs(data));

    const channel = supabase
      .channel(`qna-chat-${answerId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'qna_comments', filter: `answer_id=eq.${answerId}` },
        (payload) => setMsgs((cur) => (cur.some((m) => m.id === payload.new.id) ? cur : [...cur, payload.new]))
      )
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, [answerId]);

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
        .from('qna_comments')
        .insert({
          answer_id: answerId,
          user_id: me.id,
          user_name: me.full_name || '',
          comment_text: clean,
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
      setRecorderKey((k) => k + 1); // সেন্ড করার পর রেকর্ডার রিসেট হবে
    } catch (err: any) {
      alert('মেসেজ পাঠানো যায়নি: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
      <div className="flex items-center gap-1.5 px-3 py-2 bg-white border-b border-slate-200 text-[11px] font-semibold text-slate-500">
        <Lock className="w-3 h-3 shrink-0" />
        <span className="truncate">প্রাইভেট চ্যাট — শুধু আপনি ও {otherName} দেখতে পাবেন</span>
      </div>

      <div ref={boxRef} className="max-h-72 overflow-y-auto p-3 space-y-2">
        {msgs.length === 0 && (
          <p className="text-center text-xs text-slate-400 py-6">
            এখনও কোনো মেসেজ নেই। উত্তর নিয়ে কিছু জানার থাকলে নিচে লিখুন বা ভয়েস পাঠান।
          </p>
        )}
        {msgs.map((m) => {
          const mine = m.user_id === me.id;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs space-y-1.5 ${
                  mine
                    ? 'bg-emerald-600 text-white rounded-br-sm'
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
                {m.comment_text && <p className="whitespace-pre-wrap leading-relaxed">{m.comment_text}</p>}
                <p className={`text-[9px] ${mine ? 'text-emerald-100' : 'text-slate-400'}`}>
                  {new Date(m.created_at).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ছবি প্রিভিউ */}
      {file && (
        <div className="px-3 py-2 bg-white border-t border-slate-200 flex items-center gap-2">
          <img src={URL.createObjectURL(file)} alt="" className="w-11 h-11 rounded-lg object-cover border" />
          <span className="text-[11px] text-slate-500 truncate flex-1">{file.name}</span>
          <button type="button" onClick={() => setFile(null)} className="text-slate-400 hover:text-rose-500 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* মোবাইল-ফ্রেন্ডলি ২-লাইনের ইনপুট ও টুলবার */}
      <div className="p-2.5 bg-white border-t border-slate-200 space-y-2">
        {/* লাইন ১: পুরো প্রস্থ জুড়ে মেসেজ লেখার ঘর */}
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
          placeholder="পাল্টা প্রশ্ন বা মেসেজ লিখুন..."
          className="w-full resize-none px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
        />

        {/* লাইন ২: বামে ছবি ও ভয়েস রেকর্ডার, ডানে সেন্ড বাটন */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <label
              className="p-2 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer shrink-0 transition"
              title="ছবি যোগ করুন"
            >
              <ImagePlus className="w-4 h-4" />
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>

            <VoiceRecorder
              key={recorderKey}
              onAudioUploaded={(url) => setAudioUrl(url)}
              onClearAudio={() => setAudioUrl('')}
            />
          </div>

          <button
            type="button"
            onClick={send}
            disabled={sending || (!text.trim() && !file && !audioUrl)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl shrink-0 cursor-pointer flex items-center gap-1.5 transition"
          >
            <span>পাঠান</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}