import multer, { Multer } from 'multer';
import COS from 'cos-nodejs-sdk-v5';
import FormData from 'form-data';

import tcosMulterStorageEngine from '../main';
import { file, asyncSubmitForm, submitFormCallback } from './util/_util';

import dotenv from 'dotenv';
dotenv.config();

const COS_URL = `${process.env.COS_BUCKET}.cos.${process.env.COS_REGION || 'ap-guangzhou'}.myqcloud.com/`;

describe('TCOS-Storage', () => {
  let cos: COS;
  let upload: Multer;

  beforeAll(async () => {
    cos = new COS({
      SecretId: process.env.COS_SECRET_ID,
      SecretKey: process.env.COS_SECRET_KEY,
    });

    const tcStorage = tcosMulterStorageEngine({
      bucket: process.env.COS_BUCKET || '',
      region: process.env.COS_REGION || 'ap-guangzhou',
      SecretId: process.env.COS_SECRET_ID,
      SecretKey: process.env.COS_SECRET_KEY,
    });

    upload = multer({
      storage: tcStorage,
    });
  });

  afterAll(async () => {});

  it('should process multipart/form-data POST request', async () => {
    const form = new FormData();
    const parser = upload.single('small0');

    form.append('name', 'TCOS-Storage');
    form.append('small0', file('small0.dat'));

    const { err, req } = await asyncSubmitForm(parser, form);
    expect(err).toBeUndefined();
    expect(req.body.name).toEqual('TCOS-Storage');
    expect(req.file.fieldname).toEqual('small0');
    expect(req.file.originalname).toEqual('small0.dat');
    expect(req.file.Location).toEqual(`${COS_URL}small0.dat`);
  });

  // it('should process empty fields and an empty file');

  it('should process multiple files', (done) => {
    const form = new FormData();
    const parser = upload.fields([
      { name: 'empty', maxCount: 1 },
      { name: 'tiny0', maxCount: 1 },
      { name: 'tiny1', maxCount: 1 },
      { name: 'small0', maxCount: 1 },
      { name: 'small1', maxCount: 1 },
      { name: 'medium', maxCount: 1 },
      { name: 'large', maxCount: 1 },
    ]);

    form.append('empty', file('empty.dat'));
    form.append('tiny0', file('tiny0.dat'));
    form.append('tiny1', file('tiny1.dat'));
    form.append('small0', file('small0.dat'));
    form.append('small1', file('small1.dat'));
    form.append('medium', file('medium.dat'));
    form.append('large', file('large.jpg'));

    submitFormCallback(parser, form, (err: any, req: any) => {
      expect(err).toBeUndefined();
      expect(JSON.stringify(req.body)).toBe('{}');

      expect(req.files.empty[0].fieldname).toBe('empty');
      expect(req.files.empty[0].originalname).toBe('empty.dat');
      expect(req.files.empty[0].Location).toBe(`${COS_URL}empty.dat`);

      expect(req.files.tiny0[0].fieldname).toBe('tiny0');
      expect(req.files.tiny0[0].originalname).toBe('tiny0.dat');
      expect(req.files.tiny0[0].Location).toBe(`${COS_URL}tiny0.dat`);

      expect(req.files.tiny1[0].fieldname).toBe('tiny1');
      expect(req.files.tiny1[0].originalname).toBe('tiny1.dat');
      expect(req.files.tiny1[0].Location).toBe(`${COS_URL}tiny1.dat`);

      expect(req.files.small0[0].fieldname).toBe('small0');
      expect(req.files.small0[0].originalname).toBe('small0.dat');
      expect(req.files.small0[0].Location).toBe(`${COS_URL}small0.dat`);

      expect(req.files.small1[0].fieldname).toBe('small1');
      expect(req.files.small1[0].originalname).toBe('small1.dat');
      expect(req.files.small1[0].Location).toBe(`${COS_URL}small1.dat`);

      expect(req.files.medium[0].fieldname).toBe('medium');
      expect(req.files.medium[0].originalname).toBe('medium.dat');
      expect(req.files.medium[0].Location).toBe(`${COS_URL}medium.dat`);

      expect(req.files.large[0].fieldname).toBe('large');
      expect(req.files.large[0].originalname).toBe('large.jpg');
      expect(req.files.large[0].Location).toBe(`${COS_URL}large.jpg`);

      done();
    });
  });

  // it ('should upload a file to a not created bucket');
});
