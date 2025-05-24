import whisper
import tempfile
import os
import subprocess
import uuid
from pathlib import Path

model = None

def get_model():
    global model
    if model is None:
        model = whisper.load_model("small")  # or "medium"
    return model

async def transcribe_video(file,fileName):
    # Step 1: Save the uploaded video temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_file:
        contents = await file.read()
        temp_file.write(contents)
        temp_file_path = temp_file.name

    # Step 2: Create a temp directory to store chunks
    chunks_dir = Path(tempfile.gettempdir()) / f"chunks_{uuid.uuid4().hex}"
    os.makedirs(chunks_dir, exist_ok=True)

    # Step 3: Split the video into 5-minute segments using ffmpeg
    chunk_pattern = str(chunks_dir / "chunk_%03d.mp4")
    split_command = [
        "ffmpeg",
        "-i", temp_file_path,
        "-c", "copy",
        "-map", "0",
        "-segment_time", "300",
        "-f", "segment",
        "-reset_timestamps", "1",
        chunk_pattern
    ]

    subprocess.run(split_command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    # Step 4: Transcribe each chunk with timestamps
    segments = []
    full_transcript = ""
    current_start = 0

    for chunk_file in sorted(chunks_dir.glob("chunk_*.mp4")):
        result = get_model().transcribe(str(chunk_file), verbose=False)

        for seg in result.get("segments", []):
            segment_data = {
                "startTime": round(current_start + seg["start"]),
                "endTime": round(current_start + seg["end"]),
                "text": seg["text"].strip(),
                "mcqs":[]
            }
            segments.append(segment_data)
            full_transcript += seg["text"].strip() + " "

        # Update start time offset for the next chunk
        current_start += 300  # 5 minutes

    # Step 5: Get total duration using ffprobe
    try:
        probe_cmd = [
            "ffprobe", "-v", "error", "-show_entries",
            "format=duration", "-of",
            "default=noprint_wrappers=1:nokey=1", temp_file_path
        ]
        result = subprocess.run(probe_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        duration = float(result.stdout.decode().strip())
    except Exception:
        duration = current_start  # fallback

    # Step 6: Cleanup
    try:
        os.remove(temp_file_path)
        for chunk in chunks_dir.glob("*"):
            chunk.unlink()
        chunks_dir.rmdir()
    except Exception as e:
        print(f"Cleanup error: {e}")

    return {
        "title":fileName,
        "duration": round(duration),
        "fullTranscript": full_transcript.strip(),
        "segments": segments
    }
