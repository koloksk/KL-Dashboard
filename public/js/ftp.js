const deletebuttons = document.querySelectorAll(".delete-button");
// const downloadbuttons = document.querySelectorAll(".download-button");
var dropzone = document.getElementById("upload_area");
var uploadtext = document.getElementById("upload_text");
var courtine = document.getElementById("courtine");

// downloadbuttons.forEach((button) => {
//   button.addEventListener("click", async (e) => {
//     const clientname = button
//       .closest(".computer-card")
//       .getAttribute("filename"); //get button computer card

//     window.location.href = `/ftp/${clientname}`;
//   });
// });

function remove(file) {
  if (file != null) {
    socket.emit("delete-ftp", {
      filename: file,
    });

    $(`div[filename="${file}"]`).each(function () {
      // `this` is the div
      this.remove();
    });
  }
}
function upload(files) {
  console.log(files[0]);
  var data = new FormData();
  data.append("file", files[0]);

  const request = new XMLHttpRequest();

  request.open("POST", "", true);
  request.onreadystatechange = () => {
    if (request.readyState === 4 && request.status === 200) {
      Toastify({
        text: "Poprawnie załadowano plik",
        duration: 3000,
        gravity: "top", // `top` or `bottom`
        position: "right", // `left`, `center` or `right`
        stopOnFocus: true, // Prevents dismissing of toast on hover
        style: {
          background: "linear-gradient(to right, #00b09b, #96c93d)",
        },
        onClick: function(){} // Callback after click
      }).showToast();
      console.log(request.responseText);
      $("#cards").load(" #cards");

    }
  };

  request.send(data);
}

dropzone.ondrop = function (e) {
  e.preventDefault();
  courtine.className = "";
  uploadtext.className = "upload-text";
  upload(e.dataTransfer.files);
  return false;
};

dropzone.ondragover = function () {
  courtine.className = "dragover";
  uploadtext.className = "upload-text dragover";
  return false;
};

dropzone.ondragleave = function () {
  courtine.className = "";
  uploadtext.className = "upload-text";
  return false;
};
