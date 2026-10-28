#!/usr/bin/env python3
"""Fetch the pinned open-source browser runtime, without owned game data."""
from pathlib import Path
import shutil, subprocess, tempfile
root=Path(__file__).resolve().parents[1]
revision='154b676e5c0bb8d13639b8c2e31923d7df22a1fe'
with tempfile.TemporaryDirectory() as temp:
    checkout=Path(temp)/'engine'
    subprocess.run(['git','init','-q',str(checkout)],check=True)
    subprocess.run(['git','-C',str(checkout),'fetch','--depth','1','https://github.com/shugavibes/sla-cs16-web.git',revision],check=True)
    subprocess.run(['git','-C',str(checkout),'checkout','-q','FETCH_HEAD'],check=True)
    shutil.copytree(checkout/'web/public/assets',root/'web/public/assets',dirs_exist_ok=True)
