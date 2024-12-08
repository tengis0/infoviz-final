import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { useRouter } from "next/router";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend);

const LineChart = () => {
  const [data, setData] = useState([]);
  const [chartData, setChartData] = useState({ injured: {}, killed: {} });
  const router = useRouter();

  const boroughColors = {
    Manhattan: "#47BDEF",
    Brooklyn: "#47D79A",
    Queens: "#FFBA00",
    Bronx: "#660099",
    "Staten Island": "#883F1C",
  };

  useEffect(() => {
    const parseCSV = (csvText) => {
      const rows = csvText.split("\n");
      const headers = rows[0].split(",");
      const data = rows.slice(1).map((row) => {
        const values = row.split(",");
        const obj = {};
        headers.forEach((header, index) => {
          obj[header.trim()] = values[index]?.trim() || "";
        });
        return obj;
      });
      return data;
    };
  
    const normalizeBorough = (borough) => {
      if (!borough) return null;
      const standardized = borough.trim().toLowerCase();
      if (standardized === "staten island") return "Staten Island";
      return standardized.charAt(0).toUpperCase() + standardized.slice(1);
    };
  
    const loadData = async () => {
      try {
        const part1Url =
          "https://raw.githubusercontent.com/tengis0/infoviz-final/main/Dataset/nyc_accidents_part1.csv";
        const part2Url =
          "https://raw.githubusercontent.com/tengis0/infoviz-final/main/Dataset/nyc_accidents_part2.csv";
  
        const [part1Response, part2Response] = await Promise.all([fetch(part1Url), fetch(part2Url)]);
  
        const part1Text = await part1Response.text();
        const part2Text = await part2Response.text();
  
        const part1Data = parseCSV(part1Text);
        const part2Data = parseCSV(part2Text);
  
        const mergedData = [...part1Data, ...part2Data];
        setData(mergedData);
  
        const groupedByYearAndBorough = {};
  
        mergedData.forEach((row) => {
          const year = row.date?.split("-")[0];
          let borough = normalizeBorough(row.borough);
  
          if (!year || !borough) return;
  
          if (!groupedByYearAndBorough[year]) {
            groupedByYearAndBorough[year] = {
              injured: {},
              killed: {},
            };
          }
  
          groupedByYearAndBorough[year].injured[borough] =
            (groupedByYearAndBorough[year].injured[borough] || 0) +
            Number(row.total_injured || 0);
          groupedByYearAndBorough[year].killed[borough] =
            (groupedByYearAndBorough[year].killed[borough] || 0) +
            Number(row.total_killed || 0);
        });
  
        const boroughs = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"];
        const years = Object.keys(groupedByYearAndBorough);
  
        const injuredData = boroughs.map((borough) => ({
          label: borough,
          data: years.map((year) => groupedByYearAndBorough[year]?.injured[borough] || 0),
          fill: false,
          borderColor: boroughColors[borough],
          pointRadius: 5,
          hidden: false
        }));
  
        const killedData = boroughs.map((borough) => ({
          label: borough,
          data: years.map((year) => groupedByYearAndBorough[year]?.killed[borough] || 0),
          fill: false,
          borderColor: boroughColors[borough],
          pointRadius: 5,
          hidden: false,
        }));
  
        setChartData({
          injured: {
            labels: years,
            datasets: injuredData,
          },
          killed: {
            labels: years,
            datasets: killedData,
          },
        });
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
  
    loadData();
  }, []);

  const chartOptions = (charttype) => ({
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: `Yearly ${charttype === 'injured' ? 'Injury' : 'Fatality'} Data by Borough`,
        color: "#9A9EAC",
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Year",
        },
      },
      y: {
        title: {
          display: true,
        },
        beginAtZero: true,
      },
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const chart = event.chart;
        const clickedElement = elements[0];
        const { index, datasetIndex } = clickedElement;

        const year = chart.data.labels[index];
        const borough = chart.data.datasets[datasetIndex].label;
        const type = charttype;

        router.push({
          pathname: "/matrix",
          query: { year, type, borough: borough },
        });
      }
    },
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "20px" }}>
        <div style={{ flex: 1 }}>
          {chartData.injured.labels ? (
            <Line data={chartData.injured} options={chartOptions("injured")} />
          ) : (
            <p>Loading injured data...</p>
          )}
        </div>

        <div style={{ flex: 1 }}>
          {chartData.killed.labels ? (
            <Line data={chartData.killed} options={chartOptions("killed")} />
          ) : (
            <p>Loading killed data...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LineChart;
