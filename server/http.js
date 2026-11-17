const TYPES={'.js':'text/javascript; charset=utf-8','.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.woff':'font/woff','.webp':'image/webp','.txt':'text/plain; charset=utf-8'};
export function typeOf(path) {
  return TYPES[path.slice(path.lastIndexOf('.'))]??'application/octet-stream';
}

export function safeResponse(request,body,path,cache='no-cache') {
  return new Response(request.method==='HEAD'?null:body,{
    headers:{'Content-Type':typeOf(path),'Cache-Control':cache,'X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'}
  });
}

export function resourcePath(url) {
  const path=new URL(url).pathname;
  if (path==='/'||path==='/index.html') return '/web/index.html';
  if (/^\/(web|engine)\/[a-z][a-z-]*\.(js|css)$/.test(path)||/^\/web\/assets\/[a-z][a-z-]*\.(webp|woff|txt)$/.test(path)) return path;
  return null;
}
