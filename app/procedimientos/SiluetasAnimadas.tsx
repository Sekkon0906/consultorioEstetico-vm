"use client";

import { useEffect, useRef } from "react";

export default function SiluetasAnimadas({ tipo }: { tipo?: string | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let anim: number;
    let startTime = 0;

    const resize = () => {
      const p = canvas.parentElement;
      if (!p) return;
      canvas.width = p.offsetWidth;
      canvas.height = p.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const getPaths = (w: number, h: number) => {
      const cx = w * 0.5;
      const cy = h * 0.5;
      const sc = Math.min(w, h) * 0.003;
      const gap = 15 * sc; // gap between J and M
      const s = (x: number, y: number) => ({ x: cx + x * sc, y: cy + y * sc });

      // J - positioned to the left
      // Serif top, vertical stroke, bottom curl
      const jPath = [
        s(-55 - gap, -110), // top serif left
        s(-5 - gap, -110),  // top serif right
        s(-5 - gap, -110),  // back to center
        s(-30 - gap, -110), // center top
        s(-30 - gap, 55),   // down the vertical
        s(-30 - gap, 85),   // start curl
        s(-30 - gap, 110),  // curve
        s(-55 - gap, 120),  // curl bottom
        s(-72 - gap, 105),  // curl end
      ];

      // M - positioned to the right, close but separate
      const mPath = [
        s(-15 + gap, 110),  // bottom left
        s(-15 + gap, -110), // up left leg
        s(-5 + gap, -110),  // small serif
        s(-5 + gap, -110),  // start first diagonal
        s(40 + gap, 40),    // valley
        s(85 + gap, -110),  // second peak
        s(95 + gap, -110),  // small serif
        s(95 + gap, -110),  // start right leg
        s(95 + gap, 110),   // bottom right
      ];

      return { jPath, mPath };
    };

    const drawPath = (
      points: { x: number; y: number }[],
      progress: number,
      color: string,
      lineW: number
    ): { x: number; y: number } | null => {
      if (points.length < 2 || progress <= 0) return null;

      let totalLen = 0;
      const segLens: number[] = [];
      for (let i = 0; i < points.length - 1; i++) {
        const dx = points[i + 1].x - points[i].x;
        const dy = points[i + 1].y - points[i].y;
        segLens.push(Math.sqrt(dx * dx + dy * dy));
        totalLen += segLens[i];
      }

      const targetLen = progress * totalLen;
      let drawn = 0;
      let tipX = points[0].x, tipY = points[0].y;

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineW;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(points[0].x, points[0].y);

      for (let i = 0; i < segLens.length; i++) {
        if (drawn + segLens[i] <= targetLen) {
          ctx.lineTo(points[i + 1].x, points[i + 1].y);
          drawn += segLens[i];
          tipX = points[i + 1].x;
          tipY = points[i + 1].y;
        } else {
          const t = (targetLen - drawn) / segLens[i];
          tipX = points[i].x + (points[i + 1].x - points[i].x) * t;
          tipY = points[i].y + (points[i + 1].y - points[i].y) * t;
          ctx.lineTo(tipX, tipY);
          break;
        }
      }
      ctx.stroke();
      return { x: tipX, y: tipY };
    };

    const draw = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Subtle background glow
      const ga = 0.03 + Math.sin(elapsed * 0.4) * 0.012;
      const grad = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, Math.min(w, h) * 0.45);
      grad.addColorStop(0, `rgba(176,137,104,${ga})`);
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      const { jPath, mPath } = getPaths(w, h);

      // 10s cycle: 3s write, 4.5s hold, 2.5s fade
      const cycle = 10;
      const t = elapsed % cycle;

      let jProg = 0, mProg = 0, alpha = 0.09;

      if (t < 3) {
        const p = t / 3;
        const e = 1 - Math.pow(1 - p, 3);
        jProg = Math.min(1, e * 1.4);        // J finishes first
        mProg = Math.max(0, (e - 0.15) * 1.3); // M starts after J is ~15% done
        alpha = 0.09;
      } else if (t < 7.5) {
        jProg = 1;
        mProg = 1;
        alpha = 0.09 + Math.sin((t - 3) * 1.2) * 0.015;
      } else {
        const fp = (t - 7.5) / 2.5;
        jProg = 1;
        mProg = 1;
        alpha = 0.09 * (1 - fp * fp);
      }

      if (alpha < 0.002) { anim = requestAnimationFrame(draw); return; }

      ctx.globalAlpha = alpha;
      ctx.shadowColor = "rgba(139,106,75,0.1)";
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 2;

      const lw = Math.max(4, Math.min(w, h) * 0.016);

      const jTip = drawPath(jPath, jProg, "#3A2A1A", lw);
      const mTip = drawPath(mPath, mProg, "#3A2A1A", lw);

      // Pen glow while writing
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      if (t < 3) {
        const drawGlow = (tip: { x: number; y: number } | null) => {
          if (!tip) return;
          ctx.globalAlpha = alpha * 3.5;
          const tg = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, lw * 3.5);
          tg.addColorStop(0, "rgba(176,137,104,0.45)");
          tg.addColorStop(1, "transparent");
          ctx.fillStyle = tg;
          ctx.beginPath();
          ctx.arc(tip.x, tip.y, lw * 3.5, 0, Math.PI * 2);
          ctx.fill();
        };
        if (jProg > 0 && jProg < 1) drawGlow(jTip);
        if (mProg > 0 && mProg < 1) drawGlow(mTip);
      }

      // Orbiting particles
      ctx.globalAlpha = alpha * 0.6;
      for (let i = 0; i < 10; i++) {
        const angle = elapsed * 0.12 + (i / 10) * Math.PI * 2;
        const r = Math.min(w, h) * 0.32 + Math.sin(elapsed * 0.25 + i * 1.8) * 25;
        const px = w * 0.5 + Math.cos(angle) * r;
        const py = h * 0.5 + Math.sin(angle) * r;
        const sz = 1.2 + Math.sin(elapsed * 0.8 + i) * 0.8;
        ctx.beginPath();
        ctx.arc(px, py, sz, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? "rgba(176,137,104,0.7)" : "rgba(201,173,141,0.6)";
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      anim = requestAnimationFrame(draw);
    };

    anim = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(anim); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />;
}