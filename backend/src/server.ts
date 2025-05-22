import "reflect-metadata";
import { createExpressServer } from "routing-controllers";
import { connectToMongo } from "./config/mongo";
import { TestController } from "./controllers/TestController";

const PORT = 4000;

const bootstrap = async () => {
    await connectToMongo();

    const app = createExpressServer({
        controllers: [TestController],
    });

    app.listen(PORT, () => {
        console.log(`🚀 Backend server is running on http://localhost:${PORT}`);
    });
};

bootstrap().catch((err) => {
    console.error("Error starting server:", err);
});
