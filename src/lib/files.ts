import JSZip from 'jszip';
import type { FileEntry } from './types';
export const MAX_TOTAL_BYTES = 100 * 1024 * 1024;
export function categoryFor(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['png','jpg','jpeg','webp','svg','gif','avif','heic'].includes(ext)) return 'Images';
  if (['pdf','doc','docx','txt','md','rtf','odt'].includes(ext)) return 'Documents';
  if (['csv','xls','xlsx','tsv'].includes(ext)) return 'Spreadsheets';
  if (['mp3','wav','m4a','ogg','flac'].includes(ext)) return 'Audio';
  if (['mp4','mov','webm','avi'].includes(ext)) return 'Video';
  if (['zip','rar','7z','gz','tar'].includes(ext)) return 'Archives';
  if (['js','ts','tsx','jsx','py','html','css','json','yaml','yml'].includes(ext)) return 'Code';
  return 'Other';
}
export function safeName(name: string): string {
  let clean = name.replace(/[\x00-\x1f<>:"/\\|?*]/g, '_').replace(/^\.+/, '_').replace(/[. ]+$/, '_').slice(0,180) || 'untitled';
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i.test(clean)) clean = `_${clean}`;
  return clean;
}
export async function analyzeFiles(files: File[]): Promise<FileEntry[]> {
  if (!files.length) throw new Error('Choose at least one file.');
  if (files.length > 250 || files.reduce((n, f) => n + f.size, 0) > MAX_TOTAL_BYTES) throw new Error('Choose up to 250 files, totaling 100 MB or less.');
  const seen = new Map<string, string>();
  const paths = new Set<string>();
  const entries: FileEntry[] = [];
  for (const [index, file] of files.entries()) {
    let bytes: ArrayBuffer;
    try { bytes=await file.arrayBuffer(); } catch { throw new Error(`Could not read "${file.name}". Choose the file again. Originals have not been changed.`); }
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))).map(b => b.toString(16).padStart(2,'0')).join('');
    const duplicateOf = seen.get(hash);
    const id = `file-${index}`;
    if (!duplicateOf) seen.set(hash, id);
    const category = categoryFor(file.name);
    const name = safeName(file.name);
    let path = `${category}/${name}`, suffix = 2;
    while (paths.has(path.toLowerCase())) path = `${category}/${suffix++}-${name}`;
    paths.add(path.toLowerCase());
    entries.push({ id, file, hash, category, duplicateOf, path });
  }
  return entries;
}
export async function createOrganizedZip(entries: FileEntry[], omitDuplicates: boolean, onProgress?: (percent: number) => void) {
  if(!entries.length)throw new Error('There are no approved files to pack.');
  const zip = new JSZip();
  const included = entries.filter(e => !omitDuplicates || !e.duplicateOf);
  const manifest = entries.map(e => ({ original: e.file.name, output: omitDuplicates && e.duplicateOf ? null : e.path, sha256: e.hash, bytes: e.file.size, duplicateOf: e.duplicateOf ? entries.find(x=>x.id === e.duplicateOf)?.file.name : null }));
  for (const e of included) {
    try { zip.file(e.path, await e.file.arrayBuffer()); } catch { throw new Error(`Could not pack "${e.file.name}". No files were deleted. Re-select your files and retry.`); }
  }
  zip.file('questos-manifest.json', JSON.stringify({ version: 1, createdAt: new Date().toISOString(), originalsModified: false, files: manifest }, null, 2));
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 3 } }, m=>onProgress?.(Math.round(m.percent)));
  // Verify central directory, file count, and byte lengths before offering download.
  const verified = await JSZip.loadAsync(await blob.arrayBuffer());
  for (const e of included) {
    const output = verified.file(e.path);
    if (!output) throw new Error('ZIP verification failed. Please retry.');
    const bytes = await output.async('uint8array');
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new Uint8Array(bytes)))).map(b=>b.toString(16).padStart(2,'0')).join('');
    if (bytes.byteLength !== e.file.size || hash !== e.hash) throw new Error('ZIP verification failed. Please retry.');
  }
  return { blob, count: included.length, omitted: entries.length - included.length };
}
