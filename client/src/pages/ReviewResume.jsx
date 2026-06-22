import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FileText, Award, AlertCircle, CheckCircle, RefreshCw, Printer, Download, Sparkles } from "lucide-react";
import Markdown from "react-markdown";
import { useAuth } from "@clerk/clerk-react";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

export default function ResumeReview() {
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [atsScore, setAtsScore] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [resumeText, setResumeText] = useState("");
  
  // Tailoring states
  const [tailoring, setTailoring] = useState(false);
  const [tailoredResume, setTailoredResume] = useState("");

  const { getToken } = useAuth();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    // reset states
    setAtsScore(null);
    setAnalysis(null);
    setResumeText("");
    setTailoredResume("");
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    if (!file) {
      return toast.error("Please upload a resume first!");
    }

    setLoading(true);
    setTailoredResume("");
    try {
      const formData = new FormData();
      formData.append("resume", file);
      if (jd.trim()) {
        formData.append("jd", jd);
      }

      const token = await getToken();
      const { data } = await axios.post("/api/ai/resume-review", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (data.success) {
        setAnalysis(data.content);
        setAtsScore(data.content.atsScore || 70);
        setResumeText(data.resumeText || "");
        toast.success("Resume analyzed successfully!");
      } else {
        toast.error(data.message || "Failed to analyze resume");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || "Error analyzing resume");
    } finally {
      setLoading(false);
    }
  };

  const handleTailorResume = async () => {
    if (!resumeText) return toast.error("Please review a resume first!");
    if (!jd.trim()) return toast.error("Job Description is required to tailor the resume.");

    setTailoring(true);
    try {
      const token = await getToken();
      const { data } = await axios.post(
        "/api/ai/tailor-resume",
        {
          text: resumeText,
          jd: jd,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data.success) {
        setTailoredResume(data.content);
        toast.success("Resume tailored successfully!");
      } else {
        toast.error(data.error || "Failed to tailor resume");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error tailoring resume");
    } finally {
      setTailoring(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById("tailored-resume-print");
    const originalContent = document.body.innerHTML;
    
    // Simple print helper
    const win = window.open("", "_blank");
    win.document.write(`
      <html>
        <head>
          <title>Tailored Resume</title>
          <style>
            body { font-family: 'Times New Roman', Times, serif; padding: 40px; color: #111; line-height: 1.5; font-size: 14px; }
            h1, h2, h3 { text-align: center; margin-bottom: 5px; }
            h2 { border-bottom: 1px solid #333; padding-bottom: 4px; margin-top: 20px; font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
            ul { margin-top: 5px; margin-bottom: 10px; }
            p { margin: 5px 0; }
            a { color: #111; text-decoration: none; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8 flex flex-col items-center gap-8 text-slate-700">
      
      {/* Upload and Configuration Form */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8 print:hidden">
        
        {/* Left Side: Inputs */}
        <form
          onSubmit={onSubmitHandler}
          className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl flex flex-col gap-5"
        >
          <div className="flex items-center gap-2 border-b pb-3 dark:border-gray-700">
            <FileText className="w-7 h-7 text-indigo-600 animate-pulse" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">AI ATS Resume Optimizer</h1>
          </div>

          {/* Upload File */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Upload Resume (PDF)</label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
              id="resume-file-input"
            />
            <label
              htmlFor="resume-file-input"
              className="w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-900/30 hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/10 transition text-center cursor-pointer block"
            >
              <FileText className="mx-auto w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {file ? `📎 ${file.name}` : "Click to select A4 Resume PDF"}
              </span>
            </label>
          </div>

          {/* Job Description */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Target Job Description</label>
            <textarea
              rows={5}
              placeholder="Paste the job description here to analyze match score and tailor your resume achievements..."
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              className="w-full border dark:border-gray-700 p-3 bg-transparent text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl flex justify-center items-center gap-2 cursor-pointer shadow transition-colors disabled:opacity-75"
          >
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analyzing Match Rate...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Analyze & Review
              </>
            )}
          </button>
        </form>

        {/* Right Side: Score Card & Quick Actions */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Award className="text-yellow-500" /> ATS Compatibility Results
            </h2>

            {atsScore !== null ? (
              <div className="flex flex-col items-center gap-4 text-center">
                {/* Circular Score Gauge */}
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="54" stroke="#e2e8f0" strokeWidth="10" fill="transparent" />
                    <circle cx="64" cy="64" r="54" stroke="#4f46e5" strokeWidth="10" fill="transparent"
                      strokeDasharray={2 * Math.PI * 54}
                      strokeDashoffset={2 * Math.PI * 54 * (1 - atsScore / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">{atsScore}%</span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-gray-800 dark:text-white">
                    {atsScore >= 80 ? "Excellent Match!" : atsScore >= 60 ? "Average Match" : "Weak Match"}
                  </span>
                  <p className="text-xs text-gray-500 max-w-sm">{analysis?.matchAnalysis}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-gray-400 text-sm text-center p-6">
                <FileText className="w-12 h-12 mb-2 text-gray-300" />
                Upload a resume and click Analyze to view match percentage, keyword analysis, and tailoring choices.
              </div>
            )}
          </div>

          {atsScore !== null && (
            <button
              onClick={handleTailorResume}
              disabled={tailoring}
              className="mt-6 w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-2xl flex justify-center items-center gap-2 cursor-pointer shadow-lg transition-transform hover:-translate-y-0.5 disabled:opacity-75"
            >
              {tailoring ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Tailoring Achievements...
                </>
              ) : (
                <>
                  <RefreshCw size={18} />
                  Tailor Resume for this Job
                </>
              )}
            </button>
          )}
        </div>

      </div>

      {/* Structured Analysis Results */}
      {analysis && !tailoredResume && (
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8 print:hidden">
          {/* Strengths & Weaknesses */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl flex flex-col gap-4">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CheckCircle className="text-emerald-500 w-5 h-5" /> Key Strengths
            </h3>
            <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-300 flex flex-col gap-2">
              {analysis.strengths?.map((s, idx) => <li key={idx}>{s}</li>)}
            </ul>

            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mt-4">
              <AlertCircle className="text-rose-500 w-5 h-5" /> Vulnerability Areas
            </h3>
            <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-300 flex flex-col gap-2">
              {analysis.weaknesses?.map((w, idx) => <li key={idx}>{w}</li>)}
            </ul>
          </div>

          {/* Missing Keywords & Recs */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl flex flex-col gap-4">
            <h3 className="font-bold text-gray-900 dark:text-white">🎯 Missing Keywords</h3>
            <div className="flex flex-wrap gap-2">
              {analysis.missingKeywords?.map((kw, idx) => (
                <span key={idx} className="px-2.5 py-1 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-lg border border-red-100 dark:border-red-900/30">
                  {kw}
                </span>
              ))}
            </div>

            <h3 className="font-bold text-gray-900 dark:text-white mt-4">💡 Recommendations</h3>
            <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-300 flex flex-col gap-2">
              {analysis.recommendations?.map((r, idx) => <li key={idx}>{r}</li>)}
            </ul>
          </div>
        </div>
      )}

      {/* Tailored Resume Print view */}
      {tailoredResume && (
        <div className="w-full max-w-4xl flex flex-col gap-4">
          <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg print:hidden">
            <span className="text-sm font-bold text-gray-800 dark:text-white">Tailored Version Ready</span>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Printer size={16} />
              Print / Save PDF
            </button>
          </div>

          {/* Styled Paper sheet */}
          <div 
            id="tailored-resume-print"
            className="w-full bg-white text-gray-900 p-12 shadow-2xl rounded-3xl min-h-[1056px] border border-gray-200 prose max-w-none text-sm leading-relaxed font-serif"
          >
            <Markdown>{tailoredResume}</Markdown>
          </div>
        </div>
      )}

    </div>
  );
}
