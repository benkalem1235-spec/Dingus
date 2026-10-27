#!/usr/bin/env python3
"""Build local GoldSrc palette variants from the owner's models, preserving model geometry/animations."""
import argparse,struct,json,zipfile,hashlib
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('installation');p.add_argument('--root',default=str(Path(__file__).resolve().parents[1]));a=p.parse_args();root=Path(a.root);src=Path(a.installation)/'cstrike/models';dest=root/'custom/cstrike/models/dingus';dest.mkdir(parents=True,exist_ok=True)
finishes=[('copper',(210,108,62)),('tidal',(37,184,173)),('violet',(164,80,219)),('aurum',(235,183,54))]
files=[]
for weapon in ['ak47','m4a1','deagle','knife']:
 for variant,(name,color) in enumerate(finishes,1):
  for prefix in ['v','p','w']:
   source=src/f'{prefix}_{weapon}.mdl'
   if not source.exists():continue
   data=bytearray(source.read_bytes());assert data[:4]==b'IDST' and struct.unpack_from('<i',data,4)[0]==10
   n,table=struct.unpack_from('<ii',data,180)
   for i in range(n):
    raw,flags,width,height,offset=struct.unpack_from('<64s4i',data,table+i*80);texture=raw.split(b'\0')[0].decode().lower()
    if any(word in texture for word in ['glove','finger','view_skin','hand','arm']):continue
    palette=offset+width*height
    assert 0<=palette and palette+768<=len(data)
    for k in range(256):
     if k==255 and flags&64:continue
     r,g,b=data[palette+k*3:palette+k*3+3];lum=(r*.2126+g*.7152+b*.0722)/255
     # Preserve shading and texture detail; tint only the weapon's existing palette.
     for channel,c in enumerate(color):data[palette+k*3+channel]=max(0,min(255,round(lum*c*1.25)))
   target=dest/f'{prefix}_{weapon}_{variant}.mdl';target.write_bytes(data);files.append(target)
archive=root/'data/skins.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for f in files:z.write(f,'cstrike/models/dingus/'+f.name)
b=archive.read_bytes();(root/'data/skins.json').write_text(json.dumps({'version':hashlib.sha256(b).hexdigest()[:16],'size':len(b),'files':len(files)}))
print(f'Built {len(files)} local model files; browser pack {len(b):,} bytes')
