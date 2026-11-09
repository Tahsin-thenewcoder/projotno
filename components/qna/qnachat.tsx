"use client";

import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { uploadQnaImage } from '@/lib/qna';
import { Send, ImagePlus, X, Lock } from 'lucide-react';

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
    if ((!clean && !file) || sending) return;
    setSending(true);
    try {
      const image_url = file ? await uploadQnaImage(file, 'chat') : null;
      const { data, error } = await supabase
        .from('qna_comments')
        .insert({ answer_id: answerId, user_id: me.id, user_name: me.full_name || '', comment_text: clean, image_url })
        .select()
        .single();
      if (error) throw error;
      setMsgs((cur) => (cur.some((m) => m.id === data.id) ? cur : [...cur, data]));
      setText('');
      setFile(null);
    } catch (err: any) {
      alert('মেসেজ পাঠানো যায়নি: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
      <div className="flex items-center gap-1.5 px-3 py-2 bg-white border-b border-slate-200 text-[11px] font-semibold text-slate-500">
        <Lock className="w-3 h-3" />
        প্রাইভেট চ্যাট — শুধু আপনি ও {otherName} দেখতে পাবেন
      </div>

      <div ref={boxRef} className="max-h-72 overflow-y-auto p-3 space-y-2">
        {msgs.length === 0 && (
          <p className="text-center text-xs text-slate-400 py-6">
            এখনও কোনো মেসেজ নেই। উত্তর নিয়ে কিছু জানার থাকলে নিচে লিখুন।
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
                {m.comment_text && <p className="whitespace-pre-wrap leading-relaxed">{m.comment_text}</p>}
                <p className={`text-[9px] ${mine ? 'text-emerald-100' : 'text-slate-400'}`}>
                  {new Date(m.created_at).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {file && (
        <div className="px-3 pt-2 bg-white border-t border-slate-200 flex items-center gap-2">
          <img src={URL.createObjectURL(file)} alt="" className="w-12 h-12 rounded-lg object-cover border" />
          <span className="text-[11px] text-slate-500 truncate flex-1">{file.name}</span>
          <button onClick={() => setFile(null)} className="text-slate-400 hover:text-rose-500">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2 p-2.5 bg-white border-t border-slate-200">
        <label className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer shrink-0">
          <ImagePlus className="w-4 h-4" />
          <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder="পাল্টা প্রশ্ন বা মেসেজ লিখুন..."
          className="flex-1 resize-none px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 max-h-24"
        />
        <button
          onClick={send}
          disabled={sending || (!text.trim() && !file)}
          className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl shrink-0 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
