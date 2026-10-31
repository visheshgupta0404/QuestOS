import {test} from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import {analyzeFiles, categoryFor, createOrganizedZip, MAX_TOTAL_BYTES, safeName} from '../src/lib/files';
test('detects exact content duplicates, preserving different contents and case-insensitive output collisions',async()=>{
  const entries=await analyzeFiles([new File(['same'],'report.txt'),new File(['same'],'copy.md'),new File(['different'],'REPORT.txt'),new File(['third'],'report.txt')]);
  assert.equal(entries[1].duplicateOf,entries[0].id);
  assert.equal(entries[2].duplicateOf,undefined);
  assert.equal(new Set(entries.map(e=>e.path.toLowerCase())).size,4);
  assert.equal(entries[0].hash,'0967115f2813a3541eaef77de9d9d5773f1c0c04314b0bbfe4ff3b3b1c55b5d5');
});
test('ZIP omits only exact duplicates and preserves file bytes with an auditable manifest',async()=>{
  const bytes=new Uint8Array([0,255,10,42]);
  const entries=await analyzeFiles([new File([bytes],'photo.PNG'),new File([bytes],'photo-copy.png'),new File(['notes'],'notes.md')]);
  const {blob,count,omitted}=await createOrganizedZip(entries,true);
  assert.equal(count,2);assert.equal(omitted,1);
  const zip=await JSZip.loadAsync(await blob.arrayBuffer());
  assert.deepEqual(await zip.file('Images/photo.PNG')!.async('uint8array'),bytes);
  const manifest=JSON.parse(await zip.file('questos-manifest.json')!.async('text'));
  assert.equal(manifest.originalsModified,false);assert.equal(manifest.files[1].output,null);
  assert.equal(await entries[2].file.text(),'notes');
});
test('can retain duplicates explicitly, rejects empty/oversized selections and neutralizes unsafe names',async()=>{
  const entries=await analyzeFiles([new File(['x'],'../../evil.txt'),new File(['x'],'copy.txt')]);
  assert.equal((await createOrganizedZip(entries,false)).count,2);
  assert(!entries[0].path.includes('../'));assert(!safeName('..\\secret.txt').includes('\\'));
  assert.equal(categoryFor('Budget.XLSX'),'Spreadsheets');
  assert.equal(safeName('CON.txt'),'_CON.txt');
  await assert.rejects(analyzeFiles([]),/at least/);
  await assert.rejects(analyzeFiles(Array.from({length:251},()=>new File([''],'x'))),/250/);
  await assert.rejects(analyzeFiles([{size:MAX_TOTAL_BYTES+1} as File]),/100 MB/);
});
test('unreadable files fail clearly, unknown types are retained, and sanitized names cannot overwrite',async()=>{
  const unreadable={name:'locked.txt',size:10,arrayBuffer:async()=>{throw new Error('Permission denied');}} as unknown as File;
  await assert.rejects(analyzeFiles([unreadable]),/Could not read "locked.txt"/);
  const entries=await analyzeFiles([new File(['a'],'a:b.txt'),new File(['b'],'a?b.txt'),new File(['binary'],'unknown.weird')]);
  assert.equal(entries[2].category,'Other');assert.notEqual(entries[0].path,entries[1].path);
  const {blob}=await createOrganizedZip(entries,false);const zip=await JSZip.loadAsync(await blob.arrayBuffer());
  assert.equal(await zip.file(entries[2].path)!.async('text'),'binary');
  for(const [i,e] of entries.entries())assert.equal(await e.file.text(),['a','b','binary'][i]);
  await assert.rejects(createOrganizedZip([],true),/no approved files/);
});
test('Unicode-equivalent filenames cannot collide when the ZIP is extracted',async()=>{
  const entries=await analyzeFiles([new File(['one'],'café.txt'),new File(['two'],'cafe\u0301.txt')]);
  assert.equal(new Set(entries.map(e=>e.path.normalize('NFC').toLowerCase())).size,2);
});
