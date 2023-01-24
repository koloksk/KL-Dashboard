class client {
  constructor(name, status = false) {
    this.name = name;
    this.status = status;
  }
}
const clients = new Map();

function addClient(name) {
  if (!hasClient(name)) {
    let newClient = new client(name);
    clients.set(name, newClient);
  }
}

function removeClient(name) {
  if(hasClient(name))
    clients.delete(name);
}
function getAllClients() {
  return Array.from(clients.values());
}

function getClientByName(name) {
  if(hasClient(name))
    return clients.get(name);
}
function hasClient(name) {
  return clients.has(name);
}
function getOfflineClients() {
    return Array.from(clients.values()).filter(client => client.status === false);
}
function getOnlineClients() {
    return Array.from(clients.values()).filter(client => client.status === true);
}
module.exports = {
  addClient,
  removeClient,
  getAllClients,
  getClientByName,
  hasClient,
  getOfflineClients,
  getOnlineClients
};
