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
    <div className="min-h-screen flex flex-col items-center p-6 gap-6 bg-gray-100 dark:bg-gray-900 text-slate-700">
      
      {/* Form */}
      <form
        onSubmit={onSubmitHandler}
        className="w-full max-w-4xl bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl"
      >
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="text-indigo-600 w-6 h-6" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">AI Landing Page Generator</h1>
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your landing page (e.g. 'A sleek dark mode marketing page for a cyber security firm with pricing cards, testimonials, and primary colors as neon purple')..."
          rows={3}
          className="w-full border dark:border-gray-700 p-3.5 bg-transparent text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
        />

        <button
          disabled={loading}
          className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl flex justify-center items-center gap-2 cursor-pointer shadow transition-colors"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Play size={18} />
              Generate Landing Page
            </>
          )}
        </button>
      </form>

      {/* Editor & Preview Sandbox */}
      {code && (
        <div className="w-full max-w-7xl flex flex-col bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-2xl overflow-hidden">
          
          {/* Editor Header Control */}
          <div className="flex flex-wrap items-center justify-between p-4 border-b dark:border-gray-700 gap-3">
            <h2 className="flex items-center gap-2 font-bold text-gray-800 dark:text-white">
              <Code size={20} className="text-indigo-600" /> Interactive Sandbox
            </h2>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCode((prev) => !prev)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
              >
                {showCode ? "Hide Code Panel" : "View Code Panel"}
              </button>

              <button
                onClick={downloadHTML}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download size={16} />
                Download HTML
              </button>
            </div>
          </div>

          {/* Editor Grid Split-pane */}
          <div className="flex flex-col lg:flex-row h-[700px] relative">
            
            {/* Left/Main Preview Window */}
            <div
              style={{ width: showCode ? `${panelWidth}%` : "100%" }}
              className="h-full border-r dark:border-gray-700 flex flex-col relative transition-all duration-100"
            >
              {/* Sandbox Tip Banner */}
              <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/10 border-b dark:border-gray-700 text-xs text-indigo-700 dark:text-indigo-300 flex items-center gap-2 font-medium">
                <MousePointerClick size={14} />
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
                <div className="absolute bottom-4 left-4 right-4 bg-gray-900 text-white p-4 rounded-2xl shadow-2xl border border-gray-700 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
                      <Edit2 size={12} />
                      Selected element: &lt;{selectedElement.tagName.toLowerCase()}&gt;
                    </div>
                    <button 
                      onClick={() => setSelectedElement(null)}
                      className="text-gray-400 hover:text-white text-sm font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  {selectedElement.innerText && (
                    <div className="text-xs text-gray-300 italic truncate max-w-full">
                      "{selectedElement.innerText}"
                    </div>
                  )}

                  <form onSubmit={handleModifyElement} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. 'change background to slate-800' or 'make text larger and bold'..."
                      value={editInstruction}
                      onChange={(e) => setEditInstruction(e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={modifying}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl flex items-center gap-1 cursor-pointer disabled:opacity-75"
                    >
                      {modifying ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <>
                          <Wand2 size={16} />
                          Apply
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
                className="w-1 bg-gray-300 dark:bg-gray-700 cursor-col-resize hover:bg-indigo-500 transition-colors hidden lg:block"
                onMouseDown={startDrag}
              />
            )}

            {/* Right pane: Monaco-style textarea Editor */}
            {showCode && (
              <div
                style={{ width: `${100 - panelWidth}%` }}
                className="h-full flex flex-col bg-gray-950 text-white"
              >
                <div className="px-4 py-2.5 bg-gray-900 border-b border-gray-800 flex justify-between items-center text-xs font-semibold tracking-wide text-gray-400">
                  <span>LIVE HTML EDITOR</span>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>Auto-sync Active</span>
                  </div>
                </div>

                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="flex-1 w-full p-4 font-mono text-xs bg-gray-950 text-emerald-400 focus:outline-none resize-none overflow-auto leading-relaxed border-0"
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