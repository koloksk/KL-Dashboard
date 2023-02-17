const index = require("../index.js");
const utils = require("./utils.js");
const client = require("./client.js");
const settings = require("./settings.js");

const fs = require("fs");

exports.loginPage = (req, res) => {
  if (req.session.isLogged) res.redirect("/dashboard");
  else res.render("index");
};

exports.dashboard = (req, res) => {
  if (req.session.isLogged) {
    console.log(index.clients);

    res.render("dashboard", {
      isLogged: req.session.isLogged,
      username: req.session.username,
      clients: client.getOnlineClients(),
      offlineclients: client.getOfflineClients(),
      latestversion: settings.get("version"),
    });
  } else res.render("index");
};
exports.settings = (req, res) => {
  if (req.session.isLogged) {
    console.log(index.clients);

    res.render("settings", {
      isLogged: req.session.isLogged,
      username: req.session.username,
      settings: settings.getAll(),
    });
  } else res.render("index");
};

exports.change_settings = (req, res) => {
  if (req.session.isLogged) {
    if (req.body.password != "") settings.set("password", req.body.password);

    settings.set("vnc-delay", req.body.vncdelay);
    settings.set("version", req.body.version);
    settings.save();
    res.render("settings", {
      isLogged: req.session.isLogged,
      username: req.session.username,
      settings: settings.getAll(),
    });
  } else res.render("index");
};
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
    } else {
      res.redirect("/");
    }
  });
};

exports.vncclient = (req, res) => {
  const ClientName = req.params.ClientName;
  const ClientId = req.params.ClientId;

  if (req.session.isLogged) {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", 0);
    res.render("vncclient", {
      clientname: ClientName,
      clientid: ClientId,
      width: client.getClientByName(ClientName).width,
      height: client.getClientByName(ClientName).height
    });
  } else res.render("index");
};

exports.login = (req, res) => {
  if (
    req.body.username == "admin" &&
    req.body.password == settings.get("password")
  ) {
    console.log(`Logged in dashboard: ${req.socket.remoteAddress}`);
    req.session.isLogged = true;
    req.session.username = req.body.username;
    res.redirect("/dashboard");
  } else res.render("index");
};

exports.ftp = (req, res) => {
  if (req.params.FileName == null) {
    if (req.session.isLogged) {
      var files = fs.readdirSync("./ftp");
      var sizes = [];

      files.forEach(function (file) {
        sizes.push(utils.getFilesize(`./ftp/${file}`));
      });
      console.log(sizes);
      res.render("ftp", {
        isLogged: req.session.isLogged,
        username: req.session.username,
        files: files,
        sizes: sizes,
      });
    } else res.render("index");
  } else {
    res.download("ftp/" + req.params.FileName, function (err) {
      if (err) {
        console.log(err);
      }
    });
  }
};
exports.ftp_upload = (req, res) => {
  console.log(req.files);
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send("No files were uploaded.");
  }

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  let File = req.files.file;

  // Use the mv() method to place the file somewhere on your server
  File.mv(`./ftp/${File.name}`, function (err) {
    if (err) return res.status(500).send(err);

    res.send("File uploaded!");
  });
};

exports.logs = (req, res) => {
  const ClientName = req.params.ClientName;
  const FileName = req.params.FileName;
  var fileContents;
  var ext;
  var sizes = [];

  if (FileName != null) {
    //Pobiera zawartosc pliku
    try {
      ext = FileName.split(".")
        .filter(Boolean) // removes empty extensions (e.g. `filename...txt`)
        .slice(1)
        .join(".");
      if (ext == "txt") {
        fileContents = fs
          .readFileSync(`./clients/${ClientName}/${FileName}`)
          .toString();
      } else {
        fileContents = fs.readFileSync(
          `./clients/${ClientName}/${FileName}`,
          "base64"
        );
      }
    } catch (err) {}
  } else {
    fileContents = fs.readdirSync(`./clients/${ClientName}`);
    fileContents.forEach(function (file) {
      sizes.push(utils.getFilesize(`./clients/${ClientName}/${file}`));
    });
  }

  //Render log
  if (req.session.isLogged) {
    res.render("log", {
      content: fileContents,
      clientname: ClientName,
      filename: FileName,
      isLogged: req.session.isLogged,
      username: req.session.username,
      sizes: sizes,
      type: ext,
    });
  } else res.render("index");
};
exports.errorHandler = (req, res) => {
  res.redirect("/dashboard");
};
