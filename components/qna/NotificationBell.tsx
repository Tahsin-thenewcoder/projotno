"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Bell, X } from 'lucide-react';
import { timeAgo } from '@/lib/qna';

// বেল আইকন: লাইভ নোটিফিকেশন, ক্লিক করলে ওই প্রশ্নে নিয়ে যায়
export default function NotificationBell({ userId }: { userId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data }) => data && setItems(data));

    const channel = supabase
      .channel(`notif-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => setItems((cur) => [payload.new as any, ...cur])
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const unread = items.filter((n) => !n.is_read).length;

  const openItem = async (n: any) => {
    if (!n.is_read) await supabase.from('notifications').update({ is_read: true }).eq('id', n.id);
    setOpen(false);
    if (n.link) window.location.assign(n.link);
  };

  const markAll = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
    setItems((cur) => cur.map((n) => ({ ...n, is_read: true })));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-2xl text-slate-700 relative cursor-pointer"
        title="নোটিফিকেশন"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 bg-slate-900/30 z-40 sm:bg-transparent" onClick={() => setOpen(false)} />
          <div className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-auto mt-2 w-[92vw] sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b">
              <h3 className="font-bold text-xs text-slate-700">নোটিফিকেশন</h3>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button onClick={markAll} className="text-[10px] font-bold text-emerald-600">
                    সব পড়া হয়েছে
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-slate-400 sm:hidden">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {items.length === 0 && <p className="text-xs text-slate-400 text-center py-8">কোনো নোটিফিকেশন নেই</p>}
              {items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => openItem(n)}
                  className={`w-full text-left px-3.5 py-2.5 hover:bg-slate-50 ${n.is_read ? '' : 'bg-emerald-50/60'}`}
                >
                  <p className="text-xs font-bold text-slate-800">{n.title}</p>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{n.message}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">{timeAgo(n.created_at)}</p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
