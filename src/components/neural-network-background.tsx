'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  connections: number[];
  activation: number;
  targetActivation: number;
}

interface MousePosition {
  x: number;
  y: number;
}

export function NeuralNetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const nodesRef = useRef<Node[]>([]);
  const [mousePos, setMousePos] = useState<MousePosition>({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (typeof window !== 'undefined') {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }
    };

    updateDimensions();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateDimensions);
      return () => window.removeEventListener('resize', updateDimensions);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize nodes
    const nodeCount = 80;
    const nodes: Node[] = [];

    for (let i = 0; i < nodeCount; i++) {
      const node: Node = {
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        connections: [],
        activation: Math.random(),
        targetActivation: Math.random(),
      };

      // Create connections to nearby nodes
      for (let j = 0; j < nodes.length; j++) {
        const distance = Math.sqrt(
          Math.pow(node.x - nodes[j].x, 2) + Math.pow(node.y - nodes[j].y, 2)
        );
        if (distance < 150 && Math.random() > 0.7) {
          node.connections.push(j);
          nodes[j].connections.push(i);
        }
      }

      nodes.push(node);
    }

    nodesRef.current = nodes;

    const animate = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Update nodes
      nodes.forEach((node, index) => {
        // Mouse interaction
        const mouseDistance = Math.sqrt(
          Math.pow(node.x - mousePos.x, 2) + Math.pow(node.y - mousePos.y, 2)
        );
        
        if (mouseDistance < 200) {
          const force = (200 - mouseDistance) / 200;
          node.targetActivation = Math.min(1, force * 2);
          
          // Ripple effect to connected nodes
          node.connections.forEach(connectedIndex => {
            if (connectedIndex < nodes.length) {
              nodes[connectedIndex].targetActivation = Math.min(1, force * 1.5);
            }
          });
        } else {
          node.targetActivation = 0.1 + Math.sin(Date.now() * 0.001 + index * 0.1) * 0.1;
        }

        // Smooth activation transition
        node.activation += (node.targetActivation - node.activation) * 0.05;

        // Gentle movement
        node.x += node.vx;
        node.y += node.vy;

        // Boundary bouncing
        if (node.x < 0 || node.x > dimensions.width) node.vx *= -1;
        if (node.y < 0 || node.y > dimensions.height) node.vy *= -1;

        // Keep nodes in bounds
        node.x = Math.max(0, Math.min(dimensions.width, node.x));
        node.y = Math.max(0, Math.min(dimensions.height, node.y));
      });

      // Draw connections
      nodes.forEach((node, index) => {
        node.connections.forEach(connectedIndex => {
          if (connectedIndex > index && connectedIndex < nodes.length) {
            const connectedNode = nodes[connectedIndex];
            const avgActivation = (node.activation + connectedNode.activation) / 2;
            
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(connectedNode.x, connectedNode.y);
            ctx.strokeStyle = `rgba(59, 130, 246, ${avgActivation * 0.6})`;
            ctx.lineWidth = avgActivation * 2;
            ctx.stroke();
          }
        });
      });

      // Draw nodes
      nodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 2 + node.activation * 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59, 130, 246, ${0.4 + node.activation * 0.6})`;
        ctx.fill();
        
        // Glow effect
        if (node.activation > 0.5) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, 8 + node.activation * 8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(59, 130, 246, ${(node.activation - 0.5) * 0.2})`;
          ctx.fill();
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dimensions, mousePos]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={dimensions.width}
      height={dimensions.height}
      onMouseMove={handleMouseMove}
      className="fixed inset-0 z-0"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        pointerEvents: 'auto',
      }}
    />
  );
}
