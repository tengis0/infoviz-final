import React, { useEffect, useState } from "react";
import * as d3 from "d3";
import Select from "react-select";
import styles from "@/styles/Home.module.css";

const RadarChart = ({ data, selectedBoroughs, selectedYear }) => {
  const [aggregatedData, setAggregatedData] = useState([]);
  // console.log(selectedYear);
  useEffect(() => {
    const filteredData = data.filter(
      (item) =>
        (selectedBoroughs.length === 0 || selectedBoroughs.includes(item.borough)) &&
        (selectedYear === "All" || item.year === selectedYear)
    );
    // console.log(filteredData);
    const aggregated = Array.from(
      d3.group(filteredData, (d) => d.time),
      ([time, values]) => ({
        axis: time,
        totalInjured: d3.sum(values, (d) => d.total_injured),
      })
    );

    setAggregatedData(aggregated);
  }, [data, selectedBoroughs, selectedYear]);

  useEffect(() => {
    // console.log("Aggregated Data Updated:", aggregatedData);
    if (aggregatedData.length > 0) {
      drawRadarChart(aggregatedData);
    }
  }, [aggregatedData]);

  const drawRadarChart = (data) => {
    const cfg = {
      w: 369,
      h: 369,
      margin: { top: 69, right: 55, bottom: 69, left: 55 },
      levels: 4,
      maxValue: d3.max(data.map((d) => d.totalInjured)),
      opacityArea: 0.3,
      strokeWidth: 2,
      dotRadius: 4,
      labelFactor: 1.15,
      color: d3.scaleOrdinal(d3.schemeCategory10),
    };
    
    const allAxis = data.map((d) => d.axis);
    const total = allAxis.length;
    const radius = Math.min(cfg.w / 2, cfg.h / 2);
    const angleSlice = (Math.PI * 2) / total;

    const rScale = d3.scaleLinear().range([0, radius]).domain([0, cfg.maxValue]);

    d3.select("#radar-chart").select("svg").remove();

    const svg = d3
      .select("#radar-chart")
      .append("svg")
      .attr("width", cfg.w + cfg.margin.left + cfg.margin.right)
      .attr("height", cfg.h + cfg.margin.top + cfg.margin.bottom)
      .append("g")
      .attr(
        "transform",
        `translate(${cfg.w / 2 + cfg.margin.left},${cfg.h / 2 + cfg.margin.top})`
      );

    // svg
    //   .append("image")
    //   .attr("xlink:href", "/fatal_bg.png")
    //   .attr("x", -radius)
    //   .attr("y", -radius)
    //   .attr("width", radius * 2)
    //   .attr("height", radius * 2)
    //   .style("opacity", 0.6); 

    const axisGrid = svg.append("g").attr("class", "axisWrapper");
    axisGrid
      .selectAll(".levels")
      .data(d3.range(1, cfg.levels + 1).reverse())
      .enter()
      .append("circle")
      .attr("class", "gridCircle")
      .attr("r", (d, i) => (radius / cfg.levels) * d)
      .style("fill", "#CDCDCD")
      .style("stroke", "#CDCDCD")
      .style("fill-opacity", cfg.opacityArea);

    axisGrid
      .selectAll(".levelValues")
      .data(d3.range(1, cfg.levels + 1).reverse())
      .enter()
      .append("text")
      .attr("class", "levelValue")
      .attr("x", 4)
      .attr("y", (d, i) => -(radius / cfg.levels) * d)
      .attr("dy", "0.35em")
      .style("font-size", "7px")
      .style("font-family", "monospace")
      .style("fill", "white")
      .text((d) => {
        const value = cfg.maxValue * (d / cfg.levels);
        return value.toFixed(1);
      });

    const axis = axisGrid
      .selectAll(".axis")
      .data(allAxis)
      .enter()
      .append("g")
      .attr("class", "axis");

    axis
      .append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr(
        "x2",
        (d, i) => rScale(cfg.maxValue) * Math.cos(angleSlice * i - Math.PI / 2)
      )
      .attr(
        "y2",
        (d, i) => rScale(cfg.maxValue) * Math.sin(angleSlice * i - Math.PI / 2)
      )
      .attr("class", "line")
      .style("stroke", "rgba(255, 255, 255, 0.69)")
      .style("stroke-width", "1px");

    axis
      .append("text")
      .attr("class", "legend")
      .style("font-size", "7px")
      .style("font-family", "monospace")
      .style("font-weight", "100")
      .style("fill", "rgba(204, 204, 204, 1)")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr(
        "x",
        (d, i) =>
          rScale(cfg.maxValue * cfg.labelFactor) *
          Math.cos(angleSlice * i - Math.PI / 2)
      )
      .attr(
        "y",
        (d, i) =>
          rScale(cfg.maxValue * cfg.labelFactor) *
          Math.sin(angleSlice * i - Math.PI / 2)
      )
      .text((d) => d);

    const radarLine = d3
      .lineRadial()
      .radius((d) => rScale(d.value))
      .angle((_, i) => i * angleSlice);

    const dataInjured = data.map((d) => ({
      axis: d.axis,
      value: d.totalInjured,
    }));

    const closedDataInjured = dataInjured.concat(dataInjured[0]);
    const radarData = [{ name: "Injured", data: closedDataInjured }];

    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "rgba(51, 51, 51, 0.69)")
      .style("color", "white")
      .style("padding", "5px")
      .style("border-radius", "5px")
      .style("pointer-events", "none")
      .style("font-family", "monospace");

    radarData.forEach((set, index) => {
      const blobWrapper = svg
        .append("g")
        .attr("class", `radarWrapper radarWrapper${index}`);

      blobWrapper
        .append("path")
        .datum(set.data)
        .attr("class", "radarArea")
        .attr("d", radarLine)
        .style("fill", cfg.color(index))
        .style("fill-opacity", cfg.opacityArea);

      blobWrapper
        .append("path")
        .datum(set.data)
        .attr("class", "radarStroke")
        .attr("d", radarLine)
        .style("stroke-width", cfg.strokeWidth + "px")
        .style("stroke", cfg.color(index))
        .style("fill", "none");

      blobWrapper
        .selectAll(".dot")
        .data(set.data)
        .enter()
        .append("circle")
        .attr("class", "radarCircle")
        .attr("r", cfg.dotRadius)
        .attr(
          "cx",
          (d, i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2)
        )
        .attr(
          "cy",
          (d, i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2)
        )
        .style("fill", cfg.color(index))
        .style("fill-opacity", 0.9)
        .on("mouseover", function (event, d) {
          tooltip
            .style("visibility", "visible")
            .html(`Average Injuries: ${d.value.toFixed(1)}`);
        })
        .on("mousemove", function (event, d) {
            // console.log("Mouseover at time:", d.axis);
            tooltip
            .style("top", event.pageY + 10 + "px")
            .style("left", event.pageX + 10 + "px");
        })
        .on("mouseout", function () {
          tooltip.style("visibility", "hidden");
        });
    });
  };

  return <div id="radar-chart"></div>;
};

