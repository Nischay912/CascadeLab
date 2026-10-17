import React, { useState, useEffect, useCallback } from 'react';
import { TopNav } from './ui/TopNav';
import { LeftPanel } from './ui/LeftPanel';
import { MainCanvas } from './ui/MainCanvas';
import { RightPanel } from './ui/RightPanel';
import { BottomTimeline } from './ui/BottomTimeline';
import { useArchitectureStore } from './state/useArchitectureStore';
import { useSimulationStore, ScenarioType } from './state/useSimulationStore';

export const App: React.FC = () => {
  const {
    currentSpec,
    activeTemplateKey,
    loadTemplate,
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
    originNodeId,
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

  const [resilienceScore, setResilienceScore] = useState<number>(38);
  const [isPresenterMode, setIsPresenterMode] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Initialize simulation batch when component mounts or spec changes
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

  // Linter & Root Cause state
  const [findings, setFindings] = useState<any[]>([
    {
      id: 'f1',
      ruleId: 'L1',
      severity: 'critical',
      title: 'Retry Storm Trap',
      target: 'checkout → payments',
      reason: '3 retries configured with no backoff and no jitter on critical order path.',
      fix: 'Add exponential backoff with jitter (mode: exponential, jitter: true)',
    },
    {
      id: 'f2',
      ruleId: 'L8',
      severity: 'critical',
      title: 'Single Point of Failure (SPOF)',
      target: 'orders-db',
      reason: 'Single instance database on order write critical path with no read replica.',
      fix: 'Increase instances from 1 to 2 with multi-zone spread',
    },
    {
      id: 'f3',
      ruleId: 'L7',
      severity: 'warning',
      title: 'Missing Circuit Breaker',
      target: 'payments → provider',
      reason: 'Synchronous external dependency has no circuit breaker to trip on provider brownout.',
      fix: 'Enable circuit breaker with 50% error threshold over 10s',
    },
    {
      id: 'f4',
      ruleId: 'L10',
      severity: 'warning',
      title: 'Missing Load Shedding',
      target: 'gateway',
      reason: 'API Gateway queue will overflow without early 503 shedding during spikes.',
      fix: 'Enable load shedding at 80% queue saturation',
    },
  ]);

  const [rootCause] = useState<any>({
    origin: originNodeId || 'payment-provider',
    pattern: 'retry_storm_cascade',
    confidence: 0.94,
    blastRadiusPct: 62,
    isMetastable: true,
    evidence: [
      'Origin node payment-provider latency surged 5x at t=60s.',
      'Amplification factor escalated from 1.0x to 4.7x via retries.',
      'Gateway queue reached 100% capacity; worker exhaustion cascaded upstream.',
      'System remained at 30% success 60s after trigger ended (Metastable).',
    ],
  });

  const handleRunLinter = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 600);
  };

  const handleApplyFix = (findingId: string) => {
    setFindings((prev) => prev.filter((f) => f.id !== findingId));
    setResilienceScore((prev) => Math.min(100, prev + 12));
  };

  const handleAutoHarden = () => {
    loadTemplate('shopfast_hardened');
    setResilienceScore(84);
    setFindings([]);
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
