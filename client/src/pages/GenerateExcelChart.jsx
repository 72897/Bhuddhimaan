import React from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "@clerk/clerk-react";
import { Sparkles, BarChart3, Upload, Download } from "lucide-react";
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
} from "recharts";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const ExcelChartBot = () => {
  const { getToken } = useAuth();
  const chartRef = React.useRef(null);

  const [file, setFile] = React.useState(null);
  const [question, setQuestion] = React.useState("");
  const [chartConfig, setChartConfig] = React.useState(null);
  const [chartData, setChartData] = React.useState([]);
  const [rawData, setRawData] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  const [selectedChart, setSelectedChart] = React.useState("bar");
  const [topN, setTopN] = React.useState(15);
  const [horizontal, setHorizontal] = React.useState(false);

  // ----------------------------
  // Process Data
  // ----------------------------
  const processData = (config, raw) => {
    if (!config || !raw) return [];

    const { xAxis, yAxis } = config;

    if (!raw[0]?.hasOwnProperty(xAxis) || !raw[0]?.hasOwnProperty(yAxis)) {
      toast.error("Column mismatch from AI");
      return [];
    }

    return raw;
  };

  // ----------------------------
  // Download Chart
  // ----------------------------
  const downloadChart = async () => {
    if (!chartRef.current) return;

    const canvas = await html2canvas(chartRef.current);
    const link = document.createElement("a");
    link.download = "chart.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  // ----------------------------
  // Submit
  // ----------------------------
  const onSubmit = async (e) => {
    e.preventDefault();

    if (!file || !question.trim()) {
      toast.error("Upload file and enter question");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("question", question);

      const { data } = await axios.post(
        "/api/ai/generate-excel-chart",
        formData,
        {
          headers: {
            Authorization: `Bearer ${await getToken()}`,
          },
        }
      );

      if (data.success) {
        const updatedConfig = {
          ...data.chartConfig,
          chartType: selectedChart,
        };

        const processed = processData(updatedConfig, data.data);

        setChartConfig(updatedConfig);
        setChartData(processed);
        setRawData(data.data);

        toast.success("Chart generated!");
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error("Generation failed");
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------
  // Render Chart
  // ----------------------------
  const renderChart = () => {
    if (!chartConfig) return null;

    const { chartType, xAxis, yAxis, title } = chartConfig;

    const sortedData = [...chartData]
      .sort((a, b) => b[yAxis] - a[yAxis])
      .slice(0, topN);

    return (
      <div ref={chartRef} className="w-full h-[450px] bg-white p-4 rounded-lg">
        <h2 className="text-lg font-semibold text-center mb-4">{title}</h2>

        <ResponsiveContainer width="100%" height="100%">
          {chartType === "bar" && (
            <BarChart
              data={sortedData}
              layout={horizontal ? "vertical" : "horizontal"}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey={horizontal ? yAxis : xAxis}
                type={horizontal ? "number" : "category"}
              />
              <YAxis
                dataKey={horizontal ? xAxis : yAxis}
                type={horizontal ? "category" : "number"}
              />
              <Tooltip />
              <Legend />
              <Bar dataKey={yAxis} fill="#6366f1" />
            </BarChart>
          )}

          {chartType === "line" && (
            <LineChart data={sortedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxis} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey={yAxis} stroke="#6366f1" />
            </LineChart>
          )}

          {chartType === "area" && (
            <AreaChart data={sortedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxis} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey={yAxis}
                stroke="#6366f1"
                fill="#c7d2fe"
              />
            </AreaChart>
          )}

          {chartType === "pie" && (
            sortedData.length <= 12 ? (
              <PieChart>
                <Tooltip />
                <Legend />
                <Pie
                  data={sortedData}
                  dataKey={yAxis}
                  nameKey={xAxis}
                  outerRadius={120}
                  fill="#6366f1"
                />
              </PieChart>
            ) : (
              <BarChart data={sortedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={xAxis} />
                <YAxis />
                <Tooltip />
                <Bar dataKey={yAxis} fill="#6366f1" />
              </BarChart>
            )
          )}
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="  min-h-screen w-full p-6 flex justify-center bg-gray-100 dark:bg-gray-900 overflow-auto ">
      <div className="w-full max-w-5xl bg-white p-8 rounded-xl shadow-lg">

        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="text-indigo-600" />
          <h1 className="text-2xl font-semibold">AI Excel Chart Generator</h1>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">

          <div className="flex items-center gap-3">
            <Upload size={18} />
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setFile(e.target.files[0])}
              className="border p-2 rounded w-full"
            />
          </div>

          <div className="flex gap-3 flex-wrap">
            {["bar", "line", "area", "pie"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedChart(type)}
                className={`px-4 py-2 rounded-lg border text-sm capitalize
                  ${
                    selectedChart === type
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-gray-600"
                  }`}
              >
                {type}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Ask something like: Show countries with highest total"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full border p-3 rounded-md"
          />

          <div className="flex gap-4 flex-wrap">
            <div>
              <label className="text-sm">Top N</label>
              <input
                type="number"
                value={topN}
                onChange={(e) => setTopN(Number(e.target.value))}
                className="border p-2 rounded w-20 ml-2"
              />
            </div>

            <div>
              <label className="text-sm">
                <input
                  type="checkbox"
                  checked={horizontal}
                  onChange={() => setHorizontal(!horizontal)}
                  className="mr-2"
                />
                Horizontal Bar
              </label>
            </div>

            <button
              type="button"
              onClick={downloadChart}
              className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Download size={16} />
              Download
            </button>
          </div>

          <button
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg"
          >
            {loading ? "Analyzing..." : "Generate Chart"}
          </button>
        </form>

        {chartConfig && renderChart()}

        {/* Dataset Preview */}
        {rawData.length > 0 && (
          <div className="mt-8 overflow-auto max-h-[300px] border rounded">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-200">
                <tr>
                  {Object.keys(rawData[0]).map((col) => (
                    <th key={col} className="p-2 border">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rawData.slice(0, 20).map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((val, j) => (
                      <td key={j} className="p-2 border">
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
};

export default ExcelChartBot;