import { useState, useEffect, useRef } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList,
  Legend,
} from "recharts";
import "./App.css";

// ==============================================================================
// UTILS & STATIC DATA (DARI PDF TUGAS & HALUSINASI DASHBOARD)
// ==============================================================================
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
  neonBlue: "#00f3ff",
};

// Data Matrix 1: Asset / Vuln
const impactData = [
  { name: "Laptops", value: 25010000, fill: COLORS.red },
  { name: "Desktops", value: 19010000, fill: COLORS.lightRed },
  { name: "Reg. Servers", value: 30998000, fill: COLORS.darkRed },
  { name: "HQ Servers", value: 398000, fill: COLORS.yellow },
  { name: "Network Infra.", value: 20000, fill: COLORS.green },
  { name: "Software", value: 10000, fill: COLORS.white },
];

// Data Matrix 2: Vuln / Threat
const threatData = [
  { name: "Hardware Fail", value: 100486000, fill: COLORS.yellow },
  { name: "Software Fail", value: 150832000, fill: COLORS.red },
  { name: "Eqp. Theft", value: 144486000, fill: COLORS.darkRed },
  { name: "DDoS", value: 106812000, fill: COLORS.lightRed },
  { name: "Viruses/Worms", value: 150852000, fill: COLORS.red },
  { name: "Intrusion", value: 150852000, fill: COLORS.darkRed },
];

// Data Matrix 3: Threat / Control
const controlData = [
  { name: "Intrusion Detect", value: 967884000 },
  { name: "Anti-Virus", value: 452556000 },
  { name: "Firewall Upgrade", value: 1074696000 },
  { name: "Insurance", value: 2017434000 },
  { name: "Sec. Policy", value: 923796000 },
].sort((a, b) => b.value - a.value);

const riskTrendData = [
  { month: "Jan", inherent: 950, residual: 450 },
  { month: "Feb", inherent: 980, residual: 420 },
  { month: "Mar", inherent: 1100, residual: 480 },
  { month: "Apr", inherent: 1050, residual: 410 },
  { month: "May", inherent: 1250, residual: 390 },
  { month: "Jun", inherent: 1300, residual: 350 },
];

const vulnerabilityLog = [
  {
    id: "VUL-091",
    asset: "Regional Server NY",
    threat: "Zero-Day Exploit",
    riskScore: "CRITICAL",
    status: "Mitigating",
  },
  {
    id: "VUL-092",
    asset: "HQ Database",
    threat: "SQL Injection",
    riskScore: "HIGH",
    status: "Investigating",
  },
  {
    id: "VUL-093",
    asset: "Field Laptops",
    threat: "Unencrypted Drive",
    riskScore: "MEDIUM",
    status: "Patch Deployed",
  },
  {
    id: "VUL-094",
    asset: "Network Router",
    threat: "DDoS Attempt",
    riskScore: "LOW",
    status: "Blocked",
  },
];

// ==============================================================================
// 1. LOGIN SCREEN
// ==============================================================================
function LoginScreen({ onLogin }) {
  return (
    <div className="login-container animate-fade-in relative-z">
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
          <h2 className="glitch-text" data-text="NYS CYBER COMMAND">
            NYS CYBER COMMAND
          </h2>
          <p>Level 5 Clearance Required</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onLogin();
          }}
          className="login-form"
        >
          <div className="input-group">
            <label>Analyst Identification</label>
            <input type="text" placeholder="IT-DIR-01" required />
          </div>
          <div className="input-group">
            <label>Decryption Passkey</label>
            <input type="password" placeholder="••••••••" required />
          </div>
          <button type="submit" className="login-btn">
            INITIALIZE HANDSHAKE
          </button>
        </form>
      </div>
    </div>
  );
}

