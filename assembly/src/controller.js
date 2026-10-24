/* Single-worldbook transaction adapter. No clock or sandbox event can call enter(). */
function createPaperBrideController(env,chapters,baselines){
 const stateName='核心规则：纸嫁衣运行时';let busy=false,fault=false;
 const clone=x=>JSON.parse(JSON.stringify(x));
 const name=e=>e.name||e.comment||'';
 const main=e=>(name(e).match(/^时间线-(MAIN\d{2})[｜-]/)||[])[1];
 const on=e=>e.enabled!==undefined?e.enabled:!e.disable;
 function enable(e,v){if('enabled'in e)e.enabled=v;else e.disable=!v;return e;}
 const readState=book=>{const e=book.find(e=>name(e)===stateName);if(!e)throw Error('未找到运行时规则');const m=e.content.match(/<paperbride_runtime>([\s\S]*?)<\/paperbride_runtime>/);if(!m)throw Error('运行时记录损坏');return JSON.parse(m[1]);};
 function assert(book){const s=readState(book),all=book.filter(main),active=all.filter(on);if(all.length!==9||new Set(all.map(main)).size!==9||active.length!==1||main(active[0])!==s.ACTIVE)throw Error('世界书篇章状态不一致');return s;}
 function iso(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s||''))return null;let d=new Date(s+'T00:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===s?s:null;}
 const plus=(s,days)=>new Date(+new Date(s+'T00:00:00Z')+days*86400000).toISOString().slice(0,10);
 function shifted(text,days){return text.replace(/(\d{4}) 年 (\d{1,2}) 月 (\d{1,2}) 日/g,(all,y,m,d)=>{const s=plus(`${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`,days),a=s.split('-');return `${+a[0]} 年 ${+a[1]} 月 ${+a[2]} 日`;});}
 function status(s){const r=env.status?.()||{};const matching=r.main===s.ACTIVE;const stable=matching&&r.event==='沙盒模式';const date=matching&&iso(r.date)&&r.date>=s.currentDate?r.date:s.currentDate;const started=s.started||!!(matching&&r.event);return {...s,started,currentDate:date,DATE_LOCK:started&&!stable,stable};}
 async function load(){const book=await env.read();return {book,state:status(assert(book))};}
 async function enter(target){
  if(!chapters[target])throw Error('未知篇章');if(fault)throw Error('上次回滚未确认，请检查世界书后重载');if(busy)throw Error('正在切换，请稍候');busy=true;
  let before=null,wrote=false,context=env.context?.();
  try{
   const loaded=await load();before=clone(loaded.book);const s=loaded.state;
   if(s.started&&target===s.ACTIVE)throw Error('已在当前篇章');
   if(s.DATE_LOCK&&target!==s.ACTIVE)throw Error('当前卷尚未结束，请在稳定沙盒期开始新篇章');
   const next=clone(before),start=chapters[target].defaultStart,date=s.currentDate>start?s.currentDate:start;
   const days=Math.round((+new Date(date+'T00:00:00Z')-new Date(start+'T00:00:00Z'))/86400000);
   const fresh={ACTIVE:target,currentDate:date,DATE_LOCK:true,MAIN_DATE_REBASE:days,started:true};
   for(const e of next){const id=main(e);if(id){enable(e,id===target);if(id===target)e.content=shifted(baselines[id],days);}if(name(e)===stateName)e.content=e.content.replace(/<paperbride_runtime>[\s\S]*?<\/paperbride_runtime>/,'<paperbride_runtime>'+JSON.stringify(fresh)+'</paperbride_runtime>');}
   assert(next);if(env.context?.()!==context)throw Error('聊天已更换');
   // Same book API, one complete write: ACTIVE + nine enabled + rebased dates.
   wrote=true;await env.write(next);const actual=await env.read();const verified=assert(actual);
   if(JSON.stringify(actual)!==JSON.stringify(next)||verified.ACTIVE!==target)throw Error('切换写入未通过回读校验');
   return fresh;
  }catch(e){if(wrote&&before){try{if(env.context?.()!==context)throw Error('聊天已更换，不能覆盖新聊天');await env.write(before);if(JSON.stringify(await env.read())!==JSON.stringify(before))throw Error('回滚回读不一致');assert(before);}catch(r){fault=true;throw Error(e.message+'；回滚未确认：'+r.message);}}throw e;
  }finally{busy=false;}
 }
 return {load,enter,assert,shifted,isBusy:()=>busy,isFault:()=>fault};
}
if(typeof module!=='undefined')module.exports={createPaperBrideController};
