import fs, { ReadStream } from 'fs';
import path from 'path';
import stream from 'stream';
import onFinished from 'on-finished';

import FormData from 'form-data';

export const file = (name: string): ReadStream => {
  return fs.createReadStream(path.join(__dirname, 'files', name));
};

export const fileSize = (path: string): Number => {
  return fs.statSync(path).size;
};

export const submitFormCallback = (multer: any, form: FormData, cb: Function) => {
  form.getLength((err, length) => {
    if (err) return cb(err);

    const req: any = new stream.PassThrough();

    req.complete = false;
    form.once('end', () => {
      req.complete = true;
    });

    form.pipe(req);

    req.headers = {
      'content-type': 'multipart/form-data; boundary=' + form.getBoundary(),
      'content-length': String(length),
    };

    multer(req, null, function (err: any) {
      onFinished(req, function () {
        cb(err, req);
      });
    });
  });
};

export const asyncSubmitForm = (multer: any, form: FormData): Promise<{ err: any; req: any }> => {
  return new Promise((resolve, reject) => {
    form.getLength((err, length) => {
      if (err) reject(err);

      const req: any = new stream.PassThrough();

      req.complete = false;
      form.once('end', () => {
        req.complete = true;
      });

      form.pipe(req);

      req.headers = {
        'content-type': 'multipart/form-data; boundary=' + form.getBoundary(),
        'content-length': String(length),
      };

      multer(req, null, function (err: any) {
        onFinished(req, function () {
          resolve({ err, req });
        });
      });
    });
  });
};
