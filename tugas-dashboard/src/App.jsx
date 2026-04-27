import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LabelList,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { utils, writeFile } from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./App.css";

// ==============================================================================
// 1. KONFIGURASI FIREBASE REALTIME DATABASE
// ==============================================================================
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";

const firebaseConfig = {
  databaseURL: "https://riskdashboard-6c670-default-rtdb.firebaseio.com/",
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);
window.db = db;

// ==============================================================================
// 2. SISTEM AUDIO SYNTHESIZER
// ==============================================================================
let audioCtx = null;
const playUISound = (type) => {
  try {
    if (!audioCtx)
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === "hover") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        audioCtx.currentTime + 0.05,
      );
      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    } else if (type === "click") {
      osc.type = "square";
      osc.frequency.setValueAtTime(300, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(
        100,
        audioCtx.currentTime + 0.1,
      );
      gainNode.gain.setValueAtTime(0.02, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        audioCtx.currentTime + 0.1,
      );
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === "alert") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(500, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(
        1000,
        audioCtx.currentTime + 0.2,
      );
      gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    }
  } catch (error) {
    console.log("Audio diblokir browser");
  }
};

// ==============================================================================
// 3. FORMATTER & TEMA
// ==============================================================================
const formatIDR = (value) =>
  `Rp ${new Intl.NumberFormat("id-ID").format(value || 0)} Jt`;
const formatNilai = (val) => new Intl.NumberFormat("id-ID").format(val || 0);

const COLORS = {
  red: "#E53935",
  primary: "#FF9800", // Safety Orange
  green: "#4CAF50",
  yellow: "#FFC107",
  white: "#ffffff",
  blue: "#00f3ff",
  gray: "#888888",
};

