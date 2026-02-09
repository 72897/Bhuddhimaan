import React, { useState, useRef, useMemo } from "react";
import { Sparkles, Code, Play } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";

axios.defaults.baseURL = "http://localhost:3000";

const GenerateWebsite = () => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [panelWidth, setPanelWidth] = useState(50); // % width for preview
  const isDragging = useRef(false);

  // --- Extract JSX, CSS, Links, Scripts from AI response ---
  const extractFromReactCode = (code) => {
    try {
      const match = code.match(/return\s*\(([\s\S]*?)\);?/);
      if (!match) return { jsx: "", css: "", links: "", scripts: "" };

      let jsx = match[1].trim();

      if (jsx.startsWith("(") && jsx.endsWith(")")) {
        jsx = jsx.slice(1, -1).trim();
      }

      jsx = jsx.replace(/className=/g, "class=");

      let css = "";
      const styleMatch = jsx.match(/<style[^>]*>[\s\S]*?<\/style>/);
      if (styleMatch) {
        css = styleMatch[0];
        jsx = jsx.replace(styleMatch[0], "");
      }

      let links = "";
      const linkMatches = jsx.match(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi);
      if (linkMatches) {
        links = linkMatches.join("\n");
        linkMatches.forEach((link) => (jsx = jsx.replace(link, "")));
      }

      let scripts = "";
      const scriptMatches = jsx.match(/<script[\s\S]*?<\/script>/gi);
      if (scriptMatches) {
        scripts = scriptMatches.join("\n");
        scriptMatches.forEach((s) => (jsx = jsx.replace(s, "")));
      }

      return { jsx, css, links, scripts };
    } catch (error) {
      console.error("Failed to extract JSX/CSS/JS:", error);
      return { jsx: "", css: "", links: "", scripts: "" };
    }
  };

  // --- Iframe Live Preview ---
  const iframeSrcDoc = useMemo(() => {
    if (!code) return "";

    const { jsx, css, links, scripts } = extractFromReactCode(code);

    return `
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Live Preview</title>
          <script src="https://cdn.tailwindcss.com"></script>
          ${links}
          ${css}
        </head>
        <body class="p-6">
          ${jsx}
          ${scripts}
        </body>
      </html>
    `;
  }, [code]);

  // --- Drag Bar Handlers ---
  const startDrag = () => (isDragging.current = true);
  const stopDrag = () => (isDragging.current = false);
  const onDrag = (e) => {
    if (!isDragging.current) return;
    const newWidth = (e.clientX / window.innerWidth) * 100;
    if (newWidth > 20 && newWidth < 80) {
      setPanelWidth(newWidth);
    }
  };

  // --- Submit Handler ---
  const onSubmitHandler = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) {
      toast.error("Please enter a valid prompt.");
      return;
    }

    try {
      setLoading(true);
      const { data } = await axios.post("/api/ai/generate-website", { prompt });
      if (data.success) {
        setCode(data.code);
      } else {
        toast.error(data.error || "Failed to generate website code");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate website code.");
    } finally {
      setLoading(false);
    }
  };

  // --- Download HTML ---
  const downloadHTML = () => {
    if (!iframeSrcDoc) return;

    const blob = new Blob([iframeSrcDoc], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "generated-website.html";
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen  flex flex-col items-center p-6 gap-6  text-slate-700  bg-gray-100 dark:bg-gray-900">
      {/* Form */}
      <form
        onSubmit={onSubmitHandler}
        className="w-full max-w-3xl p-6 rounded-lg border border-gray-300 bg-white shadow-md"
      >
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-semibold">Generate Website</h1>
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          placeholder="Describe the website you want (e.g., A landing page with a hero, features, and contact form)"
          className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm resize-none"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full bg-gradient-to-r from-blue-600 to-blue-400 text-white py-2 rounded-lg flex justify-center items-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
          ) : (
            <>
              <Play className="w-5 h-5" />
              <span>Generate Website</span>
            </>
          )}
        </button>
      </form>

      {/* Preview + Code Panel */}
      {code && (
        <div
          className="w-full h-screen flex flex-col"
          onMouseMove={onDrag}
          onMouseUp={stopDrag}
        >
          {/* Top Bar */}
          <div className="flex justify-between items-center bg-blue-50 p-2 border-b border-gray-300">
            <h2 className="font-semibold text-blue-600 flex items-center gap-2">
              <Play className="w-5 h-5" /> Live Preview
            </h2>
            <div className="flex gap-2">
              <button
                onClick={downloadHTML}
                className="text-sm px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Download HTML
              </button>
              <button
                onClick={() => setShowCode(!showCode)}
                className="text-sm px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                {showCode ? "Hide Code" : "Show Code"}
              </button>
            </div>
          </div>

          {/* Panels */}
          <div className="flex-1 flex overflow-hidden">
            {/* Preview Panel */}
            <div
              className="h-full border-r border-gray-300"
              style={{ width: showCode ? `${panelWidth}%` : "100%" }}
            >
              <iframe
                title="Live Preview"
                className="w-full h-full border-none"
                sandbox="allow-same-origin allow-scripts"
                srcDoc={iframeSrcDoc}
              />
            </div>

            {/* Drag Bar */}
            {showCode && (
              <div
                className="w-1 bg-gray-400 cursor-col-resize hover:bg-gray-600"
                onMouseDown={startDrag}
              />
            )}

            {/* Code Panel */}
            {showCode && (
              <div
                className="h-full p-4 bg-white border-l border-gray-300 overflow-auto"
                style={{ width: `${100 - panelWidth}%` }}
              >
                <h2 className="font-semibold mb-2 flex items-center gap-2">
                  <Code className="w-5 h-5 text-blue-600" /> Generated React Code
                </h2>
                <pre className="whitespace-pre-wrap text-xs text-gray-800">
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
