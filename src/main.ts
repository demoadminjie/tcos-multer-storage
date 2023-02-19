import { Buffer } from 'buffer';
import multer from 'multer';
import { Request } from 'express';
import COS, {
  COSOptions,
  Bucket,
  Region,
  Key,
  DeleteObjectParams,
  DeleteObjectResult,
  Part
} from 'cos-nodejs-sdk-v5';

type Options = {
  bucket: Bucket;
  region: Region;
  filName?: Key;
  SecretId?: COSOptions['SecretId'];
  SecretKey?: COSOptions['SecretKey'];
};

interface CustomFileResult extends Partial<Express.Multer.File> {
  Location: string;
};

// 每个切片字节长度不能小于 1m
const MINI_MUM_SLICE = 1 * 1024 * 1024;

const MAX_UPLOAD_NUMS = 4;

class TCStorageEngine implements multer.StorageEngine {
  private Bucket: Bucket;
  private Region: Region;
  private Key?: Key;
  private TCCOS: COS;

  constructor(opts: Options) {
    this.Bucket = opts.bucket;
    this.Region = opts.region || 'ap-guangzhou';
    this.Key = opts.filName;
    this.TCCOS = new COS({
      SecretId: opts.SecretId,
      SecretKey: opts.SecretKey,
    });
  }

  _handleFile = (req: Request, file: Express.Multer.File, cb: (err?: any, info?: CustomFileResult) => void): void => {
    if (!this.Bucket) {
      cb(new Error('bucket is a required field.'));
      return;
    }

    // 判断存储桶是否存在
    this.TCCOS.headBucket(
      {
        Bucket: this.Bucket,
        Region: this.Region,
      },
      (err, data) => {
        if (data) {

          this.TCCOS.multipartInit({
            Bucket: this.Bucket,
            Region: this.Region,
            Key: this.Key || file.originalname,
          }, (err, data) => {
            if (err) {
              cb(err);
              return;
            }
            if (data) {

              const { UploadId: uploadId } = data;
              const { stream } = file;

              const uploadParams = {
                Bucket: this.Bucket,
                Region: this.Region,
                Key: this.Key || file.originalname,
                UploadId: uploadId,
              };

              let parts: Part[] = [];

              let partNumber = 0;
              let handleBufLen = 0;

              let bufs: Uint8Array[] = [];

              let isProcess = 0;

              const handleUploadProcess = () => {
                if (isProcess >= MAX_UPLOAD_NUMS) {
                  stream.pause();
                } else {
                  if (stream.isPaused()) {
                    stream.resume();
                  }
                }
              }

              const uploadMultiPart = ({ partNumber, handleBufLen, bufs }: any) => {
                this.TCCOS.multipartUpload({
                  ...uploadParams,
                  PartNumber: partNumber,
                  ContentLength: handleBufLen,
                  Body: Buffer.concat(bufs),
                }, (err, data) => {
                  isProcess -= 1;
                  handleUploadProcess();
                  if (err) {
                    cb(err);
                  } else if (data) {
                    parts.push({ ETag: data.ETag, PartNumber: partNumber });
                    if (isProcess === 0) {
                      completeUpload();
                    }
                  }
                });
              }

              const handleUploadContent = (len: number) => {
                handleBufLen += len;
                if (handleBufLen >= MINI_MUM_SLICE) {
                  isProcess += 1;
                  handleUploadProcess();
                  partNumber += 1;
                  uploadMultiPart({ partNumber, handleBufLen, bufs })
                  handleBufLen = 0;
                  bufs = [];
                }
              };

              const completeUpload = () => {
                parts.sort((a, b) => a.PartNumber - b.PartNumber);
                this.TCCOS.multipartComplete({
                  ...uploadParams,
                  Parts: parts
                }, cb);
              };

              stream.on('data', (chunk) => {
                bufs.push(chunk);
                handleUploadContent(chunk.length);
              });

              stream.on('end', () => {
                if (bufs.length !== 0) {
                  isProcess += 1;
                  partNumber += 1;
                  uploadMultiPart({ partNumber, handleBufLen, bufs });
                  handleBufLen = 0;
                  bufs = [];
                } else {
                  completeUpload();
                }
              });

            } else {
              cb(new Error('initial multipart uploads error.'))
            }
          })

        } else if (err?.statusCode === 404) {
          // 存储桶不存在
          cb(new Error('bucket is not exist.'));
        } else {
          cb(err, data);
        }
      },
    );
  };

  _removeFile = (
    _req: Request,
    file: Express.Multer.File & { name: string },
    cb: (error: Error, info?: DeleteObjectResult) => void,
  ): void => {
    const deleteParams: DeleteObjectParams = {
      Bucket: this.Bucket,
      Region: this.Region,
      Key: this.Key || file.originalname,
    };

    this.TCCOS.deleteObject(deleteParams, (err, data) => {
      return cb({ name: 'delete error', message: 'no error message', ...err }, data);
    });
  };
}

export default (opts: Options) => new TCStorageEngine(opts);
