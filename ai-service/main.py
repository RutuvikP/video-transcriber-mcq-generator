from fastapi import FastAPI, File, UploadFile, Form
from whisper_service import transcribe_video
import uvicorn
from pydantic import BaseModel
from mcq_generator import generate_mcqs_from_text

app = FastAPI()

class Segment(BaseModel):
    text: str

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...),fileName: str = Form(None)):
    transcription = await transcribe_video(file,fileName)
    return {"transcript": transcription}

@app.post("/generate-mcq")
async def generate_mcq(segment: Segment):
    mcq = generate_mcqs_from_text(segment.text)
    return {"mcqs": mcq}

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
