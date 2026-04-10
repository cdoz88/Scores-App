import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';

interface GridironGameProps {
  onBack: () => void;
}

export const GridironGame = ({ onBack }: GridironGameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);

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
      radius: 30,
      isKicking: false,
      progress: 0,
      baseY: height - 150,
      startX: width / 2
    };

    const goal = {
      x: width / 2 - 75,
      y: height * 0.2,
      width: 150,
      height: 100,
      speed: 2,
      direction: 1
    };

    let wind = (Math.random() * 2 - 1) * 2;
    let animationId: number;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw Field Lines
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 10; i++) {
        const y = height - (i * height / 10);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw Goal
      ctx.strokeStyle = '#9df01c';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(goal.x, goal.y);
      ctx.lineTo(goal.x, goal.y + goal.height);
      ctx.moveTo(goal.x + goal.width, goal.y);
      ctx.lineTo(goal.x + goal.width, goal.y + goal.height);
      ctx.moveTo(goal.x, goal.y + goal.height * 0.7);
      ctx.lineTo(goal.x + goal.width, goal.y + goal.height * 0.7);
      ctx.stroke();

      // Draw Ball
      ctx.beginPath();
      ctx.ellipse(ball.x, ball.y, ball.radius, ball.radius * 1.5, Math.PI / 4, 0, Math.PI * 2);
      ctx.fillStyle = '#afed50';
      ctx.fill();
      ctx.closePath();

      // Update Goal
      goal.x += goal.speed * goal.direction;
      if (goal.x + goal.width > width || goal.x < 0) {
        goal.direction *= -1;
      }

      // Update Ball
      if (ball.isKicking) {
        ball.progress += 0.025;
        if (ball.progress <= 1) {
          const t = ball.progress;
          const peakY = goal.y - 50;
          ball.y = (1 - t) * (1 - t) * ball.baseY + 2 * (1 - t) * t * peakY + t * t * (goal.y + 50);
          ball.x = ball.startX + (wind * t * 100);
          ball.radius = 30 * (1 - t * 0.6);
        } else {
          // Check Score
          if (ball.x > goal.x && ball.x < goal.x + goal.width) {
            setScore(s => s + 3);
          } else {
            setScore(0);
          }
          ball.isKicking = false;
          ball.progress = 0;
          ball.y = ball.baseY;
          ball.x = ball.startX;
          ball.radius = 30;
          wind = (Math.random() * 2 - 1) * 2;
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    const handleInput = () => {
      if (!ball.isKicking) {
        ball.isKicking = true;
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
    <div className="fixed inset-0 bg-[#0a1a0a] z-50 flex flex-col">
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
          Tap to Kick
        </p>
      </div>
    </div>
  );
};
