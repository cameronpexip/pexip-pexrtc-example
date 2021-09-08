var pin = "";
var mute = false;
var pexRTC;

function doCall() {
    var conference_settings_background = document.getElementById("conference_settings_background");
    conference_settings_background.style.display = "none";

    var videoElement = document.getElementById("video");
    var name = document.getElementById("your_name").value;
    var alias = document.getElementById("conference_alias").value;
    var bandwidth = document.getElementById("bandwidth");

    bandwidth = bandwidth[bandwidth.selectedIndex].value;

    bandwidth = parseInt(bandwidth);

    pexRTC = new PexRTC();

    window.addEventListener('beforeunload', endCall);

    pexRTC.onSetup = setupCall;
    pexRTC.onConnect = callConnected;
    pexRTC.onError = endCall;
    pexRTC.onDisconnect = endCall;
    pexRTC.onChatMessage = getMessage;

    pexRTC.makeCall("pexipdemo.com", alias, name, bandwidth);
}

function callConnected(videoURL) {
    if (typeof (MediaStream) !== "undefined" && videoURL instanceof MediaStream) {
        video.srcObject = videoURL;
    } else {
        video.src = videoURL;
    }

    var conference_video_container = document.getElementById("conference_video_container");
    conference_video_container.style.display = "flex";
}

function setupCall(videoURL, pin_status) {
    pin = document.getElementById("pin").value;
    pexRTC.connect(pin);
}

function endCall(event = undefined) {
    var conference_settings_background = document.getElementById("conference_settings_background");
    conference_settings_background.style.display = "flex";

    var conference_video_container = document.getElementById("conference_video_container");
    conference_video_container.style.display = "none";

    pexRTC.disconnect();
    video.src = "";
}

function sendMessage() {
    var chat_content_text = document.getElementById("chat_content_text");
    var chat_message = document.getElementById("chat_message").value;
    var name = document.getElementById("your_name").value;

    /* I would limit the amount of entries if this was a prod version */

    chat_content_text.innerHTML += `<b>${name}</b>: ${chat_message}<br />`;
    document.getElementById("chat_message").value = "";

    pexRTC.sendChatMessage(chat_message);
}

function getMessage(message) {
    var chat_content_text = document.getElementById("chat_content_text");
    chat_content_text.innerHTML += `<b>${message.origin}</b>: ${message.payload}<br />`;

    showChat();
}

function closeChat() {
    var chat_box = document.getElementById("chat_box");
    chat_box.style.display = "none"
}

function showChat() {
    var chat_box = document.getElementById("chat_box");
    chat_box.style.display = "flex"
}

function muteToggle() {
    mute = pexRTC.muteAudio();
    setMuteColour();
}

function setMuteColour() {
    var mute_button = document.getElementById("mute_button");

    if(mute == true) {
        mute_button.style.color = "red";
    } else {
        mute_button.style.color = "#000";
    }
}