import { supabase } from '@/lib/supabase';

export const ALL_SUBJECTS = 'সব বিষয়';

export const SUBJECTS = [
  'বাংলা',
  'English',
  'ICT',
  'Physics',
  'Chemistry',
  'Higher Math',
  'Biology',
  'Logic',
  'Civics and Good Governance',
  'Geography',
  'Economics',
  'Sociology',
  'Psychology',
  'Arabic',
  'Accounting',
  'Statistics',
  'Finance, Banking & Insurance',
  'Engineering Admission',
  'Medical Admission',
  'Varsity Admission',
  'General Academic',
  'ISSB, Marine and Others',
];

// প্রশ্নের অবস্থা অনুযায়ী ব্যাজ
export function statusMeta(post: any) {
  switch (post.status) {
    case 'answered':
      return { label: 'উত্তর এসেছে', cls: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'satisfied':
      return { label: 'সন্তুষ্ট ✓', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'unsatisfied':
      return { label: 'অসন্তুষ্ট', cls: 'bg-rose-50 text-rose-700 border-rose-200' };
    default:
      return (post.excluded_mentor_ids?.length ?? 0) > 0
        ? { label: 'অন্য টিচারের অপেক্ষায়', cls: 'bg-purple-50 text-purple-700 border-purple-200' }
        : { label: 'উত্তরের অপেক্ষায়', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
  }
}

export function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'এইমাত্র';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} মিনিট আগে`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ঘণ্টা আগে`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} দিন আগে`;
  return new Date(iso).toLocaleDateString('bn-BD');
}

// folder: posts (প্রশ্ন) | answers (উত্তর) | chat (প্রাইভেট চ্যাট)
export async function uploadQnaImage(file: File, folder: 'posts' | 'answers' | 'chat'): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('শুধু ছবি আপলোড করা যাবে।');
  if (file.size > 5 * 1024 * 1024) throw new Error('ছবির সাইজ সর্বোচ্চ ৫ MB হতে পারবে।');
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from('qna-attachments')
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return supabase.storage.from('qna-attachments').getPublicUrl(path).data.publicUrl;
}
