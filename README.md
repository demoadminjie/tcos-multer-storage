# TCOS-Multer-Storage

## Introduction
A Customer Multer Storage that store the upload file to the [TecentCloud Cloud Object Storage](https://www.tencentcloud.com/products/cos).
<br>
<br>
## Usage
> ### Need the **TencentCloud permanent key** <br>
> Get the **SecretId** and **SecretKey** on the [Manage API Key page](https://console.tencentcloud.com/cam/capi) in the CAM console

import or require
```javascript
import tcosMulterStorageEngine from 'tcos-multer-storage';
//or
const { default: tcosMulterStorageEngine } = require('tcos-multer-storage');
```
simple example:
```javascript
import express from "express";
import cors from "cors";
import multer from 'multer';
import tcosMulterStorageEngine from 'tcos-multer-storage';

const PORT = process.env.PORT;
const HOST = process.env.HOST;

// SecretId and SecretKey also could be seted at process.env as COS_SECRET_ID and COS_SECRET_KEY
const tcStorage = tcosMulterStorageEngine({
  bucket: process.env.COS_BUCKET,
  region: process.env.COS_REGION,
  // SecretId: process.env.COS_SECRET_ID,
  // SecretKey: process.env.COS_SECRET_KEY,
});

const upload = multer({
  storage: tcStorage,
});

const app = express();

// refer file item attr in the sample-upload
// https://www.tencentcloud.com/document/product/436/43871#uploading-object-by-using-simple-upload 
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
```
See more on the [**example**](https://github.com/demoadminjie/tcos-multer-storage/blob/main/example/app.js)
 and the [**\_\_test\_\_**](https://github.com/demoadminjie/tcos-multer-storage/blob/main/src/__tests__/main.test.ts)
<br>

## Todo
- [x] Support be required as CommonJS
- [ ] Support be authorizated by using temporary key
- [ ] Upload large file by using multipart operations

## Reference
- https://github.com/expressjs/multer/blob/master/StorageEngine.md
- https://www.tencentcloud.com/document/product/436/8629
