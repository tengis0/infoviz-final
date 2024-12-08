import React, { useState, useEffect } from "react";
import Select from "react-select";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { useRouter } from "next/router";
import { csv, scaleLinear } from "d3";
import styles from "@/styles/Home.module.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });
ChartJS.register(ArcElement, Tooltip, Legend);

const MatrixView = ({ initialYear = "All", initialType = "injured", initialBorough = "All" }) => {
    const [data, setData] = useState([]);
    const [years, setYears] = useState([]);
    const [boroughs, setBoroughs] = useState([]);
    const [year, setYear] = useState(initialYear);
    const [type, setType] = useState(initialType);
    const [borough, setBorough] = useState(initialBorough);
    const [matrixData, setMatrixData] = useState({});
    const [selectedCell, setSelectedCell] = useState(null);

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    useEffect(() => {
        csv("https://raw.githubusercontent.com/tengis0/infoviz-final/main/Dataset/matrix_data.csv").then(rows => {
            setData(rows);

            const uniqueYears = [...new Set(rows.map(row => row.year))];
            const uniqueBoroughs = [...new Set(rows.map(row => row.borough))];

            setYears(["All", ...uniqueYears]);
            setBoroughs(["All", ...uniqueBoroughs]);
        });
    }, []);

    const router = useRouter();
    const goToHomePage = () => {
        router.push("/"); 
    };

    const { year: queryYear, type: queryType, borough: queryBorough } = router.query;
    useEffect(() => {
        if (router.isReady) {
            setYear(queryYear || "All");
            setType(queryType || "injured");
            setBorough(queryBorough || "All");
        }
    }, [router.isReady, queryYear, queryType, queryBorough]);

    useEffect(() => {
        const filteredData = data.filter(row =>
            (year === "All" || row.year === year) &&
            (borough === "All" || row.borough === borough)
        );
    
        const availableMonths = months.filter((_, index) =>
            filteredData.some(row => +row.month === index + 1)
        );
        
        const uniqueVehicles = [...new Set(filteredData.map(row => row.vehicle))];        
        const grouped = {};
        availableMonths.forEach(month => {
            grouped[month] = {};
            uniqueVehicles.forEach(vehicle => {
                grouped[month][vehicle] = 0;
            });
        });
    
        filteredData.forEach(row => {
            const rowMonth = months[+row.month - 1];
            const rowVehicle = row.vehicle;
    
            if (type === "injured") {
                grouped[rowMonth][rowVehicle] += +row.total_injured;
            } else if (type === "killed") {
                grouped[rowMonth][rowVehicle] += +row.total_killed;
            }
        });
    
        setMatrixData(grouped);
    }, [data, year, borough, type]);

    const handleCellClick = (month, vehicle) => {
        if (selectedCell && selectedCell.month === month && selectedCell.vehicle === vehicle) {
            setSelectedCell(null);
        } else {
            setSelectedCell({ month, vehicle });
        }
    };

    const generateLegend = () => {
        const max = Math.max(...Object.values(matrixData).flatMap(d => Object.values(d)));
        const colorScale = scaleLinear().domain([0, max]).range(["transparent", "#36A2EB"]);
        // const getColor = (value) => value === 0 ? "transparent" : colorScale(value);
        return { max, colorScale };
    };

    const { colorScale } = generateLegend();

    const renderMatrix = () => {
        const availableMonths = Object.keys(matrixData);
    
        return (
            <table className={styles.matrixTable}>
                <thead>
                    <tr>
                        <th className={styles.header}>Vehicles</th>
                        {availableMonths.map(month => (
                            <th key={month} className={styles.header}>{month}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Object.keys(matrixData).length > 0 && Object.keys(matrixData[availableMonths[0]]).map(vehicle => (
                        <tr key={vehicle} className={styles.row}>
                            <td className={styles.cell}>{vehicle}</td>
                            {availableMonths.map(month => {
                                const count = matrixData[month]?.[vehicle] || 0;
                                const isSelected = selectedCell && selectedCell.month === month && selectedCell.vehicle === vehicle;
                                return (
                                    <td
                                        key={month}
                                        className={`${styles.cell} ${isSelected ? styles.selected : ""}`}
                                        style={{ backgroundColor: colorScale(count) }}
                                        onClick={() => handleCellClick(month, vehicle)}
                                    >
                                        {count !== 0 && count}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };
    

    const renderPieChart = () => {
        if (!selectedCell) return null;

        const { month, vehicle } = selectedCell;

        const cellData = data.filter(row =>
            row.month === String(months.indexOf(month) + 1) &&
            row.vehicle === vehicle &&
            (year === "All" || row.year === year) &&
            (borough === "All" || row.borough === borough) &&
            ((type === "injured" && (+row.total_injured > 0 || +row.pedestrians_injured > 0 || +row.cyclist_injured > 0 || +row.motorist_injured > 0)) ||
                (type === "killed" && (+row.total_killed > 0 || +row.pedestrians_killed > 0 || +row.cyclist_killed > 0 || +row.motorist_killed > 0)))
        );

        const pieData = {
            labels: ["Pedestrians", "Cyclists", "Motorists"],
            datasets: [
                {
                    data: [
                        cellData.reduce(
                            (sum, row) =>
                                sum +
                                (type === "injured"
                                    ? +row.pedestrians_injured
                                    : +row.pedestrians_killed),
                            0
                        ),
                        cellData.reduce(
                            (sum, row) =>
                                sum +
                                (type === "injured"
                                    ? +row.cyclist_injured
                                    : +row.cyclist_killed),
                            0
                        ),
                        cellData.reduce(
                            (sum, row) =>
                                sum +
                                (type === "injured"
                                    ? +row.motorist_injured
                                    : +row.motorist_killed),
                            0
                        ),
                    ],
                    backgroundColor: ["#FFCD56", "#FF6384", "#36A2EB"],
                },
            ],
        };

        return (
            <div className={styles.card} style={{ width: "33%", margin: "auto" }}>
                <div className={styles.center} style={{ position: "relative", zIndex: -1 }}>
                    <h3>{`Victims in ${month} caused by ${vehicle}`}</h3>
                </div>  
                <Pie data={pieData} />
            </div>
        );
    };

    const yearOptions = years.map(yearOption => ({ value: yearOption, label: yearOption }));
    const typeOptions = [
        { value: "injured", label: "Injured" },
        { value: "killed", label: "Killed" },
    ];
    const boroughOptions = boroughs.map(boroughOption => ({ value: boroughOption, label: boroughOption }));

    return (
        <>
            <main className={`${styles.main} ${inter.className}`}>
                <div style={{ width: "100%" }}>
                    <div className={styles.center} style={{ position: "relative", zIndex: -1 }}>
                        <h2>Matrix View</h2>
                    </div>
                </div>

                <div className={styles.card} style={{ display: "flex", gap: "20px" }}>
                    <Select
                        value={yearOptions.find(option => option.value === year)}
                        onChange={selectedOption => setYear(selectedOption.value)}
                        options={yearOptions}
                        placeholder="Select Year"
                        styles={{
                            control: (base) => ({...base, backgroundColor: "transparent", minWidth: "120px" }),
                            menu: (base) => ({ ...base }),
                            menuList: (base) => ({ ...base }),
                            option: (provided) => ({ ...provided, color: "#333" }),
                            singleValue: (provided) => ({ ...provided, color: "rgba(255, 255, 255, 0.69)" }),
                        }}
                    />
                    <Select
                        value={typeOptions.find(option => option.value === type)}
                        onChange={selectedOption => setType(selectedOption.value)}
                        options={typeOptions}
                        placeholder="Select Type"
                        styles={{
                            control: (base) => ({...base, backgroundColor: "transparent", minWidth: "120px" }),
                            menu: (base) => ({ ...base }),
                            menuList: (base) => ({ ...base }),
                            option: (provided) => ({ ...provided, color: "#333" }),
                            singleValue: (provided) => ({ ...provided, color: "rgba(255, 255, 255, 0.69)" }),
                        }}
                    />
                    <Select
                        value={boroughOptions.find(option => option.value === borough)}
                        onChange={selectedOption => setBorough(selectedOption.value)}
                        options={boroughOptions}
                        placeholder="Select Borough"
                        styles={{
                            control: (base) => ({...base, backgroundColor: "transparent", minWidth: "169px" }),
                            menu: (base) => ({ ...base }),
                            menuList: (base) => ({ ...base }),
                            option: (provided) => ({ ...provided, color: "#333" }),
                            singleValue: (provided) => ({ ...provided, color: "rgba(255, 255, 255, 0.69)" }),
                        }}
                    />
                </div>


                {renderMatrix()}
                {renderPieChart()}

                <a
                    onClick={goToHomePage}
                    className={styles.card}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ cursor: "pointer" }}
                >
                    <h3> <span>&lt;-</span> Go back to Home Page </h3>
                </a>

                <a
                    href="https://github.com/tengis0/infoviz-final/tree/main/Dataset"
                    className={styles.card}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <p> Dataset </p>
                </a>
            </main>
        </>
    );
};

export default MatrixView;
