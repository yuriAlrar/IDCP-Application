from fastapi import FastAPI, APIRouter, Header, Depends,Response, HTTPException
from fastapi.responses import HTMLResponse
import jwt
from datetime import datetime as dt
import uvicorn

app = FastAPI()

@app.get("/")
def index():
    with open("./index.html") as f:
        html = f.read()
    return Response(content=html, media_type="application/xml")

@app.get("/api/token")
def issue_token(user_agent: str = Header(None)):
    '''
    token発行
    '''
    tdatetime = dt.now()
    secretkey = tdatetime.strftime('%Y/%m/%d')
    encoded = jwt.encode({'UA': 'user_agent'}, secretkey, algorithm='HS256')
    return {"token": encoded}

def BearerCheck(data):
    tdatetime = dt.now()
    secretkey = tdatetime.strftime('%Y/%m/%d')
    try:
        decoded = jwt.decode(data.replace("Bearer ",""), secretkey, algorithms=['HS256'])
    except:
        return False
    return decoded

@app.get("/api/check")
def check(authorization: str = Header(None), user_agent: str = Header(None)):
    '''
    トークンチェック
    '''
    print(authorization)
    if authorization is None:
        raise HTTPException(401)
    elif BearerCheck(authorization):
        return {"result":authorization}
    else:
        raise HTTPException(400)

@app.get("/contet/{item_id}")
def read_item(item_id: int, q: str = None):
    return {"item_id": item_id, "q": q}

if __name__ == '__main__':
    uvicorn.run(app=app)