const UPSTREAM='https://openrouter.ai/api/v1';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const error=(message,status)=>json({error:message},status);

export async function openRouterRoute(request,fetchImpl=fetch) {
  const {pathname,origin}=new URL(request.url);
  const site=request.headers.get('Sec-Fetch-Site');
  const caller=request.headers.get('Origin');
  if (site==='cross-site'||site==='same-site'||caller&&caller!==origin&&site!=='same-origin') return error('Use the game’s own origin to access this route.',403);
  try {
    if (pathname==='/api/openrouter/models'&&request.method==='GET') {
      const reply=await fetchImpl(UPSTREAM+'/models',{signal:AbortSignal.timeout(10000),redirect:'error'});
      if (!reply.ok) return error('OpenRouter’s model list is unavailable.',reply.status);
      const data=await reply.json();
      const list=Array.isArray(data.data)?data.data:[];
      return json({data:list.map(model=>({id:model.id,name:model.name,pricing:model.pricing,supported_parameters:model.supported_parameters}))});
    }
    if (pathname!=='/api/openrouter/chat'||request.method!=='POST') return error('Route unavailable.',404);
    const key=request.headers.get('Authorization');
    if (!key||!/^Bearer [A-Za-z0-9._-]{20,256}$/.test(key)) return error('An OpenRouter API key is required.',401);
    const body=await request.text();
    if (body.length>32000) return error('The generation request is too large.',413);
    let data;
    try { data=JSON.parse(body); }
    catch { return error('Malformed generation request.',400); }
    if (!data||!Array.isArray(data.messages)||data.messages.length!==2||data.messages[0]?.role!=='system'||data.messages[1]?.role!=='user'||
        !data.messages.every(message=>typeof message.content==='string'&&message.content.length<=20000)||
        typeof data.model!=='string'||!/^[-A-Za-z0-9_.:/]{2,140}$/.test(data.model)||
        !Number.isInteger(data.max_tokens)||data.max_tokens<100||data.max_tokens>2000) return error('Invalid model or generation limits.',400);
    const upstream={
      model:data.model,messages:data.messages.map(({role,content})=>({role,content})),max_tokens:data.max_tokens,
      temperature:Math.max(0,Math.min(1.5,Number(data.temperature)||0)),stream:false
    };
    if (data.json_mode===true) upstream.response_format={type:'json_object'};
    const response=await fetchImpl(UPSTREAM+'/chat/completions',{
      method:'POST',headers:{Authorization:key,'Content-Type':'application/json','X-OpenRouter-Title':'Sports League Commissioner'},
      body:JSON.stringify(upstream),signal:AbortSignal.timeout(25000),redirect:'error'
    });
    if (!response.ok) {
      const labels={400:'The selected model rejected this request.',401:'OpenRouter rejected the API key.',402:'OpenRouter reports insufficient credits.',403:'OpenRouter denied the request.',404:'The selected model is unavailable.',429:'OpenRouter rate-limited the request.'};
      return error(labels[response.status]??'OpenRouter is temporarily unavailable.',response.status);
    }
    const result=await response.json();
    if (result.error) return error('OpenRouter could not complete the response.',502);
    const choice=result.choices?.[0];
    return json({content:choice?.message?.content??null,finish:choice?.finish_reason??null,usage:result.usage??{}});
  } catch(err) {
    return error(err.name==='TimeoutError'||err.name==='AbortError'?'OpenRouter timed out.':'OpenRouter could not be reached.',502);
  }
}
