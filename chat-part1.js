/* =====================================================
   PART 5 OF 10
   FIREBASE IMPORTS, IMAGEKIT SETTINGS,
   PAGE ELEMENTS, STATE, URL DATA,
   VOICE CALL BUTTON AND GENERAL HELPERS
===================================================== */


/* =====================================================
   FIREBASE IMPORTS
===================================================== */

import{
  auth,
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  onAuthStateChanged,
  limit,
  startAfter,
  writeBatch
}from "./firebase.js";


/* =====================================================
   IMAGEKIT SETTINGS
===================================================== */

const IMAGEKIT_PUBLIC_KEY =
"public_RMynf3IEhbVAkjTfzqWnp5moKCY=";

const IMAGEKIT_URL_ENDPOINT =
"https://ik.imagekit.io/f5si9ehav";

const IMAGEKIT_AUTH_ENDPOINT =
"https://sabasabawk-github-io.vercel.app/api/imagekit-auth";

const IMAGEKIT_UPLOAD_URL =
"https://upload.imagekit.io/api/v1/files/upload";


/* =====================================================
   HEADER ELEMENTS
===================================================== */

const backButton =
document.getElementById(
  "backButton"
);


const chatAvatar =
document.getElementById(
  "chatAvatar"
);


const onlineDot =
document.getElementById(
  "onlineDot"
);


const chatName =
document.getElementById(
  "chatName"
);


const chatStatus =
document.getElementById(
  "chatStatus"
);


const voiceCallButton =
document.getElementById(
  "voiceCallButton"
);
const videoCallButton =
document.getElementById(
  "videoCallButton"
);

const headerOptionsButton =
document.getElementById(
  "headerOptionsButton"
);


const headerOptionsMenu =
document.getElementById(
  "headerOptionsMenu"
);


const viewProfileButton =
document.getElementById(
  "viewProfileButton"
);


const clearChatButton =
document.getElementById(
  "clearChatButton"
);


/* =====================================================
   CHAT CONTENT ELEMENTS
===================================================== */

const chatArea =
document.getElementById(
  "chatArea"
);


const typingIndicator =
document.getElementById(
  "typingIndicator"
);


const typingMemberName =
document.getElementById(
  "typingMemberName"
);


/* =====================================================
   MESSAGE INPUT ELEMENTS
===================================================== */

const messageInput =
document.getElementById(
  "messageInput"
);


const sendButton =
document.getElementById(
  "sendButton"
);


const emojiButton =
document.getElementById(
  "emojiButton"
);


const emojiPicker =
document.getElementById(
  "emojiPicker"
);


const attachmentButton =
document.getElementById(
  "attachmentButton"
);


const attachmentMenu =
document.getElementById(
  "attachmentMenu"
);


const voiceButton =
document.getElementById(
  "voiceButton"
);


/* =====================================================
   IMAGE AND VIDEO ELEMENTS
===================================================== */

const selectImageButton =
document.getElementById(
  "selectImageButton"
);


const selectVideoButton =
document.getElementById(
  "selectVideoButton"
);
const selectFileButton =
document.getElementById(
  "selectFileButton"
);

const imageInput =
document.getElementById(
  "imageInput"
);


const videoInput =
document.getElementById(
  "videoInput"
);
const fileInput =
document.getElementById(
  "fileInput"
);

const mediaPreviewArea =
document.getElementById(
  "mediaPreviewArea"
);


const previewContent =
document.getElementById(
  "previewContent"
);


const removePreviewButton =
document.getElementById(
  "removePreviewButton"
);


/* =====================================================
   FAITH MOMENT REPLY ELEMENTS
===================================================== */

const momentReplyPreviewArea =
document.getElementById(
  "momentReplyPreviewArea"
);

const momentReplyThumbnail =
document.getElementById(
  "momentReplyThumbnail"
);

const momentReplyAuthorName =
document.getElementById(
  "momentReplyAuthorName"
);

const momentReplySnippet =
document.getElementById(
  "momentReplySnippet"
);

const cancelMomentReplyButton =
document.getElementById(
  "cancelMomentReplyButton"
);


/* =====================================================
   UPLOAD PROGRESS ELEMENTS
===================================================== */

const uploadProgressArea =
document.getElementById(
  "uploadProgressArea"
);


const uploadProgressText =
document.getElementById(
  "uploadProgressText"
);


