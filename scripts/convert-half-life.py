#!/usr/bin/env python3
"""Create reversible CS team-elimination arena copies from owned Half-Life BSPs.
The original rendering tree is retained. Player/point collision hulls get a closed
bounding volume so campaign/DM exits cannot lead outside the chosen arena.
"""
import argparse,struct,re,json
from pathlib import Path
ARENAS={
 'arena_crossfire':dict(source='crossfire',name='Crossfire Courtyard',mins=(-1100,-50,-1880),maxs=(1080,1740,-1260)),
 'arena_stalkyard':dict(source='stalkyard',name='Stalkyard Elimination',mins=(-900,0,-48),maxs=(1080,1450,368)),
}
def entities(text):return [dict(re.findall(r'"([^"\n]+)"\s*"([^"\n]*)"',e)) for e in re.findall(r'\{([^}]+)\}',text)]
def run(src,out,spec):
 raw=src.read_bytes();assert struct.unpack_from('<i',raw)[0]==30,'Expected a GoldSrc BSP v30'
 lumps=[]
 for i in range(15):o,n=struct.unpack_from('<ii',raw,4+i*8);lumps.append(bytearray(raw[o:o+n]))
 es=entities(lumps[0].decode('latin1'));sp=[];kept=[]
 for e in es:
  cls=e.get('classname','')
  if cls.startswith('info_player'):
   p=tuple(float(v) for v in e['origin'].split());
   if all(spec['mins'][i]+36<p[i]<spec['maxs'][i]-36 for i in range(3)):sp.append(e)
   continue
  if cls=='worldspawn':e['message']=spec['name'];kept.append(e)
  elif cls in {'func_wall','func_illusionary','func_water','func_ladder','func_door','func_door_rotating','func_breakable','func_train','path_corner','light','light_spot','light_environment','ambient_generic','env_sprite','env_glow','info_target'}:kept.append(e)
 # Use verified original spawn positions, separated across the arena.
 sp.sort(key=lambda e:float(e['origin'].split()[0]));assert len(sp)>=8,'Not enough original spawn points inside bounds'
 mid=len(sp)//2
 for n,e in enumerate(sp):
  p=e.copy();p['classname']='info_player_start' if n<mid else 'info_player_deathmatch';p.pop('spawnflags',None);kept.append(p)
 lumps[0]=bytearray(('\n'.join('{\n'+'\n'.join('"'+k+'" "'+v+'"' for k,v in e.items())+'\n}' for e in kept)+'\n\0').encode('latin1'))
 # Root of each hull is a six-plane intersection. Outside is solid (-2).
 model=bytearray(lumps[14]);roots=list(struct.unpack_from('<4i',model,36));planes=lumps[1];nodes=lumps[5];clips=lumps[9]
 for hull in range(4):
  sequence=[]
  extent=(0,0,0) if hull==0 else (16,16,36 if hull==1 else 18 if hull==3 else 32)
  for axis in range(3):
   for lower in [False,True]:
    normal=[0.,0.,0.];normal[axis]=-1. if lower else 1.
    dist=-(spec['mins'][axis]+extent[axis]) if lower else spec['maxs'][axis]-extent[axis]
    pi=len(planes)//20;planes.extend(struct.pack('<4fi',*normal,dist,axis+3 if lower else axis));sequence.append(pi)
  root=len(nodes)//24 if hull==0 else len(clips)//8
  for j,pi in enumerate(sequence):
   onward=root+j+1 if j<5 else roots[hull]
   if hull==0:
    nodes.extend(struct.pack('<ihh6hHH',pi,-1,onward,*spec['mins'],*spec['maxs'],0,0))
   else:clips.extend(struct.pack('<ihh',pi,-2,onward))
  roots[hull]=root
 struct.pack_into('<4i',model,36,*roots);lumps[14]=model
 result=bytearray(124);struct.pack_into('<i',result,0,30)
 for i,lump in enumerate(lumps):
  while len(result)%4:result.append(0)
  struct.pack_into('<ii',result,4+i*8,len(result),len(lump));result.extend(lump)
 out.write_bytes(result);return {'map':out.stem,'source':src.name,'name':spec['name'],'bounds':[spec['mins'],spec['maxs']],'ct_spawns':mid,'t_spawns':len(sp)-mid,'mode':'team_elimination'}
if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('half_life');ap.add_argument('--output',default='custom/cstrike/maps');args=ap.parse_args();out=Path(args.output);out.mkdir(parents=True,exist_ok=True)
 report=[run(Path(args.half_life)/'valve/maps'/f"{s['source']}.bsp",out/(name+'.bsp'),s) for name,s in ARENAS.items()];(out/'arenas.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
