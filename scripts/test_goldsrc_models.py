import struct,tempfile,unittest
from pathlib import Path
from PIL import Image
from goldsrc_models import flatten

def model():
    data=bytearray(3600);data[:4]=b'IDST';struct.pack_into('<i',data,4,10);struct.pack_into('<i',data,72,len(data))
    for field,values in [(140,(1,244)),(164,(1,356)),(172,(1,532)),(180,(2,1152)),(192,(2,1,3300)),(204,(1,636))]:struct.pack_into('<'+'i'*len(values),data,field,*values)
    struct.pack_into('<i',data,356+56,1);struct.pack_into('<ii',data,356+120,1,984)
    struct.pack_into('<64s3i',data,636,b'skins',2,1,712)
    for off,mesh,ref,tri in [(712,936,0,976),(824,956,1,978)]:
        struct.pack_into('<ii',data,off+72,1,mesh);struct.pack_into('<5i',data,mesh,0,tri,ref,0,0)
    for i,name in enumerate([b'weapon.bmp',b'gloves.bmp']):
        pixels=1312+i*769;struct.pack_into('<64s4i',data,1152+i*80,name,0,1,1,pixels);data[pixels]=0;data[pixels+1:pixels+769]=bytes([10+i])*768
    struct.pack_into('<2h',data,3300,0,1);return data
class StudioTests(unittest.TestCase):
    def test_bodygroup_baking_prunes_unused_geometry_and_textures(self):
        source=model();result=flatten(source,choice=1);self.assertLess(len(result),len(source));self.assertEqual(struct.unpack_from('<i',result,180)[0],1);self.assertEqual(struct.unpack_from('<3i',result,636+64),(1,1,824));self.assertEqual(struct.unpack_from('<i',result,956+8)[0],0);self.assertEqual(struct.unpack_from('<i',result,72)[0],len(result));self.assertEqual(result[244:356],source[244:356])
    def test_glove_replacement_and_rejection_of_missing_glove_material(self):
        with tempfile.TemporaryDirectory() as directory:
            glove=Path(directory)/'glove.bmp';Image.new('RGB',(2,2),(210,30,60)).save(glove)
            result=flatten(model(),choice=1,glove=glove);table=struct.unpack_from('<i',result,184)[0];pixels=struct.unpack_from('<i',result,table+76)[0];self.assertEqual(result[pixels+1:pixels+4],bytes([210,30,60]))
            with self.assertRaisesRegex(ValueError,'glove texture'):flatten(model(),choice=0,glove=glove)
    def test_invalid_models_and_external_animation_groups_are_rejected(self):
        with self.assertRaises(ValueError):flatten(b'not a model')
        external=model();struct.pack_into('<i',external,172,2)
        with self.assertRaisesRegex(ValueError,'animation groups'):flatten(external)
        with self.assertRaisesRegex(ValueError,'bodygroup'):flatten(model(),choice=5)
    def test_missing_csgo_sound_events_are_removed(self):
        source=model();struct.pack_into('<ii',source,356+48,1,1000);struct.pack_into('<3i',source,1000,1,5004,0);payload=b'weapons/csgo/butterfly/draw.wav';source[1012:1012+len(payload)]=payload
        result=flatten(source);self.assertEqual(struct.unpack_from('<i',result,356+48)[0],0)
if __name__=='__main__':unittest.main()
