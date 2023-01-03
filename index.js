// index.js

const http = require("http");
const express = require("express");
const { Server: SocketIO } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);

const io = new SocketIO(server);
const PORT = process.env.PORT || 8000;

// Create a users map to keep track of users
const users = new Map();

io.on("connection", (socket) => {
  console.log(`user connected: ${socket.id}`);
  users.set(socket.id, socket.id);

  // emit that a new user has joined as soon as someone joins
  socket.broadcast.emit("users:joined", socket.id);
  socket.emit("hello", { id: socket.id });

  socket.on("outgoing:call", (data) => {
    const { fromOffer, to } = data;

    socket.to(to).emit("incomming:call", { from: socket.id, offer: fromOffer });
  });

  socket.on("call:accepted", (data) => {
    const { answere, to } = data;
    socket
      .to(to)
      .emit("incomming:answere", { from: socket.id, offer: answere });
  });

  socket.on("disconnect", () => {
    console.log(`user disconnected: ${socket.id}`);
    users.delete(socket.id);
    socket.broadcast.emit("user:disconnect", socket.id);
  });
});

app.use(express.static(path.resolve("./public")));

app.get("/users", (req, res) => {
  return res.json(Array.from(users));
});

server.listen(PORT, () => console.log(`Server started at PORT:${PORT}`));
