(function(){
 'use strict';
 const W=window.parent,D=W.document;W.__PaperBrideDispose?.();
 let disposed=false,epoch=0,controller=null,bookName=null,music=null,observer=null;
 const root=D.createElement('section');root.className='pb-host';root.setAttribute('aria-label','纸嫁衣篇章与音乐');
 root.innerHTML='<button class="pb-launch" data-action="open">纸嫁衣 · 展开婚书</button><div class="pb-panel" hidden><header><span class="pb-ties" aria-hidden="true"><i></i><i></i></span><h2>纸上姻缘</h2><button data-action="close" aria-label="合上婚书">合上</button></header><nav aria-label="婚书栏目"><button data-action="chapters" aria-selected="true">九卷篇章</button><button data-action="music" aria-selected="false">灯下余音</button></nav><div class="pb-chapters"><div class="pb-grid"></div></div><div class="pb-music" hidden></div><p class="pb-note" role="status" aria-live="polite">请选择篇章；封面预览不会改变故事。</p><div class="pb-lattice" aria-hidden="true"></div></div>';
 const panel=root.querySelector('.pb-panel'),grid=root.querySelector('.pb-grid'),musicRoot=root.querySelector('.pb-music'),notice=root.querySelector('[role=status]');
 const fx=D.createElement('div');fx.className='pb-fx';fx.setAttribute('aria-hidden','true');for(let i=0;i<10;i++){const n=D.createElement('i');n.className=i<6?'pb-ash':i<8?'pb-thread':'pb-glow';n.style.setProperty('--x',`${7+i*9}%`);n.style.setProperty('--delay',`${-i*2}s`);fx.append(n);}root.append(fx);
 const style=D.createElement('style');style.textContent=PB_CSS;root.append(style);
 const say=t=>{notice.textContent=t;};
 function nativeStatus(){try{const messages=getChatMessages('0-'+getLastMessageId()).filter(m=>m.role==='assistant');for(let i=messages.length-1;i>=0;i--){const text=messages[i].message||'',matches=[...text.matchAll(/<status>([\s\S]*?)<\/status>/g)];if(!matches.length)continue;const s=matches.at(-1)[1],m=(s.match(/^当前篇章:\s*(MAIN\d{2})\s*$/m)||[])[1],event=(s.match(/^当前事件:\s*(.*?)\s*$/m)||[])[1],date=(s.match(/^当前日期:\s*(\d{4}-\d{2}-\d{2})\s*$/m)||[])[1];return {main:m,event,date};}}catch{}return {};}
 async function resolve(){
  const names=await getCharWorldbookNames('current');let candidates=[names.primary,...(names.additional||[])].filter(Boolean),found=[];
  for(const n of [...new Set(candidates)]){const b=await getWorldbook(n);if(b.some(e=>(e.name||e.comment)==='核心规则：纸嫁衣运行时'))found.push(n);}
  if(found.length!==1)throw Error('需要唯一绑定的纸嫁衣世界书，请检查角色世界书绑定');bookName=found[0];
  controller=createPaperBrideController({read:()=>getWorldbook(bookName),write:b=>replaceWorldbook(bookName,b,{render:'immediate'}),status:nativeStatus,context:()=>epoch},PB_MANIFEST.chapters,PB_BASELINES);
 }
 async function draw(){if(disposed)return;try{if(!controller)await resolve();const {state}=await controller.load();grid.replaceChildren();for(const [id,c]of Object.entries(PB_MANIFEST.chapters)){
  const b=D.createElement('button');b.className='pb-cover';b.dataset.chapter=id;b.setAttribute('aria-current',String(state.ACTIVE===id));b.setAttribute('aria-label',id+' '+c.title+' 预览');const a=D.createElement('span');a.className='pb-art';const fallback=D.createElement('span');fallback.textContent=c.title;a.append(fallback);const im=D.createElement('img');im.alt='';im.loading='lazy';im.src=PB_MANIFEST.assetBase+c.cover;im.onerror=()=>im.remove();a.append(im);b.append(a);const label=D.createElement('strong');label.textContent=id+' · '+c.title.replace(/^纸嫁衣[2-9]：/,'');b.append(label);if(state.ACTIVE===id){const s=D.createElement('span');s.className='pb-stamp';s.textContent='当前篇章';b.append(s);}grid.append(b);}
 }catch(e){say(e.message);}}
 function preview(id){grid.querySelector('.pb-confirm')?.remove();const c=PB_MANIFEST.chapters[id],box=D.createElement('section');box.className='pb-confirm';box.dataset.target=id;const h=D.createElement('h3');h.textContent=id+' · '+c.title;box.append(h);const p=D.createElement('p');p.textContent='默认起点 '+c.defaultStart+'。'+(grid.querySelector('[data-chapter="'+id+'"]').getAttribute('aria-current')==='true'?'当前已启用。':'当前未启用。')+'切换篇章将更换当前主线世界书，既有历史不会被删除。当前卷进行中时，请先完成本卷。';box.append(p);for(const [action,title]of [['enter','进入此卷 / 开始新篇章'],['cancel','暂不进入']]){const b=D.createElement('button');b.dataset.action=action;b.textContent=title;box.append(b);}grid.prepend(box);box.querySelector('button').focus();}
 function stopMusic(){music?.dispose();music=null;musicRoot.replaceChildren();}
 function showMusic(){stopMusic();root.querySelector('.pb-chapters').hidden=true;musicRoot.hidden=false;music=W.__PaperBrideMusic.attach(musicRoot,PB_MANIFEST.tracks.map(t=>({title:(t.chapter||'余音')+' · '+t.title,artist:t.artist,track_id:t.verify==='VERIFIED'?t.neteaseId:null})));}
 async function click(e){const b=e.target.closest('button');if(!b||!root.contains(b))return;if(b.dataset.chapter){preview(b.dataset.chapter);return;}const a=b.dataset.action;
  if(a==='open'){panel.hidden=false;b.hidden=true;musicRoot.hidden=true;root.querySelector('.pb-chapters').hidden=false;root.querySelectorAll('nav button').forEach(n=>n.setAttribute('aria-selected',String(n.dataset.action==='chapters')));await draw();}
  if(a==='close'){panel.hidden=true;root.querySelector('.pb-launch').hidden=false;stopMusic();}
  if(a==='chapters'){stopMusic();musicRoot.hidden=true;root.querySelector('.pb-chapters').hidden=false;await draw();}
  if(a==='music')showMusic();
  if(a==='chapters'||a==='music')root.querySelectorAll('nav button').forEach(n=>n.setAttribute('aria-selected',String(n.dataset.action===a)));
  if(a==='cancel')b.closest('.pb-confirm').remove();
  if(a==='enter'){const id=b.closest('.pb-confirm').dataset.target;root.querySelectorAll('button').forEach(n=>n.disabled=true);try{if(!controller)await resolve();const s=await controller.enter(id);say('已进入 '+id+' · '+PB_MANIFEST.chapters[id].title+'；起点 '+s.currentDate);await draw();}catch(err){say(err.message);}finally{root.querySelectorAll('button').forEach(n=>n.disabled=false);}}
 }
 root.addEventListener('click',click);
 function mount(){if(disposed)return;const boxes=[...D.querySelectorAll('#chat > .mes[is_user="false"] .mes_text')];const target=boxes.at(-1);if(target&&!target.contains(root)){stopMusic();target.append(root);}}
 const offs=[];function listen(event,fn){try{const off=eventOn(event,fn);if(typeof off==='function')offs.push(off);}catch{}}
 for(const key of ['CHARACTER_MESSAGE_RENDERED','MESSAGE_UPDATED','MESSAGE_SWIPED','MESSAGE_DELETED'])listen(tavern_events[key],()=>{mount();if(!panel.hidden)draw();});
 listen(tavern_events.CHAT_CHANGED,()=>{epoch++;controller=null;bookName=null;stopMusic();panel.hidden=true;root.querySelector('.pb-launch').hidden=false;mount();});
 observer=new W.MutationObserver(()=>{if(!root.isConnected)mount();});const chat=D.querySelector('#chat');if(chat)observer.observe(chat,{childList:true,subtree:false});mount();
 const dispose=()=>{disposed=true;epoch++;stopMusic();observer?.disconnect();offs.forEach(f=>f());root.remove();};W.__PaperBrideDispose=dispose;window.addEventListener('pagehide',dispose,{once:true});
})();
