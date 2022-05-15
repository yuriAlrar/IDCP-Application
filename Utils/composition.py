import os
import glob
import cv2
def main(id = ''):
    '''
    ファイル命名規則
    *.m マスク画像
    *.t 元画像
    *.c .mと.tの合成画像
    *.j 
    '''
    dcpPath  = 'C:/Users/rem15/ClowlDriver/deep-cream-py/'
    poolPath = 'C:/Users/rem15/ClowlDriver/Application/pool/'
    compound(poolPath, id)

def compound(poolPath, id):
    for i in glob.glob(poolPath + '*' + id + '.t'):
        target = i
        mask = i[::-1].replace('t', 'm', 1)[::-1]
        cmp = i[::-1].replace('t', 'gnp', 1)[::-1]
        if not ( os.path.exists(target) and os.path.exists(mask) ):
            continue
        cv2Target = cv2.imread(target)
        cv2Mask = cv2.imread(mask)
        if cv2Target.shape[0:2] != cv2Mask.shape[0:2]:
            continue
        cv2Target = cv2.cvtColor(cv2Target, cv2.COLOR_BGR2RGBA)
        cv2Mask = cv2.cvtColor(cv2Mask, cv2.COLOR_BGR2RGBA)
        blended = cv2.addWeighted(src1=cv2Target, alpha=1, src2=cv2Mask, beta=1, gamma=0)
        cv2.imwrite(cmp, blended)
if __name__ == '__main__':
    main()