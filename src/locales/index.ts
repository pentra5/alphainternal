import { useI18nStore } from '../stores/i18nStore';

export const translations = {
  id: {
    // Sidebar
    dashboard: 'Dashboard',
    feed: 'Feed',
    standup: 'Standup',
    reports: 'Laporan',
    tasks: 'Tugas',
    schedule: 'Jadwal',
    points: 'Poin',
    settings: 'Settings',
    team: 'Tim',
    summary: 'Summary',
    logout: 'Logout',
    
    // Topbar
    focus_mode: 'Fokus',
    good_morning: 'Selamat Pagi',
    good_afternoon: 'Selamat Siang',
    good_evening: 'Selamat Malam',
    
    // Teams
    add_employee: 'Tambah Pegawai',
    search_employee: 'Cari nama atau username...',
    active: 'Aktif',
    inactive: 'Nonaktif',
    online: 'Online',
    offline: 'Offline',
    
    // General
    save: 'Simpan',
    cancel: 'Batal',
    delete: 'Hapus',
    edit: 'Edit',
    create: 'Buat Baru',
  },
  en: {
    // Sidebar
    dashboard: 'Dashboard',
    feed: 'Feed',
    standup: 'Standups',
    reports: 'Reports',
    tasks: 'Tasks',
    schedule: 'Schedules',
    points: 'Points',
    settings: 'Settings',
    team: 'Team',
    summary: 'Summary',
    logout: 'Logout',
    
    // Topbar
    focus_mode: 'Focus',
    good_morning: 'Good Morning',
    good_afternoon: 'Good Afternoon',
    good_evening: 'Good Evening',
    
    // Teams
    add_employee: 'Add Employee',
    search_employee: 'Search name or username...',
    active: 'Active',
    inactive: 'Inactive',
    online: 'Online',
    offline: 'Offline',
    
    // General
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create New',
  }
} as const;

export type TranslationKey = keyof typeof translations.id;

export function useTranslation() {
  const { lang } = useI18nStore();
  
  const t = (key: TranslationKey): string => {
    return translations[lang][key] || key;
  };
  
  return { t, lang };
}
