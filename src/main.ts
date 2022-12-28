import multer from 'multer';
import { Request } from 'express';
import COS, {
  COSOptions,
  Bucket,
  Region,
  Key,
  PutObjectParams,
  DeleteObjectParams,
  DeleteObjectResult,
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
}

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
      SecretId: opts.SecretId || process.env.COS_SECRET_ID,
      SecretKey: opts.SecretKey || process.env.COS_SECRET_KEY,
    });
  }

  _handleFile = (req: Request, file: Express.Multer.File, cb: (err?: any, info?: CustomFileResult) => void): void => {
    if (!this.Bucket) {
      cb(new Error('bucket is a required field.'));
      return;
    }

    const objectParams: PutObjectParams = {
      Bucket: this.Bucket,
      Region: this.Region,
      Key: this.Key || file.originalname,
      Body: file.stream,
    };

    // 判断存储桶是否存在
    this.TCCOS.headBucket(
      {
        Bucket: this.Bucket,
        Region: this.Region,
      },
      (err, data) => {
        if (data) {
          this.TCCOS.putObject(objectParams, cb);
        } else if (err?.statusCode === 404) {
          // 存储桶不存在，依照配置考虑是否继续
          this.TCCOS.putBucket(
            {
              Bucket: this.Bucket,
              Region: this.Region,
            },
            (putErr, putData) => {
              if (putErr) {
                cb(putErr, putData);
              } else {
                // 存储桶创建成功后不能立刻上传文件，需延时一段时间（约 4000 ms）
                setTimeout(() => {
                  this.TCCOS.putObject(objectParams, cb);
                }, 4000);
              }
            },
          );
          // } else if (err?.statusCode === 403) {
          //   // 没有该存储桶读权限
          //   cb(err, data);
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
