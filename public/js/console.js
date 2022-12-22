
  // Get references to the button, console, input, and output elements

  const inputs = document.querySelectorAll("#input");
  const socket = io();

  // When the user presses Enter in the input element,
  // execute the command and display the result in the output element
  inputs.forEach(input => {
    input.addEventListener("keyup", (e) => {
      if (e.key === "Enter") {
        
        const consoleElement = input.closest(".console");
        const output = consoleElement.querySelector("#output");
        output.scrollTop = output.scrollHeight; // auto scroll to bottom
        
        //const output = input.querySelector("#output");
        //console.log(output);
        
        const command = input.value;
        
        socket.emit("command", {
          id: consoleElement.id,
          cmd: command,
        });


        output.innerText += `$> ${command}\n`;
        input.value = "";
      }
    });
  });
  
  socket.on('commandResult', (data) => {
    //console.log(data.response);
    const consoleElement = document.querySelector(`.console#${data.id}`); // get console element with socket id
    //console.log(consoleElement);
    const output = consoleElement.querySelector("#output"); // get output in console element

    output.innerText += `${data.response}\n`; //print response
    output.scrollTop = output.scrollHeight; // auto scroll to bottom


  });