import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FileText } from "lucide-react";
import Markdown from "react-markdown";
import { useAuth } from "@clerk/clerk-react";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

export default function ResumeReview() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const { getToken } = useAuth();

  // File selection
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Submit to backend
  const onSubmitHandler = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please upload a resume first!");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("resume", file); // ✅ fixed: use file

      const token = await getToken();

      const { data } = await axios.post("/api/ai/resume-review", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (data.success) {
        setContent(data.content);
      } else {
        toast.error(data.message || "Something went wrong");
      }

      setResult(data);
    } catch (error) {
      toast.error(error.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  // Fake analysis (fallback demo)
  const handleReview = () => {
    if (!file) {
      setResult("⚠️ Please upload a resume first!");
      return;
    }
    setResult(
      `✅ Resume "${file.name}" analyzed successfully!\n\n✨ Recommendations:\n• Keep bullet points concise\n• Add measurable achievements\n• Highlight top 3 skills\n• Tailor keywords for the job role`
    );
  };

  return (
    <div className="h-screen flex items-center justify-center p-6  flex-wrap gap-6 bg-gray-100 dark:bg-gray-900 text-slate-700">

      {/* Left Column */}
      <form
        onSubmit={onSubmitHandler}
        className="w-full max-w-lg p-6 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col items-center"
      >
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-6 h-6 text-blue-500" />
          <h1 className="text-xl font-semibold text-gray-800">AI Resume Review</h1>
        </div>

        {/* File Upload */}
        <label className="w-full cursor-pointer">
          <input
            type="file"
            accept=".pdf,.doc,.docx,.png,.jpg"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:border-blue-400 hover:bg-blue-50 transition text-gray-600 text-center">
            {file ? `📎 ${file.name}` : "Drag & Drop or Click to Upload"}
          </div>
        </label>

        {/* Loading State */}
        <div className="mt-4">
          {loading ? (
            <span className="w-5 h-5 animate-spin inline-block">⏳</span>
          ) : (
            <FileText className="w-5 inline-block text-gray-500" />
          )}
        </div>

        {/* Buttons */}
        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition duration-300 font-medium disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "🚀 Review Resume"}
        </button>

        <button
          type="button"
          onClick={handleReview}
          className="mt-3 w-full bg-gray-200 text-gray-800 px-6 py-2 rounded-xl shadow hover:shadow-md hover:scale-105 transition duration-300 font-medium"
        >
          🔍 Quick Demo Review
        </button>
      </form>

      {/* Right Column (Results) */}
      <div className="w-full max-w-lg p-6 bg-white rounded-xl border flex flex-col border-gray-200 min-h-96 max-h-[600px] overflow-y-auto">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-green-500 text-2xl animate-pulse">📊</span>
          <h1 className="text-xl font-semibold text-gray-800">Analysis Results</h1>
        </div>

        {content ? (
          <div className="w-full h-full overflow-y-scroll text-sm text-slate-900">
            <Markdown>{content}</Markdown>
          </div>
        ) : (
          <div className="bg-gray-100 p-6 rounded-xl text-sm text-gray-700 whitespace-pre-wrap min-h-[200px] leading-relaxed shadow-inner flex items-center justify-center text-center">
            {result || "💡 Upload your resume and click 'Review Resume' to get AI-powered suggestions."}
          </div>
        )}
      </div>
    </div>
  );
}
