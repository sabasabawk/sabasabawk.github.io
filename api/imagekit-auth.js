const crypto = require('crypto');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const token = crypto.randomUUID();
  const expire = Math.floor(Date.now() / 1000) + 2400;

  const signature = crypto
    .createHmac('sha1', privateKey)
    .update(token + expire)
    .digest('hex');

  res.status(200).json({ token, expire, signature });
};