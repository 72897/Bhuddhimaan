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
      <div ref={chartRef} className="w-full h-full bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow flex flex-col justify-between">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
            <span className="text-xs text-gray-400 font-medium">Top {topN} records • {selectedChartType.toUpperCase()} Chart</span>
          </div>
          <button
            onClick={downloadChart}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download size={14} />
            Download
          </button>
        </div>

        <div className="flex-1 w-full min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            {selectedChartType === "bar" && (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey={xAxis} tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey={yAxis} fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            )}

            {selectedChartType === "line" && (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey={xAxis} tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey={yAxis} stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            )}

            {selectedChartType === "area" && (
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey={xAxis} tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey={yAxis} stroke="#4f46e5" fill="#e0e7ff" />
              </AreaChart>
            )}

            {selectedChartType === "pie" && (
              <PieChart>
                <Tooltip />
                <Legend />
                <Pie
                  data={data}
                  dataKey={yAxis}
                  nameKey={xAxis}
                  outerRadius={100}
                  fill="#4f46e5"
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8 flex justify-center text-slate-700">
      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left/Middle Column: File Details & Live Chart */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Top Panel: File Upload & Metadata */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-indigo-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Conversational Data Analyst</h1>
                <p className="text-xs text-gray-500">Upload CSV or XLSX sheets and ask questions in plain English.</p>
              </div>
            </div>

            <label className="cursor-pointer">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900/30 hover:border-indigo-500 text-sm font-semibold text-gray-600 dark:text-gray-400 text-center">
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
            <div className="flex-1 min-h-[400px] bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl flex flex-col items-center justify-center text-center p-8">
              <BarChart3 className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">No active analysis</h3>
              <p className="text-sm text-gray-400 max-w-sm">
                Upload your spreadsheet on the top right, then type a question in the chat panel to build interactive data visualizations.
              </p>
            </div>
          )}

          {/* Dataset Preview */}
          {rawData.length > 0 && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl flex flex-col gap-3">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Table size={16} className="text-indigo-600" /> Data Sheet Preview (Top 10 rows)
              </h4>
              <div className="overflow-auto max-h-[220px] rounded-xl border dark:border-gray-700">
                <table className="min-w-full text-xs text-left">
                  <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400">
                    <tr>
                      {columns.map((col) => (
                        <th key={col} className="p-2.5 border-b dark:border-gray-700 font-bold uppercase tracking-wider">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-transparent divide-y divide-gray-100 dark:divide-gray-700 text-gray-800 dark:text-gray-300">
                    {rawData.slice(0, 10).map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-900/10">
                        {columns.map((col) => (
                          <td key={col} className="p-2 border-b dark:border-gray-700 truncate max-w-[150px]">
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
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl flex flex-col h-[700px] overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            <span className="font-bold text-gray-900 dark:text-white">Analyst Assistant</span>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {chats.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center text-xs text-gray-400 p-4">
                Ask questions like:
                <br />
                "Show total sales by category"
                <br />
                "What is the average rating per item?"
              </div>
            ) : (
              chats.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col gap-1 max-w-[85%] ${
                    msg.sender === "user" ? "self-end items-end" : "self-start items-start"
                  }`}
                >
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                    {msg.sender === "user" ? "You" : "Analyst"}
                  </span>
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl text-sm ${
                      msg.sender === "user"
                        ? "bg-indigo-600 text-white rounded-tr-none"
                        : "bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-300 rounded-tl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                  
                  {/* Quick-switch chart options for bot responses */}
                  {msg.config && (
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      {["bar", "line", "area", "pie"].map((type) => (
                        <button
                          key={type}
                          onClick={() => {
                            setCurrentChartConfig(msg.config);
                            setSelectedChartType(type);
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] border dark:border-gray-700 capitalize ${
                            selectedChartType === type
                              ? "bg-indigo-600 text-white"
                              : "bg-transparent text-gray-400"
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
          <form onSubmit={handleSendMessage} className="p-4 border-t dark:border-gray-700 flex gap-2">
            <input
              type="text"
              disabled={loading}
              placeholder="Ask a question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900 dark:text-white disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading}
              className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow cursor-pointer transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send size={18} />}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default ExcelChartBot;