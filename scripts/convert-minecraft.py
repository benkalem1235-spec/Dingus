#!/usr/bin/env python3
"""Adapt a Source 2 Viewer glTF export of a block-built Workshop map to GoldSrc.
Axis-aligned faces are reconstructed on a 16-unit grid and merged into brushes.
This is a geometry adaptation, not a binary format rename. Original game logic,
Source 2 lighting and tiny decorative models are intentionally not transferred.
"""
import argparse,json,struct,math,re,collections
from pathlib import Path
from PIL import Image
CELL=16
SCALE=.0254

def rectangle_brush(lo,hi,texture):
 x,y,z=lo;X,Y,Z=hi
 # Outward planes, wound to the GoldSrc .map convention.
 faces=[((x,y,z),(x,Y,z),(x,Y,Z)),((X,Y,z),(X,y,z),(X,y,Z)),((X,y,z),(x,y,z),(x,y,Z)),((x,Y,z),(X,Y,z),(X,Y,Z)),((x,y,z),(X,y,z),(X,Y,z)),((x,Y,Z),(X,Y,Z),(X,y,Z))]
 return '{\n'+'\n'.join(' '.join('( %g %g %g )'%p for p in ps)+' '+texture+' 0 0 0 4 4' for ps in faces)+'\n}'

