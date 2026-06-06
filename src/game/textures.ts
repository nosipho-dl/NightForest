/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Phaser from 'phaser';

// Procedural texture builder to generate gorgeous high-contrast arcade shapes
export function generateGameTextures(game: Phaser.Game) {
  const tm = game.textures;

  // Helper to create a canvas of specified dimensions
  const createCtx = (width: number, height: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    return { canvas, ctx };
  };

  // 1. GOLD PARTICLE (Radiant gold light)
  if (!tm.exists('part-gold')) {
    const { canvas, ctx } = createCtx(16, 16);
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(255, 230, 100, 1)');
    grad.addColorStop(0.3, 'rgba(250, 170, 20, 0.8)');
    grad.addColorStop(1, 'rgba(250, 170, 20, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(8, 8, 8, 0, Math.PI * 2);
    ctx.fill();
    tm.addCanvas('part-gold', canvas);
  }

  // 2. VIOLET / SHADOW PARTICLE
  if (!tm.exists('part-violet')) {
    const { canvas, ctx } = createCtx(16, 16);
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(190, 100, 255, 1)');
    grad.addColorStop(0.4, 'rgba(100, 20, 200, 0.7)');
    grad.addColorStop(1, 'rgba(50, 0, 100, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(8, 8, 8, 0, Math.PI * 2);
    ctx.fill();
    tm.addCanvas('part-violet', canvas);
  }

  // 3. BLOOD / AMBER PARTICLE
  if (!tm.exists('part-blood')) {
    const { canvas, ctx } = createCtx(16, 16);
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(255, 50, 50, 1)');
    grad.addColorStop(0.4, 'rgba(150, 10, 10, 0.7)');
    grad.addColorStop(1, 'rgba(50, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(8, 8, 8, 0, Math.PI * 2);
    ctx.fill();
    tm.addCanvas('part-blood', canvas);
  }

  // Helper to draw a specific stickman frame on a canvas context
  const drawStickmanFrame = (ctx: CanvasRenderingContext2D, cx: number, frameIndex: number, isLight: boolean) => {
    // cx is the horizontal center of the 64x64 frame
    // Frame Index from 0 to 7
    
    ctx.save();
    
    // 1. Draw heavy drop shadow beneath player
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(cx, 48, 20, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Setup base colors and glow
    const primaryColor = isLight ? '#dcf0ff' : '#00d2ff'; // core neon light
    const glowColor = isLight ? '#0099ff' : 'rgba(0, 198, 255, 0.45)';
    const headColor = isLight ? '#00f0ff' : '#00c6ff';
    const spearColor = '#e2b13c'; // Gold

    // Base body lines configuration
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = isLight ? 5.5 : 4.8;
    ctx.lineCap = 'round';
    
    if (isLight) {
      // Golden outer halo (Ancestral guide glow blessing) on background of frame
      const haloGrad = ctx.createRadialGradient(cx, 32, 5, cx, 32, 28);
      haloGrad.addColorStop(0, 'rgba(255, 215, 0, 0.35)');
      haloGrad.addColorStop(1, 'rgba(255, 215, 0, 0)');
      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(cx, 32, 28, 0, Math.PI*2);
      ctx.fill();
    }

    // Positions based on frameIndex (0..7)
    let hx = cx;       // head X
    let hy = 16;       // head Y
    let nx = cx;       // neck X
    let ny = 22;       // neck Y
    let bx = cx;       // hip X
    let by = 42;       // hip Y
    
    let lHandX = cx - 12; // Left hand X
    let lHandY = 32;      // Left hand Y
    let rHandX = cx + 12; // Right hand X
    let rHandY = 32;      // Right hand Y
    
    let lKneeX = cx - 6;
    let lKneeY = 50;
    let lFootX = cx - 11;
    let lFootY = 58;
    
    let rKneeX = cx + 6;
    let rKneeY = 50;
    let rFootX = cx + 11;
    let rFootY = 58;

    let drawingSpear = true;
    let spearStartX = cx + 12;
    let spearStartY = 48;
    let spearEndX = cx + 12;
    let spearEndY = 12;
    let spearTipDirX = 0;
    let spearTipDirY = -1; // pointing up

    // 0: Idle Standing, 1: Idle Breathing, 2-5: Running, 6: Attack Windup, 7: Attack Thrust
    if (frameIndex === 0) {
      // Idle standard
      lHandX = cx - 10; lHandY = 34;
      rHandX = cx + 12; rHandY = 32;
      lFootX = cx - 10; rFootX = cx + 10;
      spearStartX = rHandX; spearStartY = 48;
      spearEndX = rHandX; spearEndY = 12;
    } else if (frameIndex === 1) {
      // Idle Breathing bob
      hy += 1.8;
      ny += 1.5;
      lHandX = cx - 11; lHandY = 34.5;
      rHandX = cx + 12; rHandY = 33.5;
      lFootX = cx - 11; rFootX = cx + 11;
      spearStartX = rHandX; spearStartY = 49;
      spearEndX = rHandX; spearEndY = 13;
    } else if (frameIndex === 2) {
      // Run 1 (Legs split)
      hx += 2; hy -= 1;
      nx += 2; ny -= 1;
      bx -= 2; by -= 1;
      
      lFootX = cx + 14; lFootY = 57;
      lKneeX = cx + 8;  lKneeY = 49;
      rFootX = cx - 16; rFootY = 56;
      rKneeX = cx - 10; rKneeY = 48;
      
      lHandX = cx + 10; lHandY = 28;
      rHandX = cx + 15; rHandY = 32;
      
      // Draw tilted spear pointing forward-right
      spearStartX = cx - 4; spearStartY = 41;
      spearEndX = cx + 24; spearEndY = 25;
      spearTipDirX = 0.8; spearTipDirY = -0.6;
    } else if (frameIndex === 3) {
      // Run 2 (Legs passing)
      hx += 1; hy -= 2;
      nx += 1; ny -= 2;
      by -= 2;
      
      lFootX = cx + 2;  lFootY = 58;
      lKneeX = cx + 1;  lKneeY = 49;
      rFootX = cx - 4;  rFootY = 52;
      rKneeX = cx - 6;  rKneeY = 46;
      
      lHandX = cx;      lHandY = 30;
      rHandX = cx + 14; rHandY = 30;
      
      spearStartX = rHandX; spearStartY = 46;
      spearEndX = rHandX; spearEndY = 10;
    } else if (frameIndex === 4) {
      // Run 3 (Alternate split leg pose)
      hx += 2; hy -= 1;
      nx += 2; ny -= 1;
      bx -= 2; by -= 1;
      
      rFootX = cx + 14; rFootY = 57;
      rKneeX = cx + 8;  rKneeY = 49;
      lFootX = cx - 16; lFootY = 56;
      lKneeX = cx - 10; lKneeY = 48;
      
      rHandX = cx + 10; rHandY = 28;
      lHandX = cx - 12; lHandY = 40;
      
      // Spear forward
      spearStartX = cx - 3; spearStartY = 42;
      spearEndX = cx + 25; spearEndY = 23;
      spearTipDirX = 0.8; spearTipDirY = -0.6;
    } else if (frameIndex === 5) {
      // Run 4 (Alternate passing)
      hx += 1; hy -= 2;
      nx += 1; ny -= 2;
      by -= 2;
      
      rFootX = cx + 2;  rFootY = 58;
      rKneeX = cx + 1;  rKneeY = 49;
      lFootX = cx - 4;  lFootY = 52;
      lKneeX = cx - 6;  lKneeY = 46;
      
      lHandX = cx + 14; lHandY = 30;
      rHandX = cx;      rHandY = 30;
      
      spearStartX = rHandX; spearStartY = 46;
      spearEndX = rHandX; spearEndY = 10;
    } else if (frameIndex === 6) {
      // Attack Windup (pulling spear back)
      hx -= 4; hy += 1;
      nx -= 4; ny += 1;
      bx -= 2; by += 1;
      
      lFootX = cx - 12; lFootY = 58;
      rFootX = cx + 6;  rFootY = 58;
      
      lHandX = cx - 10; lHandY = 32;
      rHandX = cx - 5;  rHandY = 32;
      
      spearStartX = cx - 22; spearStartY = 32;
      spearEndX = cx + 12;   spearEndY = 32;
      spearTipDirX = 1;      spearTipDirY = 0;
    } else if (frameIndex === 7) {
      // Attack Thrust (Full spear lunge forward!)
      hx += 12; hy += 2;
      nx += 12; ny += 2;
      bx -= 2;  by += 0;
      
      lFootX = cx - 14; lFootY = 58;
      rFootX = cx + 18; rFootY = 58;
      
      lHandX = cx - 8;  lHandY = 32;
      rHandX = cx + 24; rHandY = 26;
      
      // Spear pointing directly forward horizontally
      spearStartX = cx - 2;   spearStartY = 26;
      spearEndX = cx + 38;    spearEndY = 26;
      spearTipDirX = 1;       spearTipDirY = 0;
    }

    // --- Draw Body skeleton ---
    // 1. Torso
    ctx.beginPath();
    ctx.moveTo(nx, ny);
    ctx.lineTo(bx, by);
    ctx.stroke();

    // Graphic dual neon warrior chest straps/sash wraps on the torso
    ctx.strokeStyle = isLight ? '#f59e0b' : '#f43f5e'; // Golden-orange or Pink-red
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(nx - 4, ny + 3);
    ctx.lineTo(bx + 3, by - 6);
    ctx.moveTo(nx + 4, ny + 3);
    ctx.lineTo(bx - 3, by - 6);
    ctx.stroke();

    // 2. Head
    ctx.fillStyle = headColor;
    ctx.beginPath();
    ctx.arc(hx, hy, isLight ? 8.5 : 8, 0, Math.PI * 2);
    ctx.fill();

    // Flowing neon warrior feather plume crest (adds intense lively energy to movement)
    ctx.fillStyle = isLight ? '#ffd700' : '#ec4899'; // Gold wave or pink wave
    ctx.beginPath();
    ctx.moveTo(hx - 2, hy - 7);
    ctx.quadraticCurveTo(hx - 14, hy - 14, hx - 20, hy - 9);
    ctx.quadraticCurveTo(hx - 11, hy - 4, hx - 4, hy - 5);
    ctx.closePath();
    ctx.fill();

    // 2b. Outer Head Glow
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(hx, hy, isLight ? 12 : 11, 0, Math.PI * 2);
    ctx.stroke();

    // 2c. Small bright eyes (yellow for light, white for regular)
    ctx.fillStyle = isLight ? '#ffd700' : '#ffffff';
    ctx.beginPath();
    ctx.arc(hx + 3, hy - 1, isLight ? 2.5 : 2, 0, Math.PI * 2);
    ctx.fill();

    // Restore strokes for limbs
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = isLight ? 5 : 4.5;

    // 3. Left Arm
    ctx.beginPath();
    ctx.moveTo(nx, ny + 3);
    ctx.lineTo((nx + lHandX) / 2, (ny + 3 + lHandY) / 2 - 2);
    ctx.lineTo(lHandX, lHandY);
    ctx.stroke();

    // 4. Right Arm
    ctx.beginPath();
    ctx.moveTo(nx, ny + 3);
    ctx.lineTo((nx + rHandX) / 2, (ny + 3 + rHandY) / 2 - 2);
    ctx.lineTo(rHandX, rHandY);
    ctx.stroke();

    // 5. Left Leg
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(lKneeX, lKneeY);
    ctx.lineTo(lFootX, lFootY);
    ctx.stroke();

    // 6. Right Leg
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(rKneeX, rKneeY);
    ctx.lineTo(rFootX, rFootY);
    ctx.stroke();

    // Professional/premium Joint Pin Nodes (for elbow and knee pivots)
    const drawJointPinNode = (jx: number, jy: number) => {
      ctx.fillStyle = isLight ? '#ffffff' : '#e0f2fe';
      ctx.beginPath();
      ctx.arc(jx, jy, isLight ? 2.6 : 2.0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isLight ? '#f59e0b' : '#38bdf8';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(jx, jy, isLight ? 4.2 : 3.5, 0, Math.PI * 2);
      ctx.stroke();
    };
    drawJointPinNode(lKneeX, lKneeY);
    drawJointPinNode(rKneeX, rKneeY);
    drawJointPinNode((nx + lHandX) / 2, (ny + 3 + lHandY) / 2 - 2);
    drawJointPinNode((nx + rHandX) / 2, (ny + 3 + rHandY) / 2 - 2);

    // 7. Draw Spear
    if (drawingSpear) {
      if (isLight) {
        ctx.strokeStyle = '#ffd700'; 
        ctx.lineWidth = 3;
      } else {
        ctx.strokeStyle = spearColor; 
        ctx.lineWidth = 2.5;
      }
      ctx.beginPath();
      ctx.moveTo(spearStartX, spearStartY);
      ctx.lineTo(spearEndX, spearEndY);
      ctx.stroke();

      // Energy graphic ring wraps on the spear shaft
      ctx.strokeStyle = isLight ? '#a855f7' : '#ef4444';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(
        (spearStartX + spearEndX) / 2, 
        (spearStartY + spearEndY) / 2, 
        6, 2, 
        Math.atan2(spearEndY - spearStartY, spearEndX - spearStartX) + Math.PI / 2, 
        0, Math.PI * 2
      );
      ctx.stroke();

      // Spear tip
      const tipLen = isLight ? 10 : 8;
      const tipWidth = isLight ? 6 : 4;
      
      const dx = spearTipDirX;
      const dy = spearTipDirY;
      
      const px = -dy;
      const py = dx;
      
      const p1x = spearEndX + dx * tipLen;
      const p1y = spearEndY + dy * tipLen;
      
      const p2x = spearEndX - px * tipWidth;
      const p2y = spearEndY - py * tipWidth;
      
      const p3x = spearEndX + px * tipWidth;
      const p3y = spearEndY + py * tipWidth;

      ctx.fillStyle = isLight ? '#ffffff' : '#ff6200';
      ctx.beginPath();
      ctx.moveTo(p1x, p1y);
      ctx.lineTo(p2x, p2y);
      ctx.lineTo(p3x, p3y);
      ctx.closePath();
      ctx.fill();

      if (isLight) {
        ctx.fillStyle = '#ffe555';
        ctx.beginPath();
        ctx.arc(p1x, p1y, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  };

  // 4. PLAYER (JAMA) - Top-down animated spritesheet
  // Size: 512x64 (8 frames of 64x64)
  if (!tm.exists('jama')) {
    const { canvas, ctx } = createCtx(512, 64);
    for (let f = 0; f < 8; f++) {
      drawStickmanFrame(ctx, f * 64 + 32, f, false);
    }
    const texture = tm.addCanvas('jama', canvas);
    for (let f = 0; f < 8; f++) {
      texture.add(f, 0, f * 64, 0, 64, 64);
    }
  }

  // 5. UPGRADED LIGHT SPEAR (For LEVEL 3)
  // Size: 512x64 (8 frames of 64x64)
  if (!tm.exists('jama-light')) {
    const { canvas, ctx } = createCtx(512, 64);
    for (let f = 0; f < 8; f++) {
      drawStickmanFrame(ctx, f * 64 + 32, f, true);
    }
    const texture = tm.addCanvas('jama-light', canvas);
    for (let f = 0; f < 8; f++) {
      texture.add(f, 0, f * 64, 0, 64, 64);
    }
  }

  // 6. KHWEZI (Sister) - Top-down tied/idle sprite
  // Replaced with a cute blue stick sister bound with crimson/red night creature bindings
  if (!tm.exists('khwezi')) {
    const { canvas, ctx } = createCtx(48, 48);
    
    // Small shadow
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(24, 34, 15, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Blue Stick Sister Torso
    ctx.strokeStyle = '#2962ff'; // Royal blue tone for sister
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    
    // Torso
    ctx.beginPath();
    ctx.moveTo(24, 17);
    ctx.lineTo(24, 30);
    ctx.stroke();

    // Bound arms wrapped around chest
    ctx.beginPath();
    ctx.moveTo(24, 20);
    ctx.lineTo(16, 23);
    ctx.lineTo(24, 26);
    ctx.moveTo(24, 20);
    ctx.lineTo(32, 23);
    ctx.lineTo(24, 26);
    ctx.stroke();

    // Legs tucked/seated in distress
    ctx.beginPath();
    ctx.moveTo(24, 30);
    ctx.lineTo(15, 36);
    ctx.lineTo(12, 42);
    ctx.moveTo(24, 30);
    ctx.lineTo(33, 36);
    ctx.lineTo(36, 42);
    ctx.stroke();

    // Royal Blue Head
    ctx.fillStyle = '#0091ff';
    ctx.beginPath();
    ctx.arc(24, 11, 6.5, 0, Math.PI * 2);
    ctx.fill();

    // Red floral headband (African ornament charm)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(24, 5, 2.5, 0, Math.PI * 2);
    ctx.arc(20, 7, 2, 0, Math.PI * 2);
    ctx.arc(28, 7, 2, 0, Math.PI * 2);
    ctx.fill();

    // Distressed closed eyes (little white diagonal distress lashes)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(21, 10); ctx.lineTo(23, 12);
    ctx.moveTo(27, 10); ctx.lineTo(25, 12);
    ctx.stroke();

    // Corrupt Red bindings/ropes (wrapped tightly around her body)
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)'; // Vivid devilish red
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(15, 22);
    ctx.lineTo(33, 22);
    ctx.moveTo(14, 26);
    ctx.lineTo(34, 26);
    ctx.moveTo(16, 30);
    ctx.lineTo(32, 30);
    ctx.stroke();

    tm.addCanvas('khwezi', canvas);
  }

  // 7. WRAITH STALKER (Corrupted Spirit)
  // Replaced with a stunning RED GLOWING DEVIL FIGURE
  if (!tm.exists('wraith')) {
    const { canvas, ctx } = createCtx(64, 64);
    
    // Subtle red radial backdrop aura (reduced to keep stickman visible as primary)
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 16);
    grad.addColorStop(0, 'rgba(239, 68, 68, 0.18)');
    grad.addColorStop(0.5, 'rgba(120, 10, 10, 0.05)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(32, 32, 16, 0, Math.PI*2);
    ctx.fill();

    // Pitch-black central devil body outline
    ctx.strokeStyle = '#ff0033'; // Blazing neon hot red
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';

    // Devil Torso
    ctx.beginPath();
    ctx.moveTo(32, 20);
    ctx.lineTo(32, 40);
    ctx.stroke();

    // Spiky claw arms reaching for prey
    ctx.beginPath();
    ctx.moveTo(32, 24);
    ctx.lineTo(16, 20);
    ctx.lineTo(8, 32); // extended razor claws
    ctx.moveTo(32, 24);
    ctx.lineTo(48, 20);
    ctx.lineTo(56, 32);
    ctx.stroke();

    // Spiky legs / tail
    ctx.beginPath();
    ctx.moveTo(32, 40);
    ctx.lineTo(20, 52);
    ctx.moveTo(32, 40);
    ctx.lineTo(44, 52);
    ctx.stroke();

    // Red devil head
    ctx.fillStyle = '#7a0010';
    ctx.beginPath();
    ctx.arc(32, 14, 8, 0, Math.PI * 2);
    ctx.fill();

    // Blazing red horns
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    // Left horn
    ctx.moveTo(27, 9);
    ctx.quadraticCurveTo(24, 2, 21, 2);
    ctx.quadraticCurveTo(27, 6, 27, 9);
    // Right horn
    ctx.moveTo(37, 9);
    ctx.quadraticCurveTo(40, 2, 43, 2);
    ctx.quadraticCurveTo(37, 6, 37, 9);
    ctx.closePath();
    ctx.fill();

    // Glowing vicious neon eyes
    ctx.fillStyle = '#ff3333';
    ctx.beginPath();
    ctx.arc(28, 14, 2.2, 0, Math.PI*2);
    ctx.arc(36, 14, 2.2, 0, Math.PI*2);
    ctx.fill();

    // Sharp devil tail
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(32, 40);
    ctx.quadraticCurveTo(14, 46, 16, 56);
    ctx.stroke();
    // Devil arrow tip on tail
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(16, 56);
    ctx.lineTo(11, 52);
    ctx.lineTo(21, 50);
    ctx.closePath();
    ctx.fill();

    tm.addCanvas('wraith', canvas);
  }

  // 8. BONE CRAWLER (Skeletal beast)
  // Replaced with skeletal CRAWLING RED GLOWING DEVIL BEAST
  if (!tm.exists('crawler')) {
    const { canvas, ctx } = createCtx(56, 56);
    
    // Crimson fog drop shadow
    ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
    ctx.beginPath();
    ctx.ellipse(28, 32, 18, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Multiple crawling devil skeletal limbs in red hot bone tone
    ctx.strokeStyle = '#ff3355'; // Pinkish hot hot red
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';

    // 6 crawly spiky devil legs!
    // Front-left
    ctx.beginPath(); ctx.moveTo(20, 22); ctx.lineTo(8, 10); ctx.lineTo(4, 16); ctx.stroke();
    // Front-right
    ctx.beginPath(); ctx.moveTo(36, 22); ctx.lineTo(48, 10); ctx.lineTo(52, 16); ctx.stroke();
    // Mid-left
    ctx.beginPath(); ctx.moveTo(18, 28); ctx.lineTo(6, 28); ctx.lineTo(2, 36); ctx.stroke();
    // Mid-right
    ctx.beginPath(); ctx.moveTo(38, 28); ctx.lineTo(50, 28); ctx.lineTo(54, 36); ctx.stroke();
    // Back legs
    ctx.beginPath(); ctx.moveTo(18, 36); ctx.lineTo(8, 48); ctx.stroke();
    // Back legs
    ctx.beginPath(); ctx.moveTo(38, 36); ctx.lineTo(48, 48); ctx.stroke();

    // Devil red ribcage / spine
    ctx.fillStyle = '#6b001a';
    ctx.fillRect(24, 18, 8, 22);

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(14, 22); ctx.lineTo(42, 22);
    ctx.moveTo(12, 28); ctx.lineTo(44, 28);
    ctx.moveTo(14, 34); ctx.lineTo(42, 34);
    ctx.stroke();

    // Red skull with small devil horns
    ctx.fillStyle = '#ff1a4a';
    ctx.beginPath();
    ctx.arc(28, 12, 7.5, 0, Math.PI*2);
    ctx.fill();
    ctx.fillRect(25, 4, 6, 8); // jaw

    // Horns
    ctx.fillStyle = '#ff809b';
    ctx.beginPath();
    ctx.moveTo(23, 7); ctx.lineTo(19, 1); ctx.lineTo(25, 5);
    ctx.moveTo(33, 7); ctx.lineTo(37, 1); ctx.lineTo(31, 5);
    ctx.closePath();
    ctx.fill();

    // Fiery red pinprick eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(25, 11, 1.8, 0, Math.PI * 2);
    ctx.arc(31, 11, 1.8, 0, Math.PI * 2);
    ctx.fill();

    tm.addCanvas('crawler', canvas);
  }

  // 9. SPIRIT CALLER (Ranged spellcaster)
  // Replaced with robed RED GLOWING DEVIL RITUALIST
  if (!tm.exists('caller')) {
    const { canvas, ctx } = createCtx(64, 64);
    
    // Glowing ambient ritual crimson puddle shadow
    const shadowGrad = ctx.createRadialGradient(32, 40, 0, 32, 40, 20);
    shadowGrad.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
    shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.arc(32, 40, 20, 0, Math.PI*2);
    ctx.fill();

    // Ritualist evil cape (Crimson/black)
    ctx.fillStyle = '#3a0209'; // Blood red-black
    ctx.beginPath();
    ctx.moveTo(32, 14);
    ctx.lineTo(12, 50);
    ctx.lineTo(52, 50);
    ctx.closePath();
    ctx.fill();

    // Devilish horn horns poking out of the robe
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(24, 12); ctx.lineTo(16, 2); ctx.lineTo(26, 10);
    ctx.moveTo(40, 12); ctx.lineTo(48, 2); ctx.lineTo(38, 10);
    ctx.closePath();
    ctx.fill();

    // Glowing red mask
    ctx.fillStyle = '#b3001e';
    ctx.beginPath();
    ctx.ellipse(32, 22, 10, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ancient devil runic markings on mask
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(26, 22); ctx.lineTo(38, 22);
    ctx.moveTo(32, 16); ctx.lineTo(32, 28);
    ctx.stroke();

    // Bright devil eyes blinking
    ctx.fillStyle = '#ffe5e9';
    ctx.beginPath();
    ctx.arc(27, 20, 2, 0, Math.PI*2);
    ctx.arc(37, 20, 2, 0, Math.PI*2);
    ctx.fill();

    // Robed claws raising glowing orb
    ctx.fillStyle = '#ff1a4a';
    ctx.fillRect(8, 30, 6, 10);
    ctx.fillRect(50, 30, 6, 10);

    tm.addCanvas('caller', canvas);
  }

  // 10. PROJECTILE (Orbiting/hurled skull node)
  if (!tm.exists('projectile')) {
    const { canvas, ctx } = createCtx(24, 24);
    
    // Radiant hot red fire halo
    const grad = ctx.createRadialGradient(12, 12, 0, 12, 12, 12);
    grad.addColorStop(0, '#fff0f2');
    grad.addColorStop(0.4, '#ff1a53');
    grad.addColorStop(1, 'rgba(150,0,30,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(12, 12, 12, 0, Math.PI*2);
    ctx.fill();

    // Tiny burning devil core
    ctx.fillStyle = '#9b001a';
    ctx.beginPath();
    ctx.arc(12, 10, 5, 0, Math.PI*2);
    ctx.fill();
    ctx.fillRect(10, 12, 4, 4);

    // Pinprick glowing hell eyes
    ctx.fillStyle = '#ffeb3b'; // Yellow burning eyes
    ctx.fillRect(9, 9, 2, 1.8);
    ctx.fillRect(13, 9, 2, 1.8);

    tm.addCanvas('projectile', canvas);
  }

  // 11. IZITHUNZI ZOBUMNYAMA PRIME (BOSS - The Shadow King)
  // Replaced with a GIANT SUPREME RED GLOWING DEVIL LORD (The Devil King)
  if (!tm.exists('boss')) {
    const { canvas, ctx } = createCtx(144, 144);
    
    // Gigantic ultimate dark red cosmic fire circle
    const bossGrad = ctx.createRadialGradient(72, 72, 0, 72, 72, 72);
    bossGrad.addColorStop(0, 'rgba(40, 2, 8, 1)');
    bossGrad.addColorStop(0.4, 'rgba(139, 0, 24, 0.85)');
    bossGrad.addColorStop(0.7, 'rgba(239, 68, 68, 0.45)');
    bossGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = bossGrad;
    ctx.beginPath();
    ctx.arc(72, 72, 72, 0, Math.PI*2);
    ctx.fill();

    // Shadow core body (deep obsidian pitch dark base)
    ctx.fillStyle = '#100004';
    ctx.beginPath();
    ctx.arc(72, 72, 42, 0, Math.PI*2);
    ctx.fill();

    // Gigantic glowing sharp devil horns
    ctx.fillStyle = '#ff1a4a';
    ctx.beginPath();
    // Huge Left Horn curving outwards
    ctx.moveTo(54, 42);
    ctx.bezierCurveTo(45, 10, 20, 2, 16, 12);
    ctx.bezierCurveTo(24, 25, 42, 35, 54, 42);
    // Huge Right Horn curving outwards
    ctx.moveTo(90, 42);
    ctx.bezierCurveTo(99, 10, 124, 2, 128, 12);
    ctx.bezierCurveTo(120, 25, 102, 35, 90, 42);
    ctx.closePath();
    ctx.fill();

    // Highlights on horns (glow edge)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(16, 12); ctx.quadraticCurveTo(24, 20, 42, 30);
    ctx.moveTo(128, 12); ctx.quadraticCurveTo(120, 20, 102, 30);
    ctx.stroke();

    // Radiating massive jagged red flame wings structure
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
    ctx.lineWidth = 6;
    for (let angle = -Math.PI/6; angle < Math.PI * 7/6; angle += Math.PI / 5) {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      ctx.beginPath();
      ctx.moveTo(72 + cos * 42, 72 + sin * 42);
      ctx.lineTo(72 + cos * 65, 72 + sin * 65);
      ctx.stroke();
    }

    // Huge glowing devil eyes
    ctx.fillStyle = '#ff2a2a';
    ctx.beginPath();
    ctx.ellipse(56, 68, 9, 13, Math.PI / 12, 0, Math.PI*2);
    ctx.ellipse(88, 68, 9, 13, -Math.PI / 12, 0, Math.PI*2);
    ctx.fill();

    // Burning golden devil center slits
    ctx.fillStyle = '#ffeb3b';
    ctx.beginPath();
    ctx.arc(56, 68, 3.5, 0, Math.PI*2);
    ctx.arc(88, 68, 3.5, 0, Math.PI*2);
    ctx.fill();

    // Dark volcanic crack formations glowing hot gold and amber on chest
    ctx.strokeStyle = '#ffeb3b';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(72, 85); ctx.lineTo(58, 114);
    ctx.moveTo(72, 85); ctx.lineTo(86, 114);
    ctx.moveTo(72, 98); ctx.lineTo(72, 124);
    ctx.stroke();

    tm.addCanvas('boss', canvas);
  }

  // 12. ANCESTRAL GUIDE ORB (ONEZWA)
  // Made extremely large, majestic and highly-luminous to fit the "make ancestral guide as big" request
  if (!tm.exists('guide-orb')) {
    const { canvas, ctx } = createCtx(96, 96);
    
    // Golden colossal radiant aura
    const grad = ctx.createRadialGradient(48, 48, 2, 48, 48, 48);
    grad.addColorStop(0, '#ffffff'); // blinding white center
    grad.addColorStop(0.2, '#fff2a3'); // brilliant light gold
    grad.addColorStop(0.5, '#f59e0b'); // amber corona
    grad.addColorStop(0.8, '#d97706'); // deep golden halo
    grad.addColorStop(1, 'rgba(217, 119, 6, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(48, 48, 48, 0, Math.PI*2);
    ctx.fill();

    // Radial sparkle spikes (ancestral guide stars)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    // vertical
    ctx.moveTo(48, 14); ctx.lineTo(48, 82);
    // horizontal
    ctx.moveTo(14, 48); ctx.lineTo(82, 48);
    ctx.stroke();

    // Inner sacred rotating core rings
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(48, 48, 16, 0, Math.PI*2);
    ctx.stroke();

    tm.addCanvas('guide-orb', canvas);
  }

  // 13. TILESET (Create procedurally drawn tile assets with high detail)
  if (!tm.exists('forest-tileset')) {
    // A unified tileset block of 256x64 comprising 4 pieces of 64x64px matching the image guide design
    // Frame 0: Luxurious teal-green painterly moss and grass
    // Frame 1: Rich gnarled muddy floor with mossy boulder stone mounds
    // Frame 2: Bioluminescent magical forest undergrowth with glowing runes and spores
    // Frame 3: Ancient basalt shrine flagstones with violet-pink glowing runes
    const { canvas, ctx } = createCtx(256, 64);

    // --- TILE 0: LUSH TEAL-GREEN PAINTERLY FOREST GRASS (0 to 64px) ---
    // Start with a deep, moody forest-green/teal gradient matching the reference image's shadows
    const grassGrad = ctx.createLinearGradient(0, 0, 64, 64);
    grassGrad.addColorStop(0, '#040b11'); // Dark ocean-indigo base
    grassGrad.addColorStop(0.5, '#071d1b'); // Moody spruce base
    grassGrad.addColorStop(1, '#020907');
    ctx.fillStyle = grassGrad;
    ctx.fillRect(0, 0, 64, 64);

    // Render painterly moss mounds with soft overlay radial brushes
    const drawMossHummock0 = (x: number, y: number, r: number, color: string) => {
      const g = ctx.createRadialGradient(x, y, r * 0.1, x, y, r);
      g.addColorStop(0, color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };
    // Overlay dark-teal and jade hummocks
    drawMossHummock0(20, 20, 18, 'rgba(10, 52, 43, 0.7)');
    drawMossHummock0(45, 15, 22, 'rgba(12, 63, 50, 0.65)');
    drawMossHummock0(15, 48, 16, 'rgba(8, 45, 36, 0.7)');
    drawMossHummock0(48, 48, 24, 'rgba(15, 74, 58, 0.65)');

    // Paint fine graphic grass blade clusters of different tones (matching the organic foliage lines)
    for (let i = 0; i < 35; i++) {
      const gx = 2 + Math.random() * 60;
      const gy = 2 + Math.random() * 60;
      const h = 4 + Math.random() * 10;
      
      // Use moody teal/jade shades matching the reference
      ctx.strokeStyle = Math.random() > 0.5 ? '#115e59' : '#0d9488';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.quadraticCurveTo(gx - 2, gy - h / 2, gx - 3, gy - h);
      ctx.moveTo(gx, gy);
      ctx.quadraticCurveTo(gx + 1.5, gy - h * 0.7 / 2, gx + 3, gy - h * 0.7);
      ctx.stroke();
    }

    // Scatter beautifully detailed orange-gold and teal autumn leaf details
    const drawFallenLeaf0 = (lx: number, ly: number, angle: number, isGold: boolean) => {
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(angle);
      
      // Leaf Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.ellipse(0.8, 1.5, 4.5, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Leaf body
      ctx.fillStyle = isGold ? '#b45309' : '#0e7490'; // Ochre-gold or Dark teal
      ctx.beginPath();
      ctx.ellipse(0, 0, 4, 1.9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Vein highlight
      ctx.strokeStyle = isGold ? '#f59e0b' : '#22d3ee';
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.lineTo(4, 0);
      ctx.stroke();

      ctx.restore();
    };
    drawFallenLeaf0(14, 16, 0.5, true);
    drawFallenLeaf0(50, 10, -0.4, false);
    drawFallenLeaf0(18, 52, 1.3, false);
    drawFallenLeaf0(45, 45, -0.9, true);

    // --- TILE 1: CRACKED MUD & TEXTURED GNARLED MOSS-COVERED BOULDERS (64 to 128px) ---
    // Deep dark chocolate mud floor
    ctx.fillStyle = '#150f0c';
    ctx.fillRect(64, 0, 64, 64);

    // Graphic sharp dark crevices
    ctx.strokeStyle = '#050302';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(64, 15); ctx.lineTo(80, 32); ctx.lineTo(100, 26); ctx.lineTo(128, 48);
    ctx.moveTo(92, 0); ctx.lineTo(98, 38); ctx.lineTo(80, 52); ctx.lineTo(110, 64);
    ctx.stroke();

    // Crevis rim highlights
    ctx.strokeStyle = '#2d1f18';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(64, 16); ctx.lineTo(80, 33); ctx.lineTo(100, 27); ctx.lineTo(128, 49);
    ctx.stroke();

    // Draw moss-covered stone boulders (replicating the rocky shapes in the bottom right of the image guide)
    const drawMossyBoulder = (bx: number, by: number, rx: number, ry: number, angle: number) => {
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(angle);

      // Heavy boulder shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.ellipse(2, 4, rx + 1, ry + 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Stone base
      ctx.fillStyle = '#1e293b'; // dark basalt gray
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();

      // Stone texture cracks & bevel cut
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx - 1, ry - 1, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#475569'; // light granite ridge highlight
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, rx - 2, Math.PI * 1.1, Math.PI * 1.8);
      ctx.stroke();

      // Dense moody moss carpet climbing onto the boulder top
      const mossGrad = ctx.createRadialGradient(-3, -3, 1, 0, 0, rx * 0.95);
      mossGrad.addColorStop(0, '#0d9488'); // beautiful teal-moss highlight
      mossGrad.addColorStop(0.6, '#0f5142'); // dark-green border
      mossGrad.addColorStop(0.9, 'rgba(0,0,0,0)');
      ctx.fillStyle = mossGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx - 1.5, ry - 1.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    // Construct a gorgeous clustered mound of stones (like the mossy coordinates on the bottom-right of reference)
    drawMossyBoulder(80, 18, 12, 10, -0.3);
    drawMossyBoulder(108, 44, 15, 13, 0.5);
    drawMossyBoulder(78, 48, 9, 8, 1.2);

    // Gnarled dark tree roots crawling out from under rocks
    ctx.strokeStyle = '#2e190e';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(108, 44);
    ctx.quadraticCurveTo(116, 26, 124, 10);
    ctx.stroke();

    ctx.strokeStyle = '#4a2c1a'; // root wood grain highlight
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(107, 44);
    ctx.quadraticCurveTo(115, 26, 123, 10);
    ctx.stroke();


    // --- TILE 2: BIOLUMINESCENT MAGIC MOSS carpet (128 to 192px) ---
    // Deep dark mystical forest shadow background matching #0A0F14
    ctx.fillStyle = '#060a0e';
    ctx.fillRect(128, 0, 64, 64);

    // Highly suppressed moss pads (darkened so the ground recesses)
    drawMossHummock0(148, 20, 14, '#052a20');
    drawMossHummock0(176, 42, 16, '#06241a');
    drawMossHummock0(144, 46, 11, '#06241a');

    // Delicate organic moss stems & leaves (replaced star-shaped symbols with organic shapes)
    const drawOrganicMoss = (fx: number, fy: number, r: number) => {
      ctx.strokeStyle = '#0a2e1d'; // dark forest moss shadow
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      // Draw a soft organic curved root vein / curl
      ctx.moveTo(fx - r, fy + r);
      ctx.quadraticCurveTo(fx, fy - r, fx + r, fy + r);
      ctx.moveTo(fx, fy - r/2);
      ctx.quadraticCurveTo(fx - r/2, fy, fx - r, fy + r/2);
      ctx.stroke();

      // Soft leafy blobs / marks
      ctx.fillStyle = '#0f3824'; // beautiful organic dark jade
      ctx.beginPath();
      ctx.ellipse(fx - r/2, fy - r/3, 3.5, 1.8, 0.5, 0, Math.PI * 2);
      ctx.ellipse(fx + r/2, fy, 4, 1.8, -0.4, 0, Math.PI * 2);
      ctx.fill();
    };
    drawOrganicMoss(148, 20, 11);
    drawOrganicMoss(176, 42, 12);
    drawOrganicMoss(144, 46, 8);

    // Glowing mystical mushrooms & cyan light orbs casting soft ambiance
    const drawSpiritualBloom = (sx: number, sy: number, radius: number, isCyan: boolean) => {
      // Glow circle
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, radius);
      g.addColorStop(0, isCyan ? 'rgba(34, 211, 238, 0.8)' : 'rgba(167, 139, 250, 0.8)');
      g.addColorStop(0.35, isCyan ? 'rgba(13, 148, 136, 0.3)' : 'rgba(109, 40, 217, 0.25)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, Math.PI * 2);
      ctx.fill();

      // Shiny core bead
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(sx, sy, 1.4, 0, Math.PI * 2);
      ctx.fill();
    };
    drawSpiritualBloom(138, 14, 10, true);
    drawSpiritualBloom(184, 24, 12, false);
    drawSpiritualBloom(168, 52, 9, true);
    drawSpiritualBloom(132, 44, 10, false);


    // --- TILE 3: ANCIENT STONE SHRINE FLAGSTONES (192 to 256px) ---
    // Smooth, deep charcoal-violet granite
    ctx.fillStyle = '#0e0e13';
    ctx.fillRect(192, 0, 64, 64);

    // Helper to draw beveled obsidian flagstone plates
    const drawFlagstonePlate = (sx: number, sy: number, sw: number, sh: number) => {
      // Shadow joint grooves
      ctx.fillStyle = '#040407';
      ctx.fillRect(sx, sy, sw, sh);

      // Main flagstone body
      ctx.fillStyle = '#22222d';
      ctx.fillRect(sx + 1.2, sy + 1.2, sw - 2.4, sh - 2.4);

      // Northern/Western sunlit stone edges
      ctx.strokeStyle = '#3b3b4f';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx + 1, sy + sh - 2.5);
      ctx.lineTo(sx + 1, sy + 1);
      ctx.lineTo(sx + sw - 2.5, sy + 1);
      ctx.stroke();

      // Southern/Eastern shadowed bevel cuts
      ctx.strokeStyle = '#14141c';
      ctx.beginPath();
      ctx.moveTo(sx + sw - 1.2, sy + 1.2);
      ctx.lineTo(sx + sw - 1.2, sy + sh - 1.2);
      ctx.lineTo(sx + 1.2, sy + sh - 1.2);
      ctx.stroke();

      // Grid scratches inside flagstones
      ctx.strokeStyle = '#0e0e14';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(sx + 5, sy + 6);
      ctx.lineTo(sx + 10, sy + 11);
      ctx.lineTo(sx + 8, sy + 16);
      ctx.stroke();
    };

    // Carve 4 stone flagstone blocks
    drawFlagstonePlate(192, 0, 32, 32);
    drawFlagstonePlate(224, 0, 32, 32);
    drawFlagstonePlate(192, 32, 32, 32);
    drawFlagstonePlate(224, 32, 32, 32);

    // Ancient glowing runes carved in central flagstones with faint green rune style
    const drawRuneGlyph = (rx: number, ry: number) => {
      ctx.save();
      // Small faint green light dome with alpha 0.4
      const runeGlow = ctx.createRadialGradient(rx, ry, 0, rx, ry, 8);
      runeGlow.addColorStop(0, 'rgba(45, 122, 79, 0.20)');
      runeGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = runeGlow;
      ctx.beginPath();
      ctx.arc(rx, ry, 8, 0, Math.PI * 2);
      ctx.fill();

      // Style them as faint green runes: color #2D7A4F (rgb: 45, 122, 79), alpha 0.4, smaller font size
      ctx.fillStyle = 'rgba(45, 122, 79, 0.4)';
      ctx.font = "9px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Choose a beautiful Norse/Celtic style ancient rune character
      const glyphs = ["ᛞ", "ᚦ", "ᛃ", "ᛉ", "᚛", "ᚖ", "❖"];
      const glyph = glyphs[Math.floor((rx + ry) % glyphs.length)];
      ctx.fillText(glyph, rx, ry);
      ctx.restore();
    };
    drawRuneGlyph(208, 16);
    drawRuneGlyph(240, 48);

    const texture = tm.addCanvas('forest-tileset', canvas);
    texture.add('0', 0, 0, 0, 64, 64);
    texture.add('1', 0, 64, 0, 64, 64);
    texture.add('2', 0, 128, 0, 64, 64);
    texture.add('3', 0, 192, 0, 64, 64);
  }

  // 14. ANCIENT ARTIFACTS (Individual animated relic sprites)
  // Each artifact size: 48x48
  // Relic 1: Drum of Ancestors
  if (!tm.exists('relic-1')) {
    const { canvas, ctx } = createCtx(48, 48);
    // Outer golden glow halo
    const grad = ctx.createRadialGradient(24, 24, 4, 24, 24, 24);
    grad.addColorStop(0, 'rgba(255, 190, 50, 0.4)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,48,48);

    // The Drum base
    ctx.fillStyle = '#a0522d'; // Sienna wood
    ctx.beginPath();
    ctx.moveTo(14, 12);
    ctx.lineTo(34, 12);
    ctx.lineTo(28, 24);
    ctx.lineTo(32, 38);
    ctx.lineTo(16, 38);
    ctx.lineTo(20, 24);
    ctx.closePath();
    ctx.fill();

    // Drum head (White leopard print style skins)
    ctx.fillStyle = '#ffebcd'; // BlanchedAlmond skin
    ctx.beginPath();
    ctx.ellipse(24, 12, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Leopard spots
    ctx.fillStyle = '#111';
    ctx.fillRect(21, 11, 2, 2);
    ctx.fillRect(25, 13, 1.5, 1.5);
    ctx.fillRect(27, 11, 2, 2);

    tm.addCanvas('relic-1', canvas);
  }

  // Relic 2: Bone Mask of Elders
  if (!tm.exists('relic-2')) {
    const { canvas, ctx } = createCtx(48, 48);
    // Cold blue shadow glow
    const grad = ctx.createRadialGradient(24, 24, 4, 24, 24, 24);
    grad.addColorStop(0, 'rgba(100, 180, 255, 0.4)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,48,48);

    // Mask shape (Bone white)
    ctx.fillStyle = '#fffff0'; // ivory
    ctx.beginPath();
    ctx.ellipse(24, 24, 10, 14, 0, 0, Math.PI*2);
    ctx.fill();

    // Tribal geometries
    ctx.strokeStyle = '#005b8b'; // dynamic indigo
    ctx.lineWidth = 1.5;
    ctx.strokeRect(18, 16, 12, 3);
    ctx.strokeRect(18, 28, 12, 2);

    // Hollow eye holes
    ctx.fillStyle = '#0f0f15';
    ctx.beginPath();
    ctx.arc(20, 20, 2, 0, Math.PI*2);
    ctx.arc(28, 20, 2, 0, Math.PI*2);
    ctx.fill();

    tm.addCanvas('relic-2', canvas);
  }

  // Relic 3: Spear of Mbeki
  if (!tm.exists('relic-3')) {
    const { canvas, ctx } = createCtx(48, 48);
    // Violet glow
    const grad = ctx.createRadialGradient(24, 24, 4, 24, 24, 24);
    grad.addColorStop(0, 'rgba(148, 0, 211, 0.4)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,48,48);

    // Miniature spear spear crossing diagonally
    ctx.strokeStyle = '#8b5a2b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(10, 38);
    ctx.lineTo(34, 14);
    ctx.stroke();

    // Glowing obsidian tip
    ctx.fillStyle = '#1c002c'; // deep violet core
    ctx.beginPath();
    ctx.moveTo(34, 14);
    ctx.lineTo(40, 8);
    ctx.lineTo(38, 18);
    ctx.closePath();
    ctx.fill();

    // Purple highlight
    ctx.fillStyle = '#ca3cff';
    ctx.beginPath();
    ctx.arc(38, 11, 3.5, 0, Math.PI * 2);
    ctx.fill();

    tm.addCanvas('relic-3', canvas);
  }

  // Relic 4: Beaded Crown of Queens
  if (!tm.exists('relic-4')) {
    const { canvas, ctx } = createCtx(48, 48);
    // Rose gold glow
    const grad = ctx.createRadialGradient(24, 24, 4, 24, 24, 24);
    grad.addColorStop(0, 'rgba(255, 105, 180, 0.4)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,48,48);

    // Crown bands
    ctx.strokeStyle = '#b8860b'; // dark golden rod
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(12, 34); ctx.lineTo(36, 34);
    ctx.stroke();

    // Peaks
    ctx.fillStyle = '#cca43b';
    ctx.beginPath();
    ctx.moveTo(12, 34); ctx.lineTo(14, 20); ctx.lineTo(18, 34);
    ctx.moveTo(18, 34); ctx.lineTo(24, 14); ctx.lineTo(30, 34);
    ctx.moveTo(30, 34); ctx.lineTo(34, 20); ctx.lineTo(36, 34);
    ctx.fill();

    // Hanging copper shells / beads
    ctx.fillStyle = '#ff69b4'; // pink beads
    ctx.beginPath();
    ctx.arc(14, 38, 2, 0, Math.PI*2);
    ctx.arc(24, 40, 2, 0, Math.PI*2);
    ctx.arc(34, 38, 2, 0, Math.PI*2);
    ctx.fill();

    tm.addCanvas('relic-4', canvas);
  }

  // Relic 5: Calabash of Spirits (carved vessel)
  if (!tm.exists('relic-5')) {
    const { canvas, ctx } = createCtx(48, 48);
    // White spirit light glow
    const grad = ctx.createRadialGradient(24, 24, 4, 24, 24, 24);
    grad.addColorStop(0, 'rgba(224, 255, 255, 0.45)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,48,48);

    // Gourd body shape (small upper sphere, larger bottom sphere)
    ctx.fillStyle = '#d2b48c'; // Tan color
    ctx.beginPath();
    ctx.arc(24, 18, 5, 0, Math.PI*2); // Upper gourd bulb
    ctx.arc(24, 30, 9, 0, Math.PI*2); // Lower gourd bulb
    ctx.fill();

    // Wooden cord wrap at junction
    ctx.strokeStyle = '#8b5a2b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(20, 22); ctx.lineTo(28, 22);
    ctx.stroke();

    // Sacred carvings on lower bulb (glowing neon white)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(24, 30, 3, 0, Math.PI*2);
    ctx.fill();

    tm.addCanvas('relic-5', canvas);
  }

  // 15. VILLAGE HUT (RONDAVEL) - Top-down circular hut
  if (!tm.exists('village-hut')) {
    const { canvas, ctx } = createCtx(120, 120);
    
    // Thick shadow
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.arc(60, 60, 55, 0, Math.PI * 2);
    ctx.fill();

    // Clay/Mud wall outer rim
    ctx.fillStyle = '#8b5a2b'; // clay brown
    ctx.beginPath();
    ctx.arc(60, 60, 48, 0, Math.PI * 2);
    ctx.fill();

    // Straw thatched roof layers (drawn as beautiful overlapping radial straw circles)
    ctx.fillStyle = '#cd853f'; // peru straw
    ctx.beginPath();
    ctx.arc(60, 60, 42, 0, Math.PI * 2);
    ctx.fill();

    // Thatch ridges
    ctx.strokeStyle = '#a0522d'; // darker lines
    ctx.lineWidth = 2;
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
      ctx.beginPath();
      ctx.moveTo(60, 60);
      ctx.lineTo(60 + Math.cos(angle) * 42, 60 + Math.sin(angle) * 42);
      ctx.stroke();
    }

    // Inner roof peak
    ctx.fillStyle = '#8b4513';
    ctx.beginPath();
    ctx.arc(60, 60, 12, 0, Math.PI * 2);
    ctx.fill();

    tm.addCanvas('village-hut', canvas);
  }

  // 16. SHADOW OBSTACLE (Gnarled Forest Tree - Top Down)
  if (!tm.exists('forest-tree')) {
    const { canvas, ctx } = createCtx(128, 128);
    
    // 1. Heavy Realistic Ground Drop Shadow cast towards the South-East (dimension and height)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(82, 86, 42, 24, Math.PI / 8, 0, Math.PI * 2);
    ctx.fill();

    // 2. Trunk rendering with concentric textured wood rings
    // Base trunk shadow
    ctx.fillStyle = '#100501';
    ctx.beginPath();
    ctx.arc(64, 64, 25, 0, Math.PI * 2);
    ctx.fill();

    // Rich mahogany trunk wood
    ctx.fillStyle = '#2d1405';
    ctx.beginPath();
    ctx.arc(64, 64, 22, 0, Math.PI * 2);
    ctx.fill();

    // Secondary concentric wood grain inside trunk (gives 3D cylinder depth)
    ctx.strokeStyle = '#4a250f';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(64, 64, 15, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#6a3717';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(64, 64, 8, 0, Math.PI * 2);
    ctx.stroke();

    // 3. Winding organic branch cords radiating out
    const drawGnarledBranch = (tx: number, ty: number, bx: number, by: number, width: number) => {
      ctx.save();
      
      // Branch core shadow
      ctx.strokeStyle = '#180a02';
      ctx.lineWidth = width + 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.quadraticCurveTo((tx + bx) / 2 + 6, (ty + by) / 2 - 6, bx, by);
      ctx.stroke();

      // Main branch body
      ctx.strokeStyle = '#42200a';
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.quadraticCurveTo((tx + bx) / 2 + 6, (ty + by) / 2 - 6, bx, by);
      ctx.stroke();

      // Sunlit rim highlight on top side
      ctx.strokeStyle = '#7c3f19';
      ctx.lineWidth = width * 0.4;
      ctx.beginPath();
      ctx.moveTo(tx - 1, ty - 1);
      ctx.quadraticCurveTo((tx + bx) / 2 + 5, (ty + by) / 2 - 7, bx - 1, by - 1);
      ctx.stroke();

      ctx.restore();
    };

    // Draw 4 dense branching limbs gnarling out under foliage
    drawGnarledBranch(64, 64, 28, 28, 9);
    drawGnarledBranch(64, 64, 100, 28, 9);
    drawGnarledBranch(64, 64, 28, 100, 8);
    drawGnarledBranch(64, 64, 100, 100, 8);

    // 4. Overlapping Foliage Canopy Cushions (volure-shaded leaf clusters)
    const drawDetailedFoliageCluster = (fx: number, fy: number, r: number) => {
      ctx.save();

      // A. Deep base leaf shadow layer matching the moody forest floor of reference
      const gradBase = ctx.createRadialGradient(fx, fy, r * 0.1, fx, fy, r);
      gradBase.addColorStop(0, '#010609'); // deep shadow
      gradBase.addColorStop(0.7, '#041d1a'); // dark navy-spruce shadow
      gradBase.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradBase;
      ctx.beginPath();
      ctx.arc(fx, fy, r, 0, Math.PI * 2);
      ctx.fill();

      // B. Mid-tone high-contrast blue-green layer (offset slightly for depth)
      const gradMid = ctx.createRadialGradient(fx - r * 0.12, fy - r * 0.12, 1, fx - r * 0.12, fy - r * 0.12, r * 0.85);
      gradMid.addColorStop(0, '#0d5c4e'); // rich teal-jade
      gradMid.addColorStop(0.7, '#042d24'); // deep spruce
      gradMid.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradMid;
      ctx.beginPath();
      ctx.arc(fx - r * 0.05, fy - r * 0.05, r * 0.82, 0, Math.PI * 2);
      ctx.fill();

      // C. Luminous top-foliage crown highlight caps (painting volumetric tree layers)
      const gradHigh = ctx.createRadialGradient(fx - r * 0.25, fy - r * 0.25, 0, fx - r * 0.25, fy - r * 0.25, r * 0.5);
      gradHigh.addColorStop(0, '#0ea5e9'); // bright sky cyan highlight
      gradHigh.addColorStop(0.5, '#0d9488'); // beautiful teal-green base
      gradHigh.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradHigh;
      ctx.beginPath();
      ctx.arc(fx - r * 0.15, fy - r * 0.15, r * 0.55, 0, Math.PI * 2);
      ctx.fill();

      // D. Fine graphic leaf speck highlights poking out the top
      ctx.fillStyle = '#6ee7b7'; // beautiful ambient silver-mint leaf flecks
      for (let j = 0; j < 14; j++) {
        const lx = fx - r * 0.4 + (Math.random() - 0.5) * r * 0.7;
        const ly = fy - r * 0.4 + (Math.random() - 0.5) * r * 0.7;
        ctx.beginPath();
        ctx.ellipse(lx, ly, 3, 1.8, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    };

    // Draw multi-layered tree crown
    drawDetailedFoliageCluster(64, 64, 52);       // Central core
    drawDetailedFoliageCluster(40, 44, 38);       // Top-left
    drawDetailedFoliageCluster(88, 48, 38);       // Top-right
    drawDetailedFoliageCluster(48, 84, 34);       // Bottom-left
    drawDetailedFoliageCluster(80, 80, 36);       // Bottom-right

    // Draw a sunlit foliage clump directly covering the central trunk
    drawDetailedFoliageCluster(64, 56, 26);

    tm.addCanvas('forest-tree', canvas);
  }

  // 17. VILLAGE SETTING SCENE 1 - BACKGROUND 1 (Tin-roof house, lantern, full moon, gnarled tree, tied torch)
  if (!tm.exists('scene1-bg1')) {
    const { canvas, ctx } = createCtx(1280, 720);

    // Dark blue/indigo night sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 400);
    skyGrad.addColorStop(0, '#020512');
    skyGrad.addColorStop(1, '#0e1a35');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 1280, 720);

    // Stars
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    const starPositions = [
      [100, 60], [220, 120], [310, 80], [450, 160], [520, 50],
      [640, 140], [710, 70], [830, 150], [950, 90], [1050, 110], [1180, 130],
      [150, 190], [280, 210], [400, 240], [580, 200], [740, 250], [890, 210],
      [1020, 230], [1150, 180]
    ];
    starPositions.forEach(pos => {
      ctx.beginPath();
      ctx.arc(pos[0], pos[1], Math.random() * 1.5 + 0.8, 0, Math.PI*2);
      ctx.fill();
    });

    // Full Moon
    const mX = 540;
    const mY = 120;
    const mR = 40;
    const moonGrad = ctx.createRadialGradient(mX, mY, 0, mX, mY, mR * 1.5);
    moonGrad.addColorStop(0, 'rgba(255, 255, 240, 1)');
    moonGrad.addColorStop(0.3, 'rgba(255, 255, 220, 0.6)');
    moonGrad.addColorStop(1, 'rgba(255, 255, 220, 0)');
    ctx.fillStyle = moonGrad;
    ctx.beginPath();
    ctx.arc(mX, mY, mR * 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fffff5';
    ctx.beginPath();
    ctx.arc(mX, mY, mR, 0, Math.PI * 2);
    ctx.fill();

    // Craters on moon
    ctx.fillStyle = '#e8e4c8';
    ctx.beginPath();
    ctx.arc(mX - 12, mY - 14, 8, 0, Math.PI*2);
    ctx.arc(mX + 16, mY + 10, 6, 0, Math.PI*2);
    ctx.arc(mX - 5, mY + 18, 5, 0, Math.PI*2);
    ctx.fill();

    // Far background hills
    ctx.fillStyle = '#0a1024';
    ctx.beginPath();
    ctx.moveTo(0, 480);
    ctx.quadraticCurveTo(300, 410, 600, 450);
    ctx.quadraticCurveTo(900, 420, 1280, 460);
    ctx.lineTo(1280, 720);
    ctx.lineTo(0, 720);
    ctx.closePath();
    ctx.fill();

    // Ground/Dirt: Charcoal brown
    ctx.fillStyle = '#1c1612';
    ctx.fillRect(0, 460, 1280, 260);

    // Midground smaller houses
    const drawMidgroundHut = (x: number, y: number, color: string, colorRoof: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(x - 30, y, 60, 45);
      ctx.fillStyle = '#08080c';
      ctx.fillRect(x - 6, y + 15, 12, 18);
      ctx.fillStyle = colorRoof;
      ctx.beginPath();
      ctx.moveTo(x - 40, y);
      ctx.lineTo(x, y - 25);
      ctx.lineTo(x + 40, y);
      ctx.closePath();
      ctx.fill();
    };
    drawMidgroundHut(380, 390, '#554260', '#3b2f42');
    drawMidgroundHut(520, 395, '#5c635d', '#3e423f');
    drawMidgroundHut(640, 400, '#3e4450', '#252932');

    // Foreground House Left: Yellow-Green mud wall and silver tin roof (Image 1)
    const hX = 220;
    const hY = 460;
    ctx.fillStyle = '#838e55';
    ctx.fillRect(hX - 160, hY - 140, 280, 190);

    // Foundation
    ctx.fillStyle = '#4c5240';
    ctx.fillRect(hX - 170, hY + 50, 300, 20);

    // Dark doorway
    ctx.fillStyle = '#121510';
    ctx.fillRect(hX - 100, hY - 80, 55, 130);
    ctx.strokeStyle = '#523a28';
    ctx.lineWidth = 4;
    ctx.strokeRect(hX - 100, hY - 80, 55, 130);

    // Hanging warm lantern light glow
    const lX = hX + 60;
    const lY = hY - 90;
    const glowGrad = ctx.createRadialGradient(lX, lY, 0, lX, lY, 110);
    glowGrad.addColorStop(0, 'rgba(255, 220, 100, 0.95)');
    glowGrad.addColorStop(0.3, 'rgba(255, 190, 50, 0.5)');
    glowGrad.addColorStop(1, 'rgba(255, 190, 50, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(lX, lY, 110, 0, Math.PI * 2);
    ctx.fill();

    // Corrugated Tin Roof on Left House
    ctx.fillStyle = '#9aa1a8';
    ctx.beginPath();
    ctx.moveTo(hX - 180, hY - 140);
    ctx.lineTo(hX + 130, hY - 140);
    ctx.lineTo(hX + 110, hY - 210);
    ctx.lineTo(hX - 180, hY - 210);
    ctx.closePath();
    ctx.fill();

    // Corrugation lines
    ctx.strokeStyle = '#62686e';
    ctx.lineWidth = 2.5;
    for (let rx = hX - 170; rx < hX + 120; rx += 14) {
      ctx.beginPath();
      ctx.moveTo(rx, hY - 142);
      ctx.lineTo(rx - 15, hY - 208);
      ctx.stroke();
    }

    // Lantern fixture
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.strokeRect(lX - 8, lY - 12, 16, 24);
    ctx.fillStyle = '#ffe04a';
    ctx.fillRect(lX - 6, lY - 10, 12, 20);

    // Tree + Tied Blazing Torch on Right (Image 1)
    ctx.fillStyle = '#3a2512';
    ctx.beginPath();
    ctx.moveTo(1100, 720);
    ctx.quadraticCurveTo(1130, 400, 1180, 100);
    ctx.lineTo(1280, 100);
    ctx.lineTo(1280, 720);
    ctx.closePath();
    ctx.fill();

    // Foliage
    ctx.fillStyle = '#1e3814';
    ctx.beginPath();
    ctx.arc(1140, 180, 90, 0, Math.PI*2);
    ctx.arc(1220, 120, 110, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#11220a';
    ctx.beginPath();
    ctx.arc(1100, 140, 70, 0, Math.PI*2);
    ctx.fill();

    // Torch handle + bindings
    const tX = 1110;
    const tY = 405;
    ctx.strokeStyle = '#5a3d28';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(tX + 15, tY + 45);
    ctx.lineTo(tX - 15, tY - 15);
    ctx.stroke();
    // Rope tie
    ctx.strokeStyle = '#eaeaea';
    ctx.lineWidth = 3;
    ctx.strokeRect(tX - 2, tY + 12, 12, 6);

    // Fire glow
    const fireGlow = ctx.createRadialGradient(tX - 15, tY - 15, 0, tX - 15, tY - 15, 90);
    fireGlow.addColorStop(0, 'rgba(255, 130, 0, 0.95)');
    fireGlow.addColorStop(0.3, 'rgba(255, 60, 0, 0.5)');
    fireGlow.addColorStop(1, 'rgba(255, 50, 0, 0)');
    ctx.fillStyle = fireGlow;
    ctx.beginPath();
    ctx.arc(tX - 15, tY - 15, 90, 0, Math.PI * 2);
    ctx.fill();

    // Fire flames
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo(tX - 15, tY - 15);
    ctx.quadraticCurveTo(tX - 35, tY - 55, tX - 15, tY - 75);
    ctx.quadraticCurveTo(tX, tY - 45, tX + 5, tY - 15);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ff3300';
    ctx.beginPath();
    ctx.moveTo(tX - 15, tY - 15);
    ctx.quadraticCurveTo(tX - 25, tY - 40, tX - 15, tY - 55);
    ctx.quadraticCurveTo(tX - 5, tY - 35, tX, tY - 15);
    ctx.closePath();
    ctx.fill();

    tm.addCanvas('scene1-bg1', canvas);
  }

  // 18. VILLAGE SETTING SCENE 1 - BACKGROUND 2 (Symmetric thatch-roof huts, path, fields, palms)
  if (!tm.exists('scene1-bg2')) {
    const { canvas, ctx } = createCtx(1280, 720);

    // Luminous blue nightsky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 450);
    skyGrad.addColorStop(0, '#020b24');
    skyGrad.addColorStop(1, '#1b3b7a');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 1280, 720);

    // Starry sparkles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    for (let i = 0; i < 45; i++) {
      ctx.fillRect(Math.random() * 1280, Math.random() * 300, 2, 2);
    }

    // Giant Luminous Full Moon
    const mX = 640;
    const mY = 160;
    const mR = 64;
    const glow = ctx.createRadialGradient(mX, mY, 0, mX, mY, mR * 1.8);
    glow.addColorStop(0, 'rgba(240, 255, 255, 0.95)');
    glow.addColorStop(0.3, 'rgba(195, 230, 255, 0.45)');
    glow.addColorStop(1, 'rgba(200, 240, 255, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(mX, mY, mR * 1.8, 0, Math.PI*2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(mX, mY, mR, 0, Math.PI*2);
    ctx.fill();

    // Craters on central giant moon
    ctx.fillStyle = '#dbe5eb';
    ctx.beginPath();
    ctx.arc(mX - 18, mY - 22, 12, 0, Math.PI*2);
    ctx.arc(mX + 24, mY + 16, 9, 0, Math.PI*2);
    ctx.arc(mX - 12, mY + 28, 8, 0, Math.PI*2);
    ctx.fill();

    // Farmland Fields: Green paddies pattern
    const fieldsY = 400;
    ctx.fillStyle = '#06291a';
    ctx.fillRect(0, fieldsY, 1280, 320);

    // Rice grids
    ctx.strokeStyle = '#0a3d24';
    ctx.lineWidth = 1.5;
    for (let ly = fieldsY; ly < 530; ly += 24) {
      ctx.beginPath();
      ctx.moveTo(0, ly);
      ctx.lineTo(1280, ly);
      ctx.stroke();
    }
    for (let lx = 0; lx <= 1280; lx += 114) {
      ctx.beginPath();
      ctx.moveTo(lx, 720);
      ctx.lineTo(640 + (lx - 640) * 0.08, fieldsY);
      ctx.stroke();
    }

    // Dirt pathway leading directly center-background
    ctx.fillStyle = '#6e6355';
    ctx.beginPath();
    ctx.moveTo(400, 720);
    ctx.lineTo(880, 720);
    ctx.lineTo(650, fieldsY);
    ctx.lineTo(630, fieldsY);
    ctx.closePath();
    ctx.fill();

    // Grass edges
    ctx.fillStyle = '#103d21';
    ctx.beginPath();
    ctx.moveTo(0, 520);
    ctx.lineTo(410, 720);
    ctx.lineTo(0, 720);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(1280, 520);
    ctx.lineTo(870, 720);
    ctx.lineTo(1280, 720);
    ctx.closePath();
    ctx.fill();

    // Function to draw symmetric thatch mud huts
    const drawForegroundHut = (x: number, y: number, side: 'left' | 'right') => {
      const scaleWidth = 140;
      const scaleHeight = 100;

      // Mud clay wall
      ctx.fillStyle = '#536582';
      ctx.fillRect(x - scaleWidth*0.5, y - scaleHeight, scaleWidth, scaleHeight);

      // Wood foundation
      ctx.fillStyle = '#211e15';
      ctx.fillRect(x - scaleWidth*0.53, y, scaleWidth*1.06, 12);

      // Dark open door in center
      ctx.fillStyle = '#060608';
      ctx.fillRect(x - 18, y - 55, 36, 55);

      // Windows with warm light inside
      ctx.fillStyle = '#65421c';
      ctx.fillRect(side === 'left' ? x - 50 : x + 25, y - 75, 24, 20);
      ctx.fillStyle = '#ffeaa0';
      ctx.fillRect(side === 'left' ? x - 48 : x + 27, y - 73, 20, 16);

      // Thatch Roof
      ctx.fillStyle = '#9e7e59';
      ctx.beginPath();
      if (side === 'left') {
        ctx.moveTo(x - scaleWidth*0.62, y - scaleHeight);
        ctx.lineTo(x + scaleWidth*0.52, y - scaleHeight);
        ctx.lineTo(x, y - scaleHeight - 65);
      } else {
        ctx.moveTo(x - scaleWidth*0.52, y - scaleHeight);
        ctx.lineTo(x + scaleWidth*0.62, y - scaleHeight);
        ctx.lineTo(x, y - scaleHeight - 65);
      }
      ctx.closePath();
      ctx.fill();

      // Straw striations
      ctx.strokeStyle = '#5a4631';
      ctx.lineWidth = 1.5;
      for (let angle = Math.PI; angle < Math.PI * 2; angle += Math.PI / 12) {
        ctx.beginPath();
        ctx.moveTo(x, y - scaleHeight - 65);
        ctx.lineTo(x + Math.cos(angle) * (scaleWidth*0.6), y - scaleHeight - Math.sin(angle)*15);
        ctx.stroke();
      }

      // Wooden eaves pillar support
      ctx.fillStyle = '#211e15';
      ctx.fillRect(side === 'left' ? x - scaleWidth*0.58 : x + scaleWidth*0.48, y - scaleHeight, 6, scaleHeight);
    };

    drawForegroundHut(180, 680, 'left');
    drawForegroundHut(1100, 680, 'right');

    // Palm tree silhouettes in midground
    const drawPalm = (px: number, py: number) => {
      ctx.strokeStyle = '#051910';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.quadraticCurveTo(px + 15, py - 60, px + 5, py - 110);
      ctx.stroke();

      ctx.fillStyle = '#051910';
      const fx = px + 5;
      const fy = py - 110;
      const drawFrond = (ang: number) => {
        ctx.save();
        ctx.translate(fx, fy);
        ctx.rotate(ang);
        ctx.beginPath();
        ctx.ellipse(30, 0, 30, 5, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
      };
      drawFrond(0);
      drawFrond(Math.PI/6);
      drawFrond(-Math.PI/6);
      drawFrond(Math.PI*5/6);
      drawFrond(Math.PI*7/6);
      drawFrond(Math.PI/2);
    };
    drawPalm(350, 480);
    drawPalm(910, 490);

    tm.addCanvas('scene1-bg2', canvas);
  }

  // 19. THORNY BUSH HAZARD (Sharp brambles and thorns with red toxic colors)
  if (!tm.exists('thorn-bush')) {
    const { canvas, ctx } = createCtx(48, 48);
    // Draw shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(24, 30, 20, 9, 0, 0, Math.PI*2);
    ctx.fill();

    // Bramble branches: Dark overlapping greens and browns
    ctx.strokeStyle = '#1a0d22'; // deep dark violet/wood
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    // Intertwined bramble rings and curves
    ctx.arc(24, 24, 14, 0, Math.PI * 1.5);
    ctx.arc(20, 24, 11, Math.PI * 0.5, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#233c16'; // deep dark green branch highlight
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(8, 24); ctx.bezierCurveTo(16, 12, 32, 12, 40, 24);
    ctx.moveTo(12, 12); ctx.bezierCurveTo(24, 36, 24, 12, 36, 36);
    ctx.stroke();

    // Sharp white-gray thorns
    const drawThorn = (x: number, y: number, angle: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      
      // Thorn shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.moveTo(0, 1);
      ctx.lineTo(8, 0);
      ctx.lineTo(0, -5);
      ctx.closePath();
      ctx.fill();

      // Sharp white spike body
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(7, -1.8);
      ctx.lineTo(0, -4.5);
      ctx.closePath();
      ctx.fill();
      
      // Bright blue energy tip
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(7, -1.8, 1.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };
    drawThorn(16, 24, 0);
    drawThorn(32, 24, Math.PI);
    drawThorn(24, 16, Math.PI / 2);
    drawThorn(24, 32, -Math.PI / 2);
    drawThorn(16, 16, Math.PI / 4);
    drawThorn(32, 32, -Math.PI * 3 / 4);

    // Warning Crimson elderberries
    const drawGlossyBerry = (bx: number, by: number, r: number) => {
      ctx.fillStyle = '#dc2626'; // primary deep blood red
      ctx.beginPath();
      ctx.arc(bx, by, r, 0, Math.PI * 2);
      ctx.fill();

      // Sunlit side orange crescent
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(bx - r * 0.2, by - r * 0.2, r * 0.6, 0, Math.PI * 2);
      ctx.fill();

      // Tiny white specular highlight dot (makes it look beautifully wet/glossy!)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(bx - r * 0.4, by - r * 0.4, 1, 0, Math.PI * 2);
      ctx.fill();
    };
    drawGlossyBerry(14, 20, 3);
    drawGlossyBerry(34, 28, 3.5);
    drawGlossyBerry(28, 14, 3);

    tm.addCanvas('thorn-bush', canvas);
  }

  // Beautiful lush green forest shrubs (depth overlay decoration)
  if (!tm.exists('forest-shrub')) {
    const { canvas, ctx } = createCtx(80, 80);
    
    // Low shadow underneath the shrub
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(40, 46, 32, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Layers of vibrant green leaf puffs
    const drawDetailedPuff = (lx: number, ly: number, r: number, shadeColor: string, litColor: string) => {
      // Base dark under-puff shadow
      ctx.fillStyle = shadeColor;
      ctx.beginPath();
      ctx.arc(lx, ly, r, 0, Math.PI * 2);
      ctx.fill();

      // Highlighted sunlit overlay cap (creating a 3D bubble effect)
      const litGrad = ctx.createRadialGradient(lx - r * 0.2, ly - r * 0.2, 0, lx - r * 0.2, ly - r * 0.2, r * 0.95);
      litGrad.addColorStop(0, litColor);
      litGrad.addColorStop(0.7, shadeColor);
      litGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = litGrad;
      ctx.beginPath();
      ctx.arc(lx - r * 0.05, ly - r * 0.05, r * 0.9, 0, Math.PI * 2);
      ctx.fill();
    };

    // Deep forest base greens
    drawDetailedPuff(26, 38, 19, '#051909', '#0d3817');
    drawDetailedPuff(54, 40, 17, '#041507', '#0a3311');
    drawDetailedPuff(40, 24, 21, '#07200c', '#10461b');

    // Rich mid layers
    drawDetailedPuff(32, 32, 14, '#0d3515', '#1e622b');
    drawDetailedPuff(48, 34, 15, '#0e3917', '#22692f');

    // Bright highlighted top-leaves
    drawDetailedPuff(36, 24, 11, '#165022', '#2f9547');
    drawDetailedPuff(45, 27, 10, '#195b28', '#38b255');
    drawDetailedPuff(40, 38, 13, '#11441c', '#27813a');

    // Tiny golden forest spore spots (glowing specs)
    ctx.fillStyle = 'rgba(167, 243, 208, 0.75)'; // sparkling mint/emerald
    const drawSporeSpec = (sx: number, sy: number) => {
      ctx.beginPath();
      ctx.arc(sx, sy, 1.8, 0, Math.PI * 2);
      ctx.fill();
    };
    drawSporeSpec(28, 26);
    drawSporeSpec(52, 28);
    drawSporeSpec(42, 16);

    tm.addCanvas('forest-shrub', canvas);
  }

  // 20. DARK LIQUID POOL HAZARD (Corrupt toxic liquid bubbling)
  if (!tm.exists('dark-pool')) {
    const { canvas, ctx } = createCtx(96, 96);
    const grad = ctx.createRadialGradient(48, 48, 0, 48, 48, 48);
    grad.addColorStop(0, 'rgba(15, 0, 32, 0.95)');
    grad.addColorStop(0.5, 'rgba(46, 8, 85, 0.85)');
    grad.addColorStop(0.8, 'rgba(105, 20, 160, 0.45)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(48, 48, 48, 0, Math.PI * 2);
    ctx.fill();

    // Bubbles
    ctx.fillStyle = 'rgba(190, 60, 255, 0.75)';
    ctx.beginPath();
    ctx.arc(36, 40, 5, 0, Math.PI*2);
    ctx.arc(60, 56, 4, 0, Math.PI*2);
    ctx.arc(52, 32, 6, 0, Math.PI*2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.arc(34, 38, 1.5, 0, Math.PI*2);
    ctx.arc(50, 30, 2, 0, Math.PI*2);
    ctx.fill();

    tm.addCanvas('dark-pool', canvas);
  }

  // 21. SUTHERLANDIA HEALING HERB (Glowing native red-flowered healing botanical)
  if (!tm.exists('sutherlandia-herb')) {
    const { canvas, ctx } = createCtx(48, 48);
    
    // Ambient glowing green/gold ring
    const glowGrad = ctx.createRadialGradient(24, 24, 2, 24, 24, 22);
    glowGrad.addColorStop(0, 'rgba(16, 185, 129, 0.45)');
    glowGrad.addColorStop(0.5, 'rgba(251, 191, 36, 0.15)');
    glowGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(24, 24, 22, 0, Math.PI * 2);
    ctx.fill();

    // Soft Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.arc(24, 26, 8, 0, Math.PI * 2);
    ctx.fill();

    // Vibrant green star leaves structure
    ctx.fillStyle = '#059669'; // Forest emerald green
    const drawLeaf = (angle: number) => {
      ctx.save();
      ctx.translate(24, 24);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-6, -12, 0, -18);
      ctx.quadraticCurveTo(6, -12, 0, 0);
      ctx.closePath();
      ctx.fill();
      // Rib line
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -15);
      ctx.stroke();
      ctx.restore();
    };
    for (let r = 0; r < Math.PI * 2; r += Math.PI / 3) {
      drawLeaf(r);
    }

    // Gorgeous Scarlet/Orange Sutherlandia Flowers in the center
    ctx.fillStyle = '#ee0000'; // Bright blazing crimson-scarlet
    const drawFlower = (dx: number, dy: number, size: number) => {
      ctx.beginPath();
      ctx.arc(24 + dx, 24 + dy, size, 0, Math.PI * 2);
      ctx.fill();
      // Glowing highlight
      ctx.fillStyle = '#f59e0b'; // Amber stamen
      ctx.beginPath();
      ctx.arc(24 + dx, 24 + dy, size * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ee0000';
    };
    drawFlower(-4, -4, 5);
    drawFlower(4, -4, 4.5);
    drawFlower(0, 4, 5.5);

    // Glowing spark sparkles
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(23, 23, 2, 2);
    ctx.fillRect(14, 18, 1.5, 1.5);
    ctx.fillRect(32, 28, 1.5, 1.5);

    tm.addCanvas('sutherlandia-herb', canvas);
  }

  // --- 15. DETAILED FOREST ACCESSORIES (FERN CLUMPS, OVERLAYS & GOD RAYS matching the reference forest design) ---
  if (!tm.exists('forest-fern-clump')) {
    const { canvas, ctx } = createCtx(64, 64);

    // Subtle dark round shadow underneath
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.arc(32, 32, 22, 0, Math.PI * 2);
    ctx.fill();

    // Draw 14 radiating serrated leaflets pointing outward in a circular ring
    const numLeaflets = 14;
    const innerR = 10;
    const outerR = 26;

    for (let i = 0; i < numLeaflets; i++) {
      const angle = (i / numLeaflets) * Math.PI * 2;
      const nextAngle = ((i + 0.82) / numLeaflets) * Math.PI * 2;
      const midAngle = (angle + nextAngle) / 2;

      ctx.fillStyle = '#064e3b'; // deep green shadow
      ctx.beginPath();
      ctx.moveTo(32 + Math.cos(angle) * innerR, 32 + Math.sin(angle) * innerR);
      ctx.quadraticCurveTo(
        32 + Math.cos(midAngle) * (outerR + 4), 
        32 + Math.sin(midAngle) * (outerR + 4),
        32 + Math.cos(nextAngle) * innerR,
        32 + Math.sin(nextAngle) * innerR
      );
      ctx.closePath();
      ctx.fill();

      // Sunlit highlighted interior of leaflet
      ctx.fillStyle = '#16a34a'; // mid green
      ctx.beginPath();
      ctx.moveTo(32 + Math.cos(angle) * (innerR + 3), 32 + Math.sin(angle) * (innerR + 3));
      ctx.quadraticCurveTo(
        32 + Math.cos(midAngle) * (outerR - 1), 
        32 + Math.sin(midAngle) * (outerR - 1),
        32 + Math.cos(nextAngle) * (innerR + 3),
        32 + Math.sin(nextAngle) * (innerR + 3)
      );
      ctx.closePath();
      ctx.fill();

      // Sharp golden-green/lime tips of the serrations exactly like the image guide
      ctx.strokeStyle = '#85e043'; // Lime green tips
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(32 + Math.cos(midAngle) * (innerR + 4), 32 + Math.sin(midAngle) * (innerR + 4));
      ctx.lineTo(32 + Math.cos(midAngle) * outerR, 32 + Math.sin(midAngle) * outerR);
      ctx.stroke();
    }

    // Inner hollow dark moss ring
    ctx.fillStyle = '#02150d'; // ultra dark green core
    ctx.beginPath();
    ctx.arc(32, 32, 10, 0, Math.PI * 2);
    ctx.fill();

    // Accent mini sprouts inside
    ctx.fillStyle = '#a3e635';
    ctx.beginPath();
    ctx.arc(30, 29, 2, 0, Math.PI * 2);
    ctx.arc(35, 33, 1.5, 0, Math.PI * 2);
    ctx.fill();

    tm.addCanvas('forest-fern-clump', canvas);
  }

  if (!tm.exists('forest-canopy-overlay')) {
    const { canvas, ctx } = createCtx(256, 256);

    // Deep heavy branch base
    ctx.strokeStyle = '#050201';
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(128, 48, 256, 128);
    ctx.stroke();

    ctx.strokeStyle = '#1d0c04';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(128, 48, 256, 128);
    ctx.stroke();

    // Function to draw bulky clusters of dark, leafy foliage
    const drawMegaLeafPuff = (fx: number, fy: number, r: number) => {
      // 1. Shadow backing
      const gradShadow = ctx.createRadialGradient(fx, fy, 0, fx, fy, r);
      gradShadow.addColorStop(0, '#020d0b');
      gradShadow.addColorStop(0.7, '#010504');
      gradShadow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradShadow;
      ctx.beginPath();
      ctx.arc(fx, fy, r, 0, Math.PI * 2);
      ctx.fill();

      // 2. Base leafy green
      const gradBase = ctx.createRadialGradient(fx - r * 0.1, fy - r * 0.1, 0, fx - r * 0.1, fy - r * 0.1, r * 0.95);
      gradBase.addColorStop(0, '#074e3b'); // dark emerald
      gradBase.addColorStop(0.65, '#022c22'); // deep forest
      gradBase.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradBase;
      ctx.beginPath();
      ctx.arc(fx - r * 0.05, fy - r * 0.05, r * 0.9, 0, Math.PI * 2);
      ctx.fill();

      // 3. Middle jade layer
      const gradMid = ctx.createRadialGradient(fx - r * 0.2, fy - r * 0.2, 0, fx - r * 0.2, fy - r * 0.2, r * 0.7);
      gradMid.addColorStop(0, '#10b981'); // beautiful active emerald
      gradMid.addColorStop(0.7, '#047857'); // dark emerald
      gradMid.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradMid;
      ctx.beginPath();
      ctx.arc(fx - r * 0.1, fy - r * 0.1, r * 0.7, 0, Math.PI * 2);
      ctx.fill();

      // 4. Little individual highlight leaves
      ctx.fillStyle = '#6ee7b7'; // Mint green leaves
      for (let i = 0; i < 15; i++) {
        const lx = fx - r * 0.4 + Math.random() * r * 0.8;
        const ly = fy - r * 0.4 + Math.random() * r * 0.8;
        ctx.beginPath();
        ctx.ellipse(lx, ly, 5, 2.5, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // Draw overlapping mega leaf clusters outlining a vignette structure
    drawMegaLeafPuff(64, 64, 80);
    drawMegaLeafPuff(180, 110, 95);
    drawMegaLeafPuff(110, 170, 75);
    drawMegaLeafPuff(220, 200, 70);
    drawMegaLeafPuff(30, 120, 65);

    tm.addCanvas('forest-canopy-overlay', canvas);
  }

  if (!tm.exists('forest-light-ray')) {
    const { canvas, ctx } = createCtx(200, 600);
    // Draw a skewed diagonal golden sun god-ray with soft radial feather edges
    const grad = ctx.createLinearGradient(0, 0, 200, 600);
    grad.addColorStop(0, 'rgba(253, 224, 71, 0.22)'); // gentle gold yellow
    grad.addColorStop(0.4, 'rgba(52, 211, 153, 0.10)'); // soft mint-green transition
    grad.addColorStop(1, 'rgba(253, 224, 71, 0)');
    ctx.fillStyle = grad;

    // Draw beautiful dust-mote rays
    ctx.beginPath();
    ctx.moveTo(30, 0);
    ctx.lineTo(170, 0);
    ctx.lineTo(200, 600);
    ctx.lineTo(0, 600);
    ctx.closePath();
    ctx.fill();

    // Drifting sparkling dust motes inside the ray
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    for (let i = 0; i < 15; i++) {
      const rx = 20 + Math.random() * 160;
      const ry = 50 + Math.random() * 500;
      const radius = 1 + Math.random() * 2.2;
      ctx.beginPath();
      ctx.arc(rx, ry, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    tm.addCanvas('forest-light-ray', canvas);
  }
}

