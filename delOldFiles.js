const fs = require('fs');

const deleteOldFiles = () => {
  const dirPath = './logs/';
  const tenMinutesAgo = new Date(Date.now() - 60 * 60 * 1000);

  fs.readdir(dirPath, (err, files) => {
    if (err) throw err;

    files.forEach(file => {
      const filePath = `${dirPath}${file}`;
      const stats = fs.statSync(filePath);
      const createdTime = stats.birthtime;

      if (createdTime < tenMinutesAgo) {
        fs.unlink(filePath, err => {
          if (err && err.code !== 'ENOENT') {
            throw err;
          } else if (err && err.code === 'ENOENT') {
            // File doesn't exist, no need to throw an error
            return;
          }

        //   console.log(`Deleted old file: ${filePath}`);
        });
      }
    });
  });
};

module.exports = deleteOldFiles;