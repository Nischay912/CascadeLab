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

  // Global hotkeys: Space (Play/Pause), R (Reset), 1, 2, 3 (Speed), P (Presenter Mode)
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
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleRunning, resetSimulation, setSpeed]);

  // Dynamic Root Cause & Pattern Analysis Engine
  const rootCause = useMemo(() => {
    return analyzeSimulationIncident(currentSpec, history);
  }, [currentSpec, history]);

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
        resilienceScore={resilienceScore}
        onAutoHarden={handleAutoHarden}
        onOpenBreakIt={() => alert('Break It! game will open')}
        onOpenPostmortem={() => alert('Postmortem generator will open')}
        onOpenRealityCheck={() => alert('Reality check comparison')}
        isPresenterMode={isPresenterMode}
        onTogglePresenterMode={() => setIsPresenterMode(!isPresenterMode)}
        userSuccessRate={currentMetrics?.userSuccessRate}
        userP95Ms={currentMetrics?.userP95Ms}
        cumulativeMoneyLostInr={currentMetrics?.cumulativeMoneyLostInr}
      />

      {/* Main Workspace: Left Panel + Center Canvas + Right Panel */}
      <div className="flex-1 flex overflow-hidden">
        {!isPresenterMode && (
          <LeftPanel
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
            onOpenBreakIt={() => alert('Break It! Game selected')}
            onOpenDefendIt={() => alert('Defend It! Game selected')}
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
    </div>
  );
};
