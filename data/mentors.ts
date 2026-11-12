export interface MentorItem {
  id: string;
  shortName: string;   // হোমপেজে দেখানোর জন্য ছোট নাম
  fullName: string;    // /mentors পেজে দেখানোর জন্য পূর্ণ নাম
  institution: string; // বর্তমান প্রতিষ্ঠান ও বিভাগ
  sscBatch: string;
  image: string;       // public/mentors/ ফোল্ডারের পাথ, ছবি না থাকলে "" রাখো
}

export const MENTORS_LIST: MentorItem[] = [
  {
    id: '1',
    shortName: 'Zami',
    fullName: 'Shafi Ullah Zami',
    institution: 'SOMC (MBBS)',
    sscBatch: '2020',
    image: '/mentors/Zami.jpg', // public/mentors/tahsin.jpg ফোল্ডারে ছবি রাখলে দেখাবে
  },
  {
    id: '2',
    shortName: 'Mentor 2',
    fullName: 'Mentor 2',
    institution: 'Mentors University (EEE)',
    sscBatch: '2020',
    image: '', // ছবি না থাকলে নামের প্রথম অক্ষর 'R' দিয়ে অ্যাভাটার দেখাবে
  },
  {
    id: '3',
    shortName: 'Mentor 3',
    fullName: 'Mentor 3',
    institution: 'Mentors University (Law)',
    sscBatch: '2020',
    image: '',
  },
  {
    id: '4',
    shortName: 'Mentor 4',
    fullName: 'Mentor 4',
    institution: 'Mentors University (English)',
    sscBatch: '2020',
    image: '',
  },
  {
    id: '5',
    shortName: 'Mentor 5',
    fullName: 'Mentor 5',
    institution: 'Mentors University (Bangla)',
    sscBatch: '2020',
    image: '',
  },
];