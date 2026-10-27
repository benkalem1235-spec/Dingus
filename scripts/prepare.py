#!/usr/bin/env python3
"""Prepare locally owned game data. Never commits or uploads game assets."""
import argparse,hashlib,json,secrets,shutil,subprocess,tempfile,zipfile
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('installation',type=Path,help='Half-Life directory containing valve/ and cstrike/');a=p.parse_args();source=a.installation.resolve()
assert (source/'valve/delta.lst').is_file() and (source/'cstrike/maps/de_dust2.bsp').is_file(),'Expected an owned Half-Life + CS 1.6 installation'
for name in ['data','runtime','custom/cstrike/maps','web/public/assets','web/public/maps','web/public/weapons']:(ROOT/name).mkdir(parents=True,exist_ok=True)
revision='154b676e5c0bb8d13639b8c2e31923d7df22a1fe'
with tempfile.TemporaryDirectory() as temp:
 checkout=Path(temp)/'engine';subprocess.run(['git','init','-q',str(checkout)],check=True)
 subprocess.run(['git','-C',str(checkout),'fetch','--depth','1','https://github.com/shugavibes/sla-cs16-web.git',revision],check=True)
 subprocess.run(['git','-C',str(checkout),'checkout','-q','FETCH_HEAD'],check=True)
 shutil.copytree(checkout/'web/public/assets',ROOT/'web/public/assets',dirs_exist_ok=True)
# Include only game resources, never personal configs, saves, executables or libraries.
allowed={'.wad','.pak','.bsp','.res','.txt','.lst','.spr','.mdl','.wav','.mp3','.tga','.bmp','.pcx','.png','.jpg','.dem','.rc','.gam'}
archive=ROOT/'data/valve.zip';count=0
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for game in ['valve','cstrike']:
  for f in sorted((source/game).rglob('*')):
   rel=f.relative_to(source)
   if not f.is_file() or f.suffix.lower() not in allowed:continue
   if any(s.lower() in {'save','download','downloads','demos','addons','logs','screenshots'} for s in rel.parts):continue
   if game=='valve' and 'maps' in rel.parts:continue
   if f.name.lower() in {'banned.cfg','listip.cfg'}:continue
   z.write(f,rel.as_posix());count+=1
 for f in (ROOT/'custom/cstrike').rglob('*'):
  if f.is_file() and f.suffix in allowed:z.write(f,'cstrike/'+f.relative_to(ROOT/'custom/cstrike').as_posix());count+=1
(ROOT/'data/assets.json').write_text(json.dumps({'version':hashlib.file_digest(archive.open('rb'),'sha256').hexdigest(),'size':archive.stat().st_size,'files':count}))
(ROOT/'data/source.json').write_text(json.dumps({'installation':str(source)}))
cfg=ROOT/'config/server.cfg'
if not cfg.exists():cfg.write_text((ROOT/'config/server.cfg.example').read_text().replace('GENERATE_ON_SETUP',secrets.token_hex(24)))
rooms=ROOT/'config/rooms.json';r=json.loads(rooms.read_text())
for room in r:
 if room.get('private'):room['token']=secrets.token_urlsafe(18)
rooms.write_text(json.dumps(r,indent=2)+'\n')
for f in (source/'cstrike/gfx/vgui').glob('*.tga'):
 Image.open(f).convert('RGBA').save(ROOT/'web/public/weapons'/(f.stem+'.png'))
for f in (source/'cstrike/overviews').glob('*.bmp'):
 Image.open(f).convert('RGB').save(ROOT/'web/public/maps'/(f.stem+'.png'))
print('Prepared private game data. Run ./start.sh (Podman) or see deployment/README.md (Docker).')
