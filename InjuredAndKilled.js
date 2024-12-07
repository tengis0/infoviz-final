import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Line } from 'react-chartjs-2';
import { useRouter } from 'next/router'; // 使用 next 的 useRouter，而不是 react-router-dom
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// 注册 Chart.js 组件
ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend);

const InjuredAndKilledPage = () => {
  const [data, setData] = useState([]);
  const [chartData, setChartData] = useState({ injured: {}, killed: {} });
  const router = useRouter(); // 使用 useRouter 来进行页面跳转

  useEffect(() => {
    const parseCSV = (filePath) =>
      new Promise((resolve, reject) => {
        Papa.parse(filePath, {
          download: true,
          header: true,
          skipEmptyLines: true,
          complete: (result) => resolve(result.data),
          error: reject,
        });
      });

    const loadData = async () => {
      try {
        const [part1Data, part2Data] = await Promise.all([
          parseCSV('/data/nyc_accidents_part1.csv'),
          parseCSV('/data/nyc_accidents_part2.csv'),
        ]);

        // 合并数据
        const mergedData = [...part1Data, ...part2Data];
        setData(mergedData);

        // 按年份和 borough 分组数据
        const groupedByYearAndBorough = {};

        mergedData.forEach((row) => {
          const year = row.date?.split('-')[0]; // 解析年份
          const borough = row.borough;

          if (!year || !borough) return; // 忽略无效行

          if (!groupedByYearAndBorough[year]) {
            groupedByYearAndBorough[year] = {
              injured: {},
              killed: {},
            };
          }

          groupedByYearAndBorough[year].injured[borough] =
            (groupedByYearAndBorough[year].injured[borough] || 0) + Number(row.total_injured || 0);
          groupedByYearAndBorough[year].killed[borough] =
            (groupedByYearAndBorough[year].killed[borough] || 0) + Number(row.total_killed || 0);
        });

        // 准备图表数据
        const boroughs = ['MANHATTAN', 'BROOKLYN', 'QUEENS', 'BRONX', 'STATEN ISLAND'];
        const years = Object.keys(groupedByYearAndBorough);
        const injuredData = boroughs.map((borough) => ({
          label: borough,
          data: years.map((year) => groupedByYearAndBorough[year]?.injured[borough] || 0),
          fill: false,
          borderColor: getRandomColor(),
        }));
        const killedData = boroughs.map((borough) => ({
          label: borough,
          data: years.map((year) => groupedByYearAndBorough[year]?.killed[borough] || 0),
          fill: false,
          borderColor: getRandomColor(),
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
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  // 随机生成颜色函数
  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  // 图表选项
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Yearly Injury and Fatality Data by Borough',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Year',
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
        const clickedElementIndex = elements[0].index;
        const year = chartData.injured.labels[clickedElementIndex];
        const isInjured = event.nativeEvent.target.id.includes('injured'); // 判断点击的是伤还是亡的线
        const type = isInjured ? 'injured' : 'killed';

        // 跳转到对应的页面，路径可以是你设置的 URL 格式
        router.push(`/data/${type}/${year}`);
      }
    },
  };

  return (
    <div>
      <h1>Injury and Fatality Statistics by Borough</h1>

      {/* Injured Data Line Chart */}
      <h2>Injured</h2>
      {chartData.injured.labels ? (
        <Line data={chartData.injured} options={chartOptions} />
      ) : (
        <p>Loading injured data...</p>
      )}

      {/* Killed Data Line Chart */}
      <h2>Killed</h2>
      {chartData.killed.labels ? (
        <Line data={chartData.killed} options={chartOptions} />
      ) : (
        <p>Loading killed data...</p>
      )}
    </div>
  );
};

export default InjuredAndKilledPage;
