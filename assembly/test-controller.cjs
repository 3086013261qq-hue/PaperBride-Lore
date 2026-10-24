const {createPaperBrideController}=require('./src/controller.js'),fs=require('fs'),assert=require('node:assert/strict');
const card=JSON.parse(fs.readFileSync('delivery/PaperBride_1-9_v1.0.0_assembly-candidate.json')),manifest=JSON.parse(fs.readFileSync('assembly/media-manifest.assembly.json'));
const original=card.data.character_book.entries,clone=x=>JSON.parse(JSON.stringify(x)),baselines=Object.fromEntries(original.filter(e=>e.comment.startsWith('时间线-')).map(e=>[e.comment.slice(4,10),e.content]));
let book=clone(original),st={},writes=[],fail=false,corrupt=false,epoch=0;const tests=[];
const env={read:async()=>clone(book),status:()=>st,context:()=>epoch,write:async next=>{writes.push(clone(next));book=clone(next);if(corrupt){corrupt=false;book.find(e=>e.comment.startsWith('时间线-MAIN01')).enabled=true;}if(fail){fail=false;throw Error('injected transport error');}}};
const c=createPaperBrideController(env,manifest.chapters,baselines);function check(n,f){assert(f,n);tests.push({name:n,pass:true});}
(async()=>{
 check('initial one MAIN01 enabled',c.assert(book).ACTIVE==='MAIN01');
 for(const id of Object.keys(manifest.chapters)){
  const before=writes.length;await c.enter(id);check(id+' single transaction',writes.length===before+1);check(id+' ACTIVE/enabled sync',c.assert(book).ACTIVE===id);
  const exact=JSON.stringify(book);
  for(const event of ['沙盒模式过渡','至 沙盒模式过渡','过渡到沙盒模式','即将进入沙盒','SANDBOX_PENDING']){st={main:id,event,date:'2030-01-02'};const s=await c.load();check(id+event+' no handoff',JSON.stringify(book)===exact&&s.state.DATE_LOCK);}
  let rejected=false;try{await c.enter(id==='MAIN09'?'MAIN01':'MAIN09');}catch{rejected=true;}check(id+' active plot lock blocks switch',rejected&&JSON.stringify(book)===exact);
  st={main:id,event:'沙盒模式',date:manifest.chapters[id].defaultStart};const s=await c.load();check(id+' stable sandbox unlock only',!s.state.DATE_LOCK&&JSON.stringify(book)===exact);
 }
 st={main:'MAIN09',event:'沙盒模式',date:'2035-12-31'};await c.enter('MAIN03');let s=c.assert(book);check('rebase never rolls date back',s.currentDate==='2035-12-31'&&s.MAIN_DATE_REBASE>0);let text=book.find(e=>e.comment.startsWith('时间线-MAIN03')).content;check('relative timeline shift preserves facts',text.includes('21:04')&&text.includes('23:27')&&text.includes('01:44')&&text.includes('03:19')&&text.replace(/\d{4} 年 \d{1,2} 月 \d{1,2} 日/g,'DATE')===baselines.MAIN03.replace(/\d{4} 年 \d{1,2} 月 \d{1,2} 日/g,'DATE'));
 st={main:'MAIN03',event:'沙盒模式',date:'2036-01-02'};let before=JSON.stringify(book);fail=true;await assert.rejects(()=>c.enter('MAIN04'));check('failed write rolls back full worldbook',JSON.stringify(book)===before&&!c.isFault());
 corrupt=true;await assert.rejects(()=>c.enter('MAIN04'));check('readback mismatch rolls back full book',JSON.stringify(book)===before);
 let r=await Promise.allSettled([c.enter('MAIN04'),c.enter('MAIN05')]);check('concurrent requests serialized',r.filter(x=>x.status==='fulfilled').length===1&&c.assert(book).ACTIVE==='MAIN04');
 for(const b of writes)check('every full write has one enabled MAIN',b.filter(e=>e.comment.startsWith('时间线-')&&e.enabled).length===1);
 function rx(name){let x=original.find(e=>e.comment===name).keys[0],end=x.lastIndexOf('/');return new RegExp(x.slice(1,end),x.slice(end+1));}
 check('historical Cui does not recall modern Cui',!rx('角色：崔婉莺').test('<story_scene>民国崔婉莺</story_scene>')&&rx('角色：崔婉莺（民国）').test('<story_scene>民国崔婉莺</story_scene>'));
 check('new ghost merchant does not recall original',!rx('角色：八不郎').test('<story_scene>新八不郎</story_scene>'));
 fs.writeFileSync('assembly/controller-test-report.json',JSON.stringify({environment:'Node mock helper worldbook API, not SillyTavern integration',tests},null,2));console.log('PASS',tests.length);
})().catch(e=>{console.error(e);process.exit(1)});
