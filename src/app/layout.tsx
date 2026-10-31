import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title:'QuestOS — Play the Game. Clear the Chaos.', description:'Turn your inbox and file clutter into rewarding quests. Real cleanup, explicit approval, verified results.' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