const SpiderChart = ({ selectedYear }) => {
    const [boroughs, setBoroughs] = useState([]);
    const [selectedBoroughs, setSelectedBoroughs] = useState([]);
    const [data, setData] = useState([]);
  
    useEffect(() => {
      d3.csv(
        "https://raw.githubusercontent.com/tengis0/infoviz-final/main/Dataset/spider_chart.csv"
      ).then((data) => {
        setData(
          data.map((d) => ({
            borough: d.borough,
            year: d.year,
            time: d.time_bin,
            total_killed: +d.total_killed,
            total_injured: +d.total_injured,
          }))
        );
  
        setBoroughs([...new Set(data.map((d) => d.borough))]);
      });
    }, []);
  
    const handleBoroughChange = (selectedOptions) => {
      const selectedValues = selectedOptions ? selectedOptions.map((option) => option.value) : [];
      setSelectedBoroughs(selectedValues);
    };
  
    return (
        <div>
          <div className={styles.card} >
            <p>Select Borough(s)</p>
            <Select
              isMulti
              name="boroughs"
              options={boroughs.map((borough) => ({ value: borough, label: borough }))}
              value={selectedBoroughs.map((borough) => ({ value: borough, label: borough }))}
              onChange={handleBoroughChange}
              closeMenuOnSelect={false}
              placeholder="All"
              styles={{
                control: (base) => ({
                  ...base,
                  backgroundColor: "transparent",
                }),
                multiValue: (base) => ({
                  ...base,
                  backgroundColor: "#3B3B3B",
                  borderRadius: "12px",
                  margin: "2px",
                }),
                multiValueLabel: (base) => ({
                  ...base,
                  color: "#FEFEFF",
                  padding: "5px",
                }),
                multiValueRemove: (base) => ({
                  ...base,
                  color: "#E57373",
                  ":hover": {
                    backgroundColor: "transparent",
                  },
                }),
                option: (provided) => ({
                  ...provided,
                  color: "#333",
                }),
                singleValue: (provided) => ({
                  ...provided,
                  color: "#333",
                }),
              }}
            />
          </div>
    
          <div className={styles.card} >
            <RadarChart
              data={data}
              selectedBoroughs={selectedBoroughs}
              selectedYear={selectedYear}
            />
          </div>

      </div>
    );
  };
  
  export default SpiderChart;
  