// ==============================================================================
// 4. KOMPONEN UTAMA (ROOT)
// ==============================================================================
export default function App() {
  const [role, setRole] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [theme, setTheme] = useState("dark"); // STATE TEMA TERANG/GELAP

  // --- STATE FIREBASE KOSONG ---
  const [logs, setLogs] = useState([]);
  const [assets, setAssets] = useState([]);
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [threats, setThreats] = useState([]);
  const [controls, setControls] = useState([]);
  const [risks, setRisks] = useState([]);
  const [matrix1Scores, setMatrix1Scores] = useState({});
  const [matrix2Scores, setMatrix2Scores] = useState({});
  const [matrix3Scores, setMatrix3Scores] = useState({});

  // --- MENGHUBUNGKAN KE FIREBASE REALTIME DATABASE ---
  useEffect(() => {
    const safeArray = (val) => {
      if (!val) return [];

      let tempArray = Array.isArray(val)
        ? val
            .filter(Boolean)
            .map((item, index) => ({ ...item, _fbKey: `IDX-${index}` }))
        : Object.keys(val).map((key) => ({ ...val[key], _fbKey: key }));

      return tempArray
        .map((item) => {
          if (typeof item !== "object" || item === null) return null;
          let stableId = item.id || item._fbKey || `ID-${Date.now()}`;
          stableId = String(stableId).replace(/[.#$\[\]]/g, "_");

          return {
            ...item,
            id: stableId,
            timestamp: item.timestamp || new Date().toISOString(),
          };
        })
        .filter(Boolean);
    };

    const dbPaths = [
      { path: "logs", setter: (val) => setLogs(safeArray(val)) },
      { path: "assets", setter: (val) => setAssets(safeArray(val)) },
      {
        path: "vulnerabilities",
        setter: (val) => setVulnerabilities(safeArray(val)),
      },
      { path: "threats", setter: (val) => setThreats(safeArray(val)) },
      { path: "controls", setter: (val) => setControls(safeArray(val)) },
      { path: "risks", setter: (val) => setRisks(safeArray(val)) },
      { path: "matrix1Scores", setter: (val) => setMatrix1Scores(val || {}) },
      { path: "matrix2Scores", setter: (val) => setMatrix2Scores(val || {}) },
      { path: "matrix3Scores", setter: (val) => setMatrix3Scores(val || {}) },
    ];

    const unsubscribes = dbPaths.map(({ path, setter }) => {
      return onValue(ref(db, path), (snapshot) => setter(snapshot.val()));
    });

    return () => unsubscribes.forEach((unsub) => unsub());
  }, []);

  // --- WRAPPER CRUD UNTUK FIREBASE ---
  const createFirebaseSetter =
    (path, localSetterFunction) => (newValueOrUpdater) => {
      localSetterFunction((prevData) => {
        const newData =
          typeof newValueOrUpdater === "function"
            ? newValueOrUpdater(prevData)
            : newValueOrUpdater;
        set(ref(db, path), newData);
        return newData;
      });
    };

  const addLog = (type, action, description, actingUser = role) => {
    const newLog = {
      id: Date.now() + Math.random(),
      type,
      action,
      description,
      user: actingUser || "SYSTEM",
      timestamp: new Date().toISOString(),
    };

    setLogs((prevLogs) => {
      const safePrev = Array.isArray(prevLogs) ? prevLogs : [];
      const updatedLogs = [newLog, ...safePrev];
      set(ref(db, "logs"), updatedLogs);
      return updatedLogs;
    });
  };

  // --- KALKULASI DINAMIS GLOBAL ---
  const impactMap = {};
  vulnerabilities.forEach((v) => {
    let sum = 0;
    assets.forEach((a) => {
      const score = matrix1Scores[v.id]?.[a.id] || 0;
      sum += score * (a.value || 0);
    });
    impactMap[v.id] = sum;
  });

  const threatImpMap = {};
  threats.forEach((t) => {
    let sum = 0;
    vulnerabilities.forEach((v) => {
      const score = matrix2Scores[t.id]?.[v.id] || 0;
      sum += score * (impactMap[v.id] || 0);
    });
    threatImpMap[t.id] = sum;
  });

  const controlValMap = {};
  controls.forEach((c) => {
    let sum = 0;
    threats.forEach((t) => {
      const score = matrix3Scores[c.id]?.[t.id] || 0;
      sum += score * (threatImpMap[t.id] || 0);
    });
    controlValMap[c.id] = sum;
  });

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

  const handleLogin = (e) => {
    e.preventDefault();
    playUISound("alert");
    const selectedRole = e.target.roleSelect.value;
    setRole(selectedRole);
    setActiveTab("overview");
    addLog(
      "LOGIN",
      "Sesi Sistem Dimulai",
      `Pengguna masuk dengan otorisasi: ${selectedRole.toUpperCase()}`,
      selectedRole,
    );
  };

  const handleLogout = () => {
    playUISound("click");
    addLog(
      "LOGOUT",
      "Sesi Sistem Berakhir",
      `Pengguna (${role}) keluar dari sistem.`,
    );
    setRole(null);
  };

  const changeTab = (tabName) => {
    playUISound("click");
    setActiveTab(tabName);
  };

  if (!role) {
    return (
      <div className={`app-root ${theme === "light" ? "light-theme" : ""}`}>
        <div className="scanlines"></div>
        <div className="cursor-tracker">
          <div className="cursor-distortion"></div>
          <div className="cursor-red-core"></div>
        </div>
        <div className="login-container relative-z">
          <div
            className="login-card glow-effect"
            style={{
              background: "rgba(10, 10, 12, 0.95)",
              border: `1px solid ${COLORS.primary}`,
            }}
          >
            <div className="login-header">
              <div
                className="status-dot pulse-red"
                style={{
                  margin: "0 auto 15px auto",
                  width: "15px",
                  height: "15px",
                }}
              ></div>
              <h2
                className="glitch-text"
                data-text="SMA MINING COMMAND"
                style={{ color: "#fff" }}
              >
                SMA MINING COMMAND
              </h2>
              <p style={{ color: COLORS.primary }}>
                Sistem Evaluasi Risiko 3-Tahap
              </p>
            </div>
            <form onSubmit={handleLogin} className="login-form">
              <div className="input-group">
                <label style={{ color: "#888" }}>ID Pengawas Lapangan</label>
                <input
                  type="text"
                  placeholder="SMA-OPS-01"
                  required
                  onFocus={() => playUISound("hover")}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "rgba(0,0,0,0.8)",
                    border: `1px solid #444`,
                    color: COLORS.primary,
                    outline: "none",
                  }}
                />
              </div>
              <div className="input-group">
                <label style={{ color: "#888" }}>Otoritas Akses</label>
                <select
                  name="roleSelect"
                  required
                  onFocus={() => playUISound("hover")}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "rgba(0,0,0,0.8)",
                    border: `1px solid #444`,
                    color: COLORS.primary,
                    outline: "none",
                  }}
                >
                  <option value="admin">Manajer Lapangan (Akses Penuh)</option>
                  <option value="viewer">Pengamat (Hanya Baca)</option>
                </select>
              </div>
              <div className="input-group">
                <label style={{ color: "#888" }}>Kata Sandi Sistem</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  onFocus={() => playUISound("hover")}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "rgba(0,0,0,0.8)",
                    border: `1px solid #444`,
                    color: COLORS.primary,
                    outline: "none",
                  }}
                />
              </div>
              <button
                type="submit"
                onMouseEnter={() => playUISound("hover")}
                style={{
                  width: "100%",
                  padding: "15px",
                  background: "transparent",
                  border: `1px solid ${COLORS.primary}`,
                  color: COLORS.primary,
                  fontWeight: "bold",
                  cursor: "pointer",
                  marginTop: "10px",
                }}
              >
                MASUK KE RUANG KENDALI
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-root ${theme === "light" ? "light-theme" : ""}`}>
      <div className="scanlines"></div>
      <div className="cursor-tracker">
        <div className="cursor-distortion"></div>
        <div className="cursor-red-core"></div>
      </div>

      <div className="main-layout relative-z">
        <aside
          className="sidebar"
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100vh",
            overflow: "hidden",
            padding: 0,
          }}
        >
          <div
            className="sidebar-logo"
            style={{
              flexShrink: 0,
              padding: "30px 20px 20px 20px",
              textAlign: "center",
            }}
          >
            <h2
              style={{
                color: "#fff",
                margin: 0,
                fontSize: "28px",
                letterSpacing: "4px",
                fontFamily: "monospace",
              }}
            >
              SMA<span style={{ color: COLORS.primary }}>_</span>OPS
            </h2>
          </div>

          <nav
            className="sidebar-nav"
            style={{
              flexGrow: 1,
              overflowY: "auto",
              padding: "0 20px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div className="nav-section-title" style={{ marginTop: "10px" }}>
              RUANG KENDALI
            </div>
            <button
              onMouseEnter={() => playUISound("hover")}
              className={`nav-item ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => changeTab("overview")}
            >
              1. Dasbor Utama
            </button>
            <button
              onMouseEnter={() => playUISound("hover")}
              className={`nav-item ${activeTab === "matrix" ? "active" : ""}`}
              onClick={() => changeTab("matrix")}
            >
              2. Kalkulator Matriks
            </button>

            <div className="nav-section-title" style={{ marginTop: "20px" }}>
              REGISTRI BASIS DATA
            </div>
            <button
              onMouseEnter={() => playUISound("hover")}
              className={`nav-item ${activeTab === "assets" ? "active" : ""}`}
              onClick={() => changeTab("assets")}
            >
              3. Registri Aset
            </button>
            <button
              onMouseEnter={() => playUISound("hover")}
              className={`nav-item ${activeTab === "vulns" ? "active" : ""}`}
              onClick={() => changeTab("vulns")}
            >
              4. Kerentanan
            </button>
            <button
              onMouseEnter={() => playUISound("hover")}
              className={`nav-item ${activeTab === "threats" ? "active" : ""}`}
              onClick={() => changeTab("threats")}
            >
              5. Ancaman
            </button>
            <button
              onMouseEnter={() => playUISound("hover")}
              className={`nav-item ${activeTab === "controls" ? "active" : ""}`}
              onClick={() => changeTab("controls")}
            >
              6. Kontrol Mitigasi
            </button>

            <div className="nav-section-title" style={{ marginTop: "20px" }}>
              ANALISA RISIKO
            </div>
            <button
              onMouseEnter={() => playUISound("hover")}
              className={`nav-item ${activeTab === "risks" ? "active" : ""}`}
              onClick={() => changeTab("risks")}
              style={{
                borderLeft:
                  activeTab === "risks" ? `4px solid ${COLORS.red}` : "none",
              }}
            >
              7. Manajemen Risiko
            </button>

            <div className="nav-section-title" style={{ marginTop: "20px" }}>
              SISTEM & RIWAYAT
            </div>
            <button
              onMouseEnter={() => playUISound("hover")}
              className={`nav-item ${activeTab === "export" ? "active" : ""}`}
              onClick={() => changeTab("export")}
            >
              8. Cetak Laporan
            </button>
            <button
              onMouseEnter={() => playUISound("hover")}
              className={`nav-item ${activeTab === "history" ? "active" : ""}`}
              onClick={() => changeTab("history")}
            >
              9. Riwayat Aktivitas
            </button>
          </nav>

          <div
            className="sidebar-footer"
            style={{
              flexShrink: 0,
              padding: "20px",
              borderTop: `1px solid rgba(255, 152, 0, 0.15)`,
              marginTop: 0,
            }}
          >
            {/* --- TOGGLE TEMA SWITCH (SVG) --- */}
            <div
              className={`theme-toggle-wrapper ${theme}`}
              onClick={() => {
                playUISound("click");
                setTheme(theme === "dark" ? "light" : "dark");
              }}
              onMouseEnter={() => playUISound("hover")}
            >
              <div className="theme-toggle-switch">
                <div className="toggle-thumb"></div>
                {/* SVG Matahari (Kiri) */}
                <svg
                  className="icon-sun"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
                {/* SVG Bulan (Kanan) */}
                <svg
                  className="icon-moon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              </div>
              <span className="theme-label">
                {theme === "dark" ? "MODE GELAP" : "MODE TERANG"}
              </span>
            </div>

            <button
              className="logout-btn"
              onMouseEnter={() => playUISound("hover")}
              onClick={handleLogout}
              style={{ width: "100%" }}
            >
              KELUAR SISTEM
            </button>
          </div>
        </aside>

        <main className="content-area">
          {activeTab === "overview" && (
            <DashboardOverview
              assets={assets}
              vulnerabilities={vulnerabilities}
              threats={threats}
              controls={controls}
              risks={risks}
              impactMap={impactMap}
              threatImpMap={threatImpMap}
              controlValMap={controlValMap}
            />
          )}
          {activeTab === "matrix" && (
            <MatrixEngine
              assets={assets}
              vulnerabilities={vulnerabilities}
              threats={threats}
              controls={controls}
              matrix1Scores={matrix1Scores}
              matrix2Scores={matrix2Scores}
              matrix3Scores={matrix3Scores}
              impactMap={impactMap}
              threatImpMap={threatImpMap}
              controlValMap={controlValMap}
              role={role}
              playUISound={playUISound}
              addLog={addLog}
            />
          )}
          {activeTab === "assets" && (
            <AssetManager
              assets={assets}
              setAssets={createFirebaseSetter("assets", setAssets)}
              role={role}
              playUISound={playUISound}
              addLog={addLog}
            />
          )}
          {activeTab === "vulns" && (
            <GenericManager
              data={vulnerabilities}
              setData={createFirebaseSetter(
                "vulnerabilities",
                setVulnerabilities,
              )}
              title="MANAJEMEN KERENTANAN"
              prefix="VULN"
              color={COLORS.primary}
              role={role}
              playUISound={playUISound}
              addLog={addLog}
            />
          )}
          {activeTab === "threats" && (
            <GenericManager
              data={threats}
              setData={createFirebaseSetter("threats", setThreats)}
              title="KATALOG ANCAMAN"
              prefix="THR"
              color={COLORS.red}
              role={role}
              playUISound={playUISound}
              addLog={addLog}
            />
          )}
          {activeTab === "controls" && (
            <GenericManager
              data={controls}
              setData={createFirebaseSetter("controls", setControls)}
              title="PROSEDUR KONTROL MITIGASI"
              prefix="CTRL"
              color={COLORS.green}
              role={role}
              playUISound={playUISound}
              addLog={addLog}
            />
          )}
          {activeTab === "risks" && (
            <RiskManager
              risks={risks}
              setRisks={createFirebaseSetter("risks", setRisks)}
              controls={controls}
              setControls={createFirebaseSetter("controls", setControls)}
              role={role}
              playUISound={playUISound}
              addLog={addLog}
            />
          )}
          {activeTab === "export" && (
            <ExportCenter
              assets={assets}
              vulnerabilities={vulnerabilities}
              threats={threats}
              controls={controls}
              impactMap={impactMap}
              threatImpMap={threatImpMap}
              controlValMap={controlValMap}
              playUISound={playUISound}
              addLog={addLog}
            />
          )}
          {activeTab === "history" && (
            <HistoryLog logs={logs} playUISound={playUISound} />
          )}
        </main>
      </div>
    </div>
  );
}

// ==============================================================================
// 5. VIEW COMPONENTS
// ==============================================================================

