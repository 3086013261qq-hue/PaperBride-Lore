import urllib.request,urllib.parse,json,concurrent.futures,pathlib
out=pathlib.Path(__file__).parent/'evidence';m=json.loads((out.parent.parent/'mvu/media-manifest.v1.json').read_text())
def run(t):
 q=t['title'];req=urllib.request.Request('https://music.163.com/api/cloudsearch/pc',data=urllib.parse.urlencode({'s':q,'type':1,'limit':30}).encode(),headers={'User-Agent':'Mozilla/5.0','Referer':'https://music.163.com'})
 try:
  d=json.load(urllib.request.urlopen(req,timeout=25));(out/f'music-search-{t["slot"]:02}.json').write_text(json.dumps(d,ensure_ascii=False,indent=2));return q,[(s['id'],s['name'],' / '.join(a['name'] for a in s.get('ar',[])),s.get('al',{}).get('name')) for s in d.get('result',{}).get('songs',[])][:12]
 except Exception as e:return q,str(e)
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:
 for r in ex.map(run,m['tracks']):print(r)
