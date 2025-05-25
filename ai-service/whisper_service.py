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
        model = whisper.load_model("small")
    return model

async def transcribe_video(file, fileName):
    # Step 1: Save the uploaded video temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_file:
        contents = await file.read()
        temp_file.write(contents)
        temp_file_path = temp_file.name

    # Step 2: Get total duration of the video using ffprobe
    try:
        probe_cmd = [
            "ffprobe", "-v", "error", "-show_entries",
            "format=duration", "-of",
            "default=noprint_wrappers=1:nokey=1", temp_file_path
        ]
        result = subprocess.run(probe_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        duration = float(result.stdout.decode().strip())
    except Exception:
        duration = 0  # fallback if duration can't be retrieved

    # Step 3: Split the video into 5-minute segments using ffmpeg if it's longer than 5 minutes
    segments = []
    full_transcript = ""

    if duration > 300:
        # If the video is longer than 5 minutes, split it into 5-minute chunks
        chunks_dir = Path(tempfile.gettempdir()) / f"chunks_{uuid.uuid4().hex}"
        os.makedirs(chunks_dir, exist_ok=True)

        chunk_pattern = str(chunks_dir / "chunk_%03d.mp4")

        split_command = [
            "ffmpeg",
            "-i", temp_file_path,
            "-c", "copy",
            "-map", "0",
            "-segment_time", "300",  # Split every 5 minutes (300 seconds)
            "-f", "segment",
            "-reset_timestamps", "1",
            chunk_pattern
        ]

        subprocess.run(split_command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        # Step 4: Process each chunk and transcribe it as a whole
        current_start = 0
        for chunk_file in sorted(chunks_dir.glob("chunk_*.mp4")):
            result = get_model().transcribe(str(chunk_file), verbose=False)

            segment_data = {
                "startTime": round(current_start),  # Start time is the current offset
                "endTime": round(current_start + 300),  # End time is 5 minutes later
                "text": " ".join([seg["text"] for seg in result.get("segments", [])]).strip(),
                "mcqs": []
            }
            segments.append(segment_data)
            full_transcript += segment_data["text"] + " "

            current_start += 300  # Update the start time for the next chunk

        # Clean up the chunk files
        try:
            for chunk in chunks_dir.glob("*"):
                chunk.unlink()
            chunks_dir.rmdir()
        except Exception as e:
            print(f"Cleanup error: {e}")

    else:  # If the video is less than 5 minutes, transcribe it as a single segment
        result = get_model().transcribe(temp_file_path, verbose=False)

        segment_data = {
            "startTime": 0,
            "endTime": round(duration),  # The full video duration
            "text": " ".join([seg["text"] for seg in result.get("segments", [])]).strip(),
            "mcqs": []
        }
        segments.append(segment_data)
        full_transcript += segment_data["text"]

    # Step 5: Cleanup the main video file
    try:
        os.remove(temp_file_path)
    except Exception as e:
        print(f"Error cleaning up video file: {e}")

    # Return the full transcription and segments
    return {
        "title": fileName,
        "duration": round(duration),
        "fullTranscript": full_transcript.strip(),
        "segments": segments
    }
