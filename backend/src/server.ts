import dotenv from "dotenv";
import { createApp } from "./app";
import { connectToMongo, getDb } from "./config/mongo";
import { upload } from "./config/multer";
import { Request, Response } from "express";
import { transcribeVideo } from "./transcriptionService";
import { VideoModel } from "./models/Video";

dotenv.config();

async function bootstrap() {
    await connectToMongo();

    const app = await createApp();

    app.post("/videos/upload", upload.single("video"), async (req: Request, res: Response): Promise<void> => {
        const videoFile = req.file;
        if (!videoFile) {
            res.status(400).json({ error: "No file uploaded." });
            return;
        }

        try {
            const transcription = await transcribeVideo(videoFile.path, videoFile.originalname);
            console.log(transcription, 'trans');
            const { title, segments, duration } = transcription;

            const videosCollection = getDb().collection("videos");
            const result = await videosCollection.insertOne({
                title,
                filePath: videoFile.path,
                duration,
                segments,
                status: "completed",
                createdAt: new Date(),
            });
            res.status(200).json({
                message: "Transcription complete",
                file: req.file,
                transcript: transcription,
                videoId: result.insertedId,
            });
        } catch (error) {
            console.log(error, 'error');
            res.status(500).json({ error: "Transcription failed" });
        }
    });

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
        console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    });
}

bootstrap().catch((error) => {
    console.error("Error starting backend:", error);
});
