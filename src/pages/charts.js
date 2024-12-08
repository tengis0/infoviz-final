import Head from "next/head";
import { Inter } from "next/font/google";
import styles from "@/styles/Home.module.css";
import { useRouter } from "next/router";

import React, { useEffect, useState } from "react";
import Select from "react-select";
import SpiderChart from "./spider";
import dynamic from "next/dynamic";


const GeoMap = dynamic(() => import("./map"), { ssr: false });
const inter = Inter({ subsets: ["latin"] });

export default function Charts() {

  const [selectedYear, setSelectedYear] = useState("All");
  const handleYearChange = (selectedOption) => {
    setSelectedYear(selectedOption ? selectedOption.value : "All");
  };

  const router = useRouter();
  const goToHomePage = () => {
    router.push("/"); 
  };

  const yearOptions = [
    { value: "All", label: "All Years" },
    { value: "2012", label: "2012" },
    { value: "2013", label: "2013" },
    { value: "2014", label: "2014" },
    { value: "2015", label: "2015" },
    { value: "2016", label: "2016" },
    { value: "2017", label: "2017" },
    { value: "2018", label: "2018" },
    { value: "2019", label: "2019" },
    { value: "2020", label: "2020" },
    { value: "2021", label: "2021" },
    { value: "2022", label: "2022" },
    { value: "2023", label: "2023" },
    { value: "2024", label: "2024" },
  ];

  return (
    <>
      
      <main className={`${styles.main} ${inter.className}`}>

        <div style={{ width: "100%", display: "flex" }}>

          <div style={{ width: "60%", padding: "10px", display: "flex", flexDirection: "column", justifyContent: "flex-start" }}>
              <div className={styles.center}>
                <h3>NYC Collision Symbol Map: Top 6 Vehicle Types</h3>
              </div>
          </div>

          <div style={{ width: "40%" }}>
              <div className={styles.center}>
                <h3>Total Injury Trend Across an Average Day</h3>
              </div>
          </div>

        </div>

        <div className={styles.card} style={{ width: "100%", zIndex:11 }}>
          <label>Select Year</label>
          <Select
            options={yearOptions}
            value={{ value: selectedYear, label: selectedYear === "All" ? "All Years" : selectedYear }}
            onChange={handleYearChange}
            styles={{
              control: (base) => ({ ...base, backgroundColor: "rgba(255, 255, 255, 0.42)" }),
              menu: (base) => ({ ...base, zIndex: 9999 }),
              menuList: (base) => ({ ...base, zIndex: 9999 }),
              option: (provided) => ({ ...provided, color: "#333"}),
              singleValue: (provided) => ({ ...provided, color: "rgba(255, 255, 255, 0.69)" }),
            }}
          />
        </div>

        <div style={{ height: "100vh", width: "100%", display: "flex", zIndex:10 }}>
          <div style={{ width: "60%", padding: "10px", display: "flex", flexDirection: "column", justifyContent: "flex-start" }}>
            <GeoMap selectedYear={selectedYear} />
          </div>
          
          <div style={{ width: "40%" }}>
            <SpiderChart selectedYear={selectedYear} />
          </div>
        </div>

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
}
