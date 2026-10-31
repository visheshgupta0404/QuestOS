import type { Message } from './types';
export const DEMO_MESSAGES: Message[] = [
  { id: 'demo-1', subject: 'Your weekly design inspiration', from: 'The Design Dispatch', date: '2026-09-12', labels: ['INBOX', 'CATEGORY_PROMOTIONS'] },
  { id: 'demo-2', subject: 'Last chance: summer sale ends tonight', from: 'Northstar Store', date: '2026-08-24', labels: ['INBOX', 'CATEGORY_PROMOTIONS'] },
  { id: 'demo-3', subject: '12 ideas you bookmarked and forgot', from: 'Sunday Reads', date: '2026-09-02', labels: ['INBOX', 'CATEGORY_PROMOTIONS'] },
  { id: 'demo-4', subject: 'Your October perks have arrived', from: 'Cloud Club', date: '2026-09-16', labels: ['INBOX', 'CATEGORY_PROMOTIONS'] },
  { id: 'demo-5', subject: 'A little something for your next adventure', from: 'Trail Supply', date: '2026-09-08', labels: ['INBOX', 'CATEGORY_PROMOTIONS'] },
  { id: 'demo-6', subject: 'The productivity roundup, issue 42', from: 'Better Days', date: '2026-09-19', labels: ['INBOX', 'CATEGORY_PROMOTIONS'] },
];
export const DEMO_FILES = [
  { name: 'project-brief.txt', content: 'QuestOS turns real digital chores into delightful quests.\n' },
  { name: 'project-brief-copy.txt', content: 'QuestOS turns real digital chores into delightful quests.\n' },
  { name: 'ideas.md', content: '# Next adventure\nA calmer digital life, one quest at a time.\n' },
  { name: 'expenses.csv', content: 'item,amount\nCoffee,120\nNotebook,250\n' },
  { name: 'settings.json', content: '{"theme":"light","sound":false}' },
  { name: 'readme.txt', content: 'These are sample files. Your original files are never modified.\n' },
];
