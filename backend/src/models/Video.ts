import { Schema, model, Document } from "mongoose";

export interface ITranscriptSegment {
    startTime: number; // in seconds
    endTime: number;
    text: string;
    mcqs: {
        question: string;
        options: string[];
        answer: string;
    }[];
}

export interface IVideo extends Document {
    title: string;
    filePath: string;
    uploadedAt: Date;
    duration: number; // in seconds
    status: "pending" | "transcribing" | "completed" | "error";
    segments: ITranscriptSegment[];
}

const MCQSchema = new Schema({
    question: { type: String, required: true },
    options: [{ type: String }],
    answer: { type: String, required: true },
});

const SegmentSchema = new Schema({
    startTime: { type: Number, required: true },
    endTime: { type: Number, required: true },
    text: { type: String, required: true },
    mcqs: [MCQSchema],
});

const VideoSchema = new Schema<IVideo>({
    title: { type: String, required: true },
    filePath: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    duration: { type: Number, required: true },
    status: {
        type: String,
        enum: ["pending", "transcribing", "completed", "error"],
        default: "pending",
    },
    segments: [SegmentSchema],
});

export const VideoModel = model<IVideo>("Video", VideoSchema);
