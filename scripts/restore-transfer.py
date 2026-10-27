#!/usr/bin/env python3
"""Restore an owner-supplied private transfer archive into a fresh game checkout."""
import argparse,tarfile,zipfile,json
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('archive',type=Path);p.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[1]);a=p.parse_args();root=a.root.resolve()
allowed={'accounts','config','data','custom','runtime','web'}
with tarfile.open(a.archive,'r:gz') as t:
 for m in t.getmembers():
  parts=Path(m.name).parts
  if not parts or parts[0] not in allowed or '..' in parts or Path(m.name).is_absolute() or m.issym() or m.islnk():raise SystemExit('Unsafe transfer member')
 t.extractall(root,filter='data')
assets=root/'game-files';assets.mkdir(exist_ok=True)
with zipfile.ZipFile(root/'data/valve.zip') as z:
 for member in z.infolist():
  parts=Path(member.filename).parts
  if not parts or parts[0] not in {'valve','cstrike'} or '..' in parts or Path(member.filename).is_absolute():raise SystemExit('Unsafe game asset member')
 z.extractall(assets)
assert (assets/'valve/delta.lst').is_file() and (assets/'cstrike/maps/de_dust2.bsp').is_file()
(root/'data/source.json').write_text(json.dumps({'installation':str(assets),'source':'Private transfer of owned game assets'}))
for f in (root/'accounts').glob('*.json'):f.chmod(0o600)
(root/'accounts').chmod(0o700)
for directory in ['runtime/events','runtime/bots']:
 d=root/directory;d.mkdir(parents=True,exist_ok=True);d.chmod(0o777)
 for f in d.rglob('*'):f.chmod(0o777 if f.is_dir() else 0o666)
print('Private transfer restored. Game data, accounts and inventories stay outside Git.')
