import { useState, useEffect, useRef } from 'react';
import { useFocusStore } from '../../stores/focusStore';
import { Timer, Play, Square, Check } from 'lucide-react';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import { confirm } from '@tauri-apps/plugin-dialog';

export default function FocusTimer() {
  const { status, remainingSeconds, durationMinutes, startSession, endSession, tick, reset } = useFocusStore();
  const [isOpen, setIsOpen] = useState(false);
  const [duration, setDuration] = useState(25);
  const [label, setLabel] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Timer Tick
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (status === 'in_progress' && remainingSeconds > 0) {
      interval = setInterval(() => {
        tick();
      }, 1000);
    } else if (status === 'in_progress' && remainingSeconds === 0) {
      // Finished!
      handleComplete();
    }
    return () => clearInterval(interval);
  }, [status, remainingSeconds, tick]);

  const handleComplete = async () => {
    await endSession('completed');
    
    // Send native desktop notification
    let permissionGranted = await isPermissionGranted();
    if (!permissionGranted) {
      permissionGranted = await requestPermission() === 'granted';
    }
    if (permissionGranted) {
      sendNotification({
        title: 'Focus Selesai! 🎉',
        body: `Sesi fokus ${durationMinutes} menit kamu sudah selesai. Saatnya istirahat sejenak!`,
        icon: 'assets/icon.png'
      });
    }
  };

  const handleCancel = async () => {
    const isConfirmed = await confirm("Yakin ingin membatalkan sesi fokus ini?", { title: 'Alpha', kind: 'warning' });
    if (isConfirmed) {
      await endSession('cancelled');
      reset();
    }
  };

  const handleCreate = async () => {
    try {
      await startSession(duration, label);
      setIsOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Gagal memulai sesi fokus");
    }
  };

  const handleAcknowledgeComplete = () => {
    reset();
  };

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      {status === 'idle' && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 transition-colors font-medium text-sm border border-emerald-200 dark:border-emerald-800"
        >
          <Timer size={16} />
          <span>Fokus</span>
        </button>
      )}

      {status === 'in_progress' && (
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg pr-1 overflow-hidden border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 text-white text-sm font-bold font-mono min-w-[70px] justify-center">
            <Timer size={14} className="animate-pulse" />
            {formatTime(remainingSeconds)}
          </div>
          <button
            onClick={handleCancel}
            title="Batalkan Sesi"
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors ml-1"
          >
            <Square size={14} className="fill-current" />
          </button>
        </div>
      )}

      {status === 'completed' && (
        <button
          onClick={handleAcknowledgeComplete}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors font-medium text-sm animate-bounce shadow-lg shadow-emerald-500/20"
        >
          <Check size={16} />
          <span>Selesai! (+2 Poin)</span>
        </button>
      )}

      {/* Start Modal Menu */}
      {isOpen && status === 'idle' && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 z-50 animate-in fade-in slide-in-from-top-2">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Mulai Timer Pomodoro</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Target Fokus (opsional)</label>
              <input
                type="text"
                placeholder="Contoh: Selesain PRD, Coding fitur X"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full text-sm bg-slate-50 dark:bg-slate-800 border items-center border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Durasi (Menit)</label>
              <div className="flex gap-2">
                {[15, 25, 45, 60].map(m => (
                  <button
                    key={m}
                    onClick={() => setDuration(m)}
                    className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      duration === m 
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400 ring-1 ring-primary-500' 
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleCreate}
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg px-4 py-2 mt-2 transition-colors"
            >
              <Play size={16} className="fill-current" />
              Mulai Fokus
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
