import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputDir = path.join(__dirname, '..', 'public', 'cdn-assets', 'portraits');

// Simple colored placeholder portraits with different hues for each enemy type
const enemyTypes = [
  { name: 'goblin', color: '#4a6b3a', accent: '#2d4126', emoji: '👺' },
  { name: 'skeleton', color: '#8b8b8b', accent: '#5a5a5a', emoji: '💀' },
  { name: 'undead', color: '#5c4a6b', accent: '#3d2d4a', emoji: '🧟' },
  { name: 'ghost', color: '#6b8b9b', accent: '#4a6b7b', emoji: '👻' },
  { name: 'spider', color: '#3a3a4a', accent: '#2a2a3a', emoji: '🕷️' },
  { name: 'rat', color: '#6b5a4a', accent: '#4a3a2a', emoji: '🐀' },
  { name: 'bat', color: '#4a3a5a', accent: '#2a1a3a', emoji: '🦇' },
  { name: 'demon', color: '#8b2a2a', accent: '#5a1a1a', emoji: '😈' },
  { name: 'slug', color: '#4a5a3a', accent: '#2a3a2a', emoji: '🐛' },
  { name: 'slime', color: '#3a6b5a', accent: '#1a4a3a', emoji: '🟢' },
  { name: 'orc', color: '#5a6b4a', accent: '#3a4a2a', emoji: '👹' },
  { name: 'wolf', color: '#5a5a5a', accent: '#3a3a3a', emoji: '🐺' },
  { name: 'shade', color: '#3a3a4a', accent: '#1a1a2a', emoji: '🌑' },
  { name: 'wraith', color: '#4a5a6b', accent: '#2a3a4a', emoji: '👤' },
  { name: 'unknown', color: '#4a4a5a', accent: '#2a2a3a', emoji: '❓' },
];

async function generatePortrait(enemy) {
  const width = 256;
  const height = 256;
  
  // Create SVG with gradient background and decorative elements
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg" cx="50%" cy="30%" r="70%">
          <stop offset="0%" style="stop-color:${enemy.color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${enemy.accent};stop-opacity:1" />
        </radialGradient>
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" result="noise"/>
          <feColorMatrix type="saturate" values="0"/>
          <feBlend in="SourceGraphic" mode="overlay"/>
        </filter>
      </defs>
      
      <!-- Background -->
      <rect width="100%" height="100%" fill="url(#bg)"/>
      
      <!-- Vignette overlay -->
      <rect width="100%" height="100%" fill="rgba(0,0,0,0.3)" 
            mask="url(#vignette-mask)"/>
      
      <!-- Dark corners -->
      <circle cx="0" cy="0" r="180" fill="rgba(0,0,0,0.4)"/>
      <circle cx="${width}" cy="0" r="180" fill="rgba(0,0,0,0.4)"/>
      <circle cx="0" cy="${height}" r="180" fill="rgba(0,0,0,0.4)"/>
      <circle cx="${width}" cy="${height}" r="180" fill="rgba(0,0,0,0.4)"/>
      
      <!-- Central glow -->
      <circle cx="${width/2}" cy="${height/2 - 20}" r="80" 
              fill="rgba(255,255,255,0.1)"/>
      
      <!-- Mystical pattern -->
      <circle cx="${width/2}" cy="${height/2}" r="90" 
              fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
      <circle cx="${width/2}" cy="${height/2}" r="70" 
              fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
      
      <!-- Emoji icon -->
      <text x="${width/2}" y="${height/2 + 15}" 
            font-size="64" text-anchor="middle" 
            fill="rgba(255,255,255,0.85)"
            style="filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.5));">
        ${enemy.emoji}
      </text>
      
      <!-- Name at bottom -->
      <text x="${width/2}" y="${height - 20}" 
            font-size="14" text-anchor="middle" 
            fill="rgba(255,255,255,0.6)"
            font-family="serif"
            style="text-transform: capitalize;">
        ${enemy.name}
      </text>
      
      <!-- Frame border -->
      <rect x="4" y="4" width="${width-8}" height="${height-8}" 
            fill="none" stroke="rgba(139,115,85,0.6)" stroke-width="3"/>
      <rect x="8" y="8" width="${width-16}" height="${height-16}" 
            fill="none" stroke="rgba(139,115,85,0.3)" stroke-width="1"/>
    </svg>
  `;
  
  const outputPath = path.join(outputDir, `${enemy.name}.jpg`);
  
  await sharp(Buffer.from(svg))
    .jpeg({ quality: 85 })
    .toFile(outputPath);
  
  console.log(`Generated: ${enemy.name}.jpg`);
}

async function main() {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  console.log('Generating enemy portrait placeholders...');
  
  for (const enemy of enemyTypes) {
    await generatePortrait(enemy);
  }
  
  console.log(`\nGenerated ${enemyTypes.length} portraits in ${outputDir}`);
}

main().catch(console.error);
