/**
 * Journal Art Generator
 * Generates pixel art for all lore/journal entries using RundotGameAPI.imageGen.
 * Run with: npx tsx --import ./src/game/__tests__/setup.mjs src/game/__tests__/generateJournalArt.ts
 *
 * Images are saved to public/cdn-assets/journal/lore-{id}.png
 * Review each image, then commit them to the repo.
 */

import RundotGameAPI from '@series-inc/rundot-game-sdk/api';
import { ALL_LORE } from '../lore';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

const OUTPUT_DIR = path.resolve('public/cdn-assets/journal');

function buildPrompt(entry: typeof ALL_LORE[number]): string {
  const sceneText = entry.text.replace(/\\n/g, ' ').slice(0, 250);

  const categoryContext: Record<string, string> = {
    origins: 'An ancient dungeon that breathes and shifts, full of dark mystery',
    zones: 'A distinct dungeon zone with unique atmosphere and creatures',
    bosses: 'A powerful dungeon boss in their lair, menacing and formidable',
    creatures: 'A group of dungeon creatures in their natural habitat',
    ancestors: 'The bloodline legacy of dungeon delvers across generations',
    artifacts: 'A legendary magical artifact radiating power',
    factions: 'A faction of characters surviving within the dungeon',
  };

  return `PIXEL ART scene for a dungeon lore journal entry.
Title: "${entry.title}"
Description: "${entry.subtitle}"
Category context: ${categoryContext[entry.category] ?? 'A dark fantasy dungeon scene'}
Scene: ${sceneText}

Style: Retro dungeon crawler pixel art. Dark fantasy medieval setting.
Palette: deep blacks, dark greens (#0a3a0a, #1a5a2a), amber/orange accents (#ff6622, #ffaa33), muted purples and blues for magic.
Chunky visible pixels, 32-bit era aesthetic. No smooth gradients, no photorealism. Subtle CRT glow effect.
Atmospheric and moody. Underground dungeon lighting with torches and glowing crystals.
NO TEXT, NO WORDS, NO LETTERS, NO UI ELEMENTS, NO FRAMES, NO BORDERS.`;
}

async function downloadImage(url: string, filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        const redirectUrl = res.headers.location;
        if (redirectUrl) {
          downloadImage(redirectUrl, filepath).then(resolve).catch(reject);
          return;
        }
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => {
        fs.writeFileSync(filepath, Buffer.concat(chunks));
        resolve();
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function generateAll() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(`\n=== Journal Art Generator ===`);
  console.log(`Entries: ${ALL_LORE.length}`);
  console.log(`Output: ${OUTPUT_DIR}\n`);

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < ALL_LORE.length; i++) {
    const entry = ALL_LORE[i]!;
    const filename = `lore-${entry.id}.png`;
    const filepath = path.join(OUTPUT_DIR, filename);

    if (fs.existsSync(filepath)) {
      const stat = fs.statSync(filepath);
      if (stat.size > 1000) {
        console.log(`  [${i + 1}/${ALL_LORE.length}] SKIP ${entry.id} (already exists, ${Math.round(stat.size / 1024)}KB)`);
        skipped++;
        continue;
      }
    }

    const prompt = buildPrompt(entry);
    console.log(`  [${i + 1}/${ALL_LORE.length}] Generating ${entry.id}...`);

    try {
      const result = await RundotGameAPI.imageGen.generate({
        prompt,
        aspectRatio: '16:9',
        model: 'gemini-3-pro-image-preview',
      });

      if (result.imageUrl) {
        if (result.imageUrl.startsWith('data:')) {
          const base64 = result.imageUrl.split(',')[1];
          if (base64) {
            fs.writeFileSync(filepath, Buffer.from(base64, 'base64'));
            console.log(`    -> Saved (data URL)`);
          }
        } else {
          await downloadImage(result.imageUrl, filepath);
          const size = fs.statSync(filepath).size;
          console.log(`    -> Saved (${Math.round(size / 1024)}KB)`);
        }
        generated++;
      } else {
        console.log(`    -> FAILED: No imageUrl returned`);
        failed++;
      }
    } catch (e: any) {
      console.log(`    -> FAILED: ${e.message}`);
      failed++;
    }

    // Small delay between requests
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`\n=== Done ===`);
  console.log(`  Generated: ${generated}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total: ${ALL_LORE.length}\n`);
}

generateAll().catch(e => {
  console.error('Generation crashed:', e);
  process.exit(1);
});
