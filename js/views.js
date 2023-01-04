const index = require("../index.js");

exports.mainPage = (req, res) => {
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
    });
  } else res.render("index");
};

exports.errorHandler = (req, res) => {
  res.redirect("/");
};
