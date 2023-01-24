const fs = require("fs");

let json = {};

function save() {
  fs.writeFile("./settings.json", JSON.stringify(json), (err) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log("JSON data is saved");
  });
}
async function read() {
  try {
    await fs.readFile("./settings.json", function (err, data) {
      console.log(JSON.parse(data));
      json = JSON.parse(data);
    });
  } catch (err) {
    console.error(`Error reading JSON file: ${err}`);
  }
}
function get(variable) {
  return json[variable];
}
function getAll() {
  return json;
}
function set(variable, value) {
  json[variable] = value;
}

module.exports = {
  save,
  get,
  getAll,
  set,
  read,
};
