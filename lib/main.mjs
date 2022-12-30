var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b ||= {})
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
import COS from "cos-nodejs-sdk-v5";
class TCStorageEngine {
  constructor(opts) {
    this._handleFile = (req, file, cb) => {
      if (!this.Bucket) {
        cb(new Error("bucket is a required field."));
        return;
      }
      const objectParams = {
        Bucket: this.Bucket,
        Region: this.Region,
        Key: this.Key || file.originalname,
        Body: file.stream
      };
      this.TCCOS.headBucket(
        {
          Bucket: this.Bucket,
          Region: this.Region
        },
        (err, data) => {
          if (data) {
            this.TCCOS.putObject(objectParams, cb);
          } else if ((err == null ? void 0 : err.statusCode) === 404) {
            this.TCCOS.putBucket(
              {
                Bucket: this.Bucket,
                Region: this.Region
              },
              (putErr, putData) => {
                if (putErr) {
                  cb(putErr, putData);
                } else {
                  setTimeout(() => {
                    this.TCCOS.putObject(objectParams, cb);
                  }, 4e3);
                }
              }
            );
          } else {
            cb(err, data);
          }
        }
      );
    };
    this._removeFile = (_req, file, cb) => {
      const deleteParams = {
        Bucket: this.Bucket,
        Region: this.Region,
        Key: this.Key || file.originalname
      };
      this.TCCOS.deleteObject(deleteParams, (err, data) => {
        return cb(__spreadValues({ name: "delete error", message: "no error message" }, err), data);
      });
    };
    this.Bucket = opts.bucket;
    this.Region = opts.region || "ap-guangzhou";
    this.Key = opts.filName;
    this.TCCOS = new COS({
      SecretId: opts.SecretId || process.env.COS_SECRET_ID,
      SecretKey: opts.SecretKey || process.env.COS_SECRET_KEY
    });
  }
}
var main_default = (opts) => new TCStorageEngine(opts);
export {
  main_default as default
};
