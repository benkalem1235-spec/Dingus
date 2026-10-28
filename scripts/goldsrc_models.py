"""Small GoldSrc Studio v10 adapter; keeps original bones, mesh and animation data.
CSGOMod uses bodygroup skins. Bake one choice so the standard browser client can
render it without AMXX's custom client bodygroup hook.
"""
import struct

def checked(data,offset,size):
    if offset<0 or size<0 or offset+size>len(data):raise ValueError('Model offset outside file')
    return data[offset:offset+size]

def flatten(data,choice=0,glove=None):
    from PIL import Image
    data=bytearray(data)
    if checked(data,0,4)!=b'IDST' or struct.unpack_from('<i',data,4)[0]!=10:raise ValueError('Expected GoldSrc Studio v10 model')
    if struct.unpack_from('<i',data,172)[0]!=1:raise ValueError('External animation groups are not supported')
    count,table=struct.unpack_from('<ii',data,180);checked(data,table,count*80)
    if count<1:raise ValueError('Embedded model textures required')
    refs,families,ref_table=struct.unpack_from('<iii',data,192);checked(data,ref_table,refs*2*families)
    old_refs=struct.unpack_from('<'+'h'*refs,data,ref_table)
    bodies,body_table=struct.unpack_from('<ii',data,204);checked(data,body_table,bodies*76)
    used=[];meshes=[];end=244
    def include(offset,size):
        nonlocal end
        checked(data,offset,size);end=max(end,offset+size)
    for field,stride in [(140,112),(148,24),(156,32),(164,176),(172,104),(204,76),(212,88)]:
        amount,offset=struct.unpack_from('<ii',data,field);include(offset,amount*stride)
    transitions,transition_table=struct.unpack_from('<ii',data,236);include(transition_table,transitions*transitions)
    bones=struct.unpack_from('<i',data,140)[0];sequences,sequence_table=struct.unpack_from('<ii',data,164)
    for i in range(sequences):
        seq=sequence_table+i*176;events,event_table,frames,pivots,pivot_table=struct.unpack_from('<5i',data,seq+48)
        include(event_table,events*76);include(pivot_table,pivots*20)
        blends,animation=struct.unpack_from('<ii',data,seq+120)
        if struct.unpack_from('<i',data,seq+156)[0]!=0:raise ValueError('External sequence group')
        include(animation,bones*blends*12)
        for record in range(bones*blends):
            start=animation+record*12
            for relative in struct.unpack_from('<6H',data,start):
                if not relative:continue
                cursor=start+relative;remaining=frames
                while remaining>0:
                    valid,total=struct.unpack('<BB',checked(data,cursor,2))
                    if not total or valid>total:raise ValueError('Invalid animation channel')
                    include(cursor,(valid+1)*2);cursor+=(valid+1)*2;remaining-=total

    for i in range(bodies):
        off=body_table+i*76;name,n,base,models=struct.unpack_from('<64s3i',data,off)
        selected=choice if name.split(b'\0')[0].lower()==b'skins' else 0
        if selected<0 or selected>=n:raise ValueError('Requested skin bodygroup is unavailable')
        model=models+selected*112;include(model,112)
        nv,vertex_bones,vertices,nn,normal_bones,normals,groups,group_table=struct.unpack_from('<8i',data,model+80)
        if groups:raise ValueError('Unsupported studio model groups')
        include(vertex_bones,nv);include(vertices,nv*12);include(normal_bones,nn);include(normals,nn*12)
        struct.pack_into('<iii',data,off+64,1,1,model)
        nm,mesh_table=struct.unpack_from('<ii',data,model+72);checked(data,mesh_table,nm*20);include(mesh_table,nm*20)
        for j in range(nm):
            mesh=mesh_table+j*20;ref=struct.unpack_from('<i',data,mesh+8)[0]
            if not 0<=ref<refs:raise ValueError('Invalid mesh skin reference')
            triangles=struct.unpack_from('<i',data,mesh+4)[0];cursor=triangles
            while True:
                command=struct.unpack('<h',checked(data,cursor,2))[0];include(cursor,2);cursor+=2
                if command==0:break
                include(cursor,abs(command)*8);cursor+=abs(command)*8
            texture=old_refs[ref]
            if not 0<=texture<count:raise ValueError('Invalid texture reference')
            if texture not in used:used.append(texture)
            meshes.append((mesh,texture))
    # CS:GO flip/inspect sound events reference files absent from the source pack.
    # Retain standard CS muzzle events and native gameplay sounds.
    for i in range(sequences):
        seq=sequence_table+i*176;events,event_table=struct.unpack_from('<ii',data,seq+48);kept=[]
        for j in range(events):
            event=bytes(checked(data,event_table+j*76,76))
            if struct.unpack_from('<i',event,4)[0]==5004 and b'weapons/csgo/' in event[12:]:continue
            kept.append(event)
        for j,event in enumerate(kept):data[event_table+j*76:event_table+(j+1)*76]=event
        struct.pack_into('<i',data,seq+48,len(kept))
    # Remove the large unused texture bank. Only selected bodyparts reference the
    # compact table; unreferenced geometry remains at its original stable offsets.
    if end>table:raise ValueError('Geometry overlaps texture bank')
    result=data[:end]
    while len(result)%4:result.append(0)
    for mesh,texture in meshes:struct.pack_into('<i',result,mesh+8,used.index(texture))
    descriptors=len(result);result.extend(b'\0'*(80*len(used)))
    glove_found=False
    for new,old in enumerate(used):
        name,flags,width,height,pixels=struct.unpack_from('<64s4i',data,table+old*80)
        if not 0<width<=2048 or not 0<height<=2048:raise ValueError('Invalid model texture size')
        texture=bytes(checked(data,pixels,width*height+768))
        if glove is not None and 'glove' in name.split(b'\0')[0].decode('latin1').lower():
            image=Image.open(glove).convert('RGB').resize((width,height)).quantize(colors=256)
            texture=image.tobytes()+bytes((image.getpalette() or [])[:768]).ljust(768,b'\0');glove_found=True
        offset=len(result);result.extend(texture)
        struct.pack_into('<64s4i',result,descriptors+new*80,name,flags,width,height,offset)
    if glove is not None and not glove_found:raise ValueError('Model has no compatible glove texture')
    while len(result)%4:result.append(0)
    new_refs=len(result);result.extend(struct.pack('<'+'h'*len(used),*range(len(used))))
    struct.pack_into('<iii',result,180,len(used),descriptors,descriptors+len(used)*80)
    struct.pack_into('<iii',result,192,len(used),1,new_refs)
    struct.pack_into('<i',result,72,len(result))
    return bytes(result)
