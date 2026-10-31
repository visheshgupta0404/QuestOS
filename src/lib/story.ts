import type { Module, QuestStory } from './types';

/**
 * Returns deterministic fallback story briefings for each quest realm.
 * Ensures the game is always fully playable even without an internet connection or Gemini API key.
 */
export function fallbackStory(module: Module, count: number): QuestStory {
  return module === 'inbox' ? { title:'The great inbox rescue', briefing:`${count} old promotional messages have gathered at the castle gates. Archive the clutter, label the useful, and protect what matters. Your choices become a cleanup plan for review.`, victory:'The gates are clear. Your kingdom can breathe again.', source:'rules' } : { title:'Bring order to the wild', briefing:`${count} files have wandered into the forest. Find their homes, spot identical twins, and collect a tidy archive. Every original stays exactly where it is.`, victory:'Every file has found its clearing. A little less chaos, a lot more calm.', source:'rules' };
}