function DashboardOverview({
  assets,
  vulnerabilities,
  threats,
  controls,
  risks,
  impactMap,
  threatImpMap,
  controlValMap,
}) {
  const totalAssetValue = assets.reduce(
    (sum, asset) => sum + (asset.value || 0),
    0,
  );
  const criticalRisks =
    risks?.filter((r) => r.likelihood * r.impact >= 15).length || 0;

  const assetCategoryGroups = assets.reduce((acc, asset) => {
    acc[asset.category] = (acc[asset.category] || 0) + (asset.value || 0);
    return acc;
  }, {});
  const assetPieData = Object.keys(assetCategoryGroups).map((key) => ({
    name: key,
    value: assetCategoryGroups[key],
  }));
  const PIE_COLORS = [
    COLORS.red,
    COLORS.primary,
    COLORS.yellow,
    COLORS.green,
    COLORS.blue,
  ];

  const threatBarData = [...threats]
    .map((t) => ({
      name: t.name.length > 25 ? t.name.substring(0, 25) + "..." : t.name,
      score: threatImpMap[t.id] || 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return (
    <div className="dashboard-content animate-fade-in">
      <div className="header-section">
        <h1
          className="main-title glitch-text"
          data-text="SMA COMMAND & CONTROL"
        >
          SMA COMMAND & CONTROL
        </h1>
        <p className="sub-title">
          Pemantauan Metrik Keamanan & Operasional Tambang Waktu Nyata.
        </p>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card glow-effect">
          <span className="kpi-label">TOTAL VALUASI ASET</span>
          <span className="kpi-value primary-color">
            {formatIDR(totalAssetValue)}
          </span>
        </div>
        <div
          className="kpi-card glow-effect"
          style={{ borderLeftColor: COLORS.primary }}
        >
          <span className="kpi-label">KERENTANAN TERDAFTAR</span>
          <span className="kpi-value" style={{ color: COLORS.primary }}>
            {vulnerabilities.length} Area Kritis
          </span>
        </div>
        <div
          className="kpi-card glow-effect"
          style={{ borderLeftColor: COLORS.red }}
        >
          <span className="kpi-label">RISIKO KRITIS</span>
          <span className="kpi-value" style={{ color: COLORS.red }}>
            {criticalRisks} Skenario
          </span>
        </div>
        <div
          className="kpi-card glow-effect"
          style={{ borderLeftColor: COLORS.green }}
        >
          <span className="kpi-label">KONTROL MITIGASI</span>
          <span className="kpi-value" style={{ color: COLORS.green }}>
            {controls.length} Prosedur
          </span>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 2fr",
          gap: "25px",
          marginBottom: "25px",
        }}
      >
        <div
          className="dashboard-card glow-effect"
          style={{ display: "flex", flexDirection: "column" }}
        >
          <div className="card-header">
            <h3 className="card-title">Distribusi Kategori Aset</h3>
          </div>
          <div
            className="chart-wrapper"
            style={{
              flexGrow: 1,
              minHeight: "300px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetPieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {assetPieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(value) => formatIDR(value)}
                  contentStyle={{
                    backgroundColor: "rgba(10,11,12,0.9)",
                    border: `1px solid ${COLORS.primary}`,
                    borderRadius: "4px",
                    color: "#fff",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ color: COLORS.white, fontSize: "11px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          className="dashboard-card glow-effect"
          style={{
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div className="card-header">
            <h3 className="card-title">
              Prioritas Ancaman Tertinggi (Top 5 Threats)
            </h3>
          </div>
          <p
            style={{
              fontSize: "11px",
              color: "#888",
              marginTop: "-10px",
              marginBottom: "15px",
            }}
          >
            Berdasarkan kalkulasi otomatis dari Matriks 2 (Kerentanan × Dampak
            Aset).
          </p>
          <div
            className="chart-wrapper"
            style={{ flexGrow: 1, minHeight: "300px" }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={threatBarData}
                layout="vertical"
                margin={{ top: 10, right: 100, left: 10, bottom: 10 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={true}
                  vertical={false}
                  stroke="rgba(255,255,255,0.05)"
                />
                <XAxis type="number" hide domain={[0, "dataMax * 1.2"]} />
                <YAxis dataKey="name" type="category" hide />
                <RechartsTooltip
                  cursor={{ fill: "rgba(229,57,53,0.1)" }}
                  formatter={(value) => formatNilai(value)}
                  contentStyle={{
                    backgroundColor: "rgba(10,11,12,0.9)",
                    border: `1px solid ${COLORS.red}`,
                    borderRadius: "4px",
                    color: "#fff",
                  }}
                />
                <Bar
                  dataKey="score"
                  fill={COLORS.red}
                  barSize={35}
                  radius={[0, 4, 4, 0]}
                >
                  <LabelList
                    dataKey="name"
                    position="insideLeft"
                    style={{
                      fill: COLORS.white,
                      fontSize: 12,
                      fontWeight: "bold",
                      paddingLeft: "10px",
                    }}
                  />
                  <LabelList
                    dataKey="score"
                    position="right"
                    style={{
                      fill: COLORS.red,
                      fontSize: 13,
                      fontWeight: "bold",
                    }}
                    formatter={(val) => formatNilai(val)}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// MATRIX ENGINE
// ---------------------------------------------------------
function MatrixEngine({
  assets,
  vulnerabilities,
  threats,
  controls,
  matrix1Scores,
  matrix2Scores,
  matrix3Scores,
  impactMap,
  threatImpMap,
  controlValMap,
  role,
  playUISound,
  addLog,
}) {
  const isEditable = role !== "viewer";

  const toggleScoreDirect = (
    matrixNodePath,
    rowId,
    colId,
    currentScore,
    matrixName,
  ) => {
    if (!isEditable) return;
    playUISound("click");
    const nextScore = ((currentScore || 0) + 1) % 4;

    try {
      set(ref(db, `${matrixNodePath}/${rowId}/${colId}`), nextScore)
        .then(() => {
          console.log(`[SUKSES] Korelasi ${matrixName} tersimpan.`);
        })
        .catch((error) => {
          console.error(`[ERROR] Firebase menolak data ${matrixName}:`, error);
          alert(
            "Gagal sinkronisasi data dengan server! Pastikan koneksi stabil.",
          );
        });

      if (addLog) {
        addLog(
          "MATRIX",
          `Pembaruan Skor ${matrixName}`,
          `Mengubah korelasi antara baris [${rowId}] dan kolom [${colId}] menjadi ${nextScore}.`,
        );
      }
    } catch (e) {
      console.error("Kesalahan internal saat manipulasi matriks:", e);
    }
  };

  const EditableCell = ({ score, colorStr, onToggle, isEditable }) => {
    if (!isEditable) {
      return (
        <span
          style={{
            color: score > 0 ? colorStr : "#555",
            fontWeight: score > 0 ? "bold" : "normal",
          }}
        >
          {score}
        </span>
      );
    }

    const hoverBg = colorStr + "33";
    const idleBg = score > 0 ? colorStr + "1A" : "rgba(0,0,0,0.2)";

    return (
      <div
        onClick={onToggle}
        onMouseEnter={(e) => {
          playUISound("hover");
          e.currentTarget.style.transform = "scale(1.15)";
          e.currentTarget.style.backgroundColor = hoverBg;
          e.currentTarget.style.borderColor = colorStr;
          e.currentTarget.style.boxShadow = `0 0 10px ${colorStr}66`;
          e.currentTarget.style.color = "#fff";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.backgroundColor = idleBg;
          e.currentTarget.style.borderColor = score > 0 ? colorStr : "#444";
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.color = score > 0 ? colorStr : "#777";
        }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: "40px",
          height: "32px",
          borderRadius: "4px",
          backgroundColor: idleBg,
          border: `1px ${score > 0 ? "solid" : "dashed"} ${score > 0 ? colorStr : "#444"}`,
          color: score > 0 ? colorStr : "#777",
          cursor: "pointer",
          fontWeight: "bold",
          transition: "all 0.2s ease",
          userSelect: "none",
          margin: "0 auto",
        }}
        title="Klik kotak ini untuk mengubah nilai korelasi (0, 1, 2, 3)"
      >
        {score}
      </div>
    );
  };

  return (
    <div className="dashboard-content animate-fade-in">
      <div className="header-section">
        <h1 className="main-title">MESIN MATRIKS 3-TAHAP</h1>
        <p className="sub-title" style={{ color: COLORS.primary }}>
          💡 <strong>PANDUAN INTERAKTIF:</strong> Klik pada kotak bernomor di
          dalam tabel untuk mengubah nilai korelasi mitigasi (0-3).
        </p>
      </div>

      <div
        className="dashboard-card full-width-card glow-effect"
        style={{ marginBottom: "25px", padding: "20px 0" }}
      >
        <div className="card-header" style={{ padding: "0 20px" }}>
          <h3 className="card-title" style={{ color: COLORS.primary }}>
            MATRIKS 1: ASET / KERENTANAN
          </h3>
        </div>
        <div
          className="table-container"
          style={{ overflowX: "auto", padding: "0 20px" }}
        >
          <table
            className="data-table cyber-grid"
            style={{ borderCollapse: "collapse", width: "100%" }}
          >
            <thead>
              <tr>
                <th style={{ minWidth: "220px", padding: "12px" }}>
                  Kerentanan ↓ / Aset →
                </th>
                {assets.map((a) => (
                  <th
                    key={a.id}
                    style={{
                      textAlign: "center",
                      minWidth: "120px",
                      maxWidth: "150px",
                      padding: "12px",
                      verticalAlign: "middle",
                      lineHeight: "1.4",
                    }}
                  >
                    {a.name} <br />
                    <span style={{ color: "#888", fontSize: "10px" }}>
                      {formatIDR(a.value)}
                    </span>
                  </th>
                ))}
                <th
                  style={{
                    color: COLORS.primary,
                    background: "rgba(255,152,0,0.05)",
                    textAlign: "center",
                    minWidth: "150px",
                    padding: "12px",
                    verticalAlign: "middle",
                  }}
                >
                  Agregat (Dampak)
                </th>
              </tr>
              <tr style={{ backgroundColor: "rgba(255, 152, 0, 0.15)" }}>
                <td
                  style={{
                    fontStyle: "italic",
                    color: COLORS.primary,
                    padding: "12px",
                    borderBottom: "1px solid rgba(255,152,0,0.3)",
                  }}
                >
                  Input Nilai Aset &rarr;
                </td>
                {assets.map((a) => (
                  <td
                    key={a.id}
                    style={{
                      textAlign: "center",
                      fontWeight: "bold",
                      padding: "12px",
                      color: COLORS.primary,
                      borderBottom: "1px solid rgba(255,152,0,0.3)",
                    }}
                  >
                    {formatIDR(a.value)}
                  </td>
                ))}
                <td
                  style={{
                    textAlign: "center",
                    fontSize: "11px",
                    padding: "12px",
                    color: "#aaa",
                    borderBottom: "1px solid rgba(255,152,0,0.3)",
                  }}
                >
                  Σ (nilai aset × <br /> kerentanan)
                </td>
              </tr>
            </thead>
            <tbody>
              {vulnerabilities.map((v) => (
                <tr key={v.id}>
                  <td
                    style={{
                      fontWeight: "bold",
                      padding: "12px",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      verticalAlign: "middle",
                    }}
                  >
                    {v.name}
                  </td>
                  {assets.map((a) => {
                    const score = matrix1Scores[v.id]?.[a.id] || 0;
                    return (
                      <td
                        key={a.id}
                        style={{
                          textAlign: "center",
                          padding: "12px",
                          borderBottom: "1px solid rgba(255,255,255,0.05)",
                          verticalAlign: "middle",
                        }}
                      >
                        <EditableCell
                          score={score}
                          colorStr={COLORS.primary}
                          onToggle={() =>
                            toggleScoreDirect(
                              "matrix1Scores",
                              v.id,
                              a.id,
                              score,
                              "Matriks 1",
                            )
                          }
                          isEditable={isEditable}
                        />
                      </td>
                    );
                  })}
                  <td
                    style={{
                      fontWeight: "bold",
                      color: COLORS.primary,
                      textAlign: "center",
                      padding: "12px",
                      background: "rgba(255,152,0,0.05)",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      verticalAlign: "middle",
                    }}
                  >
                    {formatNilai(impactMap[v.id])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div
        className="dashboard-card full-width-card glow-effect"
        style={{
          marginBottom: "25px",
          borderLeftColor: COLORS.red,
          padding: "20px 0",
        }}
      >
        <div className="card-header" style={{ padding: "0 20px" }}>
          <h3 className="card-title" style={{ color: COLORS.red }}>
            MATRIKS 2: ANCAMAN / KERENTANAN
          </h3>
        </div>
        <div
          className="table-container"
          style={{ overflowX: "auto", padding: "0 20px" }}
        >
          <table
            className="data-table cyber-grid"
            style={{ borderCollapse: "collapse", width: "100%" }}
          >
            <thead>
              <tr>
                <th style={{ minWidth: "220px", padding: "12px" }}>
                  Ancaman ↓ / Kerentanan →
                </th>
                {vulnerabilities.map((v) => (
                  <th
                    key={v.id}
                    style={{
                      textAlign: "center",
                      minWidth: "120px",
                      maxWidth: "150px",
                      padding: "12px",
                      verticalAlign: "middle",
                      lineHeight: "1.4",
                    }}
                  >
                    {v.name}
                  </th>
                ))}
                <th
                  style={{
                    color: COLORS.red,
                    background: "rgba(229,57,53,0.05)",
                    textAlign: "center",
                    minWidth: "150px",
                    padding: "12px",
                    verticalAlign: "middle",
                  }}
                >
                  Tingkat Ancaman
                </th>
              </tr>
              <tr style={{ backgroundColor: "rgba(229, 57, 53, 0.15)" }}>
                <td
                  style={{
                    fontStyle: "italic",
                    color: COLORS.red,
                    padding: "12px",
                    borderBottom: "1px solid rgba(229,57,53,0.3)",
                  }}
                >
                  Input Agregat Dampak &rarr;
                </td>
                {vulnerabilities.map((v) => (
                  <td
                    key={v.id}
                    style={{
                      textAlign: "center",
                      fontWeight: "bold",
                      padding: "12px",
                      color: COLORS.red,
                      borderBottom: "1px solid rgba(229,57,53,0.3)",
                    }}
                  >
                    {formatNilai(impactMap[v.id])}
                  </td>
                ))}
                <td
                  style={{
                    textAlign: "center",
                    fontSize: "11px",
                    padding: "12px",
                    color: "#aaa",
                    borderBottom: "1px solid rgba(229,57,53,0.3)",
                  }}
                >
                  Σ (dampak × <br /> nilai ancaman)
                </td>
              </tr>
            </thead>
            <tbody>
              {threats.map((t) => (
                <tr key={t.id}>
                  <td
                    style={{
                      fontWeight: "bold",
                      padding: "12px",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      verticalAlign: "middle",
                    }}
                  >
                    {t.name}
                  </td>
                  {vulnerabilities.map((v) => {
                    const score = matrix2Scores[t.id]?.[v.id] || 0;
                    return (
                      <td
                        key={v.id}
                        style={{
                          textAlign: "center",
                          padding: "12px",
                          borderBottom: "1px solid rgba(255,255,255,0.05)",
                          verticalAlign: "middle",
                        }}
                      >
                        <EditableCell
                          score={score}
                          colorStr={COLORS.red}
                          onToggle={() =>
                            toggleScoreDirect(
                              "matrix2Scores",
                              t.id,
                              v.id,
                              score,
                              "Matriks 2",
                            )
                          }
                          isEditable={isEditable}
                        />
                      </td>
                    );
                  })}
                  <td
                    style={{
                      fontWeight: "bold",
                      color: COLORS.red,
                      textAlign: "center",
                      padding: "12px",
                      background: "rgba(229,57,53,0.05)",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      verticalAlign: "middle",
                    }}
                  >
                    {formatNilai(threatImpMap[t.id])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div
        className="dashboard-card full-width-card glow-effect"
        style={{ borderLeftColor: COLORS.green, padding: "20px 0" }}
      >
        <div className="card-header" style={{ padding: "0 20px" }}>
          <h3 className="card-title" style={{ color: COLORS.green }}>
            MATRIKS 3: KONTROL / ANCAMAN
          </h3>
        </div>
        <div
          className="table-container"
          style={{ overflowX: "auto", padding: "0 20px" }}
        >
          <table
            className="data-table cyber-grid"
            style={{ borderCollapse: "collapse", width: "100%" }}
          >
            <thead>
              <tr>
                <th style={{ minWidth: "220px", padding: "12px" }}>
                  Kontrol ↓ / Ancaman →
                </th>
                {threats.map((t) => (
                  <th
                    key={t.id}
                    style={{
                      textAlign: "center",
                      minWidth: "120px",
                      maxWidth: "150px",
                      padding: "12px",
                      verticalAlign: "middle",
                      lineHeight: "1.4",
                    }}
                  >
                    {t.name}
                  </th>
                ))}
                <th
                  style={{
                    color: COLORS.green,
                    background: "rgba(76,175,80,0.05)",
                    textAlign: "center",
                    minWidth: "150px",
                    padding: "12px",
                    verticalAlign: "middle",
                  }}
                >
                  Efektivitas Kontrol
                </th>
              </tr>
              <tr style={{ backgroundColor: "rgba(76, 175, 80, 0.15)" }}>
                <td
                  style={{
                    fontStyle: "italic",
                    color: COLORS.green,
                    padding: "12px",
                    borderBottom: "1px solid rgba(76,175,80,0.3)",
                  }}
                >
                  Input Tingkat Ancaman &rarr;
                </td>
                {threats.map((t) => (
                  <td
                    key={t.id}
                    style={{
                      textAlign: "center",
                      fontWeight: "bold",
                      padding: "12px",
                      color: COLORS.green,
                      borderBottom: "1px solid rgba(76,175,80,0.3)",
                    }}
                  >
                    {formatNilai(threatImpMap[t.id])}
                  </td>
                ))}
                <td
                  style={{
                    textAlign: "center",
                    fontSize: "11px",
                    padding: "12px",
                    color: "#aaa",
                    borderBottom: "1px solid rgba(76,175,80,0.3)",
                  }}
                >
                  Σ (ancaman ×<br /> kontrol)
                </td>
              </tr>
            </thead>
            <tbody>
              {controls.map((c) => (
                <tr key={c.id}>
                  <td
                    style={{
                      fontWeight: "bold",
                      padding: "12px",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      verticalAlign: "middle",
                    }}
                  >
                    {c.name}
                  </td>
                  {threats.map((t) => {
                    const score = matrix3Scores[c.id]?.[t.id] || 0;
                    return (
                      <td
                        key={t.id}
                        style={{
                          textAlign: "center",
                          padding: "12px",
                          borderBottom: "1px solid rgba(255,255,255,0.05)",
                          verticalAlign: "middle",
                        }}
                      >
                        <EditableCell
                          score={score}
                          colorStr={COLORS.green}
                          onToggle={() =>
                            toggleScoreDirect(
                              "matrix3Scores",
                              c.id,
                              t.id,
                              score,
                              "Matriks 3",
                            )
                          }
                          isEditable={isEditable}
                        />
                      </td>
                    );
                  })}
                  <td
                    style={{
                      fontWeight: "bold",
                      color: COLORS.green,
                      textAlign: "center",
                      padding: "12px",
                      background: "rgba(76,175,80,0.05)",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      verticalAlign: "middle",
                    }}
                  >
                    {formatNilai(controlValMap[c.id])}
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

// ---------------------------------------------------------
// HALAMAN: MANAJEMEN RISIKO (LIKELIHOOD x IMPACT)
// ---------------------------------------------------------
function RiskManager({
  risks,
  setRisks,
  controls,
  setControls,
  role,
  playUISound,
  addLog,
}) {
  const [newRisk, setNewRisk] = useState({
    name: "",
    likelihood: 1,
    impact: 1,
    mitigation: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  const getRiskStatus = (likelihood, impact) => {
    const score = likelihood * impact;
    if (score <= 4) return { label: "RENDAH", color: "#4CAF50", score };
    if (score <= 9) return { label: "SEDANG", color: "#FFC107", score };
    if (score <= 14) return { label: "TINGGI", color: "#FF9800", score };
    return { label: "KRITIS", color: "#E53935", score };
  };

  const handleAddRisk = (e) => {
    e.preventDefault();
    playUISound("alert");

    const nextRiskIdNum =
      risks.length > 0
        ? Math.max(...risks.map((r) => parseInt(r.id.split("-")[1]) || 0)) + 1
        : 1;
    const formattedRiskId = `RSK-${nextRiskIdNum.toString().padStart(2, "0")}`;

    const itemToAdd = {
      id: formattedRiskId,
      name: newRisk.name,
      likelihood: parseInt(newRisk.likelihood),
      impact: parseInt(newRisk.impact),
      mitigation: newRisk.mitigation || "-",
    };

    setRisks([...risks, itemToAdd]);
    addLog(
      "CREATE",
      "Skenario Risiko Baru",
      `Risiko [${formattedRiskId}] didaftarkan dengan skala ${itemToAdd.likelihood}x${itemToAdd.impact}.`,
    );

    if (
      newRisk.mitigation &&
      newRisk.mitigation.trim() !== "" &&
      newRisk.mitigation !== "-"
    ) {
      const isControlExists = controls.some(
        (c) => c.name.toLowerCase() === newRisk.mitigation.trim().toLowerCase(),
      );
      if (!isControlExists) {
        const nextCtrlIdNum =
          controls.length > 0
            ? Math.max(
                ...controls.map((c) => parseInt(c.id.split("-")[1]) || 0),
              ) + 1
            : 1;
        const formattedCtrlId = `CTRL-${nextCtrlIdNum.toString().padStart(2, "0")}`;
        setControls([
          ...controls,
          { id: formattedCtrlId, name: newRisk.mitigation.trim() },
        ]);
        addLog(
          "CREATE",
          "Kontrol Otomatis Ditambahkan",
          `Kontrol baru [${formattedCtrlId}] dibuat dari skenario Risiko [${formattedRiskId}].`,
        );
      }
    }

    setNewRisk({ name: "", likelihood: 1, impact: 1, mitigation: "" });
  };

  const handleEditClick = (risk) => {
    playUISound("hover");
    setEditingId(risk.id);
    setEditFormData(risk);
  };

  const handleSaveEdit = () => {
    playUISound("click");
    setRisks(
      risks.map((r) =>
        r.id === editingId
          ? {
              ...editFormData,
              likelihood: parseInt(editFormData.likelihood),
              impact: parseInt(editFormData.impact),
            }
          : r,
      ),
    );

    if (
      editFormData.mitigation &&
      editFormData.mitigation.trim() !== "" &&
      editFormData.mitigation !== "-"
    ) {
      const isControlExists = controls.some(
        (c) =>
          c.name.toLowerCase() === editFormData.mitigation.trim().toLowerCase(),
      );
      if (!isControlExists) {
        const nextCtrlIdNum =
          controls.length > 0
            ? Math.max(
                ...controls.map((c) => parseInt(c.id.split("-")[1]) || 0),
              ) + 1
            : 1;
        const formattedCtrlId = `CTRL-${nextCtrlIdNum.toString().padStart(2, "0")}`;
        setControls([
          ...controls,
          { id: formattedCtrlId, name: editFormData.mitigation.trim() },
        ]);
        addLog(
          "CREATE",
          "Kontrol Otomatis",
          `Kontrol mitigasi baru otomatis ditambahkan dari hasil edit risiko [${editingId}].`,
        );
      }
    }

    addLog(
      "UPDATE",
      "Skenario Risiko Diperbarui",
      `Informasi risiko [${editingId}] telah diubah.`,
    );
    setEditingId(null);
  };

  const handleDeleteRisk = (id, name) => {
    if (window.confirm(`Hapus Skenario Risiko '${name}' dari sistem?`)) {
      playUISound("click");
      setRisks(risks.filter((r) => r.id !== id));
      addLog(
        "DELETE",
        "Skenario Risiko Dihapus",
        `Risiko [${id}] dihapus dari sistem.`,
      );
    }
  };

  return (
    <div className="dashboard-content animate-fade-in">
      <div className="header-section">
        <h1 className="main-title" style={{ color: COLORS.red }}>
          ANALISIS & MANAJEMEN RISIKO
        </h1>
        <p className="sub-title">
          Evaluasi Probabilitas (Likelihood) dan Dampak (Impact) berdasarkan
          skala 1 - 5. Tindakan Mitigasi akan otomatis terdaftar ke menu
          Kontrol.
        </p>
      </div>

      {role !== "viewer" && (
        <div
          className="dashboard-card full-width-card glow-effect"
          style={{ marginBottom: "20px", borderTop: `2px solid ${COLORS.red}` }}
        >
          <form
            onSubmit={handleAddRisk}
            className="crud-form"
            style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}
          >
            <input
              type="text"
              placeholder="Deskripsi Skenario Risiko..."
              value={newRisk.name}
              onChange={(e) => setNewRisk({ ...newRisk, name: e.target.value })}
              onFocus={() => playUISound("hover")}
              className="cyber-input"
              style={{ flexGrow: 1, minWidth: "250px" }}
              required
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "rgba(0,0,0,0.5)",
                padding: "10px",
                borderRadius: "4px",
                border: "1px solid #333",
              }}
            >
              <label style={{ color: "#aaa", fontSize: "12px" }}>
                Likelihood (1-5):
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={newRisk.likelihood}
                onChange={(e) =>
                  setNewRisk({ ...newRisk, likelihood: e.target.value })
                }
                onFocus={() => playUISound("hover")}
                className="cyber-input"
                style={{ width: "60px", textAlign: "center" }}
                required
              />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "rgba(0,0,0,0.5)",
                padding: "10px",
                borderRadius: "4px",
                border: "1px solid #333",
              }}
            >
              <label style={{ color: "#aaa", fontSize: "12px" }}>
                Impact (1-5):
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={newRisk.impact}
                onChange={(e) =>
                  setNewRisk({ ...newRisk, impact: e.target.value })
                }
                onFocus={() => playUISound("hover")}
                className="cyber-input"
                style={{ width: "60px", textAlign: "center" }}
                required
              />
            </div>
            <input
              type="text"
              placeholder="Tindakan Mitigasi (Otomatis ke Kontrol)..."
              value={newRisk.mitigation}
              onChange={(e) =>
                setNewRisk({ ...newRisk, mitigation: e.target.value })
              }
              onFocus={() => playUISound("hover")}
              className="cyber-input"
              style={{ flexGrow: 1, minWidth: "250px" }}
            />
            <button
              type="submit"
              className="action-btn"
              style={{
                backgroundColor: COLORS.red,
                color: "#fff",
                fontWeight: "bold",
              }}
              onMouseEnter={() => playUISound("hover")}
            >
              + EVALUASI RISIKO
            </button>
          </form>
        </div>
      )}

      <div className="dashboard-card full-width-card glow-effect">
        <table className="data-table cyber-grid">
          <thead>
            <tr>
              <th>ID</th>
              <th style={{ width: "30%" }}>Skenario Risiko</th>
              <th style={{ textAlign: "center" }}>Likelihood</th>
              <th style={{ textAlign: "center" }}>Impact</th>
              <th style={{ textAlign: "center" }}>Risk Level</th>
              <th>Saran Mitigasi</th>
              {role !== "viewer" && (
                <th style={{ textAlign: "center", width: "140px" }}>Aksi</th>
              )}
            </tr>
          </thead>
          <tbody>
            {risks.length === 0 ? (
              <tr>
                <td
                  colSpan={role !== "viewer" ? 7 : 6}
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    color: "#666",
                  }}
                >
                  Belum ada data risiko terdaftar.
                </td>
              </tr>
            ) : (
              risks.map((r) => {
                const status = getRiskStatus(r.likelihood, r.impact);

                if (editingId === r.id) {
                  return (
                    <tr
                      key={r.id}
                      style={{ backgroundColor: "rgba(229, 57, 53, 0.1)" }}
                    >
                      <td
                        style={{
                          color: COLORS.red,
                          fontFamily: "monospace",
                          fontWeight: "bold",
                        }}
                      >
                        {r.id}
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editFormData.name}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              name: e.target.value,
                            })
                          }
                          className="cyber-input"
                          style={{
                            padding: "6px",
                            width: "95%",
                            borderColor: COLORS.red,
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={editFormData.likelihood}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              likelihood: e.target.value,
                            })
                          }
                          className="cyber-input"
                          style={{
                            padding: "6px",
                            width: "100%",
                            textAlign: "center",
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={editFormData.impact}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              impact: e.target.value,
                            })
                          }
                          className="cyber-input"
                          style={{
                            padding: "6px",
                            width: "100%",
                            textAlign: "center",
                          }}
                        />
                      </td>
                      <td
                        style={{
                          textAlign: "center",
                          color: "#888",
                          fontSize: "11px",
                        }}
                      >
                        Otomatis Dihitung
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editFormData.mitigation}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              mitigation: e.target.value,
                            })
                          }
                          className="cyber-input"
                          style={{ padding: "6px", width: "95%" }}
                        />
                      </td>
                      {role !== "viewer" && (
                        <td
                          style={{
                            display: "flex",
                            gap: "8px",
                            justifyContent: "center",
                          }}
                        >
                          <button
                            onClick={handleSaveEdit}
                            className="action-btn"
                            style={{
                              padding: "4px 10px",
                              background: COLORS.green,
                              color: "#000",
                              fontWeight: "bold",
                            }}
                          >
                            Simpan
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="action-btn"
                            style={{
                              padding: "4px 10px",
                              background: "#444",
                              color: "#fff",
                            }}
                          >
                            Batal
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                }

                return (
                  <tr key={r.id}>
                    <td
                      style={{
                        color: COLORS.red,
                        fontFamily: "monospace",
                        fontWeight: "bold",
                      }}
                    >
                      {r.id}
                    </td>
                    <td style={{ fontWeight: "bold", color: "#ddd" }}>
                      {r.name}
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        color: "#aaa",
                        fontSize: "16px",
                        fontWeight: "bold",
                      }}
                    >
                      {r.likelihood}
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        color: "#aaa",
                        fontSize: "16px",
                        fontWeight: "bold",
                      }}
                    >
                      {r.impact}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div
                        style={{
                          background: `${status.color}22`,
                          border: `1px solid ${status.color}`,
                          color: status.color,
                          padding: "5px 10px",
                          borderRadius: "4px",
                          fontWeight: "bold",
                          display: "inline-block",
                          fontSize: "12px",
                          width: "80px",
                        }}
                      >
                        {status.score} - {status.label}
                      </div>
                    </td>
                    <td
                      style={{
                        color: "#aaa",
                        fontSize: "13px",
                        fontStyle: "italic",
                      }}
                    >
                      {r.mitigation}
                    </td>
                    {role !== "viewer" && (
                      <td
                        style={{
                          display: "flex",
                          gap: "8px",
                          justifyContent: "center",
                        }}
                      >
                        <button
                          onClick={() => handleEditClick(r)}
                          className="action-btn"
                          style={{
                            padding: "4px 10px",
                            background: "transparent",
                            border: `1px solid ${COLORS.primary}`,
                            color: COLORS.primary,
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteRisk(r.id, r.name)}
                          className="action-btn"
                          style={{
                            padding: "4px 10px",
                            background: "transparent",
                            border: `1px solid ${COLORS.red}`,
                            color: COLORS.red,
                          }}
                        >
                          Hapus
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// ASSET MANAGER
// ---------------------------------------------------------
function AssetManager({ assets, setAssets, role, playUISound, addLog }) {
  const [newAsset, setNewAsset] = useState({
    name: "",
    value: "",
    category: "Perangkat Keras",
  });
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  const handleAddAsset = (e) => {
    e.preventDefault();
    playUISound("alert");
    const nextIdNum =
      assets.length > 0
        ? Math.max(...assets.map((a) => parseInt(a.id.split("-")[1]) || 0)) + 1
        : 1;
    const formattedId = `AST-${nextIdNum.toString().padStart(2, "0")}`;
    const assetToAdd = {
      ...newAsset,
      id: formattedId,
      value: parseFloat(newAsset.value),
    };
    setAssets([...assets, assetToAdd]);
    addLog(
      "CREATE",
      "Aset Ditambahkan",
      `Aset baru [${formattedId}] '${assetToAdd.name}' didaftarkan ke sistem.`,
    );
    setNewAsset({ name: "", value: "", category: "Perangkat Keras" });
  };

  const handleEditClick = (asset) => {
    playUISound("hover");
    setEditingId(asset.id);
    setEditFormData(asset);
  };

  const handleSaveEdit = () => {
    playUISound("click");
    setAssets(
      assets.map((a) =>
        a.id === editingId
          ? { ...editFormData, value: parseFloat(editFormData.value) }
          : a,
      ),
    );
    addLog(
      "UPDATE",
      "Aset Diperbarui",
      `Informasi aset [${editingId}] telah diubah.`,
    );
    setEditingId(null);
  };

  const handleDeleteAsset = (id, name) => {
    if (
      window.confirm(
        `Peringatan: Apakah Anda yakin ingin menghapus aset '${name}' dari sistem?`,
      )
    ) {
      playUISound("click");
      setAssets(assets.filter((a) => a.id !== id));
      addLog("DELETE", "Aset Dihapus", `Aset [${id}] dihapus dari sistem.`);
    }
  };

  return (
    <div className="dashboard-content animate-fade-in">
      <div className="header-section">
        <h1 className="main-title">MANAJEMEN ASET</h1>
      </div>
      {role !== "viewer" && (
        <div
          className="dashboard-card full-width-card glow-effect"
          style={{ marginBottom: "20px", minHeight: "auto" }}
        >
          <form onSubmit={handleAddAsset} className="crud-form">
            <input
              type="text"
              placeholder="Nama/Deskripsi Aset Baru..."
              value={newAsset.name}
              onChange={(e) =>
                setNewAsset({ ...newAsset, name: e.target.value })
              }
              onFocus={() => playUISound("hover")}
              className="cyber-input"
              required
            />
            <input
              type="number"
              placeholder="Valuasi Rp (Cth: 5000 Juta)"
              value={newAsset.value}
              onChange={(e) =>
                setNewAsset({ ...newAsset, value: e.target.value })
              }
              onFocus={() => playUISound("hover")}
              className="cyber-input"
              required
            />
            <select
              value={newAsset.category}
              onChange={(e) =>
                setNewAsset({ ...newAsset, category: e.target.value })
              }
              onFocus={() => playUISound("hover")}
              className="cyber-select"
            >
              <option value="Perangkat Keras">
                Perangkat Keras (Alat/Server)
              </option>
              <option value="Fisik">Fisik (Alat Berat/Fasilitas)</option>
              <option value="Basis Data">Basis Data</option>
              <option value="Finansial">Finansial / Pendapatan</option>
              <option value="Sertifikasi">Sertifikasi / Reputasi</option>
            </select>
            <button
              type="submit"
              className="action-btn add-btn"
              onMouseEnter={() => playUISound("hover")}
            >
              + TAMBAH ASET
            </button>
          </form>
        </div>
      )}
      <div className="dashboard-card full-width-card glow-effect">
        <table className="data-table cyber-grid">
          <thead>
            <tr>
              <th>ID Aset</th>
              <th>Nama Aset</th>
              <th>Kategori</th>
              <th>Valuasi (Dalam Jutaan)</th>
              {role !== "viewer" && (
                <th style={{ width: "140px", textAlign: "center" }}>Aksi</th>
              )}
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) =>
              editingId === asset.id ? (
                <tr
                  key={asset.id}
                  style={{ backgroundColor: "rgba(255,152,0,0.1)" }}
                >
                  <td
                    style={{
                      color: COLORS.primary,
                      fontFamily: "monospace",
                      fontWeight: "bold",
                    }}
                  >
                    {asset.id}
                  </td>
                  <td>
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          name: e.target.value,
                        })
                      }
                      className="cyber-input"
                      style={{ padding: "6px", width: "90%" }}
                    />
                  </td>
                  <td>
                    <select
                      value={editFormData.category}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          category: e.target.value,
                        })
                      }
                      className="cyber-select"
                      style={{ padding: "6px", width: "90%" }}
                    >
                      <option value="Perangkat Keras">Perangkat Keras</option>
                      <option value="Fisik">Fisik</option>
                      <option value="Basis Data">Basis Data</option>
                      <option value="Finansial">Finansial</option>
                      <option value="Sertifikasi">Sertifikasi</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      value={editFormData.value}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          value: e.target.value,
                        })
                      }
                      className="cyber-input"
                      style={{ padding: "6px", width: "90%" }}
                    />
                  </td>
                  {role !== "viewer" && (
                    <td
                      style={{
                        display: "flex",
                        gap: "8px",
                        justifyContent: "center",
                      }}
                    >
                      <button
                        onClick={handleSaveEdit}
                        className="action-btn"
                        style={{
                          padding: "4px 10px",
                          background: COLORS.green,
                          color: "#000",
                          fontWeight: "bold",
                        }}
                      >
                        Simpan
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="action-btn"
                        style={{
                          padding: "4px 10px",
                          background: "#444",
                          color: "#fff",
                        }}
                      >
                        Batal
                      </button>
                    </td>
                  )}
                </tr>
              ) : (
                <tr key={asset.id}>
                  <td
                    style={{
                      color: COLORS.primary,
                      fontFamily: "monospace",
                      fontWeight: "bold",
                    }}
                  >
                    {asset.id}
                  </td>
                  <td style={{ fontWeight: "bold", color: "#ddd" }}>
                    {asset.name}
                  </td>
                  <td style={{ color: "#aaa" }}>{asset.category}</td>
                  <td style={{ color: COLORS.green, fontWeight: "bold" }}>
                    {formatIDR(asset.value)}
                  </td>
                  {role !== "viewer" && (
                    <td
                      style={{
                        display: "flex",
                        gap: "8px",
                        justifyContent: "center",
                      }}
                    >
                      <button
                        onClick={() => handleEditClick(asset)}
                        className="action-btn"
                        style={{
                          padding: "4px 10px",
                          background: "transparent",
                          border: `1px solid ${COLORS.primary}`,
                          color: COLORS.primary,
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteAsset(asset.id, asset.name)}
                        className="action-btn"
                        style={{
                          padding: "4px 10px",
                          background: "transparent",
                          border: `1px solid ${COLORS.red}`,
                          color: COLORS.red,
                        }}
                      >
                        Hapus
                      </button>
                    </td>
                  )}
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GenericManager({
  data,
  setData,
  title,
  prefix,
  color,
  role,
  playUISound,
  addLog,
}) {
  const [newItem, setNewItem] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newItem) return;
    playUISound("alert");
    const nextIdNum =
      data.length > 0
        ? Math.max(...data.map((d) => parseInt(d.id.split("-")[1]) || 0)) + 1
        : 1;
    const formattedId = `${prefix}-${nextIdNum.toString().padStart(2, "0")}`;
    const itemToAdd = { id: formattedId, name: newItem };
    setData([...data, itemToAdd]);
    addLog(
      "CREATE",
      "Data Baru Ditambahkan",
      `Item baru [${formattedId}] didaftarkan pada kategori ${title}.`,
    );
    setNewItem("");
  };

  const handleEditClick = (item) => {
    playUISound("hover");
    setEditingId(item.id);
    setEditFormData(item);
  };

  const handleSaveEdit = () => {
    playUISound("click");
    setData(data.map((d) => (d.id === editingId ? editFormData : d)));
    addLog(
      "UPDATE",
      "Data Diperbarui",
      `Informasi item [${editingId}] pada kategori ${title} telah diubah.`,
    );
    setEditingId(null);
  };

  const handleDelete = (id, name) => {
    if (
      window.confirm(
        `Peringatan: Apakah Anda yakin ingin menghapus data '${name}' dari sistem? Semua matriks terkait akan diperbarui otomatis.`,
      )
    ) {
      playUISound("click");
      setData(data.filter((d) => d.id !== id));
      addLog(
        "DELETE",
        "Data Dihapus",
        `Item [${id}] dihapus dari kategori ${title}.`,
      );
    }
  };

  return (
    <div className="dashboard-content animate-fade-in">
      <div className="header-section">
        <h1 className="main-title" style={{ color: color }}>
          {title}
        </h1>
      </div>
      {role !== "viewer" && (
        <div
          className="dashboard-card full-width-card glow-effect"
          style={{
            marginBottom: "20px",
            minHeight: "auto",
            borderTop: `1px solid ${color}`,
          }}
        >
          <form onSubmit={handleAdd} className="crud-form">
            <input
              type="text"
              placeholder={`Tambah Data Baru...`}
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onFocus={() => playUISound("hover")}
              className="cyber-input"
              style={{ borderColor: color }}
              required
            />
            <button
              type="submit"
              className="action-btn"
              style={{
                backgroundColor: color,
                color: "#000",
                fontWeight: "bold",
              }}
              onMouseEnter={() => playUISound("hover")}
            >
              + TAMBAH DATA
            </button>
          </form>
        </div>
      )}
      <div className="dashboard-card full-width-card glow-effect">
        <table className="data-table cyber-grid">
          <thead>
            <tr>
              <th>ID Registrasi</th>
              <th>Deskripsi Detail</th>
              {role !== "viewer" && (
                <th style={{ width: "140px", textAlign: "center" }}>Aksi</th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((item) =>
              editingId === item.id ? (
                <tr key={item.id} style={{ backgroundColor: `${color}1A` }}>
                  <td
                    style={{
                      color: color,
                      fontFamily: "monospace",
                      fontWeight: "bold",
                    }}
                  >
                    {item.id}
                  </td>
                  <td>
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          name: e.target.value,
                        })
                      }
                      className="cyber-input"
                      style={{
                        padding: "6px",
                        width: "90%",
                        borderColor: color,
                      }}
                    />
                  </td>
                  {role !== "viewer" && (
                    <td
                      style={{
                        display: "flex",
                        gap: "8px",
                        justifyContent: "center",
                      }}
                    >
                      <button
                        onClick={handleSaveEdit}
                        className="action-btn"
                        style={{
                          padding: "4px 10px",
                          background: color,
                          color: "#000",
                          fontWeight: "bold",
                        }}
                      >
                        Simpan
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="action-btn"
                        style={{
                          padding: "4px 10px",
                          background: "#444",
                          color: "#fff",
                        }}
                      >
                        Batal
                      </button>
                    </td>
                  )}
                </tr>
              ) : (
                <tr key={item.id}>
                  <td
                    style={{
                      color: color,
                      fontFamily: "monospace",
                      fontWeight: "bold",
                    }}
                  >
                    {item.id}
                  </td>
                  <td style={{ fontWeight: "bold", color: "#ddd" }}>
                    {item.name}
                  </td>
                  {role !== "viewer" && (
                    <td
                      style={{
                        display: "flex",
                        gap: "8px",
                        justifyContent: "center",
                      }}
                    >
                      <button
                        onClick={() => handleEditClick(item)}
                        className="action-btn"
                        style={{
                          padding: "4px 10px",
                          background: "transparent",
                          border: `1px solid ${color}`,
                          color: color,
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.name)}
                        className="action-btn"
                        style={{
                          padding: "4px 10px",
                          background: "transparent",
                          border: `1px solid ${COLORS.red}`,
                          color: COLORS.red,
                        }}
                      >
                        Hapus
                      </button>
                    </td>
                  )}
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// === KOMPONEN EKSPOR ===
function ExportCenter({
  assets,
  vulnerabilities,
  threats,
  controls,
  impactMap,
  threatImpMap,
  controlValMap,
  playUISound,
  addLog,
}) {
  const exportToExcel = () => {
    playUISound("click");
    const wb = utils.book_new();
    utils.book_append_sheet(wb, utils.json_to_sheet(assets), "Data_Aset");
    utils.book_append_sheet(
      wb,
      utils.json_to_sheet(vulnerabilities),
      "Data_Kerentanan",
    );
    utils.book_append_sheet(wb, utils.json_to_sheet(threats), "Data_Ancaman");
    utils.book_append_sheet(wb, utils.json_to_sheet(controls), "Data_Kontrol");
    writeFile(wb, "Database_Risiko_SMA_Mining.xlsx");
    addLog(
      "EXPORT",
      "Ekspor Dokumen Excel",
      "Pengguna mengunduh database mentah (XLSX).",
    );
  };

  const exportToPDF = () => {
    try {
      playUISound("click");
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.setTextColor(255, 152, 0);
      doc.text("LAPORAN KOMPREHENSIF MANAJEMEN RISIKO", 14, 20);
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text("PT. SAMUDRA MULYA ABADI (SMA MINING)", 14, 28);
      doc.setFontSize(10);
      doc.text(`Dicetak pada: ${new Date().toLocaleString()}`, 14, 34);

      let currentY = 45;
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text("1. REGISTRI ASET", 14, currentY);
      autoTable(doc, {
        startY: currentY + 5,
        head: [["ID Aset", "Nama Aset", "Kategori", "Valuasi"]],
        body: assets.map((a) => [a.id, a.name, a.category, formatIDR(a.value)]),
        headStyles: { fillColor: [255, 152, 0] },
      });
      doc.save("Laporan_Manajemen_Risiko.pdf");
      addLog(
        "EXPORT",
        "Ekspor Dokumen PDF",
        "Pengguna mengunduh Laporan Komprehensif Manajemen Risiko (PDF).",
      );
    } catch (err) {
      console.error(err);
      alert(
        "Gagal mengunduh PDF. Pastikan jspdf-autotable terhubung dengan baik.",
      );
    }
  };

  const topThreats = [...threats]
    .map((t) => ({ ...t, score: threatImpMap[t.id] || 0 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const handlePrintSummary = () => {
    playUISound("click");
    addLog(
      "EXPORT",
      "Cetak Dokumen Terisolasi",
      "Pengguna mencetak Laporan Ringkasan Eksekutif.",
    );
    const printWindow = window.open("", "", "height=800,width=800");
    let html = `
      <html>
        <head>
          <title>Ringkasan Manajemen Risiko SMA Mining</title>
          <style>
            body { font-family: 'Arial', sans-serif; padding: 40px; color: #333; }
            h2 { color: #333; border-bottom: 2px solid #FF9800; padding-bottom: 10px; margin-bottom: 30px;}
            h3 { color: #555; }
            ul { list-style: none; padding: 0; }
            li { padding: 15px; margin-bottom: 10px; border: 1px solid #ddd; border-left: 6px solid #FF9800; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; background-color: #fcfcfc;}
            .high-risk { border-left-color: #E53935; background-color: #ffebee; }
            .med-risk { border-left-color: #FFC107; background-color: #fff8e1; }
            .kpi-container { display: flex; gap: 20px; margin-top: 40px; }
            .kpi-box { flex: 1; padding: 20px; border: 1px solid #ccc; border-radius: 6px; text-align: center; background-color: #f9f9f9; }
            .kpi-val { font-size: 28px; font-weight: bold; margin-top: 10px; color: #333; }
            .val-red { color: #E53935; }
            .val-green { color: #4CAF50; }
          </style>
        </head>
        <body>
          <h2>Laporan Ringkasan Cepat Manajemen Risiko</h2>
          <h3>5 Ancaman Teratas (Top Threats by Magnitude)</h3>
          <ul>
    `;
    topThreats.forEach((t) => {
      let isHigh = t.score > 10000;
      let clz = isHigh ? "high-risk" : "med-risk";
      let stat = isHigh ? "Tinggi" : "Sedang";
      html += `<li class="${clz}"><span>${t.id} - ${t.name}</span><strong>Skor: ${formatNilai(t.score)} (${stat})</strong></li>`;
    });
    html += `
          </ul>
          <div class="kpi-container">
            <div class="kpi-box"><div>Total Aset</div><div class="kpi-val">${assets.length}</div></div>
            <div class="kpi-box"><div>Total Kerentanan</div><div class="kpi-val val-red">${vulnerabilities.length}</div></div>
            <div class="kpi-box"><div>Kontrol Aktif</div><div class="kpi-val val-green">${controls.length}</div></div>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  return (
    <div className="dashboard-content animate-fade-in">
      <div className="header-section">
        <h1 className="main-title">PUSAT LAPORAN & EKSPOR</h1>
        <p className="sub-title">
          Unduh data mentah atau laporan analitik untuk keperluan dokumentasi
          fisik.
        </p>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "30px",
          marginBottom: "40px",
        }}
      >
        <div
          className="dashboard-card glow-effect"
          style={{
            borderTop: `2px solid ${COLORS.red}`,
            padding: "30px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2
              style={{
                color: COLORS.red,
                marginBottom: "15px",
                fontSize: "18px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              📄 Ekspor Laporan Lengkap (PDF)
            </h2>
            <p
              style={{
                color: "#aaa",
                marginBottom: "25px",
                fontSize: "13px",
                lineHeight: "1.6",
              }}
            >
              Menghasilkan laporan PDF utuh yang mencakup Aset, Kerentanan,
              Ancaman, dan Kontrol.
            </p>
          </div>
          <button
            onClick={exportToPDF}
            onMouseEnter={(e) => {
              playUISound("hover");
              e.currentTarget.style.background = "rgba(229, 57, 53, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
            style={{
              backgroundColor: "transparent",
              border: `1px solid ${COLORS.red}`,
              color: COLORS.red,
              padding: "14px 20px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.3s ease",
              borderRadius: "4px",
              letterSpacing: "1px",
            }}
          >
            ⬇ UNDUH DOKUMEN PDF
          </button>
        </div>
        <div
          className="dashboard-card glow-effect"
          style={{
            borderTop: `2px solid ${COLORS.green}`,
            padding: "30px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2
              style={{
                color: COLORS.green,
                marginBottom: "15px",
                fontSize: "18px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              📊 Ekspor ke Excel (XLSX)
            </h2>
            <p
              style={{
                color: "#aaa",
                marginBottom: "25px",
                fontSize: "13px",
                lineHeight: "1.6",
              }}
            >
              Mengunduh seluruh database (Matriks tidak termasuk) ke dalam file
              .xlsx multi-sheet.
            </p>
          </div>
          <button
            onClick={exportToExcel}
            onMouseEnter={(e) => {
              playUISound("hover");
              e.currentTarget.style.background = "rgba(76, 175, 80, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
            style={{
              backgroundColor: "transparent",
              border: `1px solid ${COLORS.green}`,
              color: COLORS.green,
              padding: "14px 20px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.3s ease",
              borderRadius: "4px",
              letterSpacing: "1px",
            }}
          >
            ⬇ UNDUH DOKUMEN EXCEL
          </button>
        </div>
      </div>
      <div
        className="dashboard-card full-width-card glow-effect"
        style={{ padding: "30px" }}
      >
        <h2
          style={{
            color: COLORS.primary,
            marginBottom: "20px",
            borderBottom: `1px solid rgba(255, 152, 0, 0.3)`,
            paddingBottom: "10px",
            fontSize: "18px",
          }}
        >
          Ringkasan Eksekutif Terkini
        </h2>
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 30px 0" }}>
          {topThreats.map((item) => {
            const isHigh = item.score > 10000;
            const borderColor = isHigh ? COLORS.red : COLORS.yellow;
            const textColor = isHigh ? "#ffbaba" : "#fff3cd";
            return (
              <li
                key={item.id}
                style={{
                  padding: "15px 20px",
                  borderLeft: `4px solid ${borderColor}`,
                  backgroundColor: "rgba(0,0,0,0.3)",
                  marginBottom: "10px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderRadius: "4px",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: "bold",
                    color: "#fff",
                    fontFamily: "monospace",
                  }}
                >
                  {item.id} - {item.name}
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    color: textColor,
                    fontWeight: "bold",
                  }}
                >
                  Skor: {formatNilai(item.score)} (
                  {isHigh ? "Tinggi" : "Sedang"})
                </span>
              </li>
            );
          })}
        </ul>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "20px",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              padding: "20px",
              background: "rgba(0,0,0,0.5)",
              borderRadius: "6px",
              border: "1px solid #333",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "#888",
                marginBottom: "8px",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Total Aset
            </div>
            <div
              style={{ fontSize: "32px", fontWeight: "bold", color: "#ddd" }}
            >
              {assets.length}
            </div>
          </div>
          <div
            style={{
              padding: "20px",
              background: "rgba(0,0,0,0.5)",
              borderRadius: "6px",
              border: "1px solid #333",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "#888",
                marginBottom: "8px",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Total Kerentanan
            </div>
            <div
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                color: COLORS.red,
              }}
            >
              {vulnerabilities.length}
            </div>
          </div>
          <div
            style={{
              padding: "20px",
              background: "rgba(0,0,0,0.5)",
              borderRadius: "6px",
              border: "1px solid #333",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "#888",
                marginBottom: "8px",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Kontrol Aktif
            </div>
            <div
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                color: COLORS.green,
              }}
            >
              {controls.length}
            </div>
          </div>
        </div>
        <button
          onClick={handlePrintSummary}
          onMouseEnter={(e) => {
            playUISound("hover");
            e.currentTarget.style.background = "rgba(255, 152, 0, 0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
          style={{
            width: "100%",
            backgroundColor: "transparent",
            border: `1px dashed ${COLORS.primary}`,
            color: COLORS.primary,
            padding: "16px",
            cursor: "pointer",
            fontWeight: "bold",
            letterSpacing: "1px",
            transition: "0.3s ease",
            borderRadius: "4px",
          }}
        >
          🖨️ CETAK RINGKASAN HALAMAN INI (PRINT ONLY)
        </button>
      </div>
    </div>
  );
}

// === KOMPONEN RIWAYAT LOG ===
function HistoryLog({ logs }) {
  const safeLogs = Array.isArray(logs) ? logs : [];

  return (
    <div className="dashboard-content animate-fade-in">
      <div
        style={{
          marginBottom: "20px",
          borderBottom: "1px solid rgba(255, 152, 0, 0.3)",
          paddingBottom: "10px",
        }}
      >
        <h2 style={{ color: "#fff", margin: 0, letterSpacing: "2px" }}>
          RIWAYAT AKTIVITAS SISTEM
        </h2>
      </div>

      <div className="table-container">
        <table className="data-table cyber-grid">
          <thead>
            <tr>
              <th>WAKTU</th>
              <th>TIPE</th>
              <th>AKSI & DESKRIPSI</th>
              <th>PENGGUNA</th>
            </tr>
          </thead>
          <tbody>
            {safeLogs.length === 0 ? (
              <tr>
                <td
                  colSpan="4"
                  style={{
                    textAlign: "center",
                    padding: "30px",
                    color: "#888",
                  }}
                >
                  Sistem sedang memuat riwayat atau belum ada data masuk...
                </td>
              </tr>
            ) : (
              safeLogs.slice(0, 100).map((l, i) => {
                let dateStr = "Waktu Tidak Valid";
                try {
                  if (l && l.timestamp) {
                    const dateObj = new Date(l.timestamp);
                    if (!isNaN(dateObj.getTime())) {
                      dateStr = dateObj.toLocaleString("id-ID");
                    }
                  }
                } catch (e) {
                  console.error("Format tanggal error");
                }

                return (
                  <tr key={l?.id || i}>
                    <td style={{ color: "#aaa" }}>{dateStr}</td>
                    <td>
                      <span
                        style={{
                          color:
                            l?.type === "LOGIN" || l?.type === "LOGOUT"
                              ? "#00f3ff"
                              : "#FF9800",
                          fontWeight: "bold",
                        }}
                      >
                        [{l?.type || "INFO"}]
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: "#ddd" }}>
                        {l?.action || "-"}
                      </strong>
                      <br />
                      <span style={{ color: "#888", fontSize: "12px" }}>
                        {l?.description || "-"}
                      </span>
                    </td>
                    <td style={{ color: "#4CAF50" }}>{l?.user || "SYSTEM"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
