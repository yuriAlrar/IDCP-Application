from fastapi import FastAPI, APIRouter, Header, Depends,Response, HTTPException
from fastapi.responses import HTMLResponse, PlainTextResponse
from starlette.middleware.cors import CORSMiddleware
from fastapi import File, UploadFile
import jwt
from datetime import datetime as dt
import uvicorn
from typing import List
from pydantic import BaseModel
import shutil
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

# データ受信
@app.post("/pool/")
async def receiveBinary(file: UploadFile = File(...), authorization: str = Header(None)):
    '''
    ファイル名はcoockieに保存されている文字のハッシュ値とかどうでしょう
    またはベアラーキーのハッシュ値
    '''
    BearerCheck(authorization) 
    with open("./pool/" + file.filename, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return {"filename": file.filename}

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