const uploadProgressPercent =
document.getElementById(
  "uploadProgressPercent"
);


const progressBar =
document.getElementById(
  "progressBar"
);


/* =====================================================
   VOICE RECORDING ELEMENTS
===================================================== */

const voiceRecordingPanel =
document.getElementById(
  "voiceRecordingPanel"
);


const recordingTime =
document.getElementById(
  "recordingTime"
);


const cancelRecordingButton =
document.getElementById(
  "cancelRecordingButton"
);


const stopRecordingButton =
document.getElementById(
  "stopRecordingButton"
);


/* =====================================================
   FULL-SCREEN VIEWER ELEMENTS
===================================================== */

const mediaViewer =
document.getElementById(
  "mediaViewer"
);


const viewerCloseButton =
document.getElementById(
  "viewerCloseButton"
);


const viewerImage =
document.getElementById(
  "viewerImage"
);


const viewerVideo =
document.getElementById(
  "viewerVideo"
);


/* =====================================================
   BUSY OVERLAY ELEMENTS
===================================================== */

const chatBusyOverlay =
document.getElementById(
  "chatBusyOverlay"
);


const chatBusyText =
document.getElementById(
  "chatBusyText"
);

/* =====================================================
   INCOMING CALL OVERLAY ELEMENTS
===================================================== */

const incomingCallOverlay =
document.getElementById(
  "incomingCallOverlay"
);
const incomingCallTitle =
document.getElementById(
  "incomingCallTitle"
);
const incomingCallerAvatar =
document.getElementById(
  "incomingCallerAvatar"
);

const incomingCallerName =
document.getElementById(
  "incomingCallerName"
);

const acceptIncomingCallButton =
document.getElementById(
  "acceptIncomingCallButton"
);

const declineIncomingCallButton =
document.getElementById(
  "declineIncomingCallButton"
);
/* =====================================================
   CURRENT USER AND CHAT STATE
===================================================== */

let currentUser =
null;


let currentProfile =
{};


let otherUid =
"";


let otherProfile =
{};


let conversationId =
"";


let unsubscribeMessages =
null;


let unsubscribeOtherUser =
null;
let unsubscribeIncomingCalls =
null;


/* Incoming video-call listener */

let unsubscribeIncomingVideoCalls =
null;


let currentIncomingCallId =
"";

let currentIncomingCallData =
null;


/* Incoming video-call state */

let currentIncomingVideoCallId =
"";

let currentIncomingVideoCallData =
null;


let openedIncomingCallId =
"";

let sendingMessage =
false;


let chatIsReady =
false;


/* =====================================================
   FAITH MOMENT REPLY STATE
===================================================== */

let pendingMomentReply =
null;


/* =====================================================
   SELECTED MEDIA STATE
===================================================== */

let selectedMediaFile =
null;


let selectedMediaType =
"none";


let selectedMediaPreviewUrl =
"";


let uploadedMediaUrl =
"";


let uploadedMediaPublicId =
"";
let selectedFileName =
"";

let selectedFileSize =
0;

let selectedFileExtension =
"";

/* =====================================================
   VOICE RECORDING STATE
===================================================== */

let mediaRecorder =
null;


let recordingStream =
null;


let recordedAudioChunks =
[];


let recordedAudioBlob =
null;


let recordedAudioFile =
null;


let recordingTimerInterval =
null;


let recordingSeconds =
0;


let isRecording =
false;


/* =====================================================
   TYPING STATE
===================================================== */

let typingStopTimer =
null;


let currentUserTyping =
false;


/* =====================================================
   URL DATA
===================================================== */

const urlParameters =
new URLSearchParams(
  window.location.search
);


otherUid =
getFirstValue(
  urlParameters.get("uid"),
  urlParameters.get("user"),
  urlParameters.get("userId"),
  urlParameters.get("member"),
  urlParameters.get("id")
);


/* =====================================================
   DEFAULT PROFILE PICTURE
===================================================== */

const DEFAULT_PROFILE_PICTURE =
"images/profile.png";


/* =====================================================
   GET FIRST AVAILABLE VALUE
===================================================== */

function getFirstValue(
  ...values
){

  for(const value of values){

    if(
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ){

      return String(value).trim();

    }

  }

  return "";

}


/* =====================================================
   CREATE SAFE CONVERSATION ID
===================================================== */

