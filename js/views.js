const index = require("../index.js");

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
      clients: index.clients,
      offlineclients: index.offlineclients,
      latestversion: 1.3,

    });
  } else res.render("index");
};
exports.settings = (req, res) => {
  if (req.session.isLogged) {
    console.log(index.clients);

    res.render("settings", {
      isLogged: req.session.isLogged,
      username: req.session.username,
      clients: index.clients,
      offlineclients: index.offlineclients,
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
}

exports.vncclient = (req, res) => {
  const ClientName = req.params.ClientName;
  const ClientId = req.params.ClientId;

  if (req.session.isLogged) {
    res.set('Cache-Control', 'no-cache');
    res.render("vncclient", {
      clientname: ClientName,
      clientid: ClientId,
    });
  } else res.render("index");
}

exports.login = (req, res) => {
  if (req.body.username == "admin" && req.body.password == "admin") {
    console.log(`Logged in dashboard: ${req.socket.remoteAddress}`);
    req.session.isLogged = true;
    req.session.username = req.body.username;
    res.redirect("/dashboard");
  } else res.render("index");
}

exports.errorHandler = (req, res) => {
  res.redirect("/dashboard");
};
