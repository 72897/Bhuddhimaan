import React, { useState, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "@clerk/clerk-react";
import { Sparkles, BarChart3, Upload, Download, Table, MessageSquare, Send, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const ExcelChartBot = () => {
  const { getToken } = useAuth();
  const chartRef = useRef(null);

  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Data State
  const [columns, setColumns] = useState([]);
  const [sampleData, setSampleData] = useState([]);
  const [rawData, setRawData] = useState([]);
  
  // Chat & Chart Configuration
  const [chats, setChats] = useState([]);
  const [currentChartConfig, setCurrentChartConfig] = useState(null);
  const [topN, setTopN] = useState(10);
  const [selectedChartType, setSelectedChartType] = useState("bar");

  const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#3b82f6"];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Reset states
      setColumns([]);
      setSampleData([]);
      setRawData([]);
      setChats([]);
      setCurrentChartConfig(null);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    if (!file && rawData.length === 0) {
      return toast.error("Please upload an Excel or CSV file first!");
    }

    const userMsg = question;
    setQuestion("");
    setLoading(true);

    // Append user message
    const newChats = [...chats, { sender: "user", text: userMsg }];
    setChats(newChats);

    try {
      const token = await getToken();
      let responseData;

      if (rawData.length === 0) {
        // First upload & query
        const formData = new FormData();
        formData.append("file", file);
        formData.append("question", userMsg);

        const { data } = await axios.post("/api/ai/generate-excel-chart", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        responseData = data;
      } else {
        // Conversational query using stored context
        const { data } = await axios.post(
          "/api/ai/generate-excel-chart",
          {
            question: userMsg,
            columns: columns,
            sample: sampleData,
            data: rawData,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        responseData = data;
      }

      if (responseData.success) {
        const config = responseData.chartConfig;
        
        // Save database metadata
        if (responseData.columns) setColumns(responseData.columns);
        if (responseData.sample) setSampleData(responseData.sample);
        if (responseData.data) setRawData(responseData.data);
        
        setCurrentChartConfig(config);
        setSelectedChartType(config.chartType || "bar");
        
        // Append bot response
        setChats([
          ...newChats,
          {
            sender: "bot",
            text: config.insight || `Here is the analysis for "${config.title}".`,
            config: config,
          },
        ]);
        toast.success("Analysis complete!");
      } else {
        toast.error(responseData.error || "Analysis failed");
        setChats([...newChats, { sender: "bot", text: "Sorry, I couldn't analyze that query. Please try phrasing it differently." }]);
      }
    } catch (error) {
      console.error(error);
      toast.error("Network or parsing error occurred.");
      setChats([...newChats, { sender: "bot", text: "Something went wrong. Please check your database connection or API key configurations." }]);
    } finally {
      setLoading(false);
    }
  };

  const downloadChart = async () => {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current);
    const link = document.createElement("a");
    link.download = "chart.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  // Process data for rendering chart
  const getProcessedData = () => {
    if (!currentChartConfig || rawData.length === 0) return [];
    const { xAxis, yAxis, aggregation } = currentChartConfig;
    
    // Safety check
    if (!rawData[0]?.hasOwnProperty(xAxis) || !rawData[0]?.hasOwnProperty(yAxis)) {
      return [];
    }

    // Grouping & Aggregation
    const groups = {};
    rawData.forEach((row) => {
      const xVal = row[xAxis];
      const yVal = Number(row[yAxis]) || 0;
      if (!groups[xVal]) {
        groups[xVal] = { count: 0, sum: 0 };
      }
      groups[xVal].sum += yVal;
      groups[xVal].count += 1;
    });

    const result = Object.keys(groups).map((key) => {
      let val = groups[key].sum;
      if (aggregation === "avg") {
        val = groups[key].sum / groups[key].count;
      } else if (aggregation === "count") {
        val = groups[key].count;
      }
      return {
        [xAxis]: key,
        [yAxis]: Number(val.toFixed(2)),
      };
    });

    return result.sort((a, b) => b[yAxis] - a[yAxis]).slice(0, topN);
  };

  const renderActiveChart = () => {
    const data = getProcessedData();
    if (data.length === 0 || !currentChartConfig) return null;
    const { xAxis, yAxis, title } = currentChartConfig;

    return (
      <div ref={chartRef} className="w-full h-full bg-slate-900 p-6 rounded-xl border border-slate-700 shadow flex flex-col justify-between text-slate-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-base font-bold text-white">{title}</h2>
            <span className="text-[10px] text-slate-400 font-medium">Top {topN} records • {selectedChartType.toUpperCase()} Chart</span>
          </div>
          <button
            onClick={downloadChart}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Download size={12} />
            <span>Download</span>
          </button>
        </div>

        <div className="flex-1 w-full min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            {selectedChartType === "bar" && (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey={xAxis} tick={{ fontSize: 9, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }} />
                <Legend />
                <Bar dataKey={yAxis} fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}

            {selectedChartType === "line" && (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey={xAxis} tick={{ fontSize: 9, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }} />
                <Legend />
                <Line type="monotone" dataKey={yAxis} stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            )}

            {selectedChartType === "area" && (
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey={xAxis} tick={{ fontSize: 9, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }} />
                <Legend />
                <Area type="monotone" dataKey={yAxis} stroke="#3b82f6" fill="#1e3a8a" fillOpacity={0.4} />
              </AreaChart>
            )}

            {selectedChartType === "pie" && (
              <PieChart>
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }} />
                <Legend />
                <Pie
                  data={data}
                  dataKey={yAxis}
                  nameKey={xAxis}
                  outerRadius={80}
                  fill="#3b82f6"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full w-full overflow-y-auto flex flex-col justify-start p-6 text-slate-700 bg-gray-100 dark:bg-gray-900 scroll-hidden">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto w-full mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-500" />
          Conversational Data Analyst
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-xs">
          Upload spreadsheets (CSV/XLSX) and ask visual analysis queries in natural language.
        </p>
      </div>

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6 items-start pb-8">
        
        {/* Left/Middle Column: File Details & Live Chart */}
        <div className="lg:col-span-2 flex flex-col gap-6 w-full">
          
          {/* Top Panel: File Upload & Metadata */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-700">
            <div className="flex items-center gap-3">
              <Table className="w-6 h-6 text-blue-500" />
              <div>
                <h2 className="text-sm font-bold text-gray-800">Spreadsheet Loader</h2>
                <p className="text-[11px] text-gray-500">Selected sheet context stays stored in your local memory.</p>
              </div>
            </div>

            <label className="cursor-pointer">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:border-blue-500 text-xs font-semibold text-gray-600 text-center">
                {file ? `📎 ${file.name}` : "Upload Spreadsheet"}
              </div>
            </label>
          </div>

          {/* Chart Display Area */}
          {currentChartConfig ? (
            <div className="flex-1 min-h-[400px] flex flex-col">
              {renderActiveChart()}
            </div>
          ) : (
            <div className="flex-1 min-h-[400px] bg-slate-900 rounded-xl border border-slate-700 shadow flex flex-col items-center justify-center text-center p-8 text-slate-100">
              <BarChart3 className="w-12 h-12 text-slate-655 mb-3" />
              <h3 className="text-sm font-bold text-white mb-1">No active visualization</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Upload your spreadsheet above, then submit queries inside the Analyst Assistant panel to generate interactive charts.
              </p>
            </div>
          )}

          {/* Dataset Preview */}
          {rawData.length > 0 && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3 text-slate-700">
              <h4 className="text-xs font-bold text-gray-800 flex items-center gap-2">
                <Table size={14} className="text-blue-500" /> Data Sheet Preview (Top 10 rows)
              </h4>
              <div className="overflow-auto max-h-[220px] rounded-lg border border-gray-200">
                <table className="min-w-full text-[10px] text-left">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      {columns.map((col) => (
                        <th key={col} className="p-2 border-b border-gray-200 font-bold uppercase tracking-wider">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-transparent divide-y divide-gray-150 text-gray-800">
                    {rawData.slice(0, 10).map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        {columns.map((col) => (
                          <td key={col} className="p-2 border-b border-gray-200 truncate max-w-[150px]">
                            {row[col]?.toString() || ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Conversational Chat Panel */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-700 rounded-xl shadow flex flex-col h-[600px] overflow-hidden text-slate-100">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-400" />
            <span className="font-bold text-sm text-white">Analyst Assistant</span>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 scrollbar-hide">
            {chats.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-[10px] text-slate-400 gap-1.5 p-4">
                <MessageSquare className="w-8 h-8 text-slate-650" />
                <p>Submit analytical questions like:</p>
                <p className="italic bg-slate-950/40 p-2 rounded border border-slate-800 font-mono w-full">
                  "Show total sales by category as a bar chart"
                </p>
              </div>
            ) : (
              chats.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col gap-1 max-w-[85%] ${
                    msg.sender === "user" ? "self-end items-end" : "self-start items-start"
                  }`}
                >
                  <span className="text-[9px] text-slate-500 uppercase font-semibold">
                    {msg.sender === "user" ? "You" : "Analyst"}
                  </span>
                  <div
                    className={`px-3 py-2 rounded-xl text-xs ${
                      msg.sender === "user"
                        ? "bg-blue-650 text-white rounded-tr-none"
                        : "bg-slate-800 border border-slate-750 text-slate-200 rounded-tl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                  
                  {/* Quick-switch chart options for bot responses */}
                  {msg.config && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {["bar", "line", "area", "pie"].map((type) => (
                        <button
                          key={type}
                          onClick={() => {
                            setCurrentChartConfig(msg.config);
                            setSelectedChartType(type);
                          }}
                          className={`px-2 py-0.5 rounded text-[9px] border border-slate-800 capitalize cursor-pointer transition ${
                            selectedChartType === type
                              ? "bg-blue-600 text-white border-blue-500"
                              : "bg-transparent text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Chat Inputs */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              disabled={loading}
              placeholder={rawData.length === 0 ? "Upload sheet first..." : "Ask a question..."}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="flex-1 px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs focus:outline-none focus:border-blue-500 text-white disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading}
              className="p-2.5 bg-blue-650 hover:bg-blue-600 text-white rounded-lg shadow cursor-pointer transition disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send size={14} />}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default ExcelChartBot;