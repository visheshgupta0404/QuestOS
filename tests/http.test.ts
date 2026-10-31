import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readJson,MAX_JSON_BYTES} from '../src/lib/http';
const req=(body:string,headers:Record<string,string>={})=>new Request('http://localhost/api/test',{method:'POST',headers:{'Content-Type':'application/json',...headers},body});
const status=(n:number)=>(e:unknown)=>!!e&&typeof e==='object'&&'status'in e&&e.status===n;
test('JSON parsing validates encoding/media and rejects malformed or excessive bodies',async()=>{
 assert.deepEqual(await readJson(req('{"approved":true}')),{approved:true});
 await assert.rejects(readJson(req('{')),status(400));await assert.rejects(readJson(req('{}',{'Content-Type':'text/plain'})),status(415));
 await assert.rejects(readJson(req('x'.repeat(MAX_JSON_BYTES+1))),status(413));
 await assert.rejects(readJson(req('{}',{'Content-Length':String(MAX_JSON_BYTES+1)})),status(413));
});
test('readJson handles content-type with charset and rejects missing headers/body',async()=>{
 const withCharset = new Request('http://localhost/api/test',{method:'POST',headers:{'Content-Type':'application/json; charset=utf-8'},body:'{"ok":1}'});
 assert.deepEqual(await readJson(withCharset),{ok:1});
 const noContentType = new Request('http://localhost/api/test',{method:'POST',body:'{"ok":1}'});
 await assert.rejects(readJson(noContentType),status(415));
 const noBody = new Request('http://localhost/api/test',{method:'GET',headers:{'Content-Type':'application/json'}});
 await assert.rejects(readJson(noBody),status(400));
});
