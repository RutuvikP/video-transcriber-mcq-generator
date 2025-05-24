import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";

export const transcribeVideo = async (filePath: string, fileName: string) => {
    const form = new FormData();
    const absolutePath = path.resolve(filePath);
    form.append("file", fs.createReadStream(absolutePath));
    form.append("fileName", fileName);

    try {
        const response = await axios.post("http://127.0.0.1:8000/transcribe", form, {
            headers: form.getHeaders(),
            maxBodyLength: Infinity,
        });

        return response.data.transcript;
    } catch (error: any) {
        console.error("Transcription failed:", error.message);
        throw error;
    }
};
