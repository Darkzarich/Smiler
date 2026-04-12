import type { Request } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import type { StorageEngine } from 'multer';
import Sharp, { type Metadata, type Sharp as SharpInstance } from 'sharp';

type Result<T> = {
  error?: Error | null;
  value?: T;
};

interface Opts {
  filename: (req: Request, file: Express.Multer.File) => Result<string>;
  destination: (req: Request, file: Express.Multer.File) => Result<string>;
  metadata: (
    req: Request,
    file: Express.Multer.File,
    metadata: Metadata,
  ) => Result<void>;
  metadataError: (
    req: Request,
    file: Express.Multer.File,
    error: unknown,
  ) => Error;
  sharp: (
    req: Request,
    file: Express.Multer.File,
    input: Buffer,
  ) => Result<SharpInstance>;
}

class DiskStorage implements StorageEngine {
  private getFilename: Opts['filename'];
  private getDestination: Opts['destination'];
  private validateMetadata: Opts['metadata'];
  private getMetadataError: Opts['metadataError'];
  private getSharp: Opts['sharp'];

  constructor(opts: Opts) {
    this.getFilename = opts.filename;
    this.getDestination = opts.destination;
    this.validateMetadata = opts.metadata;
    this.getMetadataError = opts.metadataError;
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

    const finalPath = path.join(destination.value, filename.value);

    const chunks: Buffer[] = [];
    let size = 0;
    let isDone = false;

    const finish = (
      error?: Error | null,
      info?: Partial<Express.Multer.File>,
    ) => {
      if (isDone) {
        return;
      }

      isDone = true;
      callback(error, info);
    };

    file.stream
      .on('data', (chunk: Buffer) => {
        chunks.push(chunk);
        size += chunk.length;
      })
      .on('error', finish)
      .on('end', async () => {
        try {
          const input = Buffer.concat(chunks, size);
          let metadata: Metadata;

          try {
            metadata = await Sharp(input, { failOn: 'error' }).metadata();
          } catch (error) {
            finish(this.getMetadataError(req, file, error));

            return;
          }

          const metadataValidation = this.validateMetadata(req, file, metadata);

          if (metadataValidation.error) {
            finish(metadataValidation.error);

            return;
          }

          const sharp = this.getSharp(req, file, input);

          if (sharp.error || !sharp.value) {
            finish(sharp.error);

            return;
          }

          const output = await sharp.value.toFile(finalPath);

          if (output.size > 0) {
            finish(null, {
              destination: destination.value,
              filename: filename.value,
              path: finalPath,
              size: output.size,
            });

            return;
          }

          // eslint-disable-next-line security/detect-non-literal-fs-filename
          fs.unlink(finalPath, (err) => {
            finish(err || new Error('Uploaded file was empty'));
          });
        } catch (error) {
          finish(error instanceof Error ? error : new Error(String(error)));
        }
      });
  }

  // eslint-disable-next-line class-methods-use-this
  _removeFile(
    req: Request,
    file: Express.Multer.File,
    callback: (error: Error | null) => void,
  ) {
    const filePath = file.path;

    if (!filePath) {
      return callback(new Error('File path was not provided'));
    }

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    return fs.unlink(filePath, callback);
  }
}

export default DiskStorage;
