const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server);

app.use(express.static("."));

io.on("connection", socket => {
  socket.on("join", room => {
    socket.join(room);
    const roomSize = io.sockets.adapter.rooms.get(room)?.size || 0;

    if (roomSize === 1) {
      socket.emit("created");
    } else if (roomSize === 2) {
      socket.emit("joined");
      socket.to(room).emit("ready");
    } else {
      socket.leave(room);
      socket.emit("full", room);
    }
  });

  socket.on("offer", data => {
    socket.to(data.room).emit("offer", data);
  });

  socket.on("answer", data => {
    socket.to(data.room).emit("answer", data);
  });

  socket.on("candidate", data => {
    socket.to(data.room).emit("candidate", data);
  });
});

server.listen(3000, () => console.log("🚀 السيرفر شغّال على http://localhost:3000"));
