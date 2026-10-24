import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { TopNav } from './ui/TopNav';
import { LeftPanel } from './ui/LeftPanel';
import { MainCanvas } from './ui/MainCanvas';
import { RightPanel } from './ui/RightPanel';
import { BottomTimeline, EventMarker } from './ui/BottomTimeline';
import { useArchitectureStore } from './state/useArchitectureStore';
import { useSimulationStore, ScenarioType } from './state/useSimulationStore';
import { runLinter, applyLintFix, LintFinding } from './lint';
import { analyzeSimulationIncident } from './analysis';
import {
  resolveSmartFault,
  getSmartTargetDisplayName,
  FAULT_DEFINITIONS,
  getArchitectureWorkloadProfiles,
  calculateLiveResilienceScore,
} from './sim/faultHelper';
import { ArchitectureSpec } from './schema/architecture';
import {
  BreakItModal,
  BreakItInitialResult,
  DefendItModal,
  DemoDirectorOverlay,
  LiveBattleHUD,
  LiveBattleState,
  AVAILABLE_CHAOS_CARDS,
  DEFEND_IT_MOVES,
  evaluateBreakItRun,
  evaluateDefendItRun,
  saveLeaderboardScore,
  BreakItScore,
  DefendItResult,
} from './demo';
import { shopFastNaiveTemplate } from './schema/templates';
import { PostmortemModal, generatePostmortem, PostmortemData } from './postmortem';
import { DeleteArchitectureModal } from './ui/DeleteArchitectureModal';
import { useCommanderStore } from './commander/useCommanderStore';
import { evaluateIncidentCommander, formatMissionTime } from './commander/engine';
import { CommanderMitigation } from './commander/types';
import { AICommanderModal } from './commander/AICommanderModal';
import { ShieldAlert, Bot } from 'lucide-react';

