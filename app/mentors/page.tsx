"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { MENTORS_LIST } from '../../data/mentors';;
import { ArrowLeft, GraduationCap, ShieldCheck, Search, Users } from 'lucide-react';

export default function MentorsPage() {
  const [search, setSearch] = useState('');

  const filteredMentors = MENTORS_LIST.filter((m) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      m.fullName.toLowerCase().includes(q) ||
      m.shortName.toLowerCase().includes(q) ||
      m.institution.toLowerCase().includes(q) ||
      m.sscBatch.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans py-6 sm:py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-emerald-600 transition bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-xs w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            হোমপেজে ফিরে যান
          </Link>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="মেন্টরের নাম বা প্রতিষ্ঠান খুঁজুন..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-purple-500 shadow-xs"
            />
          </div>
        </div>

        {/* Page Header */}
        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-md space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full text-xs font-semibold text-purple-100">
            <ShieldCheck className="w-4 h-4 text-cyan-300" />
            সিনিয়র মেন্টর প্যানেল
          </div>
          <h1 className="text-xl sm:text-3xl font-extrabold">
            আমাদের অভিজ্ঞ মেন্টরবৃন্দ ({MENTORS_LIST.length})
          </h1>
          <p className="text-xs sm:text-sm text-purple-200 max-w-2xl leading-relaxed">
            বহদ্দারকাটা উচ্চ বিদ্যালয়ের প্রাক্তন শিক্ষার্থী যারা নিজ সেক্টরে প্রতিষ্ঠিত এবং আরো যারা বিশ্ববিদ্যালয়, মেডিকেল ও প্রকৌশল প্রতিষ্ঠানে অধ্যয়নরত তাদের নিয়ে আমাদের অভিজ্ঞ মেন্টর প্যানেল।
          </p>
        </div>

        {/* Mentors Grid */}
        {filteredMentors.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2">
            <Users className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-600">কোনো মেন্টর খুঁজে পাওয়া যায়নি</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMentors.map((mentor) => (
              <div
                key={mentor.id}
                className="bg-white border border-slate-200/90 hover:border-purple-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition flex items-center gap-4"
              >
                {mentor.image ? (
                  <img
                    src={mentor.image}
                    alt={mentor.fullName}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-purple-100 shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-700 font-extrabold text-xl sm:text-2xl flex items-center justify-center border border-purple-200 shrink-0">
                    {mentor.fullName.charAt(0)}
                  </div>
                )}

                <div className="min-w-0 space-y-1">
                  <span className="inline-block bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                    SSC {mentor.sscBatch}
                  </span>
                  <h2 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                    {mentor.fullName}
                  </h2>
                  <p className="text-xs text-slate-600 flex items-start gap-1 leading-snug">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{mentor.institution}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}