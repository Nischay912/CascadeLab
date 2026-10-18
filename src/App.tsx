import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TopNav } from './ui/TopNav';
import { LeftPanel } from './ui/LeftPanel';
import { MainCanvas } from './ui/MainCanvas';
import { RightPanel } from './ui/RightPanel';
import { BottomTimeline } from './ui/BottomTimeline';
import { useArchitectureStore } from './state/useArchitectureStore';
import { useSimulationStore, ScenarioType } from './state/useSimulationStore';
import { runLinter, applyLintFix, LintFinding } from './lint';
import { analyzeSimulationIncident } from './analysis';
import { evaluateFastResilienceScore } from './optimizer/fastSuite';
import { BreakItModal, DefendItModal, DemoDirectorOverlay } from './demo';
import { PostmortemModal, generatePostmortem, PostmortemData } from './postmortem';

export const App: React.FC = () => {
  const {
    currentSpec,
    activeTemplateKey,
    loadTemplate,
    setSpec,
    selectElement,
    addFault,
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
    setCurrentTime,
    setSpeed,
    setScenario,
    toggleRunning,
    stepForward,
    resetSimulation,
  } = useSimulationStore();

  const [isPresenterMode, setIsPresenterMode] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isBreakItOpen, setIsBreakItOpen] = useState(false);
  const [isDefendItOpen, setIsDefendItOpen] = useState(false);
  const [isDirectorOpen, setIsDirectorOpen] = useState(false);
  const [isPostmortemOpen, setIsPostmortemOpen] = useState(false);
  const [postmortemData, setPostmortemData] = useState<PostmortemData | null>(null);
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 1440 : false
  );

  // Compute live architecture lint report
  const lintReport = useMemo(() => runLinter(currentSpec), [currentSpec]);
  const [findings, setFindings] = useState<LintFinding[]>(lintReport.findings);
  const [resilienceScore, setResilienceScore] = useState<number>(lintReport.staticResilienceScore);

  // Keep findings and score synced whenever currentSpec changes
  useEffect(() => {
    setFindings(lintReport.findings);
    setResilienceScore(lintReport.staticResilienceScore);
  }, [lintReport]);

  // Initialize simulation batch when spec or seed changes
  useEffect(() => {
    initializeSimulation(currentSpec, seed);
  }, [currentSpec, seed, initializeSimulation]);

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
        setIsBreakItOpen(false);
        setIsDefendItOpen(false);
        setIsDirectorOpen(false);
        setIsPostmortemOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleRunning, resetSimulation, setSpeed, loadTemplate]);

  // Headline Chaos Suite Resilience Score for the top bar
  const chaosResilienceScore = useMemo(() => {
    return evaluateFastResilienceScore(currentSpec);
  }, [currentSpec]);

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

  const handleRunLinter = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const rep = runLinter(currentSpec);
      setFindings(rep.findings);
      setResilienceScore(rep.staticResilienceScore);
      setIsAnalyzing(false);
    }, 400);
  };

  const handleApplyFix = (findingId: string) => {
    const updatedSpec = applyLintFix(currentSpec, findingId);
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
        onSelectTemplate={(tpl) => loadTemplate(tpl)}
        selectedScenario={selectedScenario}
        onSelectScenario={handleScenarioChange}
        resilienceScore={chaosResilienceScore}
        onAutoHarden={handleAutoHarden}
        onOpenBreakIt={() => setIsBreakItOpen(true)}
        onOpenPostmortem={() => {
          const report = generatePostmortem(currentSpec, history);
          setPostmortemData(report);
          setIsPostmortemOpen(true);
        }}
        onOpenRealityCheck={() => alert('Reality Check module is in tab.')}
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
        onInjectFault={(f) => {
          let target = 'payment-provider';
          let factor = 5;
          let type = f;
          if (f === 'kill_instances') {
            target = 'auth';
          } else if (f === 'kill_100') {
            target = 'orders-db';
            type = 'kill_instances';
          } else if (f === 'cache_flush') {
            target = 'cache';
          } else if (f === 'az_outage') {
            target = 'all';
          }
          addFault({
            type: type as any,
            target,
            start_s: currentTime || 60,
            end_s: (currentTime || 60) + 60,
            factor,
            percentage: f === 'kill_100' ? 100 : 50,
          });
          runSimulationBatch(currentSpec, 180, seed);
        }}
      />

      {/* Presenter Mode KPI Banner (Priority A7) */}
      {isPresenterMode && (
        <div className="bg-surface-raised border-b border-accent/40 px-6 py-2.5 flex items-center justify-between gap-6 shadow-noc z-20">
          <div className="flex items-center gap-8 flex-1 justify-around">
            <div className="flex flex-col">
              <span className="text-[11px] font-mono uppercase tracking-wider text-text-muted">Ingress Load</span>
              <span className="text-2xl font-bold font-mono text-accent tabular-nums">
                {Math.round(currentMetrics?.ingressRps ?? 600)} <span className="text-sm font-normal text-text-dim">RPS</span>
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
      <div className="flex-1 flex overflow-hidden">
        {!isPresenterMode && (
          <LeftPanel
            isCollapsed={isLeftPanelCollapsed}
            onToggleCollapse={() => setIsLeftPanelCollapsed((prev) => !prev)}
            onInjectFault={(f) => {
              addFault({
                type: f as any,
                target:
                  currentSpec.services[currentSpec.services.length - 1]?.id ||
                  'payment-provider',
                start_s: 60,
                end_s: 120,
                factor: 5,
              });
              runSimulationBatch(currentSpec, 180, seed);
            }}
            onSetWorkload={(w) => {
              setWorkloadPattern(w);
              runSimulationBatch(currentSpec, 180, seed);
            }}
            onOpenBreakIt={() => setIsBreakItOpen(true)}
            onOpenDefendIt={() => setIsDefendItOpen(true)}
          />
        )}

        {/* Central Canvas with React Flow auto-layout + ParticleCanvas overlay */}
        <MainCanvas
          onSelectNode={(nodeId) => selectElement('service', nodeId)}
          onSelectEdge={(edgeId) => selectElement('edge', edgeId)}
          selectedNodeId={null}
        />

        {!isPresenterMode && (
          <RightPanel
            findings={findings}
            rootCause={rootCause}
            onRunLinter={handleRunLinter}
            onApplyFix={handleApplyFix}
            isAnalyzing={isAnalyzing}
            designScore={lintReport.staticResilienceScore}
          />
        )}
      </div>

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
      />

      {/* Phase 10 Interactive Modals & Demo Director */}
      <BreakItModal
        isOpen={isBreakItOpen}
        onClose={() => setIsBreakItOpen(false)}
      />

      <DefendItModal
        isOpen={isDefendItOpen}
        onClose={() => setIsDefendItOpen(false)}
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
    </div>
  );
};
