import os
import random
import string
import io
import base64
import hashlib
import mimetypes
from datetime import datetime, timedelta
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import socket
import qrcode
import zipfile
from fastapi.staticfiles import StaticFiles
 
 

app = FastAPI()

# Enable CORS for frontend flexibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

text_store = {}
file_store = {}
EXPIRY_MINUTES = 5

# ---------------- Utilities ----------------
def generate_pin(existing_pins):
    while True:
        pin = ''.join(random.choices(string.digits, k=6))
        if pin not in existing_pins:
            return pin

def clean_expired(storage):
    now = datetime.now()
    expired = [k for k,v in storage.items() if v['expire'] < now]
    for k in expired:
        if 'file_paths' in storage[k]:
            for f in storage[k]['file_paths']:
                try:
                    os.remove(f)
                except:
                    pass
        del storage[k]

def generate_qr(url):
    qr = qrcode.QRCode(box_size=5, border=2)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    bio = io.BytesIO()
    img.save(bio, format="PNG")
    bio.seek(0)
    return base64.b64encode(bio.read()).decode()

def get_server_ip():
    """Get local server LAN IP"""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    finally:
        s.close()
    return ip

def sha256_checksum(file_path):
    """Generate file checksum."""
    sha = hashlib.sha256()
    try:
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                sha.update(chunk)
        return sha.hexdigest()
    except:
        return None

# ---------------- Routes ----------------

@app.get("/")
def root():
    return {"message": "Hello, world!"}

# -------- Text Share --------
@app.post("/api/text/share")
async def text_share(message: str = Form(...)):
    clean_expired(text_store)
    pin = generate_pin(text_store)
    expire_time = datetime.now() + timedelta(minutes=EXPIRY_MINUTES)
    text_store[pin] = {"message": message, "expire": expire_time}

    host = get_server_ip() + ":8000"
    url = f"http://{host}/api/text/{pin}"
    qr_code = generate_qr(url)

    return JSONResponse({"pin": pin, "expires_in_min": EXPIRY_MINUTES, "qr_code_base64": qr_code})

@app.get("/api/text/{pin}")
async def text_receive(pin: str):
    clean_expired(text_store)
    if pin not in text_store:
        raise HTTPException(status_code=404, detail="Invalid or expired PIN")
    return {"message": text_store[pin]['message']}

@app.post("/api/text/{pin}")
async def text_update(pin: str, message: str = Form(...)):
    clean_expired(text_store)
    if pin not in text_store:
        raise HTTPException(status_code=404, detail="Invalid or expired PIN")
    text_store[pin]['message'] = message
    return {"status": "updated"}

# -------- File Share --------
@app.post("/api/file/share")
async def file_share(files: List[UploadFile] = File(...)):
    clean_expired(file_store)
    pin = generate_pin(file_store)
    expire_time = datetime.now() + timedelta(minutes=EXPIRY_MINUTES)
    file_paths = []

    for f in files:
        safe_name = os.path.basename(f.filename)
        filepath = os.path.join(UPLOAD_FOLDER, f"{pin}_{safe_name}")

        with open(filepath, "wb") as out_file:
            content = await f.read()
            out_file.write(content)

        file_paths.append(filepath)

    file_store[pin] = {
        "file_paths": file_paths,
        "expire": expire_time,
        "uploaded_at": datetime.now()
    }

    host = get_server_ip() + ":8000"
    url = f"http://{host}/api/file/{pin}"
    qr_code = generate_qr(url)

    return JSONResponse({
        "pin": pin,
        "expires_in_min": EXPIRY_MINUTES,
        "qr_code_base64": qr_code
    })

@app.get("/api/file/{pin}")
async def list_files(pin: str):
    clean_expired(file_store)
    if pin not in file_store:
        raise HTTPException(status_code=404, detail="Invalid or expired PIN")
    
    file_infos = []
    for path in file_store[pin]['file_paths']:
        filename = os.path.basename(path).split("_", 1)[1]
        size_bytes = os.path.getsize(path)
        size_kb = f"{size_bytes / 1024:.2f} KB"
        file_infos.append({"name": filename, "size": size_kb})

    expires_in_min = int((file_store[pin]['expire'] - datetime.now()).total_seconds() / 60)
    
    return {"files": file_infos, "expires_in_min": expires_in_min}

@app.get("/api/file/{pin}/all")
async def download_all_files(pin: str):
    clean_expired(file_store)
    if pin not in file_store:
        raise HTTPException(status_code=404, detail="Invalid or expired PIN")

    zip_io = io.BytesIO()
    with zipfile.ZipFile(zip_io, mode="w") as zf:
        for file_path in file_store[pin]['file_paths']:
            zf.write(file_path, os.path.basename(file_path).split("_", 1)[1])
    zip_io.seek(0)

    return StreamingResponse(
        zip_io,
        media_type="application/x-zip-compressed",
        headers={"Content-Disposition": f"attachment; filename=files_{pin}.zip"}
    )

@app.get("/api/file/{pin}/{filename}")
async def download_file(pin: str, filename: str):
    clean_expired(file_store)
    if pin not in file_store:
        raise HTTPException(status_code=404, detail="Invalid or expired PIN")

    full_path = next(
        (p for p in file_store[pin]['file_paths']
         if os.path.basename(p).split("_", 1)[1] == filename),
        None
    )

    if not full_path:
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(full_path, filename=filename)

# ---------- Run ----------
# uvicorn main:app --reload --host 0.0.0.0 --port 8000
