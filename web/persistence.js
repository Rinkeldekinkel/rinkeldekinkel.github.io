import { migrateGame } from '../engine/validation.js';

const NAME='sports-league-commissioner-v2';
const STORE='saves';
let database;
let writes=Promise.resolve();

function connection() {
  if (!database) database=new Promise((resolve,reject)=>{
    let req;
    try { req=indexedDB.open(NAME,1); }
    catch(error) { reject(error); return; }
    req.onupgradeneeded=()=>req.result.createObjectStore(STORE,{keyPath:'id'});
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
    req.onblocked=()=>reject(new Error('Close other tabs using this game.'));
  }).catch(error=>{ database=null; throw error; });
  return database;
}

async function transact(mode,action) {
  const db=await connection();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,mode);
    const request=action(tx.objectStore(STORE));
    tx.oncomplete=()=>resolve(request.result);
    tx.onerror=()=>reject(tx.error??request.error);
    tx.onabort=()=>reject(tx.error??new Error('Save transaction interrupted.'));
  });
}

export function writeSave(id,name,game,resume=null) {
  const item={id,name,updated:Date.now(),sport:game.sport,year:game.year,status:game.status,game,resume};
  writes=writes.catch(()=>{}).then(()=>transact('readwrite',store=>store.put(item)));
  return writes;
}

export async function readSave(id,{validate=true}={}) {
  await writes.catch(()=>{});
  const item=await transact('readonly',store=>store.get(id));
  if (item&&validate) item.game=migrateGame(item.game);
  return item??null;
}

export async function listSaves() {
  await writes.catch(()=>{});
  const db=await connection();
  return new Promise((resolve,reject)=>{
    const result=[];
    const tx=db.transaction(STORE,'readonly');
    const request=tx.objectStore(STORE).openCursor();
    request.onsuccess=()=>{
      const cursor=request.result;
      if (!cursor) return;
      const {id,name,updated,sport,year,status}=cursor.value;
      result.push({id,name,updated,sport,year,status});
      cursor.continue();
    };
    tx.oncomplete=()=>resolve(result.sort((a,b)=>b.updated-a.updated));
    tx.onerror=()=>reject(tx.error);
  });
}

export async function deleteSave(id) {
  await writes.catch(()=>{});
  return transact('readwrite',store=>store.delete(id));
}
