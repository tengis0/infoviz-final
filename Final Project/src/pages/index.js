import Head from "next/head";
import { Inter } from "next/font/google";
import styles from "@/styles/Home.module.css";
import { useRouter } from "next/router";
import LineChart from "./lines";
const inter = Inter({ subsets: ["latin"] });

export default function Home() {

  const router = useRouter();
  const goToChartsPage = () => {
    router.push("/charts"); 
  };

  return (
    <>
      <Head>
        <title>Final Project</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <main className={`${styles.main} ${inter.className}`}>

        <div style={{ width: "110%" }}>
            <div className={styles.center} style={{ position: "relative", zIndex: -1 }}>
              <h2>Injury and Fatality Trends by Borough</h2>
            </div>
          <LineChart />
        </div>

        <a
          onClick={goToChartsPage}
          className={styles.card}
          target="_blank"
          rel="noopener noreferrer"
          style={{ cursor: "pointer" }}
        >
          <h3> Go to GeoMap <span>-&gt;</span> </h3>
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