// ==============================================================================
// 2. DASHBOARD OVERVIEW (COMMAND CENTER)
// ==============================================================================
function DashboardOverview({ assets, threats }) {
  return (
    <div className="dashboard-content animate-fade-in">
      {/* HEADER & TICKER TAPE */}
      <div className="header-section">
        <h1
          className="main-title glitch-text"
          data-text="GLOBAL COMMAND & CONTROL"
        >
          GLOBAL COMMAND & CONTROL
        </h1>
        <p className="sub-title">
          Real-time risk telemetry, threat distribution, and asset valuation.
        </p>
        <div className="ticker-wrap">
          <div className="ticker">
            <div className="ticker-item">
              ⚠️ ALERT: 14,000 PING ATTEMPTS BLOCKED FROM UNKNOWN IP SET.
            </div>
            <div className="ticker-item">
              ✅ SYSTEM: FIREWALL UPGRADE V4.1 SUCCESSFULLY DEPLOYED TO REGIONAL
              SERVERS.
            </div>
            <div className="ticker-item">
              ⚠️ ALERT: LAPTOP THEFT REPORTED IN SECTOR 7. REMOTE WIPE
              INITIATED.
            </div>
            <div className="ticker-item">
              📊 METRIC: OVERALL RESIDUAL RISK DECREASED BY 12% THIS QUARTER.
            </div>
          </div>
        </div>
      </div>

      {/* KPI HUD ROW */}
      <div className="kpi-grid">
        <div className="kpi-card glow-effect">
          <span className="kpi-label">TOTAL ASSETS TRACKED</span>
          <span className="kpi-value neon-blue">{assets.length} Nodes</span>
          <span className="kpi-trend">Active Registry</span>
        </div>
        <div className="kpi-card glow-effect">
          <span className="kpi-label">ACTIVE THREAT VECTORS</span>
          <span className="kpi-value text-red">{threats.length} Vectors</span>
          <span className="kpi-trend text-red">Critical Monitoring</span>
        </div>
        <div className="kpi-card glow-effect">
          <span className="kpi-label">MITIGATION ROI</span>
          <span className="kpi-value text-green">+345%</span>
          <span className="kpi-trend text-green">Highly Efficient</span>
        </div>
        <div className="kpi-card glow-effect">
          <span className="kpi-label">DEFENSE POSTURE</span>
          <span className="kpi-value text-yellow">DEFCON 3</span>
          <span className="kpi-trend text-yellow">Elevated Readiness</span>
        </div>
      </div>

      <div className="dashboard-grid layout-3-col">
        {/* CHART 1: LINE CHART (TREN) */}
        <div className="dashboard-card col-span-2 glow-effect">
          <div className="card-header">
            <h3 className="card-title">
              Risk Trend: Inherent vs Residual (6 Months)
            </h3>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart
                data={riskTrendData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgba(255,255,255,0.05)"
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#888" }}
                />
                <YAxis
                  tickFormatter={(val) => `$${val}M`}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#888" }}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "rgba(0,0,0,0.9)",
                    border: "1px solid #333",
                    color: "#fff",
                  }}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: "12px", color: "#ccc" }}
                />
                <Line
                  type="monotone"
                  dataKey="inherent"
                  name="Inherent Risk"
                  stroke={COLORS.red}
                  strokeWidth={3}
                  dot={{ r: 4, fill: COLORS.red }}
                  activeDot={{ r: 6, fill: "#fff", stroke: COLORS.red }}
                />
                <Line
                  type="monotone"
                  dataKey="residual"
                  name="Residual Risk (Post-Control)"
                  stroke={COLORS.neonBlue}
                  strokeWidth={3}
                  dot={{ r: 4, fill: COLORS.neonBlue }}
                  activeDot={{ r: 6, fill: "#fff", stroke: COLORS.neonBlue }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RADAR WIDGET */}
        <div className="dashboard-card col-span-1 glow-effect radar-card">
          <div className="card-header">
            <h3 className="card-title">Live Geo-Radar</h3>
          </div>
          <div className="radar-container" style={{ paddingTop: "20px" }}>
            <div className="radar">
              <div className="sweep"></div>
              <div className="target target-1"></div>
              <div className="target target-2"></div>
              <div className="target target-3"></div>
            </div>
            <div className="radar-stats">
              <p>Scanning Sector 7...</p>
              <p style={{ color: COLORS.red }}>3 Vectors Detected</p>
            </div>
          </div>
        </div>

        {/* CHART 2: PIE CHART */}
        <div className="dashboard-card col-span-1 glow-effect">
          <div className="card-header">
            <h3 className="card-title">Threat Distribution</h3>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={threatData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  stroke="none"
                  paddingAngle={2}
                >
                  {threatData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(value) => formatMoney(value)}
                  contentStyle={{
                    backgroundColor: "rgba(0,0,0,0.9)",
                    border: "1px solid #ff3333",
                    color: "#fff",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: BAR CHART */}
        <div className="dashboard-card col-span-1 glow-effect">
          <div className="card-header">
            <h3 className="card-title">Top Controls (ROI)</h3>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={controlData}
                layout="vertical"
                margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="rgba(255,255,255,0.05)"
                />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#ccc" }}
                  width={90}
                />
                <RechartsTooltip
                  cursor={{ fill: "rgba(255,51,51,0.1)" }}
                  formatter={(value) => formatMoney(value)}
                  contentStyle={{
                    backgroundColor: "rgba(0,0,0,0.9)",
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
                    style={{
                      fill: "#00f5d4",
                      fontSize: 10,
                      fontWeight: "bold",
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 4: TABLE (DETAIL) */}
        <div className="dashboard-card col-span-1 glow-effect">
          <div className="card-header">
            <h3 className="card-title">Vulnerability Reg.</h3>
          </div>
          <div
            className="table-container"
            style={{ height: "250px", overflowY: "auto" }}
          >
            <table className="data-table small-table">
              <thead>
                <tr>
                  <th>Log ID</th>
                  <th>Asset</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                {vulnerabilityLog.map((log, index) => (
                  <tr key={index}>
                    <td
                      style={{
                        color: COLORS.neonBlue,
                        fontFamily: "monospace",
                      }}
                    >
                      {log.id}
                    </td>
                    <td>{log.asset}</td>
                    <td>
                      <span
                        className={`status-pill ${log.riskScore.toLowerCase() === "critical" ? "danger" : log.riskScore.toLowerCase() === "high" ? "danger" : log.riskScore.toLowerCase() === "medium" ? "warning" : "good"}`}
                      >
                        {log.riskScore}
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

// ==============================================================================
// 3. FITUR CRUD & MASTER REGISTRY
// ==============================================================================
function AssetManager({ assets, setAssets }) {
  const [newAsset, setNewAsset] = useState({
    id: "",
    name: "",
    value: "",
    category: "Hardware",
  });

  const handleAddAsset = (e) => {
    e.preventDefault();
    if (!newAsset.name || !newAsset.value) return;
    const assetToAdd = {
      ...newAsset,
      id: `AST-${Math.floor(Math.random() * 1000)}`,
      value: parseFloat(newAsset.value),
    };
    setAssets([...assets, assetToAdd]);
    setNewAsset({ id: "", name: "", value: "", category: "Hardware" });
  };
  const handleDelete = (id) => setAssets(assets.filter((a) => a.id !== id));

  return (
    <div className="dashboard-content animate-fade-in">
      <div className="header-section">
        <h1 className="main-title">ASSET REGISTRY</h1>
        <p className="sub-title">Manage and evaluate organizational assets.</p>
      </div>
      <div
        className="dashboard-card full-width-card glow-effect"
        style={{ marginBottom: "20px", minHeight: "auto" }}
      >
        <div className="card-header">
          <h3 className="card-title">Register New Asset</h3>
        </div>
        <form onSubmit={handleAddAsset} className="crud-form">
          <input
            type="text"
            placeholder="Asset Name"
            value={newAsset.name}
            onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
            required
          />
          <input
            type="number"
            placeholder="Value in $"
            value={newAsset.value}
            onChange={(e) =>
              setNewAsset({ ...newAsset, value: e.target.value })
            }
            required
          />
          <select
            value={newAsset.category}
            onChange={(e) =>
              setNewAsset({ ...newAsset, category: e.target.value })
            }
          >
            <option value="Hardware">Hardware</option>
            <option value="Software">Software</option>
            <option value="Data">Data</option>
          </select>
          <button type="submit" className="action-btn add-btn">
            + ADD ASSET
          </button>
        </form>
      </div>
      <div className="dashboard-card full-width-card glow-effect">
        <div className="table-container">
          <table className="data-table cyber-grid">
            <thead>
              <tr>
                <th>Asset ID</th>
                <th>Asset Name</th>
                <th>Category</th>
                <th>Valuation ($)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.id}>
                  <td
                    style={{ color: COLORS.neonBlue, fontFamily: "monospace" }}
                  >
                    {asset.id}
                  </td>
                  <td>{asset.name}</td>
                  <td>{asset.category}</td>
                  <td style={{ fontWeight: "bold" }}>
                    {formatMoney(asset.value)}
                  </td>
                  <td>
                    <button
                      onClick={() => handleDelete(asset.id)}
                      className="action-btn delete-btn"
                    >
                      DELETE
                    </button>
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

function ThreatManager({ threats, setThreats }) {
  const [newThreat, setNewThreat] = useState({
    name: "",
    probability: "",
    category: "Malicious",
  });

  const handleAddThreat = (e) => {
    e.preventDefault();
    if (!newThreat.name || !newThreat.probability) return;
    const threatToAdd = {
      ...newThreat,
      id: `THR-${Math.floor(Math.random() * 1000)}`,
      probability: parseFloat(newThreat.probability),
    };
    setThreats([...threats, threatToAdd]);
    setNewThreat({ name: "", probability: "", category: "Malicious" });
  };
  const handleDelete = (id) => setThreats(threats.filter((t) => t.id !== id));

  return (
    <div className="dashboard-content animate-fade-in">
      <div className="header-section">
        <h1 className="main-title">THREAT INTELLIGENCE</h1>
        <p className="sub-title">
          Catalog of identified system threats and vulnerabilities.
        </p>
      </div>
      <div
        className="dashboard-card full-width-card glow-effect"
        style={{ marginBottom: "20px", minHeight: "auto" }}
      >
        <div className="card-header">
          <h3 className="card-title">Log New Threat</h3>
        </div>
        <form onSubmit={handleAddThreat} className="crud-form">
          <input
            type="text"
            placeholder="Threat Name"
            value={newThreat.name}
            onChange={(e) =>
              setNewThreat({ ...newThreat, name: e.target.value })
            }
            required
          />
          <input
            type="number"
            step="0.01"
            max="1"
            min="0"
            placeholder="Probability (0.0 to 1.0)"
            value={newThreat.probability}
            onChange={(e) =>
              setNewThreat({ ...newThreat, probability: e.target.value })
            }
            required
          />
          <select
            value={newThreat.category}
            onChange={(e) =>
              setNewThreat({ ...newThreat, category: e.target.value })
            }
          >
            <option value="Malicious">Malicious Attack</option>
            <option value="Operational">Operational Failure</option>
            <option value="Natural">Natural Disaster</option>
          </select>
          <button type="submit" className="action-btn add-btn">
            + LOG THREAT
          </button>
        </form>
      </div>
      <div className="dashboard-card full-width-card glow-effect">
        <div className="table-container">
          <table className="data-table cyber-grid">
            <thead>
              <tr>
                <th>Threat ID</th>
                <th>Threat Vector</th>
                <th>Category</th>
                <th>Probability</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {threats.map((threat) => (
                <tr key={threat.id}>
                  <td style={{ color: COLORS.red, fontFamily: "monospace" }}>
                    {threat.id}
                  </td>
                  <td>{threat.name}</td>
                  <td>{threat.category}</td>
                  <td style={{ fontWeight: "bold" }}>
                    {(threat.probability * 100).toFixed(0)}%
                  </td>
                  <td>
                    <button
                      onClick={() => handleDelete(threat.id)}
                      className="action-btn delete-btn"
                    >
                      DELETE
                    </button>
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
// 4. RISK SIMULATOR ENGINE
// ==============================================================================
function RiskSimulator({ assets, threats, controls }) {
  const [selAssetId, setSelAssetId] = useState(assets[0]?.id || "");
  const [selThreatId, setSelThreatId] = useState(threats[0]?.id || "");
  const [selControlIdx, setSelControlIdx] = useState(0);

  const asset = assets.find((a) => a.id === selAssetId) || {
    value: 0,
    name: "N/A",
  };
  const threat = threats.find((t) => t.id === selThreatId) || {
    probability: 0,
    name: "N/A",
  };
  const control = controls[selControlIdx];

  const inherentRisk = asset.value * threat.probability;
  const residualRisk = inherentRisk * (1 - control.reduction);
  const moneySaved = inherentRisk - residualRisk;

  return (
    <div className="dashboard-content animate-fade-in">
      <div className="header-section">
        <h1 className="main-title">RISK SIMULATOR ENGINE</h1>
        <p className="sub-title">
          Dynamically calculate Inherent vs Residual risk using live data.
        </p>
      </div>
      <div className="dashboard-grid layout-2-col">
        <div className="dashboard-card glow-effect">
          <div className="card-header">
            <h3 className="card-title">Simulation Parameters</h3>
          </div>
          <div className="simulator-inputs">
            <label>1. Target Asset:</label>
            <select
              value={selAssetId}
              onChange={(e) => setSelAssetId(e.target.value)}
              className="cyber-select"
            >
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({formatMoney(a.value)})
                </option>
              ))}
            </select>
            <label>2. Threat Vector:</label>
            <select
              value={selThreatId}
              onChange={(e) => setSelThreatId(e.target.value)}
              className="cyber-select"
            >
              {threats.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (Prob: {t.probability})
                </option>
              ))}
            </select>
            <label>3. Apply Security Control:</label>
            <select
              value={selControlIdx}
              onChange={(e) => setSelControlIdx(e.target.value)}
              className="cyber-select"
            >
              {controls.map((c, i) => (
                <option key={i} value={i}>
                  {c.name} (Reduces risk by {c.reduction * 100}%)
                </option>
              ))}
            </select>
          </div>
        </div>
        <div
          className="dashboard-card glow-effect"
          style={{ borderLeft: `4px solid ${COLORS.neonBlue}` }}
        >
          <div className="card-header">
            <h3 className="card-title">Live Calculation Output</h3>
          </div>
          <div className="calc-output">
            <div className="calc-row">
              <span>Asset Value:</span>{" "}
              <span className="val">{formatMoney(asset.value)}</span>
            </div>
            <div className="calc-row">
              <span>x Threat Probability:</span>{" "}
              <span className="val">
                {(threat.probability * 100).toFixed(0)}%
              </span>
            </div>
            <hr className="cyber-hr" />
            <div className="calc-row result-row text-red">
              <span>= INHERENT RISK:</span>{" "}
              <span className="val">{formatMoney(inherentRisk)}</span>
            </div>
            <div className="calc-row" style={{ marginTop: "20px" }}>
              <span>Applied Control:</span>{" "}
              <span className="val">{control.name}</span>
            </div>
            <div className="calc-row">
              <span>Mitigation Rate:</span>{" "}
              <span className="val">
                -{(control.reduction * 100).toFixed(0)}%
              </span>
            </div>
            <hr className="cyber-hr" />
            <div className="calc-row result-row neon-blue">
              <span>= RESIDUAL RISK:</span>{" "}
              <span className="val">{formatMoney(residualRisk)}</span>
            </div>
            <div className="roi-box">
              <span>VALUE SAVED BY CONTROL:</span>
              <span className="roi-val text-green">
                {formatMoney(moneySaved)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==============================================================================
// 5. MATRIX PAGES (ANALYSIS ENGINES - FROM PDF)
// ==============================================================================
function AITerminal({ text }) {
  return (
    <div className="ai-terminal">
      <span className="terminal-prefix">SYS_AI_ANALYSIS:\&gt;</span>
      <div className="typing-container">
        <span className="terminal-text typewriter">{text}</span>
      </div>
    </div>
  );
}

function MatrixAssetVulnerability() {
  return (
    <div className="dashboard-content animate-fade-in">
      <div className="header-section">
        <h1
          className="main-title glitch-text"
          data-text="MATRIX 1: ASSET VULN."
        >
          MATRIX 1: ASSET VULN.
        </h1>
        <p className="sub-title">
          Calculates the impact aggregate (Σ asset value × vulnerability level).
        </p>
      </div>
      <AITerminal text="CALCULATING IMPACT... REGIONAL SERVERS AND LAPTOPS IDENTIFIED AS CRITICAL VULNERABILITY NODES." />
      <div
        className="dashboard-card full-width-card glow-effect"
        style={{ marginTop: "20px" }}
      >
        <div className="card-header">
          <h3 className="card-title">Impact Aggregates per Asset</h3>
        </div>
        <div style={{ height: "350px", width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={impactData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="rgba(0, 243, 255, 0.1)"
              />
              <XAxis
                dataKey="name"
                tick={{
                  fill: COLORS.neonBlue,
                  fontSize: 12,
                  fontFamily: "monospace",
                }}
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
                cursor={{ fill: "rgba(0,243,255,0.05)" }}
                formatter={(val) => formatMoney(val)}
                contentStyle={{
                  backgroundColor: "#0a0c12",
                  borderColor: COLORS.neonBlue,
                }}
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
        <h1
          className="main-title glitch-text"
          data-text="MATRIX 2: VULN. vs THREAT"
        >
          MATRIX 2: VULN. vs THREAT
        </h1>
        <p className="sub-title">
          Calculates the Threat Importance (Σ impact value × threat value).
        </p>
      </div>
      <AITerminal text="EVALUATING THREAT VECTORS... INTRUSION & VIRUS PROBABILITY EXCEEDS ACCEPTABLE LIMITS ($150.8M EXPOSURE)." />
      <div
        className="dashboard-card full-width-card glow-effect"
        style={{ marginTop: "20px" }}
      >
        <div className="card-header">
          <h3 className="card-title">Threat Importance Matrix Data</h3>
        </div>
        <div className="table-container">
          <table className="data-table cyber-grid">
            <thead>
              <tr>
                <th>Threat Vector</th>
                <th>Aggregated Importance Score</th>
                <th>Risk Classification</th>
              </tr>
            </thead>
            <tbody>
              {threatData.map((row, index) => (
                <tr key={index}>
                  <td style={{ color: "#fff", fontFamily: "monospace" }}>
                    {row.name.toUpperCase()}
                  </td>
                  <td
                    style={{
                      color: COLORS.neonBlue,
                      fontFamily: "monospace",
                      fontWeight: "bold",
                    }}
                  >
                    {formatMoney(row.value)}
                  </td>
                  <td>
                    {row.value >= 150000000 ? (
                      <span className="status-pill danger">CRITICAL</span>
                    ) : (
                      <span className="status-pill warning">HIGH</span>
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

function MatrixThreatControl() {
  return (
    <div className="dashboard-content animate-fade-in">
      <div className="header-section">
        <h1
          className="main-title glitch-text"
          data-text="MATRIX 3: THREAT vs CONTROL"
        >
          MATRIX 3: THREAT vs CONTROL
        </h1>
        <p className="sub-title">
          Aggregate Value of Control (Σ threat importance × impact of controls).
        </p>
      </div>
      <AITerminal text="OPTIMIZING BUDGET... INSURANCE YIELDS HIGHEST ROI. FIREWALL UPGRADES MANDATORY FOR SURVIVAL." />
      <div
        className="dashboard-card full-width-card glow-effect"
        style={{ marginTop: "20px" }}
      >
        <div className="card-header">
          <h3 className="card-title">Value of Evaluated Controls</h3>
        </div>
        <div className="table-container">
          <table className="data-table cyber-grid">
            <thead>
              <tr>
                <th>Security Control Directive</th>
                <th>Aggregate Value ($)</th>
                <th>System Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {controlData.map((row, index) => (
                <tr key={index}>
                  <td
                    style={{
                      fontWeight: "bold",
                      color: "#fff",
                      fontFamily: "monospace",
                    }}
                  >
                    {row.name}
                  </td>
                  <td
                    style={{
                      color: COLORS.green,
                      fontWeight: "bold",
                      fontFamily: "monospace",
                    }}
                  >
                    {formatMoney(row.value)}
                  </td>
                  <td>
                    {row.value > 1000000000 ? (
                      <span className="status-pill good">
                        EXECUTE IMMEDIATELY
                      </span>
                    ) : row.value > 600000000 ? (
                      <span className="status-pill warning">RECOMMENDED</span>
                    ) : (
                      <span className="status-pill neutral">
                        OPTIONAL DEFENSE
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
// 6. MAIN APP COMPONENT (STATE & ROUTING)
// ==============================================================================
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const containerRef = useRef(null);

  // Data Global untuk CRUD
  const [assets, setAssets] = useState([
    {
      id: "AST-01",
      name: "Regional Servers",
      value: 30998000,
      category: "Hardware",
    },
    {
      id: "AST-02",
      name: "Field Laptops",
      value: 25010000,
      category: "Hardware",
    },
    {
      id: "AST-03",
      name: "Client Database",
      value: 50000000,
      category: "Data",
    },
  ]);

  const [threats, setThreats] = useState([
    {
      id: "THR-01",
      name: "Intrusion / Hack",
      probability: 0.85,
      category: "Malicious",
    },
    {
      id: "THR-02",
      name: "Ransomware",
      probability: 0.6,
      category: "Malicious",
    },
    {
      id: "THR-03",
      name: "Hardware Failure",
      probability: 0.4,
      category: "Operational",
    },
  ]);

  const controls = [
    { name: "None", reduction: 0 },
    { name: "Basic Firewall", reduction: 0.3 },
    { name: "Advanced IDS/IPS", reduction: 0.75 },
    { name: "Full Redundancy + Insurance", reduction: 0.95 },
  ];

  const handleMouseMove = (e) => {
    if (containerRef.current) {
      containerRef.current.style.setProperty("--mouse-x", `${e.clientX}px`);
      containerRef.current.style.setProperty("--mouse-y", `${e.clientY}px`);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <DashboardOverview assets={assets} threats={threats} />;
      case "assets":
        return <AssetManager assets={assets} setAssets={setAssets} />;
      case "threats":
        return <ThreatManager threats={threats} setThreats={setThreats} />;
      case "simulator":
        return (
          <RiskSimulator
            assets={assets}
            threats={threats}
            controls={controls}
          />
        );
      case "matrix-1":
        return <MatrixAssetVulnerability />;
      case "matrix-2":
        return <MatrixVulnerabilityThreat />;
      case "matrix-3":
        return <MatrixThreatControl />;
      default:
        return <DashboardOverview assets={assets} threats={threats} />;
    }
  };

  return (
    <div className="app-root" ref={containerRef} onMouseMove={handleMouseMove}>
      <div className="scanlines"></div>
      <div className="cursor-tracker">
        <div className="cursor-distortion"></div>
        <div className="cursor-red-core"></div>
      </div>

      {!isLoggedIn ? (
        <LoginScreen onLogin={() => setIsLoggedIn(true)} />
      ) : (
        <div className="main-layout relative-z">
          {/* SIDEBAR */}
          <aside className="sidebar glow-effect">
            <div className="sidebar-logo">
              <h2 className="glitch-text" data-text="NYS RISK">
                NYS<span>RISK</span>
              </h2>
              <div className="status-dot pulse-red"></div>
            </div>

            <nav className="sidebar-nav">
              <span className="nav-section-title">COMMAND CENTER</span>
              <button
                className={`nav-item ${activeTab === "overview" ? "active" : ""}`}
                onClick={() => setActiveTab("overview")}
              >
                Global Telemetry
              </button>

              <span className="nav-section-title" style={{ marginTop: "25px" }}>
                MASTER REGISTRY (CRUD)
              </span>
              <button
                className={`nav-item ${activeTab === "assets" ? "active" : ""}`}
                onClick={() => setActiveTab("assets")}
              >
                Asset Inventory
              </button>
              <button
                className={`nav-item ${activeTab === "threats" ? "active" : ""}`}
                onClick={() => setActiveTab("threats")}
              >
                Threat Intel Log
              </button>

              <span className="nav-section-title" style={{ marginTop: "25px" }}>
                ANALYSIS ENGINES
              </span>
              <button
                className={`nav-item ${activeTab === "simulator" ? "active" : ""}`}
                onClick={() => setActiveTab("simulator")}
              >
                Risk Calculator ⚡
              </button>

              <span className="nav-section-title" style={{ marginTop: "25px" }}>
                ANALYSIS MATRICES (PDF)
              </span>
              <button
                className={`nav-item sub-nav ${activeTab === "matrix-1" ? "active" : ""}`}
                onClick={() => setActiveTab("matrix-1")}
              >
                1. Asset vs Vuln.
              </button>
              <button
                className={`nav-item sub-nav ${activeTab === "matrix-2" ? "active" : ""}`}
                onClick={() => setActiveTab("matrix-2")}
              >
                2. Vuln. vs Threat
              </button>
              <button
                className={`nav-item sub-nav ${activeTab === "matrix-3" ? "active" : ""}`}
                onClick={() => setActiveTab("matrix-3")}
              >
                3. Threat vs Control
              </button>
            </nav>

            <div className="sidebar-footer">
              <div className="system-status-box">
                <span className="sys-label">SYS. THREAT LEVEL</span>
                <span className="sys-value defcon-3">ELEVATED</span>
              </div>
              <div className="user-info-bar">
                <div className="user-info">
                  <span className="user-name">IT-DIR-01</span>
                  <span className="user-role">Risk Manager</span>
                </div>
                <button
                  className="logout-btn"
                  onClick={() => setIsLoggedIn(false)}
                >
                  EXIT
                </button>
              </div>
            </div>
          </aside>

          {/* KONTEN UTAMA */}
          <main className="content-area">{renderContent()}</main>
        </div>
      )}
    </div>
  );
}

export default App;
