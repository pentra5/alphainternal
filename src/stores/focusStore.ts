import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import client from '../api/client';

export type FocusStatus = 'idle' | 'in_progress' | 'completed' | 'cancelled';

interface FocusState {
  sessionId: number | null;
  status: FocusStatus;
  durationMinutes: number;
  remainingSeconds: number;
  label: string | null;
}

interface FocusStore extends FocusState {
  startSession: (duration: number, label?: string) => Promise<void>;
  endSession: (status: 'completed' | 'cancelled') => Promise<void>;
  tick: () => void;
  reset: () => void;
}

export const useFocusStore = create<FocusStore>()(
  persist(
    (set, get) => ({
      sessionId: null,
      status: 'idle',
      durationMinutes: 25,
      remainingSeconds: 0,
      label: null,

      startSession: async (duration: number, label?: string) => {
        try {
          // Backend call
          const res = await client.post('/focus/start', {
            duration_minutes: duration,
            label: label || null
          });
          
          set({
            sessionId: res.data.id,
            status: 'in_progress',
            durationMinutes: duration,
            remainingSeconds: duration * 60,
            label: label || null
          });
        } catch (error) {
          console.error("Failed to start focus session:", error);
          throw error;
        }
      },

      endSession: async (status: 'completed' | 'cancelled') => {
        const { sessionId } = get();
        if (!sessionId) return;
        
        try {
          await client.patch(`/focus/${sessionId}/end`, {
            status: status
          });
          
          set({
            status: status,
            remainingSeconds: 0
          });
        } catch (error) {
          console.error("Failed to end focus session:", error);
        }
      },

      tick: () => set((state) => {
        if (state.status !== 'in_progress' || state.remainingSeconds <= 0) {
          return state;
        }
        
        const newSeconds = state.remainingSeconds - 1;
        if (newSeconds <= 0) {
          // Auto complete if remaining hits 0
          // The background interval will handle ending session with 'completed'
          return { remainingSeconds: 0 };
        }
        
        return { remainingSeconds: newSeconds };
      }),
      
      reset: () => set({
        sessionId: null,
        status: 'idle',
        remainingSeconds: 0,
        label: null
      })
    }),
    {
      name: 'focus-storage',
    }
  )
);
