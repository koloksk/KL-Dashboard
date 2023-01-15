const consolebuttons = document.querySelectorAll(".console-button");
const shutdownbuttons = document.querySelectorAll(".shutdown-button");
// const logbuttons = document.querySelectorAll(".log-button");
const deletebuttons = document.querySelectorAll(".delete-button");
// const screenshotbuttons = document.querySelectorAll(".screenshot-button");
// const vncbuttons = document.querySelectorAll(".vnc-button");
//const computer_list = document.querySelector('.computer-cards');

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
      cmd: "shutdown",
    });
  });
});
// screenshotbuttons.forEach((button) => {
//   button.addEventListener("click", (e) => {
//     const clientid = button.closest(".computer-card").id; //get button computer card

//     socket.emit("command", {
//       id: clientid,
//       cmd: "screenshot",
//     });
//   });
// });
// logbuttons.forEach((button) => {
//   button.addEventListener("click", async (e) => {
//     const clientname = button
//       .closest(".computer-card")
//       .getAttribute("clientname"); //get button computer card

//     window.location.href = `/logs/${clientname}`;
//   });
// });
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

function showoptions(element){
  if(window.innerWidth < 767)
  var optionsdisplay = element.parentElement.querySelector(".options").style.display;
  if(optionsdisplay == "block")
    element.parentElement.querySelector(".options").style.display = "none";
  else {
    element.parentElement.querySelector(".options").style.display = "block";

  }
}
// vncbuttons.forEach((button) => {
//   button.addEventListener("click", async (e) => {
//     const clientid = button.closest(".computer-card").id; //get button computer card
//     const clientname = button
//       .closest(".computer-card")
//       .getAttribute("clientname"); //get button computer card
      
//       window.location.href = `/vnc/${clientname}/${clientid}`;
//   });
// });

//Auto refresh page content
socket.on("join", (msg) => {
  $('#cards').load(' #cards');
});
socket.on("leave", (msg) => {
  $('#cards').load(' #cards');
});