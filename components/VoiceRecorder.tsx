"use client";

import React, { useState, useRef } from 'react';
import { Mic, Square, Play, Pause, Trash2, Loader2, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface VoiceRecorderProps {
  onAudioUploaded: (audioUrl: string) => void;
  onClearAudio?: () => void;
}

export default function VoiceRecorder({ onAudioUploaded, onClearAudio }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (blob.size === 0) return;

        const localUrl = URL.createObjectURL(blob);
        setAudioUrl(localUrl);

        // আপলোড প্রসেস
        await uploadToSupabase(blob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      setUploaded(false);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert("মাইক্রোফোন এক্সেস পাওয়া যায়নি!");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
  };

  const uploadToSupabase = async (blob: Blob) => {
    setUploading(true);
    try {
      const fileName = `voice_${Date.now()}_${Math.random().toString(36).substring(7)}.webm`;
      const { data, error } = await supabase.storage.from('qna-audio').upload(fileName, blob, {
        contentType: 'audio/webm',
        cacheControl: '3600',
        upsert: false
      });

      if (error) {
        console.error("Storage upload error:", error);
        throw error;
      }

      const { data: publicUrlData } = supabase.storage.from('qna-audio').getPublicUrl(fileName);
      
      console.log("Uploaded Audio Public URL:", publicUrlData.publicUrl);
      onAudioUploaded(publicUrlData.publicUrl);
      setUploaded(true);
    } catch (err: any) {
      alert("ভয়েস আপলোড হতে ব্যর্থ হয়েছে: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const clearAudio = () => {
    setAudioUrl(null);
    setRecordingTime(0);
    setIsPlaying(false);
    setUploaded(false);
    if (onClearAudio) onClearAudio();
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex items-center gap-2">
      {!isRecording && !audioUrl && (
        <button
          type="button"
          onClick={startRecording}
          className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition"
          title="ভয়েস রেকর্ড করুন"
        >
          <Mic className="w-5 h-5" />
        </button>
      )}

      {isRecording && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-full text-rose-700 text-xs font-semibold animate-pulse">
          <span className="w-2.5 h-2.5 bg-rose-600 rounded-full animate-ping"></span>
          <span>রেকর্ড হচ্ছে: {formatTime(recordingTime)}</span>
          <button type="button" onClick={stopRecording} className="p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700">
            <Square className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {audioUrl && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-2xl">
          <button type="button" onClick={togglePlay} className="p-1 bg-emerald-600 text-white rounded-full hover:bg-emerald-700">
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <span className="text-xs font-medium text-emerald-800">{formatTime(recordingTime)}</span>

          <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />

          {uploading ? (
            <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
              <Loader2 className="w-3 h-3 animate-spin" /> আপলোড হচ্ছে...
            </span>
          ) : uploaded ? (
            <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
              <Check className="w-3 h-3" /> যুক্ত হয়েছে
            </span>
          ) : null}

          <button type="button" onClick={clearAudio} className="p-1 text-slate-400 hover:text-rose-600">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}