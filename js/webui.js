var pin = '';
var mute = false;
var pexRTC = new PexRTC();

var video_devices;
var audio_devices;

var selectedCamera = 0;

function doCall() {
  var conference_settings_background = document.getElementById(
    'conference_settings_background'
  );
  conference_settings_background.style.display = 'none';

  var videoElement = document.getElementById('video');
  var name = document.getElementById('your_name').value;
  var alias = document.getElementById('conference_alias').value;
  var bandwidth = document.getElementById('bandwidth');

  bandwidth = bandwidth[bandwidth.selectedIndex].value;

  bandwidth = parseInt(bandwidth);

  window.addEventListener('beforeunload', endCall);

  console.log('PEXRTC1', pexRTC);

  pexRTC.pin = null;

  console.log('PEXRTC2', pexRTC);

  pexRTC.onSetup = setupCall;
  pexRTC.onConnect = callConnected;
  pexRTC.onError = endCall;
  pexRTC.onDisconnect = endCall;
  pexRTC.onChatMessage = getMessage;
  pexRTC.onCallTransfer = callTransfer;
  pexRTC.onConferenceUpdate = conferenceUpdate;
  pexRTC.onParticipantCreate = participantCreate;
  pexRTC.onRosterList = rosterList;
  pexRTC.onLayoutUpdate = layoutUpdate;

  // Set the video & audio source to the one selected in the dropdown
  pexRTC.video_source = $('#video_device option:selected').val();
  pexRTC.audio_source = $('#audio_device option:selected').val();

  pexRTC.makeCall('pexipdemo.com', alias, name, bandwidth);
}

/* Call Transfer Example */
function callTransfer(event) {
  console.warn(`Call Transfered!`);
  console.warn(event);
}
/* End Call Transfer Example */

function conferenceUpdate(prop) {
  console.log('DEBUG: Conference Update:', prop);
}

function participantCreate(prop) {
  console.log('DEBUG: Participant Created:', prop);
}

function rosterList(prop) {
  console.log('DEBUG: Roster List:', prop);
}

function layoutUpdate(view, participants) {
  console.log('DEBUG: Layout Update:', view, participants);
}

function callConnected(videoURL) {
  if (typeof MediaStream !== 'undefined' && videoURL instanceof MediaStream) {
    video.srcObject = videoURL;
  } else {
    video.src = videoURL;
  }

  var conference_video_container = document.getElementById(
    'conference_video_container'
  );
  conference_video_container.style.display = 'flex';

  console.log('DEBUG: uuid:', pexRTC.uuid);

  pexRTC.setPresentationInMix(true);
}

function setupCall(videoURL, pin_status) {
  if (videoURL) {
    var selfview = $('#selfview');
    document.getElementById('selfview').srcObject = videoURL;

    selfview.resizable().draggable({ containment: $('.container') });
  }

  pin = document.getElementById('pin').value;
  pexRTC.connect(pin);
}

function endCall(event = undefined) {
  var conference_settings_background = document.getElementById(
    'conference_settings_background'
  );
  conference_settings_background.style.display = 'flex';

  var conference_video_container = document.getElementById(
    'conference_video_container'
  );
  conference_video_container.style.display = 'none';

  pexRTC.disconnect();
  video.src = '';
}

function sendMessage() {
  var chat_content_text = document.getElementById('chat_content_text');
  var chat_message = document.getElementById('chat_message').value;
  var name = document.getElementById('your_name').value;

  /* I would limit the amount of entries if this was a prod version */

  chat_content_text.innerHTML += `<b>${name}</b>: ${chat_message}<br />`;
  document.getElementById('chat_message').value = '';

  pexRTC.sendChatMessage(chat_message);
}

function getMessage(message) {
  var chat_content_text = document.getElementById('chat_content_text');
  chat_content_text.innerHTML += `<b>${message.origin}</b>: ${message.payload}<br />`;

  showChat();
}

function closeChat() {
  var chat_box = document.getElementById('chat_box');
  chat_box.style.display = 'none';
}

function showChat() {
  var chat_box = document.getElementById('chat_box');
  chat_box.style.display = 'flex';
}

function muteToggle() {
  mute = pexRTC.muteAudio();
  setMuteColour();
}

function setMuteColour() {
  var mute_button = document.getElementById('mute_button');

  if (mute == true) {
    mute_button.style.color = 'red';
  } else {
    mute_button.style.color = '#000';
  }
}

async function getMediaDevices(constraints) {
  // Request permission to list devices
  await navigator.mediaDevices.getUserMedia(constraints);
  // Enumerate the devices
  let devices = await navigator.mediaDevices.enumerateDevices();

  // Filter only video devices
  video_devices = devices.filter((d) => d.kind == 'videoinput');
  // Filter only audio devices
  audio_devices = devices.filter((d) => d.kind == 'audioinput');
  console.log(video_devices);

  // Iterate through the video devices and add them to the dropdown
  video_devices.forEach(function (d) {
    $('#video_device').append(
      `<option value="${d.deviceId}">${d.label}</option>`
    );
  });

  // Iterate through the audio devices and add them to the dropdown
  audio_devices.forEach(function (d) {
    $('#audio_device').append(
      `<option value="${d.deviceId}">${d.label}</option>`
    );
  });

  // When the video device dropdown is changes, set the video source and store the video index for swapping
  $('#video_device').on('change', function () {
    selectedCamera = $('#audio_device option:selected').index();
    pexRTC.video_source = $('#video_device option:selected').val();
  });

  // When the audio device dropdown is changes, set the audio source
  $('#audio_device').on('change', function () {
    pexRTC.audio_source = $('#audio_device option:selected').val();
  });
}

function switchCamera() {
  // Increment the selected camera
  selectedCamera++;

  // If the index is outside the array
  if (selectedCamera >= video_devices.length) {
    // Reset to 0
    selectedCamera = 0;
  }

  // Set the video source to the new camera
  pexRTC.video_source = video_devices[selectedCamera].deviceId;
  console.log(`Switch to ${pexRTC.video_source}`);
  console.log(`audio_source ${pexRTC.audio_source}`);

  // Release the device, thanks to https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/stop
  // Basically stops the camera from staying active in the window
  stopStreamedVideo(document.getElementById('selfview'));

  // Renegotiate the media only
  pexRTC.renegotiate(false);
}

// Get the Media Devices on load
getMediaDevices({
  video: {
    height: {
      min: 1080,
    },
    width: {
      min: 1920,
    },
  },
  audio: true,
});

function stopStreamedVideo(videoElem) {
  const stream = videoElem.srcObject;
  const tracks = stream.getTracks();

  tracks.forEach(function (track) {
    track.stop();
  });

  videoElem.srcObject = null;
}
