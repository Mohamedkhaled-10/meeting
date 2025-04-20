const socket = io();
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

let localStream;
let peerConnection;
let room;
const config = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

function createRoom() {
  room = Math.floor(Math.random() * 1000000).toString();
  document.getElementById("roomInput").value = room;
  joinRoom();
  alert(`تم إنشاء الغرفة برقم: ${room}`);
}

function joinRoom() {
  room = document.getElementById("roomInput").value;
  if (!room) return alert("من فضلك ادخل رقم الغرفة");

  socket.emit("join", room);

  navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
      localVideo.srcObject = stream;
      localStream = stream;
    });
}

socket.on("created", () => {
  console.log("تم إنشاء الغرفة وانتظر أحد ينضم");
});

socket.on("joined", () => {
  console.log("انضممت إلى الغرفة");
  socket.emit("ready", room);
});

socket.on("ready", async () => {
  peerConnection = new RTCPeerConnection(config);
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.ontrack = event => {
    remoteVideo.srcObject = event.streams[0];
  };

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit("offer", { offer, room });

  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit("candidate", { candidate: event.candidate, room });
    }
  };
});

socket.on("offer", async (data) => {
  peerConnection = new RTCPeerConnection(config);
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.ontrack = event => {
    remoteVideo.srcObject = event.streams[0];
  };

  await peerConnection.setRemoteDescription(data.offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit("answer", { answer, room });

  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit("candidate", { candidate: event.candidate, room });
    }
  };
});

socket.on("answer", (data) => {
  peerConnection.setRemoteDescription(data.answer);
});

socket.on("candidate", (data) => {
  peerConnection.addIceCandidate(data.candidate);
});

// جزء الدردشة
const chatBox = document.getElementById("chat-box");
const chatInput = document.getElementById("chatInput");

// إرسال الرسالة
function sendMessage() {
  const message = chatInput.value;
  if (message.trim() !== "") {
    socket.emit("chat-message", { roomId: room, message: message });
    appendMessage("أنا: " + message);
    chatInput.value = "";
  }
}

// استقبال الرسائل
socket.on("chat-message", (data) => {
  appendMessage("شخص آخر: " + data.message);
});

// إضافة الرسالة إلى مربع الدردشة
function appendMessage(msg) {
  const p = document.createElement("p");
  p.textContent = msg;
  chatBox.appendChild(p);
  chatBox.scrollTop = chatBox.scrollHeight;
}
