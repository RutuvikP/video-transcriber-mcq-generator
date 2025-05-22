import "reflect-metadata";
import express from "express";
import { useExpressServer } from "routing-controllers";
import path from "path";

export function createApp() {
    const app = express();

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    useExpressServer(app, {
        controllers: [path.join(__dirname, "/controllers/**/*.ts")],
    });

    return app;
}
