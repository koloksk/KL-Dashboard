const consolebuttons = document.querySelectorAll(".console-button");
const shutdownbuttons = document.querySelectorAll(".shutdown-button");
const logbuttons = document.querySelectorAll(".log-button");
const deletebuttons = document.querySelectorAll(".delete-button");

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
    socket.emit("command", {
      id: e.target.id,
      cmd: "shutdown /i /t 120",
    });
  });
});

logbuttons.forEach((button) => {
  button.addEventListener("click", async (e) => {
    const clientname = button
      .closest(".computer-card")
      .getAttribute("clientname"); //get button computer card

    window.location.href = `/log?clientname=${clientname}`;
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
