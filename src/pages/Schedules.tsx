import { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { Calendar as CalendarIcon, Plus, CheckCircle, XCircle } from 'lucide-react';
import { confirm } from '@tauri-apps/plugin-dialog';

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function Schedules() {
  const { user } = useAuthStore();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  // Schedule Modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedForm, setSchedForm] = useState({
    title: '', description: '', note: '', schedule_type: 'meeting',
    start_time: '', end_time: '', is_all_day: false, is_shared: false, assignee_ids: [] as number[]
  });
  const [employees, setEmployees] = useState<any[]>([]);

  // Event Detail Modal
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  // Leave Modal
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveType, setLeaveType] = useState('annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const isOwner = user?.role === 'owner' || user?.role === 'editor';

  useEffect(() => {
    loadSchedules();
    loadLeaves();
  }, [currentDate.getMonth(), currentDate.getFullYear()]);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const res = await client.get(`/schedules?month=${month}&year=${year}`);
      setSchedules(res.data);
    } catch (e) {
      console.error(e);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const loadLeaves = async () => {
    try {
      const res = await client.get('/schedules/leaves');
      setLeaves(res.data);
    } catch (e) {
      console.error(e);
      setLeaves([]);
    }
  };

  const submitLeave = async () => {
    if (!startDate || !endDate || !reason) return alert('Semua field wajib diisi');
    try {
      await client.post('/schedules/leave', {
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason: reason
      });
      setShowLeaveModal(false);
      setStartDate(''); setEndDate(''); setReason('');
      loadSchedules();
      loadLeaves();
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Gagal mengajukan cuti');
    }
  };

  const reviewLeave = async (id: number, status: 'approved' | 'rejected') => {
    const isConfirmed = await confirm(`Anda yakin ingin ${status} cuti ini?`, { title: 'Alpha', kind: 'warning' });
    if (!isConfirmed) return;
    try {
      await client.patch(`/schedules/leave/${id}/approve?status=${status}`);
      loadSchedules();
      loadLeaves();
    } catch (e) { alert('Gagal memproses pengajuan cuti'); }
  };

  const reviewSchedule = async (id: number, status: 'approved' | 'rejected') => {
    const isConfirmed = await confirm(`Anda yakin ingin ${status} jadwal ini?`, { title: 'Alpha', kind: 'warning' });
    if (!isConfirmed) return;
    try {
      if (status === 'rejected') {
         await client.delete(`/schedules/${id}`);
      } else {
         await client.put(`/schedules/${id}`, { status });
      }
      loadSchedules();
    } catch (e) { alert('Gagal memproses persetujuan jadwal'); }
  };

  const loadEmployees = async () => {
    try {
      const res = await client.get('/users');
      setEmployees(res.data.users || []);
    } catch (e) {}
  };

  const submitSchedule = async () => {
    if (!schedForm.title || !schedForm.start_time || !schedForm.end_time) {
      alert('Judul, Waktu Mulai & Berakhir wajib diisi');
      return;
    }
    try {
      await client.post('/schedules', { 
        ...schedForm, 
        start_time: new Date(schedForm.start_time).toISOString(), 
        end_time: new Date(schedForm.end_time).toISOString() 
      });
      setShowScheduleModal(false);
      setSchedForm({ title: '', description: '', note: '', schedule_type: 'meeting', start_time: '', end_time: '', is_all_day: false, is_shared: false, assignee_ids: [] });
      loadSchedules();
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Gagal membuat jadwal');
    }
  };

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="min-h-[100px] border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10"></div>);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const dayEvents = schedules.filter((s: any) => {
          const st = s.start_time || s.start_date;
          return st?.startsWith(dateStr);
        });

        const isToday = dateStr === new Date().toISOString().split('T')[0];

        days.push(
            <div key={i} className={`min-h-[100px] p-2 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${isToday ? 'ring-2 ring-primary-500 ring-inset' : ''}`}>
                <span className={`text-sm font-semibold mb-1 block ${isToday ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500'}`}>{i}</span>
                <div className="space-y-1">
                    {dayEvents.map((evt: any) => {
                        const isLeave = evt.type === 'leave';
                        const isPendingSched = evt.type === 'schedule' && evt.status === 'pending';
                        const statusClass = isLeave
                          ? evt.status === 'approved' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-100 dark:border-green-900/30'
                            : evt.status === 'rejected' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30'
                            : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30'
                          : isPendingSched 
                            ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30 border-dashed'
                            : 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border-primary-100 dark:border-primary-900/30';
                        return (
                          <div 
                            key={evt.id} 
                            onClick={() => setSelectedEvent(evt)}
                            className={`text-xs p-1.5 rounded truncate border font-medium cursor-pointer hover:opacity-80 transition-opacity ${statusClass}`}
                          >
                              {isLeave ? '🏖️ ' : '📅 '}{evt.title}
                          </div>
                        );
                    })}
                </div>
            </div>
        );
    }
    return days;
  };

  const pendingLeaves = leaves.filter((s: any) => s.status === 'pending');
  const pendingSchedules = schedules.filter((s: any) => s.type === 'schedule' && s.is_shared && s.status === 'pending');

  return (
    <div className="max-w-6xl mx-auto space-y-6 flex flex-col xl:flex-row gap-6 animate-fade-in pb-12">
      <div className="flex-1 space-y-6 w-full">
        {/* Header Calendar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 card p-6">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-xl flex items-center justify-center">
                 <CalendarIcon size={24} />
             </div>
             <div>
                 <h1 className="text-xl font-display font-bold text-slate-900 dark:text-white">Jadwal & Kalender</h1>
                 <p className="text-sm text-slate-500">Event tim dan jadwal cuti bulan ini.</p>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                 <button onClick={() => changeMonth(-1)} className="px-3 py-1.5 hover:bg-white dark:hover:bg-slate-700 rounded text-sm font-medium transition-colors">&lt;</button>
                 <div className="px-4 py-1.5 text-sm font-bold min-w-[120px] text-center">
                     {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                 </div>
                 <button onClick={() => changeMonth(1)} className="px-3 py-1.5 hover:bg-white dark:hover:bg-slate-700 rounded text-sm font-medium transition-colors">&gt;</button>
             </div>
             <button 
                onClick={() => { setShowScheduleModal(true); loadEmployees(); }}
                className="btn bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-sm shadow-md"
             >
                <Plus size={16} /> Buat Jadwal
             </button>
             <button 
                onClick={() => setShowLeaveModal(true)}
                className="btn btn-primary text-sm shadow-md"
             >
                <Plus size={16} /> Ajukan Cuti
             </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="card overflow-hidden">
          <div className="grid grid-cols-7 text-center border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
              <div key={d} className="py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 bg-slate-100 dark:bg-slate-800 gap-[1px]">
             {loading ? (
               <div className="col-span-7 p-12 text-center text-slate-500 bg-white dark:bg-slate-900">Memuat kalender...</div>
             ) : renderCalendarDays()}
          </div>
        </div>
      </div>
      
      {/* Sidebar: Leave Requests */}
      <div className="w-full xl:w-80 flex flex-col gap-6 shrink-0">
         <div className="card p-6 min-h-[400px]">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
               Cuti Menunggu Approval <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{pendingLeaves.length}</span>
            </h3>
            
            <div className="space-y-3">
                {pendingLeaves.length === 0 ? (
                   <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                      <p className="text-sm font-medium text-slate-500">Tidak ada pengajuan cuti baru.</p>
                   </div>
                ) : (
                   pendingLeaves.map((pl: any) => (
                      <div key={pl.id} className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-700 space-y-3">
                         <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold font-display">
                                 {pl.user_name?.charAt(0)}
                             </div>
                             <div className="flex flex-col">
                                 <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{pl.user_name}</span>
                                 <span className="text-[10px] uppercase font-bold text-warning-500">{pl.leave_type} - {pl.days_count} Hari</span>
                             </div>
                         </div>
                         <div className="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2 rounded border border-slate-100 dark:border-slate-800">
                             {new Date(pl.start_date).toLocaleDateString('id-ID')} s/d {new Date(pl.end_date).toLocaleDateString('id-ID')}<br/>
                             <span className="font-medium mt-1 inline-block">Alasan:</span> {pl.reason}
                         </div>
                         {isOwner && (
                            <div className="flex gap-2">
                                <button onClick={() => reviewLeave(pl.id, 'approved')} className="flex-1 py-1.5 bg-success-50 dark:bg-success-900/20 text-success-600 hover:bg-success-100 dark:hover:bg-success-900/40 rounded transition-colors text-xs font-bold flex justify-center items-center gap-1">
                                    <CheckCircle size={14} /> Approve
                                </button>
                                <button onClick={() => reviewLeave(pl.id, 'rejected')} className="flex-1 py-1.5 bg-danger-50 dark:bg-danger-900/20 text-danger-600 hover:bg-danger-100 dark:hover:bg-danger-900/40 rounded transition-colors text-xs font-bold flex justify-center items-center gap-1">
                                    <XCircle size={14} /> Reject
                                </button>
                            </div>
                         )}
                      </div>
                   ))
                )}
            </div>

            {/* Pengajuan Jadwal Shared */}
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-8 mb-4">
               Jadwal Shared (Menunggu) <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{pendingSchedules.length}</span>
            </h3>
            <div className="space-y-3">
                {pendingSchedules.length === 0 ? (
                   <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                      <p className="text-sm font-medium text-slate-500">Tidak ada jadwal shared baru.</p>
                   </div>
                ) : (
                   pendingSchedules.map((ps: any) => (
                      <div key={ps.id} className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-700 space-y-3">
                         <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold font-display">
                                 {ps.author_name?.charAt(0)}
                             </div>
                             <div className="flex flex-col">
                                 <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{ps.author_name}</span>
                                 <span className="text-[10px] uppercase font-bold text-primary-500">Bagikan Jadwal</span>
                             </div>
                         </div>
                         <div className="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2 rounded border border-slate-100 dark:border-slate-800">
                             <span className="font-bold">{ps.title}</span><br/>
                             {new Date(ps.start_time).toLocaleDateString('id-ID')} - {new Date(ps.end_time).toLocaleDateString('id-ID')}
                         </div>
                         {isOwner && (
                            <div className="flex gap-2">
                                <button onClick={() => reviewSchedule(ps.id, 'approved')} className="flex-1 py-1.5 bg-success-50 dark:bg-success-900/20 text-success-600 hover:bg-success-100 dark:hover:bg-success-900/40 rounded transition-colors text-xs font-bold flex justify-center items-center gap-1">
                                    <CheckCircle size={14} /> Approve
                                </button>
                                <button onClick={() => reviewSchedule(ps.id, 'rejected')} className="flex-1 py-1.5 bg-danger-50 dark:bg-danger-900/20 text-danger-600 hover:bg-danger-100 dark:hover:bg-danger-900/40 rounded transition-colors text-xs font-bold flex justify-center items-center gap-1">
                                    <XCircle size={14} /> Reject
                                </button>
                            </div>
                         )}
                      </div>
                   ))
                )}
            </div>
         </div>
      </div>

      {showLeaveModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white">Pengajuan Cuti</h3>
              <button onClick={() => setShowLeaveModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipe Cuti</label>
                <select 
                   value={leaveType} onChange={e => setLeaveType(e.target.value)}
                   className="input w-full"
                >
                    <option value="annual">Cuti Tahunan</option>
                    <option value="sick">Sakit</option>
                    <option value="unpaid">Izin Tidak Dibayar</option>
                </select>
              </div>
              <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tanggal Mulai</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input w-full" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sampai</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input w-full" />
                  </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Alasan</label>
                <textarea 
                  value={reason} 
                  onChange={e => setReason(e.target.value)}
                  className="input w-full min-h-[80px] resize-none"
                  placeholder="Isi alasan cuti..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
              <button className="btn btn-primary w-full" onClick={submitLeave}>Kirim Pengajuan</button>
            </div>
          </div>
        </div>
      )}

      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 my-8">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white">Buat Jadwal Baru</h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">&times;</button>
            </div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Judul Jadwal</label>
                <input type="text" value={schedForm.title} onChange={e => setSchedForm({...schedForm, title: e.target.value})} className="input w-full" placeholder="Meeting Project X" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipe</label>
                <select value={schedForm.schedule_type} onChange={e => setSchedForm({...schedForm, schedule_type: e.target.value})} className="input w-full">
                    <option value="meeting">Meeting</option>
                    <option value="event">Event</option>
                    <option value="other">Lainnya</option>
                </select>
              </div>
              <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Waktu Mulai</label>
                    <input type="datetime-local" value={schedForm.start_time} onChange={e => setSchedForm({...schedForm, start_time: e.target.value})} className="input w-full" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Selesai</label>
                    <input type="datetime-local" value={schedForm.end_time} onChange={e => setSchedForm({...schedForm, end_time: e.target.value})} className="input w-full" />
                  </div>
              </div>
              <div className="flex gap-4 items-center">
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <input type="checkbox" checked={schedForm.is_all_day} onChange={e => setSchedForm({...schedForm, is_all_day: e.target.checked})} className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                  Sepanjang Hari
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <input type="checkbox" checked={schedForm.is_shared} onChange={e => setSchedForm({...schedForm, is_shared: e.target.checked})} className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                  Bagikan Secara Global
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Lokasi / Deskripsi</label>
                <input type="text" value={schedForm.description} onChange={e => setSchedForm({...schedForm, description: e.target.value})} className="input w-full" placeholder="Ruang Rapat A / Link Zoom" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Catatan Tambahan (Note)</label>
                <textarea value={schedForm.note} onChange={e => setSchedForm({...schedForm, note: e.target.value})} className="input w-full min-h-[60px] resize-none" placeholder="Harap bawa laporan Q3..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 text-primary-600 dark:text-primary-400">Pilih Pegawai (Assignees)</label>
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg max-h-40 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                   {employees.filter(emp => emp.role !== 'owner').map(emp => (
                     <label key={emp.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer">
                        <input 
                           type="checkbox" 
                           checked={schedForm.assignee_ids.includes(emp.id)}
                           onChange={(e) => {
                             const newIds = e.target.checked 
                               ? [...schedForm.assignee_ids, emp.id] 
                               : schedForm.assignee_ids.filter((id: number) => id !== emp.id);
                             setSchedForm({...schedForm, assignee_ids: newIds});
                           }}
                           className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                              {emp.full_name?.charAt(0)}
                           </div>
                           <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{emp.full_name}</span>
                        </div>
                     </label>
                   ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
              <button className="btn btn-primary w-full" onClick={submitSchedule}>Simpan Jadwal</button>
            </div>
          </div>
        </div>
      )}

      {selectedEvent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95">
             <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
               <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white">Detail {selectedEvent.type === 'leave' ? 'Cuti' : 'Jadwal'}</h3>
               <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">&times;</button>
             </div>
             <div className="p-6 space-y-4">
                <div className="text-lg font-bold text-slate-800 dark:text-white">{selectedEvent.title}</div>
                
                {selectedEvent.type === 'schedule' && (
                  <>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      <strong>📅 Waktu:</strong> {new Date(selectedEvent.start_time).toLocaleString('id-ID')} - {new Date(selectedEvent.end_time).toLocaleString('id-ID')}
                    </div>
                    {selectedEvent.description && (
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        <strong>📍 Lokasi/Desc:</strong> {selectedEvent.description}
                      </div>
                    )}
                    {selectedEvent.note && (
                      <div className="text-sm text-slate-600 dark:text-slate-400 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 rounded-lg">
                        <strong>📝 Catatan Tambahan:</strong><br/>{selectedEvent.note}
                      </div>
                    )}
                    {selectedEvent.assignees && selectedEvent.assignees.length > 0 && (
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        <strong>👥 Ditugaskan Kepada:</strong><br/>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {selectedEvent.assignees.map((a: any) => (
                            <span key={a.id} className="px-2 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded text-xs font-semibold">
                              {a.full_name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
                
                {selectedEvent.type === 'leave' && (
                  <>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      <strong>🏖️ Tipe:</strong> {selectedEvent.leave_type}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      <strong>📅 Waktu:</strong> {new Date(selectedEvent.start_date).toLocaleDateString('id-ID')} - {new Date(selectedEvent.end_date).toLocaleDateString('id-ID')}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      <strong>💬 Alasan:</strong> {selectedEvent.reason}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      <strong>Status:</strong> {selectedEvent.status === 'approved' ? '✅ Disetujui' : selectedEvent.status === 'rejected' ? '❌ Ditolak' : '⏳ Menunggu'}
                    </div>
                  </>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
