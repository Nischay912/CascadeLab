import React, { useEffect, useRef } from 'react';
import { useViewport, Node, Edge } from '@xyflow/react';
import { SimulationTickMetrics } from '../sim/engine';

interface Particle {
  id: number;
  edgeId: string;
  progress: number; // 0 to 1
  speed: number;
  type: 'normal' | 'retry' | 'error';
  size: number;
}

interface ParticleCanvasProps {
  nodes: Node[];
  edges: Edge[];
  currentMetrics: SimulationTickMetrics | null;
  originNodeId: string | null;
  effectsEnabled?: boolean;
}

// Cubic bezier point evaluation
function getBezierPoint(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  t: number
): { x: number; y: number } {
  const oneMinusT = 1 - t;
  const oneMinusTSq = oneMinusT * oneMinusT;
  const tSq = t * t;

  return {
    x:
      oneMinusT * oneMinusTSq * p0.x +
      3 * oneMinusTSq * t * p1.x +
      3 * oneMinusT * tSq * p2.x +
      t * tSq * p3.x,
    y:
      oneMinusT * oneMinusTSq * p0.y +
      3 * oneMinusTSq * t * p1.y +
      3 * oneMinusT * tSq * p2.y +
      t * tSq * p3.y,
  };
}

export const ParticleCanvas: React.FC<ParticleCanvasProps> = ({
  nodes,
  edges,
  currentMetrics,
  originNodeId,
  effectsEnabled = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { x, y, zoom } = useViewport();
  const particlesRef = useRef<Map<string, Particle[]>>(new Map());
  const nextParticleId = useRef(0);
  const lastTimeRef = useRef<number>(performance.now());
  const waveRadiusRef = useRef<number>(0);

  // Check user prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let displayWidth = canvas.clientWidth;
    let displayHeight = canvas.clientHeight;
    const dpr = window.devicePixelRatio || 1;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        displayWidth = Math.floor(entry.contentRect.width * dpr);
        displayHeight = Math.floor(entry.contentRect.height * dpr);
        canvas.width = displayWidth;
        canvas.height = displayHeight;
      }
    });
    resizeObserver.observe(canvas);

    let animationFrameId: number;

    const render = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = currentTime;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!effectsEnabled || prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.save();
      // Apply device pixel ratio and React Flow viewport zoom & translation
      ctx.scale(dpr, dpr);
      ctx.translate(x, y);
      ctx.scale(zoom, zoom);

      // Map nodes by ID for fast position lookup
      const nodeMap = new Map<string, Node>();
      nodes.forEach((n) => nodeMap.set(n.id, n));

      const NODE_WIDTH = 260;
      const NODE_HEIGHT = 185;

      // 1. Draw Expanding Failure Wave from Origin Node(s) (ONLY when a fault is actively firing)
      const hasActiveFaults = Boolean(
        currentMetrics?.activeFaults && currentMetrics.activeFaults.length > 0
      );

      const activeOriginTargets: string[] = [];
      if (hasActiveFaults && currentMetrics?.activeFaultTargets) {
        for (const target of currentMetrics.activeFaultTargets) {
          if (target && target !== 'all' && !activeOriginTargets.includes(target)) {
            activeOriginTargets.push(target);
          }
        }
      }
      if (activeOriginTargets.length === 0 && originNodeId && hasActiveFaults && originNodeId !== 'all') {
        activeOriginTargets.push(originNodeId);
      }

      if (activeOriginTargets.length > 0) {
        waveRadiusRef.current = (waveRadiusRef.current + dt * 90) % 280;

        activeOriginTargets.forEach((targetId) => {
          const originNode = nodeMap.get(targetId);
          if (originNode) {
            const originX = originNode.position.x + (originNode.measured?.width || NODE_WIDTH) / 2;
            const originY = originNode.position.y + (originNode.measured?.height || NODE_HEIGHT) / 2;

            // Render 3 expanding concentric rings
            for (let i = 0; i < 3; i++) {
              const ringR = (waveRadiusRef.current + i * 90) % 280;
              const ringAlpha = Math.max(0, 1 - ringR / 280) * 0.65;

              ctx.beginPath();
              ctx.arc(originX, originY, ringR, 0, Math.PI * 2);
              ctx.strokeStyle = `rgba(248, 113, 113, ${ringAlpha})`;
              ctx.lineWidth = 2.0 / zoom;
              ctx.stroke();
            }

            // Central beacon dot at origin
            ctx.beginPath();
            ctx.arc(originX, originY, 12, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(248, 113, 113, 0.4)';
            ctx.fill();
          }
        });
      }

      // 2. Animate and Batch Draw Flowing Particles on Edges
      const normalPts: Array<{ x: number; y: number; size: number }> = [];
      const retryPts: Array<{ x: number; y: number; size: number }> = [];
      const errorPts: Array<{ x: number; y: number; size: number }> = [];

      edges.forEach((edge) => {
        const sourceNode = nodeMap.get(edge.source);
        const targetNode = nodeMap.get(edge.target);
        if (!sourceNode || !targetNode) return;

        const sWidth = sourceNode.measured?.width || NODE_WIDTH;
        const sHeight = sourceNode.measured?.height || NODE_HEIGHT;
        const tHeight = targetNode.measured?.height || NODE_HEIGHT;

        const p0 = {
          x: sourceNode.position.x + sWidth,
          y: sourceNode.position.y + sHeight / 2,
        };
        const p3 = {
          x: targetNode.position.x,
          y: targetNode.position.y + tHeight / 2,
        };

        const dx = Math.max(40, (p3.x - p0.x) * 0.5);
        const p1 = { x: p0.x + dx, y: p0.y };
        const p2 = { x: p3.x - dx, y: p3.y };

        // Metrics for this edge
        const edgeMetrics =
          currentMetrics?.edges[edge.id] ||
          currentMetrics?.edges[`${edge.source}->${edge.target}`];

        const rps = edgeMetrics ? edgeMetrics.effectiveRps : 0;
        const retryAttempts = edgeMetrics ? edgeMetrics.retryAttempts : 1;
        const failureFrac = edgeMetrics ? edgeMetrics.attemptFailureFraction : 0;
        const isBreakerOpen = edgeMetrics?.circuitBreakerState === 'open';

        // Circuit breaker open stops traffic flow completely
        if (isBreakerOpen) {
          particlesRef.current.delete(edge.id);
          return;
        }

        // Particle volume proportional to RPS (capped between 2 and 12 per edge)
        const targetCount = rps > 0 ? Math.min(12, Math.max(2, Math.round(Math.log2(rps + 1) * 1.5))) : 0;

        let edgeParticles = particlesRef.current.get(edge.id);
        if (!edgeParticles) {
          edgeParticles = [];
          particlesRef.current.set(edge.id, edgeParticles);
        }

        const retryFraction = Math.min(1, Math.max(0, (retryAttempts - 1) / retryAttempts));

        // Add particles if below target
        while (edgeParticles.length < targetCount) {
          const rand = Math.random();
          let pType: 'normal' | 'retry' | 'error' = 'normal';
          if (rand < failureFrac) {
            pType = 'error';
          } else if (rand < failureFrac + retryFraction) {
            pType = 'retry';
          }

          edgeParticles.push({
            id: nextParticleId.current++,
            edgeId: edge.id,
            progress: Math.random(),
            speed: 0.35 + Math.random() * 0.25,
            type: pType,
            size: pType === 'retry' ? 3.2 : 2.5,
          });
        }

        // Trim particles if target count reduced
        if (edgeParticles.length > targetCount) {
          edgeParticles.splice(targetCount);
        }

        // Update particle positions
        for (let i = 0; i < edgeParticles.length; i++) {
          const particle = edgeParticles[i];
          const effectiveSpeed = particle.speed * (1 + Math.min(1.5, rps / 600));
          particle.progress += effectiveSpeed * dt;

          if (particle.progress >= 1) {
            particle.progress = 0;
            const rand = Math.random();
            if (rand < failureFrac) {
              particle.type = 'error';
            } else if (rand < failureFrac + retryFraction) {
              particle.type = 'retry';
            } else {
              particle.type = 'normal';
            }
          }

          const pt = getBezierPoint(p0, p1, p2, p3, particle.progress);
          if (particle.type === 'error') {
            errorPts.push({ x: pt.x, y: pt.y, size: particle.size });
          } else if (particle.type === 'retry') {
            retryPts.push({ x: pt.x, y: pt.y, size: particle.size });
          } else {
            normalPts.push({ x: pt.x, y: pt.y, size: particle.size });
          }
        }
      });

      // Batched draw: normal particles (cyan)
      if (normalPts.length > 0) {
        ctx.beginPath();
        normalPts.forEach((p) => {
          ctx.moveTo(p.x + p.size, p.y);
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        });
        ctx.fillStyle = '#22D3EE';
        ctx.fill();
      }

      // Batched draw: retry storm particles (orange)
      if (retryPts.length > 0) {
        ctx.beginPath();
        retryPts.forEach((p) => {
          ctx.moveTo(p.x + p.size, p.y);
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        });
        ctx.fillStyle = '#FB923C';
        ctx.fill();
      }

      // Batched draw: error particles (red)
      if (errorPts.length > 0) {
        ctx.beginPath();
        errorPts.forEach((p) => {
          ctx.moveTo(p.x + p.size, p.y);
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        });
        ctx.fillStyle = '#EF4444';
        ctx.fill();
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, [nodes, edges, currentMetrics, originNodeId, effectsEnabled, prefersReducedMotion, x, y, zoom]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-[5]"
      style={{ display: effectsEnabled ? 'block' : 'none' }}
    />
  );
};
