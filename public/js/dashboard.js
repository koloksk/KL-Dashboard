const consolebuttons = document.querySelectorAll(".console-button");
const shutdownbuttons = document.querySelectorAll(".shutdown-button");
const logbuttons = document.querySelectorAll(".log-button");
const deletebuttons = document.querySelectorAll(".delete-button");
const screenshotbuttons = document.querySelectorAll(".screenshot-button");
const vncbuttons = document.querySelectorAll(".vnc-button");

// For each button, add an event listener that shows or hides its corresponding console
consolebuttons.forEach((button) => {
  button.addEventListener("click", (e) => {
    // Find the console corresponding to this button
    const computercardElement = button.closest(".computer-card"); //get button computer card
    const consoleElement = computercardElement.querySelector(".console"); //get console inside consolebuttons computer card

    if (consoleElement) {
      if (consoleElement.style.display == "none") {
        consoleElement.style.display = "block";
      } else {
        consoleElement.style.display = "none";
      }
    }

    console.log(e.target.id);
  });
});

shutdownbuttons.forEach((button) => {
  button.addEventListener("click", (e) => {
    const clientid = button.closest(".computer-card").id; //get button computer card

    socket.emit("command", {
      id: clientid,
      cmd: "shutdown /i /t 120",
    });
  });
});
screenshotbuttons.forEach((button) => {
  button.addEventListener("click", (e) => {
    const clientid = button.closest(".computer-card").id; //get button computer card

    socket.emit("command", {
      id: clientid,
      cmd: "screenshot",
    });
  });
});
logbuttons.forEach((button) => {
  button.addEventListener("click", async (e) => {
    const clientname = button
      .closest(".computer-card")
      .getAttribute("clientname"); //get button computer card

    window.location.href = `/logs/${clientname}`;
  });
});
deletebuttons.forEach((button) => {
  button.addEventListener("click", async (e) => {
    const clientname = button
      .closest(".computer-card")
      .getAttribute("clientname"); //get button computer card
      
      socket.emit("delete", {
        clientname: clientname
      });
  });
});

vncbuttons.forEach((button) => {
  button.addEventListener("click", async (e) => {
    const clientid = button.closest(".computer-card").id; //get button computer card
    const clientname = button
      .closest(".computer-card")
      .getAttribute("clientname"); //get button computer card
      
      window.location.href = `/vnc/${clientname}/${clientid}`;
  });
});
