/// <reference types="express-serve-static-core" />
import multer from 'multer';
import { Request } from 'express';
import { COSOptions, Bucket, Region, Key, DeleteObjectResult } from 'cos-nodejs-sdk-v5';
type Options = {
    bucket: Bucket;
    region: Region;
    filName?: Key;
    SecretId?: COSOptions['SecretId'];
    SecretKey?: COSOptions['SecretKey'];
};
interface CustomFileResult extends Partial<Express.Multer.File> {
    Location: string;
}
declare class TCStorageEngine implements multer.StorageEngine {
    private Bucket;
    private Region;
    private Key?;
    private TCCOS;
    constructor(opts: Options);
    _handleFile: (req: Request, file: Express.Multer.File, cb: (err?: any, info?: CustomFileResult) => void) => void;
    _removeFile: (_req: Request, file: Express.Multer.File & {
        name: string;
    }, cb: (error: Error, info?: DeleteObjectResult) => void) => void;
}
declare const _default: (opts: Options) => TCStorageEngine;
export default _default;
