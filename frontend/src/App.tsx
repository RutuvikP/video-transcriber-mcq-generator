import { useRef, useState } from "react";
import axios from "axios";

interface MCQ {
  question: string;
  options: string[];
  answer: string;
}

interface TranscriptSegment {
  startTime: number;
  endTime: number;
  text: string;
  mcqs: MCQ[];
}

interface Transcript {
  duration: number;
  fullTranscript: string;
  segments: TranscriptSegment[];
  title: string;
}

const App = () => {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [loadingUpload, setLoadingUpload] = useState<boolean>(false);
  const [loadingMCQs, setLoadingMCQs] = useState<boolean>(false);
  const [mcqError, setMcqError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleChooseFile = () => {
    if (inputRef.current) {
      inputRef.current.click()
    }
  }
  // Handle file selection change
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
    }
  };

  // Handle video upload
  const handleSubmitVideoUpload = async () => {
    if (file) {
      const formData = new FormData();
      formData.append("video", file);
      setLoadingUpload(true);
      setMcqError(null);

      try {
        const response = await axios.post("http://localhost:4000/videos/upload", formData);
        setTranscript(response.data.transcript);
        setVideoId(response.data.videoId);
      } catch (error) {
        console.error("Error uploading video", error);
      } finally {
        setLoadingUpload(false);
      }
    }
  };

  // Handle MCQs generation
  const handleGenerateMCQs = async () => {
    if (!videoId) return;

    setLoadingMCQs(true);
    setMcqError(null);

    try {
      const response = await axios.post(`http://localhost:4000/generate-questions/${videoId}`);
      if (response.data.length === 0) {
        setMcqError("No MCQs generated for this video.");
      } else {
        const updatedTranscript = { ...transcript!, segments: response.data.segments };
        setTranscript(updatedTranscript);
      }
    } catch (error) {
      console.error("Error generating MCQs", error);
      setMcqError("Failed to generate MCQs.");
    } finally {
      setLoadingMCQs(false);
    }
  };

  // Handle clear file selection
  const handleClearFileSelection = () => {
    setFile(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">Video Transcription and MCQs</h1>

      {/* File Upload Section */}
      <div className="w-full max-w-md mb-4">
        <div className="mb-4 p-2 border rounded w-full text-gray-700 cursor-pointer" onClick={handleChooseFile}>
          {file ? (
            <p className="flex justify-between items-center mb-4 text-gray-800">
              {file.name}
            </p>
          ) : "Choose video file"}
        </div>
        <input
          key={file ? "selected" : "not-selected"}  // Force input to reset when file is cleared
          type="file"
          accept="video/mp4"
          onChange={handleFileChange}
          className="hidden"
          ref={inputRef}
        />
        {file && <div className="flex justify-end items-center mb-4">
          <button
            className="w-full py-2 px-4 bg-red-500 text-white rounded hover:bg-red-700 cursor-pointer"
            onClick={handleClearFileSelection}
          >
            Clear Selection
          </button>
        </div>}
        {loadingUpload ? (
          <div className="flex justify-center items-center text-xl text-blue-600">Uploading...</div>
        ) : (
          <button
            onClick={handleSubmitVideoUpload}
            className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-700 cursor-pointer"
            disabled={loadingUpload || !file}
          >
            Upload Video
          </button>
        )}
      </div>

      {/* Show Transcript */}
      {transcript && (
        <div className="w-full max-w-md p-4 border rounded mt-6 bg-white shadow-lg">
          <h2 className="text-xl font-semibold mb-2">Transcript</h2>
          <p className="text-gray-700">{transcript?.title}</p>
        </div>
      )}

      {/* Generate MCQs Button */}
      {transcript && !loadingUpload && !loadingMCQs && (
        <div className="mt-4">
          <button
            onClick={handleGenerateMCQs}
            className="w-full max-w-md py-2 px-4 bg-green-500 text-white rounded hover:bg-green-700"
            disabled={loadingMCQs}
          >
            Generate MCQs
          </button>
        </div>
      )}

      {/* Loading for MCQs Generation */}
      {loadingMCQs && (
        <div className="flex justify-center items-center text-xl text-green-600 mt-4">Generating MCQs...</div>
      )}

      {/* Show MCQ Generation Error */}
      {mcqError && (
        <div className="w-full max-w-md p-4 mt-4 text-red-600 bg-red-100 border rounded">
          <p>{mcqError}</p>
        </div>
      )}

      {/* Display Transcript Segments */}
      <div className="mt-6 w-full max-w-4xl">
        <h2 className="text-lg font-semibold text-center">Transcript Segments</h2>
        <ul className="space-y-4">
          {transcript?.segments.map((segment, index) => (
            <li key={index} className="p-4 bg-white shadow-lg rounded">
              <div className="font-medium text-gray-800">
                <span className="text-sm text-gray-500">Start: {segment.startTime}s</span> - <span className="text-sm text-gray-500">End: {segment.endTime}s</span>
              </div>
              <p className="mt-2 text-gray-700">{segment.text}</p>
              {segment.mcqs.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold">Generated MCQs:</h3>
                  <ul className="space-y-2">
                    {segment.mcqs.map((mcq, idx) => (
                      <li key={idx} className="bg-gray-50 p-2 rounded border">
                        <div className="font-medium text-gray-900">{mcq.question}</div>
                        <ul className="mt-2 space-y-1">
                          {mcq.options.map((option, optionIdx) => (
                            <li key={optionIdx} className="text-gray-700">{option}</li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default App;
