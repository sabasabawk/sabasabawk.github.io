// Sound URLs (Using clean WebRTC/SIP call audio tones)
const SOUND_URLS = {
  ringtone: 'https://actions.google.com/sounds/v1/communication/phone_ringing.ogg', // Continuous incoming ring
  dialtone: 'https://actions.google.com/sounds/v1/communication/dial_tone.ogg',     // Outgoing dial sound
  endCall: 'https://actions.google.com/sounds/v1/communication/phone_hang_up.ogg'    // Hangup/Ended beep
};

// Create Audio Objects
const sounds = {
  ringtone: new Audio(SOUND_URLS.ringtone),
  dialtone: new Audio(SOUND_URLS.dialtone),
  endCall: new Audio(SOUND_URLS.endCall)
};

// Loop long tones
sounds.ringtone.loop = true;
sounds.dialtone.loop = true;

// Audio Controller Object
const CallSounds = {
  // Play incoming ringtone (when receiving a call)
  playIncoming() {
    this.stopAll();
    sounds.ringtone.currentTime = 0;
    sounds.ringtone.play().catch(e => console.warn("Autoplay blocked:", e));
  },

  // Play outgoing dial tone (when calling someone)
  playOutgoing() {
    this.stopAll();
    sounds.dialtone.currentTime = 0;
    sounds.dialtone.play().catch(e => console.warn("Autoplay blocked:", e));
  },

  // Play hangup tone when call ends or is rejected
  playEnded() {
    this.stopAll();
    sounds.endCall.currentTime = 0;
    sounds.endCall.play().catch(e => console.warn("Audio play blocked:", e));
  },

  // Stop all active call tones
  stopAll() {
    sounds.ringtone.pause();
    sounds.ringtone.currentTime = 0;
    sounds.dialtone.pause();
    sounds.dialtone.currentTime = 0;
  }
};

// Unlock mobile web audio on first tap
document.addEventListener('touchstart', function unlockAudio() {
  Object.values(sounds).forEach(audio => {
    audio.load();
  });
  document.removeEventListener('touchstart', unlockAudio);
}, { once: true });
