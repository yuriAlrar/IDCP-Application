from fastapi import FastAPI, Header, HTTPException, Form
from fastapi.responses import PlainTextResponse
from starlette.middleware.cors import CORSMiddleware
from fastapi import File, UploadFile
from datetime import datetime as dt
import uvicorn
from typing import List
import shutil
import jwt
import hashlib

app = FastAPI()

# CORSを回避するために追加
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost"],
    allow_credentials=True,   # 追記により追加
    allow_methods=["*"],      # 追記により追加
    allow_headers=["*"]       # 追記により追加
)
def BearerCheck(data):
    if not data:
        # bad request
        raise HTTPException(400)
    tdatetime = dt.now()
    secretkey = tdatetime.strftime('%Y/%m/%d')
    try:
        # secretkeyの開錠チェックのみ、キー整合性まではチェックしてない(後日対応)。
        decoded = jwt.decode(data.replace("Bearer ",""), secretkey, algorithms=['HS256'])
    except:
        # auth failed
        raise HTTPException(401)
    return decoded

@app.post("/api/pool/")
async def receiveBinary(json: str = Form(...), files: List[UploadFile] = File(...), authorization: str = Header(None)):
    '''
    データ受信
    ファイル名規則 : yyyymmdd_[random 8 string].m/.t/.j
    '''
    BearerCheck(authorization)
    if len(files) > 2:
        '''ファイル数が仕様違反'''
        raise HTTPException(400)
    nowdate = dt.now()
    prefix = nowdate.strftime('%Y%m%d')
    random8 = hashlib.sha256(nowdate.strftime('%H%M%S%f').encode()).hexdigest()[:8]
    commonFilename = prefix + '_' + random8
    if not list(filter(lambda x: not x.filename in ['target', 'mask'], files)):
        '''受信したファイル名が仕様違反'''
        print("abort")
        raise HTTPException(400)
    print(json)
    with open("./pool/" + commonFilename + '.j', "w") as f:
        f.write(json)
    for i in files:
        with open("./pool/" + commonFilename + '.' + i.filename[0], "wb") as f:
            shutil.copyfileobj(i.file, f)
    return {"response": "OK"}

@app.get("/")
def index():
    return PlainTextResponse(content="Berylna service is running.")

@app.get("/api/token")
def issue_token(user_agent: str = Header(None)):
    '''
    token発行
    '''
    tdatetime = dt.now()
    secretkey = tdatetime.strftime('%Y/%m/%d')
    encoded = jwt.encode({'UA': user_agent}, secretkey, algorithm='HS256')
    return {"token": encoded}


#トークンの有効性検証
@app.get("/api/check")
def check(authorization: str = Header(None), user_agent: str = Header(None)):
    '''
    トークンチェック
    '''
    if BearerCheck(authorization):
        return {"result":"OK."}

if __name__ == '__main__':
    uvicorn.run("main:app", port=8000, reload=True)