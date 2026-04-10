import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';

interface HoopsGameProps {
  onBack: () => void;
}

export const HoopsGame = ({ onBack }: HoopsGameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'ended'>('playing');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const ball = {
      x: width / 2,
      y: height - 150,
      radius: 40,
      isShooting: false,
      progress: 0,
      baseY: height - 150
    };

    const hoop = {
      x: width / 2 - 50,
      y: height * 0.2,
      width: 100,
      height: 100,
      direction: 1,
      speed: 3
    };

    let animationId: number;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw Hoop
      ctx.strokeStyle = '#9df01c';
      ctx.lineWidth = 5;
      ctx.strokeRect(hoop.x, hoop.y, hoop.width, hoop.height);

      // Draw Ball
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#afed50';
      ctx.fill();
      ctx.closePath();

      // Update Hoop
      hoop.x += hoop.speed * hoop.direction;
      if (hoop.x + hoop.width > width || hoop.x < 0) {
        hoop.direction *= -1;
      }

      // Update Ball
      if (ball.isShooting) {
        ball.progress += 0.02;
        if (ball.progress <= 1) {
          const t = ball.progress;
          const peakY = hoop.y - 100;
          ball.y = (1 - t) * (1 - t) * ball.baseY + 2 * (1 - t) * t * peakY + t * t * (hoop.y + 50);
          ball.radius = 40 * (1 - t * 0.5);
        } else {
          // Check Score
          const hoopCenterX = hoop.x + hoop.width / 2;
          if (Math.abs(ball.x - hoopCenterX) < hoop.width / 2) {
            setScore(s => s + 1);
          }
          ball.isShooting = false;
          ball.progress = 0;
          ball.y = ball.baseY;
          ball.radius = 40;
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    const handleInput = () => {
      if (!ball.isShooting) {
        ball.isShooting = true;
      }
    };

    canvas.addEventListener('mousedown', handleInput);
    canvas.addEventListener('touchstart', handleInput);

    return () => {
      cancelAnimationFrame(animationId);
      canvas.removeEventListener('mousedown', handleInput);
      canvas.removeEventListener('touchstart', handleInput);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
        <button
          onClick={onBack}
          className="w-12 h-12 bg-gray-900/50 backdrop-blur-xl rounded-full flex items-center justify-center border border-gray-800 text-white"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="bg-gray-900/50 backdrop-blur-xl px-6 py-2 rounded-full border border-gray-800">
          <span className="text-2xl font-black text-[#9df01c] tracking-tighter">
            SCORE: {score}
          </span>
        </div>
        <button
          onClick={() => setScore(0)}
          className="w-12 h-12 bg-gray-900/50 backdrop-blur-xl rounded-full flex items-center justify-center border border-gray-800 text-white"
        >
          <RotateCcw size={20} />
        </button>
      </div>

      <canvas ref={canvasRef} className="flex-1 touch-none" />

      <div className="absolute bottom-10 left-0 right-0 text-center pointer-events-none">
        <p className="text-white/30 font-black uppercase tracking-[0.2em] text-sm">
          Tap to Shoot
        </p>
      </div>
    </div>
  );
};
