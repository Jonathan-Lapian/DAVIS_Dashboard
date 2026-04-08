import { useState, useEffect } from "react";
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

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const COLORS = {
    darkRed: "#c21807",
    red: "#ff3333",
    lightRed: "#ff7b7b",
    green: "#2a9d8f",
    yellow: "#e9c46a",
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
    { id: "PRJ-01", phase: "Contracts", status: "Completed", spent: "$1,200" },
    { id: "PRJ-02", phase: "Design", status: "Completed", spent: "$2,000" },
    {
      id: "PRJ-03",
      phase: "Procurement",
      status: "In Progress",
      spent: "$800",
    },
    { id: "PRJ-04", phase: "Construction", status: "At Risk", spent: "$200" },
    {
      id: "PRJ-05",
      phase: "Post Construction",
      status: "Not Started",
      spent: "$0",
    },
  ];

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
        fontSize={12}
        fontWeight="bold"
        textAnchor="middle"
        dominantBaseline="central"
      >
        {value}%
      </text>
    );
  };

  const tooltipStyle = {
    backgroundColor: "#222",
    borderColor: "#444",
    borderRadius: "6px",
  };

  if (loading) return <div className="loading-screen">Memuat Dashboard...</div>;

  return (
    <div className="project-dashboard-container">
      <div className="header-section" style={{ marginBottom: "40px" }}>
        <h1 className="main-title">Project Risk Overview</h1>
        <p className="sub-title">
          Dashboard to evaluate status of project risks including time, tasks,
          workload, progress, and cost.
        </p>
      </div>

      {/* --- BARIS 1: ATAS (Diberi Jarak Paksa 40px ke Bawah) --- */}
      <div className="dashboard-row" style={{ marginBottom: "40px" }}>
        <div className="dashboard-card">
          <h3 className="card-title">Health Status</h3>
          <div
            className="chart-wrapper"
            style={{ justifyContent: "space-evenly" }}
          >
            <div className="health-item">
              <div className="health-header">
                <span className="health-label">Time Elapsed vs Progress</span>
                <span className="health-badge badge-good">Ahead +5%</span>
              </div>
              <div className="mini-progress-bg">
                <div
                  className="mini-progress-fill"
                  style={{ width: "55%", backgroundColor: COLORS.green }}
                ></div>
              </div>
              <div className="health-value" style={{ marginTop: "4px" }}>
                Actual Progress: 55% / Planned: 50%
              </div>
            </div>

            <div className="health-item">
              <div className="health-header">
                <span className="health-label">Task Completion</span>
                <span className="health-badge badge-warn">35 / 100</span>
              </div>
              <div className="mini-progress-bg">
                <div
                  className="mini-progress-fill"
                  style={{ width: "35%", backgroundColor: COLORS.yellow }}
                ></div>
              </div>
              <div className="health-value" style={{ marginTop: "4px" }}>
                35% Tasks Completed, 4 Overdue
              </div>
            </div>

            <div className="health-item">
              <div className="health-header">
                <span className="health-label">Budget Burn Rate</span>
                <span className="health-badge badge-good">Under Budget</span>
              </div>
              <div className="mini-progress-bg">
                <div
                  className="mini-progress-fill"
                  style={{ width: "42%", backgroundColor: COLORS.green }}
                ></div>
              </div>
              <div className="health-value" style={{ marginTop: "4px" }}>
                $4.2k Spent / $10k Total Budget (42%)
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <h3 className="card-title">Tasks Distribution</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="90%">
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={taskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
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
                  itemStyle={{ color: "#fff" }}
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
                        color: "#aaa",
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

        <div className="dashboard-card">
          <h3 className="card-title">Phase Progress</h3>
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
                  tick={{ fontSize: 12, fill: "#aaa" }}
                  width={90}
                />
                <Tooltip
                  cursor={{ fill: "#2a2a2a" }}
                  contentStyle={tooltipStyle}
                  itemStyle={{ color: "#fff" }}
                  labelStyle={{ color: "#aaa" }}
                />
                <Bar
                  dataKey="value"
                  fill={COLORS.red}
                  barSize={12}
                  radius={[0, 4, 4, 0]}
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
                    style={{ fontSize: "11px", fill: "#aaa" }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* --- BARIS 2: TENGAH (Diberi Jarak Paksa 40px ke Bawah) --- */}
      <div className="dashboard-row" style={{ marginBottom: "40px" }}>
        <div className="dashboard-card">
          <h3 className="card-title">Schedule Variance</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="80%">
              <LineChart
                data={scheduleData}
                margin={{ top: 20, right: 20, left: 0, bottom: 10 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#333"
                />
                <XAxis
                  dataKey="month"
                  axisLine={{ stroke: "#444" }}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#aaa" }}
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
                  itemStyle={{ color: "#fff" }}
                  labelStyle={{ color: "#aaa" }}
                  formatter={(val) => `${val}%`}
                />
                <Line
                  type="monotone"
                  dataKey="planned"
                  name="Planned (%)"
                  stroke={COLORS.lightRed}
                  strokeWidth={3}
                  dot={{ r: 4, fill: COLORS.lightRed }}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Actual (%)"
                  stroke={COLORS.green}
                  strokeWidth={3}
                  dot={{ r: 4, fill: COLORS.green }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="custom-legend" style={{ marginTop: "5px" }}>
              <span>
                <span style={{ color: COLORS.lightRed }}>●</span> Planned
              </span>
              <span>
                <span style={{ color: COLORS.green }}>●</span> Actual
              </span>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <h3 className="card-title">Cost Analysis</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={costData}
                margin={{ top: 20, right: 10, left: 0, bottom: 10 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#333"
                />
                <XAxis
                  dataKey="name"
                  axisLine={{ stroke: "#444" }}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#aaa" }}
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
                  cursor={{ fill: "#2a2a2a" }}
                  contentStyle={tooltipStyle}
                  itemStyle={{ color: "#fff" }}
                  labelStyle={{ color: "#aaa" }}
                />
                <Bar dataKey="value" barSize={35} radius={[4, 4, 0, 0]}>
                  {costData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
                <LabelList
                  dataKey="value"
                  position="top"
                  formatter={(val) => `$${val / 1000}k`}
                  style={{ fontSize: "11px", fill: "#aaa" }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dashboard-card">
          <h3 className="card-title">Team Workload</h3>
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
                  stroke="#333"
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "#aaa" }}
                  domain={[0, 15]}
                  axisLine={{ stroke: "#444" }}
                  tickLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={{ stroke: "#444" }}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#aaa" }}
                  width={65}
                />
                <Tooltip
                  cursor={{ fill: "#2a2a2a" }}
                  contentStyle={tooltipStyle}
                  itemStyle={{ color: "#fff" }}
                  labelStyle={{ color: "#aaa" }}
                />
                <Bar
                  dataKey="completed"
                  name="Done"
                  stackId="a"
                  fill={COLORS.darkRed}
                  barSize={14}
                />
                <Bar
                  dataKey="remaining"
                  name="WIP"
                  stackId="a"
                  fill={COLORS.lightRed}
                  barSize={14}
                />
                <Bar
                  dataKey="overdue"
                  name="Overdue"
                  stackId="a"
                  fill={COLORS.red}
                  barSize={14}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
            <div className="custom-legend" style={{ marginTop: "0px" }}>
              <span>
                <span style={{ color: COLORS.darkRed }}>■</span> Done
              </span>
              <span>
                <span style={{ color: COLORS.lightRed }}>■</span> WIP
              </span>
              <span>
                <span style={{ color: COLORS.red }}>■</span> Overdue
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* --- BARIS 3: BAWAH --- */}
      <div className="dashboard-row">
        <div className="dashboard-card full-width-card">
          <h3 className="card-title">Project Phase Details</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task ID</th>
                  <th>Phase</th>
                  <th>Status</th>
                  <th>Budget Spent</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, index) => (
                  <tr key={index}>
                    <td>{row.id}</td>
                    <td>{row.phase}</td>
                    <td>{row.status}</td>
                    <td>{row.spent}</td>
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
