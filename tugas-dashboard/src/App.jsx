import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
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
  BarChart,
  Bar,
} from "recharts";
import { utils, writeFile } from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import "./App.css";

// ==============================================================================
// 1. UTILS & STATIC DATA (SYNCHRONIZED DATASET)
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

// DATA 1: Area Chart - Metrik operasional (Disinkronkan dengan 18 Total Insiden)
const threatTelemetryData = [
  { month: "Jan", blocked: 7, breached: 5 },
  { month: "Feb", blocked: 10, breached: 4 },
  { month: "Mar", blocked: 12, breached: 3 },
  { month: "Apr", blocked: 14, breached: 3 },
  { month: "May", blocked: 15, breached: 2 },
  { month: "Jun", blocked: 21, breached: 1 },
];
// Total Breached = 5 + 4 + 3 + 3 + 2 + 1 = 18 Insiden!
// Warna disinkronkan secara psikologis (Kritis = Merah Gelap, Rendah = Hijau)
const SEVERITY_COLORS = {
  CRITICAL: COLORS.darkRed,
  HIGH: COLORS.red,
  MEDIUM: COLORS.yellow,
  LOW: COLORS.green,
};

// ==============================================================================
// 2. MAIN APP COMPONENT (ROOT)
// ==============================================================================
export default function App() {
  const [role, setRole] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // DATABASE 1: ASSETS (Skala Besar)
  const [assets, setAssets] = useState([
    {
      id: "AST-001",
      name: "Legacy Web Portal",
      value: 1200000,
      category: "Software",
    },
    {
      id: "AST-002",
      name: "Regional DB Server",
      value: 8500000,
      category: "Hardware",
    },
    {
      id: "AST-003",
      name: "Cloud Gateway API",
      value: 5000000,
      category: "Software",
    },
    {
      id: "AST-004",
      name: "Employee Endpoints",
      value: 800000,
      category: "Hardware",
    },
    {
      id: "AST-005",
      name: "Payment Processing API",
      value: 15000000,
      category: "Software",
    },
    {
      id: "AST-006",
      name: "Core Banking Mainframe",
      value: 35000000,
      category: "Hardware",
    },
    {
      id: "AST-007",
      name: "HR Management System",
      value: 2500000,
      category: "Data",
    },
    {
      id: "AST-008",
      name: "Public DNS Servers",
      value: 500000,
      category: "Hardware",
    },
  ]);

  // DATABASE 2: THREATS (Skala Besar)
  const [threats, setThreats] = useState([
    {
      id: "THR-001",
      name: "Ransomware Encryption",
      probability: 0.8,
      category: "Malicious",
    },
    {
      id: "THR-002",
      name: "DDoS Attack",
      probability: 0.6,
      category: "Malicious",
    },
    {
      id: "THR-003",
      name: "SQL Injection",
      probability: 0.4,
      category: "Malicious",
    },
    {
      id: "THR-004",
      name: "Spear Phishing",
      probability: 0.75,
      category: "Malicious",
    },
    {
      id: "THR-005",
      name: "Zero-Day Exploit",
      probability: 0.2,
      category: "Malicious",
    },
    {
      id: "THR-006",
      name: "Insider Data Exfiltration",
      probability: 0.15,
      category: "Operational",
    },
    {
      id: "THR-007",
      name: "Brute Force Authentication",
      probability: 0.9,
      category: "Malicious",
    },
    {
      id: "THR-008",
      name: "Cross-Site Scripting (XSS)",
      probability: 0.5,
      category: "Malicious",
    },
    {
      id: "THR-009",
      name: "API Broken Access Control",
      probability: 0.35,
      category: "Malicious",
    },
    {
      id: "THR-010",
      name: "Supply Chain Compromise",
      probability: 0.1,
      category: "Operational",
    },
  ]);

  const [assessments, setAssessments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // ---> EFEK KURSOR CAIR & FLASHLIGHT <---
  useEffect(() => {
    const handleMouseMove = (e) => {
      const root = document.querySelector(".app-root");
      if (root) {
        root.style.setProperty("--mouse-x", `${e.clientX}px`);
        root.style.setProperty("--mouse-y", `${e.clientY}px`);
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // DATABASE 3: ASSESSMENTS (Skala Besar) - Dihitung akurat
  useEffect(() => {
    if (assessments.length === 0) {
      setAssessments([
        {
          id: "RSK-001",
          asset: "Legacy Web Portal",
          vuln: "Outdated Framework",
          threat: "SQL Injection",
          l: 5,
          i: 5,
          control: "WAF (Web App Firewall)",
          effect: 40,
          score: 15.0,
          level: { label: "CRITICAL", class: "danger" },
          time: new Date().toLocaleString(),
        },
        {
          id: "RSK-002",
          asset: "Employee Endpoints",
          vuln: "Lack of Awareness",
          threat: "Spear Phishing",
          l: 4,
          i: 4,
          control: "Email Security Gateway",
          effect: 30,
          score: 11.2,
          level: { label: "HIGH", class: "danger" },
          time: new Date().toLocaleString(),
        },
        {
          id: "RSK-003",
          asset: "Cloud Gateway API",
          vuln: "Rate Limiting Absent",
          threat: "DDoS Attack",
          l: 5,
          i: 4,
          control: "Cloudflare Advanced Shield",
          effect: 90,
          score: 2.0,
          level: { label: "LOW", class: "good" },
          time: new Date().toLocaleString(),
        },
        {
          id: "RSK-004",
          asset: "Regional DB Server",
          vuln: "Weak Password Policy",
          threat: "Ransomware Encryption",
          l: 3,
          i: 5,
          control: "EDR & Automated Backups",
          effect: 20,
          score: 12.0,
          level: { label: "HIGH", class: "danger" },
          time: new Date().toLocaleString(),
        },
        {
          id: "RSK-005",
          asset: "Payment Processing API",
          vuln: "Missing Auth Checks",
          threat: "Zero-Day Exploit",
          l: 4,
          i: 5,
          control: "None",
          effect: 0,
          score: 20.0,
          level: { label: "CRITICAL", class: "danger" },
          time: new Date().toLocaleString(),
        },
        {
          id: "RSK-006",
          asset: "Legacy Web Portal",
          vuln: "Unsanitized Inputs",
          threat: "Cross-Site Scripting (XSS)",
          l: 4,
          i: 3,
          control: "WAF",
          effect: 50,
          score: 6.0,
          level: { label: "MEDIUM", class: "warning" },
          time: new Date().toLocaleString(),
        },
        {
          id: "RSK-007",
          asset: "HR Management System",
          vuln: "Over-privileged Users",
          threat: "Insider Data Exfiltration",
          l: 3,
          i: 4,
          control: "DLP (Data Loss Prevention)",
          effect: 40,
          score: 7.2,
          level: { label: "MEDIUM", class: "warning" },
          time: new Date().toLocaleString(),
        },
        {
          id: "RSK-008",
          asset: "Core Banking Mainframe",
          vuln: "Third-party Vendor Access",
          threat: "Supply Chain Compromise",
          l: 3,
          i: 5,
          control: "Strict Network Segmentation",
          effect: 30,
          score: 10.5,
          level: { label: "HIGH", class: "danger" },
          time: new Date().toLocaleString(),
        },
        {
          id: "RSK-009",
          asset: "Legacy Web Portal",
          vuln: "No Rate Limiting on Login",
          threat: "Brute Force Authentication",
          l: 5,
          i: 3,
          control: "Account Lockout Policy",
          effect: 60,
          score: 6.0,
          level: { label: "MEDIUM", class: "warning" },
          time: new Date().toLocaleString(),
        },
        {
          id: "RSK-010",
          asset: "Public DNS Servers",
          vuln: "Open Resolver",
          threat: "DDoS Attack",
          l: 4,
          i: 4,
          control: "Traffic Scrubbing",
          effect: 85,
          score: 2.4,
          level: { label: "LOW", class: "good" },
          time: new Date().toLocaleString(),
        },
        {
          id: "RSK-011",
          asset: "Employee Endpoints",
          vuln: "Outdated Antivirus Signatures",
          threat: "Ransomware Encryption",
          l: 4,
          i: 5,
          control: "Next-Gen Antivirus",
          effect: 60,
          score: 8.0,
          level: { label: "MEDIUM", class: "warning" },
          time: new Date().toLocaleString(),
        },
        {
          id: "RSK-012",
          asset: "Payment Processing API",
          vuln: "IDOR Vulnerability",
          threat: "API Broken Access Control",
          l: 5,
          i: 5,
          control: "API Gateway Authentication",
          effect: 20,
          score: 20.0,
          level: { label: "CRITICAL", class: "danger" },
          time: new Date().toLocaleString(),
        },
        {
          id: "RSK-013",
          asset: "Regional DB Server",
          vuln: "Unencrypted Data at Rest",
          threat: "SQL Injection",
          l: 3,
          i: 5,
          control: "Database Activity Monitoring",
          effect: 25,
          score: 11.25,
          level: { label: "HIGH", class: "danger" },
          time: new Date().toLocaleString(),
        },
        {
          id: "RSK-014",
          asset: "Legacy Web Portal",
          vuln: "Insufficient Bandwidth",
          threat: "DDoS Attack",
          l: 4,
          i: 4,
          control: "Basic Load Balancer",
          effect: 35,
          score: 10.4,
          level: { label: "HIGH", class: "danger" },
          time: new Date().toLocaleString(),
        },
        {
          id: "RSK-015",
          asset: "Cloud Gateway API",
          vuln: "Exposed Admin Endpoints",
          threat: "Zero-Day Exploit",
          l: 5,
          i: 5,
          control: "IPS/IDS Signatures",
          effect: 10,
          score: 22.5,
          level: { label: "CRITICAL", class: "danger" },
          time: new Date().toLocaleString(),
        },
        {
          id: "RSK-016",
          asset: "Core Banking Mainframe",
          vuln: "Legacy Protocols Enabled",
          threat: "Ransomware Encryption",
          l: 2,
          i: 5,
          control: "Air-Gapped Backups",
          effect: 80,
          score: 2.0,
          level: { label: "LOW", class: "good" },
          time: new Date().toLocaleString(),
        },
        {
          id: "RSK-017",
          asset: "HR Management System",
          vuln: "Single-Factor Login",
          threat: "Brute Force Authentication",
          l: 4,
          i: 3,
          control: "MFA (Multi-Factor Auth)",
          effect: 75,
          score: 3.0,
          level: { label: "LOW", class: "good" },
          time: new Date().toLocaleString(),
        },
        {
          id: "RSK-018",
          asset: "Employee Endpoints",
          vuln: "Unrestricted Macros",
          threat: "Spear Phishing",
          l: 4,
          i: 4,
          control: "Security Awareness Training",
          effect: 50,
          score: 8.0,
          level: { label: "MEDIUM", class: "warning" },
          time: new Date().toLocaleString(),
        },
      ]);
    }
  }, []);

  // Fungsi sentral Audit Trail
  const logAudit = (action, userRole) => {
    const newLog = {
      time: new Date().toLocaleTimeString(),
      user: userRole.toUpperCase(),
      action,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const selectedRole = e.target.roleSelect.value;
    setRole(selectedRole);
    logAudit("Session Authenticated & Initialized", selectedRole);
    setActiveTab("overview");
  };

  // --- 3. LOGIN SCREEN (Keamanan & RBAC) ---
  if (!role) {
    return (
      <div className="app-root">
        <div className="scanlines"></div>
        <div className="cursor-tracker">
          <div className="cursor-distortion"></div>
          <div className="cursor-red-core"></div>
        </div>
        <div className="login-container relative-z">
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
            <form onSubmit={handleLogin} className="login-form">
              <div className="input-group">
                <label>Analyst Identification</label>
                <input type="text" placeholder="IT-DIR-01" required />
              </div>
              <div className="input-group">
                <label>Role / Security Clearance</label>
                <select name="roleSelect" className="cyber-select" required>
                  <option value="admin">Admin (Full Access)</option>
                  <option value="analyst">Analyst (Assess & Read)</option>
                  <option value="viewer">Viewer (Read Only)</option>
                </select>
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
      </div>
    );
  }

  // --- 4. MAIN LAYOUT & SIDEBAR ---
  return (
    <div className="app-root">
      <div className="scanlines"></div>
      <div className="cursor-tracker">
        <div className="cursor-distortion"></div>
        <div className="cursor-red-core"></div>
      </div>

      <div className="main-layout relative-z">
        {/* SIDEBAR NAVIGATION */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <h2>
              NEXUS<span>_</span>
            </h2>
          </div>
          <nav className="sidebar-nav">
            <div className="nav-section-title">COMMAND CENTER</div>
            <button
              className={`nav-item ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              1. System Overview
            </button>
            <button
              className={`nav-item ${activeTab === "matrix" ? "active" : ""}`}
              onClick={() => setActiveTab("matrix")}
            >
              2. Heatmap Matrix
            </button>

            <div className="nav-section-title" style={{ marginTop: "20px" }}>
              RISK WORKFLOW
            </div>
            {(role === "admin" || role === "analyst") && (
              <button
                className={`nav-item ${activeTab === "assessment" ? "active" : ""}`}
                onClick={() => setActiveTab("assessment")}
              >
                3. Execute Assessment
              </button>
            )}
            <button
              className={`nav-item ${activeTab === "assets" ? "active" : ""}`}
              onClick={() => setActiveTab("assets")}
            >
              4. Asset Registry
            </button>
            <button
              className={`nav-item ${activeTab === "threats" ? "active" : ""}`}
              onClick={() => setActiveTab("threats")}
            >
              5. Threat Intel
            </button>

            <div className="nav-section-title" style={{ marginTop: "20px" }}>
              DATA & EXPORT
            </div>
            <button
              className={`nav-item ${activeTab === "audit" ? "active" : ""}`}
              onClick={() => setActiveTab("audit")}
            >
              6. Audit Trail
            </button>
            <button
              className={`nav-item ${activeTab === "export" ? "active" : ""}`}
              onClick={() => setActiveTab("export")}
            >
              7. Export Center
            </button>
          </nav>

          <div className="sidebar-footer">
            <div className="system-status-box">
              <span className="sys-label">SYS. POSTURE</span>
              <span className="sys-value defcon-3">DEFCON 3</span>
            </div>
            <div className="user-info-bar">
              <div className="user-info">
                <span className="user-name">{role.toUpperCase()}</span>
                <span className="user-role">Clearance Granted</span>
              </div>
              <button
                className="logout-btn"
                onClick={() => {
                  setRole(null);
                  logAudit("Session Terminated", role);
                }}
              >
                EXIT
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT RENDERER */}
        <main className="content-area">
          {activeTab === "overview" && (
            <DashboardOverview
              assets={assets}
              threats={threats}
              assessments={assessments}
            />
          )}
          {activeTab === "assessment" && (
            <RiskAssessmentWorkflow
              assets={assets}
              threats={threats}
              assessments={assessments}
              setAssessments={setAssessments}
              logAudit={logAudit}
              role={role}
            />
          )}
          {activeTab === "matrix" && (
            <MatrixHeatmap assessments={assessments} />
          )}
          {activeTab === "assets" && (
            <AssetManager
              assets={assets}
              setAssets={setAssets}
              logAudit={logAudit}
              role={role}
            />
          )}
          {activeTab === "threats" && (
            <ThreatManager
              threats={threats}
              setThreats={setThreats}
              logAudit={logAudit}
              role={role}
            />
          )}
          {activeTab === "audit" && <AuditTrail auditLogs={auditLogs} />}
          {activeTab === "export" && (
            <ExportCenter
              assets={assets}
              threats={threats}
              assessments={assessments}
            />
          )}
        </main>
      </div>
    </div>
  );
}

// ==============================================================================
// 5. VIEW COMPONENTS
// ==============================================================================

function DashboardOverview({ assets, threats, assessments }) {
  const criticalCount = assessments.filter(
    (a) => a.level.label === "CRITICAL",
  ).length;

  const totalIncidents = assessments.length;

  const totalAssetValue = assets.reduce((sum, asset) => sum + asset.value, 0);

  // =========================================================================
  // DATA DINAMIS 1: DONUT CHART (Severity)
  // =========================================================================
  const totalRisks = assessments.length;
  const riskSeverityData = [
    { name: "CRITICAL", value: criticalCount },
    {
      name: "HIGH",
      value: assessments.filter((a) => a.level.label === "HIGH").length,
    },
    {
      name: "MEDIUM",
      value: assessments.filter((a) => a.level.label === "MEDIUM").length,
    },
    {
      name: "LOW",
      value: assessments.filter((a) => a.level.label === "LOW").length,
    },
  ].filter((item) => item.value > 0);

  // =========================================================================
  // DATA DINAMIS 2: BAR CHART (Top Vulnerable Assets)
  // =========================================================================
  const assetRiskCounts = {};
  assessments.forEach((a) => {
    if (!assetRiskCounts[a.asset]) {
      assetRiskCounts[a.asset] = 0;
    }
    assetRiskCounts[a.asset] += 1;
  });

  const dynamicAssetData = Object.keys(assetRiskCounts)
    .map((key) => ({
      name: key,
      value: assetRiskCounts[key],
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <div className="dashboard-content animate-fade-in">
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
      </div>

      <div className="kpi-grid">
        <div className="kpi-card glow-effect">
          <span className="kpi-label">TOTAL ASSET VALUE</span>
          <span className="kpi-value neon-blue">
            {formatMoney(totalAssetValue)}
          </span>
        </div>
        <div className="kpi-card glow-effect">
          <span className="kpi-label">CRITICAL RISKS</span>
          <span className="kpi-value text-red">{criticalCount}</span>
        </div>
        <div className="kpi-card glow-effect">
          <span className="kpi-label">KNOWN THREATS</span>
          <span className="kpi-value text-yellow">{threats.length}</span>
        </div>
        <div className="kpi-card glow-effect">
          <span className="kpi-label">TOTAL INCIDENTS</span>
          <span className="kpi-value text-green">{totalIncidents} Logs</span>
        </div>
      </div>

      <div className="dashboard-grid layout-3-col">
        {/* AREA CHART: Monthly Threat Telemetry */}
        <div className="dashboard-card col-span-2 glow-effect">
          <div className="card-header">
            <h3 className="card-title">Monthly Threat Telemetry</h3>
          </div>
          <p
            style={{
              fontSize: "11px",
              color: "#888",
              marginTop: "-10px",
              marginBottom: "10px",
            }}
          >
            Volume of detected attacks: Firewalls Blocked vs System Breaches.
          </p>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart
                data={threatTelemetryData}
                margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={COLORS.neonBlue}
                      stopOpacity={0.6}
                    />
                    <stop
                      offset="95%"
                      stopColor={COLORS.neonBlue}
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient
                    id="colorBreached"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={COLORS.red}
                      stopOpacity={0.6}
                    />
                    <stop offset="95%" stopColor={COLORS.red} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgba(255,255,255,0.05)"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#888", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#888", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#0a0c12",
                    border: "1px solid #333",
                    color: "#fff",
                    borderRadius: "6px",
                  }}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  wrapperStyle={{ fontSize: "12px", color: "#ccc" }}
                />
                <Area
                  type="monotone"
                  dataKey="blocked"
                  name="Attacks Blocked"
                  stroke={COLORS.neonBlue}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorBlocked)"
                />
                <Area
                  type="monotone"
                  dataKey="breached"
                  name="System Breaches"
                  stroke={COLORS.red}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorBreached)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* DONUT CHART: Risk Severity Distribution */}
        <div className="dashboard-card col-span-1 glow-effect">
          <div className="card-header">
            <h3 className="card-title">Risk Severity Distribution</h3>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={riskSeverityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {riskSeverityData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={SEVERITY_COLORS[entry.name]}
                    />
                  ))}
                </Pie>
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const percentage =
                        totalRisks > 0
                          ? ((data.value / totalRisks) * 100).toFixed(1)
                          : 0;
                      return (
                        <div
                          style={{
                            backgroundColor: "#030406",
                            border: `1px solid ${COLORS.neonBlue}`,
                            padding: "12px",
                            borderRadius: "5px",
                            color: COLORS.white,
                            fontSize: "12px",
                            fontFamily: "monospace",
                          }}
                        >
                          <div
                            style={{
                              fontWeight: "bold",
                              marginBottom: "8px",
                              color: SEVERITY_COLORS[data.name],
                              borderBottom: "1px solid #333",
                              paddingBottom: "4px",
                            }}
                          >
                            {data.name} SEVERITY
                          </div>
                          <div style={{ marginBottom: "4px" }}>
                            <span style={{ color: "#888" }}>
                              Incidents Logged:
                            </span>{" "}
                            <span
                              style={{ fontWeight: "bold", fontSize: "14px" }}
                            >
                              {data.value}
                            </span>
                          </div>
                          <div>
                            <span style={{ color: "#888" }}>
                              Distribution Ratio:
                            </span>{" "}
                            <span style={{ fontWeight: "bold" }}>
                              {percentage}%
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{
                    color: COLORS.white,
                    fontSize: "11px",
                    fontWeight: "bold",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* BAR CHART: Top Vulnerable Assets */}
        <div className="dashboard-card col-span-1 glow-effect">
          <div className="card-header">
            <h3 className="card-title">Top Vulnerable Assets</h3>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={dynamicAssetData}
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
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  formatter={(value) => [value, "Logged Incidents"]}
                  contentStyle={{
                    backgroundColor: "rgba(0,0,0,0.9)",
                    border: `1px solid ${COLORS.red}`,
                    color: "#fff",
                    borderRadius: "6px",
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
                    style={{
                      fill: COLORS.white,
                      fontSize: 10,
                      fontWeight: "bold",
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TABLE: Vulnerability Registry */}
        <div className="dashboard-card col-span-2 glow-effect">
          <div className="card-header">
            <h3 className="card-title">Vulnerability Registry</h3>
          </div>
          <div
            className="table-container"
            style={{ height: "250px", overflowY: "auto" }}
          >
            <table className="data-table small-table">
              <thead>
                <tr>
                  <th>Log ID</th>
                  <th>Affected Asset</th>
                  <th>Identified Threat</th>
                  <th>Mitigation Control</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                {assessments
                  .slice()
                  .reverse()
                  .map((a, i) => (
                    <tr key={i}>
                      <td
                        style={{
                          color: COLORS.neonBlue,
                          fontFamily: "monospace",
                          fontWeight: "bold",
                        }}
                      >
                        {a.id}
                      </td>
                      <td>{a.asset}</td>
                      <td>{a.threat}</td>
                      <td style={{ color: "#888" }}>{a.control}</td>
                      <td>
                        <span className={`status-pill ${a.level.class}`}>
                          {a.level.label}
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

// Fitur Pemodelan Data & Kalkulasi Transparan
function RiskAssessmentWorkflow({
  assets,
  threats,
  assessments,
  setAssessments,
  logAudit,
  role,
}) {
  const [formData, setFormData] = useState({
    assetId: "",
    vuln: "",
    threatId: "",
    l: 3,
    i: 4,
    control: "",
    effect: 50,
  });

  const handleInputChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const executeAssessment = (e) => {
    e.preventDefault();
    if (
      !formData.assetId ||
      !formData.vuln ||
      !formData.threatId ||
      !formData.control
    )
      return alert(
        "DATA INTEGRITY ERROR: Seluruh form wajb diisi untuk memetakan relasi.",
      );
    if (formData.l < 1 || formData.l > 5 || formData.i < 1 || formData.i > 5)
      return alert(
        "VALIDATION ERROR: Skala Likelihood dan Impact harus bernilai 1 hingga 5.",
      );
    if (formData.effect < 0 || formData.effect > 100)
      return alert(
        "VALIDATION ERROR: Persentase efektivitas kontrol harus berada di antara 0% - 100%.",
      );

    const rawScore = formData.l * formData.i;
    const mitigatedScore = (rawScore * (1 - formData.effect / 100)).toFixed(1);

    let level = { label: "LOW", class: "good" };
    if (mitigatedScore >= 15) level = { label: "CRITICAL", class: "danger" };
    else if (mitigatedScore >= 10) level = { label: "HIGH", class: "danger" };
    else if (mitigatedScore >= 5) level = { label: "MEDIUM", class: "warning" };

    const selectedAsset = assets.find((a) => a.id === formData.assetId);
    const selectedThreat = threats.find((t) => t.id === formData.threatId);

    const newAssessment = {
      id: `RSK-${Math.floor(Math.random() * 10000)}`,
      asset: selectedAsset.name,
      vuln: formData.vuln,
      threat: selectedThreat.name,
      l: Number(formData.l),
      i: Number(formData.i),
      control: formData.control,
      effect: Number(formData.effect),
      score: mitigatedScore,
      level,
      time: new Date().toLocaleString(),
    };

    setAssessments([...assessments, newAssessment]);
    logAudit(
      `Executed Risk Assessment for [${newAssessment.asset}]. Final Score: ${mitigatedScore} (${level.label})`,
      role,
    );
    alert(
      `Assessment diproses! \nInherent Risk: ${rawScore}\nResidual Risk: ${mitigatedScore}\nStatus: ${level.label}`,
    );
    setFormData({
      assetId: "",
      vuln: "",
      threatId: "",
      l: 3,
      i: 4,
      control: "",
      effect: 50,
    });
  };

  return (
    <div className="dashboard-content animate-fade-in">
      <div className="header-section">
        <h1 className="main-title">RISK ASSESSMENT ENGINE</h1>
        <p className="sub-title">
          End-to-end mapping: Asset ➔ Vulnerability ➔ Threat ➔ Mitigation.
        </p>
      </div>

      <form
        onSubmit={executeAssessment}
        className="dashboard-card glow-effect form-grid"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px" }}
      >
        <div className="input-group">
          <label>1. Target Asset (Relation)</label>
          <select
            name="assetId"
            value={formData.assetId}
            onChange={handleInputChange}
            className="cyber-select"
            required
          >
            <option value="" disabled>
              -- Select Asset --
            </option>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({formatMoney(a.value)})
              </option>
            ))}
          </select>
        </div>
        <div className="input-group">
          <label>2. Identified Vulnerability</label>
          <input
            type="text"
            name="vuln"
            value={formData.vuln}
            onChange={handleInputChange}
            className="cyber-input"
            placeholder="e.g. Unpatched OS"
            required
          />
        </div>
        <div className="input-group" style={{ gridColumn: "1 / -1" }}>
          <label>3. Threat Actor / Vector (Relation)</label>
          <select
            name="threatId"
            value={formData.threatId}
            onChange={handleInputChange}
            className="cyber-select"
            required
          >
            <option value="" disabled>
              -- Select Threat --
            </option>
            {threats.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} (Prob: {t.probability})
              </option>
            ))}
          </select>
        </div>
        <div className="input-group">
          <label>4. Inherent Likelihood (Scale 1-5)</label>
          <input
            type="number"
            name="l"
            value={formData.l}
            onChange={handleInputChange}
            className="cyber-input"
            min="1"
            max="5"
            required
          />
        </div>
        <div className="input-group">
          <label>5. Inherent Impact (Scale 1-5)</label>
          <input
            type="number"
            name="i"
            value={formData.i}
            onChange={handleInputChange}
            className="cyber-input"
            min="1"
            max="5"
            required
          />
        </div>
        <div className="input-group">
          <label>6. Mitigation Control Plan</label>
          <input
            type="text"
            name="control"
            value={formData.control}
            onChange={handleInputChange}
            className="cyber-input"
            placeholder="e.g. Implement MFA"
            required
          />
        </div>
        <div className="input-group">
          <label>7. Control Effectiveness (0-100%)</label>
          <input
            type="number"
            name="effect"
            value={formData.effect}
            onChange={handleInputChange}
            className="cyber-input"
            min="0"
            max="100"
            required
          />
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <div className="ai-terminal" style={{ marginBottom: "20px" }}>
            <span className="terminal-prefix">SYS_AI_CALC:&gt;</span>
            <span className="typewriter">
              Residual Risk Score = (Likelihood × Impact) × (1 - (Control
              Effectiveness / 100))
            </span>
          </div>
          <button
            type="submit"
            className="action-btn add-btn"
            style={{ width: "100%", padding: "15px", fontSize: "16px" }}
          >
            CALCULATE & INJECT TO MATRIX
          </button>
        </div>
      </form>
    </div>
  );
}

// Fitur Visualisasi Matriks & Prioritas
function MatrixHeatmap({ assessments }) {
  const [hoveredData, setHoveredData] = useState(null);

  const renderCells = () => {
    let cells = [];
    for (let l = 5; l >= 1; l--) {
      for (let i = 1; i <= 5; i++) {
        const cellRisks = assessments.filter((a) => a.l === l && a.i === i);
        const score = l * i;
        let cellClass = "matrix-cell matrix-low";
        if (score >= 15) cellClass = "matrix-cell matrix-critical";
        else if (score >= 10) cellClass = "matrix-cell matrix-high";
        else if (score >= 5) cellClass = "matrix-cell matrix-medium";

        cells.push(
          <div key={`${l}-${i}`} className={cellClass}>
            <span
              style={{
                position: "absolute",
                opacity: 0.3,
                fontSize: "10px",
                bottom: "5px",
                right: "5px",
              }}
            >
              L{l}:I{i}
            </span>
            {cellRisks.map((risk, idx) => (
              <div
                key={idx}
                className="risk-dot"
                onMouseEnter={() => setHoveredData(risk)}
                style={{
                  transform: `translate(${Math.random() * 20 - 10}px, ${Math.random() * 20 - 10}px)`,
                }}
              ></div>
            ))}
          </div>,
        );
      }
    }
    return cells;
  };

  return (
    <div className="dashboard-content animate-fade-in">
      <div className="header-section">
        <h1 className="main-title">SPATIAL RISK MATRIX</h1>
        <p className="sub-title">
          5x5 Interactive Threat Prioritization Heatmap.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: "30px",
          alignItems: "flex-start",
          marginTop: "30px",
        }}
      >
        <div className="matrix-wrapper">
          <div className="matrix-label-y">LIKELIHOOD (1-5)</div>
          <div className="matrix-grid">{renderCells()}</div>
          <div className="matrix-label-x">IMPACT (1-5)</div>
        </div>

        <div className="dashboard-card glow-effect" style={{ flex: 1 }}>
          <h3 className="card-title">Telemetry Drill-down</h3>
          <p style={{ fontSize: "12px", color: "#888", marginBottom: "20px" }}>
            Arahkan kursor ke titik putih (Risk Dot) pada matriks untuk membedah
            data telemetri secara spesifik.
          </p>

          {hoveredData ? (
            <div
              style={{
                background: "rgba(0,0,0,0.5)",
                padding: "20px",
                borderLeft: `4px solid ${hoveredData.level.class === "danger" ? "#ff3333" : hoveredData.level.class === "warning" ? "#fee440" : "#00f3ff"}`,
                fontFamily: "monospace",
              }}
            >
              <div style={{ marginBottom: "10px" }}>
                <strong style={{ color: "#888" }}>Asset:</strong>{" "}
                <span style={{ color: "#fff" }}>{hoveredData.asset}</span>
              </div>
              <div style={{ marginBottom: "10px" }}>
                <strong style={{ color: "#888" }}>Vulnerability:</strong>{" "}
                <span style={{ color: "#fff" }}>{hoveredData.vuln}</span>
              </div>
              <div style={{ marginBottom: "10px" }}>
                <strong style={{ color: "#888" }}>Threat Vector:</strong>{" "}
                <span style={{ color: "#fff" }}>{hoveredData.threat}</span>
              </div>
              <hr style={{ border: "1px dashed #333", margin: "15px 0" }} />
              <div style={{ marginBottom: "10px" }}>
                <strong style={{ color: "#888" }}>Mitigation Control:</strong>{" "}
                <span style={{ color: "#00f5d4" }}>
                  {hoveredData.control} ({hoveredData.effect}% Effective)
                </span>
              </div>
              <div style={{ marginTop: "20px" }}>
                <strong style={{ color: "#888", marginRight: "10px" }}>
                  Final Residual Score:
                </strong>
                <span
                  className={`status-pill ${hoveredData.level.class}`}
                  style={{ fontSize: "14px" }}
                >
                  {hoveredData.score} - {hoveredData.level.label}
                </span>
              </div>
            </div>
          ) : (
            <div className="ai-terminal">
              <span className="typewriter">Awaiting target selection...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Fitur CRUD
function AssetManager({ assets, setAssets, logAudit, role }) {
  const [newAsset, setNewAsset] = useState({
    name: "",
    value: "",
    category: "Hardware",
  });

  const handleAddAsset = (e) => {
    e.preventDefault();
    if (role === "viewer")
      return alert("ACCESS DENIED: Role Viewer tidak memiliki izin menulis.");
    const assetToAdd = {
      ...newAsset,
      id: `AST-${Math.floor(Math.random() * 1000)}`,
      value: parseFloat(newAsset.value),
    };
    setAssets([...assets, assetToAdd]);
    logAudit(`Added new asset: ${assetToAdd.name}`, role);
    setNewAsset({ name: "", value: "", category: "Hardware" });
  };
  const handleDelete = (id) => {
    if (role !== "admin")
      return alert("ACCESS DENIED: Hanya Admin yang dapat menghapus data.");
    setAssets(assets.filter((a) => a.id !== id));
    logAudit(`Deleted asset ID: ${id}`, role);
  };

  return (
    <div className="dashboard-content animate-fade-in">
      <div className="header-section">
        <h1 className="main-title">ASSET REGISTRY</h1>
        <p className="sub-title">Manage and evaluate organizational assets.</p>
      </div>

      {role !== "viewer" && (
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
              onChange={(e) =>
                setNewAsset({ ...newAsset, name: e.target.value })
              }
              className="cyber-input"
              required
            />
            <input
              type="number"
              placeholder="Value in $"
              value={newAsset.value}
              onChange={(e) =>
                setNewAsset({ ...newAsset, value: e.target.value })
              }
              className="cyber-input"
              required
            />
            <select
              value={newAsset.category}
              onChange={(e) =>
                setNewAsset({ ...newAsset, category: e.target.value })
              }
              className="cyber-select"
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
      )}

      <div className="dashboard-card full-width-card glow-effect">
        <table className="data-table cyber-grid">
          <thead>
            <tr>
              <th>Asset ID</th>
              <th>Asset Name</th>
              <th>Category</th>
              <th>Valuation ($)</th>
              {role === "admin" && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr key={asset.id}>
                <td style={{ color: COLORS.neonBlue, fontFamily: "monospace" }}>
                  {asset.id}
                </td>
                <td>{asset.name}</td>
                <td>{asset.category}</td>
                <td style={{ fontWeight: "bold" }}>
                  {formatMoney(asset.value)}
                </td>
                {role === "admin" && (
                  <td>
                    <button
                      onClick={() => handleDelete(asset.id)}
                      className="action-btn delete-btn"
                    >
                      DELETE
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ThreatManager({ threats, setThreats, logAudit, role }) {
  const [newThreat, setNewThreat] = useState({
    name: "",
    probability: "",
    category: "Malicious",
  });

  const handleAddThreat = (e) => {
    e.preventDefault();
    if (role === "viewer")
      return alert("ACCESS DENIED: Role Viewer tidak memiliki izin menulis.");
    const threatToAdd = {
      ...newThreat,
      id: `THR-${Math.floor(Math.random() * 1000)}`,
      probability: parseFloat(newThreat.probability),
    };
    setThreats([...threats, threatToAdd]);
    logAudit(`Added new threat: ${threatToAdd.name}`, role);
    setNewThreat({ name: "", probability: "", category: "Malicious" });
  };
  const handleDelete = (id) => {
    if (role !== "admin")
      return alert("ACCESS DENIED: Hanya Admin yang dapat menghapus data.");
    setThreats(threats.filter((t) => t.id !== id));
    logAudit(`Deleted threat ID: ${id}`, role);
  };

  return (
    <div className="dashboard-content animate-fade-in">
      <div className="header-section">
        <h1 className="main-title">THREAT INTELLIGENCE</h1>
        <p className="sub-title">Catalog of identified system threats.</p>
      </div>
      {role !== "viewer" && (
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
              className="cyber-input"
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
              className="cyber-input"
              required
            />
            <select
              value={newThreat.category}
              onChange={(e) =>
                setNewThreat({ ...newThreat, category: e.target.value })
              }
              className="cyber-select"
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
      )}
      <div className="dashboard-card full-width-card glow-effect">
        <table className="data-table cyber-grid">
          <thead>
            <tr>
              <th>Threat ID</th>
              <th>Threat Vector</th>
              <th>Category</th>
              <th>Probability</th>
              {role === "admin" && <th>Action</th>}
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
                {role === "admin" && (
                  <td>
                    <button
                      onClick={() => handleDelete(threat.id)}
                      className="action-btn delete-btn"
                    >
                      DELETE
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Fitur Audit Trail
function AuditTrail({ auditLogs }) {
  return (
    <div className="dashboard-content animate-fade-in">
      <div className="header-section">
        <h1 className="main-title">SYSTEM AUDIT TRAIL</h1>
        <p className="sub-title">
          Immutable log of system modifications and access histories.
        </p>
      </div>
      <div className="dashboard-card glow-effect" style={{ padding: "30px" }}>
        <div className="audit-timeline">
          {auditLogs.length === 0 && (
            <p style={{ color: "#888", fontFamily: "monospace" }}>
              No audit records found.
            </p>
          )}
          {auditLogs.map((log, index) => (
            <div key={index} className="audit-event">
              <span className="audit-time">
                {log.time} | USER:{" "}
                <span style={{ color: "#ff7b7b" }}>{log.user}</span>
              </span>
              <div className="audit-action">{log.action}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Fitur Export Laporan Lengkap
function ExportCenter({ assets, threats, assessments }) {
  const exportToExcel = () => {
    const wsAssets = utils.json_to_sheet(assets);
    const wsThreats = utils.json_to_sheet(threats);
    const wsAssessments = utils.json_to_sheet(assessments);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, wsAssets, "Asset_Registry");
    utils.book_append_sheet(wb, wsThreats, "Threat_Intel");
    utils.book_append_sheet(wb, wsAssessments, "Risk_Assessments");
    writeFile(wb, "NYS_Cyber_Command_Data.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(194, 24, 7);
    doc.text("NYS CYBER COMMAND - SYSTEM REPORT", 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

    doc.autoTable({
      startY: 35,
      head: [["Log ID", "Asset Target", "Threat Vector", "Score", "Status"]],
      body: assessments.map((a) => [
        a.id,
        a.asset,
        a.threat,
        a.score,
        a.level.label,
      ]),
      theme: "grid",
      headStyles: { fillColor: [0, 243, 255], textColor: [0, 0, 0] },
    });

    const finalY = doc.lastAutoTable.finalY || 35;
    doc.text("CRITICAL ASSET REGISTRY", 14, finalY + 15);
    doc.autoTable({
      startY: finalY + 20,
      head: [["Asset ID", "Asset Name", "Category", "Valuation ($)"]],
      body: assets.map((a) => [
        a.id,
        a.name,
        a.category,
        a.value.toLocaleString(),
      ]),
      theme: "grid",
      headStyles: { fillColor: [50, 50, 50] },
    });
    doc.save("NYS_Cyber_Command_Report.pdf");
  };

  return (
    <div className="dashboard-content animate-fade-in">
      <div className="header-section">
        <h1 className="main-title">DOCUMENT EXPORT FACILITY</h1>
        <p className="sub-title">Extract raw registry and analytical logs.</p>
      </div>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}
      >
        <div
          className="dashboard-card glow-effect"
          style={{ textAlign: "center", border: "1px solid #1D6F42" }}
        >
          <h2 style={{ color: "#1D6F42", marginBottom: "15px" }}>
            RAW DATA (XLSX)
          </h2>
          <button
            onClick={exportToExcel}
            className="action-btn"
            style={{
              width: "100%",
              padding: "15px",
              backgroundColor: "#1D6F42",
              color: "white",
            }}
          >
            ⬇ DOWNLOAD EXCEL
          </button>
        </div>
        <div
          className="dashboard-card glow-effect"
          style={{ textAlign: "center", border: "1px solid #c21807" }}
        >
          <h2 style={{ color: "#c21807", marginBottom: "15px" }}>
            EXECUTIVE REPORT (PDF)
          </h2>
          <button
            onClick={exportToPDF}
            className="action-btn"
            style={{
              width: "100%",
              padding: "15px",
              backgroundColor: "#c21807",
              color: "white",
            }}
          >
            ⬇ DOWNLOAD PDF
          </button>
        </div>
      </div>
    </div>
  );
}
