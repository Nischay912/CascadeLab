import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Play,
  Pause,
  AlertOctagon,
} from 'lucide-react';
import { DEMO_DIRECTOR_STEPS } from './directorScript';
import { useArchitectureStore } from '../state/useArchitectureStore';
import { useSimulationStore } from '../state/useSimulationStore';

interface DemoDirectorOverlayProps {
  isActive: boolean;
  onClose: () => void;
  onSelectTab: (tab: any) => void;
}

export const DemoDirectorOverlay: React.FC<DemoDirectorOverlayProps> = ({
  isActive,
  onClose,
  onSelectTab,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(false);

  const resetSimulation = useSimulationStore((state) => state.resetSimulation);
  const loadTemplate = useArchitectureStore((state) => state.loadTemplate);

  const currentStep = DEMO_DIRECTOR_STEPS[currentStepIndex];

  // Auto-play timer
  useEffect(() => {
    if (!isActive || !isAutoPlay) return;

    const timer = setTimeout(() => {
      handleNext();
    }, 12000);

    return () => clearTimeout(timer);
  }, [isActive, isAutoPlay, currentStepIndex]);

  // Execute step action on step change
  useEffect(() => {
    if (!isActive) return;
    if (currentStep.tab) {
      onSelectTab(currentStep.tab);
    }
  }, [isActive, currentStepIndex, currentStep, onSelectTab]);

  if (!isActive) return null;

  const handleNext = () => {
    if (currentStepIndex < DEMO_DIRECTOR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setIsAutoPlay(false);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handlePanicReset = () => {
    loadTemplate('shopfast');
    resetSimulation();
    setCurrentStepIndex(0);
    setIsAutoPlay(false);
    onSelectTab('graph');
  };

  return (
    <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4 animate-in slide-in-from-bottom duration-300">
      <div className="bg-surface/95 border-2 border-accent/40 rounded-2xl shadow-2xl backdrop-blur-md p-4 text-text-primary">
        {/* Top bar of Director banner */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/60">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-accent/20 text-accent">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <span className="font-mono text-[10px] font-bold text-accent uppercase tracking-wider">
              {currentStep.badge}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Panic Reset button */}
            <button
              onClick={handlePanicReset}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 transition-all"
              title="Panic Reset: Clears all chaos and resets canvas to clean healthy state"
            >
              <AlertOctagon className="w-3 h-3" />
              <span>Panic Reset (Esc)</span>
            </button>

            {/* Auto Play toggle */}
            <button
              onClick={() => setIsAutoPlay(!isAutoPlay)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-all border ${
                isAutoPlay
                  ? 'bg-accent text-background border-accent'
                  : 'bg-surface-raised text-text-muted border-border hover:text-text-primary'
              }`}
            >
              {isAutoPlay ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
              <span>Auto-Play Tour</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 text-text-muted hover:text-text-primary transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Step Title & Narration */}
        <div className="mb-3">
          <h3 className="text-xs font-bold text-text-primary mb-1">
            {currentStep.title}
          </h3>
          <p className="text-[11px] text-text-muted leading-relaxed">
            {currentStep.narration}
          </p>
        </div>

        {/* Bottom controls: Prev / Next buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-1">
            {DEMO_DIRECTOR_STEPS.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentStepIndex(idx)}
                className={`w-2.5 h-1.5 rounded-full transition-all ${
                  currentStepIndex === idx ? 'bg-accent w-6' : 'bg-surface-raised hover:bg-text-dim'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-border ${
                currentStepIndex === 0
                  ? 'text-text-dim/40 cursor-not-allowed bg-surface'
                  : 'bg-surface hover:bg-surface-hover text-text-muted hover:text-text-primary'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              onClick={handleNext}
              disabled={currentStepIndex === DEMO_DIRECTOR_STEPS.length - 1}
              className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-bold shadow-noc ${
                currentStepIndex === DEMO_DIRECTOR_STEPS.length - 1
                  ? 'text-text-dim/40 cursor-not-allowed bg-surface border border-border'
                  : 'bg-accent hover:bg-accent-hover text-background'
              }`}
            >
              <span>Next Step</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
