import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
type Row = Record<string, unknown>;
const TABLES = new Set(['quest_plans','quest_receipts']);
function column(name: string) { if (!/^[a-z_]+$/.test(name)) throw new Error('Invalid column'); return `"${name}"`; }
function encode(value: unknown): string | number | null { if(value===null||value===undefined)return null;if(typeof value==='boolean')return Number(value);if(typeof value==='object')return JSON.stringify(value);if(typeof value==='number')return value;return String(value); }
function decode(row: Row): Row { const result={...row};for(const key of ['messages','changes'])if(typeof result[key]==='string')result[key]=JSON.parse(result[key] as string);if('claimed' in result)result.claimed=!!result.claimed;return result; }
export class LocalStore {
  readonly sqlite: DatabaseSync;
  constructor(path = resolve(process.cwd(),'.questos/questos.sqlite')) {
    if(path!==':memory:')mkdirSync(dirname(path),{recursive:true});
    this.sqlite=new DatabaseSync(path);
    this.sqlite.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS quest_plans(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,messages TEXT NOT NULL,claimed INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),expires_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS quest_receipts(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,status TEXT NOT NULL,count INTEGER NOT NULL DEFAULT 0,changes TEXT NOT NULL DEFAULT '[]',detail TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
      CREATE TABLE IF NOT EXISTS quest_ai_budget(user_id TEXT PRIMARY KEY,window_start INTEGER NOT NULL,count INTEGER NOT NULL);
      CREATE INDEX IF NOT EXISTS plans_owner ON quest_plans(user_id,created_at);
      CREATE INDEX IF NOT EXISTS receipts_owner ON quest_receipts(user_id,created_at);`);
  }
  from(table: string) { if(!TABLES.has(table))throw new Error('Unknown table');return new LocalQuery(this.sqlite,table); }
  async rpc(name: string,args:{owner_id:string}) {
    if(name!=='claim_quest_generation')return {data:null,error:new Error('Unknown RPC')};
    try {const now=Date.now();const row=this.sqlite.prepare(`INSERT INTO quest_ai_budget(user_id,window_start,count) VALUES(?,?,1) ON CONFLICT(user_id) DO UPDATE SET count=CASE WHEN window_start<? THEN 1 ELSE count+1 END,window_start=CASE WHEN window_start<? THEN ? ELSE window_start END RETURNING count`).get(args.owner_id,now,now-3600000,now-3600000,now) as Row;return {data:Number(row.count)<=10,error:null};}catch(error){return{data:null,error};}
  }
}
class LocalQuery implements PromiseLike<{data:Row[]|Row|null;error:unknown}> {
  private mode:'select'|'insert'|'update'='select';private values:Row={};private filters:{name:string;operator:string;value:unknown}[]=[];private maximum?:number;private sort?:{name:string;ascending:boolean};private one=false;private optional=false;
  constructor(private sqlite:DatabaseSync,private table:string){}
  select(_columns='*'){return this;}
  insert(values:Row){this.mode='insert';this.values=values;return this;}
  update(values:Row){this.mode='update';this.values=values;return this;}
  eq(name:string,value:unknown){this.filters.push({name,operator:'=',value});return this;}
  gte(name:string,value:unknown){this.filters.push({name,operator:'>=',value});return this;}
  limit(n:number){this.maximum=Math.max(0,Math.floor(n));return this;}
  order(name:string,options:{ascending:boolean}){this.sort={name,...options};return this;}
  single(){this.one=true;return this;}
  maybeSingle(){this.one=true;this.optional=true;return this;}
  private execute(){
    try {
      const params:(string|number|null)[]=[];
      const where=this.filters.length?' WHERE '+this.filters.map(f=>{params.push(encode(f.value));return `${column(f.name)} ${f.operator} ?`;}).join(' AND '):'';
      let sql:string;
      if(this.mode==='select')sql=`SELECT * FROM ${this.table}${where}${this.sort?` ORDER BY ${column(this.sort.name)} ${this.sort.ascending?'ASC':'DESC'}`:''}${this.maximum!==undefined?` LIMIT ${this.maximum}`:''}`;
      else if(this.mode==='insert'){const keys=Object.keys(this.values);sql=`INSERT INTO ${this.table}(${keys.map(column).join(',')}) VALUES(${keys.map(()=>'?').join(',')}) RETURNING *`;params.unshift(...keys.map(k=>encode(this.values[k])));}
      else {const keys=Object.keys(this.values);sql=`UPDATE ${this.table} SET ${keys.map(k=>`${column(k)}=?`).join(',')}${where} RETURNING *`;params.unshift(...keys.map(k=>encode(this.values[k])));}
      const rows=(this.sqlite.prepare(sql).all(...params) as Row[]).map(decode);
      if(this.one && (rows.length>1||(!this.optional&&!rows.length)))throw new Error('Expected one record');
      return {data:this.one?rows[0]||null:rows,error:null};
    }catch(error){return{data:null,error};}
  }
  then<TResult1={data:Row[]|Row|null;error:unknown},TResult2=never>(onfulfilled?:((value:{data:Row[]|Row|null;error:unknown})=>TResult1|PromiseLike<TResult1>)|null,onrejected?:((reason:unknown)=>TResult2|PromiseLike<TResult2>)|null):PromiseLike<TResult1|TResult2>{return Promise.resolve(this.execute()).then(onfulfilled,onrejected);}
}
