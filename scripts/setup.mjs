import {readFile,writeFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
try {
  const template=await readFile(new URL('../.env.example',import.meta.url),'utf8');
  await writeFile(new URL('../.env.local',import.meta.url),template.replace(/^SESSION_SECRET=$/m,`SESSION_SECRET=${randomBytes(48).toString('base64url')}`),{flag:'wx'});
  console.log('Created .env.local with a generated session secret. Add your rotated Google and Supabase credentials locally.');
} catch(e) {if(e.code==='EEXIST')console.log('.env.local already exists; left unchanged.');else throw e;}
