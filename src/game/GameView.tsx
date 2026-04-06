import { useRef, useEffect, useCallback, useState } from 'react';
import type { CSSProperties } from 'react';
import type { GameState } from './types';
import { renderView, viewToMap } from './renderer';
import type { RenderCell } from './renderer';
import { handleTapMove } from './engine';
import { safeEngineCall } from './errorReporting';
import { cloneState, gpStart, gpEnd } from './utils';
import { Minimap } from './Minimap';

const CELL_W = 18;
const CELL_H = 26;

// ── Sprite cache: pre-render char+color+scale combos as tiny canvases ──
const _spriteCache = new Map<string, HTMLCanvasElement>();
const _baseFontSize = CELL_H - 2;

function getSprite(char: string, color: string, scale: number): HTMLCanvasElement {
  const key = `${char}|${color}|${scale}`;
  let sprite = _spriteCache.get(key);
  if (sprite) return sprite;

  const fontSize = Math.round(_baseFontSize * scale);
  const w = Math.ceil(CELL_W * Math.max(scale, 1));
  const h = Math.ceil(CELL_H * Math.max(scale, 1));

  sprite = document.createElement('canvas');
  sprite.width = w;
  sprite.height = h;
  const ctx = sprite.getContext('2d')!;
  ctx.font = `bold ${fontSize}px monospace`;
  ctx.textBaseline = 'top';
  ctx.fillStyle = color;
  if (scale !== 1) {
    const xOff = (CELL_W - CELL_W * scale) / 2;
    const yOff = (CELL_H - fontSize) / 2;
    ctx.fillText(char, Math.max(0, xOff), Math.max(0, yOff));
  } else {
    ctx.fillText(char, 0, 1);
  }

  _spriteCache.set(key, sprite);
  // Cap cache to prevent unbounded growth
  if (_spriteCache.size > 2000) {
    const first = _spriteCache.keys().next().value;
    if (first) _spriteCache.delete(first);
  }
  return sprite;
}

// ── Fast grid fingerprint — produces a numeric hash of the visible grid ──
// Uses FNV-1a hash variant for speed. Avoids string allocations entirely.
function gridFingerprint(grid: RenderCell[][], rows: number, cols: number): number {
  let hash = 2166136261; // FNV offset basis
  for (let y = 0; y < rows; y++) {
    const row = grid[y];
    if (!row) continue;
    for (let x = 0; x < cols; x++) {
      const c = row[x];
      if (!c) continue;
      // Hash visually meaningful fields
      for (let i = 0; i < c.char.length; i++) {
        hash ^= c.char.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
      }
      for (let i = 0; i < c.color.length; i++) {
        hash ^= c.color.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
      }
      for (let i = 0; i < c.bg.length; i++) {
        hash ^= c.bg.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
      }
      if (c.glow) {
        for (let i = 0; i < c.glow.length; i++) {
          hash ^= c.glow.charCodeAt(i);
          hash = Math.imul(hash, 16777619);
        }
      }
      if (c.hpBar) {
        hash ^= Math.round(c.hpBar.pct * 1000);
        hash = Math.imul(hash, 16777619);
      }
      if (c.fontScale && c.fontScale !== 1) {
        hash ^= Math.round(c.fontScale * 100);
        hash = Math.imul(hash, 16777619);
      }
    }
  }
  return hash >>> 0; // Convert to unsigned 32-bit
}

interface GameViewProps {
  state: GameState;
  onChange: (s: GameState) => void;
  onEnemyEncounter?: (enemyId: string, enemyName: string, enemy: import('./types').Entity, targetX: number, targetY: number) => Promise<boolean>;
}

