var store = require("./store");
var through = require("through");
var qs = require("querystring");

const MAX = 50 * 1024;

exports.showParking = function (req, res, next) {
  req.url = `/park?id=${req.params.id}`;
  next();
};

exports.showWeb = function (req, res, next) {
  req.url = `/web?id=${req.params.id}`;
  next();
};

exports.getFile = function (req, res, next) {
  var id = req.params.id;
  const stream = store.read(id);
  stream.on("end", () => {});
  stream.pipe(res);
};
exports.getFileWeb = function (req, res, next) {
  var id = req.params.id;
  const stream = store.read(id);
  stream.on("end", () => {
    if (next) {
      next();
    }
  });
  stream.pipe(res);
};
exports.deleteIfViewOnce = function (req, res, next) {
  var id = req.params.id;
  store.deleteIfViewOnce(id);
};

var makeId = function () {
  // see en.wikipedia.org/wiki/Base_36
  var id = String.fromCharCode(~~(Math.random() * 26) + 97).concat(
    (Math.random() + 1).toString(36).substr(2, 5)
  );
  return id;
};

var readStream = function (req, res) {
  let discard = false;
  let body = "";

  return new Promise((resolve, reject) => {
    req.setEncoding("utf8");
    req.connection.on("error", function (e) {
      return reject({ msg: "req connection error", e });
    });

    req.pipe(
      through(
        function write(data) {
          body += data;
          if (body.length > MAX) {
            return reject({ msg: "too large" });
          }
        },
        function () {
          return resolve(body);
        }
      )
    );
  });
};

exports.writeFile = function (req, res, next) {
  const id = makeId();

  return readStream(req, res)
    .then((body) => {
      return store.write(id, body);
    })
    .then(() => {
      let protocol = "http";
      if (req.connection.encrypted) protocol = "https";
      const hostname = req.headers.host;
      console.log(
        "from:",
        req.connection.address(),
        " gonig to write! " +
          protocol +
          "://" +
          hostname +
          "/id/" +
          id +
          "\nweb: " +
          protocol +
          "://" +
          hostname +
          "/web/" +
          id
      );
      return res.end(
        `raw: ${protocol}://${hostname}/id/${id}\nweb: ${protocol}://${hostname}/web/${id}\n`
      );
    })
    .catch((e) => {
      console.log("writeFile e:", e);
      switch (e.msg) {
        case "too large":
          res.write("File size exceeded " + MAX + " bytes");
          res.end("\n");
          req.connection.destroy();
          break;
        default:
          break;
      }
    });
};

exports.writeFileWeb = function (req, res, next) {
  const id = makeId();
  return readStream(req, res)
    .then((body) => {
      const obj = qs.parse(body);
      const isSecure = obj.secure;
      const text = obj.text;
      if (isSecure === undefined) {
        return store.write(id, text).then(() => {
          console.log(`https://curlpaste.com/web/${id}`);
          res.writeHead(301, { Location: "/web/" + id });
          res.end("\n");
        });
      } else {
        return store.writeViewOnce(id, text).then(() => {
          // 301 user to parking spot
          res.writeHead(301, { Location: "/park/" + id });
          res.end("\n");
        });
      }
    })
    .catch((e) => {
      console.log("writeFileWeb e:", e);
    });
};

exports.writeFileViewOnce = function (req, res, next) {
  console.log("writeFileWeb:");
  const id = makeId();
  const hostname = req.headers.host;
  var protocol = "http";
  if (req.connection.encrypted) protocol = "https";

  return readStream(req, res)
    .then((body) => {
      return store.writeViewOnce(id, body).then(() => {
        return res.end(
          `raw: ${protocol}://${hostname}/id/${id}\nweb: ${protocol}://${hostname}/web/${id}\n`
        );
      });
    })
    .catch((e) => {
      console.log("writeFileViewOnce e:", e);
    });
};

exports.cleanSecure = function () {
  store.cleanSecure();
};

exports.clean = function (req, res, next) {
  store.clean();
  res.end("Cleaned.\n");
};
