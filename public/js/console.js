
  // Get references to the button, console, input, and output elements

  const inputs = document.querySelectorAll("#input");

  // When the user presses Enter in the input element,
  // execute the command and display the result in the output element
  inputs.forEach(input => {
    input.addEventListener("keyup", (e) => {
      if (e.key === "Enter") {

        const computercardElement = input.closest(".computer-card");
        const output = computercardElement.querySelector("#output");
        output.scrollTop = output.scrollHeight; // auto scroll to bottom
        
        //const output = input.querySelector("#output");
        //console.log(output);
        
        const command = input.value;
        
        socket.emit("command", {
          id: computercardElement.id,
          cmd: command,
        });


        output.innerText += `$> ${command}\n`;
        input.value = "";
      }
    });
  });
  
  socket.on('commandResult', (data) => {
    //console.log(data.response);
    const computercardElement = document.querySelector(`.computer-card#${data.id}`); // get console element with socket id
    console.log(computercardElement);
    const output = computercardElement.querySelector("#output"); // get output in console element

    output.innerText += `${data.response}\n`; //print response
    output.scrollTop = output.scrollHeight; // auto scroll to bottom


  });