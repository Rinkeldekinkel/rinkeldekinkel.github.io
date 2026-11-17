import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { openRouterRoute } from './openrouter.js';
import { resourcePath, safeResponse } from './http.js';

const usage=new Set(process.argv.slice(2));
const deployment=usage.has('--production')?(await import('../dist/server/index.js')).default:null;

async function handle(request) {
  if (deployment) return deployment.fetch(request);
  if (new URL(request.url).pathname.startsWith('/api/openrouter/')) return openRouterRoute(request);
  const path=resourcePath(request.url);
  if (!path||!['GET','HEAD'].includes(request.method)) return new Response('Not found',{status:404});
  try {
    return safeResponse(request,await readFile(new URL('..'+path,import.meta.url)),path);
  } catch(err) {
    return new Response('Not found',{status:err.code==='ENOENT'?404:500});
  }
}

const bound=process.env.HOST || (process.env.PORT?'0.0.0.0':'127.0.0.1');
const port=Number(process.env.PORT??4173);
const server=createServer(async(message,response)=>{
  try {
    const body=['GET','HEAD'].includes(message.method)?undefined:Readable.toWeb(message);
    const url='http://'+(message.headers.host||'localhost')+message.url;
    const request=new Request(url,{method:message.method,headers:message.headers,body,duplex:'half'});
    const reply=await handle(request);
    response.writeHead(reply.status,Object.fromEntries(reply.headers));
    if(reply.body) Readable.fromWeb(reply.body).pipe(response);
    else response.end();
  } catch(error) {
    if (!response.headersSent) response.writeHead(500,{'Content-Type':'text/plain; charset=utf-8'});
    response.end('The league server could not complete this request.');
  }
});
server.listen(port,bound,()=>console.log(`Sports League Commissioner is running at http://${bound==='0.0.0.0'?'localhost':bound}:${server.address().port}`));
