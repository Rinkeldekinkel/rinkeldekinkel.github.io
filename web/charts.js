import { CITIES } from '../engine/data.js';
import { esc, safeColor, usd } from './ui.js';

const mainland = [
 [-130,55],[-132,54],[-130,52],[-128,51],[-128,49.4],[-125,48.5],[-124.8,47],[-124,46],[-124.1,43],[-124.4,41.8],[-123,40.1],[-122.4,38],[-121.8,37],[-121.9,36.6],[-120.3,34.7],[-117.2,32.6],[-117,32.1],[-116,31.3],[-115,29.7],[-114.2,28.1],[-112,26.2],[-110.8,24.4],[-109.9,22.8],[-110.2,24.2],[-111.1,25.9],[-113.5,28.3],[-114.7,30.9],[-114.4,31.7],[-113.7,30.8],[-112.8,29.8],[-111.9,28.3],[-110.3,27],[-109.5,26],[-108.4,25.4],[-106.2,23],[-105.3,21.5],[-105.6,20.1],[-103.3,18.7],[-101,17.9],[-98,16.1],[-94.3,15.9],[-92.2,14.5],[-89.2,13.4],[-85.7,11],[-82.8,9.5],[-80.2,8.5],[-77,8],[-79.4,9.8],[-81.8,9.4],[-83.4,10.6],[-83.2,14.2],[-85.4,16],[-88.1,16.3],[-87.7,18.4],[-86.8,21.4],[-89.3,21.6],[-90.5,20.5],[-91.1,18.6],[-93.7,18.5],[-95.9,19.4],[-97.2,22],[-97.5,24.9],[-97.2,26.2],[-96.8,27.7],[-94.8,29.5],[-92.4,29.7],[-89.3,29.2],[-88.5,30.3],[-86.6,30.4],[-84.3,29.8],[-83,28.9],[-82.6,27.5],[-81.9,25.2],[-80.5,25],[-80,26.1],[-80.7,28.8],[-81.4,30.8],[-81.2,31.9],[-79.3,33.1],[-78,34.2],[-76.1,35],[-75.5,35.7],[-75.8,37.5],[-75.5,38.3],[-74.9,38.8],[-74.2,39.9],[-74,40.6],[-72.2,41.1],[-71.2,41.5],[-70.4,42.1],[-70,42.8],[-69.5,43.8],[-67,44.8],[-66.9,44.2],[-65.1,43.4],[-63.2,44.7],[-61.4,45.3],[-62,46.1],[-64.7,45.7],[-64.9,46.8],[-66.4,47.8],[-64.7,48.1],[-64.6,48.9],[-66.2,49.3],[-68.8,48.6],[-70.6,47.6],[-71.5,46.6],[-70,48.2],[-67,49.6],[-63,50.1],[-60,50.1],[-56,52.4],[-57.4,54.8],[-62.2,58],[-65,60],[-69,60.5],[-72,62.4],[-77,62.2],[-78.4,60],[-77.8,57.5],[-79,54.5],[-80.4,52.2],[-82.1,52.8],[-83.6,55.1],[-88,55.8],[-92.5,56.9],[-94.5,58.8],[-94.2,61.7],[-90,64.2],[-84.8,65.7],[-89,68],[-96,67.8],[-97,69.8],[-103,68.2],[-108,70.8],[-115,69],[-120,69.8],[-128,70],[-135,69.2],[-141,69.5],[-141,60],[-137,58.5],[-135,58.8],[-132,56.7]
];
const islands=[
 [[-59,47.7],[-58.5,49],[-55.6,52],[-55.1,49.5],[-52.6,47.5],[-55,46.6]],
 [[-128.3,50.9],[-125.8,50.2],[-123.1,48.3],[-124.8,48.5],[-126.8,49.4]],
 [[-85,22],[-83,22.9],[-79.5,22.5],[-75,20.1],[-78,19.7],[-81.9,22.1]],
 [[-74.5,20.1],[-71.5,19.8],[-69,19.2],[-70.1,18.2],[-73.4,18.2]]
];
const lakes = [
 [[-92,46.7],[-89.5,47.9],[-88,48],[-86,47.9],[-84.4,46.6],[-86.8,46.7],[-89,46.95],[-91,46.5]],
 [[-87.2,45.9],[-85.1,45.8],[-86.1,44.8],[-86.1,43],[-86.6,41.8],[-87.5,41.7],[-88.2,43.3],[-87.7,44.9]],
 [[-84.6,46.3],[-82.8,46.0],[-81,46.1],[-80.1,45],[-81.5,44.0],[-82.5,43],[-83.0,44.4],[-84,45.4]],
 [[-83.2,41.8],[-82,41.5],[-80,42.1],[-78.8,42.8],[-79.3,42.9],[-80.7,42.6],[-82.9,42.0]],
 [[-79.8,43.3],[-77,43.4],[-75.9,44.1],[-76.5,44.3],[-78.2,43.9],[-79.7,43.6]]
];
const border=[[-127,49],[-123,49],[-116,49],[-104,49],[-96,49],[-95,49.2],[-95,48.8],[-91,48.2],[-88.5,48.0],[-84.7,46.6],[-84.1,46.5],[-83.5,45.8],[-82.2,45.3],[-82.5,43],[-83,42],[-80,42.3],[-79,43.2],[-76.8,44],[-74.9,45],[-71.2,45],[-70.2,46.8],[-69.2,47.5],[-67.8,47],[-67.7,45.7],[-67.0,44.9]];
const mexico=[[-117.1,32.6],[-114.8,32.7],[-111,31.3],[-108.2,31.3],[-106.5,31.8],[-104,29.7],[-101.1,29.7],[-99.5,27.6],[-97.2,26.0]];