def convert(gltf,ents,out):
 doc=json.loads(gltf.read_text());buffers=[(gltf.parent/b['uri']).read_bytes() for b in doc['buffers']];cache={}
 def accessor(i):
  if i in cache:return cache[i]
  a=doc['accessors'][i];v=doc['bufferViews'][a['bufferView']];n={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']];fmt='<'+{5126:'f',5123:'H',5125:'I'}[a['componentType']]*n;size=struct.calcsize(fmt);stride=v.get('byteStride',size);base=v.get('byteOffset',0)+a.get('byteOffset',0);b=buffers[v.get('buffer',0)];res=[struct.unpack_from(fmt,b,base+j*stride) for j in range(a['count'])];cache[i]=res;return res
 materials=doc['materials'];groups=collections.defaultdict(set);skipped=0;worldbounds=[[1e9]*3,[-1e9]*3]
 for node in doc['nodes']:
  if 'mesh' not in node:continue
  mesh=doc['meshes'][node['mesh']]
  if mesh['name'].startswith('torch'):continue
  m=node.get('matrix',[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1])
  for primitive in mesh['primitives']:
   mat=primitive.get('material',0);name=materials[mat]['name']
   if name in {'toolsblocklight','reklam_selimyasar_overlay','moondome_skybox_cube_cs2','torch'}:continue
   vv=[]
   for v in accessor(primitive['attributes']['POSITION']):
    q=[sum(m[c*4+r]*v[c] for c in range(3))+m[12+r] for r in range(3)];vv.append((q[2]/SCALE,q[0]/SCALE,q[1]/SCALE))
   indices=[v[0] for v in accessor(primitive['indices'])]
   for i in range(0,len(indices),3):
    tri=[vv[k] for k in indices[i:i+3]];low=[min(p[j] for p in tri) for j in range(3)];high=[max(p[j] for p in tri) for j in range(3)];axes=[j for j in range(3) if high[j]-low[j]<.1]
    if not axes:skipped+=1;continue
    axis=axes[0];u,v=[j for j in range(3) if j!=axis];plane=round((low[axis]+high[axis])/2/CELL)*CELL
    a=[tri[1][j]-tri[0][j] for j in range(3)];b=[tri[2][j]-tri[0][j] for j in range(3)];normal=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];sign=1 if normal[axis]>0 else -1
    u0,u1=round(low[u]/CELL),round(high[u]/CELL);v0,v1=round(low[v]/CELL),round(high[v]/CELL)
    if u1-u0>600 or v1-v0>600:continue
    cells=groups[(axis,plane,sign,mat)]
    for j in range(u0,u1):
     for k in range(v0,v1):cells.add((j,k))
 textures={};wad=[]
 for mat in sorted({g[3] for g in groups}):
  material=materials[mat];texname=('mc_'+material['name'])[:15];textures[mat]=texname
  ti=material['pbrMetallicRoughness']['baseColorTexture']['index'];image=doc['images'][doc['textures'][ti]['source']]['uri'];im=Image.open(gltf.parent/image).convert('RGB');im=im.resize((16,16),Image.Resampling.NEAREST).quantize(colors=256)
  palette=bytes((im.getpalette() or [])[:768]).ljust(768,b'\0');width=height=16;levels=[im.resize((width>>i,height>>i),Image.Resampling.NEAREST).tobytes() for i in range(4)];offsets=[];offset=40
  for level in levels:offsets.append(offset);offset+=len(level)
  payload=struct.pack('<16s6I',texname.encode(),width,height,*offsets)+b''.join(levels)+struct.pack('<H',256)+palette;wad.append((texname,payload))
 w=bytearray(12);directory=[]
 for name,data in wad:directory.append((len(w),len(data),len(data),0x43,0,0,name.encode()));w.extend(data)
 diroff=len(w)
 for entry in directory:w.extend(struct.pack('<iiiBBH16s',*entry))
 struct.pack_into('<4sii',w,0,b'WAD3',len(wad),diroff);out.with_suffix('.wad').write_bytes(w)
 brushes=[]
 for (axis,plane,sign,mat),cells in groups.items():
  u,v=[j for j in range(3) if j!=axis]
  while cells:
   x,y=min(cells);width=1
   while (x+width,y) in cells:width+=1
   height=1
   while all((j,y+height) in cells for j in range(x,x+width)):height+=1
   for j in range(x,x+width):
    for k in range(y,y+height):cells.remove((j,k))
   lo=[0,0,0];hi=[0,0,0];lo[u]=x*CELL;hi[u]=(x+width)*CELL;lo[v]=y*CELL;hi[v]=(y+height)*CELL
   # glTF normals face empty space; the brush occupies the back side.
   lo[axis]=plane-8 if sign>0 else plane;hi[axis]=plane if sign>0 else plane+8
   for j in range(3):worldbounds[0][j]=min(worldbounds[0][j],lo[j]);worldbounds[1][j]=max(worldbounds[1][j],hi[j])
   brushes.append(rectangle_brush(lo,hi,textures[mat]))
 # An outer sky shell seals the adaptation for BSP/VIS compilation.
 low=[math.floor(v/64)*64-64 for v in worldbounds[0]];high=[math.ceil(v/64)*64+128 for v in worldbounds[1]]
 for axis in range(3):
  for upper in [False,True]:
   lo=low.copy();hi=high.copy()
   if upper:lo[axis]=high[axis]-16
   else:hi[axis]=low[axis]+16
   brushes.append(rectangle_brush(lo,hi,'sky'))
 world='{\n"classname" "worldspawn"\n"message" "Minecraft AWP Arena — Workshop adaptation"\n"wad" "'+str(out.with_suffix('.wad').resolve())+'"\n"skyname" "desert"\n"MaxRange" "8192"\n'+'\n'.join(brushes)+'\n}\n'
 spawns=[]
 for block in ents.read_text().split('===='):
  if not re.search(r'classname\s+"info_player_(terrorist|counterterrorist)"',block):continue
  origin=re.search(r'origin\s+"([^"]+)"',block);cls='info_player_start' if 'info_player_counterterrorist' in block else 'info_player_deathmatch'
  if origin:
   pos=[float(v) for v in origin[1].split()];pos[2]+=36 # Source 2 feet origin -> GoldSrc standing-player center.
   spawns.append('{\n"classname" "'+cls+'"\n"origin" "'+' '.join(str(v) for v in pos)+'"\n"angle" "90"\n}')
 world+='\n'.join(spawns)+'\n{\n"classname" "light_environment"\n"_light" "255 238 205 180"\n"pitch" "-60"\n"angle" "90"\n}\n'
 out.write_text(world);report={'source':gltf.name,'brushes':len(brushes),'spawns':len(spawns),'bounds':worldbounds,'skipped_non_axis_triangles':skipped,'cell_size':CELL};out.with_suffix('.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('gltf',type=Path);ap.add_argument('entities',type=Path);ap.add_argument('output',type=Path);args=ap.parse_args();convert(args.gltf,args.entities,args.output)
