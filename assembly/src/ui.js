(function(){
 'use strict';
 const W=window.parent,D=W.document;W.__PaperBrideDispose?.();
 let disposed=false,epoch=0,controller=null,bookName=null,music=null,observer=null,previewId=null;
 const root=D.createElement('section');root.className='pb-host';root.setAttribute('aria-label','纸嫁衣篇章与音乐');
 root.innerHTML='<button class="pb-launch" data-action="open">纸嫁衣 · 展开婚书</button><div class="pb-panel" hidden><header><span class="pb-ties" aria-hidden="true"><i></i><i></i></span><h2>纸上姻缘</h2><button data-action="close" aria-label="合上婚书">合上</button></header><nav aria-label="婚书栏目"><button data-action="chapters" aria-selected="true">九卷篇章</button><button data-action="music" aria-selected="false">灯下余音</button></nav><div class="pb-chapters"><div class="pb-carousel" tabindex="0" aria-label="九卷左右滑动预览"><button class="pb-arrow pb-prev" data-action="prev" aria-label="上一卷">‹</button><div class="pb-viewport"><div class="pb-track"></div></div><button class="pb-arrow pb-next" data-action="next" aria-label="下一卷">›</button></div><div class="pb-dots" aria-label="篇章位置"></div><section class="pb-preview-panel"></section></div><div class="pb-music" hidden></div><p class="pb-note" role="status" aria-live="polite">左右滑动只预览；确认按钮才会真正切换篇章。</p><div class="pb-lattice" aria-hidden="true"></div></div>';
 const panel=root.querySelector('.pb-panel'),track=root.querySelector('.pb-track'),viewport=root.querySelector('.pb-viewport'),dots=root.querySelector('.pb-dots'),previewPanel=root.querySelector('.pb-preview-panel'),musicRoot=root.querySelector('.pb-music'),notice=root.querySelector('[role=status]'),carousel=root.querySelector('.pb-carousel');
 const fx=D.createElement('div');fx.className='pb-fx';fx.setAttribute('aria-hidden','true');for(let i=0;i<10;i++){const n=D.createElement('i');n.className=i<6?'pb-ash':i<8?'pb-thread':'pb-glow';n.style.setProperty('--x',`${7+i*9}%`);n.style.setProperty('--delay',`${-i*2}s`);fx.append(n);}root.append(fx);
 const style=D.createElement('style');style.textContent=PB_CSS;root.append(style);
 const say=t=>{notice.textContent=t;};
 const ids=()=>Object.keys(PB_MANIFEST.chapters);
 function nativeStatus(){try{const messages=getChatMessages('0-'+getLastMessageId()).filter(m=>m.role==='assistant');for(let i=messages.length-1;i>=0;i--){const text=messages[i].message||'',matches=[...text.matchAll(/<status>([\s\S]*?)<\/status>/g)];if(!matches.length)continue;const s=matches.at(-1)[1],m=(s.match(/^当前篇章:\s*(MAIN\d{2})\s*$/m)||[])[1],event=(s.match(/^当前事件:\s*(.*?)\s*$/m)||[])[1],date=(s.match(/^当前日期:\s*(\d{4}-\d{2}-\d{2})\s*$/m)||[])[1];return {main:m,event,date};}}catch{}return {};}
 async function resolve(){
  const names=await getCharWorldbookNames('current');let candidates=[names.primary,...(names.additional||[])].filter(Boolean),found=[];
  for(const n of [...new Set(candidates)]){const b=await getWorldbook(n);if(b.some(e=>(e.name||e.comment)==='核心规则：纸嫁衣运行时'))found.push(n);}
  if(found.length!==1)throw Error('需要唯一绑定的纸嫁衣世界书，请检查角色世界书绑定');bookName=found[0];
  controller=createPaperBrideController({read:()=>getWorldbook(bookName),write:b=>replaceWorldbook(bookName,b,{render:'immediate'}),status:nativeStatus,context:()=>epoch},PB_MANIFEST.chapters,PB_BASELINES);
 }
 function setPreview(id,animate=true){
  const list=ids();if(!list.includes(id))id=list[0];previewId=id;const index=list.indexOf(id);track.style.transition=animate?'transform .28s ease':'none';track.style.transform=`translate3d(${-index*100}%,0,0)`;
  [...track.children].forEach((el,i)=>el.setAttribute('aria-hidden',String(i!==index)));
  [...dots.children].forEach((el,i)=>el.setAttribute('aria-current',String(i===index)));
  drawPreviewPanel();
 }
 function drawPreviewPanel(){
  if(!previewId)return;const c=PB_MANIFEST.chapters[previewId],slide=track.querySelector(`[data-chapter="${previewId}"]`),active=slide?.getAttribute('aria-current')==='true';
  previewPanel.replaceChildren();const title=D.createElement('div');title.className='pb-preview-title';title.innerHTML='<span></span><strong></strong>';title.querySelector('span').textContent=previewId;title.querySelector('strong').textContent=c.title;previewPanel.append(title);
  const meta=D.createElement('p');meta.className='pb-meta';meta.textContent=(active?'当前已启用 · ':'预览中 · ')+'默认起点 '+c.defaultStart;previewPanel.append(meta);
  const enter=D.createElement('button');enter.dataset.action='enter';enter.textContent=active?'当前篇章':'进入此卷 / 开始新篇章';enter.disabled=active;previewPanel.append(enter);
 }
 async function draw(){if(disposed)return;try{if(!controller)await resolve();const {state}=await controller.load(),list=ids();track.replaceChildren();dots.replaceChildren();for(const [id,c]of Object.entries(PB_MANIFEST.chapters)){
   const card=D.createElement('article');card.className='pb-slide';card.dataset.chapter=id;card.setAttribute('aria-current',String(state.ACTIVE===id));
   const art=D.createElement('button');art.className='pb-art';art.dataset.action='select';art.dataset.chapter=id;art.setAttribute('aria-label',id+' '+c.title+' 预览');
   const fallback=D.createElement('span');fallback.textContent=c.title;art.append(fallback);const im=D.createElement('img');im.alt='';im.loading='lazy';im.src=PB_MANIFEST.assetBase+c.cover;im.style.objectPosition=c.objectPosition||'50% 50%';im.onerror=()=>im.remove();art.append(im);
   const veil=D.createElement('span');veil.className='pb-veil';art.append(veil);const label=D.createElement('div');label.className='pb-slide-label';label.innerHTML='<small></small><strong></strong>';label.querySelector('small').textContent=id;label.querySelector('strong').textContent=c.title;art.append(label);
   if(state.ACTIVE===id){const s=D.createElement('span');s.className='pb-stamp';s.textContent='当前';art.append(s);}card.append(art);track.append(card);
   const dot=D.createElement('button');dot.className='pb-dot';dot.dataset.action='dot';dot.dataset.chapter=id;dot.setAttribute('aria-label','预览 '+id+' '+c.title);dots.append(dot);
  }
  if(!previewId||!list.includes(previewId))previewId=state.ACTIVE;setPreview(previewId,false);
 }catch(e){say(e.message);}}
 function shift(delta){const list=ids(),i=Math.max(0,list.indexOf(previewId));setPreview(list[Math.max(0,Math.min(list.length-1,i+delta))]);}
 function ensureMusic(){if(music)return;music=W.__PaperBrideMusic.attach(musicRoot,PB_MANIFEST.tracks.map(t=>({title:(t.chapter||'余音')+' · '+t.title,artist:t.artist,track_id:t.verify==='VERIFIED'?t.neteaseId:null})));}
 function showChapters(){musicRoot.hidden=true;root.querySelector('.pb-chapters').hidden=false;draw();}
 function showMusic(){root.querySelector('.pb-chapters').hidden=true;musicRoot.hidden=false;ensureMusic();}
 async function click(e){const b=e.target.closest('button');if(!b||!root.contains(b))return;const a=b.dataset.action;
  if(a==='select'||a==='dot'){setPreview(b.dataset.chapter);return;}
  if(a==='prev'){shift(-1);return;}if(a==='next'){shift(1);return;}
  if(a==='open'){panel.hidden=false;b.hidden=true;root.querySelectorAll('nav button').forEach(n=>n.setAttribute('aria-selected',String(n.dataset.action==='chapters')));showChapters();}
  if(a==='close'){panel.hidden=true;root.querySelector('.pb-launch').hidden=false;}
  if(a==='chapters'){showChapters();}
  if(a==='music'){showMusic();}
  if(a==='chapters'||a==='music')root.querySelectorAll('nav button').forEach(n=>n.setAttribute('aria-selected',String(n.dataset.action===a)));
  if(a==='enter'){const id=previewId;if(!id)return;root.querySelectorAll('button').forEach(n=>n.disabled=true);try{if(!controller)await resolve();const s=await controller.enter(id);say('已进入 '+id+' · '+PB_MANIFEST.chapters[id].title+'；起点 '+s.currentDate);await draw();}catch(err){say(err.message);}finally{root.querySelectorAll('button').forEach(n=>n.disabled=false);drawPreviewPanel();}}
 }
 root.addEventListener('click',click);
 carousel.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();shift(-1);}if(e.key==='ArrowRight'){e.preventDefault();shift(1);}if(e.key==='Home'){e.preventDefault();setPreview(ids()[0]);}if(e.key==='End'){e.preventDefault();setPreview(ids().at(-1));}});
 let drag=null;
 viewport.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,dx:0};viewport.setPointerCapture?.(e.pointerId);track.style.transition='none';});
 viewport.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;drag.dx=e.clientX-drag.x;const dy=e.clientY-drag.y;if(Math.abs(drag.dx)<Math.abs(dy))return;const list=ids(),i=Math.max(0,list.indexOf(previewId)),w=Math.max(1,viewport.clientWidth);track.style.transform=`translate3d(${(-i*100)+(drag.dx/w*100)}%,0,0)`;});
 function finishDrag(e){if(!drag||e.pointerId!==drag.id)return;const dx=drag.dx;drag=null;try{viewport.releasePointerCapture?.(e.pointerId);}catch{}if(Math.abs(dx)>=56)shift(dx<0?1:-1);else setPreview(previewId);}
 viewport.addEventListener('pointerup',finishDrag);viewport.addEventListener('pointercancel',finishDrag);
 function mount(){if(disposed||root.isConnected)return;const boxes=[...D.querySelectorAll('#chat > .mes[is_user="false"] .mes_text')];const target=boxes.at(-1);if(target)target.append(root);}
 const offs=[];function listen(event,fn){try{const off=eventOn(event,fn);if(typeof off==='function')offs.push(off);}catch{}}
 for(const key of ['CHARACTER_MESSAGE_RENDERED','MESSAGE_UPDATED','MESSAGE_SWIPED','MESSAGE_DELETED'])listen(tavern_events[key],()=>{mount();if(!panel.hidden&&!root.querySelector('.pb-chapters').hidden)draw();});
 listen(tavern_events.CHAT_CHANGED,()=>{epoch++;controller=null;bookName=null;music?.dispose();music=null;musicRoot.replaceChildren();panel.hidden=true;root.querySelector('.pb-launch').hidden=false;if(!root.isConnected)mount();});
 observer=new W.MutationObserver(()=>{if(!root.isConnected)mount();});const chat=D.querySelector('#chat');if(chat)observer.observe(chat,{childList:true,subtree:false});mount();
 const dispose=()=>{disposed=true;epoch++;music?.dispose();music=null;observer?.disconnect();offs.forEach(f=>f());root.remove();};W.__PaperBrideDispose=dispose;window.addEventListener('pagehide',dispose,{once:true});
})();
