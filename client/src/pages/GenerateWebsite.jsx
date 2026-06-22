import React, { useState, useMemo, useRef, useEffect } from "react";
import { Sparkles, Code, Play, Download } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useAuth } from "@clerk/clerk-react";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL || "";

const GenerateWebsite = () => {
  const [prompt, setPrompt] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [panelWidth, setPanelWidth] = useState(50);

  const isDragging = useRef(false);
  const { getToken } = useAuth();

  // ✅ Stable iframe content
  const iframeSrcDoc = useMemo(() => {
  if (!code) return "";

  if (code.includes("<html")) return code;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>
        ${code}
      </body>
    </html>
  `;
}, [code]);

  // ✅ Better drag handling (global listeners)
  useEffect(() => {
    const handleMove = (e) => {
      if (!isDragging.current) return;

      const width = (e.clientX / window.innerWidth) * 100;
      if (width > 20 && width < 80) {
        setPanelWidth(width);
      }
    };

    const handleUp = () => {
      isDragging.current = false;
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, []);

  const startDrag = () => {
    isDragging.current = true;
  };

  // ✅ Submit handler
  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (!prompt.trim()) {
      return toast.error("Please enter a prompt.");
    }

    try {
      setLoading(true);
      const token = await getToken();

      const { data } = await axios.post(
        "/api/ai/generate-website",
        { prompt },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!data.success) {
        throw new Error(data.error || "Generation failed");
      }

      setCode(data.content);
      toast.success("Website generated!");
    } catch (error) {
      toast.error(error.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Download
  const downloadHTML = () => {
    if (!iframeSrcDoc) return;

    const blob = new Blob([iframeSrcDoc], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "website.html";
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-6 gap-6 bg-gray-100 dark:bg-gray-900 text-slate-700">
      
      {/* Form */}
      <form
        onSubmit={onSubmitHandler}
        className="w-full max-w-3xl bg-white p-6 rounded-xl shadow"
      >
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="text-blue-600" />
          <h1 className="text-xl font-semibold">AI Website Generator</h1>
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your website..."
          rows={4}
          className="w-full border p-3 rounded-md focus:ring-2 focus:ring-blue-400"
        />

        <button
          disabled={loading}
          className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg flex justify-center items-center gap-2"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Play size={18} />
              Generate Website
            </>
          )}
        </button>
      </form>

      {/* Preview */}
      {code && (
        <div className="w-full max-w-6xl flex flex-col">
          
          {/* Header */}
          <div className="flex justify-between bg-white p-3 border rounded-t-lg">
            <h2 className="flex items-center gap-2 font-semibold">
              <Play size={18} /> Live Preview
            </h2>

            <div className="flex gap-2">
              <button
                onClick={downloadHTML}
                className="bg-green-600 text-white px-3 py-1 rounded-md flex items-center gap-1"
              >
                <Download size={16} />
                Download
              </button>

              <button
                onClick={() => setShowCode((prev) => !prev)}
                className="bg-gray-700 text-white px-3 py-1 rounded-md"
              >
                {showCode ? "Hide Code" : "Show Code"}
              </button>
            </div>
          </div>

          <div className="flex h-[600px] border border-t-0 rounded-b-lg overflow-hidden">
            
            {/* Preview */}
            <div
              style={{ width: showCode ? `${panelWidth}%` : "100%" }}
              className="border-r"
            >
              <iframe
                title="preview"
                srcDoc={iframeSrcDoc}
                sandbox="allow-scripts allow-same-origin"
                
                className="w-full h-full bg-white"
              />
            </div>

            {/* Drag bar */}
            {showCode && (
              <div
                className="w-1 bg-gray-400 cursor-col-resize hover:bg-blue-500"
                onMouseDown={startDrag}
              />
            )}

            {/* Code */}
            {showCode && (
              <div
                style={{ width: `${100 - panelWidth}%` }}
                className="p-4 bg-gray-50 overflow-auto"
              >
                <h3 className="flex items-center gap-2 font-semibold mb-2">
                  <Code size={18} /> Generated Code
                </h3>

                <pre className="text-xs whitespace-pre-wrap">
                  {code}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerateWebsite;