import puppeteer from "puppeteer";
import express from "express";
import cors from "cors";
import cron from "node-cron";
import dotenv from "dotenv";
import bodyParser from "body-parser";

dotenv.config();
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(
  cors({
    origin: ["http://localhost:3000", "https://vance-fullstack.vercel.app"],
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
  })
);

const PORT = process.env.PORT || 5000;

app.use(express.json());

// const prisma = new PrismaClient({
//   log: ["query", "info", "warn", "error"],
// });

app.get("/", (req, res) => {
  res.send("Hello World!");
});
app.post("/api/scrape", async (req, res) => {
  const { quote, fromDate, toDate } = req.body;

  if (!quote || !fromDate || !toDate) {
    return res.status(400).json({ message: "Missing parameters" });
  }

  const url = `https://finance.yahoo.com/quote/${encodeURIComponent(
    quote
  )}/history?period1=${fromDate}&period2=${toDate}`;

  try {
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--no-zygote"],
      headless: true,
      ignoreHTTPSErrors: true,
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });

    // Scrape data logic here
    const data = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll("table tbody tr"));
      return rows.map((row) => {
        const columns = row.querySelectorAll("td");
        return Array.from(columns, (column) => column.innerText);
      });
    });

    // const insertData = data.map((row) => ({
    //   date: row[0],
    //   open: parseFloat(row[1]),
    //   high: parseFloat(row[2]),
    //   low: parseFloat(row[3]),
    //   close: parseFloat(row[4]),
    //   adjClose: parseFloat(row[5]),
    //   volume: row[6],
    // }));

    // const result = await prisma.currency.createMany({
    //   data: insertData,
    // });
    res.json({ data });

    await browser.close();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error scraping data" });
  }
});

app.post("/api/forex-data", async (req, res) => {
  const { quote, fromDate, toDate } = req.body;

  if (!quote || !fromDate || !toDate) {
    return res.status(400).json({ message: "Missing parameters" });
  }

  const url = `https://finance.yahoo.com/quote/${encodeURIComponent(
    quote
  )}/history?period1=${fromDate}&period2=${toDate}`;

  try {
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--no-zygote"],
      headless: true,
      ignoreHTTPSErrors: true,
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });

    // Scrape data logic here
    const data = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll("table tbody tr"));
      return rows.map((row) => {
        const columns = row.querySelectorAll("td");
        return Array.from(columns, (column) => column.innerText);
      });
    });

    // const insertData = data.map((row) => ({
    //   date: row[0],
    //   open: parseFloat(row[1]),
    //   high: parseFloat(row[2]),
    //   low: parseFloat(row[3]),
    //   close: parseFloat(row[4]),
    //   adjClose: parseFloat(row[5]),
    //   volume: row[6],
    // }));

    // const result = await prisma.currency.createMany({
    //   data: insertData,
    // });
    res.json({ data });
    await browser.close();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error scraping data" });
  }
});

function getPeriodTimeStamps(period) {
  const now = new Date();
  switch (period) {
    case "1W":
      return {
        fromDate: Math.floor(
          new Date(now.setDate(now.getDate() - 7)).getTime() / 1000
        ),
        toDate: Math.floor(new Date().getTime() / 1000),
      };
    case "1M":
      return {
        fromDate: Math.floor(
          new Date(now.setMonth(now.getMonth() - 1)).getTime() / 1000
        ),
        toDate: Math.floor(new Date().getTime() / 1000),
      };
    case "3M":
      return {
        fromDate: Math.floor(
          new Date(now.setMonth(now.getMonth() - 3)).getTime() / 1000
        ),
        toDate: Math.floor(new Date().getTime() / 1000),
      };
    case "6M":
      return {
        fromDate: Math.floor(
          new Date(now.setMonth(now.getMonth() - 6)).getTime() / 1000
        ),
        toDate: Math.floor(new Date().getTime() / 1000),
      };
    case "1Y":
      return {
        fromDate: Math.floor(
          new Date(now.setFullYear(now.getFullYear() - 1)).getTime() / 1000
        ),
        toDate: Math.floor(new Date().getTime() / 1000),
      };
    default:
      return { fromDate: 0, toDate: 0 };
  }
}

// Function to scrape data
async function scrapeData(quote, period) {
  const { fromDate, toDate } = getPeriodTimeStamps(period);
  const url = `https://finance.yahoo.com/quote/${encodeURIComponent(
    quote
  )}/history?period1=${fromDate}&period2=${toDate}`;

  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--no-zygote"],
    headless: true,
    ignoreHTTPSErrors: true,
  });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2" });

  const data = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll("table tbody tr"));
    return rows.map((row) => {
      const columns = row.querySelectorAll("td");
      return Array.from(columns, (column) => column.innerText);
    });
  });

  // const insertData = data.map((row) => ({
  //   date: row[0],
  //   open: parseFloat(row[1]),
  //   high: parseFloat(row[2]),
  //   low: parseFloat(row[3]),
  //   close: parseFloat(row[4]),
  //   adjClose: parseFloat(row[5]),
  //   volume: row[6],
  // }));

  // const result = await prisma.currency.createMany({
  //   data: insertData,
  // });

  await browser.close();
  return data;
}

// Currency pairs and periods
const pairs = [
  { quote: "GBPINR=X", periods: ["1W", "1M", "3M", "6M", "1Y"] },
  { quote: "AEDINR=X", periods: ["1W", "1M", "3M", "6M", "1Y"] },
];

// Schedule cron jobs
pairs.forEach((pair) => {
  pair.periods.forEach((period) => {
    cron.schedule("0 0 * * SUN", async () => {
      // Runs every Sunday at midnight
      console.log("CODE RUNNING");
      console.log(`Running task for ${pair.quote} for period ${period}`);
      const data = await scrapeData(pair.quote, period);
      // Handle data (e.g., store in database)
      console.log(data);
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
