"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
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
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var main_exports = {};
__export(main_exports, {
  default: () => main_default
});
module.exports = __toCommonJS(main_exports);
var import_cos_nodejs_sdk_v5 = __toESM(require("cos-nodejs-sdk-v5"), 1);
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
    this.TCCOS = new import_cos_nodejs_sdk_v5.default({
      SecretId: opts.SecretId || process.env.COS_SECRET_ID,
      SecretKey: opts.SecretKey || process.env.COS_SECRET_KEY
    });
  }
}
var main_default = (opts) => new TCStorageEngine(opts);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
