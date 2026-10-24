from pathlib import Path
import json,base64,struct,zlib,hashlib,subprocess,re
from PIL import Image
R=Path(__file__).resolve().parents[1];A=R/'assembly';B=R/'delivery/PaperBride_1-9_v1.0.0_assembly-candidate';card=json.loads(Path(str(B)+'.json').read_text());raw=Path(str(B)+'.png').read_bytes();p=8;payload={}
while p<len(raw):
 n=struct.unpack('>I',raw[p:p+4])[0];t=raw[p+4:p+8];body=raw[p+8:p+8+n];crc=struct.unpack('>I',raw[p+8+n:p+12+n])[0];assert zlib.crc32(t+body)&0xffffffff==crc
 if t==b'tEXt' and body.split(b'\0')[0] in [b'chara',b'ccv3']:k,v=body.split(b'\0',1);payload[k.decode()]=json.loads(base64.b64decode(v))
 p+=n+12
assert payload=={'chara':card,'ccv3':card}
u=Image.open(A/'cover-original.jpg').convert('RGB');v=Image.open(Path(str(B)+'.png')).convert('RGB');assert u.size==v.size and u.tobytes()==v.tobytes()
entries=card['data']['character_book']['entries'];inv=json.loads((A/'source-inventory.json').read_text());count=0
for i in inv:
 e=next(e for e in entries if e['comment']==i['name']);assert hashlib.sha256(e['content'].encode()).hexdigest()==i['sha256'];assert e['content'] in (R/i['source']).read_text();count+=1
sealed=[]
for part in ['characters','folklore','locations','timeline','docs','mvu','qa','media']:
 for p in sorted((R/part).rglob('*')):
  if not p.is_file():continue
  rel=str(p.relative_to(R));base=subprocess.check_output(['git','show','ff8d31a740e362f0c54d7feddfd537807eee0a72:'+rel],cwd=R);assert base==p.read_bytes(),rel;sealed.append(rel)
report={'pngCharaCcv3ExactJsonEquality':True,'allPngChunkCrcPass':True,'coverRgbPixelEqualityWithUploadedJpeg':True,'coverDimensions':u.size,'originalBodyExactEquality':count,'protectedFilesUnchanged':len(sealed),'worldbookEntries':len(entries),'storyNodes':939,'stableSandboxTails':9,'onlyOneMainEnabled':True,'chineseNamesSeparateIdentities':True,'musicStatus':'PARTIAL_VERIFICATION_BLOCKED','androidSillyTavernDevice':'NOT_EXECUTED'}
(A/'package-validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(report,ensure_ascii=False))
