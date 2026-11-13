"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Bell, X, BellRing, Check } from 'lucide-react';
import { timeAgo } from '@/lib/qna';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function NotificationBell({ userId }: { userId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker & check existing subscription
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(async (reg) => {
          const existingSub = await reg.pushManager.getSubscription();
          if (existingSub && Notification.permission === 'granted') {
            setPushEnabled(true);
          }
        })
        .catch(() => {});
    }

    // 2. Fetch existing notifications
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data }) => data && setItems(data));

    // 3. Realtime listener
    const channel = supabase
      .channel(`notif-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const newNotif = payload.new as any;
          setItems((cur) => [newNotif, ...cur]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const enablePushNotifications = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('আপনার ব্রাউজার পুশ নোটিফিকেশন সাপোর্ট করে না।');
      return;
    }

    setSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('ব্রাউজার সেটিংস থেকে Notification Allow করে দিন।');
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) return;

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const subJson = subscription.toJSON();
      if (subJson.endpoint && subJson.keys?.p256dh && subJson.keys?.auth) {
        await supabase.from('push_subscriptions').upsert(
          {
            user_id: userId,
            endpoint: subJson.endpoint,
            p256dh: subJson.keys.p256dh,
            auth: subJson.keys.auth,
          },
          { onConflict: 'endpoint' }
        );
        setPushEnabled(true);
      }
    } catch (err) {
      console.error('Push subscription error:', err);
    } finally {
      setSubscribing(false);
    }
  };

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
                  <button onClick={markAll} className="text-[10px] font-bold text-emerald-600 cursor-pointer">
                    সব পড়া হয়েছে
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-slate-400 sm:hidden">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Push Notification Enable Banner */}
            {!pushEnabled ? (
              <div className="bg-emerald-50 border-b border-emerald-100 px-3.5 py-2.5 flex items-center justify-between gap-2">
                <span className="text-[11px] text-emerald-900 font-medium leading-tight">
                  ফোন/পিসিতে সরাসরি নোটিফিকেশন পেতে:
                </span>
                <button
                  onClick={enablePushNotifications}
                  disabled={subscribing}
                  className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <BellRing className="w-3 h-3" />
                  {subscribing ? 'চালু হচ্ছে...' : 'চালু করুন'}
                </button>
              </div>
            ) : (
              <div className="bg-slate-50 border-b border-slate-100 px-3.5 py-1.5 flex items-center gap-1.5 text-[10px] text-emerald-700 font-semibold">
                <Check className="w-3 h-3" />
                ডিভাইস পুশ নোটিফিকেশন চালু আছে
              </div>
            )}

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {items.length === 0 && <p className="text-xs text-slate-400 text-center py-8">কোনো নোটিফিকেশন নেই</p>}
              {items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => openItem(n)}
                  className={`w-full text-left px-3.5 py-2.5 hover:bg-slate-50 cursor-pointer ${n.is_read ? '' : 'bg-emerald-50/60'}`}
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