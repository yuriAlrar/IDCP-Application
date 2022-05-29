import os, shutil
import glob
import cv2
import yaml
import json

class fileSurveillance():
    def __init__(self):
        self.Engines = {}
        self.Environ = {}
        if os.path.exists('./engine.yaml'):
            with open('./engine.yaml') as f:
                temp = yaml.safe_load(f)
                self.Engines = temp['engines']
                self.Environ = temp['environ']
        else:
            print('can not found engine.yaml')
            return

        self.poolPath = self.Environ['common']['pool']

    def compound(self, id = ''):
        '''
        targetとmaskを合成してcompoundに変換する
        '''
        for i in glob.glob(self.poolPath + '*' + id + 'target.png'):
            target = i
            mask = i.replace('.target.', '.mask.')
            cmp = i.replace('.target.', '.composition.')
            if not ( os.path.exists(target) and os.path.exists(mask) ):
                continue
            cv2Target = cv2.imread(target)
            cv2Mask = cv2.imread(mask, -1)
            if cv2Target.shape[0:2] != cv2Mask.shape[0:2]:
                continue
            x1, y1, x2, y2 = 0, 0, cv2Target.shape[1], cv2Target.shape[0]
            cv2Target[y1:y2, x1:x2] = cv2Target[y1:y2, x1:x2] * (1 - cv2Mask[:, :, 3:] / 255) + cv2Mask[:, :, :3] * (cv2Mask[:, :, 3:] / 255)
            cv2.imwrite(cmp, cv2Target)
    def moveFiles(self):
        '''
        engine.yamlと*jsonのルールに従い画像をワークフォルダに移動する
        '''
        jsonfiles = glob.glob(self.poolPath + '*.json')
        for i in jsonfiles:
            env = {'inputExtRule': ''}
            id = None
            with open(i, 'r') as f:
                temp = json.load(f)
            for item in self.Engines:
                if temp['meta']['region'] == self.Engines[item]['region'] and temp['meta']['name'] == self.Engines[item]['name']:
                    id = item
                    break
            if id is not None and self.Environ[id]:
                env = self.Environ[id]
            for j in env['inputExtRule']:
                iSrc = i.replace('.json', '.' + j + '.png')
                iDst = env['input'] + os.path.basename(i).replace('.json', '.' + j + '.png')
                if os.path.exists(iSrc) and not os.path.exists(iDst):
                    print(iSrc, iDst)
                    shutil.copy(iSrc, iDst)

if __name__ == '__main__':
    import time
    r = fileSurveillance()
    while True:
        r.compound()
        r.moveFiles()
        time.sleep(30)