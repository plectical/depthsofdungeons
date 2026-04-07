/**
 * Export UGC Pool to Static Assets
 * 
 * This script:
 * 1. Fetches all UGC entries from the RUN.game pool
 * 2. Downloads images to public/cdn-assets/pool/
 * 3. Creates a JSON manifest for the game to use
 * 4. Optionally deletes entries from UGC pool after export
 * 
 * Usage: node scripts/export-ugc-pool.js
 * 
 * Note: You'll need to run this with proper authentication.
 * For now, this shows the structure - actual API calls need the SDK.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const OUTPUT_DIR = path.join(__dirname, '../public/cdn-assets/pool');
const MANIFEST_PATH = path.join(__dirname, '../public/cdn-assets/pool-manifest.json');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Content types we want to export
const CONTENT_TYPES = [
  'portrait_character',
  'portrait_enemy', 
  'portrait_mercenary',
  'room_event_art',
  'skillcheck_art',
];

async function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const filepath = path.join(OUTPUT_DIR, filename);
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(filepath);
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function exportPool() {
  console.log('=== UGC Pool Export Tool ===\n');
  
  // This would need to be run in a context where RundotGameAPI is available
  // For now, we'll create a structure that the game can use
  
  const manifest = {
    exportedAt: new Date().toISOString(),
    entries: {},
  };
  
  console.log('To export the pool, you need to:');
  console.log('1. Add a debug button in-game that calls the export function');
  console.log('2. Or use the RUN.game dashboard to export entries\n');
  
  console.log('The game will look for: public/cdn-assets/pool-manifest.json');
  console.log('And images in: public/cdn-assets/pool/\n');
  
  // Create empty manifest as template
  for (const contentType of CONTENT_TYPES) {
    manifest.entries[contentType] = [];
  }
  
  // Write template manifest
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`Created template manifest at: ${MANIFEST_PATH}`);
  
  console.log('\nNext steps:');
  console.log('1. I\'ll add an in-game export function that populates this');
  console.log('2. Then we can modify the contentPool to check local assets first');
}

exportPool().catch(console.error);
