import React, { useState, useEffect } from 'react';
import { TopNav } from './ui/TopNav';
import { LeftPanel } from './ui/LeftPanel';
import { MainCanvas } from './ui/MainCanvas';
import { RightPanel } from './ui/RightPanel';
import { BottomTimeline } from './ui/BottomTimeline';

export const App: React.FC = () => {
  // Simulation playback state
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [selectedTemplate, setSelectedTemplate] = useState('shopfast');
  const [selectedScenario, setSelectedScenario] = useState('baseline');
  const [resilienceScore, setResilienceScore] = useState<number>(38);
  const [isPresenterMode, setIsPresenterMode] = useState(false);

  // Selection & Linter state
  const [selectedElement, setSelectedElement] = useState<{
    type: 'service' | 'edge';
    id: string;
    name?: string;
  } | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
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
    origin: 'payment-provider',
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

  // Hotkeys: Space (Play/Pause), R (Reset), 1, 2, 3 (Speeds)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        setIsRunning((prev) => !prev);
      } else if (e.key === 'r' || e.key === 'R') {
        setCurrentTime(0);
        setIsRunning(false);
      } else if (e.key === '1') {
        setSpeed(1);
      } else if (e.key === '2') {
        setSpeed(4);
      } else if (e.key === '3') {
        setSpeed(16);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Simple tick loop when running
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= 180) {
          setIsRunning(false);
          return 180;
        }
        return prev + 1;
      });
    }, 1000 / speed);
    return () => clearInterval(interval);
  }, [isRunning, speed]);

  const handleSelectNode = (nodeId: string) => {
    setSelectedElement({
      type: 'service',
      id: nodeId,
      name: nodeId.toUpperCase(),
    });
  };

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

  return (
    <div className={`h-screen w-screen flex flex-col bg-background text-text-primary overflow-hidden font-sans ${isPresenterMode ? 'text-sm' : 'text-xs'}`}>
      {/* Top NOC Bar */}
      <TopNav
        isRunning={isRunning}
        onToggleRun={() => setIsRunning(!isRunning)}
        onStep={() => setCurrentTime((t) => Math.min(180, t + 1))}
        onReset={() => {
          setIsRunning(false);
          setCurrentTime(0);
        }}
        speed={speed}
        onChangeSpeed={setSpeed}
        selectedTemplate={selectedTemplate}
        onSelectTemplate={setSelectedTemplate}
        selectedScenario={selectedScenario}
        onSelectScenario={setSelectedScenario}
        resilienceScore={resilienceScore}
        onAutoHarden={() => {
          setResilienceScore(84);
          setFindings([]);
        }}
        onOpenBreakIt={() => alert('Break It! game will open')}
        onOpenPostmortem={() => alert('Postmortem will export')}
        onOpenRealityCheck={() => alert('Reality check comparison')}
        isPresenterMode={isPresenterMode}
        onTogglePresenterMode={() => setIsPresenterMode(!isPresenterMode)}
      />

      {/* Main Workspace: Left Panel + Center Canvas + Right Panel */}
      <div className="flex-1 flex overflow-hidden">
        {!isPresenterMode && (
          <LeftPanel
            selectedElement={selectedElement}
            onInjectFault={(f) => alert(`Fault injected: ${f}`)}
            onSetWorkload={(w) => alert(`Workload profile set: ${w}`)}
            onOpenBreakIt={() => alert('Break It! Game selected')}
            onOpenDefendIt={() => alert('Defend It! Game selected')}
          />
        )}

        {/* Central Canvas */}
        <MainCanvas
          onSelectNode={handleSelectNode}
          selectedNodeId={selectedElement?.id || null}
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
        maxTime={180}
        onSeek={setCurrentTime}
        successRate={currentTime > 60 && currentTime < 120 ? 32.4 : 99.2}
        p95LatencyMs={currentTime > 60 && currentTime < 120 ? 1850 : 410}
        externalRps={currentTime > 30 && currentTime < 90 ? 1800 : 600}
        internalRps={currentTime > 60 && currentTime < 120 ? 2820 : 600}
        activeInstances={currentTime > 70 && currentTime < 110 ? 32 : 36}
        crashedInstances={currentTime > 70 && currentTime < 110 ? 4 : 0}
      />
    </div>
  );
};
