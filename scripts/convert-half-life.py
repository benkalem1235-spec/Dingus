#!/usr/bin/env python3
"""Create CS team-elimination copies from owned Half-Life BSPs.
Original multiplayer geometry stays unmodified. The campaign sector alone gets
a closed collision volume so players cannot leave the chosen arena.
"""
import argparse,struct,re,json
from pathlib import Path
ARENAS={
 'arena_officecomplex':dict(source='c1a2',name='Office Complex Sector',mins=(1216,-1216,-608),maxs=(3136,-352,-400),campaign=True),
 'arena_crossfire':dict(source='crossfire',name='Crossfire',crop=False,mins=(-1100,-50,-1880),maxs=(1080,1740,-1260)),
 'arena_stalkyard':dict(source='stalkyard',name='Stalkyard',crop=False,mins=(-900,0,-48),maxs=(1080,1450,368)),
}
def entities(text):return [dict(re.findall(r'"([^"\n]+)"\s*"([^"\n]*)"',e)) for e in re.findall(r'\{([^}]+)\}',text)]
def campaign_spawns(lumps,spec):
 # Find standing positions with floor support, then retain one walk-connected sector.
 planes=list(struct.iter_unpack('<4fi',lumps[1]));clips=list(struct.iter_unpack('<ihh',lumps[9]));root=struct.unpack_from('<i',lumps[14],40)[0]
 def at_hull(pos,n):
  while n>=0:
   pi,a,b=clips[n];nx,ny,nz,d,_=planes[pi];n=a if nx*pos[0]+ny*pos[1]+nz*pos[2]>=d else b
  return n
 def contents(pos):return at_hull(pos,root)
 blockers=[]
 for e in entities(lumps[0].decode('latin1')):
  if e.get('classname') not in {'func_wall','func_door','func_door_rotating','func_breakable'} or not e.get('model','').startswith('*'):continue
  index=int(e['model'][1:]);head=struct.unpack_from('<i',lumps[14],index*64+40)[0];origin=tuple(map(float,e.get('origin','0 0 0').split()));blockers.append((head,origin))
 def unobstructed(p):return all(at_hull(tuple(p[i]-o[i] for i in range(3)),head)!=-2 for head,o in blockers)
 cells=set()
 for x in range((spec['mins'][0]//32+2)*32,spec['maxs'][0]-40,32):
  for y in range((spec['mins'][1]//32+2)*32,spec['maxs'][1]-40,32):
   for z in range(spec['mins'][2]+36,spec['maxs'][2]-36,4):
    if contents((x,y,z))==-1 and contents((x,y,z-4))==-2:cells.add((x,y,z+2))
 seen=set();groups=[]
 for start in sorted(cells):
  if start in seen:continue
  q=[start];seen.add(start);group=[]
  while q:
   a=q.pop();group.append(a)
   for dx,dy in [(32,0),(-32,0),(0,32),(0,-32)]:
    for dz in range(-32,33,4):
     b=(a[0]+dx,a[1]+dy,a[2]+dz)
     if b not in cells or b in seen:continue
     if any(contents(tuple(a[i]+(b[i]-a[i])*t/8 for i in range(3)))!=-1 for t in range(1,8)):continue
     seen.add(b);q.append(b)
  groups.append(group)
 group=max(groups,key=len);assert len(group)>40,'Campaign sector has too little connected walk space'
 middle=(min(p[0] for p in group)+max(p[0] for p in group))/2
 chosen=[]
 for team in [0,1]:
  points=sorted((p for p in group if (p[0]<middle)==(team==0) and unobstructed(p)),reverse=bool(team))
  picks=[]
  for p in points:
   if all(sum((p[i]-q[i])**2 for i in range(3))>=96**2 for q in chosen+picks):picks.append(p)
   if len(picks)==6:break
  assert len(picks)==6,'Not enough separated spawn points';chosen.extend(picks)
 return [dict(classname='info_player_start',origin=' '.join(map(str,p)),angle='0' if i<6 else '180') for i,p in enumerate(chosen)]
def run(src,out,spec):
 raw=src.read_bytes();assert struct.unpack_from('<i',raw)[0]==30,'Expected a GoldSrc BSP v30'
 lumps=[]
 for i in range(15):o,n=struct.unpack_from('<ii',raw,4+i*8);lumps.append(bytearray(raw[o:o+n]))
 es=entities(lumps[0].decode('latin1'));sp=[];kept=[];pickups=0
 for e in es:
  cls=e.get('classname','')
  if cls.startswith('info_player'):
   p=tuple(float(v) for v in e['origin'].split());
   if not spec.get('crop',True) or all(spec['mins'][i]+36<p[i]<spec['maxs'][i]-36 for i in range(3)):sp.append(e)
   continue
  if cls in {'weapon_shotgun','weapon_9mmAR'}:
   pos=tuple(float(v) for v in e['origin'].split())
   if not spec.get('crop',True) or all(spec['mins'][i]+24<pos[i]<spec['maxs'][i]-24 for i in range(3)):
    kept.append(dict(classname='armoury_entity',origin=e['origin'],angles='0 '+e.get('angle','0')+' 0',item='11' if cls=='weapon_shotgun' else '0',count='2',targetname='dingus_hl_shotgun' if cls=='weapon_shotgun' else 'dingus_hl_smg'));pickups+=1
   continue
  if cls=='worldspawn':e['message']=spec['name'];kept.append(e)
  elif cls in {'func_wall','func_illusionary','func_water','func_ladder','func_door','func_door_rotating','func_breakable','func_train','path_corner','light','light_spot','light_environment','ambient_generic','env_sprite','env_glow','info_target'}:kept.append(e)
 if spec.get('campaign'):
  sp=campaign_spawns(lumps,spec)
  # One free shotgun and SMG on each side; each armoury pile supplies two players.
  for n,spot in enumerate([sp[1],sp[3],sp[7],sp[9]]):
   shotgun=n%2==0
   kept.append(dict(classname='armoury_entity',origin=spot['origin'],item='11' if shotgun else '0',count='2',targetname='dingus_hl_shotgun' if shotgun else 'dingus_hl_smg'));pickups+=1
  # Campaign doors should open on touch without removed script buttons.
  for e in kept:
   if e.get('classname') in {'func_door','func_door_rotating'}:
    e.pop('master',None);e.pop('targetname',None);e['spawnflags']='0'
 # Use verified original or collision-tested campaign positions.

 sp.sort(key=lambda e:float(e['origin'].split()[0]));assert len(sp)>=8,'Not enough original spawn points inside bounds'
 mid=len(sp)//2
 for n,e in enumerate(sp):
  p=e.copy();p['classname']='info_player_start' if n<mid else 'info_player_deathmatch';p.pop('spawnflags',None);kept.append(p)
 lumps[0]=bytearray(('\n'.join('{\n'+'\n'.join('"'+k+'" "'+v+'"' for k,v in e.items())+'\n}' for e in kept)+'\n\0').encode('latin1'))
 if spec.get('crop',True):
  # Put crop nodes BEFORE the original trees. GoldSrc checks that traversed
  # indices are >= headnode, so an appended root cannot point back into old nodes.
  model=bytearray(lumps[14]);roots=list(struct.unpack_from('<4i',model,36));planes=lumps[1]
  oldnodes=lumps[5];oldclips=lumps[9];nodes=bytearray();clips=bytearray()
  for offset in range(0,len(oldnodes),24):
   row=list(struct.unpack_from('<ihh6hHH',oldnodes,offset))
   row[1:3]=[n+6 if n>=0 else n for n in row[1:3]];nodes.extend(struct.pack('<ihh6hHH',*row))
  for offset in range(0,len(oldclips),8):
   plane,c0,c1=struct.unpack_from('<ihh',oldclips,offset)
   clips.extend(struct.pack('<ihh',plane,c0+18 if c0>=0 else c0,c1+18 if c1>=0 else c1))
  wrappers=[]
  for hull in range(4):
   sequence=[]
   extent=(0,0,0) if hull==0 else (16,16,36) if hull==1 else (32,32,32) if hull==2 else (16,16,18)
   for axis in range(3):
    for lower in [False,True]:
     normal=[0.,0.,0.];normal[axis]=-1. if lower else 1.
     dist=-(spec['mins'][axis]+extent[axis]) if lower else spec['maxs'][axis]-extent[axis]
     pi=len(planes)//20;planes.extend(struct.pack('<4fi',*normal,dist,axis+3 if lower else axis));sequence.append(pi)
   root=0 if hull==0 else (hull-1)*6;wrapper=bytearray()
   for j,pi in enumerate(sequence):
    onward=root+j+1 if j<5 else roots[hull]+(6 if hull==0 else 18)
    if hull==0:wrapper.extend(struct.pack('<ihh6hHH',pi,-1,onward,*spec['mins'],*spec['maxs'],0,0))
    else:wrapper.extend(struct.pack('<ihh',pi,-2,onward))
   wrappers.append(wrapper)
  # Shift submodel heads too, while world heads enter the new crop wrappers.
  for off in range(0,len(model),64):
   original=struct.unpack_from('<4i',model,off+36)
   shifted=[v+(6 if h==0 else 18) if v>=0 else v for h,v in enumerate(original)]
   struct.pack_into('<4i',model,off+36,*([0,0,6,12] if off==0 else shifted))
  lumps[5]=wrappers[0]+nodes;lumps[9]=b''.join(wrappers[1:])+clips;lumps[14]=model
 result=bytearray(124);struct.pack_into('<i',result,0,30)
 for i,lump in enumerate(lumps):
  while len(result)%4:result.append(0)
  struct.pack_into('<ii',result,4+i*8,len(result),len(lump));result.extend(lump)
 out.write_bytes(result);return {'map':out.stem,'source':src.name,'name':spec['name'],'bounds':[spec['mins'],spec['maxs']] if spec.get('crop',True) else None,'bordered':spec.get('crop',True),'ct_spawns':mid,'t_spawns':len(sp)-mid,'mode':'team_elimination','pickups':pickups}
if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('half_life');ap.add_argument('--output',default='custom/cstrike/maps');args=ap.parse_args();out=Path(args.output);out.mkdir(parents=True,exist_ok=True)
 report=[run(Path(args.half_life)/'valve/maps'/f"{s['source']}.bsp",out/(name+'.bsp'),s) for name,s in ARENAS.items()];(out/'arenas.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
