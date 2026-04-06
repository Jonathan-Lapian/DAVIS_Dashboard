import { useState, useEffect } from "react";
import axios from "axios";
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
  AreaChart,
  Area,
} from "recharts";
import "./App.css"; // MENGIMPOR STYLING

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("https://dummyjson.com/products?limit=100")
      .then((res) => {
        setData(res.data.products);
        setLoading(false);
      })
      .catch((err) => console.error(err));
  }, []);

  if (loading)
    return (
      <div style={{ padding: "40px", color: "#fff" }}>
        Memuat data menawan...
      </div>
    );

  // --- MENGHITUNG KPI ---
  const totalProducts = data.length;
  const avgPrice = (
    data.reduce((sum, item) => sum + item.price, 0) / totalProducts
  ).toFixed(2);
  const totalStockValue = data
    .reduce((sum, item) => sum + item.price * item.stock, 0)
    .toLocaleString("en-US");

  // --- PERSIAPAN DATA VISUALISASI ---
  // 1. Data Area Chart (Meniru Line Chart "Streams")
  const areaData = data.slice(0, 30).map((item) => ({
    name: item.title.substring(0, 10),
    price: item.price,
  }));

  // 2. Data Bar Chart (Meniru "Target Audience")
  const categoryCount = data.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});
  const barData = Object.keys(categoryCount)
    .slice(0, 6)
    .map((key) => ({
      category: key.split("-")[0],
      value: categoryCount[key],
    }));

  // 3. Data Pie Chart (Distribusi)
  const pieData = Object.keys(categoryCount)
    .slice(0, 4)
    .map((key) => ({ name: key, value: categoryCount[key] }));
  const PIE_COLORS = ["#ff2a2a", "#cc0000", "#21262d", "#30363d"]; // Tema merah neon & gelap

  // 4. Data untuk Custom Progress Bar (Meniru "Earnings")
  const topCategoriesByPrice = Object.keys(categoryCount)
    .map((category) => {
      const productsInCat = data.filter((item) => item.category === category);
      const total = productsInCat.reduce((sum, item) => sum + item.price, 0);
      return { category, total };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 4);

  return (
    <div className="dashboard-container">
      <h1 className="header-title">Product Analytics</h1>

      {/* --- BARIS 1: AREA CHART (KIRI) & STATISTIK (KANAN) --- */}
      <div className="dashboard-grid">
        {/* Kolom Kiri: Chart Mirip Streams */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Total Inventory Value</div>
              <div className="kpi-value">${totalStockValue}</div>
            </div>
            {/* KPI 1 */}
            <div style={{ textAlign: "right" }}>
              <div className="card-title">Total Items</div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: "#ff2a2a",
                }}
              >
                {totalProducts} PCS
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <AreaChart
              data={areaData}
              margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
            >
              <defs>
                {/* Efek transparan merah di bawah garis */}
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff2a2a" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#ff2a2a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#111318",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                itemStyle={{ color: "#ff2a2a" }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#ff2a2a"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorPrice)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Kolom Kanan: Mirip Earnings dengan Progress Bar */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Avg. Price (KPI)</div>
              <div className="kpi-value accent">${avgPrice}</div>
            </div>
          </div>

          <div style={{ marginTop: "10px" }}>
            {topCategoriesByPrice.map((cat, index) => (
              <div className="progress-container" key={index}>
                <div className="progress-label">
                  <span>{cat.category}</span>
                  <span>${cat.total.toLocaleString()}</span>
                </div>
                <div className="progress-track">
                  <div
                    className={`progress-fill ${index > 1 ? "orange" : ""}`}
                    style={{
                      width: `${(cat.total / topCategoriesByPrice[0].total) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- BARIS 2: BAR CHART, PIE CHART, & TABEL/LIST --- */}
      <div className="dashboard-grid-bottom">
        {/* Bar Chart Mirip Target Audience */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: "20px" }}>
            Category Count
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData}>
              <RechartsTooltip
                cursor={{ fill: "#21262d" }}
                contentStyle={{
                  backgroundColor: "#111318",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Bar dataKey="value" fill="#ff2a2a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: "10px" }}>
            Distribution
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                    stroke="none"
                  />
                ))}
              </Pie>
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#111318",
                  border: "none",
                  color: "#fff",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Table / List Mirip Top Releases */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: "10px" }}>
            <div
              className="card-title"
              style={{ color: "#fff", fontSize: "16px" }}
            >
              Top Rated Products (Table)
            </div>
            <div
              style={{ fontSize: "12px", color: "#ff2a2a", cursor: "pointer" }}
            >
              View All
            </div>
          </div>

          <ul className="top-list">
            {data
              .sort((a, b) => b.rating - a.rating)
              .slice(0, 3)
              .map((item) => (
                <li className="top-list-item" key={item.id}>
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="item-img"
                  />
                  <div className="item-info">
                    <div className="item-title">{item.title}</div>
                    <div className="item-subtitle">
                      {item.category} • ⭐ {item.rating} Rating
                    </div>
                  </div>
                  <div className="item-action">
                    <span style={{ fontSize: "14px", color: "#fff" }}>
                      ${item.price}
                    </span>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      </div>

      {/* --- BARIS 3: INSIGHT --- */}
      <div className="card insight-card">
        <h3 style={{ color: "#fff", marginBottom: "15px", fontSize: "18px" }}>
          💡 Analytical Insight
        </h3>
        <ul>
          <li>
            <strong>Distribusi Nilai Inventaris:</strong> Sebagian besar nilai
            aset (Value) didominasi oleh top 2 kategori, menunjukkan konsentrasi
            modal pada tipe produk tertentu.
          </li>
          <li>
            <strong>Performa Kategori:</strong> Grafik Bar menunjukkan bahwa
            kategori spesifik memiliki frekuensi kemunculan yang tinggi, namun
            belum tentu memiliki rating tertinggi di daftar{" "}
            <em>Top Rated Products</em>.
          </li>
          <li>
            <strong>Stabilitas Harga:</strong> Area Chart menunjukkan fluktuasi
            harga yang beragam dari produk yang terdaftar, namun rata-rata harga
            terjaga di angka yang kompetitif (${avgPrice}).
          </li>
        </ul>
      </div>
    </div>
  );
}

export default App;
