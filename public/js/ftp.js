const deletebuttons = document.querySelectorAll(".delete-button");
const downloadbuttons = document.querySelectorAll(".download-button");
var dropzone = document.getElementById("upload_area");

downloadbuttons.forEach((button) => {
  button.addEventListener("click", async (e) => {
    const clientname = button
      .closest(".computer-card")
      .getAttribute("filename"); //get button computer card

    window.location.href = `/ftp/download/${clientname}`;
  });
});
deletebuttons.forEach((button) => {
  button.addEventListener("click", async (e) => {
    const clientname = button
      .closest(".computer-card")
      .getAttribute("clientname"); //get button computer card

    socket.emit("delete", {
      clientname: clientname,
    });
  });
});

var upload = function (files) {
  var formData = new FormData(),
    x;

  for (x = 0; x < files.length; x++) {
    formData.append("file[]", files[x]);
  }

  fetch("./ftp/upload/", {
    method: "POST",
    body: formData,
  })
    .then((res) => console.log(res))
    .catch((err) => ("Error occured", err));
};

dropzone.ondrop = function (e) {
  e.preventDefault();
  this.className = "dropzone";
  upload(e.dataTransfer.files);
};

dropzone.ondragover = function () {
  this.className = "dropzone dragover";
  return false;
};

dropzone.ondragleave = function () {
  this.className = "dropzone";
  return false;
};
