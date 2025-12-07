import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, Knife, Particle, FloatingText } from '../types';
import { audioManager } from '../services/audio';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  level: number;
  setLevel: React.Dispatch<React.SetStateAction<number>>;
  score: number;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  apples: number;
  setApples: React.Dispatch<React.SetStateAction<number>>;
  selectedKnife: Knife;
  onGameOver: () => void;
}

// Math constants
const TWO_PI = Math.PI * 2;

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  setGameState,
  level,
  setLevel,
  score,
  setScore,
  apples,
  setApples,
  selectedKnife,
  onGameOver
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game Logic Refs (Mutable state for loop)
  const rotationRef = useRef(0);
  const rotationSpeedRef = useRef(0.03); // radians per frame
  const stuckKnivesRef = useRef<number[]>([]); // Angles in radians
  const stuckApplesRef = useRef<number[]>([]); // Angles in radians
  const targetApplesRef = useRef<number[]>([]); // Angles of apples on target
  
  const flyingKnifeRef = useRef<{ y: number; active: boolean }>({ y: 0, active: false });
  const particlesRef = useRef<Particle[]>([]);
  const textsRef = useRef<FloatingText[]>([]);
  
  const knivesLeftRef = useRef(10);
  const isBossRef = useRef(false);
  const targetRadiusRef = useRef(100);
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const shakeRef = useRef(0); // Screen shake intensity

  // Initialize Level
  const initLevel = useCallback((lvl: number) => {
    isBossRef.current = lvl % 5 === 0;
    knivesLeftRef.current = isBossRef.current ? 12 + Math.floor(lvl / 5) : 8 + Math.floor(lvl / 10);
    stuckKnivesRef.current = [];
    rotationRef.current = 0;
    rotationSpeedRef.current = 0.02 + (lvl * 0.002);
    targetRadiusRef.current = isBossRef.current ? 130 : 100;

    // Pre-place some knives for difficulty
    const prePlacedCount = isBossRef.current ? 0 : Math.min(Math.floor(lvl / 3), 5);
    const existingKnives: number[] = [];
    for(let i=0; i<prePlacedCount; i++) {
        existingKnives.push(Math.random() * TWO_PI);
    }
    stuckKnivesRef.current = existingKnives;

    // Place Apples (25% chance per level, always 1-3)
    targetApplesRef.current = [];
    if (Math.random() > 0.6) {
        const appleCount = Math.floor(Math.random() * 2) + 1;
        for(let i=0; i<appleCount; i++) {
           targetApplesRef.current.push(Math.random() * TWO_PI);
        }
    }
  }, []);

  // Handle Input
  const throwKnife = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;
    if (flyingKnifeRef.current.active) return; // Wait for current throw
    if (knivesLeftRef.current <= 0) return;

    audioManager.playThrow();
    flyingKnifeRef.current = {
      active: true,
      y: window.innerHeight - 150 // Starting position
    };
    knivesLeftRef.current -= 1;
  }, [gameState]);

  // Main Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false }); // optimize
    if (!ctx) return;

    // Initial Setup
    if (gameState === GameState.PLAYING && stuckKnivesRef.current.length === 0 && knivesLeftRef.current > 0) {
        // Only init if fresh start logic needed, actually handled by useEffect dependency on level
    }

    const render = (time: number) => {
      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;
      
      // Update Physics
      if (gameState === GameState.PLAYING) {
        // Variable rotation logic (sinusoidal speed changes for difficulty)
        const difficultyMod = 1 + (level * 0.05);
        const noise = Math.sin(time * 0.001) * Math.cos(time * 0.002);
        
        let currentSpeed = rotationSpeedRef.current;
        if (isBossRef.current) {
             // Boss moves erratically
             currentSpeed = Math.sin(time * 0.003) * 0.08 * difficultyMod;
             if (Math.random() < 0.01) rotationSpeedRef.current *= -1; // Random direction switch
        } else {
             currentSpeed = (0.02 + (noise * 0.01)) * difficultyMod;
        }

        rotationRef.current += currentSpeed;

        // Screen shake decay
        if (shakeRef.current > 0) shakeRef.current *= 0.9;
        if (shakeRef.current < 0.5) shakeRef.current = 0;

        // Flying Knife Logic
        if (flyingKnifeRef.current.active) {
            flyingKnifeRef.current.y -= 40; // Speed
            const hitY = (canvas.height / 2) + targetRadiusRef.current;
            
            if (flyingKnifeRef.current.y <= hitY) {
                // COLLISION CHECK
                // The knife hits at the bottom of the circle (PI/2 visual, but logic depends on rotation)
                // We normalize angles to 0 - TWO_PI
                const impactAngle = (Math.PI * 0.5 - rotationRef.current + TWO_PI) % TWO_PI;
                
                // 1. Check if hit another knife
                const hitKnife = stuckKnivesRef.current.some(angle => {
                    const diff = Math.abs(angle - impactAngle);
                    // Minimal distance in radians (approx 15 degrees)
                    return Math.min(diff, TWO_PI - diff) < 0.15;
                });

                if (hitKnife) {
                    // FAIL
                    shakeRef.current = 20;
                    audioManager.playFail();
                    // Bounce effect
                    flyingKnifeRef.current.y += 100;
                    flyingKnifeRef.current.active = false;
                    onGameOver();
                } else {
                    // SUCCESS HIT
                    shakeRef.current = 5;
                    audioManager.playHit();
                    stuckKnivesRef.current.push(impactAngle);
                    flyingKnifeRef.current.active = false;
                    setScore(s => s + 1);

                    // Check Apple Hit
                    const hitAppleIndex = targetApplesRef.current.findIndex(angle => {
                         const diff = Math.abs(angle - impactAngle);
                         return Math.min(diff, TWO_PI - diff) < 0.2;
                    });
                    
                    if (hitAppleIndex !== -1) {
                        // Collected apple
                        targetApplesRef.current.splice(hitAppleIndex, 1);
                        setApples(a => a + 2); // 2 apples per hit
                        // Spawn float text
                        textsRef.current.push({
                            x: canvas.width / 2,
                            y: canvas.height / 2 + targetRadiusRef.current,
                            text: "+2 Apples",
                            life: 60,
                            color: '#4fd1c5',
                            vy: -2
                        });
                        audioManager.playUnlock(); // Good sound
                    }

                    // Create hit particles
                    for(let i=0; i<8; i++) {
                        particlesRef.current.push({
                            x: canvas.width / 2,
                            y: canvas.height / 2 + targetRadiusRef.current,
                            vx: (Math.random() - 0.5) * 10,
                            vy: (Math.random() - 0.5) * 10,
                            life: 30 + Math.random() * 20,
                            color: '#d69e2e',
                            size: Math.random() * 5 + 2,
                            rotation: Math.random() * TWO_PI,
                            rotationSpeed: (Math.random() - 0.5) * 0.2
                        });
                    }

                    // Level Complete Check
                    if (knivesLeftRef.current === 0) {
                        setTimeout(() => {
                           audioManager.playWoodBreak();
                           // Explosion of wood
                           for(let i=0; i<30; i++) {
                                particlesRef.current.push({
                                    x: canvas.width / 2,
                                    y: canvas.height / 2,
                                    vx: (Math.random() - 0.5) * 20,
                                    vy: (Math.random() - 0.5) * 20,
                                    life: 60,
                                    color: isBossRef.current ? '#e53e3e' : '#d69e2e',
                                    size: Math.random() * 10 + 5,
                                    rotation: Math.random() * TWO_PI,
                                    rotationSpeed: (Math.random() - 0.5) * 0.5
                                });
                           }
                           setLevel(l => l + 1);
                           setScore(s => s + 10);
                        }, 200);
                    }
                }
            }
        }
      }

      // Drawing
      // Clear Screen
      ctx.fillStyle = '#1a202c'; // Dark BG
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Screen Shake Transform
      const shakeX = (Math.random() - 0.5) * shakeRef.current;
      const shakeY = (Math.random() - 0.5) * shakeRef.current;
      ctx.save();
      ctx.translate(shakeX, shakeY);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Draw Particles
      particlesRef.current.forEach((p, i) => {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
          ctx.restore();
          
          p.x += p.vx;
          p.y += p.vy;
          p.rotation += p.rotationSpeed;
          p.life--;
          p.vy += 0.5; // gravity
      });
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);

      // Draw Floating Text
      textsRef.current.forEach((t, i) => {
          ctx.font = "bold 24px 'Orbitron'";
          ctx.fillStyle = t.color;
          ctx.textAlign = 'center';
          ctx.fillText(t.text, t.x, t.y);
          t.y += t.vy;
          t.life--;
      });
      textsRef.current = textsRef.current.filter(t => t.life > 0);

      if (gameState === GameState.PLAYING) {
        // Draw Target
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rotationRef.current);
        
        // Wood/Boss Circle
        ctx.beginPath();
        ctx.arc(0, 0, targetRadiusRef.current, 0, TWO_PI);
        
        // Gradient
        const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, targetRadiusRef.current);
        if (isBossRef.current) {
             grad.addColorStop(0, '#742a2a');
             grad.addColorStop(1, '#9b2c2c');
             ctx.fillStyle = grad;
             ctx.shadowBlur = 20;
             ctx.shadowColor = '#f56565';
        } else {
             grad.addColorStop(0, '#744210');
             grad.addColorStop(1, '#975a16');
             ctx.fillStyle = grad;
             ctx.shadowBlur = 10;
             ctx.shadowColor = '#000';
        }
        ctx.fill();
        ctx.strokeStyle = isBossRef.current ? '#feb2b2' : '#f6ad55';
        ctx.lineWidth = 5;
        ctx.stroke();

        // Inner rings for wood detail
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 2;
        for(let r=10; r<targetRadiusRef.current; r+=15) {
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, TWO_PI);
            ctx.stroke();
        }

        // Draw Stuck Knives
        stuckKnivesRef.current.forEach(angle => {
            ctx.save();
            ctx.rotate(angle);
            ctx.translate(0, targetRadiusRef.current);
            // Draw Knife Handle sticking out
            drawKnife(ctx, selectedKnife, 0, 0, true);
            ctx.restore();
        });

        // Draw Stuck Apples
        targetApplesRef.current.forEach(angle => {
            ctx.save();
            ctx.rotate(angle);
            ctx.translate(0, targetRadiusRef.current);
            // Apple
            ctx.fillStyle = '#f56565';
            ctx.beginPath();
            ctx.arc(0, 15, 12, 0, TWO_PI);
            ctx.fill();
            // Leaf
            ctx.fillStyle = '#48bb78';
            ctx.beginPath();
            ctx.ellipse(5, 5, 5, 3, Math.PI/4, 0, TWO_PI);
            ctx.fill();
            ctx.restore();
        });

        ctx.restore(); // End Rotation

        // Draw Flying Knife
        if (flyingKnifeRef.current.active) {
            drawKnife(ctx, selectedKnife, cx, flyingKnifeRef.current.y, false);
        }

        // Draw Ready Knife (at bottom)
        if (!flyingKnifeRef.current.active && knivesLeftRef.current > 0) {
            drawKnife(ctx, selectedKnife, cx, window.innerHeight - 150, false);
        }

        // Draw Remaining Knives Indicator (Small icons on left)
        for(let i=0; i<knivesLeftRef.current; i++) {
            const opacity = i === 0 ? 1 : 0.5;
            ctx.globalAlpha = opacity;
            // Simple gray shape
            ctx.fillStyle = '#a0aec0';
            ctx.fillRect(20, canvas.height - 100 - (i * 30), 10, 25);
            ctx.globalAlpha = 1;
        }

      }
      
      ctx.restore(); // End Shake

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [gameState, level, selectedKnife, onGameOver]); // Effect deps

  // Level Change Logic
  useEffect(() => {
    if (gameState === GameState.PLAYING) {
        initLevel(level);
    }
  }, [level, gameState, initLevel]);

  // Window Resize
  useEffect(() => {
    const handleResize = () => {
        if (canvasRef.current) {
            canvasRef.current.width = window.innerWidth;
            canvasRef.current.height = window.innerHeight;
        }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
        if (e.code === 'Space') throwKnife();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [throwKnife]);

  return (
    <canvas 
        ref={canvasRef} 
        className="block w-full h-full cursor-pointer touch-none"
        onMouseDown={throwKnife}
        onTouchStart={(e) => { e.preventDefault(); throwKnife(); }}
    />
  );
};

// Helper: Draw Knife
function drawKnife(ctx: CanvasRenderingContext2D, knife: Knife, x: number, y: number, stuck: boolean) {
    ctx.save();
    ctx.translate(x, y);
    if (stuck) {
        // If stuck, we are drawing at radius. Knife points IN towards center (up relative to local context)
        // But context was rotated to angle.
        // Actually simplest: Draw it pointing UP.
    }
    
    // Scale for visual
    ctx.scale(1.5, 1.5);
    
    // Blade
    ctx.fillStyle = knife.color;
    ctx.beginPath();
    ctx.moveTo(-knife.bladeWidth/2, 0); // Bottom left
    ctx.lineTo(knife.bladeWidth/2, 0); // Bottom right
    ctx.lineTo(0, -knife.bladeLength); // Tip
    ctx.fill();

    // Center ridge
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(-1, -knife.bladeLength, 2, knife.bladeLength);
    
    // Handle
    ctx.fillStyle = '#4a5568';
    ctx.fillRect(-4, 0, 8, 20);
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(-4, 5, 8, 3);
    ctx.fillRect(-4, 12, 8, 3);

    ctx.restore();
}