function canvasOf(element) {
  const rect=element.getBoundingClientRect();
  if (!rect.width||!rect.height) return null;
  const scale=Math.min(2,window.devicePixelRatio||1);
  element.width=Math.round(rect.width*scale);
  element.height=Math.round(rect.height*scale);
  const ctx=element.getContext('2d');
  ctx.scale(scale,scale);
  return {ctx,width:rect.width,height:rect.height};
}

function drawPath(ctx,coordinates,projection,close=false) {
  ctx.beginPath();
  coordinates.forEach(([lon,lat],index)=>{
    const [x,y]=projection(lon,lat);
    if (index===0) ctx.moveTo(x,y);
    else ctx.lineTo(x,y);
  });
  if (close) ctx.closePath();
}

export function renderMap(element,teams,full=false) {
  const canvas=element.querySelector('canvas');
  const area=canvasOf(canvas);
  if (!area) return;
  const {ctx,width,height}=area;
  const centers=teams.map(team=>CITIES[team.market]).filter(Boolean);
  let minL=-131,maxL=-61,minA=15,maxA=64;
  if (!full&&centers.length) {
    minL=Math.min(...centers.map(c=>c.lon))-8.5;maxL=Math.max(...centers.map(c=>c.lon))+7.5;
    minA=Math.min(...centers.map(c=>c.lat))-5.6;maxA=Math.max(...centers.map(c=>c.lat))+5.6;
  }
  const ratio=Math.cos((maxA+minA)/2*Math.PI/180);
  const unit=Math.min(width/((maxL-minL)*ratio),height/(maxA-minA));
  const midL=(minL+maxL)/2,midA=(minA+maxA)/2;
  const projection=(lon,lat)=>[width/2+(lon-midL)*unit*ratio,height/2-(lat-midA)*unit];
  ctx.fillStyle='#e8eddf';ctx.fillRect(0,0,width,height);
  ctx.strokeStyle='#c5cdbd';ctx.lineWidth=.85;
  for (const outline of [mainland,...islands]) {
    drawPath(ctx,outline,projection,true);
    ctx.fillStyle='#f4f1e3';ctx.fill();ctx.stroke();
  }
  for (const lake of lakes) {
    drawPath(ctx,lake,projection,true);
    ctx.fillStyle='#dfe7d8';ctx.fill();ctx.stroke();
  }
  ctx.save();
  ctx.setLineDash([2.5,3]);
  for (const path of [border,mexico]) { drawPath(ctx,path,projection);ctx.stroke(); }
  ctx.strokeStyle='#a9b39d45';ctx.lineWidth=.65;
  for (let lon=-135;lon<=-60;lon+=5) {drawPath(ctx,[[lon,12],[lon,70]],projection);ctx.stroke();}
  for (let lat=15;lat<=65;lat+=5) {drawPath(ctx,[[-140,lat],[-54,lat]],projection);ctx.stroke();}
  ctx.restore();
  const labels=full?[[-105,54,'CANADA'],[-102,35,'UNITED STATES'],[-104,22,'MEXICO'],[-70,34,'ATLANTIC OCEAN']]:[[-82,47.3,'CANADA'],[-87,35.9,'UNITED STATES']];
  ctx.fillStyle='#7b856b';ctx.font='600 9px sans-serif';ctx.textAlign='center';
  for (const [lon,lat,text] of labels) {
    const [x,y]=projection(lon,lat);
    if (x>32&&x<width-32&&y>11&&y<height-10) ctx.fillText(text,x,y);
  }
  const placed=[];
  element.querySelector('.map-pins').innerHTML=teams.map(t=>{
    const c=CITIES[t.market];
    if (!c) return '';
    const [x,y]=projection(c.lon,c.lat);
    if (x<3||x>width-3||y<3||y>height-3) return '';
    const collision=placed.some(p=>Math.hypot(p[0]-x,p[1]-y)<9);
    const bump=collision?9:0;
    placed.push([x+bump,y-bump]);
    return `<button type="button" class="map-pin" style="left:${x+bump}px;top:${y-bump}px;--pin:${safeColor(t.color)}" title="${esc(t.name+' · '+c.name)}" aria-label="${esc(t.name+' in '+c.name)}" data-action="team" data-id="${esc(t.id)}"><i></i></button>`;
  }).join('');
}

