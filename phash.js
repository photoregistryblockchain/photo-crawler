const fs = require('fs');
const axios = require('axios');
const imghash = require('imghash');

const cleanMedia = (filename) => fs.unlinkSync(filename)

const downloadMedia = (url, filename) =>
  axios({
    url,
    responseType: 'stream',
  }).then(
    response =>
      new Promise((resolve, reject) => {
        response.data
          .pipe(fs.createWriteStream(filename))
          .on('finish', () => resolve())
          .on('error', e => reject(e));
      }),
  );

const getPHash = async (url) => {
  const filename = Math.random().toString()
  if (url) {
    try {
      await downloadMedia(url, filename)
      const hash = await imghash.hash(filename)
      cleanMedia(filename);
      return hash;
    } catch (err) { }
  }
};

module.exports = {
  getPHash
}