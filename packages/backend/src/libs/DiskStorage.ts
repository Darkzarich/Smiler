import type { Request } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import type { StorageEngine } from 'multer';
import { Sharp } from 'sharp';

type Result<T> = {
  error?: Error | null;
  value?: T;
};

interface Opts {
  filename: (req: Request, file: Express.Multer.File) => Result<string>;
  destination: (req: Request, file: Express.Multer.File) => Result<string>;
  sharp: (req: Request, file: Express.Multer.File) => Result<Sharp>;
}

class DiskStorage implements StorageEngine {
  private getFilename: Opts['filename'];
  private getDestination: Opts['destination'];
  private getSharp: Opts['sharp'];

  constructor(opts: Opts) {
    this.getFilename = opts.filename;
    this.getDestination = opts.destination;
    this.getSharp = opts.sharp;
  }

  _handleFile(
    req: Request,
    file: Express.Multer.File,
    callback: (
      error?: Error | null,
      info?: Partial<Express.Multer.File>,
    ) => void,
  ) {
    const destination = this.getDestination(req, file);

    if (destination.error || !destination.value) {
      return callback(destination.error);
    }

    const filename = this.getFilename(req, file);

    if (filename.error || !filename.value) {
      return callback(filename.error);
    }

    // Picture transformer
    const sharp = this.getSharp(req, file);

    if (sharp.error || !sharp.value) {
      return callback(sharp.error);
    }

    const finalPath = path.join(destination.value, filename.value);

    sharp.value.on('error', callback);

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const outStream = fs
      .createWriteStream(finalPath)
      .on('error', callback)
      .on('finish', () => {
        if (outStream.bytesWritten > 0) {
          return callback(null, {
            destination: destination.value,
            filename: filename.value,
            path: finalPath,
            size: outStream.bytesWritten,
          });
        }

        // eslint-disable-next-line security/detect-non-literal-fs-filename
        fs.unlink(finalPath, (err) => {
          if (err) {
            callback(err);
          }
        });
      });

    file.stream.pipe(sharp.value).pipe(outStream);
  }

  // eslint-disable-next-line class-methods-use-this
  _removeFile(
    req: Request,
    file: Express.Multer.File,
    callback: (error: Error | null) => void,
  ) {
    const filePath = file.path;

    if (!filePath) {
      callback(new Error('File path was not provided'));
    }

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    return fs.unlink(filePath, callback);
  }
}

export default DiskStorage;
