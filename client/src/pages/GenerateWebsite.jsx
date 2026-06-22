import React, { useState, useMemo, useRef, useEffect } from "react";
import { Sparkles, Code, Play, Download, Wand2, MousePointerClick, Edit2, RotateCcw } from "lucide-react";
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
  
  // Element editing states
  const [selectedElement, setSelectedElement] = useState(null);
  const [editInstruction, setEditInstruction] = useState("");
  const [modifying, setModifying] = useState(false);

  const isDragging = useRef(false);
  const { getToken } = useAuth();

  // Listen to postMessage from iframe
  useEffect(() => {
    const handleMessage = (e) => {
      if (e.data && e.data.type === "ELEMENT_CLICKED") {
        setSelectedElement(e.data.element);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // ✅ Stable iframe content with click listeners injected
  const iframeSrcDoc = useMemo(() => {
    if (!code) return "";

    const clickScript = `
      <script>
        document.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          // Clear previous highlight
          const prev = document.querySelector('.buddhimaan-highlight');
          if (prev) {
            prev.style.outline = '';
            prev.classList.remove('buddhimaan-highlight');
          }
          
          const el = e.target;
          el.classList.add('buddhimaan-highlight');
          el.style.outline = '3px solid #6366f1';
          el.style.outlineOffset = '2px';
          
          window.parent.postMessage({
            type: 'ELEMENT_CLICKED',
            element: {
              tagName: el.tagName,
              id: el.id,
              className: el.className,
              innerText: el.innerText || el.value || ""
            }
          }, '*');
        });
      </script>
    `;

    if (code.includes("<body")) {
      return code.replace("</body>", `${clickScript}</body>`);
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body>
          ${code}
          ${clickScript}
        </body>
      </html>
    `;
  }, [code]);

  // ✅ Drag handling
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

  // ✅ Generate Handler
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
      setSelectedElement(null);
      toast.success("Website generated!");
    } catch (error) {
      toast.error(error.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Modify Element Handler
  const handleModifyElement = async (e) => {
    e.preventDefault();
    if (!editInstruction.trim()) {
      return toast.error("Please describe what to change.");
    }

    try {
      setModifying(true);
      const token = await getToken();

      const { data } = await axios.post(
        "/api/ai/modify-website",
        {
          code,
          element: selectedElement,
          instruction: editInstruction,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!data.success) {
        throw new Error(data.error || "Modification failed");
      }

      setCode(data.content);
      setSelectedElement(null);
      setEditInstruction("");
      toast.success("Section updated!");
    } catch (error) {
      toast.error(error.message || "Modification failed");
    } finally {
      setModifying(false);
    }
  };

  // ✅ Download
  const downloadHTML = () => {
    if (!code) return;
    const blob = new Blob([code], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "website.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full w-full overflow-y-auto flex flex-col justify-start p-6 text-slate-700 bg-gray-100 dark:bg-gray-900 scroll-hidden">
      
      {/* Page Header */}
      <div className="max-w-4xl mx-auto w-full mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-blue-500" />
          AI Landing Page Generator
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-xs">
          Describe the website you want to generate, and edit specific components interactively.
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={onSubmitHandler}
        className="w-full max-w-4xl bg-white p-6 rounded-xl border border-gray-250 shadow-sm mx-auto flex flex-col gap-4 text-slate-700"
      >
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your landing page (e.g. 'A sleek dark mode marketing page for a cyber security firm with pricing cards, testimonials, and primary colors as neon purple')..."
          rows={3}
          className="w-full border border-gray-350 p-3 bg-white text-gray-900 rounded-lg focus:border-blue-500 focus:outline-none resize-none text-xs"
        />

        <button
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-450 text-white font-bold py-2.5 rounded-lg flex justify-center items-center gap-1.5 cursor-pointer shadow-xs transition hover:opacity-95 text-xs"
        >
          {loading ? (
            <span className="w-4 h-4 my-0.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Play size={14} />
              <span>Generate Landing Page</span>
            </>
          )}
        </button>
      </form>

      {/* Editor & Preview Sandbox */}
      {code && (
        <div className="w-full max-w-7xl mx-auto flex flex-col bg-slate-900 border border-slate-700 rounded-xl shadow overflow-hidden mb-8 mt-6">
          
          {/* Editor Header Control */}
          <div className="flex flex-wrap items-center justify-between p-4 border-b border-slate-800 bg-slate-950/40 gap-3 text-slate-100">
            <h2 className="flex items-center gap-2 font-bold text-white text-sm">
              <Code size={18} className="text-blue-500" /> Interactive Sandbox
            </h2>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowCode((prev) => !prev)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                {showCode ? "Hide Code Panel" : "View Code Panel"}
              </button>

              <button
                type="button"
                onClick={downloadHTML}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition cursor-pointer"
              >
                <Download size={14} />
                <span>Download HTML</span>
              </button>
            </div>
          </div>

          {/* Editor Grid Split-pane */}
          <div className="flex flex-col lg:flex-row h-[700px] relative">
            
            {/* Left/Main Preview Window */}
            <div
              style={{ width: showCode ? `${panelWidth}%` : "100%" }}
              className="h-full border-r border-slate-800 flex flex-col relative transition-all duration-100"
            >
              {/* Sandbox Tip Banner */}
              <div className="px-4 py-2 bg-slate-950/50 border-b border-slate-850 text-[10px] text-slate-400 flex items-center gap-2 font-medium">
                <MousePointerClick size={12} />
                <span>Tip: Click on any text, button, or header in the preview to select and modify it.</span>
              </div>

              {/* Iframe View */}
              <iframe
                title="preview"
                srcDoc={iframeSrcDoc}
                sandbox="allow-scripts allow-same-origin"
                className="w-full flex-1 bg-white"
              />

              {/* Element Modification Overlay Panel */}
              {selectedElement && (
                <div className="absolute bottom-4 left-4 right-4 bg-slate-950 text-white p-4 rounded-xl shadow-2xl border border-slate-800 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
                      <Edit2 size={12} />
                      Selected element: &lt;{selectedElement.tagName.toLowerCase()}&gt;
                    </div>
                    <button 
                      type="button"
                      onClick={() => setSelectedElement(null)}
                      className="text-slate-400 hover:text-white text-sm font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {selectedElement.innerText && (
                    <div className="text-[11px] text-slate-350 italic truncate max-w-full">
                      "{selectedElement.innerText}"
                    </div>
                  )}

                  <form onSubmit={handleModifyElement} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. 'change background to slate-800' or 'make text larger and bold'..."
                      value={editInstruction}
                      onChange={(e) => setEditInstruction(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs focus:outline-none focus:border-blue-500 text-white"
                    />
                    <button
                      type="submit"
                      disabled={modifying}
                      className="px-4 py-2 bg-blue-650 hover:bg-blue-600 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-75"
                    >
                      {modifying ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <>
                          <Wand2 size={14} />
                          <span>Apply</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Resize Split-drag Handle */}
            {showCode && (
              <div
                className="w-1 bg-slate-850 cursor-col-resize hover:bg-indigo-500 transition-colors hidden lg:block"
                onMouseDown={startDrag}
              />
            )}

            {/* Right pane: Monaco-style textarea Editor */}
            {showCode && (
              <div
                style={{ width: `${100 - panelWidth}%` }}
                className="h-full flex flex-col bg-slate-950 text-slate-100"
              >
                <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex justify-between items-center text-[10px] font-semibold tracking-wide text-slate-500">
                  <span>LIVE HTML EDITOR</span>
                  <div className="flex items-center gap-1.5 text-[9px] text-slate-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span>Auto-sync Active</span>
                  </div>
                </div>

                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="flex-1 w-full p-4 font-mono text-xs bg-slate-950 text-emerald-400 focus:outline-none resize-none overflow-auto leading-relaxed border-0"
                />
              </div>
            )}

          </div>

        </div>
      )}
    </div>
  );
};

// Loader icon replacement
const Loader2 = ({ size = 20, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`lucide lucide-loader-2 ${className}`}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export default GenerateWebsite;