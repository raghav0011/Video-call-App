// index.js
// require("dotenv").config();
const http = require("http");
const express = require("express");
const { Server: SocketIO } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);

const io = new SocketIO(server);

// Create a users map to keep track of users
const users = new Map();

io.on("connection", (socket) => {
  console.log(`user connected: ${socket.id}`);
  users.set(socket.id, socket.id);

  // emit that a new user has joined as soon as someone joins
  socket.broadcast.emit("users:joined", socket.id);
  socket.emit("hello", { id: socket.id });

  // When a client sends an outgoing call event to another client,
  // our server sends an incoming call event to the client who is being called, along with the offer.
  socket.on("outgoing:call", (data) => {
    const { fromOffer, to } = data;

    socket.to(to).emit("incomming:call", { from: socket.id, offer: fromOffer });
  });

  socket.on("call:accepted", (data) => {
    const { answer, to } = data;
    socket.to(to).emit("incomming:answer", { from: socket.id, offer: answer });
  });

  socket.on("disconnect", () => {
    console.log(`user disconnected: ${socket.id}`);
    users.delete(socket.id);
    socket.broadcast.emit("user:disconnect", socket.id);
  });
});

app.use(express.static(path.resolve("./public")));

//A route that gets the users from the user Map and sends them as json.
app.get("/users", (req, res) => {
  return res.json(Array.from(users));
});

if (process.env.PROD) {
  app.use(express.static(path.join(__dirname, "./client/build")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "./client/build/index.html"));
  });
}

const port = process.env.PORT || 8000;
server.listen(port, () => console.log(`Server started at PORT:${port}`));
