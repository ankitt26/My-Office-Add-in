const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const pool = require("./db");
const excel = require("exceljs");
require("dotenv").config(); // Load environment variables from .env file

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const localExcelFilePath = "./data.xlsx"; // Update with your local Excel file path

const workbook = new excel.Workbook();
workbook.xlsx.readFile(localExcelFilePath).then(async () => {
  const sheet = workbook.getWorksheet(1);
  const columnNames = sheet.getRow(1).values;
  const columnTypes = sheet.getRow(2).values;

  // Generate SQL query to create table
  let createTableQuery = `CREATE TABLE IF NOT EXISTS ${process.env.PG_DATABASE} (`;
  for (let i = 0; i < columnNames.length; i++) {
    createTableQuery += `${columnNames[i]} ${columnTypes[i]}, `;
  }
  createTableQuery = createTableQuery.slice(0, -2); // Remove the trailing comma
  createTableQuery += ");";

  // Execute the SQL query to create the table
  pool.query(createTableQuery, (err, result) => {
    if (err) {
      console.error("Error creating table:", err);
    } else {
      console.log("Table created successfully");
    }
  });
});

// CRUD operations
app.post("/sync-data", (req, res) => {
  const { data } = req.body;

  // Assuming your_table_name is the name of your PostgreSQL table
  const insertQuery = `INSERT INTO ${process.env.PG_DATABASE} VALUES ${data
    .map((row) => `(${row.map((val) => `'${val}'`).join(", ")})`)
    .join(", ")}`;

  pool.query(insertQuery, (err, result) => {
    if (err) {
      console.error("Error inserting data:", err);
      res.status(500).send("Error inserting data");
    } else {
      console.log("Data inserted successfully");
      res.status(200).send("Data inserted successfully");
    }
  });
});
