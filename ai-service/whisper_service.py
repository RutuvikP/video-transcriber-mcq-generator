import whisper
import tempfile
import os

model = whisper.load_model("base")  # You can also use "small", "medium", "large"

async def transcribe_video(file):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_file:
        contents = await file.read()
        temp_file.write(contents)
        temp_file_path = temp_file.name

    result = model.transcribe(temp_file_path)

    # Clean up temp file
    try:
        os.remove(temp_file_path)
    except Exception as e:
        print(f"Could not delete temp file: {e}")

    return result["text"]
