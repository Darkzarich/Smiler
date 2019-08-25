const fs = require('fs');
const path = require('path');

function DiskStorage(opts) {
  this.getFilename = opts.filename;
  this.getDestination = opts.destination;
  this.getSharp = opts.sharp;
}

DiskStorage.prototype._handleFile = function _handleFile(req, file, cb) {
  const that = this;

  console.log('file', file);

  that.getDestination(req, file, (err, destination) => {
    if (err) return cb(err);
    that.getFilename(req, file, (err, filename) => {
      if (err) return cb(err);
      that.getSharp(req, file, (err, resizer) => {
        if (err) return cb(err);

        const finalPath = path.join(destination, filename);
        const outStream = fs.createWriteStream(finalPath);

        file.stream.pipe(resizer).pipe(outStream);
        outStream.on('error', cb);
        outStream.on('finish', () => {
          cb(null, {
            destination,
            filename,
            path: finalPath,
            size: outStream.bytesWritten,
          });
        });
      });
    });
  });
};

DiskStorage.prototype._removeFile = function _removeFile(req, file, cb) {
  const { path } = file;

  delete file.destination;
  delete file.filename;
  delete file.path;

  fs.unlink(path, cb);
};

module.exports = function (opts) {
  return new DiskStorage(opts);
};
