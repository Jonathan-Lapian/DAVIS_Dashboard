import { useState, useEffect, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LabelList,
} from "recharts";
import "./App.css";

// --- UTILS ---
// Fungsi untuk memformat angka besar menjadi jutaan (M) atau Miliar (B)
const formatMoney = (value) => {
  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(2)}B`;
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
};

const COLORS = {
  darkRed: "#c21807",
  red: "#ff3333",
  lightRed: "#ff7b7b",
  green: "#00f5d4",
  yellow: "#fee440",
  white: "#ffffff",
  darkGray: "#2a2a2a",
};

// ==============================================================================
// DATA DARI PDF (Quiz 3 - Solution)
// ==============================================================================

// 1. Data Impact (Asset x Vulnerability) - Hal 8
const impactData = [
  { name: "Laptops", value: 25010000, fill: COLORS.red },
  { name: "Desktops", value: 19010000, fill: COLORS.lightRed },
  { name: "Regional Servers", value: 30998000, fill: COLORS.darkRed },
  { name: "HQ Servers", value: 398000, fill: COLORS.yellow },
  { name: "Network Infrast.", value: 20000, fill: COLORS.green },
  { name: "Software", value: 10000, fill: COLORS.white },
];

// 2. Data Threat Importance (Vulnerability x Threat) - Hal 10
const threatData = [
  { name: "Hardware Failure", value: 100486000, fill: COLORS.yellow },
  { name: "Software Failure", value: 150832000, fill: COLORS.red },
  { name: "Equipment Theft", value: 144486000, fill: COLORS.darkRed },
  { name: "Denial of Service", value: 106812000, fill: COLORS.lightRed },
  { name: "Viruses/Worms", value: 150852000, fill: COLORS.red },
  { name: "Insider Attacks", value: 119476000, fill: COLORS.yellow },
  { name: "Intrusion", value: 150852000, fill: COLORS.darkRed },
];

// 3. Data Value of Control (Threat x Control) - Hal 14
const controlData = [
  { name: "Intrusion Detection", value: 967884000 },
  { name: "Anti-Virus", value: 452556000 },
  { name: "Firewall Upgrades", value: 1074696000 },
  { name: "Redundant HQ Server", value: 684884000 },
  { name: "Spare Laptops", value: 489944000 },
  { name: "Warranties", value: 753954000 },
  { name: "Insurance", value: 2017434000 },
  { name: "Physical Controls", value: 433458000 },
  { name: "Security Policy", value: 923796000 },
].sort((a, b) => b.value - a.value); // Urutkan dari nilai tertinggi

// ==============================================================================
// KOMPONEN 1: HALAMAN LOGIN
// ==============================================================================
function LoginScreen({ onLogin }) {
  return (
    <div className="login-container animate-fade-in">
      <div className="login-card glow-effect">
        <div className="login-header">
          <div
            className="status-dot pulse-red"
            style={{
              margin: "0 auto 15px auto",
              width: "15px",
              height: "15px",
            }}
          ></div>
          <h2>NY STATE RISK SYSTEM</h2>
          <p>Authorized Risk Managers Only</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onLogin();
          }}
          className="login-form"
        >
          <div className="input-group">
            <label>Analyst ID</label>
            <input type="text" placeholder="IT-DIR-01" required />
          </div>
          <div className="input-group">
            <label>Passcode</label>
            <input type="password" placeholder="••••••••" required />
          </div>
          <button type="submit" className="login-btn">
            ACCESS DASHBOARD
          </button>
        </form>
      </div>
    </div>
  );
}

// ==============================================================================
// KOMPONEN 2: DASHBOARD OVERVIEW (Ringkasan Eksekutif)
// ==============================================================================
function DashboardOverview() {
  const riskInsights = [
    {
      id: 1,
      type: "danger",
      title: "TOP THREAT: INTRUSION & VIRUSES",
      message:
        "Intrusion and Viruses/Worms hold the highest threat importance at $150.8M each. Immediate mitigation required.",
    },
    {
      id: 2,
      type: "warning",
      title: "CRITICAL VULNERABILITY",
      message:
        "Regional Servers have the highest impact aggregate ($30.9M) compared to other assets. Prioritize server defenses.",
    },
    {
      id: 3,
      type: "good",
      title: "CONTROL RECOMMENDATION",
      message:
        "Insurance provides the highest aggregate control value ($2.01B), followed by Firewall Upgrades ($1.07B).",
    },
  ];

  return (
    <div className="dashboard-content animate-fade-in">
      <div className="header-section">
        <h1 className="main-title">EXECUTIVE OVERVIEW</h1>
        <p className="sub-title">
          High-level summary of organizational vulnerabilities, top threats, and
          recommended controls.
        </p>
      </div>

      <div className="dashboard-grid">
        {/* KARTU 1: TOP THREATS PIE CHART */}
        <div className="dashboard-card glow-effect">
          <div className="card-header">
            <h3 className="card-title">Threat Exposure Distribution</h3>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={threatData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  stroke="none"
                >
                  {threatData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(value) => formatMoney(value)}
                  contentStyle={{
                    backgroundColor: "rgba(10,15,20,0.9)",
                    border: "1px solid #333",
                    color: "#fff",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* KARTU 2: TOP CONTROLS BAR CHART */}
        <div className="dashboard-card glow-effect">
          <div className="card-header">
            <h3 className="card-title">Top 5 Controls by Value</h3>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={controlData.slice(0, 5)}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 20, bottom: 0 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#ccc" }}
                  width={110}
                />
                <RechartsTooltip
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  formatter={(value) => formatMoney(value)}
                  contentStyle={{
                    backgroundColor: "rgba(10,15,20,0.9)",
                    border: "none",
                    color: "#fff",
                  }}
                />
                <Bar
                  dataKey="value"
                  fill={COLORS.red}
                  barSize={12}
                  radius={[0, 4, 4, 0]}
                >
                  <LabelList
                    dataKey="value"
                    position="right"
                    formatter={(val) => formatMoney(val)}
                    style={{ fill: "#aaa", fontSize: 10 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* KARTU 3: SYSTEM INSIGHTS */}
        <div className="dashboard-card full-width-card glow-effect">
          <div className="card-header">
            <h3 className="card-title">Automated Analysis Insights</h3>
            <div className="status-dot pulse-red"></div>
          </div>
          <div className="insights-container">
            {riskInsights.map((insight) => (
              <div key={insight.id} className={`insight-item ${insight.type}`}>
                <div className="insight-indicator"></div>
                <div className="insight-content">
                  <span className="insight-title">[{insight.title}]</span>
                  <p className="insight-message">{insight.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==============================================================================
// KOMPONEN 3: MATRIX PAGES
// ==============================================================================

function MatrixAssetVulnerability() {
  return (
    <div className="dashboard-content animate-fade-in">
      <div className="header-section">
        <h1 className="main-title">MATRIX 1: ASSET / VULNERABILITY</h1>
        <p className="sub-title">
          Calculates the impact aggregate (Σ asset value × vulnerability level).
        </p>
      </div>
      <div
        className="dashboard-card full-width-card glow-effect"
        style={{ marginBottom: "30px" }}
      >
        <div className="card-header">
          <h3 className="card-title">Impact Aggregates per Asset</h3>
        </div>
        <div style={{ height: "300px", width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={impactData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="rgba(255,255,255,0.1)"
              />
              <XAxis
                dataKey="name"
                tick={{ fill: "#ccc", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatMoney}
                tick={{ fill: "#888", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <RechartsTooltip
                cursor={{ fill: "rgba(255,255,255,0.05)" }}
                formatter={(val) => formatMoney(val)}
                contentStyle={{ backgroundColor: "#111", borderColor: "#333" }}
              />
              <Bar dataKey="value" fill={COLORS.red} radius={[4, 4, 0, 0]}>
                {impactData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function MatrixVulnerabilityThreat() {
  return (
    <div className="dashboard-content animate-fade-in">
      <div className="header-section">
        <h1 className="main-title">MATRIX 2: VULNERABILITY / THREAT</h1>
        <p className="sub-title">
          Calculates the Threat Importance (Σ impact value × threat value).
        </p>
      </div>
      <div className="dashboard-card full-width-card glow-effect">
        <div className="card-header">
          <h3 className="card-title">Threat Importance Values</h3>
        </div>
        <div style={{ height: "350px", width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={threatData}
              layout="vertical"
              margin={{ top: 20, right: 40, left: 40, bottom: 20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="rgba(255,255,255,0.1)"
              />
              <XAxis
                type="number"
                tickFormatter={formatMoney}
                tick={{ fill: "#888", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fill: "#ccc", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={120}
              />
              <RechartsTooltip
                cursor={{ fill: "rgba(255,255,255,0.05)" }}
                formatter={(val) => formatMoney(val)}
                contentStyle={{ backgroundColor: "#111", borderColor: "#333" }}
              />
              <Bar dataKey="value" fill={COLORS.darkRed} radius={[0, 4, 4, 0]}>
                {threatData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
                <LabelList
                  dataKey="value"
                  position="right"
                  formatter={(val) => formatMoney(val)}
                  style={{ fill: "#fff", fontSize: 11, fontWeight: "bold" }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function MatrixThreatControl() {
  return (
    <div className="dashboard-content animate-fade-in">
      <div className="header-section">
        <h1 className="main-title">MATRIX 3: THREAT / CONTROL</h1>
        <p className="sub-title">
          Calculates the Aggregate Value of Control (Σ threat importance ×
          impact of controls).
        </p>
      </div>
      <div className="dashboard-card full-width-card glow-effect">
        <div className="card-header">
          <h3 className="card-title">Value of Evaluated Controls</h3>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Security Control</th>
                <th>Aggregate Value ($)</th>
                <th>Recommendation Status</th>
              </tr>
            </thead>
            <tbody>
              {controlData.map((row, index) => (
                <tr key={index}>
                  <td style={{ fontWeight: "bold", color: "#fff" }}>
                    {row.name}
                  </td>
                  <td style={{ color: COLORS.lightRed, fontWeight: "bold" }}>
                    {formatMoney(row.value)}
                  </td>
                  <td>
                    {row.value > 1000000000 ? (
                      <span className="status-pill good">
                        Highly Recommended
                      </span>
                    ) : row.value > 600000000 ? (
                      <span className="status-pill warning">Recommended</span>
                    ) : (
                      <span className="status-pill neutral">
                        Optional / Secondary
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==============================================================================
// KOMPONEN UTAMA: APP (Sistem Routing)
// ==============================================================================
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const containerRef = useRef(null);

  const handleMouseMove = (e) => {
    if (containerRef.current) {
      containerRef.current.style.setProperty("--mouse-x", `${e.clientX}px`);
      containerRef.current.style.setProperty("--mouse-y", `${e.clientY}px`);
    }
  };

  if (!isLoggedIn) {
    return (
      <div
        className="app-root"
        ref={containerRef}
        onMouseMove={handleMouseMove}
      >
        <div className="cursor-tracker">
          <div className="cursor-distortion"></div>
          <div className="cursor-red-core"></div>
        </div>
        <LoginScreen onLogin={() => setIsLoggedIn(true)} />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <DashboardOverview />;
      case "matrix-1":
        return <MatrixAssetVulnerability />;
      case "matrix-2":
        return <MatrixVulnerabilityThreat />;
      case "matrix-3":
        return <MatrixThreatControl />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="app-root" ref={containerRef} onMouseMove={handleMouseMove}>
      <div className="cursor-tracker">
        <div className="cursor-distortion"></div>
        <div className="cursor-red-core"></div>
      </div>
      <div className="main-layout relative-z">
        {/* SIDEBAR */}
        <aside className="sidebar glow-effect">
          <div className="sidebar-logo">
            <h2>
              NYS<span>RISK</span>
            </h2>
            <div className="status-dot pulse-red"></div>
          </div>

          <nav className="sidebar-nav">
            <span className="nav-section-title">DASHBOARDS</span>
            <button
              className={`nav-item ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              Executive Overview
            </button>

            <span className="nav-section-title" style={{ marginTop: "20px" }}>
              RISK ANALYSIS MATRICES
            </span>
            <button
              className={`nav-item sub-nav ${activeTab === "matrix-1" ? "active" : ""}`}
              onClick={() => setActiveTab("matrix-1")}
            >
              1. Asset vs Vulnerability
            </button>
            <button
              className={`nav-item sub-nav ${activeTab === "matrix-2" ? "active" : ""}`}
              onClick={() => setActiveTab("matrix-2")}
            >
              2. Vulnerability vs Threat
            </button>
            <button
              className={`nav-item sub-nav ${activeTab === "matrix-3" ? "active" : ""}`}
              onClick={() => setActiveTab("matrix-3")}
            >
              3. Threat vs Control
            </button>
          </nav>

          <div className="sidebar-footer">
            <div className="user-info">
              <span className="user-name">IT-DIR-01</span>
              <span className="user-role">IT Director</span>
            </div>
            <button className="logout-btn" onClick={() => setIsLoggedIn(false)}>
              LOGOUT
            </button>
          </div>
        </aside>

        {/* KONTEN UTAMA */}
        <main className="content-area">{renderContent()}</main>
      </div>
    </div>
  );
}

export default App;
