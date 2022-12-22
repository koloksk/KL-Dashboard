

const buttons = document.querySelectorAll(".console-button");


// For each button, add an event listener that shows or hides its corresponding console
buttons.forEach(button => {
  button.addEventListener("click", (e) => {
    // Find the console corresponding to this button
    const computercardElement = button.closest(".computer-card"); //get button computer card
    const consoleElement = computercardElement.querySelector(".console"); //get console inside buttons computer card

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


  
