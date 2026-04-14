import type { ChapterDef } from '../campaignTypes';
import { CHAPTER_1 } from './chapter1';
import { CHAPTER_2 } from './chapter2';
import { CHAPTER_3 } from './chapter3';

export const ALL_CHAPTERS: ChapterDef[] = [
  CHAPTER_1,
  CHAPTER_2,
  CHAPTER_3,
];

export function getChapter(id: string): ChapterDef | undefined {
  return ALL_CHAPTERS.find(c => c.id === id);
}

export function getAvailableChapters(completedChapters: string[]): ChapterDef[] {
  return ALL_CHAPTERS.filter(ch =>
    ch.requiredChapters.every(req => completedChapters.includes(req))
  );
}
