import "reflect-metadata";
import express from "express";
import { useExpressServer } from "routing-controllers";
import path from "path";

const cors = require('cors');

export async function createApp() {
    const app = express();
    app.use(cors())
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    useExpressServer(app, {
        controllers: [path.join(__dirname, "/controllers/**/*.ts")],
    });

    return app;
}
