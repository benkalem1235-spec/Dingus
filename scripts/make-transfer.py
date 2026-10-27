#!/usr/bin/env python3
"""Create a private migration pack. Never uploads anything."""
import argparse,tarfile,tempfile,shutil,subprocess
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('destination',type=Path);a=p.parse_args();root=Path(__file__).resolve().parents[1];a.destination.parent.mkdir(parents=True,exist_ok=True)
with tempfile.TemporaryDirectory() as d:
 snapshot=Path(d)
 # Freeze only long enough to snapshot the two private record files consistently.
 running=subprocess.run(['podman','inspect','codex-cs16-web','--format','{{.State.Running}}'],capture_output=True,text=True).stdout.strip()=='true'
 if running:subprocess.run(['podman','pause','codex-cs16-web'],check=True,stdout=subprocess.DEVNULL)
 try:
  for part in ['accounts','config']:shutil.copytree(root/part,snapshot/part)
 finally:
  if running:subprocess.run(['podman','unpause','codex-cs16-web'],check=True,stdout=subprocess.DEVNULL)
 with tarfile.open(a.destination,'w:gz',compresslevel=1) as t:
  for part in ['accounts','config']:t.add(snapshot/part,arcname=part)
  for part in ['data','custom','runtime/bots','web/public/assets','web/public/maps','web/public/weapons']:
   source=root/part
   if source.exists():t.add(source,arcname=part)
 a.destination.chmod(0o600)
print('Private transfer created:',a.destination)
print('Contains player records and host secrets. Transfer directly over SSH; do not publish it on GitHub.')
