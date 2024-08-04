const fs = require('fs');
const path = require('path');

/**
 * @typedef {import('multer').StorageEngine} StorageEngine
 * @implements {StorageEngine}
 */
class DiskStorage {
  constructor(opts) {
    this.getFilename = opts.filename;
    this.getDestination = opts.destination;
    this.getSharp = opts.sharp;
  }

  _handleFile(req, file, callback) {
    const that = this;

    this.getDestination(req, file, (err1, destination) => {
      if (err1) return callback(err1);
      that.getFilename(req, file, (err2, filename) => {
        if (err2) return callback(err2);
        that.getSharp(req, file, (err3, resizer) => {
          if (err3) return callback(err3);

          const finalPath = path.join(destination, filename);
          // eslint-disable-next-line security/detect-non-literal-fs-filename
          const outStream = fs.createWriteStream(finalPath);

          file.stream.pipe(resizer).pipe(outStream);

          resizer.on('error', callback);

          outStream.on('error', callback);

          outStream.on('finish', () => {
            if (outStream.bytesWritten > 0) {
              callback(null, {
                destination,
                filename,
                path: finalPath,
                size: outStream.bytesWritten,
              });
            } else {
              // eslint-disable-next-line security/detect-non-literal-fs-filename
              fs.unlink(finalPath, (err) => {
                if (err) {
                  callback(err);
                }
              });
            }
          });
        });
      });
    });
  }

  // eslint-disable-next-line class-methods-use-this
  _removeFile(req, file, cb) {
    const filePath = file.path;

    if (filePath) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      fs.unlink(filePath, cb);
    } else {
      cb();
    }
  }
}

module.exports = DiskStorage;
