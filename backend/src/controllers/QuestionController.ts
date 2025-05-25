// src/controllers/QuestionController.ts

import { JsonController, Param, Post } from "routing-controllers";
import { ObjectId } from "mongodb";
import { getDb } from "../config/mongo";
import axios from "axios";

@JsonController("/generate-questions")
export class QuestionController {
    @Post("/:videoId")
    async generateQuestions(@Param("videoId") videoId: string) {
        const db = getDb();
        const video = await db.collection("videos").findOne({ _id: new ObjectId(videoId) });

        if (!video) return { error: "Video not found." };

        // Loop through transcript segments and call FastAPI to generate MCQs
        const updatedSegments = await Promise.all(
            video.segments.map(async (segment: any) => {
                const mcqs = await generateMcqsFromText(segment.text);
                return {
                    ...segment,
                    mcqs
                };
            })
        );

        // Update the MongoDB document with MCQs
        await db.collection("videos").updateOne(
            { _id: new ObjectId(videoId) },
            { $set: { segments: updatedSegments, status: "questions-generated" } }
        );

        return { message: "MCQs generated successfully", segments: updatedSegments };
    }
}

async function generateMcqsFromText(text: string): Promise<any[]> {
    try {
        const response = await axios.post("http://127.0.0.1:8000/generate-mcq", { text });
        return response.data.mcqs || [];
    } catch (error) {
        console.error("FastAPI MCQ generation failed:", error);
        return [];
    }
}
