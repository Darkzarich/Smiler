const fs = require('fs');
const path = require('path');

function DiskStorage(opts) {
  this.getFilename = opts.filename;
  this.getDestination = opts.destination;
  this.getSharp = opts.sharp;
}

DiskStorage.prototype._handleFile = function _handleFile(req, file, cb) {
  const that = this;

  that.getDestination(req, file, (err1, destination) => {
    if (err1) return cb(err1);
    that.getFilename(req, file, (err2, filename) => {
      if (err2) return cb(err2);
      that.getSharp(req, file, (err3, resizer) => {
        if (err3) return cb(err3);

        const finalPath = path.join(destination, filename);
        const outStream = fs.createWriteStream(finalPath);

        file.stream.pipe(resizer).pipe(outStream);

        resizer.on('error', cb);

        outStream.on('error', cb);
        outStream.on('finish', () => {
          if (outStream.bytesWritten > 0) {
            cb(null, {
              destination,
              filename,
              path: finalPath,
              size: outStream.bytesWritten,
            });
          } else {
            fs.unlink(finalPath, (err) => {
              if (err) {
                cb(new Error(err));
              }
            });
          }
        });
      });
    });
  });
};

DiskStorage.prototype._removeFile = function _removeFile(req, file, cb) {
  const filePath = file.path;
  if (filePath) {
    fs.unlink(filePath, cb);
  } else {
    cb();
  }
};

module.exports = function (opts) {
  return new DiskStorage(opts);
};
