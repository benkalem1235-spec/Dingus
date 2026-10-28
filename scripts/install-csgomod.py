#!/usr/bin/env python3
"""Install a pinned, private CSGOMod cosmetic pack for the existing browser/native game.
No AMXX binaries are installed. Downloaded game models stay out of public Git.
"""
import argparse,hashlib,json,shutil,struct,subprocess,tempfile,zipfile
from pathlib import Path
from goldsrc_models import flatten
ROOT=Path(__file__).resolve().parents[1]
FINISHES=[(210,108,62),(37,184,173),(164,80,219),(235,183,54)]
WEAPONS=['ak47','m4a1','deagle','knife']
def tint(raw,color):
    data=bytearray(raw);n,table=struct.unpack_from('<ii',data,180)
    for i in range(n):
        name,flags,width,height,offset=struct.unpack_from('<64s4i',data,table+i*80)
        name=name.split(b'\0')[0].decode('latin1').lower()
        if any(part in name for part in ['glove','finger','hand','arm','leet']):continue
        palette=offset+width*height
        for k in range(256):
            if k==255 and flags&64:continue
            r,g,b=data[palette+k*3:palette+k*3+3];lum=(r*.2126+g*.7152+b*.0722)/255
            for channel,value in enumerate(color):data[palette+k*3+channel]=min(255,round(lum*value*1.25))
    return bytes(data)
def fetch(source,lock):
    if not (source/'.git').exists():
        source.parent.mkdir(parents=True,exist_ok=True)
        subprocess.run(['git','clone','--depth','1','--filter=blob:none','--no-checkout',lock['repository'],str(source)],check=True)
    subprocess.run(['git','-C',str(source),'fetch','--depth','1','origin',lock['revision']],check=True)
    subprocess.run(['git','-C',str(source),'sparse-checkout','init','--no-cone'],check=True)
    subprocess.run(['git','-C',str(source),'sparse-checkout','set','/LICENSE','/README.md',*['/'+f for f in lock['files']]],check=True)
    subprocess.run(['git','-C',str(source),'checkout','--detach',lock['revision']],check=True)
def install(installation,source,root):
    lock=json.loads((ROOT/'scripts/csgomod-lock.json').read_text())
    for file,digest in lock['files'].items():
        if hashlib.sha256((source/file).read_bytes()).hexdigest()!=digest:raise ValueError('Checksum mismatch: '+file)
    if not (root/'data/skins.json').exists():
        subprocess.run(['python3',str(ROOT/'scripts/build-skins.py'),str(installation),'--root',str(root)],check=True)
    target=root/'custom/cstrike/models/dingus';target.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory(dir=root/'work' if (root/'work').exists() else None) as tmp:
        staged=Path(tmp)
        templates={w:(source/f'cstrike/models/csgo_v2_skins/{w}/v_{w}_0.mdl').read_bytes() for w in WEAPONS}
        butterfly=(source/'cstrike/models/csgo_v2_skins/knife_butterfly/v_knife_butterfly_0.mdl').read_bytes()
        for glove in range(3):
            texture=None if glove==0 else source/'skins/_gloves'/(['Crimson Web.bmp','Blue Steel.bmp'][glove-1])
            for weapon in WEAPONS:
                base=flatten(templates[weapon],glove=texture)
                for variant in range(5):
                    if not glove and not variant:continue
                    code=variant+glove*6;content=base if variant==0 else tint(base,FINISHES[variant-1])
                    (staged/f'v_{weapon}_{code}.mdl').write_bytes(content)
            (staged/f'v_knife_{5+glove*6}.mdl').write_bytes(flatten(butterfly,glove=texture))
        if sum(f.stat().st_size for f in staged.iterdir())>96*1024*1024:raise ValueError('Cosmetic model memory budget exceeded')
        for file in staged.iterdir():shutil.copy(file,target/file.name)
    archive=root/'data/skins.zip';temporary=archive.with_suffix('.zip.tmp')
    files=sorted(target.glob('*.mdl'))
    with zipfile.ZipFile(temporary,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as pack:
        for file in files:pack.write(file,'cstrike/models/dingus/'+file.name)
    temporary.replace(archive)
    digest=hashlib.sha256(archive.read_bytes()).hexdigest()
    info={'version':digest[:16],'size':archive.stat().st_size,'files':len(files),'features':['butterfly','gloves','hd_models'],'source':lock['revision'],'viewmodels':sum(f.name.startswith('v_') for f in files)}
    (root/'data/skins.json').write_text(json.dumps(info,indent=2)+'\n')
    (root/'data/csgomod-source.json').write_text(json.dumps(lock,indent=2)+'\n')
    print(json.dumps(info,indent=2));return info
if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('installation',type=Path);parser.add_argument('--root',type=Path,default=ROOT);parser.add_argument('--source',type=Path,default=ROOT/'work/csgomod-source');parser.add_argument('--fetch',action='store_true');args=parser.parse_args()
    if args.fetch:fetch(args.source,json.loads((ROOT/'scripts/csgomod-lock.json').read_text()))
    install(args.installation.resolve(),args.source.resolve(),args.root.resolve())
