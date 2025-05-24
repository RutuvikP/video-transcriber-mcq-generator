from fastapi import FastAPI, File, UploadFile, Form
from whisper_service import transcribe_video
import uvicorn

app = FastAPI()

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...),fileName: str = Form(None)):
    transcription = await transcribe_video(file,fileName)
    return {"transcript": transcription}

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
