// - Invoking io for the '/' namespace/endpoint
const socket = io("/");

// - Creating peer to peer connection
const myPeer = new Peer(undefined, {
  path: '/peerjs',
  host: "/",
  port: "443",
});

const user = prompt("Enter User Name", "User"); // - To get username
const videoGrid = document.getElementById("video__grid");
let myVidStream;
const myVid = document.createElement("video");
myVid.muted = true;
const peers = {};

// - Connecting user video
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  // - Promise
  .then((stream) => {
    myVidStream = stream;
    addVideoStream(myVid, stream);
    myPeer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        // - Sharing stream to all user screens
        setTimeout(() => {
          addVideoStream(video, userVideoStream);
        }, 1000);
      });
    });

    // - New user connection
    socket.on("user-connected", (userId,userName) => {
      setTimeout(() => {
        connectToNewUser(userId, stream);
      }, 1000);
      // - Notifies other users about the user joining the room in Chatbox
      $("ul").append(`<li class="message notify">
      <b>
      <i class="fas fa-sign-in-alt"></i>
      <span>${userName} joined the room</span> 
      </b>
      </li>`);
    });

    // - Input value of chat functionality
    let text = $("input");
    // - Sending message on pressing enterkey on keyboard
    $("html").keydown(function (e) {
      if (e.which == 13 && text.val().length !== 0) {
        socket.emit("message", text.val());
        text.val("");
      }
    });
    // - Displaying messages
    socket.on("createMessage", (message, userName) => {
      // - Displaying messages sent by user
      if (userName === user) {
        $("ul").append(`<li class="message myMessages">
        <b>
        <span>Me</span> 
        <i class="fas fa-user"></i>
        </b>
        <br/>
        ${message}
        </li>`);
      }
      // - Displaying messages sent by other users
      else {
        $("ul").append(`<li class="message">
        <b>
        <i class="fas fa-user-edit"></i>
        <span>${userName}</span> 
        </b>
        <br/>
        ${message}
        </li>`);
      }
      scrollToBottom();
    });
  });

// - User disconnects
socket.on("user-disconnected", (userId,userName) => {
  if (peers[userId]) peers[userId].close();
  // - Notifies other users about the user leaving the room in Chatbox
  $("ul").append(`<li class="message notify">
  <b>
  <span>${userName} left the room</span>
  <i class="fas fa-running"></i> 
  </b>
  </li>`);
});  

// - Connecting with peer server
myPeer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id, user);
});

// - Function called when new user joins
function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  call.on("close", () => {
    video.remove();
  });
  peers[userId] = call;
}

// - Function called to add user video to the stream
function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play(); //-  Play the video
  });
  videoGrid.append(video);
}

// - Enabling scrolling in y-axis when the messages overflow
const scrollToBottom = () => {
  var d = $(".main__chat_window");
  d.scrollTop(d.prop("scrollHeight"));
};

// - Functionality to invite other users
const invite = () => {
  const web_link = window.location.href;
  //- Copying the invite link to the same room of the namespace to clipboard
  copyToClipboard(web_link);
  alert(
    "Invite Link has been copied to clipboard,\nShare it with other attendees!\nInvite Link: " +
      web_link
  );
};
function copyToClipboard(text) {
  var clipBoard = document.createElement("textarea");
  document.body.appendChild(clipBoard);
  clipBoard.value = text;
  clipBoard.select();
  document.execCommand("copy");
  document.body.removeChild(clipBoard);
}

// - Functionality to raise hand when the user wants
const raiseHand = () => {
  socket.emit('raiseHand');
}
socket.on('raiseHand-notif', (userName) => {
  // - Notifies all users in the room about the user raising hand in Chatbox
  $("ul").append(`<li class="message notify">
        <b>
        <i class="fas fa-hand-sparkles"></i>
        <span>${userName} raised hand</span> 
        </b>
        </li>`);
})


// - Functionality to play/stop the video when the user wants
const playStop = () => {
  let enabled = myVidStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVidStream.getVideoTracks()[0].enabled = false;
    setPlayVideo();
  } else {
    myVidStream.getVideoTracks()[0].enabled = true;
    setStopVideo();
  }
};
const setStopVideo = () => {
  const html = `<i class="fas fa-video"></i>`;
  document.querySelector(".main__video_button").innerHTML = html;
};
const setPlayVideo = () => {
  const html = `<i class="stop fas fa-video-slash"></i>`;
  document.querySelector(".main__video_button").innerHTML = html;
};

// - Functionality to mute/unmute when the user wants
const muteUnmute = () => {
  const enabled = myVidStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVidStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    myVidStream.getAudioTracks()[0].enabled = true;
    setMuteButton();
  }
};
const setMuteButton = () => {
  const html = `<i class="fas fa-microphone"></i>`;
  document.querySelector(".main__mute_button").innerHTML = html;
};
const setUnmuteButton = () => {
  const html = `<i class="unmute fas fa-microphone-slash"></i>`;
  document.querySelector(".main__mute_button").innerHTML = html;
};

// - Functionality to hide and unhide hovering options based on mouse position
let hoverBoard = document.getElementById("main__hover");
function toggleUnhide() {
  hoverBoard.style.display = "flex";
}
function toggleHide() {
  hoverBoard.style.display = "none";
}

// - Functionality to display updated time of the video conference per second
const time = document.getElementById("time");
const prev = Date.now();
setInterval(() => {
  const curr = Date.now();
  const diff = Math.trunc((curr - prev) / 1000);
  const sec = diff % 60;
  const min = Math.trunc(diff / 60);
  time.innerHTML = `${min} : ${sec}`;
}, 1000);

// - Functionality to expand/compress (for all web browsers)
const full = document.querySelector(".main__fullscreen_button");
function fullscreenToggler() {
  if (getFullscreenElement()) {
    const html = `<i class="fas fa-expand"></i>`;
    full.innerHTML = html;
    document.exitFullscreen();
  } else {
    const html = `<i class="fas fa-compress"></i> `;
    full.innerHTML = html;
    document.documentElement.requestFullscreen();
  }
}
console.log(getFullscreenElement());
function getFullscreenElement() {
  return (
    document.fullscreenElement ||
    document.webKitfullscreenElement ||
    document.mozfullscreenElement ||
    document.msfullscreenElement
  );
}

// - Functionality to toggle from dark to light mode and vice versa
// - Saved 'lightMode' variable in localStorage
let lightMode = localStorage.getItem("lightMode");
const themeToggler = () => {
  lightMode = localStorage.getItem("lightMode");
  if (lightMode !== "enabled") {
    enableLightMode();
  } else {
    disableLightMode();
  }
};
const enableLightMode = () => {
  document.body.classList.add("light");
  localStorage.setItem("lightMode", "enabled");
};
const disableLightMode = () => {
  document.body.classList.remove("light");
  localStorage.setItem("lightMode", null);
};