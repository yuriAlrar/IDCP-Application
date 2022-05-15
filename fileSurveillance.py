import os
import glob
import cv2
import yaml
import json

class fileSurveillance():
    def __init__(self):
        self.Settings = {}
        if os.path.exists('./engine.yaml'):
            with open('./engine.yaml') as f:
                temp = yaml.safe_load(f)
                Settings = temp['environ']
        else:
            print('can not found engine.yaml')
            return

        self.poolPath = Settings['common']['pool']

    def compound(self, id = ''):
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
        jsonfiles = glob.glob(self.poolPath + '*.json')
        for i in jsonfiles:
            temp = []
            with open(i, 'r') as f:
                temp = json.load(f)
            if temp['meta']['region'] == 'Anime-Transition' and temp['meta']['name'] == 'STD-GAN':
                '''
                Deep Cream Py
                '''
                # todo DCPの作業フォルダへ動く

if __name__ == '__main__':
    r = fileSurveillance()
    r.compound()
    r.moveFiles()