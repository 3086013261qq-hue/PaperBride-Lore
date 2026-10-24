from pathlib import Path
import json,re,hashlib,copy,shutil,sys
R=Path(__file__).resolve().parents[1];A=R/'assembly';O=R/'delivery';O.mkdir(exist_ok=True)
def dump(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def digest(s):return hashlib.sha256(s.encode()).hexdigest()
m=json.loads((R/'mvu/media-manifest.v1.json').read_text());mother=json.loads((A/'mother-template.json').read_text())['entries'];entries=[];inventory=[]
def add(n,c,o,keys=None,on=True,pos='after_char',kind=None,source=None):
 e={'id':0,'keys':keys or [],'secondary_keys':[],'comment':n,'content':c,'constant':not bool(keys),'selective':bool(keys),'insertion_order':o,'enabled':on,'position':pos,'use_regex':bool(keys and keys[0].startswith('/')),'extensions':{'position':{'before_char':0,'after_char':1,'at_depth':4}[pos],'depth':0 if pos=='at_depth' else 4,'probability':100,'useProbability':True,'scan_depth':2,'scanDepth':2,'exclude_recursion':False,'prevent_recursion':False,'match_whole_words':False,'case_sensitive':False}}
 entries.append(e)
 if kind:inventory.append({'name':n,'kind':kind,'source':source,'sha256':digest(c)})
 return e
for e in mother.values():
 if e['order']>=551 or e['comment'].startswith('【'):
  add(e['comment'],e['content'],e['order'],on=not e['disable'],pos='before_char' if e['position']==0 else 'after_char')
regex={}
for p in sorted((R/'characters').glob('p*/*触发正则*.md')):
 for n,key in re.findall(r'^- ([^：\n]+)：`([^`]+)`',p.read_text(),re.M):regex[n.replace('（原八不郎）','')]=key
for p in sorted((R/'characters').glob('p*/*.md')):
 for match in re.finditer(r'<([^<>\n]+)character>[\s\S]*?</\1character>',p.read_text()):
  n=match[1];is_major='/p0/' in str(p);num=sum(x['kind']==('major' if is_major else 'other') for x in inventory);add('角色：'+n,match[0],(202 if is_major else 102)+num,[regex[n]],kind='major' if is_major else 'other',source=str(p.relative_to(R)))
for p in sorted((R/'characters').glob('p*/*能力条目*.md')):
 for match in re.finditer(r'<核心设定:([^<>\n]+)>[\s\S]*?</核心设定:\1>',p.read_text()):
  n=match[1];num=sum(x['kind']in ['ability','folklore'] for x in inventory);add('核心设定：'+n,match[0],302+num,[regex[n.split('·')[0]]],kind='ability',source=str(p.relative_to(R)))
folk={}
for line in (R/'folklore/设定召回关键词_v1.md').read_text().splitlines():
 cells=[x.strip() for x in line.split('|')];
 if len(cells)>4 and re.fullmatch('F\\d+',cells[1]):folk[cells[2]]=[x.strip() for x in cells[3].split(',')]
for p in sorted((R/'folklore/cards').glob('*.md')):
 for match in re.finditer(r'<核心设定:([^<>\n]+)>[\s\S]*?</核心设定:\1>',p.read_text()):
  n=match[1];num=sum(x['kind']in ['ability','folklore'] for x in inventory);add('核心设定：'+n,match[0],302+num,folk[n],kind='folklore',source=str(p.relative_to(R)))
loc={n:key for n,key in re.findall(r'^- L\d+ ([^：\n]+)：`([^`]+)`',(R/'locations/地点触发正则_v1.md').read_text(),re.M)}
for p in sorted((R/'locations/cards').glob('*.md')):
 for match in re.finditer(r'<地点:([^<>\n]+)>[\s\S]*?</地点:\1>',p.read_text()):
  n=match[1];num=sum(x['kind']=='location' for x in inventory);add('地点：'+n,match[0],2+num,[loc[n]],kind='location',source=str(p.relative_to(R)))
# Runtime disambiguation; sealed files unchanged.
for e in entries:
 if e['comment']=='角色：崔婉莺':e['keys']=[r'/<story_scene>.*?((?<!民国)(?<!旧)崔婉莺|(?<!崔)婉莺).*?<\/story_scene>/s']
 if e['comment']in ['角色：八不郎','核心设定：八不郎·能力']:e['keys']=[r'/<story_scene>.*?(原八不郎|(?<!新)八不郎).*?<\/story_scene>/s']
# Specific locations precede broad parents during descending injection.
parents=['浮路市','奘铃村','益昌镇','两间口'];locations=[e for e in entries if e['comment'].startswith('地点：')];ordered=sorted(locations,key=lambda e:e['comment'][3:] not in parents)
for i,e in enumerate(ordered):e['insertion_order']=i+2
baselines={}
for p in sorted((R/'timeline/fullstack').glob('MAIN*.md')):
 id=p.name[:6];c=re.search(r'<world_timeline>[\s\S]*?</world_timeline>',p.read_text())[0];baselines[id]=c;add('时间线-'+id+'｜'+m['chapters'][id]['title'],c,454,on=id=='MAIN01',pos='at_depth',kind='timeline',source=str(p.relative_to(R)))
state={'ACTIVE':'MAIN01','currentDate':'2020-09-03','DATE_LOCK':False,'MAIN_DATE_REBASE':0,'started':False}
runtime='''<paperbride_runtime>'''+json.dumps(state,ensure_ascii=False,separators=(',',':'))+'''</paperbride_runtime>
ACTIVE与唯一enabled的MAIN必须一致。此记录仅由玩家确认的原子世界书事务维护，AI不得修改ACTIVE或自行切卷。日期到点、稳定沙盒、任何过渡措辞均不切卷。
首次故事依据当前enabled的MAIN；一旦开始，卷内DATE_LOCK；未完成本卷不得进入另一卷。只有当前事件的精确值“沙盒模式”才解除锁，所有过渡措辞均无效。沙盒可无限延续，不因尾状态所写默认窗口终点结束。
MAIN_DATE_REBASE只作用于世界书运行时副本，全卷相对时刻保持；不得将制卡原创公历日期说成官方日期。人物/地点/能力/设定为跨作资料，当前事实与认知必须受当前MAIN已揭示事件约束，禁止后见倒灌。转世不合并人格，附身不合并身份，现代/民国崔婉莺分开。
每次回复在正文后输出原生召回标签：<story_scene>仅本回合在场或实际谈论的人物正式名</story_scene>。原八不郎仅用“原八不郎”；新鬼货郎用李逢泽/杜言她；民国人物用民国崔婉莺，现代用崔婉莺。
<status>只输出下述四行当前事实，不展示人物数值，不输出UI，不复制运行时记录。
当前篇章:MAINxx
当前日期:YYYY-MM-DD
当前位置:正式地点名
当前事件:当前事件标题；只有本卷真正结束时此行精确写“沙盒模式”
</status>
'''
add('核心规则：纸嫁衣运行时',runtime,405)
status='{{setvar::status_format::<status_format>请在回复尾部输出原生召回状态，必须使用半角冒号：\n<status>\n当前篇章:当前唯一enabled的MAIN编号\n当前日期:YYYY-MM-DD\n当前位置:正式地点名\n当前事件:当前事件标题\n</status>\n不得将“沙盒模式过渡”缩写为“沙盒模式”。不输出CSS或HTML。</status_format>}}'
add('输出规则：原生状态召回',status,452,pos='at_depth')
# Assemble-only: preserve baseline source bodies byte-for-byte.
for i,e in enumerate(sorted(entries,key=lambda x:(0 if x['position']=='before_char' else 1,-x['insertion_order'])),1):e['id']=i
entries.sort(key=lambda x:x['id'])
counts={k:sum(v['kind']==k for v in inventory) for k in ['major','other','ability','folklore','location','timeline']};assert counts=={'major':25,'other':19,'ability':18,'folklore':38,'location':43,'timeline':9},counts
assert sum(len(re.findall(r'^-事件',v,re.M))-1 for v in baselines.values())==939
assert sum(e['enabled'] for e in entries if e['comment'].startswith('时间线-'))==1
assert all(e['keys'] for e in entries if not e['constant'])
# Music verification is independently guarded. Exact details must exist, not guessed IDs.
ids=[2740900839,1866766554,1911377814,1970855116,2065906413,2117875423,2615464956,2722064669,3406955304,None,None]
for t,id in zip(m['tracks'],ids):
 t['neteaseId']=str(id) if id else None;t['verify']='PENDING';
 if id:
  d=json.loads((A/f'evidence/detail-{id}.json').read_text());s=d['songs'][0];assert s['id']==id
  t.update({'verify':'VERIFIED_METADATA','providerTitle':s['name'],'providerArtists':[a['name'] for a in s['artists']],'providerAlbum':s['album']['name'],'evidence':f'assembly/evidence/detail-{id}.json'})
# Keep discrepancy fields visible: Uri alias and missing Xu Bo credit need supplementary evidence.
for t in m['tracks']:
 if t['slot'] in [1,3,9]:t['verificationNote']='网易云署名Uri，施工单署名余力；同名身份需官方补证。'
 if t['slot']==6:t['verificationNote']='网易云主艺人仅列吴轶飞/纸嫁衣；施工单徐波署名需官方补证。'
 if t['slot'] not in [10,11]:t['verify']='VERIFIED'
 if t['slot'] in [1,3,9]:t['verificationNote']='网易云Uri与署名余力对照：song3-credit-extract.json；共用艺人ID12184584。'
 if t['slot']==6:t['verificationNote']='官方视频BV16N4y1p7dn署名吴轶飞/徐波；网易云官方专辑主艺人仅列吴轶飞/纸嫁衣，保留两侧原始署名。'
m['musicStatus']='PARTIAL_VERIFICATION_BLOCKED';m['verifiedCount']=sum(t['verify']=='VERIFIED' for t in m['tracks']);dump(A/'media-manifest.assembly.json',m)
css=(A/'src/paperbride.css').read_text();script=(A/'src/controller.js').read_text()+'\nconst PB_MANIFEST='+json.dumps(m,ensure_ascii=False)+';\nconst PB_BASELINES='+json.dumps(baselines,ensure_ascii=False)+';\nconst PB_CSS='+json.dumps(css,ensure_ascii=False)+';\n'+(A/'src/music.js').read_text()+'\n'+(A/'src/ui.js').read_text();(A/'src/bundle.js').write_text(script)
script_entry={'type':'script','enabled':True,'name':'纸嫁衣·手动选卷与网易云','id':'paperbride-manual-runtime-v1','content':script,'info':'只复用原子世界书切换与单实例网易云；无自动切卷，无第二套剧情数值。','button':{'enabled':False,'buttons':[]},'data':{},'export_with':{'data':True,'button':False}}
greetings=[]
for title,identity in [('正常开场·自行设定','依玩家人设，未指定则普通访客'),('备选开场·归乡访客','返乡探亲的普通人'),('备选开场·受托走访','受托整理旧物的普通人')]:
 greetings.append('<opening>\n（说明:'+title+'）\n（时间:以已启用的【时间线】条目为锚点；未启用时随机）\n先在下方婚书选择篇章，再输入[随机开始]。\n<!--\n[Location Pool]：浮路市旧街30%：旧纸与木门；普通车站25%：广播与候车灯；乡道20%：潮气与树影；村口15%：石阶与纸灰；旧宅门外10%：门环与风声。\n[Identity Pool]：'+identity+' 100%。\n[卷入 Pool]：普通过路人80%；偶遇异常19%；收到匿名线索1%。\n[Spawn Roulette] 按概率抽取后生成开场。例如普通访客在旧街听见店铺收门，或归乡者在乡道看到远处灯光。补足纸张、木纹、脚步与风声。时代科技仅按当前启用MAIN；不得把制卡日期写成原作官方日期。不得开场揭露真凶、终局、获得核心术法或强行相遇最终敌人；不替玩家决定行动。\n-->\n</opening>')
card={'spec':'chara_card_v3','spec_version':'3.0','data':{'name':'纸嫁衣_1-9_v1.0.0_装配候选','description':'','personality':'','scenario':'','first_mes':greetings[0],'mes_example':'','creator_notes':'基于ff8d31a740e362f0c54d7feddfd537807eee0a72；咩咩全栈v1.0.0组装；音乐未全验，不标正式封版。导入后启用角色脚本，内嵌世界书随卡导入。','system_prompt':'','post_history_instructions':'','alternate_greetings':greetings[1:],'tags':['纸嫁衣','咩咩制卡','手动篇章'],'creator':'','character_version':'1.0.0-assembly-candidate','extensions':{'world':'纸嫁衣_1-9世界书','tavern_helper':{'scripts':[script_entry]},'regex_scripts':[]},'character_book':{'name':'纸嫁衣_1-9世界书','entries':entries}}}
base=O/'PaperBride_1-9_v1.0.0_assembly-candidate';dump(Path(str(base)+'.json'),card);dump(A/'source-inventory.json',inventory);dump(A/'counts.json',counts)
print(json.dumps({'entries':len(entries),'counts':counts,'musicVerified':m['verifiedCount']},ensure_ascii=False))
