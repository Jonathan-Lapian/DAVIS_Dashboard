import { useState, useEffect, useRef } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LabelList,
} from "recharts";
import "./App.css";

function App() {
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);

  // Simulasi loading screen
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  // Menangkap posisi mouse untuk menggerakkan kursor custom
  const handleMouseMove = (e) => {
    if (containerRef.current) {
      containerRef.current.style.setProperty("--mouse-x", `${e.clientX}px`);
      containerRef.current.style.setProperty("--mouse-y", `${e.clientY}px`);
    }
  };

  // --- DATA DASHBOARD ---
  const COLORS = {
    darkRed: "#c21807",
    red: "#ff3333",
    lightRed: "#ff7b7b",
    green: "#00f5d4",
    yellow: "#fee440",
    white: "#ffffff",
  };

  const taskData = [
    { name: "Complete", value: 35, color: COLORS.darkRed },
    { name: "In Progress", value: 20, color: COLORS.lightRed },
    { name: "Not Started", value: 45, color: COLORS.red },
  ];

  const workloadData = [
    { name: "Mike", completed: 8, remaining: 5, overdue: 1 },
    { name: "Jennifer", completed: 10, remaining: 3, overdue: 0 },
    { name: "Brandon", completed: 5, remaining: 6, overdue: 2 },
    { name: "Sam", completed: 7, remaining: 4, overdue: 1 },
    { name: "George", completed: 5, remaining: 2, overdue: 0 },
  ];

  const progressData = [
    { name: "Contracts", value: 100 },
    { name: "Design", value: 85 },
    { name: "Procurement", value: 40 },
    { name: "Construction", value: 10 },
    { name: "Post const...", value: 0 },
  ];

  const scheduleData = [
    { month: "Jan", planned: 10, actual: 10 },
    { month: "Feb", planned: 20, actual: 22 },
    { month: "Mar", planned: 35, actual: 38 },
    { month: "Apr", planned: 50, actual: 55 },
  ];

  const costData = [
    { name: "Actual", value: 4200, color: COLORS.darkRed },
    { name: "Planned", value: 4500, color: COLORS.red },
    { name: "Budget", value: 10000, color: COLORS.lightRed },
  ];

  const tableData = [
    {
      id: "PRJ-01",
      phase: "Contracts",
      status: "Completed",
      spent: "$1,200",
      health: "Good",
    },
    {
      id: "PRJ-02",
      phase: "Design",
      status: "Completed",
      spent: "$2,000",
      health: "Good",
    },
    {
      id: "PRJ-03",
      phase: "Procurement",
      status: "In Progress",
      spent: "$800",
      health: "Warning",
    },
    {
      id: "PRJ-04",
      phase: "Construction",
      status: "At Risk",
      spent: "$200",
      health: "Danger",
    },
    {
      id: "PRJ-05",
      phase: "Post Const...",
      status: "Not Started",
      spent: "$0",
      health: "Neutral",
    },
  ];

  // Kustomisasi Label Pie Chart
  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    value,
  }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text
        x={x}
        y={y}
        fill="white"
        fontSize={13}
        fontWeight="bold"
        textAnchor="middle"
        dominantBaseline="central"
      >
        {value}%
      </text>
    );
  };

  const tooltipStyle = {
    backgroundColor: "rgba(10, 15, 20, 0.85)",
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: "10px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.8)",
    backdropFilter: "blur(10px)",
    color: "#ffffff",
    padding: "12px",
  };

  if (loading)
    return (
      <div className="loading-screen">
        <div className="loader-pulse"></div>
        <p>Menginisialisasi Sistem Holografik...</p>
      </div>
    );

  return (
    <div
      className="project-dashboard-container animate-fade-in"
      ref={containerRef}
      onMouseMove={handleMouseMove}
    >
      {/* --- EFEK KURSOR KACA CAIR (MURNI CSS) --- */}
      <div className="cursor-tracker">
        {/* Elemen ini mendistorsi background (seperti kaca yang mengaduk) */}
        <div className="cursor-distortion"></div>
        {/* Elemen ini memberikan warna merah pekat yang menyala (tanpa warna hijau) */}
        <div className="cursor-red-core"></div>
      </div>

      <div className="header-section relative-z">
        <h1 className="main-title">PROJECT RISK COMMAND CENTER</h1>
        <p className="sub-title">
          Live monitoring dashboard for project risks, workload distribution,
          and financial health.
        </p>
      </div>

      {/* --- KONTEN DASHBOARD UTAMA --- */}
      <div className="dashboard-grid relative-z">
        {/* KARTU 1: HEALTH STATUS */}
        <div className="dashboard-card glow-effect">
          <div className="card-header">
            <h3 className="card-title">Health Status</h3>
            <div className="status-dot pulse-red"></div>
          </div>
          <div
            className="chart-wrapper"
            style={{ justifyContent: "space-evenly" }}
          >
            <div className="health-item interactive-health">
              <div className="health-header">
                <span className="health-label">Time vs Progress</span>
                <span className="health-badge badge-good">Ahead +5%</span>
              </div>
              <div className="mini-progress-bg">
                <div
                  className="mini-progress-fill"
                  style={{ width: "55%", backgroundColor: COLORS.red }}
                ></div>
              </div>
            </div>
            <div className="health-item interactive-health">
              <div className="health-header">
                <span className="health-label">Task Completion</span>
                <span className="health-badge badge-warn">35 / 100</span>
              </div>
              <div className="mini-progress-bg">
                <div
                  className="mini-progress-fill"
                  style={{ width: "35%", backgroundColor: COLORS.lightRed }}
                ></div>
              </div>
            </div>
            <div className="health-item interactive-health">
              <div className="health-header">
                <span className="health-label">Budget Burn Rate</span>
                <span className="health-badge badge-good">Under Budget</span>
              </div>
              <div className="mini-progress-bg">
                <div
                  className="mini-progress-fill"
                  style={{ width: "42%", backgroundColor: COLORS.darkRed }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* KARTU 2: TASKS DISTRIBUTION */}
        <div className="dashboard-card glow-effect">
          <div className="card-header">
            <h3 className="card-title">Tasks Distribution</h3>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="90%">
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={taskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  stroke="none"
                  labelLine={false}
                  label={renderCustomizedLabel}
                >
                  {taskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  itemStyle={{ color: "#fff", fontWeight: "bold" }}
                  labelStyle={{ color: "#aaa" }}
                />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  iconType="circle"
                  iconSize={10}
                  formatter={(value) => (
                    <span
                      style={{
                        color: "#eee",
                        fontSize: "12px",
                        marginRight: "5px",
                      }}
                    >
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* KARTU 3: PHASE PROGRESS */}
        <div className="dashboard-card glow-effect">
          <div className="card-header">
            <h3 className="card-title">Phase Progress</h3>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={progressData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
              >
                <XAxis type="number" hide domain={[0, 100]} />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#ccc" }}
                  width={90}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.1)" }}
                  contentStyle={tooltipStyle}
                  itemStyle={{ color: "#fff", fontWeight: "bold" }}
                  labelStyle={{ color: "#aaa" }}
                />
                <Bar
                  dataKey="value"
                  fill={COLORS.red}
                  barSize={14}
                  radius={[0, 6, 6, 0]}
                >
                  {progressData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.value === 100 ? COLORS.darkRed : COLORS.red}
                    />
                  ))}
                  <LabelList
                    dataKey="value"
                    position="right"
                    formatter={(val) => `${val}%`}
                    style={{
                      fontSize: "12px",
                      fill: "#eee",
                      fontWeight: "bold",
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* KARTU 4: SCHEDULE VARIANCE */}
        <div className="dashboard-card glow-effect">
          <div className="card-header">
            <h3 className="card-title">Schedule Variance</h3>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="80%">
              <LineChart
                data={scheduleData}
                margin={{ top: 20, right: 20, left: 0, bottom: 10 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgba(255,255,255,0.1)"
                />
                <XAxis
                  dataKey="month"
                  axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#ccc" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#888" }}
                  width={35}
                  domain={[0, "dataMax + 10"]}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  itemStyle={{ color: "#fff", fontWeight: "bold" }}
                  labelStyle={{ color: "#aaa" }}
                  formatter={(val) => `${val}%`}
                />
                <Line
                  type="monotone"
                  dataKey="planned"
                  name="Planned"
                  stroke={COLORS.lightRed}
                  strokeWidth={3}
                  activeDot={{
                    r: 8,
                    fill: "#fff",
                    filter: "drop-shadow(0 0 8px #ff7b7b)",
                  }}
                  dot={{
                    r: 5,
                    fill: COLORS.lightRed,
                    stroke: "#111",
                    strokeWidth: 2,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Actual"
                  stroke={COLORS.darkRed}
                  strokeWidth={3}
                  activeDot={{
                    r: 8,
                    fill: "#fff",
                    filter: "drop-shadow(0 0 8px #c21807)",
                  }}
                  dot={{
                    r: 5,
                    fill: COLORS.darkRed,
                    stroke: "#111",
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* KARTU 5: COST ANALYSIS */}
        <div className="dashboard-card glow-effect">
          <div className="card-header">
            <h3 className="card-title">Cost Analysis</h3>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={costData}
                margin={{ top: 20, right: 10, left: 0, bottom: 10 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgba(255,255,255,0.1)"
                />
                <XAxis
                  dataKey="name"
                  axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#ccc" }}
                />
                <YAxis
                  tickFormatter={(val) => `$${val / 1000}k`}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#888" }}
                  width={45}
                />
                <Tooltip
                  formatter={(val) => `$${val.toLocaleString()}`}
                  cursor={{ fill: "rgba(255,255,255,0.08)" }}
                  contentStyle={tooltipStyle}
                  itemStyle={{ color: "#fff", fontWeight: "bold" }}
                />
                <Bar dataKey="value" barSize={35} radius={[6, 6, 0, 0]}>
                  {costData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
                <LabelList
                  dataKey="value"
                  position="top"
                  formatter={(val) => `$${val / 1000}k`}
                  style={{ fontSize: "12px", fill: "#eee", fontWeight: "bold" }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* KARTU 6: TEAM WORKLOAD */}
        <div className="dashboard-card glow-effect">
          <div className="card-header">
            <h3 className="card-title">Team Workload</h3>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="85%">
              <BarChart
                data={workloadData}
                layout="vertical"
                stackOffset="none"
                margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="rgba(255,255,255,0.1)"
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "#888" }}
                  domain={[0, 15]}
                  axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
                  tickLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#ccc" }}
                  width={65}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.08)" }}
                  contentStyle={tooltipStyle}
                  itemStyle={{ color: "#fff", fontWeight: "bold" }}
                />
                <Bar
                  dataKey="completed"
                  name="Done"
                  stackId="a"
                  fill={COLORS.darkRed}
                  barSize={16}
                />
                <Bar
                  dataKey="remaining"
                  name="WIP"
                  stackId="a"
                  fill={COLORS.lightRed}
                  barSize={16}
                />
                <Bar
                  dataKey="overdue"
                  name="Overdue"
                  stackId="a"
                  fill={COLORS.red}
                  barSize={16}
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* KARTU 7: TABEL DETAILS */}
        <div className="dashboard-card full-width-card glow-effect">
          <div className="card-header">
            <h3 className="card-title">Project Phase Details</h3>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task ID</th>
                  <th>Phase</th>
                  <th>Status</th>
                  <th>Budget Spent</th>
                  <th>System Health</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, index) => (
                  <tr key={index}>
                    <td style={{ fontWeight: "bold", color: "#fff" }}>
                      {row.id}
                    </td>
                    <td>{row.phase}</td>
                    <td>{row.status}</td>
                    <td style={{ color: COLORS.lightRed, fontWeight: "bold" }}>
                      {row.spent}
                    </td>
                    <td>
                      <span
                        className={`status-pill ${row.health.toLowerCase()}`}
                      >
                        {row.health}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
