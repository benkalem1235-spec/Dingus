#!/usr/bin/env python3
"""Generate map previews from locally owned Half-Life assets."""
from pathlib import Path
from PIL import Image,ImageDraw
import struct,json,sys
root=Path(__file__).resolve().parents[1];source=Path(sys.argv[1]);out=root/'web/public/maps';out.mkdir(parents=True,exist_ok=True)
for arena in json.loads((root/'custom/cstrike/maps/arenas.json').read_text()):
 name=arena['map'];original=source/'valve/overviews'/(Path(arena['source']).stem+'.bmp')
 if original.exists():
  im=Image.open(original).convert('RGB');im.thumbnail((1000,750));im.save(out/(name+'.png'));continue
 b=(root/'custom/cstrike/maps'/(name+'.bsp')).read_bytes();l=[]
 for i in range(15):o,n=struct.unpack_from('<ii',b,4+i*8);l.append(b[o:o+n])
 planes=list(struct.iter_unpack('<4fi',l[1]));verts=list(struct.iter_unpack('<3f',l[3]));edges=list(struct.iter_unpack('<HH',l[12]));surfedges=[v[0] for v in struct.iter_unpack('<i',l[13])]
 lo,hi=arena['bounds'];im=Image.new('RGB',(1000,600),(22,28,19));d=ImageDraw.Draw(im)
 def xy(v):return (int((v[0]-lo[0])/(hi[0]-lo[0])*960+20),int((hi[1]-v[1])/(hi[1]-lo[1])*520+40))
 for off in range(0,len(l[7]),20):
  pi,side,first,count,tex,*_=struct.unpack_from('<Hhihh4Bi',l[7],off)
  if abs(planes[pi][2])<.99:continue
  polygon=[verts[edges[abs(n)][0 if n>=0 else 1]] for n in surfedges[first:first+count]]
  if not polygon or not lo[2]<=polygon[0][2]<=hi[2]:continue
  if all(v[0]<lo[0] or v[0]>hi[0] or v[1]<lo[1] or v[1]>hi[1] for v in polygon):continue
  d.polygon([xy(v) for v in polygon],fill=(80,95,65),outline=(156,168,124))
 d.rectangle((20,40,980,560),outline=(233,166,74),width=3);d.text((25,16),arena['name'].upper()+' / BOUNDED ELIMINATION SECTOR',fill=(233,166,74));im.save(out/(name+'.png'))