function createConversationId(
  firstUid,
  secondUid
){

  return [
    firstUid,
    secondUid
  ]
  .sort()
  .join("_");

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHtml(
  value
){

  const temporaryElement =
  document.createElement(
    "div"
  );


  temporaryElement.textContent =
  String(
    value ?? ""
  );


  return temporaryElement.innerHTML;

}


/* =====================================================
   SHOW BUSY OVERLAY
===================================================== */

function showBusyOverlay(
  message = "Please wait..."
){

  chatBusyText.textContent =
  message;


  chatBusyOverlay.classList.add(
    "show"
  );


  chatBusyOverlay.setAttribute(
    "aria-hidden",
    "false"
  );

}


/* =====================================================
   HIDE BUSY OVERLAY
===================================================== */

function hideBusyOverlay(){

  chatBusyOverlay.classList.remove(
    "show"
  );


  chatBusyOverlay.setAttribute(
    "aria-hidden",
    "true"
  );

}


/* =====================================================
   SHOW CHAT ERROR
===================================================== */

function showChatError(
  message
){

  chatArea.innerHTML = `

    <div class="errorMessage">
      ${escapeHtml(message)}
    </div>

  `;


  sendButton.disabled =
  true;


  messageInput.disabled =
  true;


  emojiButton.disabled =
  true;


  attachmentButton.disabled =
  true;


  voiceButton.disabled =
  true;


  voiceCallButton.disabled =
  true;
videoCallButton.disabled =
true;

  chatIsReady =
  false;

}


/* =====================================================
   ENABLE CHAT CONTROLS
===================================================== */

function enableChatControls(){

  sendButton.disabled =
  false;


  messageInput.disabled =
  false;


  emojiButton.disabled =
  false;


  attachmentButton.disabled =
  false;


  voiceButton.disabled =
  false;


  voiceCallButton.disabled =
  false;
videoCallButton.disabled =
false;

  chatIsReady =
  true;

}


/* =====================================================
   DISABLE CHAT CONTROLS
===================================================== */

function disableChatControls(){

  sendButton.disabled =
  true;


  messageInput.disabled =
  true;


  emojiButton.disabled =
  true;


  attachmentButton.disabled =
  true;


  voiceButton.disabled =
  true;


  voiceCallButton.disabled =
  true;
videoCallButton.disabled =
true;

  chatIsReady =
  false;

}


/* =====================================================
   BACK BUTTON
===================================================== */

backButton.addEventListener(
  "click",
  function(){

    if(
      document.referrer &&
      document.referrer !==
      window.location.href
    ){

      window.history.back();

      return;

    }


    window.location.href =
    "messages.html";

  }
);


/* =====================================================
   START PRIVATE VOICE CALL
===================================================== */

voiceCallButton.addEventListener(
  "click",
  function(){

    if(!currentUser){

      window.location.href =
      "login.html";

      return;

    }


    if(!otherUid){

      alert(
        "The member information is missing."
      );

      return;

    }


    if(
      otherUid ===
      currentUser.uid
    ){

      alert(
        "You cannot call your own account."
      );

      return;

    }


    window.location.href =
    `voice-call.html?user=${encodeURIComponent(
      otherUid
    )}`;

  }
);
/* =====================================================
   START PRIVATE VIDEO CALL
===================================================== */

videoCallButton.addEventListener(
  "click",
  function(){

    if(!currentUser){

      window.location.href =
      "login.html";

      return;

    }


    if(!otherUid){

      alert(
        "The member information is missing."
      );

      return;

    }


    if(
      otherUid ===
      currentUser.uid
    ){

      alert(
        "You cannot call your own account."
      );

      return;

    }


    window.location.href =
    `video-call.html?user=${encodeURIComponent(
      otherUid
    )}`;

  }
);

/* =====================================================
   OPEN MEMBER PROFILE
===================================================== */

function openOtherMemberProfile(){

  if(!otherUid){

    return;

  }


  window.location.href =
  `user-profile.html?uid=${encodeURIComponent(
    otherUid
  )}`;

}


chatAvatar.addEventListener(
  "click",
  openOtherMemberProfile
);


chatName.addEventListener(
  "click",
  openOtherMemberProfile
);


viewProfileButton.addEventListener(
  "click",
  function(){

    headerOptionsMenu.classList.remove(
      "show"
    );


    openOtherMemberProfile();

  }
);


/* =====================================================
   HEADER OPTIONS MENU
===================================================== */

headerOptionsButton.addEventListener(
  "click",
  function(event){

    event.stopPropagation();


    headerOptionsMenu.classList.toggle(
      "show"
    );


    emojiPicker.classList.remove(
      "show"
    );


    attachmentMenu.classList.remove(
      "show"
    );

  }
);


/* =====================================================
   CLOSE HEADER OPTIONS
===================================================== */

document.addEventListener(
  "click",
  function(event){

    if(
      !headerOptionsMenu.contains(
        event.target
      ) &&
      event.target !==
      headerOptionsButton
    ){

      headerOptionsMenu.classList.remove(
        "show"
      );

    }

  }
);


/* =====================================================
   FORMAT MESSAGE TIME
===================================================== */

function formatMessageTime(
  timestamp
){

  if(!timestamp){

    return "";

  }


  let messageDate;


  if(
    typeof timestamp.toDate ===
    "function"
  ){

    messageDate =
    timestamp.toDate();

  }else if(
    timestamp.seconds
  ){

    messageDate =
    new Date(
      timestamp.seconds * 1000
    );

  }else{

    messageDate =
    new Date(timestamp);

  }


  if(
    Number.isNaN(
      messageDate.getTime()
    )
  ){

    return "";

  }


  return messageDate
  .toLocaleTimeString(
    [],
    {
      hour:
      "2-digit",

      minute:
      "2-digit"
    }
  );

}


/* =====================================================
   FORMAT MESSAGE DATE
===================================================== */

function formatMessageDate(
  timestamp
){

  if(!timestamp){

    return "Today";

  }


  let messageDate;


  if(
    typeof timestamp.toDate ===
    "function"
  ){

    messageDate =
    timestamp.toDate();

  }else if(
    timestamp.seconds
  ){

    messageDate =
    new Date(
      timestamp.seconds * 1000
    );

  }else{

    messageDate =
    new Date(timestamp);

  }


  if(
    Number.isNaN(
      messageDate.getTime()
    )
  ){

    return "Today";

  }


  const today =
  new Date();


  const yesterday =
  new Date();


  yesterday.setDate(
    today.getDate() - 1
  );


  if(
    messageDate.toDateString() ===
    today.toDateString()
  ){

    return "Today";

  }


  if(
    messageDate.toDateString() ===
    yesterday.toDateString()
  ){

    return "Yesterday";

  }


  return messageDate
  .toLocaleDateString(
    [],
    {
      day:
      "numeric",

      month:
      "short",

      year:
      "numeric"
    }
  );

}


/* =====================================================
   FORMAT LAST SEEN
===================================================== */

function formatLastSeen(
  timestamp
){

  if(!timestamp){

    return "Offline";

  }


  let lastSeenDate;


  if(
    typeof timestamp.toDate ===
    "function"
  ){

    lastSeenDate =
    timestamp.toDate();

  }else if(
    timestamp.seconds
  ){

    lastSeenDate =
    new Date(
      timestamp.seconds * 1000
    );

  }else{

    lastSeenDate =
    new Date(timestamp);

  }


  if(
    Number.isNaN(
      lastSeenDate.getTime()
    )
  ){

    return "Offline";

  }


  const now =
  new Date();


  const differenceMinutes =
  Math.floor(
    (
      now.getTime() -
      lastSeenDate.getTime()
    ) / 60000
  );


  if(differenceMinutes < 1){

    return "Last seen just now";

  }


  if(differenceMinutes < 60){

    return `Last seen ${differenceMinutes} minute${
      differenceMinutes === 1
      ? ""
      : "s"
    } ago`;

  }


  const differenceHours =
  Math.floor(
    differenceMinutes / 60
  );


  if(differenceHours < 24){

    return `Last seen ${differenceHours} hour${
      differenceHours === 1
      ? ""
      : "s"
    } ago`;

  }


  return `Last seen ${
    lastSeenDate.toLocaleDateString(
      [],
      {
        day:
        "numeric",

        month:
        "short"
      }
    )
  } at ${
    lastSeenDate.toLocaleTimeString(
      [],
      {
        hour:
        "2-digit",

        minute:
        "2-digit"
      }
    )
  }`;

}


/* =====================================================
   SCROLL TO LATEST MESSAGE
===================================================== */

function scrollToLatestMessage(){

  window.requestAnimationFrame(
    function(){

      chatArea.scrollTop =
      chatArea.scrollHeight;

    }
  );

}


/* =====================================================
   CLOSE MESSAGE MENUS
===================================================== */

function closeAllMessageMenus(){

  document
  .querySelectorAll(
    ".messageMenu.show"
  )
  .forEach(
    function(menu){

      menu.classList.remove(
        "show"
      );

    }
  );

}


/* =====================================================
   CLOSE INPUT MENUS
===================================================== */

function closeInputMenus(){

  emojiPicker.classList.remove(
    "show"
  );


  attachmentMenu.classList.remove(
    "show"
  );


  headerOptionsMenu.classList.remove(
    "show"
  );

}


/* =====================================================
   AUTO-GROW MESSAGE INPUT
===================================================== */

messageInput.addEventListener(
  "input",
  function(){

    messageInput.style.height =
    "auto";


    messageInput.style.height =
    `${Math.min(
      messageInput.scrollHeight,
      120
    )}px`;

  }
);


/* =====================================================
   INITIAL STATE
===================================================== */

disableChatControls();

hideBusyOverlay();

/* =====================================================
   PART 6 OF 10
   AUTHENTICATION, USER PROFILES,
   ONLINE STATUS AND CONVERSATION SETUP
===================================================== */


/* =====================================================
   GET PROFILE NAME
===================================================== */

function getProfileName(
  profile,
  fallback = "Member"
){

  return getFirstValue(
    profile?.name,
    profile?.fullName,
    profile?.displayName,
    profile?.username,
    fallback
  );

}


/* =====================================================
   GET PROFILE PICTURE
===================================================== */

function getProfilePicture(
  profile
){

  return getFirstValue(
    profile?.profilePicture,
    profile?.picture,
    profile?.photoURL,
    profile?.photoUrl,
    profile?.imageUrl,
    DEFAULT_PROFILE_PICTURE
  );

}


/* =====================================================
   LOAD CURRENT USER PROFILE
===================================================== */

async function loadCurrentUserProfile(){

  currentProfile =
  {};


  if(!currentUser){

    return;

  }


  try{

    const currentUserSnapshot =
    await getDoc(
      doc(
        db,
        "users",
        currentUser.uid
      )
    );


    if(
      currentUserSnapshot.exists()
    ){

      currentProfile = {
        id:
        currentUserSnapshot.id,

        ...currentUserSnapshot.data()
      };

    }else{

      currentProfile = {

        id:
        currentUser.uid,

        name:
        getFirstValue(
          currentUser.displayName,
          currentUser.email,
          "Member"
        ),

        profilePicture:
        getFirstValue(
          currentUser.photoURL,
          DEFAULT_PROFILE_PICTURE
        )

      };

    }

  }catch(error){

    console.error(
      "Current profile loading error:",
      error
    );


    currentProfile = {

      id:
      currentUser.uid,

      name:
      getFirstValue(
        currentUser.displayName,
        currentUser.email,
        "Member"
      ),

      profilePicture:
      getFirstValue(
        currentUser.photoURL,
        DEFAULT_PROFILE_PICTURE
      )

    };

  }

}


/* =====================================================
   LOAD OTHER MEMBER PROFILE
===================================================== */

async function loadOtherMemberProfile(){

  if(!otherUid){

    throw new Error(
      "The member identification is missing."
    );

  }


  const memberSnapshot =
  await getDoc(
    doc(
      db,
      "users",
      otherUid
    )
  );


  if(
    !memberSnapshot.exists()
  ){

    throw new Error(
      "This member profile does not exist."
    );

  }


  otherProfile = {
    id:
    memberSnapshot.id,

    ...memberSnapshot.data()
  };


  updateOtherMemberHeader(
    otherProfile
  );

}


/* =====================================================
   UPDATE OTHER MEMBER HEADER
===================================================== */

function updateOtherMemberHeader(
  profileData
){

  const memberNameValue =
  getProfileName(
    profileData,
    "Member"
  );


  const memberPicture =
  getProfilePicture(
    profileData
  );


  chatName.textContent =
  memberNameValue;


  typingMemberName.textContent =
  memberNameValue;


  chatAvatar.src =
  memberPicture;


  updateOtherMemberStatus(
    profileData
  );

}


/* =====================================================
   PROFILE PICTURE FALLBACK
===================================================== */

chatAvatar.addEventListener(
  "error",
  function(){

    chatAvatar.src =
    DEFAULT_PROFILE_PICTURE;

  },
  {
    once:true
  }
);


/* =====================================================
   UPDATE OTHER MEMBER STATUS
===================================================== */

function updateOtherMemberStatus(
  profileData
){

  const isOnline =
  profileData?.online === true;


  if(isOnline){

    onlineDot.classList.add(
      "online"
    );


    chatStatus.textContent =
    "Online";


    return;

  }


  onlineDot.classList.remove(
    "online"
  );


  chatStatus.textContent =
  formatLastSeen(
    profileData?.lastSeen
  );

}


/* =====================================================
   WATCH OTHER MEMBER PROFILE AND STATUS
===================================================== */

function watchOtherMemberStatus(){

  if(!otherUid){

    return;

  }


  if(
    typeof unsubscribeOtherUser ===
    "function"
  ){

    unsubscribeOtherUser();

  }


  unsubscribeOtherUser =
  onSnapshot(

    doc(
      db,
      "users",
      otherUid
    ),

    function(memberSnapshot){

      if(
        !memberSnapshot.exists()
      ){

        return;

      }


      otherProfile = {
        id:
        memberSnapshot.id,

        ...memberSnapshot.data()
      };


      updateOtherMemberHeader(
        otherProfile
      );

    },

    function(error){

      console.error(
        "Other member status listener error:",
        error
      );

    }

  );

}


/* =====================================================
   SET CURRENT USER ONLINE
===================================================== */

async function setCurrentUserOnline(){

  if(!currentUser){

    return;

  }


  try{

    await setDoc(
      doc(
        db,
        "users",
        currentUser.uid
      ),
      {

        online:
        true,

        lastSeen:
        serverTimestamp()

      },
      {
        merge:true
      }
    );

  }catch(error){

    console.error(
      "Unable to set online status:",
      error
    );

  }

}


/* =====================================================
   SET CURRENT USER OFFLINE
===================================================== */

async function setCurrentUserOffline(){

  if(!currentUser){

    return;

  }


  try{

    await setDoc(
      doc(
        db,
        "users",
        currentUser.uid
      ),
      {

        online:
        false,

        lastSeen:
        serverTimestamp()

      },
      {
        merge:true
      }
    );

  }catch(error){

    console.error(
      "Unable to set offline status:",
      error
    );

  }

}


/* =====================================================
   WATCH PAGE VISIBILITY
===================================================== */

document.addEventListener(
  "visibilitychange",
  async function(){

    if(!currentUser){

      return;

    }


    if(
      document.visibilityState ===
      "visible"
    ){

      await setCurrentUserOnline();

      await markVisibleConversationAsRead();

    }else{

      await setCurrentUserOffline();

    }

  }
);


/* =====================================================
   WINDOW FOCUS STATUS
===================================================== */

window.addEventListener(
  "focus",
  async function(){

    if(!currentUser){

      return;

    }


    await setCurrentUserOnline();

    await markVisibleConversationAsRead();

  }
);


/* =====================================================
   WINDOW BLUR STATUS
===================================================== */

window.addEventListener(
  "blur",
  async function(){

    if(!currentUser){

      return;

    }


    await setCurrentUserOffline();

  }
);


/* =====================================================
   FAITH MOMENT REPLY BANNER
===================================================== */

function renderMomentReplyThumbnail(
  container,
  momentReply
){

  container.innerHTML =
  "";


  if(momentReply.momentImageUrl){

    const image =
    document.createElement(
      "img"
    );


    image.src =
    momentReply.momentImageUrl;


    image.alt =
    "Faith Moment photo";


    container.appendChild(
      image
    );


    return;

  }


  if(momentReply.momentVideoUrl){

    const video =
    document.createElement(
      "video"
    );


    video.src =
    momentReply.momentVideoUrl;


    video.muted =
    true;


    container.appendChild(
      video
    );


    return;

  }


  const typeIcons = {

    verse:
    "📖",

    prayer:
    "🙏",

    testimony:
    "💬"

  };


  container.textContent =
  typeIcons[
    momentReply.momentType
  ] ||
  "✨";

}


function showMomentReplyBanner(
  momentReply
){

  pendingMomentReply =
  momentReply;


  momentReplyAuthorName.textContent =
  momentReply.momentUserName ||
  "this member";


  momentReplySnippet.textContent =
  momentReply.momentSnippet ||
  "";


  renderMomentReplyThumbnail(
    momentReplyThumbnail,
    momentReply
  );


  momentReplyPreviewArea.classList.add(
    "show"
  );

}


function clearMomentReplyBanner(){

  pendingMomentReply =
  null;


  momentReplyPreviewArea.classList.remove(
    "show"
  );


  momentReplyThumbnail.innerHTML =
  "";


  momentReplyAuthorName.textContent =
  "";


  momentReplySnippet.textContent =
  "";

}


cancelMomentReplyButton.addEventListener(
  "click",
  function(){

    clearMomentReplyBanner();

  }
);


function checkForPendingMomentReply(){

  let storedReply =
  "";


  try{

    storedReply =
    window.sessionStorage.getItem(
      "pendingMomentReply"
    ) ||
    "";

  }catch(error){

    console.warn(
      "Unable to read pending moment reply:",
      error
    );

    return;

  }


  if(!storedReply){

    return;

  }


  try{

    window.sessionStorage.removeItem(
      "pendingMomentReply"
    );

  }catch(error){

    /* Ignore — the read above already succeeded. */

  }


  try{

    const momentReply =
    JSON.parse(
      storedReply
    );


    if(
      momentReply?.momentUserId ===
      otherUid
    ){

      showMomentReplyBanner(
        momentReply
      );

    }

  }catch(error){

    console.warn(
      "Pending moment reply could not be read:",
      error
    );

  }

}


/* =====================================================
   PREPARE PRIVATE CONVERSATION
===================================================== */

async function prepareConversation(){

  if(!currentUser){

    return;

  }


  if(!otherUid){

    showChatError(
      "Unable to open this conversation because the member identification is missing."
    );

    chatName.textContent =
    "Member not found";


    chatStatus.textContent =
    "Invalid chat link";


    return;

  }


  if(
    otherUid ===
    currentUser.uid
  ){

    showChatError(
      "You cannot open a private conversation with your own account."
    );


    chatName.textContent =
    "Your profile";


    chatStatus.textContent =
    "Private chat unavailable";


    return;

  }


  conversationId =
  createConversationId(
    currentUser.uid,
    otherUid
  );


  checkForPendingMomentReply();


  watchOtherMemberStatus();


  startTypingListener();


  loadMessages();


  enableChatControls();


  messageInput.focus();


  setCurrentUserOnline();


  loadCurrentUserProfile();


  try{

    await loadOtherMemberProfile();

  }catch(error){

    console.error(
      "Conversation preparation error:",
      error
    );


    showChatError(
      error?.message ||
      "This private conversation could not be opened."
    );

  }

}
/* =====================================================
   LISTEN FOR INCOMING VOICE CALLS
===================================================== */

function stopIncomingCallListener(){

  if(
    typeof unsubscribeIncomingCalls ===
    "function"
  ){

    unsubscribeIncomingCalls();

  }

  unsubscribeIncomingCalls =
  null;

}


function startIncomingCallListener(){

  stopIncomingCallListener();


  if(!currentUser){

    return;

  }


  const incomingCallsQuery =
  query(
    collection(
      db,
      "voiceCalls"
    ),
    where(
      "receiverId",
      "==",
      currentUser.uid
    )
  );


  unsubscribeIncomingCalls =
  onSnapshot(

    incomingCallsQuery,

    function(snapshot){

      snapshot.docChanges()
      .forEach(
        function(change){

          const incomingCallId =
          change.doc.id;


          const incomingCall =
          change.doc.data();


          const callStatusValue =
          String(
            incomingCall.status ||
            ""
          ).toLowerCase();


          if(
            incomingCallId ===
            currentIncomingCallId &&
            callStatusValue !==
            "ringing"
          ){

            hideIncomingCallOverlay();

            return;

          }


          if(
            callStatusValue !==
            "ringing" ||
            incomingCall.receiverId !==
            currentUser.uid
          ){

            return;

          }


          if(
            incomingCallId ===
            currentIncomingCallId
          ){

            return;

          }


          const createdAtMillis =
          incomingCall.createdAt?.toMillis?.();

          if(
            createdAtMillis &&
            Date.now() - createdAtMillis > 60000
          ){

            return;

          }


          openedIncomingCallId =
          incomingCallId;
/*END-OF-PART-1*/
