const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const QUALITY = 90;
const TARGET_DIRS = ['uploads', 'public', 'public/cdn-assets'];

async function compressImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const isJpeg = ext === '.jpg' || ext === '.jpeg';
  const isPng = ext === '.png';
  const isWebp = ext === '.webp';
  
  if (!isJpeg && !isPng && !isWebp) {
    return null;
  }
  
  const originalStats = fs.statSync(filePath);
  const originalSize = originalStats.size;
  
  try {
    const image = sharp(filePath);
    const metadata = await image.metadata();
    
    let outputBuffer;
    
    if (isJpeg) {
      outputBuffer = await image
        .jpeg({ quality: QUALITY, mozjpeg: true })
        .toBuffer();
    } else if (isPng) {
      outputBuffer = await image
        .png({ quality: QUALITY, compressionLevel: 9 })
        .toBuffer();
    } else if (isWebp) {
      outputBuffer = await image
        .webp({ quality: QUALITY })
        .toBuffer();
    }
    
    const newSize = outputBuffer.length;
    
    // Only save if smaller
    if (newSize < originalSize) {
      fs.writeFileSync(filePath, outputBuffer);
      return {
        file: filePath,
        originalSize,
        newSize,
        savings: originalSize - newSize,
        percent: ((1 - newSize / originalSize) * 100).toFixed(1),
        dimensions: `${metadata.width}x${metadata.height}`
      };
    } else {
      return {
        file: filePath,
        originalSize,
        newSize: originalSize,
        savings: 0,
        percent: '0.0',
        dimensions: `${metadata.width}x${metadata.height}`,
        skipped: true
      };
    }
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err.message);
    return null;
  }
}

async function processDirectory(dir) {
  const results = [];
  
  if (!fs.existsSync(dir)) {
    console.log(`Directory not found: ${dir}`);
    return results;
  }
  
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      const subResults = await processDirectory(fullPath);
      results.push(...subResults);
    } else {
      const ext = path.extname(file.name).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
        const result = await compressImage(fullPath);
        if (result) {
          results.push(result);
        }
      }
    }
  }
  
  return results;
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

async function main() {
  console.log('='.repeat(80));
  console.log('IMAGE COMPRESSION REPORT');
  console.log(`Quality: ${QUALITY}%`);
  console.log('='.repeat(80));
  console.log('');
  
  let allResults = [];
  
  for (const dir of TARGET_DIRS) {
    const dirPath = path.resolve(__dirname, '..', dir);
    console.log(`Processing: ${dir}/`);
    const results = await processDirectory(dirPath);
    allResults.push(...results);
  }
  
  console.log('');
  console.log('='.repeat(80));
  console.log('RESULTS');
  console.log('='.repeat(80));
  console.log('');
  
  let totalOriginal = 0;
  let totalNew = 0;
  let totalSavings = 0;
  let compressedCount = 0;
  let skippedCount = 0;
  
  // Sort by savings (biggest first)
  allResults.sort((a, b) => b.savings - a.savings);
  
  for (const result of allResults) {
    const fileName = path.basename(result.file);
    const shortPath = result.file.replace(/\\/g, '/').split('/').slice(-2).join('/');
    
    totalOriginal += result.originalSize;
    totalNew += result.newSize;
    totalSavings += result.savings;
    
    if (result.skipped) {
      skippedCount++;
      console.log(`[SKIP] ${shortPath}`);
      console.log(`       ${formatSize(result.originalSize)} (already optimal) | ${result.dimensions}`);
    } else {
      compressedCount++;
      console.log(`[DONE] ${shortPath}`);
      console.log(`       ${formatSize(result.originalSize)} -> ${formatSize(result.newSize)} (-${result.percent}%) | ${result.dimensions}`);
    }
    console.log('');
  }
  
  console.log('='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total files processed: ${allResults.length}`);
  console.log(`Compressed: ${compressedCount}`);
  console.log(`Skipped (already optimal): ${skippedCount}`);
  console.log(`Original total size: ${formatSize(totalOriginal)}`);
  console.log(`New total size: ${formatSize(totalNew)}`);
  console.log(`Total savings: ${formatSize(totalSavings)} (${((1 - totalNew / totalOriginal) * 100).toFixed(1)}%)`);
}

main().catch(console.error);
