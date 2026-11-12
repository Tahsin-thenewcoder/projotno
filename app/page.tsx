"use client";

import Link from 'next/link';
import Image from 'next/image';
import React, { useState } from 'react';
import { MENTORS_LIST } from '@/data/mentors';
import { 
  Users, 
  Compass, 
  MessageSquareHeart, 
  ArrowRight, 
  Sparkles,
  Menu,
  X,
  HelpCircle,
  ChevronRight,
  Share2,
  MapPin,
  Phone,
  Code2,
  Heart,
  UserCheck,
  GraduationCap,
  ShieldCheck
} from 'lucide-react';

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Horizontal Continuous Flow Animation Style */}
      <style jsx>{`
        @keyframes mentorMarquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-mentor-flow {
          display: flex;
          width: max-content;
          animation: mentorMarquee 26s linear infinite;
        }
        .animate-mentor-flow:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-72 sm:w-96 h-72 sm:h-96 bg-emerald-200/40 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -right-40 w-72 sm:w-96 h-72 sm:h-96 bg-teal-200/30 rounded-full blur-3xl"></div>
      </div>

      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Projotno Logo Image */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3">
            <Image 
              src="/logo.jpg" 
              alt="প্রযত্ন লোগো" 
              width={40} 
              height={40} 
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover shadow-sm border border-slate-100 shrink-0" 
            />
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 leading-none">প্রযত্ন</h1>
              <p className="text-[10px] sm:text-[11px] text-emerald-700 font-semibold mt-0.5">সূচনা ছাত্র সংগঠন • ব্যাচ ২০২০</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-emerald-600 transition">ফিচারসমূহ</a>
            <a href="#targets" className="hover:text-emerald-600 transition">অ্যাডমিশন ট্র্যাকিং</a>
            <Link href="/mentors" className="hover:text-purple-600 transition">মেন্টর প্যানেল</Link>
            <a href="#about" className="hover:text-emerald-600 transition">আমাদের উদ্দেশ্য</a>
            <a href="#contact" className="hover:text-emerald-600 transition">যোগাযোগ</a>
          </nav>

          {/* Nav Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <button className="text-sm font-semibold text-slate-700 hover:text-emerald-600 px-4 py-2 transition cursor-pointer">
                লগইন
              </button>
            </Link>
            <Link href="/register">
              <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md transition shadow-emerald-600/20 cursor-pointer">
                প্রোফাইল খুলুন
              </button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="md:hidden p-2 text-slate-700 hover:text-slate-900 rounded-xl bg-slate-100 border border-slate-200/80 cursor-pointer active:scale-95 transition"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu with Backdrop */}
        {mobileMenuOpen && (
          <>
            <div 
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-slate-200 px-5 py-6 space-y-4 shadow-xl z-50 animate-in slide-in-from-top-2">
              <nav className="flex flex-col space-y-1 font-semibold text-slate-700 text-sm">
                <a href="#features" onClick={() => setMobileMenuOpen(false)} className="py-2.5 px-3 rounded-lg hover:bg-slate-50 hover:text-emerald-600 border-b border-slate-100">ফিচারসমূহ</a>
                <a href="#targets" onClick={() => setMobileMenuOpen(false)} className="py-2.5 px-3 rounded-lg hover:bg-slate-50 hover:text-emerald-600 border-b border-slate-100">অ্যাডমিশন ট্র্যাকিং</a>
                <Link href="/mentors" onClick={() => setMobileMenuOpen(false)} className="py-2.5 px-3 rounded-lg hover:bg-slate-50 hover:text-purple-600 border-b border-slate-100">মেন্টর প্যানেল</Link>
                <a href="#about" onClick={() => setMobileMenuOpen(false)} className="py-2.5 px-3 rounded-lg hover:bg-slate-50 hover:text-emerald-600 border-b border-slate-100">আমাদের উদ্দেশ্য</a>
                <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="py-2.5 px-3 rounded-lg hover:bg-slate-50 hover:text-emerald-600">যোগাযোগ</a>
              </nav>
              <div className="pt-3 border-t border-slate-200 flex flex-col gap-2.5">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <button className="w-full text-center py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 active:bg-slate-200 rounded-xl cursor-pointer transition">
                    লগইন
                  </button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <button className="w-full text-center py-2.5 text-sm font-bold text-white bg-emerald-600 active:bg-emerald-700 rounded-xl shadow-md cursor-pointer transition">
                    প্রোফাইল খুলুন
                  </button>
                </Link>
                <Link href="/apply-mentor" onClick={() => setMobileMenuOpen(false)}>
                  <button className="w-full text-center py-2.5 text-sm font-bold text-white bg-purple-600 active:bg-purple-700 rounded-xl shadow-md cursor-pointer transition">
                    মেন্টর হতে আবেদন করুন
                  </button>
                </Link>
              </div>
            </div>
          </>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-10 pb-12 sm:pt-16 sm:pb-20 md:pt-20 md:pb-28 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4 sm:space-y-6">
          <div className="inline-flex items-center gap-1.5 bg-emerald-100/90 border border-emerald-200 text-emerald-800 text-[11px] sm:text-xs font-bold px-3.5 py-1.5 rounded-full shadow-xs max-w-[95vw] leading-tight">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">বহদ্দারকাটা উচ্চ বিদ্যালয়ের জুনিয়রদের জন্য ডিজিটাল সাপোর্ট প্ল্যাটফর্ম</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.25]">
            বহদ্দারকাটা উচ্চ বিদ্যালয় থেকে স্বপ্নের ক্যাম্পাসে, <br className="hidden sm:inline" />
            <span className="text-emerald-600">তোমাদের যত্নে আমরা।</span>
          </h1>

          <p className="text-sm sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal px-2">
            কলেজ লাইফের পড়াশোনা, ভার্সিটি অ্যাডমিশন ট্র্যাকিং এবং ব্যক্তিগত যেকোনো সমস্যায় সিনিয়রদের সঠিক দিকনির্দেশনা পেতে যুক্ত হও।
          </p>

          {/* Hero Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-3 sm:pt-4 px-2">
            <Link href="/register" className="w-full sm:w-auto">
              <button className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-sm sm:text-base px-8 py-3.5 rounded-xl shadow-lg shadow-emerald-600/25 transition cursor-pointer flex items-center justify-center gap-2">
                প্রোফাইল খুলুন
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/qna" className="w-full sm:w-auto">
              <button className="w-full bg-white hover:bg-slate-100 active:scale-[0.98] text-slate-700 border border-slate-300 font-semibold text-sm sm:text-base px-7 py-3.5 rounded-xl shadow-xs transition cursor-pointer">
                প্রশ্ন করতে চাই
              </button>
            </Link>
            <Link href="/apply-mentor" className="w-full sm:w-auto">
              <button className="w-full bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white font-bold text-sm sm:text-base px-7 py-3.5 rounded-xl shadow-lg shadow-purple-600/20 transition cursor-pointer flex items-center justify-center gap-2">
                <UserCheck className="w-4 h-4" />
                মেন্টর হতে আবেদন করুন
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Target Categories Banner */}
      <section id="targets" className="relative z-10 py-10 sm:py-12 bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-center text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mb-6 sm:mb-8">
            তোমাদের অ্যাডমিশন লক্ষ্যের সঠিক দিকনির্দেশনা
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              { title: 'Engineering', desc: 'বুয়েট, রুয়েট, কুয়েট, চুয়েট প্রস্তুতি' },
              { title: 'Medical', desc: 'মেডিকেল ও ডেন্টাল প্রিপারেশন' },
              { title: 'Varsity (A/B/C)', desc: 'ঢাবি, রাবি, চবি, জাবি ও গুচ্ছ' },
              { title: 'Armed Forces', desc: 'সেনা, নৌ, বিমানবাহিনী ও ডিফেন্স' },
            ].map((item, idx) => (
              <div 
                key={idx} 
                className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-500 hover:bg-white hover:shadow-lg active:bg-white transition-all duration-300 group cursor-pointer"
              >
                <div className="flex justify-between items-start mb-2.5 sm:mb-3">
                  <Compass className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 group-hover:rotate-45 transition-transform duration-300" />
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition" />
                </div>
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">{item.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section id="features" className="relative z-10 py-12 sm:py-16 md:py-24 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900">যেসব সাহায্য পাচ্ছো "প্রযত্ন"-এ</h2>
          <p className="text-slate-600 mt-2 text-xs sm:text-base px-2">তোমাদের অ্যাকাডেমিক বা ব্যক্তিগত লাইফ, যেই সমস্যাই হোক না কেন, বড়ভাইরা আছি তোমাদের পাশে</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
          {/* Card 1 */}
          <Link href="/register" className="block group">
            <div className="h-full p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-xl hover:border-emerald-300 transition-all duration-300 hover:-translate-y-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 text-emerald-700 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 font-bold">
                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 sm:mb-3 group-hover:text-emerald-600 transition">স্টুডেন্ট প্রোফাইল</h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                তোমার বর্তমান কলেজ, SSC ব্যাচ ও ফিউচার গোল (Engineering/Medical/Varsity) সিলেক্ট করে প্রোফাইল বানাও।
              </p>
            </div>
          </Link>

          {/* Card 2 */}
          <Link href="/qna" className="block group">
            <div className="h-full p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-xl hover:border-emerald-300 transition-all duration-300 hover:-translate-y-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 text-emerald-700 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 sm:mb-3 group-hover:text-emerald-600 transition">Academic QnA Forum</h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                পড়াশোনা, অ্যাডমিশন বুক লিস্ট কিংবা চ্যাপ্টার গাইডেন্স নিয়ে সরাসরি প্রশ্ন করো। সিনিয়ররা তোমাকে সঠিক উত্তর প্রদান করবে।
              </p>
            </div>
          </Link>

          {/* Card 3 */}
          <Link href="/anonymous-help" className="block group">
            <div className="h-full p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-xl hover:border-emerald-300 transition-all duration-300 hover:-translate-y-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 text-purple-700 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                <MessageSquareHeart className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 sm:mb-3 group-hover:text-purple-600 transition">Non-Academic সাপোর্ট</h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                নতুন শহরে বাসা/মেস খোঁজা, মানসিক চাপ বা কোনো ব্যক্তিগত সমস্যায় <strong>Anonymous (নাম না প্রকাশ করে)</strong> সাহায্য চাওয়ার সুযোগ।
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* Mentors Horizontal Showcase Section (আমাদের গল্প ও লক্ষ্য-এর ঠিক আগে) */}
      <section className="relative z-10 py-12 sm:py-16 bg-white border-t border-slate-200 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center space-y-2 mb-8">
          <div className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-800 text-[11px] sm:text-xs font-bold px-3.5 py-1 rounded-full border border-purple-200">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            সিনিয়র প্যানেল
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            স্বপ্নজয়ের পথে তোমাদের পাশে আছেন যারা
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            বিভিন্ন সেক্টরে প্রতিষ্ঠিত এবং বিশ্ববিদ্যালয়ে অধ্যয়নরত আমাদের স্কুলের বড়ভাই ও আপুরা
          </p>
        </div>

        {/* Continuous Horizontal Flowing Strip */}
        <div className="relative w-full overflow-hidden py-2">
          {/* Left & Right Soft Fade Edges */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-10 sm:w-24 bg-gradient-to-r from-white to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 sm:w-24 bg-gradient-to-l from-white to-transparent z-10" />

          <div className="animate-mentor-flow gap-4 px-4">
            {[...MENTORS_LIST, ...MENTORS_LIST].map((mentor, index) => (
              <Link
                key={`${mentor.id}-${index}`}
                href="/mentors"
                className="w-44 sm:w-52 bg-slate-50 hover:bg-purple-50/60 border border-slate-200 hover:border-purple-300 rounded-2xl p-4 text-center transition shadow-xs hover:shadow-md shrink-0 flex flex-col items-center group"
              >
                {mentor.image ? (
                  <img
                    src={mentor.image}
                    alt={mentor.shortName}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-purple-200 group-hover:scale-105 transition"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-700 font-extrabold text-xl sm:text-2xl flex items-center justify-center border-2 border-purple-200 group-hover:scale-105 transition">
                    {mentor.shortName.charAt(0)}
                  </div>
                )}

                <h3 className="font-bold text-slate-900 text-sm sm:text-base mt-3 group-hover:text-purple-700 transition">
                  {mentor.shortName}
                </h3>
                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 flex items-center justify-center gap-1">
                  <GraduationCap className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span className="truncate">{mentor.institution}</span>
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Full Mentor Details Button */}
        <div className="text-center mt-8 px-4">
          <Link href="/mentors">
            <button className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-md shadow-purple-600/20 transition cursor-pointer">
              সকল মেন্টর ও বিস্তারিত দেখুন
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="relative z-10 py-12 sm:py-16 bg-emerald-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-3 sm:space-y-4">
          <span className="bg-emerald-800 text-emerald-200 text-[11px] sm:text-xs font-bold px-3 py-1 rounded-full border border-emerald-700 inline-block">
            আমাদের গল্প ও লক্ষ্য
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold">সূচনা ছাত্র সংগঠন (ব্যাচ ২০২০)</h2>
          <p className="text-emerald-100/90 text-xs sm:text-base leading-relaxed max-w-2xl mx-auto px-2">
            বহদ্দারকাটা উচ্চ বিদ্যালয় থেকে পাস করে আসা জুনিয়র স্টুডেন্টদের উচ্চশিক্ষা ও অ্যাডমিশন যুদ্ধে যেন সঠিক ও নির্ভরযোগ্য গাইডলাইনের অভাব না হয়—সেই উদ্দেশ্যে আমাদের এই ডিজিটাল উদ্যোগ।
          </p>
        </div>
      </section>

      {/* Complete Footer */}
      <footer id="contact" className="relative z-10 bg-slate-900 text-slate-400 pt-10 sm:pt-12 pb-12 px-4 border-t border-slate-800">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 pb-8 sm:pb-10 border-b border-slate-800">
          {/* Col 1: About */}
          <div className="space-y-3 sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <Image 
                src="/logo.jpg" 
                alt="প্রযত্ন লোগো" 
                width={32} 
                height={32} 
                className="w-8 h-8 rounded-lg object-cover" 
              />
              <h3 className="text-lg font-bold text-white">প্রযত্ন</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              বহদ্দারকাটা উচ্চ বিদ্যালয়ের জুনিয়রদের জন্য পরিচালিত শিক্ষা সহায়তা ও দিকনির্দেশনা প্ল্যাটফর্ম।
            </p>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">দ্রুত লিঙ্ক</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/register" className="hover:text-emerald-400 transition">রেজিস্ট্রেশন করুন</Link></li>
              <li><Link href="/login" className="hover:text-emerald-400 transition">লগইন করুন</Link></li>
              <li><Link href="/qna" className="hover:text-emerald-400 transition">Q&A ফোরাম</Link></li>
              <li><Link href="/mentors" className="hover:text-purple-400 transition">আমাদের মেন্টরবৃন্দ</Link></li>
              <li><Link href="/anonymous-help" className="hover:text-emerald-400 transition">বেনামী সহায়তায় কথা বলুন</Link></li>
              <li><Link href="/apply-mentor" className="hover:text-purple-400 transition font-semibold">মেন্টর হতে আবেদন</Link></li>
            </ul>
          </div>

          {/* Col 3: Contact Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">যোগাযোগ</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>বহদ্দারকাটা, মাতামুহুরি, কক্সবাজার</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>+880 1603660933</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Social Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">সোশ্যাল মিডিয়া</h4>
            <p className="text-xs text-slate-400">আমাদের অফিসিয়াল ফেসবুক পেজে যুক্ত হয়ে আপডেটেড থাকুন:</p>
            <a 
              href="https://www.facebook.com/profile.php?id=61595164704349#" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition border border-slate-700 w-full justify-center"
            >
              <Share2 className="w-4 h-4" />
              সূচনা ফেসবুক পেজ
            </a>
          </div>
        </div>

        {/* Bottom Credits - Mobile Optimized */}
        <div className="max-w-6xl mx-auto pt-6 flex flex-col items-center text-center text-xs text-slate-500 gap-4">
          <p>© 2026 <strong className="text-slate-300">প্রযত্ন</strong> — সূচনা ছাত্র সংগঠন (এসএসসি ব্যাচ ২০২০)</p>
          
          <div className="flex flex-wrap items-center justify-center gap-1.5 bg-slate-800/90 border border-slate-700/80 px-4 py-2 rounded-2xl text-[11px] text-slate-300 shadow-inner max-w-full">
            <Code2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Developed with</span>
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500 shrink-0" />
            <span>by তথ্যপ্রযুক্তি উপকমিটি,</span>
            <span className="text-slate-400">সূচনা ছাত্র সংগঠন (এসএসসি ব্যাচ ২০২০)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}