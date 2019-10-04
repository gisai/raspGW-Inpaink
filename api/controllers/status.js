/* GET */
exports.status_get = (req, res, next) => {
  return res.status(200).send("OK"); 
}