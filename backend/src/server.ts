// src/server.ts
import dotenv from "dotenv";
import { createApp } from "./app";
import { connectToMongo } from "./config/mongo";

dotenv.config();

async function bootstrap() {
    await connectToMongo();

    const app = await createApp();

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
        console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    });
}

bootstrap().catch((error) => {
    console.error("Error starting backend:", error);
});
