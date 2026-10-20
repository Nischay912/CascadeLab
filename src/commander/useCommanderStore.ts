import { create } from 'zustand';
import { DefconLevel, CommanderMode, TacticalLogEntry, CommanderMitigation } from './types';

interface CommanderState {
  isCommanderOpen: boolean;
  mode: CommanderMode;
  threatLevel: DefconLevel;
  logs: TacticalLogEntry[];
  activeMitigation: CommanderMitigation | null;
  appliedMitigationsCount: number;

  // Actions
  setIsCommanderOpen: (open: boolean) => void;
  setMode: (mode: CommanderMode) => void;
  setThreatLevel: (level: DefconLevel) => void;
  setActiveMitigation: (mitigation: CommanderMitigation | null) => void;
  addLog: (log: TacticalLogEntry) => void;
  addLogs: (logs: TacticalLogEntry[]) => void;
  clearLogs: () => void;
  recordMitigationApplied: () => void;
  resetCommander: () => void;
}

const INITIAL_LOGS: TacticalLogEntry[] = [
  {
    id: 'log_init',
    time: 0,
    timestamp: 'T+00:00',
    level: 'info',
    title: 'AI Incident Commander Initialized',
    message: 'AIOps autonomous telemetry monitoring active. Standing by on DEFCON 5 (Nominal).',
  },
];

export const useCommanderStore = create<CommanderState>((set) => ({
  isCommanderOpen: false,
  mode: 'advisory',
  threatLevel: 'DEFCON_5',
  logs: INITIAL_LOGS,
  activeMitigation: null,
  appliedMitigationsCount: 0,

  setIsCommanderOpen: (open) => set({ isCommanderOpen: open }),
  setMode: (mode) => set({ mode }),
  setThreatLevel: (threatLevel) => set({ threatLevel }),
  setActiveMitigation: (activeMitigation) => set({ activeMitigation }),

  addLog: (log) =>
    set((state) => {
      // Prevent duplicate log titles within close timeframe
      if (state.logs.length > 0 && state.logs[state.logs.length - 1].title === log.title) {
        return state;
      }
      return {
        logs: [...state.logs.slice(-49), log], // Keep last 50 tactical logs
      };
    }),

  addLogs: (newLogs) =>
    set((state) => {
      if (newLogs.length === 0) return state;
      return {
        logs: [...state.logs.slice(-49 + newLogs.length), ...newLogs],
      };
    }),

  clearLogs: () => set({ logs: INITIAL_LOGS }),

  recordMitigationApplied: () =>
    set((state) => ({
      appliedMitigationsCount: state.appliedMitigationsCount + 1,
      activeMitigation: null,
    })),

  resetCommander: () =>
    set({
      threatLevel: 'DEFCON_5',
      logs: INITIAL_LOGS,
      activeMitigation: null,
      appliedMitigationsCount: 0,
    }),
}));
