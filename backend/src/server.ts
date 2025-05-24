import dotenv from "dotenv";
import { createApp } from "./app";
import { connectToMongo } from "./config/mongo";
import { upload } from "./config/multer";
import { Request, Response } from "express";

dotenv.config();

async function bootstrap() {
    await connectToMongo();

    const app = await createApp();

    app.post("/videos/upload", upload.single("video"), (req: Request, res: Response): void => {
        if (!req.file) {
            res.status(400).json({ error: "No file uploaded." });
            return;
        }

        res.json({ message: "File received", file: req.file });
    });

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
        console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    });
}

bootstrap().catch((error) => {
    console.error("Error starting backend:", error);
});
