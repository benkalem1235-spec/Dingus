#!/usr/bin/env python3
"""Add installed stock CS maps and selected owned Half-Life arenas to the local build."""
from pathlib import Path
import argparse, hashlib, importlib.util, json, shutil, tempfile, zipfile
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('installation',type=Path,nargs='?');args=parser.parse_args()
source=(args.installation or Path(json.loads((ROOT/'data/source.json').read_text())['installation'])).resolve()
assert (source/'valve/maps/crossfire.bsp').is_file() and (source/'cstrike/maps/de_vertigo.bsp').is_file()
spec=importlib.util.spec_from_file_location('dingus_converter',ROOT/'scripts/convert-half-life.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
out=ROOT/'custom/cstrike/maps';out.mkdir(parents=True,exist_ok=True);report=[]
for map_id,details in mod.ARENAS.items():
 original=source/'valve/maps'/f"{details['source']}.bsp"
 assert original.is_file(),f'Missing owned Half-Life map: {original.name}'
 row=mod.run(original,out/f'{map_id}.bsp',details);report.append(row)
(out/'arenas.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
# The installed overview pictures make the new map cards recognizable.
for map_id,details in mod.ARENAS.items():
 picture=source/'valve/overviews'/f"{details['source']}.bmp"
 if picture.is_file():Image.open(picture).convert('RGB').save(ROOT/'web/public/maps'/f'{map_id}.png')
cs_maps=['de_dust','de_cbble','de_chateau','de_prodigy','de_piranesi','de_airstrip','de_storm','de_survivor','de_torn','de_vertigo','cs_747','cs_backalley','cs_estate','cs_havana','cs_militia','cs_siege']
for map_id in cs_maps:
 assert (source/'cstrike/maps'/f'{map_id}.bsp').is_file(),f'Missing owned Counter-Strike map {map_id}.bsp'
 picture=source/'cstrike/overviews'/f'{map_id}.bmp'
 assert picture.is_file(),f'Missing official map overview {map_id}.bmp'
 Image.open(picture).convert('RGB').save(ROOT/'web/public/maps'/f'{map_id}.png')
archive=ROOT/'data/valve.zip';replacement={f'cstrike/maps/{name}.bsp' for name in mod.ARENAS};replacement.update({'cstrike/maps/arenas.json'})
with tempfile.NamedTemporaryFile(dir=archive.parent,suffix='.zip',delete=False) as temp:temporary=Path(temp.name)
with zipfile.ZipFile(archive) as old,zipfile.ZipFile(temporary,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as new:
 for item in old.infolist():
  if item.filename not in replacement:new.writestr(item,old.read(item.filename))
 for map_id in mod.ARENAS:
  new.write(out/f'{map_id}.bsp',f'cstrike/maps/{map_id}.bsp')
 new.write(out/'arenas.json','cstrike/maps/arenas.json')
shutil.move(temporary,archive)
data=archive.read_bytes();(ROOT/'data/assets.json').write_text(json.dumps({'version':hashlib.sha256(data).hexdigest(),'size':len(data),'files':len(zipfile.ZipFile(archive).namelist())}))
print(f'Prepared {len(cs_maps)} additional CS maps and {len(report)} Half-Life arenas with previews.')
print('Only local owned assets were used; BSPs and image files remain out of GitHub.')
