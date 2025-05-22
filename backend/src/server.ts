import { createApp } from "./app";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 4000;
const app = createApp();

app.listen(PORT, () => {
    console.log(`🚀 Backend server is running on http://localhost:${PORT}`);
});
