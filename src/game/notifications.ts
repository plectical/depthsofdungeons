/**
 * Notification scheduling for re-engagement, daily rewards,
 * quest completion, and bloodline death events.
 *
 * All calls are fire-and-forget with try/catch — notifications
 * are non-critical and must never crash the game.
 */

import RundotGameAPI from '@series-inc/rundot-game-sdk/api';

const FOUR_HOURS = 4 * 60 * 60;
const TWENTY_FOUR_HOURS = 24 * 60 * 60;
const TWO_HOURS = 2 * 60 * 60;

const RE_ENGAGE_MESSAGES_4H = [
  { title: 'Your dungeon awaits!', body: 'The depths grow restless. Return to your quest!' },
  { title: 'The darkness stirs...', body: 'Monsters roam unchecked. Will you answer the call?' },
  { title: 'Adventure calls!', body: 'Your blade gathers dust. The dungeon awaits.' },
];

const RE_ENGAGE_MESSAGES_24H = [
  { title: 'The depths miss you!', body: 'Your bloodline demands vengeance. Return and fight!' },
  { title: 'A new day in the dungeon', body: 'Fresh challenges await. How deep can you go?' },
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] ?? arr[0]!;
}

// ── Re-engagement ──

export async function scheduleReengagement(): Promise<void> {
  try {
    const msg4h = pickRandom(RE_ENGAGE_MESSAGES_4H);
    await RundotGameAPI.notifications.scheduleAsync(
      msg4h.title, msg4h.body, FOUR_HOURS, 'reengagement_4h',
    );
  } catch { /* non-critical */ }

  try {
    const msg24h = pickRandom(RE_ENGAGE_MESSAGES_24H);
    await RundotGameAPI.notifications.scheduleAsync(
      msg24h.title, msg24h.body, TWENTY_FOUR_HOURS, 'reengagement_24h',
    );
  } catch { /* non-critical */ }
}

export async function cancelReengagement(): Promise<void> {
  try { await RundotGameAPI.notifications.cancelNotification('reengagement_4h'); } catch { /* noop */ }
  try { await RundotGameAPI.notifications.cancelNotification('reengagement_24h'); } catch { /* noop */ }
}

// ── Quest completion ──

export async function scheduleQuestComplete(questId: string, delaySec: number): Promise<void> {
  try {
    await RundotGameAPI.notifications.scheduleAsync(
      'Quest Complete!',
      'Your quest reward awaits in the dungeon.',
      delaySec,
      `quest_${questId}`,
    );
  } catch { /* non-critical */ }
}

export async function cancelQuestComplete(questId: string): Promise<void> {
  try { await RundotGameAPI.notifications.cancelNotification(`quest_${questId}`); } catch { /* noop */ }
}

// ── Bloodline death ──

export async function scheduleBloodlineDeath(floor: number): Promise<void> {
  try {
    await RundotGameAPI.notifications.scheduleAsync(
      'Avenge Your Ancestor!',
      `Your ancestor fell on floor ${floor}. Their bloodline demands vengeance!`,
      TWO_HOURS,
      'bloodline_death',
    );
  } catch { /* non-critical */ }
}

export async function cancelBloodlineDeath(): Promise<void> {
  try { await RundotGameAPI.notifications.cancelNotification('bloodline_death'); } catch { /* noop */ }
}

// ── Cleanup ──

export async function cancelAllGameNotifications(): Promise<void> {
  await cancelReengagement();
  await cancelBloodlineDeath();
}
