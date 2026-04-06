import { useRef, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import type { GameState } from './types';
import { Tile } from './types';
import { getTile, isWalkableTile } from './dungeon';

interface MinimapProps {
  state: GameState;
}

const PIXEL = 2; // Each map tile = 2x2 pixels on the minimap

export function Minimap({ state }: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [expanded, setExpanded] = useState(false);

  const scale = expanded ? 3 : PIXEL;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { floor, player, monsters, items } = state;
    const w = floor.width;
    const h = floor.height;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pixelW = w * scale;
    const pixelH = h * scale;

    canvas.width = pixelW * dpr;
    canvas.height = pixelH * dpr;
    canvas.style.width = `${pixelW}px`;
    canvas.style.height = `${pixelH}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, pixelW, pixelH);

    // Draw explored tiles
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!floor.explored[y]?.[x]) continue;
        const tile = getTile(floor, x, y);

        if (tile === Tile.Wall) {
          ctx.fillStyle = '#1a2a1a';
        } else if (isWalkableTile(tile)) {
          ctx.fillStyle = tile === Tile.StairsDown ? '#ffffff' : '#0a3a0a';
        } else if (tile === Tile.Door) {
          ctx.fillStyle = '#2a4a1a';
        } else if (tile === Tile.BossGate) {
          ctx.fillStyle = '#4a1a1a';
        } else {
          continue;
        }

        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }

    // Draw items (small yellow dots) — only in explored areas
    if (expanded) {
      ctx.fillStyle = '#ccaa22';
      for (const mi of items) {
        if (!floor.explored[mi.pos.y]?.[mi.pos.x]) continue;
        ctx.fillRect(mi.pos.x * scale, mi.pos.y * scale, scale, scale);
      }
    }

    // Draw monsters (red dots) — only visible ones
    ctx.fillStyle = '#cc2222';
    for (const m of monsters) {
      if (m.isDead) continue;
      if (!floor.visible[m.pos.y]?.[m.pos.x]) continue;
      ctx.fillRect(m.pos.x * scale, m.pos.y * scale, scale, scale);
      if (m.isBoss) {
        // Boss gets a larger dot
        ctx.fillStyle = '#ff3333';
        ctx.fillRect(m.pos.x * scale - 1, m.pos.y * scale - 1, scale + 2, scale + 2);
        ctx.fillStyle = '#cc2222';
      }
    }

    // Draw mercenaries (blue dots)
    ctx.fillStyle = '#4488ff';
    for (const merc of state.mercenaries) {
      if (merc.isDead) continue;
      ctx.fillRect(merc.pos.x * scale, merc.pos.y * scale, scale, scale);
    }

    // Draw player (bright green, slightly larger)
    ctx.fillStyle = '#33ff66';
    const px = player.pos.x * scale;
    const py = player.pos.y * scale;
    ctx.fillRect(px - 1, py - 1, scale + 2, scale + 2);
  }, [state, scale, expanded]);

  return (
    <div
      style={{
        ...wrapperStyle,
        ...(expanded ? expandedWrapperStyle : {}),
      }}
      onClick={() => setExpanded(v => !v)}
    >
      <canvas ref={canvasRef} style={canvasStyle} />
      <div style={labelStyle}>
        F{state.floorNumber} {expanded ? '[-]' : '[+]'}
      </div>
    </div>
  );
}

const wrapperStyle: CSSProperties = {
  position: 'absolute',
  top: 4,
  right: 4,
  zIndex: 30,
  background: 'rgba(0,0,0,0.85)',
  border: '1px solid #1a5a2a',
  padding: 2,
  cursor: 'pointer',
  userSelect: 'none',
  maxWidth: '40%',
  maxHeight: '35%',
  overflow: 'hidden',
};

const expandedWrapperStyle: CSSProperties = {
  maxWidth: '70%',
  maxHeight: '55%',
};

const canvasStyle: CSSProperties = {
  display: 'block',
  imageRendering: 'pixelated',
};

const labelStyle: CSSProperties = {
  color: '#1a8a3a',
  fontFamily: 'monospace',
  fontSize: 8,
  textAlign: 'center',
  marginTop: 1,
};
