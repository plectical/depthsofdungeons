import { newStoryFloor } from '../story-mode/storyEngine';
import { CHAPTER_1 } from '../story-mode/chapters/chapter1';
import { CHAPTER_2 } from '../story-mode/chapters/chapter2';
import { createEmptyCampaignSave } from '../story-mode/campaignTypes';

let totalMercs = 0;
let floorsWithMercs = 0;
const runs = 100;

for (let i = 0; i < runs; i++) {
  const save = createEmptyCampaignSave('warrior');
  const chapter = i % 2 === 0 ? CHAPTER_1 : CHAPTER_2;
  const floor = chapter.floors[Math.floor(Math.random() * chapter.floors.length)]!;
  const gs = newStoryFloor(chapter, floor, save);
  if (gs.mapMercenaries && gs.mapMercenaries.length > 0) {
    floorsWithMercs++;
    totalMercs += gs.mapMercenaries.length;
  }
}

console.log(`\nMercenary spawn rate over ${runs} story floors:`);
console.log(`  Floors with mercs: ${floorsWithMercs}/${runs} (${Math.round(floorsWithMercs/runs*100)}%)`);
console.log(`  Total mercs spawned: ${totalMercs}`);
console.log(`  Shop check:`);

let shopsFound = 0;
for (let i = 0; i < 50; i++) {
  const save = createEmptyCampaignSave('warrior');
  const gs = newStoryFloor(CHAPTER_1, CHAPTER_1.floors[0]!, save);
  if (gs.shop !== null) shopsFound++;
}
console.log(`  Shops on 50 floors: ${shopsFound}/50 (${Math.round(shopsFound/50*100)}%)`);
console.log(`  Status: ${floorsWithMercs > 0 ? 'MERCS WORKING' : 'MERCS NOT SPAWNING'}`);
