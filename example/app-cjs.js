const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { default: tcosMulterStorageEngine } = require('../lib/main.cjs');
const dotenv = require('dotenv');
dotenv.config();

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '127.0.0.1';

const tcStorage = tcosMulterStorageEngine({
  bucket: process.env.COS_BUCKET,
  region: process.env.COS_REGION,
  SecretId: process.env.COS_SECRET_ID,
  SecretKey: process.env.COS_SECRET_KEY,
});

const upload = multer({
  storage: tcStorage,
});

// App
const app = express();

app.post('/file', upload.any(), (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.write(JSON.stringify({ body: req.body, files: req.files }));
  res.end();
});

app.listen(PORT, HOST, () => {
  console.log(`Running on http://${HOST}:${PORT}`);
});

app.use(cors());
app.use(express.json());