export function renderFinance(canvas,series,metric) {
  const area=canvasOf(canvas);
  if (!area) return;
  const {ctx,width,height}=area;
  const grid={left:61,right:16,top:18,bottom:24};
  const plotW=width-grid.left-grid.right,plotH=height-grid.top-grid.bottom;
  if (!series.length||plotW<30) return;
  const all=series.flatMap(row=>metric==='attendance'?[row.average]:[row.revenue,row.expense]);
  const max=Math.max(1,...all)*1.11;
  const x=index=>grid.left+(series.length===1?plotW/2:plotW*index/(series.length-1));
  const y=value=>grid.top+(1-value/max)*plotH;
  ctx.font='11px sans-serif';ctx.textAlign='right';ctx.textBaseline='middle';
  for (let index=0;index<5;index++) {
    const value=max*index/4;
    const at=y(value);
    ctx.strokeStyle='#dedfd2';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(grid.left,at);ctx.lineTo(width-grid.right,at);ctx.stroke();
    ctx.fillStyle='#66726a';
    ctx.fillText(metric==='attendance'?Math.round(value).toLocaleString('en-US'):usd(value),grid.left-7,at);
  }
  const lines=metric==='attendance'?[['average','#54664d']]:[['revenue','#466e56'],['expense','#b47c43']];
  for (const [key,color] of lines) {
    const trend=series.map((row,i)=>[x(i),y(row[key])]);
    ctx.beginPath();
    trend.forEach(([px,py],i)=>i?ctx.lineTo(px,py):ctx.moveTo(px,py));
    ctx.strokeStyle=color;ctx.lineWidth=2.4;ctx.stroke();
    for (const [px,py] of (series.length<12?trend:[])) {
      ctx.beginPath();ctx.arc(px,py,3.3,0,2*Math.PI);ctx.fillStyle=color;ctx.fill();
    }
  }
  ctx.textAlign='center';ctx.fillStyle='#66726a';
  for (let i=0;i<series.length;i+=Math.max(1,Math.ceil(series.length/(width<420?5:9)))) ctx.fillText(series[i].year,x(i),height-8);
  canvas.onpointermove=event=>{
    const rectangle=canvas.getBoundingClientRect();
    const index=Math.max(0,Math.min(series.length-1,Math.round((event.clientX-rectangle.left-grid.left)/plotW*(series.length-1))));
    const row=series[index];
    const panel=canvas.parentElement.querySelector('.chart-detail');
    if (panel) panel.textContent=metric==='attendance'?`${row.year} · ${row.average.toLocaleString('en-US')} per game`:`${row.year} · ${usd(row.revenue)} revenue · ${usd(row.expense)} expenses`;
  };
}
