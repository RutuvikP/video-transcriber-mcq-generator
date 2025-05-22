import { MongoClient, Db } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "lecture-genius";

let db: Db;

export const connectToMongo = async () => {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log("Connected to MongoDB✅");
};

export const getDb = (): Db => {
    if (!db) {
        throw new Error("DB not initialized. Call connectToMongo first.");
    }
    return db;
};