export function GameView({ state, onChange, onEnemyEncounter }: GameViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewSize, setViewSize] = useState({ w: 30, h: 20 });
  const prevFingerprintRef = useRef<number>(0);
  const prevProjectilesRef = useRef<number>(0);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const dprRef = useRef<number>(1);

  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const w = Math.floor(rect.width / CELL_W);
      const h = Math.floor(rect.height / CELL_H);
      setViewSize({ w: Math.max(10, w), h: Math.max(8, h) });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Setup canvas dimensions only when viewSize changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pixelW = viewSize.w * CELL_W;
    const pixelH = viewSize.h * CELL_H;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    dprRef.current = dpr;

    canvas.width = pixelW * dpr;
    canvas.height = pixelH * dpr;
    canvas.style.width = `${pixelW}px`;
    canvas.style.height = `${pixelH}px`;

    const ctx = canvas.getContext('2d');
    ctxRef.current = ctx;
    // Force redraw after resize
    prevFingerprintRef.current = 0;
  }, [viewSize]);

  // Render — only redraws canvas when the visual output actually changes
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    gpStart('render:grid');
    const grid = renderView(state, viewSize.w, viewSize.h);
    gpEnd('render:grid');
    const projCount = state.projectiles?.length ?? 0;
    gpStart('render:fingerprint');
    const fp = gridFingerprint(grid, viewSize.h, viewSize.w);
    gpEnd('render:fingerprint');

    // Skip redraw if nothing visual changed
    if (fp === prevFingerprintRef.current && projCount === 0 && prevProjectilesRef.current === 0) {
      return;
    }
    prevFingerprintRef.current = fp;
    prevProjectilesRef.current = projCount;

    gpStart('render:draw');
    const pixelW = viewSize.w * CELL_W;
    const pixelH = viewSize.h * CELL_H;
    const dpr = dprRef.current;

    // Reset transform and apply DPR scale
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Clear to black
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, pixelW, pixelH);

    // Pass 1: Draw background tiles
    for (let vy = 0; vy < viewSize.h; vy++) {
      for (let vx = 0; vx < viewSize.w; vx++) {
        const cell = grid[vy]?.[vx];
        if (!cell || cell.bg === '#000000' || cell.bg === '#000') continue;

        ctx.fillStyle = cell.bg;
        ctx.fillRect(vx * CELL_W, vy * CELL_H, CELL_W, CELL_H);
      }
    }

    // Pass 2: Draw glow halos (simple solid fill)
    for (let vy = 0; vy < viewSize.h; vy++) {
      for (let vx = 0; vx < viewSize.w; vx++) {
        const cell = grid[vy]?.[vx];
        if (!cell?.glow) continue;

        const alphaMul = cell.glowAlpha ?? 0.15;
        ctx.fillStyle = hexToRgba(cell.glow, alphaMul);
        ctx.fillRect(vx * CELL_W - 2, vy * CELL_H - 2, CELL_W + 4, CELL_H + 4);
      }
    }

    // Pass 3: Draw characters using sprite cache (drawImage instead of fillText)
    for (let vy = 0; vy < viewSize.h; vy++) {
      for (let vx = 0; vx < viewSize.w; vx++) {
        const cell = grid[vy]?.[vx];
        if (!cell || cell.char === ' ') continue;

        const scale = cell.fontScale ?? 1;
        const sprite = getSprite(cell.char, cell.color, scale);
        if (scale !== 1) {
          const xOff = (CELL_W - CELL_W * scale) / 2;
          const yOff = (CELL_H - Math.round(_baseFontSize * scale)) / 2;
          ctx.drawImage(sprite, vx * CELL_W + xOff, vy * CELL_H + yOff);
        } else {
          ctx.drawImage(sprite, vx * CELL_W, vy * CELL_H);
        }
      }
    }

    // Pass 4: Draw monster HP bars
    for (let vy = 0; vy < viewSize.h; vy++) {
      for (let vx = 0; vx < viewSize.w; vx++) {
        const cell = grid[vy]?.[vx];
        if (!cell?.hpBar) continue;

        const barX = vx * CELL_W;
        const barY = vy * CELL_H + CELL_H - 3;
        const barW = CELL_W;
        const barH = 2;

        ctx.fillStyle = '#1a0a0a';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = cell.hpBar.color;
        ctx.fillRect(barX, barY, Math.max(1, Math.round(barW * cell.hpBar.pct)), barH);
      }
    }

    // Pass 5: Draw projectiles
    if (state.projectiles && state.projectiles.length > 0) {
      const { width, height } = state.floor;
      const camX = Math.max(0, Math.min(state.player.pos.x - Math.floor(viewSize.w / 2), width - viewSize.w));
      const camY = Math.max(0, Math.min(state.player.pos.y - Math.floor(viewSize.h / 2), height - viewSize.h));

      for (const proj of state.projectiles) {
        const sprite = getSprite(proj.char, proj.color, 1);
        let x0 = proj.from.x, y0 = proj.from.y;
        const x1 = proj.to.x, y1 = proj.to.y;
        const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;

        while (true) {
          const vx = x0 - camX;
          const vy = y0 - camY;
          if (vx >= 0 && vx < viewSize.w && vy >= 0 && vy < viewSize.h) {
            ctx.drawImage(sprite, vx * CELL_W, vy * CELL_H);
          }
          if (x0 === x1 && y0 === y1) break;
          const e2 = 2 * err;
          if (e2 > -dy) { err -= dy; x0 += sx; }
          if (e2 < dx) { err += dx; y0 += sy; }
        }
      }
    }
    gpEnd('render:draw');
  }, [state, viewSize]);

  const handleTap = useCallback(
    async (e: React.MouseEvent | React.TouchEvent) => {
      if (state.gameOver) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      let clientX: number;
      let clientY: number;
      if ('touches' in e) {
        const touch = e.touches[0];
        if (!touch) return;
        clientX = touch.clientX;
        clientY = touch.clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const rect = canvas.getBoundingClientRect();
      const vx = Math.floor((clientX - rect.left) / CELL_W);
      const vy = Math.floor((clientY - rect.top) / CELL_H);

      const mapPos = viewToMap(state, viewSize.w, viewSize.h, vx, vy);
      
      // Check for enemy encounter before moving
      if (onEnemyEncounter) {
        const targetEnemy = state.monsters.find(m => 
          !m.isDead && m.pos.x === mapPos.x && m.pos.y === mapPos.y
        );
        
        if (targetEnemy) {
          console.log('[GameView] Tap on enemy:', targetEnemy.name, 'at', mapPos.x, mapPos.y);
          const handledByEncounter = await onEnemyEncounter(targetEnemy.id, targetEnemy.name, targetEnemy, mapPos.x, mapPos.y);
          if (handledByEncounter) {
            console.log('[GameView] Enemy encounter triggered, skipping normal move');
            return; // Encounter dialogue is showing
          }
        }
      }

      const next = cloneState(state);
      const moved = safeEngineCall('handleTapMove', () => handleTapMove(next, mapPos.x, mapPos.y));
      if (moved === null) return; // engine error
      if (moved) onChange(next);
    },
    [state, viewSize, onChange, onEnemyEncounter],
  );

  // Attach a non-passive touchstart listener so preventDefault() works correctly
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onTouch = (e: TouchEvent) => {
      e.preventDefault();
      handleTap(e as unknown as React.TouchEvent);
    };
    canvas.addEventListener('touchstart', onTouch, { passive: false });
    return () => canvas.removeEventListener('touchstart', onTouch);
  }, [handleTap]);

  return (
    <div ref={containerRef} style={containerStyle}>
      <canvas
        ref={canvasRef}
        style={canvasStyle}
        onClick={handleTap}
      />
      <Minimap state={state} />
    </div>
  );
}

/** Convert a hex color to rgba string */
function hexToRgba(hex: string, alpha: number): string {
  if (hex.startsWith('rgb')) return hex;
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  return `rgba(${r},${g},${b},${alpha})`;
}

const containerStyle: CSSProperties = {
  flex: 1,
  width: '100%',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#000',
  position: 'relative',
};

const canvasStyle: CSSProperties = {
  imageRendering: 'pixelated',
  touchAction: 'none',
};
