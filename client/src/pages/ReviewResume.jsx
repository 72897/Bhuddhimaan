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
    <div className="h-full w-full overflow-y-auto flex flex-col justify-start p-6 text-slate-700 bg-gray-100 dark:bg-gray-900 scroll-hidden">
      
      {/* Upload and Configuration Form */}
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 print:hidden pb-8">
        
        {/* Left Side: Inputs */}
        <form
          onSubmit={onSubmitHandler}
          className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-5 text-slate-700"
        >
          <div className="flex items-center gap-2 border-b pb-3 border-gray-200">
            <FileText className="w-6 h-6 text-blue-500" />
            <h1 className="text-lg font-bold text-gray-800">AI ATS Resume Optimizer</h1>
          </div>

          {/* Upload File */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-gray-700">Upload Resume (PDF)</p>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
              id="resume-file-input"
            />
            <label
              htmlFor="resume-file-input"
              className="w-full p-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:border-blue-500 hover:bg-blue-50/30 transition text-center cursor-pointer block"
            >
              <FileText className="mx-auto w-8 h-8 text-gray-400 mb-2" />
              <span className="text-xs font-semibold text-gray-600">
                {file ? `📎 ${file.name}` : "Click to select A4 Resume PDF"}
              </span>
            </label>
          </div>

          {/* Job Description */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-gray-700">Target Job Description</p>
            <textarea
              rows={5}
              placeholder="Paste the job description here to analyze match score..."
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              className="w-full border border-gray-300 p-3 bg-white text-gray-900 rounded-xl focus:border-blue-500 focus:outline-none resize-none text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-450 text-white font-bold rounded-lg flex justify-center items-center gap-2 cursor-pointer shadow-sm hover:opacity-95 transition disabled:opacity-75 text-xs"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Analyzing Match Rate...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Analyze & Review</span>
              </>
            )}
          </button>
        </form>

        {/* Right Side: Score Card & Quick Actions */}
        <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl shadow flex flex-col justify-between text-slate-100">
          <div>
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Award className="text-yellow-500" /> ATS Compatibility Results
            </h2>

            {atsScore !== null ? (
              <div className="flex flex-col items-center gap-4 text-center mt-6">
                {/* Circular Score Gauge */}
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="54" stroke="#1e293b" strokeWidth="10" fill="transparent" />
                    <circle cx="64" cy="64" r="54" stroke="#3b82f6" strokeWidth="10" fill="transparent"
                      strokeDasharray={2 * Math.PI * 54}
                      strokeDashoffset={2 * Math.PI * 54 * (1 - atsScore / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-2xl font-extrabold text-blue-400">{atsScore}%</span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-white">
                    {atsScore >= 80 ? "Excellent Match!" : atsScore >= 60 ? "Average Match" : "Weak Match"}
                  </span>
                  <p className="text-xs text-slate-400 max-w-sm">{analysis?.matchAnalysis}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs text-center p-6 mt-6">
                <FileText className="w-10 h-10 mb-2 text-slate-650" />
                Upload your resume PDF and click Analyze to view match percentage, missing keywords, and recommendations.
              </div>
            )}
          </div>

          {atsScore !== null && (
            <button
              onClick={handleTailorResume}
              disabled={tailoring}
              className="mt-6 w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg flex justify-center items-center gap-2 cursor-pointer shadow transition disabled:opacity-75 text-xs"
            >
              {tailoring ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Tailoring Achievements...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  <span>Tailor Resume for this Job</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>

      {/* Structured Analysis Results */}
      {analysis && !tailoredResume && (
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 print:hidden pb-8">
          {/* Strengths & Weaknesses */}
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl shadow flex flex-col gap-4 text-slate-100">
            <h3 className="font-bold text-white flex items-center gap-2">
              <CheckCircle className="text-emerald-400 w-4 h-4" /> Key Strengths
            </h3>
            <ul className="list-disc pl-5 text-xs text-slate-300 flex flex-col gap-1.5">
              {analysis.strengths?.map((s, idx) => <li key={idx} className="text-slate-350">{s}</li>)}
            </ul>

            <h3 className="font-bold text-white flex items-center gap-2 mt-4">
              <AlertCircle className="text-rose-400 w-4 h-4" /> Vulnerability Areas
            </h3>
            <ul className="list-disc pl-5 text-xs text-slate-300 flex flex-col gap-1.5">
              {analysis.weaknesses?.map((w, idx) => <li key={idx} className="text-slate-350">{w}</li>)}
            </ul>
          </div>

          {/* Missing Keywords & Recs */}
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl shadow flex flex-col gap-4 text-slate-100">
            <h3 className="font-bold text-white">🎯 Missing Keywords</h3>
            <div className="flex flex-wrap gap-1.5">
              {analysis.missingKeywords?.map((kw, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-red-950/20 text-red-400 text-[10px] font-semibold rounded border border-red-900/30">
                  {kw}
                </span>
              ))}
            </div>

            <h3 className="font-bold text-white mt-4">💡 Recommendations</h3>
            <ul className="list-disc pl-5 text-xs text-slate-300 flex flex-col gap-1.5">
              {analysis.recommendations?.map((r, idx) => <li key={idx} className="text-slate-350">{r}</li>)}
            </ul>
          </div>
        </div>
      )}

      {/* Tailored Resume Print view */}
      {tailoredResume && (
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-4 pb-8">
          <div className="flex justify-between items-center bg-slate-900 border border-slate-700 p-4 rounded-xl shadow print:hidden text-slate-100">
            <span className="text-xs font-bold text-white">Tailored Version Ready</span>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer size={14} />
              <span>Print / Save PDF</span>
            </button>
          </div>

          {/* Styled Paper sheet */}
          <div 
            id="tailored-resume-print"
            className="w-full bg-white text-gray-900 p-12 shadow-2xl rounded-2xl min-h-[1056px] border border-gray-250 prose max-w-none text-xs leading-relaxed font-serif"
          >
            <Markdown>{tailoredResume}</Markdown>
          </div>
        </div>
      )}

    </div>
  );
}