export const App: React.FC = () => {
  const {
    currentSpec,
    activeTemplateKey,
    customArchitectures,
    loadTemplate,
    deleteCustomArchitecture,
    setSpec,
    selectElement,
    removeFaultByType,
    clearAllFaults,
    setWorkloadPattern,
  } = useArchitectureStore();

  const {
    currentTime,
    maxTime,
    isRunning,
    speed,
    seed,
    history,
    currentMetrics,
    selectedScenario,
    initializeSimulation,
    runSimulationBatch,
    startLiveBattle,
    setCurrentTime,
    setSpeed,
    setScenario,
    toggleRunning,
    pauseSimulation,
    stepForward,
    resetSimulation,
  } = useSimulationStore();

  const [isPresenterMode, setIsPresenterMode] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isBreakItOpen, setIsBreakItOpen] = useState(false);
  const [isDefendItOpen, setIsDefendItOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDirectorOpen, setIsDirectorOpen] = useState(false);
  const [isPostmortemOpen, setIsPostmortemOpen] = useState(false);
  const [postmortemData, setPostmortemData] = useState<PostmortemData | null>(null);
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [liveBattle, setLiveBattle] = useState<LiveBattleState | null>(null);
  const [breakItInitialResult, setBreakItInitialResult] = useState<BreakItInitialResult | null>(null);
  const [defendItInitialResult, setDefendItInitialResult] = useState<DefendItResult | null>(null);
  const [defendItInitialMoves, setDefendItInitialMoves] = useState<string[]>([]);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1920
  );
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);
  const [activeCanvasTab, setActiveCanvasTab] = useState<
    'graph' | 'split' | 'optimizer' | 'chaos' | 'capacity' | 'reality'
  >('graph');

  // AI Autonomous Incident Commander State
  const {
    isCommanderOpen,
    mode: commanderMode,
    threatLevel: commanderThreatLevel,
    setIsCommanderOpen,
    setThreatLevel,
    setActiveMitigation,
    addLogs,
    recordMitigationApplied,
  } = useCommanderStore();

  const lastAutonomousExecutionRef = useRef<number>(-1);
  const skipReinitRef = useRef<boolean>(false);
  const [autoPilotNotification, setAutoPilotNotification] = useState<{
    title: string;
    message: string;
  } | null>(null);

  // Cybernetic Toast notification state
  const [cyberToast, setCyberToast] = useState<{
    message: string;
    type: 'fault' | 'heal' | 'workload' | 'info';
  } | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  const showToast = useCallback(
    (message: string, type: 'fault' | 'heal' | 'workload' | 'info' = 'info') => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      setCyberToast({ message, type });
      toastTimeoutRef.current = setTimeout(() => {
        setCyberToast(null);
      }, 4000);
    },
    []
  );

  /**
   * Intelligently injects or toggles off a fault across ANY architecture
   * (ShopFast, PUBG, Video Streaming, or Gemini AI generated topologies).
   */
  const handleInjectOrToggleFault = useCallback(
    (faultType: string, targetOverride?: string) => {
      skipReinitRef.current = true;
      const existingFault = currentSpec.faults.find((f) => f.type === faultType);

      let updatedSpec: ArchitectureSpec;

      if (existingFault) {
        // If targetOverride is provided and differs from current target, retarget cleanly!
        if (targetOverride && existingFault.target !== targetOverride) {
          const updatedFaults = currentSpec.faults.map((f) =>
            f.type === faultType ? { ...f, target: targetOverride } : f
          );
          updatedSpec = { ...currentSpec, faults: updatedFaults };
          setSpec(updatedSpec);
          const targetName =
            updatedSpec.services.find((s) => s.id === targetOverride)?.name || targetOverride;
          const label = FAULT_DEFINITIONS[faultType]?.label || faultType;
          showToast(`🎯 Retargeted: ${label} moved to [${targetName}]`, 'fault');
        } else {
          // Toggle OFF: Heal the fault
          updatedSpec = removeFaultByType(faultType);
          const targetName = getSmartTargetDisplayName(existingFault, currentSpec);
          const label = FAULT_DEFINITIONS[faultType]?.label || faultType;
          showToast(`🛡️ Healed: Removed ${label} from [${targetName}]`, 'heal');
        }
      } else {
        // Toggle ON: Inject new smart fault tailored to current topology (or custom target)
        if (currentTime >= 135) {
          setCurrentTime(0);
        }
        const smartFault = resolveSmartFault(faultType, currentSpec, currentTime, targetOverride);
        const cleaned = currentSpec.faults.filter((f) => f.type !== faultType);
        updatedSpec = {
          ...currentSpec,
          faults: [...cleaned, smartFault],
        };
        setSpec(updatedSpec);
        const targetName = getSmartTargetDisplayName(smartFault, updatedSpec);
        const label = FAULT_DEFINITIONS[faultType]?.label || faultType;
        showToast(
          `🔥 Injected: ${label} on [${targetName}] (t=${smartFault.start_s}s..${smartFault.end_s}s)`,
          'fault'
        );

        if (!isRunning) {
          toggleRunning();
        }
        if (speed < 2) {
          setSpeed(2);
        }
      }

      // Re-run simulation batch immediately with forceCustom=true so preset scenario doesn't wipe it
      runSimulationBatch(updatedSpec, 180, seed, true);
    },
    [
      currentSpec,
      currentTime,
      seed,
      isRunning,
      speed,
      toggleRunning,
      setSpeed,
      setCurrentTime,
      removeFaultByType,
      setSpec,
      runSimulationBatch,
      showToast,
    ]
  );

  /**
   * Instantly retargets an active fault when user picks a different service in dropdown
   */
  const handleRetargetFault = useCallback(
    (faultType: string, newTargetId: string) => {
      const existingFault = currentSpec.faults.find((f) => f.type === faultType);
      if (existingFault) {
        skipReinitRef.current = true;
        const updatedFaults = currentSpec.faults.map((f) =>
          f.type === faultType ? { ...f, target: newTargetId } : f
        );
        const updatedSpec: ArchitectureSpec = {
          ...currentSpec,
          faults: updatedFaults,
        };
        setSpec(updatedSpec);
        runSimulationBatch(updatedSpec, 180, seed, true);
        const targetName =
          updatedSpec.services.find((s) => s.id === newTargetId)?.name || newTargetId;
        const label = FAULT_DEFINITIONS[faultType]?.label || faultType;
        showToast(`🎯 Retargeted: ${label} moved to [${targetName}]`, 'fault');
      }
    },
    [currentSpec, seed, setSpec, runSimulationBatch, showToast]
  );

  /**
   * Switches offered workload pattern (Constant, Flash Sale, Ramp, Diurnal)
   * Immediately animates and reflects traffic on the topology canvas.
   */
  const handleSetWorkload = useCallback(
    (workloadPattern: string) => {
      skipReinitRef.current = true;
      const updatedSpec = setWorkloadPattern(workloadPattern);

      // Wrap back to 0 if at or past the surge window
      if (currentTime >= 135) {
        setCurrentTime(0);
      }

      // Re-run simulation batch immediately with updated workload
      runSimulationBatch(updatedSpec, 180, seed, true);

      // Auto-start playback so dynamic traffic curves visibly animate live on canvas
      if (!isRunning) {
        toggleRunning();
      }

      // Set playback speed to at least 2x for ramp / diurnal so user sees the curve unfold
      if (workloadPattern === 'ramp' || workloadPattern === 'diurnal') {
        if (speed < 2) setSpeed(2);
      }

      const profiles = getArchitectureWorkloadProfiles(currentSpec);
      const matchedProfile = profiles.find((p) => p.id === workloadPattern);
      const profileTitle = matchedProfile?.title || workloadPattern.replace('_', ' ').toUpperCase();
      const targetRps = Math.round(
        updatedSpec.workload.base_rps * (updatedSpec.workload.multiplier || 1.0)
      );

      if (workloadPattern === 'constant') {
        showToast(`⚖️ Baseline Restored: "${profileTitle}" (steady at ${targetRps} RPS)`, 'workload');
      } else if (workloadPattern === 'flash_sale' || workloadPattern === 'spike') {
        showToast(`🔥 Peak Surge Active: "${profileTitle}" (surging to ${targetRps} RPS)`, 'workload');
      } else if (workloadPattern === 'ramp') {
        showToast(
          `📈 Influx Ramp Active: "${profileTitle}" (climbing ${updatedSpec.workload.base_rps} to ${targetRps} RPS)`,
          'workload'
        );
      } else if (workloadPattern === 'diurnal') {
        const valleyRps = Math.round(updatedSpec.workload.base_rps * 0.5);
        const peakRps = Math.round(updatedSpec.workload.base_rps * 1.5);
        showToast(
          `🌊 Diurnal Wave Active: "${profileTitle}" (oscillating ${valleyRps} - ${peakRps} RPS)`,
          'workload'
        );
      } else {
        showToast(`📈 Workload profile switched to "${profileTitle}" (${targetRps} RPS)`, 'workload');
      }
    },
    [
      currentSpec,
      currentTime,
      isRunning,
      speed,
      seed,
      setWorkloadPattern,
      runSimulationBatch,
      setCurrentTime,
      toggleRunning,
      setSpeed,
      showToast,
    ]
  );

  /**
   * Dynamically tunes baseline ingress RPS for the current architecture
   */
  const handleUpdateBaseRps = useCallback(
    (newBaseRps: number) => {
      skipReinitRef.current = true;
      const updatedSpec: ArchitectureSpec = {
        ...currentSpec,
        workload: {
          ...currentSpec.workload,
          base_rps: newBaseRps,
        },
      };
      setSpec(updatedSpec);
      runSimulationBatch(updatedSpec, 180, seed, true);
      showToast(`📈 Ingress base load tuned to ${newBaseRps} RPS`, 'workload');
    },
    [currentSpec, setSpec, seed, runSimulationBatch, showToast]
  );

  /**
   * Heals all active faults across the entire architecture
   */
  const handleClearAllFaults = useCallback(() => {
    skipReinitRef.current = true;
    const updatedSpec = clearAllFaults();
    runSimulationBatch(updatedSpec, 180, seed, true);
    showToast('🛡️ All active faults cleared. Entire network restored to 100% nominal.', 'heal');
  }, [clearAllFaults, seed, runSimulationBatch, showToast]);

  /**
   * Dynamic event markers for bottom timeline scrubber.
   * Realistically aligns Red Dot (Chaos/Surge Strike) and Green Dot (Recovery/Cooldown).
   * Displays zero fake markers when running in Constant Baseline with no active faults.
   */
  const timelineMarkers: EventMarker[] = useMemo(() => {
    const markers: EventMarker[] = [];

    // 1. Add markers for all active injected faults
    if (currentSpec.faults && currentSpec.faults.length > 0) {
      currentSpec.faults.forEach((fault) => {
        const targetName = getSmartTargetDisplayName(fault, currentSpec);
        const label = FAULT_DEFINITIONS[fault.type]?.label || fault.type;
        markers.push({
          time: fault.start_s,
          label: `🔥 Strike: ${label} @ [${targetName}]`,
          type: 'fault',
        });
        const healTime = fault.start_s === 30 ? 110 : Math.min(180, fault.end_s + 15);
        markers.push({
          time: healTime,
          label: `🌱 Heal: ${label} cleared & recovered @ [${targetName}]`,
          type: 'recovery',
        });
      });
    }

    // 2. Add markers for dynamic non-constant workload patterns
    const pattern = currentSpec.workload.pattern;
    const profiles = getArchitectureWorkloadProfiles(currentSpec);
    const matchedProfile = profiles.find((p) => p.id === pattern);
    const profileTitle = matchedProfile?.title || pattern.toUpperCase();

    if (pattern === 'flash_sale' || pattern === 'spike') {
      markers.push({
        time: 30,
        label: `⚡ Surge Strike: ${profileTitle}`,
        type: 'fault',
      });
      markers.push({
        time: 110,
        label: `🌱 Recovery: ${profileTitle} Cooldown`,
        type: 'recovery',
      });
    } else if (pattern === 'ramp') {
      markers.push({
        time: 25,
        label: `📈 Surge Influx: ${profileTitle}`,
        type: 'fault',
      });
      markers.push({
        time: 110,
        label: `🛡️ Stabilization: ${profileTitle} Settled`,
        type: 'recovery',
      });
    } else if (pattern === 'diurnal') {
      markers.push({
        time: 30,
        label: `☀️ Peak Hour: ${profileTitle}`,
        type: 'fault',
      });
      markers.push({
        time: 110,
        label: `🌙 Off-Peak: ${profileTitle} Relief`,
        type: 'recovery',
      });
    }

    return markers.sort((a, b) => a.time - b.time);
  }, [currentSpec]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isLeftRail = isLeftPanelCollapsed;
  const isRightDrawerMode = windowWidth < 1440;
  const rightWidthClass = windowWidth >= 1680 ? 'w-[380px]' : 'w-[360px]';

  // Compute live architecture lint report
  const lintReport = useMemo(() => runLinter(currentSpec), [currentSpec]);
  const [findings, setFindings] = useState<LintFinding[]>(lintReport.findings);

  // Keep findings synced whenever currentSpec changes
  useEffect(() => {
    setFindings(lintReport.findings);
  }, [lintReport]);

  // Initialize simulation batch when spec or seed changes (skip if battle is active or in-flight update)
  useEffect(() => {
    if (liveBattle) return;
    if (skipReinitRef.current) {
      skipReinitRef.current = false;
      return;
    }
    initializeSimulation(currentSpec, seed);
  }, [currentSpec, seed, liveBattle, initializeSimulation]);

  // Playback timer tick loop
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      stepForward();
    }, 1000 / speed);
    return () => clearInterval(interval);
  }, [isRunning, speed, stepForward]);

  // Global hotkeys: Space (Play/Pause), R (Reset), 1, 2, 3 (Speed), P (Presenter), D (Director), Escape (Panic Reset)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        toggleRunning();
      } else if (e.key === 'r' || e.key === 'R') {
        resetSimulation();
        lastAutonomousExecutionRef.current = -1;
      } else if (e.key === '1') {
        setSpeed(1);
      } else if (e.key === '2') {
        setSpeed(4);
      } else if (e.key === '3') {
        setSpeed(16);
      } else if (e.key === 'p' || e.key === 'P') {
        setIsPresenterMode((prev) => !prev);
      } else if (e.key === 'd' || e.key === 'D') {
        setIsDirectorOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        // Panic Reset: clears all active faults and returns to clean shopfast state
        loadTemplate('shopfast');
        resetSimulation();
        lastAutonomousExecutionRef.current = -1;
        setIsBreakItOpen(false);
        setIsDefendItOpen(false);
        setIsDirectorOpen(false);
        setIsPostmortemOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleRunning, resetSimulation, setSpeed, loadTemplate]);

  // Dynamic Real-Time Resilience Score for the top bar
  const liveResilienceScore = useMemo(() => {
    return calculateLiveResilienceScore(currentSpec, currentMetrics);
  }, [currentSpec, currentMetrics]);

  // Dynamic Root Cause & Pattern Analysis Engine
  const rootCause = useMemo(() => {
    const hasActiveFault = currentMetrics?.activeFaults && currentMetrics.activeFaults.length > 0;
    const hasDegradation = currentMetrics && currentMetrics.userSuccessRate < 98;
    const isPastFaultStart = currentSpec.faults.some((f) => currentTime >= f.start_s);

    if (!hasActiveFault && !hasDegradation && !isPastFaultStart) {
      return null;
    }

    const historyUpToNow = history.slice(0, currentTime + 1);
    if (historyUpToNow.length === 0) return null;
    return analyzeSimulationIncident(currentSpec, historyUpToNow);
  }, [currentSpec, history, currentTime, currentMetrics]);

  // AI Autonomous Incident Commander: Continuous Threat Evaluation & Self-Healing Loop
  useEffect(() => {
    const evaluation = evaluateIncidentCommander(
      currentSpec,
      currentMetrics,
      currentTime,
      rootCause
    );

    setThreatLevel(evaluation.threatLevel);
    setActiveMitigation(evaluation.prescribedMitigation);

    if (evaluation.newLogs.length > 0) {
      addLogs(evaluation.newLogs);
    }

    // Reset autonomous execution timestamp when simulation rewinds to 0
    if (currentTime === 0) {
      lastAutonomousExecutionRef.current = -1;
      setAutoPilotNotification(null);
    }

    // Auto-Pilot Autonomous Self-Healing Directive
    if (
      commanderMode === 'autonomous' &&
      evaluation.threatLevel !== 'DEFCON_5' &&
      evaluation.threatLevel !== 'DEFCON_4' &&
      evaluation.prescribedMitigation &&
      (lastAutonomousExecutionRef.current === -1 || currentTime - lastAutonomousExecutionRef.current >= 3)
    ) {
      lastAutonomousExecutionRef.current = currentTime;
      skipReinitRef.current = true;
      const updated = evaluation.prescribedMitigation.apply(currentSpec);
      setSpec(updated);
      runSimulationBatch(updated, 180, seed);
      recordMitigationApplied();
      
      const mitigationTitle = evaluation.prescribedMitigation.title;
      setAutoPilotNotification({
        title: mitigationTitle,
        message: 'In-flight resilience countermeasure deployed. Mitigated bottleneck and restored SLO.',
      });
      setTimeout(() => {
        setAutoPilotNotification((prev) => (prev?.title === mitigationTitle ? null : prev));
      }, 4500);

      addLogs([
        {
          id: `auto_${Date.now()}`,
          time: currentTime,
          timestamp: formatMissionTime(currentTime),
          level: 'action',
          title: 'Autonomous Self-Healing Action Executed',
          message: `AI Commander autonomously executed '${evaluation.prescribedMitigation.title}'. Mitigated bottleneck in-flight and restored system SLO.`,
        },
      ]);
    }
  }, [
    currentSpec,
    currentMetrics,
    currentTime,
    rootCause,
    commanderMode,
    seed,
    setThreatLevel,
    setActiveMitigation,
    addLogs,
    recordMitigationApplied,
    setSpec,
    runSimulationBatch,
  ]);

  const handleApplyCommanderMitigation = useCallback(
    (mitigation: CommanderMitigation) => {
      pauseSimulation();
      const updated = mitigation.apply(currentSpec);
      // skipReinitRef is false, so initializeSimulation runs:
      // resets to 00:00, isRunning = false (paused), metrics = history[0] (all green)
      setSpec(updated);
      recordMitigationApplied();
      addLogs([
        {
          id: `auth_${Date.now()}`,
          time: 0,
          timestamp: formatMissionTime(0),
          level: 'action',
          title: 'Mitigation Authorized & Deployed',
          message: `Human SRE authorized '${mitigation.title}'. Digital Twin stabilized at baseline 00:00 (All green, paused).`,
        },
      ]);
    },
    [currentSpec, setSpec, recordMitigationApplied, addLogs, pauseSimulation]
  );

  const handleRunLinter = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const rep = runLinter(currentSpec);
      setFindings(rep.findings);
      setIsAnalyzing(false);
    }, 400);
  };

  const handleApplyFix = (findingId: string) => {
    const updatedSpec = applyLintFix(currentSpec, findingId);
    skipReinitRef.current = true;
    setSpec(updatedSpec);
    runSimulationBatch(updatedSpec, 180, seed);
  };

  const handleAutoHarden = () => {
    loadTemplate('shopfast_hardened');
  };

  const handleScenarioChange = useCallback(
    (scenario: string) => {
      setScenario(scenario as ScenarioType, currentSpec);
    },
    [setScenario, currentSpec]
  );

  const handleLaunchBreakItLive = (selectedCards: string[], playerName: string) => {
    const cloned = JSON.parse(JSON.stringify(currentSpec));
    cloned.faults = [];
    for (const cId of selectedCards) {
      const card = AVAILABLE_CHAOS_CARDS.find((c) => c.id === cId);
      if (card) card.applyFault(cloned);
    }
    setSpec(cloned);
    setIsBreakItOpen(false);
    setLiveBattle({
      mode: 'break_it',
      cards: selectedCards,
      playerName,
    });
    // Immediately launch live battle running at 2x speed for 90s duration
    startLiveBattle(cloned, 90, 2);
  };

  const handleLaunchDefendItLive = (selectedMoves: string[]) => {
    const disaster = JSON.parse(JSON.stringify(shopFastNaiveTemplate));
    disaster.workload.pattern = 'spike';
    disaster.workload.multiplier = 2.5;
    disaster.faults = [
      {
        type: 'latency',
        target: 'payment-provider',
        factor: 5,
        start_s: 2,
        end_s: 85,
      },
    ];
    for (const mId of selectedMoves) {
      const move = DEFEND_IT_MOVES.find((m) => m.id === mId);
      if (move) move.applyMove(disaster);
    }
    setSpec(disaster);
    setIsDefendItOpen(false);
    setLiveBattle({
      mode: 'defend_it',
      deployedMoves: selectedMoves,
    });
    // Immediately launch live defense running at 2x speed for 90s duration
    startLiveBattle(disaster, 90, 2);
  };

  const handleFinishBattle = (finalMetrics?: any) => {
    if (!liveBattle) return;

    const cleanSpec = JSON.parse(JSON.stringify(shopFastNaiveTemplate));
    cleanSpec.faults = [];
    cleanSpec.workload.pattern = 'constant';
    cleanSpec.workload.multiplier = 1.0;

    if (liveBattle.mode === 'break_it') {
      // Calculate final score using the real simulation physics engine
      const evalRes = evaluateBreakItRun(currentSpec, liveBattle.cards || []);
      const moneyLost = Math.max(evalRes.moneyLostInr, finalMetrics?.peakMoneyLost || 0);
      const blastRadius = Math.max(evalRes.blastRadiusPct, finalMetrics?.peakBlastRadius || 0);
      const destructionScore = Math.max(
        evalRes.destructionScore,
        Math.round((moneyLost / 1000) * 1.5 + blastRadius * 2.0)
      );

      const newScore: BreakItScore = {
        id: `score-${Date.now()}`,
        playerName: liveBattle.playerName?.trim() || 'Guest Judge',
        destructionScore,
        moneyLostInr: moneyLost,
        blastRadiusPct: blastRadius,
        cardsUsed: liveBattle.cards || [],
        date: new Date().toISOString().split('T')[0],
      };
      saveLeaderboardScore(newScore);

      // Populate result report in modal so user sees full destruction score & leaderboard
      setBreakItInitialResult({
        destructionScore,
        moneyLostInr: moneyLost,
        blastRadiusPct: blastRadius,
        selectedCards: liveBattle.cards || [],
        playerName: liveBattle.playerName || 'Guest Judge',
      });
      setLiveBattle(null);
      // Immediately reset background canvas to nominal peaceful baseline
      setSpec(cleanSpec);
      setScenario('baseline', cleanSpec);
      initializeSimulation(cleanSpec, 42);
      resetSimulation();
      setSpeed(1);
      setIsBreakItOpen(true);
    } else {
      const allMoves = Array.from(
        new Set([...(liveBattle.deployedMoves || []), ...(finalMetrics?.deployedMoves || [])])
      );
      const evalRes = evaluateDefendItRun(allMoves);
      setDefendItInitialResult(evalRes);
      setDefendItInitialMoves(allMoves);
      setLiveBattle(null);
      // Immediately reset background canvas to nominal peaceful baseline
      setSpec(cleanSpec);
      setScenario('baseline', cleanSpec);
      initializeSimulation(cleanSpec, 42);
      resetSimulation();
      setSpeed(1);
      setIsDefendItOpen(true);
    }
  };

  const handleCancelBattle = () => {
    // Abort battle: completely reset canvas back to clean normal baseline
    const cleanSpec = JSON.parse(JSON.stringify(shopFastNaiveTemplate));
    cleanSpec.faults = [];
    cleanSpec.workload.pattern = 'constant';
    cleanSpec.workload.multiplier = 1.0;
    setSpec(cleanSpec);
    setScenario('baseline', cleanSpec);
    initializeSimulation(cleanSpec, 42);
    resetSimulation();
    setSpeed(1);
    setLiveBattle(null);
  };

  const handleCloseBreakIt = () => {
    setIsBreakItOpen(false);
    // If closing after battle completed, restore clean baseline so canvas is calm
    const cleanSpec = JSON.parse(JSON.stringify(shopFastNaiveTemplate));
    cleanSpec.faults = [];
    cleanSpec.workload.pattern = 'constant';
    cleanSpec.workload.multiplier = 1.0;
    setSpec(cleanSpec);
    setScenario('baseline', cleanSpec);
    initializeSimulation(cleanSpec, 42);
    resetSimulation();
    setSpeed(1);
    setBreakItInitialResult(null);
  };

  const handleCloseDefendIt = () => {
    setIsDefendItOpen(false);
    // If closing after defense drill completed, restore clean baseline
    const cleanSpec = JSON.parse(JSON.stringify(shopFastNaiveTemplate));
    cleanSpec.faults = [];
    cleanSpec.workload.pattern = 'constant';
    cleanSpec.workload.multiplier = 1.0;
    setSpec(cleanSpec);
    setScenario('baseline', cleanSpec);
    initializeSimulation(cleanSpec, 42);
    resetSimulation();
    setSpeed(1);
    setDefendItInitialResult(null);
    setDefendItInitialMoves([]);
  };

  return (
    <div
      className={`h-screen w-screen flex flex-col bg-background text-text-primary overflow-hidden font-sans ${
        isPresenterMode ? 'text-sm' : 'text-xs'
      }`}
    >
      {/* Top NOC Bar */}
      <TopNav
        isRunning={isRunning}
        onToggleRun={toggleRunning}
        onStep={stepForward}
        onReset={resetSimulation}
        speed={speed}
        onChangeSpeed={setSpeed}
        selectedTemplate={activeTemplateKey}
        customArchitectures={customArchitectures}
        onSelectTemplate={(tpl) => loadTemplate(tpl)}
        onDeleteCustomArchitecture={() => setIsDeleteModalOpen(true)}
        selectedScenario={selectedScenario}
        onSelectScenario={handleScenarioChange}
        resilienceScore={liveResilienceScore}
        onAutoHarden={handleAutoHarden}
        onOpenCommander={() => setIsCommanderOpen(true)}
        commanderThreatLevel={commanderThreatLevel}
        onOpenBreakIt={() => setIsBreakItOpen(true)}
        onOpenDefendIt={() => setIsDefendItOpen(true)}
        onOpenPostmortem={() => {
          const report = generatePostmortem(currentSpec, history);
          setPostmortemData(report);
          setIsPostmortemOpen(true);
        }}
        onOpenRealityCheck={() => setActiveCanvasTab('reality')}
        isPresenterMode={isPresenterMode}
        onTogglePresenterMode={() => {
          setIsPresenterMode((prev) => !prev);
        }}
        userSuccessRate={currentMetrics?.userSuccessRate}
        userP95Ms={currentMetrics?.userP95Ms}
        cumulativeMoneyLostInr={currentMetrics?.cumulativeMoneyLostInr}
        valuePerRequestInr={currentSpec.value_per_request_inr || 500}
        onUpdateValuePerRequest={(val) => {
          setSpec({
            ...currentSpec,
            value_per_request_inr: val,
          });
        }}
        onInjectFault={handleInjectOrToggleFault}
      />

      {/* Cybernetic Toast Notification */}
      {cyberToast && (
        <div
          data-testid="cyber-toast"
          className="fixed top-14 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 animate-in fade-in slide-in-from-top-2"
        >
          <div
            className={`px-4 py-2 rounded-lg border text-xs font-semibold shadow-2xl flex items-center gap-2.5 backdrop-blur-md ${
              cyberToast.type === 'fault'
                ? 'bg-rose-950/90 border-rose-500/60 text-rose-200 shadow-rose-900/30 ring-1 ring-rose-500/30'
                : cyberToast.type === 'heal'
                ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-200 shadow-emerald-900/30 ring-1 ring-emerald-500/30'
                : cyberToast.type === 'workload'
                ? 'bg-cyan-950/90 border-cyan-500/60 text-cyan-200 shadow-cyan-900/30 ring-1 ring-cyan-500/30'
                : 'bg-surface-raised/90 border-accent/50 text-text-primary shadow-noc'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full animate-ping flex-shrink-0 ${
                cyberToast.type === 'fault'
                  ? 'bg-rose-400'
                  : cyberToast.type === 'heal'
                  ? 'bg-emerald-400'
                  : cyberToast.type === 'workload'
                  ? 'bg-cyan-400'
                  : 'bg-accent'
              }`}
            />
            <span className="font-mono text-[11px] tracking-wide">{cyberToast.message}</span>
          </div>
        </div>
      )}

      {/* Presenter Mode KPI Banner (Priority A7) */}
      {isPresenterMode && (
        <div className="bg-surface-raised border-b border-accent/40 px-6 py-2.5 flex items-center justify-between gap-6 shadow-noc z-20">
          <div className="flex items-center gap-8 flex-1 justify-around">
            <div className="flex flex-col">
              <span className="text-[11px] font-mono uppercase tracking-wider text-text-muted">Ingress Load</span>
              <span className="text-2xl font-bold font-mono text-accent tabular-nums">
                {Math.round(currentMetrics?.entryRps ?? 600)} <span className="text-sm font-normal text-text-dim">RPS</span>
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-mono uppercase tracking-wider text-text-muted">User Success Rate</span>
              <span
                className={`text-2xl font-bold font-mono tabular-nums ${
                  (currentMetrics?.userSuccessRate ?? 100) >= 99
                    ? 'text-status-healthy'
                    : (currentMetrics?.userSuccessRate ?? 100) >= 90
                    ? 'text-status-degraded'
                    : 'text-status-failing'
                }`}
              >
                {(currentMetrics?.userSuccessRate ?? 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-mono uppercase tracking-wider text-text-muted">p95 Latency</span>
              <span
                className={`text-2xl font-bold font-mono tabular-nums ${
                  (currentMetrics?.userP95Ms ?? 410) > 800 ? 'text-status-failing' : 'text-text-primary'
                }`}
              >
                {Math.round(currentMetrics?.userP95Ms ?? 410)}{' '}
                <span className="text-sm font-normal text-text-dim">ms</span>
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-mono uppercase tracking-wider text-text-muted">Revenue Lost</span>
              <span className="text-2xl font-bold font-mono text-status-failing tabular-nums">
                ₹{Math.round(currentMetrics?.cumulativeMoneyLostInr ?? 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-accent/20 text-accent font-mono text-xs border border-accent/40 font-semibold">
              PRESENTER MODE
            </span>
            <button
              onClick={() => setIsPresenterMode(false)}
              className="px-2.5 py-1 rounded bg-surface border border-border text-xs text-text-muted hover:text-text-primary hover:border-accent"
              title="Exit Presenter Mode (P)"
            >
              Exit (P)
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace: Left Panel + Center Canvas + Right Panel */}
      <div className="flex-1 flex overflow-hidden relative">
        {!isPresenterMode && (
          <LeftPanel
            isCollapsed={isLeftRail}
            onToggleCollapse={() => setIsLeftPanelCollapsed((prev) => !prev)}
            onInjectFault={handleInjectOrToggleFault}
            onRetargetFault={handleRetargetFault}
            onSetWorkload={handleSetWorkload}
            onUpdateBaseRps={handleUpdateBaseRps}
            onClearAllFaults={handleClearAllFaults}
            onOpenBreakIt={() => setIsBreakItOpen(true)}
            onOpenDefendIt={() => setIsDefendItOpen(true)}
          />
        )}

        {/* Central Canvas with React Flow auto-layout + ParticleCanvas overlay */}
        <div className="flex-1 h-full relative overflow-hidden flex flex-col min-w-0">
          <MainCanvas
            onSelectNode={(nodeId) => selectElement('service', nodeId)}
            onSelectEdge={(edgeId) => selectElement('edge', edgeId)}
            selectedNodeId={null}
            isSidebarOpen={!isLeftRail}
            activeTab={activeCanvasTab}
            onTabChange={setActiveCanvasTab}
          />

          {/* Floating drawer toggle button for screens < 1440px */}
          {isRightDrawerMode && !isPresenterMode && (
            <button
              onClick={() => setIsRightDrawerOpen((prev) => !prev)}
              className="absolute right-3 top-12 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-raised border border-border shadow-noc hover:border-accent text-xs font-medium text-text-primary backdrop-blur"
              title="Toggle Linter & Root-cause panel"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-accent" />
              <span>{isRightDrawerOpen ? 'Close Panel' : 'Insights & Linter'}</span>
            </button>
          )}
        </div>

        {/* Normal RightPanel on >= 1440px */}
        {!isPresenterMode && !isRightDrawerMode && (
          <RightPanel
            findings={findings}
            rootCause={rootCause}
            onRunLinter={handleRunLinter}
            onApplyFix={handleApplyFix}
            isAnalyzing={isAnalyzing}
            designScore={lintReport.staticResilienceScore}
            widthClass={rightWidthClass}
          />
        )}

        {/* Slide-over Drawer RightPanel on < 1440px */}
        {!isPresenterMode && isRightDrawerMode && isRightDrawerOpen && (
          <div className="absolute right-0 top-0 bottom-0 z-40 shadow-2xl flex animate-in slide-in-from-right duration-200">
            <RightPanel
              findings={findings}
              rootCause={rootCause}
              onRunLinter={handleRunLinter}
              onApplyFix={handleApplyFix}
              isAnalyzing={isAnalyzing}
              designScore={lintReport.staticResilienceScore}
              widthClass="w-[360px]"
              onCloseDrawer={() => setIsRightDrawerOpen(false)}
            />
          </div>
        )}
      </div>

      {/* Floating Auto-Pilot Active Interventions Banner */}
      {autoPilotNotification && (
        <div className="fixed top-14 right-6 z-50 flex items-center gap-3 bg-[#0B1020]/95 border border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.4)] px-4 py-3 rounded-lg backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center flex-shrink-0 animate-pulse">
            <Bot className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="max-w-[340px]">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/15 px-1.5 py-0.5 rounded border border-cyan-500/30">
                Auto-Pilot Active
              </span>
              <span className="text-xs font-bold text-white truncate" title={autoPilotNotification.title}>
                {autoPilotNotification.title}
              </span>
            </div>
            <p className="text-[11px] text-text-muted mt-0.5 leading-tight">
              {autoPilotNotification.message}
            </p>
          </div>
          <button
            onClick={() => setAutoPilotNotification(null)}
            className="text-text-muted hover:text-white ml-2 text-xs transition-colors p-1"
            title="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}

      {/* Bottom Telemetry & Timeline Scrubber */}
      <BottomTimeline
        currentTime={currentTime}
        maxTime={maxTime}
        onSeek={setCurrentTime}
        isRunning={isRunning}
        onToggleRun={toggleRunning}
        onStep={stepForward}
        onReset={resetSimulation}
        speed={speed}
        onChangeSpeed={setSpeed}
        currentMetrics={currentMetrics}
        history={history}
        markers={timelineMarkers}
      />

      {/* Live Arcade Battle / Incident Commander HUD */}
      {liveBattle && (
        <LiveBattleHUD
          battle={liveBattle}
          onFinishBattle={handleFinishBattle}
          onCancelBattle={handleCancelBattle}
        />
      )}

      {/* Phase 10 Interactive Modals & Demo Director */}
      <BreakItModal
        isOpen={isBreakItOpen}
        onClose={handleCloseBreakIt}
        onLaunchLiveBattle={handleLaunchBreakItLive}
        initialResult={breakItInitialResult}
      />

      <DefendItModal
        isOpen={isDefendItOpen}
        onClose={handleCloseDefendIt}
        onLaunchLiveDefense={handleLaunchDefendItLive}
        initialResult={defendItInitialResult}
        initialMoves={defendItInitialMoves}
      />

      <DemoDirectorOverlay
        isActive={isDirectorOpen}
        onClose={() => setIsDirectorOpen(false)}
        onSelectTab={() => {}}
      />

      {postmortemData && (
        <PostmortemModal
          postmortem={postmortemData}
          isOpen={isPostmortemOpen}
          onClose={() => setIsPostmortemOpen(false)}
        />
      )}

      {/* Delete Architecture Confirmation Modal */}
      <DeleteArchitectureModal
        isOpen={isDeleteModalOpen}
        architectureName={currentSpec.name || 'Custom Architecture'}
        servicesCount={currentSpec.services.length}
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          deleteCustomArchitecture(activeTemplateKey);
          setScenario('baseline', shopFastNaiveTemplate);
          initializeSimulation(shopFastNaiveTemplate, 42);
          resetSimulation();
          setSpeed(1);
          setIsDeleteModalOpen(false);
        }}
      />

      {/* AI Autonomous Incident Commander Modal */}
      <AICommanderModal
        isOpen={isCommanderOpen}
        onClose={() => setIsCommanderOpen(false)}
        currentSpec={currentSpec}
        onApplyMitigation={handleApplyCommanderMitigation}
        onTriggerChaosScenario={(sc) => handleScenarioChange(sc)}
        resilienceScore={liveResilienceScore}
      />
    </div>
  );
};
