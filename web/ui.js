import { SPORTS } from '../engine/data.js';

const paths = {
  grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
  trophy:'<path d="M8 21h8M12 17v4M7 4h10v7a5 5 0 0 1-10 0zM7 6H3v2a4 4 0 0 0 4 4m10-6h4v2a4 4 0 0 1-4 4"/>',
  shield:'<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/>',
  map:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15m6-12v15"/>',
  chart:'<path d="M3 3v18h18m-14-6 4-5 4 3 5-7"/><path d="M17 6h3v3"/>',
  gavel:'<path d="m13 6 5 5M9 10l5 5M15 4l5 5-8 8-5-5zM11 14l-7 7-2-2 7-7m6 9h7"/>',
  history:'<path d="M3 12a9 9 0 1 1 3 7m-3-7H1m2 0V7m9 0v5l3 2"/>',
  news:'<path d="M6 20h13a2 2 0 0 0 2-2V4H7v14a2 2 0 0 1-4 0v-8h4m3-2h8m-8 4h8m-8 4h5"/>',
  book:'<path d="M5 20a2 2 0 0 1 2-2h13M7 3h13v19H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm2 5h7m-7 4h6"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M9 3h6l.6 2.6 2.2 1.3 2.6-.8 3 5.1-2 1.8v2l2 1.8-3 5.1-2.6-.8-2.2 1.3L15 24H9l-.6-2.6-2.2-1.3-2.6.8-3-5.1 2-1.8v-2l-2-1.8 3-5.1 2.6.8 2.2-1.3Z" transform="translate(2 0) scale(.84 .91)"/>',
  save:'<path d="M4 3h13l4 4v14H3V3zm3 0v6h9V3M7 21v-7h10v7"/>',
  play:'<path d="m8 5 12 7-12 7z" fill="currentColor" stroke-linejoin="round"/>',
  skip:'<path d="m4 6 8 6-8 6zm8 0 8 6-8 6z" fill="currentColor"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4m8-4v4M3 10h18m-13 5h1m3 0h1m3 0h1"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  chevron:'<path d="m9 18 6-6-6-6"/>',
  down:'<path d="m6 9 6 6 6-6"/>',
  right:'<path d="M4 12h15m-6-6 6 6-6 6"/>',
  left:'<path d="M20 12H5m6 6-6-6 6-6"/>',
  upRight:'<path d="M5 19 19 5M7 5h12v12"/>',
  people:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-4"/><circle cx="9" cy="7" r="3.5"/><path d="M16 3.6a3.5 3.5 0 0 1 0 6.8"/>',
  wallet:'<path d="M3 7V5l15-3v5m3 3V7H3v14h18v-3m-3-8h4v8h-4a4 4 0 0 1 0-8Z"/><path d="M18 14h.01"/>',
  activity:'<path d="M3 12h5l3-8 3 16 3-8h4"/>',
  award:'<circle cx="12" cy="8" r="5"/><path d="m8 12-2 9 6-3 6 3-2-9"/>',
  pin:'<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  pause:'<path d="M8 5v14m8-14v14" stroke-width="3"/>',
  menu:'<path d="M3 6h18M3 12h18M3 18h18"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  minus:'<path d="M5 12h14"/>',
  close:'<path d="m6 6 12 12M6 18 18 6"/>',
  search:'<circle cx="10.7" cy="10.7" r="6.6"/><path d="m16 16 4 4"/>',
  spark:'<path d="M12 2l2.1 7.9L22 12l-7.9 2.1L12 22l-2.1-7.9L2 12l7.9-2.1z"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',
  alert:'<path d="M12 3 2 21h20L12 3Zm0 7v4m0 3h.01"/>',
  baseball:'<circle cx="12" cy="12" r="9"/><path d="M5 6a9 9 0 0 1 0 12M19 6a9 9 0 0 0 0 12m-12-9 2-1m-2 5 2 1m6-6 2 1m-2 5 2-1"/>',
  football:'<path d="M21 3C9 3 3 9 3 21c12 0 18-6 18-18ZM7 16l9-9m-7 5 3 3m0-6 3 3"/>',
  basketball:'<circle cx="12" cy="12" r="9"/><path d="m6 6 12 12m0-12L6 18M3.5 9a10 10 0 0 1 11.5 11.5M9 3.5A10 10 0 0 0 20.5 15"/>',
  hockey:'<path d="m18 3-7 13H5l-2 4h8L21 4zM14 20h6"/>',
  download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  upload:'<path d="M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>'
};
export function icon(key,size=18) {
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[key]??paths.info}</svg>`;
}
export function crest() {
  return '<svg width="39" height="44" viewBox="0 0 39 44" aria-hidden="true"><path d="M19.5 1.5 37 7v14c0 9-7.4 15-17.5 21C9.4 36 2 30 2 21V7Z" fill="none" stroke="#c5a260" stroke-width="1.5"/><path d="M8 15h23M10 15v13m19-13v13M8 30h23M13 15v13m13-13v13m-9-11v10m5-10v10M8 13l11.5-5 11.5 5" fill="none" stroke="#dfc081" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="m19.5 32 1.1 2.2 2.5.4-1.8 1.8.4 2.4-2.2-1.2-2.2 1.2.4-2.4-1.8-1.8 2.5-.4Z" fill="#c5a260"/></svg>';
}
export const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch]);
export const num=value=>new Intl.NumberFormat('en-US').format(Math.round(value??0));
const compact=new Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:1});
export const smallNum=value=>compact.format(value??0);
export const usd=value=>`${value<0?'−':''}$${compact.format(Math.abs(value??0))}`;
export const percent=value=>`${Math.round(value??0)}%`;
export const selected=(a,b)=>a===b?' selected':'';
export const checked=value=>value?' checked':'';
export const safeColor=value=>/^#[\da-f]{6}$/i.test(value??'')?value:'#677762';
export const btn=(label,action,{style='',glyph='',attr='',disabled=false}={})=>`<button type="button" class="btn ${style}" data-action="${action}" ${attr}${disabled?' disabled':''}>${glyph?icon(glyph,16):''}<span>${label}</span></button>`;
export const navlink=(label,view)=>`<button class="text-link" type="button" data-action="nav" data-view="${view}">${label} ${icon('right',15)}</button>`;
export const blank=(title,detail)=>`<div class="empty"><div class="empty-icon">${icon('book',21)}</div><strong>${title}</strong><p>${detail}</p></div>`;
export const badge=(label,kind='')=>`<span class="badge ${kind}">${esc(label)}</span>`;
export const clubBadge=(club)=>`<span class="club-mark" style="--club:${safeColor(club?.color)}">${esc((club?.code??'—').slice(0,4))}</span>`;
export const clubLink=(club,{withBadge=true}={})=>club?`<button type="button" class="club-link" data-action="team" data-id="${esc(club.id)}">${withBadge?clubBadge(club):''}<span>${esc(club.name)}</span></button>`:'—';
export const personLink=p=>p?`<button type="button" class="inline-link" data-action="person" data-id="${esc(p.id)}">${esc(p.name)}</button>`:'—';
export const sportIcon=(sport,size)=>icon(Object.hasOwn(SPORTS,sport)?sport:'baseball',size);

export function asset(path) {
  return window.__OFFLINE_ASSETS__?.[path] ?? '/web/assets/'+path;
}
