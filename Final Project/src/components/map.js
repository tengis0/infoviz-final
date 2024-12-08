import React, { useEffect, useState } from "react";
import * as d3 from "d3";
import Select from "react-select";
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import styles from "@/styles/Home.module.css";

const mapUrl = "https://raw.githubusercontent.com/tengis0/infoviz-final/main/Dataset/nyc.geojson";
const csvUrl = "https://raw.githubusercontent.com/tengis0/infoviz-final/main/Dataset/geomap_data.csv";
const centroidUrl = "https://raw.githubusercontent.com/tengis0/infoviz-final/main/Dataset/nyc_neighborhood.csv";

const GeoMap = ({ selectedYear }) => {
  const [geoData, setGeoData] = useState(null);
  const [collisionData, setCollisionData] = useState([]);
  const [selectedVehicleType, setSelectedVehicleType] = useState(null);
  const [topVehicleTypes, setTopVehicleTypes] = useState([]);
  const [centroids, setCentroids] = useState({});

  useEffect(() => {
    fetch(mapUrl)
      .then((response) => response.json())
      .then((data) => setGeoData(data));
  }, []);

  useEffect(() => {
    const fetchCollisions = async () => {
      const data = await d3.csv(csvUrl);
      const collisions = data.map((d) => ({
        borough: d.borough,
        neighborhood: d.neighborhood,
        year: d.year,
        vehicle: d.vehicle,
        total_incidents: parseInt(d.total_incidents, 10),
        total_injured: parseInt(d.total_injured, 10),
        total_killed: parseInt(d.total_killed, 10),
        pedestrian_injured: parseInt(d.pedestrian_injured, 10),
        pedestrian_killed: parseInt(d.pedestrian_killed, 10),
        motorist_injured: parseInt(d.motorist_injured, 10),
        motorist_killed: parseInt(d.motorist_killed, 10),
        cyclist_injured: parseInt(d.cyclist_injured, 10),
        cyclist_killed: parseInt(d.cyclist_killed, 10),
      }));
      setCollisionData(collisions);
    };
    fetchCollisions();
  }, []);

  useEffect(() => {
    const fetchCentroids = async () => {
      const data = await d3.csv(centroidUrl);
      const centroidsMap = data.reduce((acc, curr) => {
        acc[curr.neighborhood] = {
          lat: parseFloat(curr.lat),
          lon: parseFloat(curr.lon),
        };
        return acc;
      }, {});
      setCentroids(centroidsMap);
    };
    fetchCentroids();
  }, []);

  useEffect(() => {
    if (!selectedYear || collisionData.length === 0) return;

    const filteredData = collisionData.filter((collision) =>
      selectedYear === "All" || collision.year === selectedYear
    );

    const vehicleCounts = filteredData.reduce((acc, curr) => {
      if (curr.vehicle) {
        acc[curr.vehicle] = (acc[curr.vehicle] || 0) + 1;
      }
      return acc;
    }, {});

    const topVehicles = Object.entries(vehicleCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([vehicle]) => ({ value: vehicle, label: vehicle }));

    setTopVehicleTypes(topVehicles);
  }, [selectedYear, collisionData]);

  useEffect(() => {
    setSelectedVehicleType(null);
  }, [selectedYear]);

  const handleVehicleTypeChange = (selectedOption) => {
    setSelectedVehicleType(selectedOption ? selectedOption.value : null);
  };

  const getBoroughColor = (boroughName) => {
    const boroughColors = {
      Manhattan: "#47BDEF",
      Brooklyn: "#47D79A",
    //   Queens: "#FF7A69", 
      Queens: "#FFBA00", 
      Bronx: "#660099",
      "Staten Island": "#883F1C",
    };
    return boroughColors[boroughName] || "#47BDEF";
  };

  const style = (feature) => {
    const boroughName = feature.properties.boro_name;
    return {
      color: getBoroughColor(boroughName),
      weight: 0.69,
      opacity: 0.69,
    };
  };

  const filteredCollisionData =
    selectedVehicleType && selectedYear !== "All"
      ? collisionData.filter(
          (d) =>
            d.year === selectedYear && d.vehicle === selectedVehicleType
        )
      : [];

//   const getCustomIcon = (size) => {
//     return L.icon({
//         iconUrl: "fatal_bg.png",
//         iconSize: [size * 2, size * 2],
//         iconAnchor: [size, size],
//         style: { opacity: 0.69 },
//     });
//   };

  const getIconSize = (total) => Math.min(Math.max(total / 10, 2), 50);

  const getNeighborhoodCenter = (neighborhood) => {
    if (centroids[neighborhood]) {
      return [centroids[neighborhood].lat, centroids[neighborhood].lon];
    }
    return null;
  };

  return (
    <div>
      <div className={styles.card}>
        <p>Select Vehicle Type</p>
        <Select
          options={topVehicleTypes}
          onChange={handleVehicleTypeChange}
          value={topVehicleTypes.find(
            (option) => option.value === selectedVehicleType
          )}
          placeholder="Type"
          styles={{
            control: (base) => ({ ...base, backgroundColor: "transparent" }),
            menu: (base) => ({ ...base, zIndex: 9999 }),
            option: (provided) => ({ ...provided, color: "#333" }),
            singleValue: (provided) => ({ ...provided, color: "#9A9EAC" }),
          }}
        />
      </div>

      <div className={styles.card} style={{ height: "69vh", width: "100%" }}>
        {geoData ? (
          <MapContainer
            center={[40.7128, -74.006]}
            zoom={10.42}
            maxZoom={13}
            minZoom={10.42}
            zoomControl={false}
            attributionControl={false}
            style={{ width: "100%", height: "100%" }}
          >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png" />
            <GeoJSON data={geoData} style={style} />

            {filteredCollisionData.map((collision) => {
              const size = getIconSize(collision.total_incidents);
              const position = getNeighborhoodCenter(collision.neighborhood);
              if (!position) return null;

              return (
                <Marker
                  key={`${collision.neighborhood}-${collision.year}-${collision.vehicle}`}
                  position={position}
                //   icon={getCustomIcon(size)} rgba(238, 55, 56, 1)
                  icon={L.divIcon({
                    className: "incident-icon",
                    html: `<div style="width: ${size * 2}px; height: ${size * 2}px; 
                                background-color: rgba(238, 55, 56, 0.69); 
                                border-radius: 50%; 
                                border: 2px 
                                solid rgba(238, 55, 56, 0.89);">
                            </div>`,
                    iconSize: [size * 2, size * 2],
                    iconAnchor: [size, size],
                  })}
                >
                  <Popup>
                    <strong>{collision.neighborhood}, {collision.borough}</strong>
                    <br />
                    Total incidents: {collision.total_incidents}
                    <br />
                    
                    <br />
                    Total injured: {collision.total_injured}
                    <br />
                        - Pedestrians: {collision.pedestrian_injured}
                    <br />
                        - Motorists: {collision.motorist_injured}
                    <br />
                        - Cyclists: {collision.cyclist_injured}
                    <br />

                    <br />
                    Total killed: {collision.total_killed}
                    <br />
                        - Pedestrians: {collision.pedestrian_killed}
                    <br />
                        - Motorists: {collision.motorist_killed}
                    <br />
                        - Cyclists: {collision.cyclist_killed}
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        ) : (
          <p>Loading map...</p>
        )}
      </div>
    </div>
  );
};

export default GeoMap;
