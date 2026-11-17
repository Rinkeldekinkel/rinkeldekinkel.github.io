import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resourcePath, typeOf } from '../server/http.js';

const root=new URL('../',import.meta.url);
const load=path=>readFile(new URL(path,root));
const output=(path,content)=>writeFile(new URL(path,root),content);
const web=await readdir(new URL('web/',root));
const engine=await readdir(new URL('engine/',root));
const assets=await readdir(new URL('web/assets/',root));
const paths=[...web.map(name=>'/web/'+name),...engine.map(name=>'/engine/'+name),...assets.map(name=>'/web/assets/'+name)].filter(p=>p==='/web/index.html'||resourcePath('https://build.local'+p));
const files=Object.fromEntries(await Promise.all(paths.map(async path=>[path,await load(path.slice(1))])));
const manifest=Object.fromEntries(Object.entries(files).map(([path,bytes])=>[path,[bytes.toString('base64'),createHash('sha256').update(bytes).digest('base64url').slice(0,20)]]));
const sources=Object.fromEntries(Object.entries(files).filter(([path])=>path.endsWith('.js')).map(([path,bytes])=>[path,bytes.toString()]));
const dataFiles=Object.fromEntries(Object.entries(files).filter(([path])=>/\.(webp|woff)$/.test(path)).map(([path,bytes])=>[path.split('/').at(-1),'data:'+typeOf(path)+';base64,'+bytes.toString('base64')]));
const index=files['/web/index.html'].toString();
const http=(await load('server/http.js')).toString().replaceAll('export function ','function ');
const api=(await load('server/openrouter.js')).toString().replace('export async function ','async function ');

const entry=`/* Generated from web/, engine/ and server/. */
${http}
${api}
const files=${JSON.stringify(manifest)};

export default {
  async fetch(request) {
    const pathname = new URL(request.url).pathname;
    if (pathname.startsWith('/api/openrouter/')) return openRouterRoute(request);
    const path = resourcePath(request.url);
    if (!path || !['GET','HEAD'].includes(request.method) || !Object.hasOwn(files,path)) return new Response('Not found',{status:404});
    const [contents, hash] = files[path];
    const etag = '"' + hash + '"';
    if (request.headers.get('If-None-Match') === etag) return new Response(null,{status:304,headers:{ETag:etag}});
    const body = request.method === 'HEAD' ? null : Uint8Array.from(atob(contents), c => c.charCodeAt(0));
    const result = safeResponse(request,body,path,path.startsWith('/web/assets/')?'public, max-age=86400':'no-cache');
    result.headers.set('ETag',etag);
    return result;
  }
};
`;

const scriptJSON=value=>JSON.stringify(value).replaceAll('<','\\u003c');
const offlineScript=`<script>
window.__OFFLINE_ASSETS__=${scriptJSON(dataFiles)};
const sources=${scriptJSON(sources)};
const moduleURLs={};
function moduleURL(path) {
  if (moduleURLs[path]) return moduleURLs[path];
  const code=sources[path].replace(/(from\\s+)['"]([.][^'"]+\\.js)['"]/g,(_,prefix,specifier)=>{
    const resolved=new URL(specifier,'https://offline.local'+path).pathname;
    return prefix+JSON.stringify(moduleURL(resolved));
  });
  moduleURLs[path]=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));
  return moduleURLs[path];
}
import(moduleURL('/web/app.js')).catch(error=>{
  const message=document.createElement('p');
  message.className='boot';
  message.textContent='The game could not start in this browser. Extract the source archive and run npm run dev.';
  document.querySelector('#app').replaceChildren(message);
  console.error(error);
});
</script>`;
const offline=index
  .replace('<link rel="stylesheet" href="/web/style.css">',()=>'<style>'+files['/web/style.css'].toString().replace(/\/web\/assets\/([a-z-]+\.woff)/g,(_,font)=>dataFiles[font])+'</style>')
  .replace('<script type="module" src="/web/app.js"></script>',()=>offlineScript);
await mkdir(new URL('dist/server/',root),{recursive:true});
await output('dist/server/index.js',entry);
await output('dist/Sports-League-Commissioner.html',offline);
try {
  const hosting=await load('.openai/hosting.json');
  await mkdir(new URL('dist/.openai/',root),{recursive:true});
  await output('dist/.openai/hosting.json',hosting);
} catch(err) {
  if (err.code!=='ENOENT') throw err;
}
console.log('Built dist/server/index.js and dist/Sports-League-Commissioner.html');
