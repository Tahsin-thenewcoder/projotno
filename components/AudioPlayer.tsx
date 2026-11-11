"use client";

import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

export default function AudioPlayer({ src }: { src: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex items-center gap-3 bg-emerald-50/80 border border-emerald-200 p-2.5 rounded-2xl max-w-xs">
      <button
        type="button"
        onClick={togglePlay}
        className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center shrink-0 hover:bg-emerald-700 transition"
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </button>

      <div className="flex-1 flex items-center gap-2">
        <Volume2 className="w-4 h-4 text-emerald-600 shrink-0" />
        <span className="text-xs font-bold text-emerald-800">ভয়েস মেসেজ শুনুন</span>
      </div>

      <audio ref={audioRef} src={src} onEnded={() => setIsPlaying(false)} className="hidden" />
    </div>
  );
}