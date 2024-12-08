import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { csv, scaleLinear } from 'd3';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const MatrixView = ({ initialYear = 'All', initialType = 'injured', initialBorough = 'All' }) => {
    const [data, setData] = useState([]);
    const [years, setYears] = useState([]);
    const [boroughs, setBoroughs] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [year, setYear] = useState(initialYear);
    const [type, setType] = useState(initialType);
    const [borough, setBorough] = useState(initialBorough);
    const [matrixData, setMatrixData] = useState({});
    const [selectedCell, setSelectedCell] = useState(null);

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    // Load CSV data
    useEffect(() => {
        csv('/data/matrix_data.csv').then(rows => {
            setData(rows);

            // Extract unique years, boroughs, and vehicles
            const uniqueYears = [...new Set(rows.map(row => row.year))];
            const uniqueBoroughs = [...new Set(rows.map(row => row.borough))];
            const uniqueVehicles = [...new Set(rows.map(row => row.vehicle))];

            setYears(['All', ...uniqueYears]);
            setBoroughs(['All', ...uniqueBoroughs]);
            setVehicles(uniqueVehicles); // Matrix column headers
        });
    }, []);
// Load parameters of father page
    const router = useRouter();
    const { year: queryYear, type: queryType, borough: queryBorough } = router.query;
    useEffect(() => {
      if (router.isReady) {
          setYear(queryYear || 'All');
          setType(queryType || 'injured');
          setBorough(queryBorough || 'All');
      }
    }, [router.isReady, queryYear, queryType, queryBorough]);
    // Process and filter data based on parameters
    useEffect(() => {
        const grouped = {};
        months.forEach(month => {
            grouped[month] = {};
            vehicles.forEach(vehicle => {
                grouped[month][vehicle] = 0; // Initialize with 0
            });
        });

        data.forEach(row => {
            const rowYear = row.year;
            const rowBorough = row.borough;
            const rowMonth = months[+row.month - 1];
            const rowVehicle = row.vehicle;
            
            if (
                (year === 'All' || rowYear === year) &&
                (borough === 'All' || rowBorough === borough) &&
                (type === 'All' || (type === 'injured' && +row.total_injured > 0) || (type === 'killed' && +row.total_killed > 0))
            ) {
                grouped[rowMonth][rowVehicle] += type === 'injured' ? +row.total_injured : +row.total_killed;
            }
        });

        setMatrixData(grouped);
    }, [data, year, borough, type, vehicles]);

    const handleCellClick = (month, vehicle) => {
        setSelectedCell({ month, vehicle });
    };

    const generateLegend = () => {
        const max = Math.max(...Object.values(matrixData).flatMap(d => Object.values(d)));
        const colorScale = scaleLinear().domain([0, max]).range(['#d9f0ff', '#004c8c']);
        return { max, colorScale };
    };

    const { colorScale } = generateLegend();

    const renderMatrix = () => (
        <table className="matrix">
            <thead>
                <tr>
                    <th>Month</th>
                    {vehicles.map(vehicle => <th key={vehicle}>{vehicle}</th>)}
                </tr>
            </thead>
            <tbody>
                {months.map(month => (
                    <tr key={month}>
                        <td>{month}</td>
                        {vehicles.map(vehicle => {
                            const count = matrixData[month]?.[vehicle] || 0;
                            return (
                                <td
                                    key={vehicle}
                                    style={{ backgroundColor: colorScale(count) }}
                                    onClick={() => handleCellClick(month, vehicle)}
                                >
                                    {count}
                                </td>
                            );
                        })}
                    </tr>
                ))}
            </tbody>
        </table>
    );

    const renderPieChart = () => {
      if (!selectedCell) return null;
  
      const { month, vehicle } = selectedCell;
  
      // 筛选出与当前单元格相关的数据
      const cellData = data.filter(row =>
        row.month === String(months.indexOf(month) + 1) &&
        row.vehicle === vehicle &&
        (year === 'All' || row.year === year) &&
        (borough === 'All' || row.borough === borough) &&
        ((type === 'injured' && (+row.total_injured > 0 || +row.pedestrians_injured > 0 || +row.cyclist_injured > 0 || +row.motorist_injured > 0)) ||
         (type === 'killed' && (+row.total_killed > 0 || +row.pedestrians_killed > 0 || +row.cyclist_killed > 0 || +row.motorist_killed > 0)))
    );
    
  
      console.log('Pie chart cell data:', cellData);
  
      // 根据 type 参数动态生成 pieData 数据
      const pieData = {
          labels: ['Pedestrians', 'Cyclists', 'Motorists'],
          datasets: [
              {
                  data: [
                      cellData.reduce(
                          (sum, row) =>
                              sum +
                              (type === 'injured'
                                  ? +row.pedestrians_injured
                                  : +row.pedestrians_killed),
                          0
                      ),
                      cellData.reduce(
                          (sum, row) =>
                              sum +
                              (type === 'injured'
                                  ? +row.cyclist_injured
                                  : +row.cyclist_killed),
                          0
                      ),
                      cellData.reduce(
                          (sum, row) =>
                              sum +
                              (type === 'injured'
                                  ? +row.motorist_injured
                                  : +row.motorist_killed),
                          0
                      ),
                  ],
                  backgroundColor: ['#ffcd56', '#ff6384', '#36a2eb'],
              },
          ],
      };
  
      return (
          <div
              className="pie-chart"
              style={{ width: '250px', height: '250px', margin: '0 auto' }}
          >
              <h3>{`${month} - ${vehicle}`}</h3>
              <Pie data={pieData} />
          </div>
      );
  };
  

    return (
        <div className="matrix-view">
            <div className="controls">
                <select value={year} onChange={(e) => setYear(e.target.value)}>
                    {years.map(yearOption => (
                        <option key={yearOption} value={yearOption}>{yearOption}</option>
                    ))}
                </select>
                <select value={type} onChange={(e) => setType(e.target.value)}>
                    
                    <option value="injured">Injured</option>
                    <option value="killed">Killed</option>
                </select>
                <select value={borough} onChange={(e) => setBorough(e.target.value)}>
                    {boroughs.map(boroughOption => (
                        <option key={boroughOption} value={boroughOption}>{boroughOption}</option>
                    ))}
                </select>
            </div>

            {renderMatrix()}
            {renderPieChart()}
        </div>
    );
};

export default MatrixView;
