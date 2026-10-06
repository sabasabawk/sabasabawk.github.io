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


          if(
            !incomingCallOverlay ||
            !incomingCallerName ||
            !incomingCallerAvatar ||
            !acceptIncomingCallButton ||
            !declineIncomingCallButton
          ){

            console.error(
              "Incoming-call overlay elements are missing."
            );

            return;

          }


          showIncomingCallOverlay(
            incomingCallId,
            incomingCall
          );

        }
      );

    },

    function(error){

      console.error(
        "Incoming voice-call listener error:",
        error
      );


      if(
        error?.code ===
        "permission-denied"
      ){

        console.error(
          "Firebase rules denied access to incoming voice calls."
        );

      }

    }

  );

}
/* =====================================================
   START INCOMING VIDEO CALL LISTENER
===================================================== */

function startIncomingVideoCallListener(){

  if(
    typeof unsubscribeIncomingVideoCalls ===
    "function"
  ){

    unsubscribeIncomingVideoCalls();

  }


  if(!currentUser){

    return;

  }


  const incomingVideoCallsQuery =
  query(
    collection(
      db,
      "videoCalls"
    ),
    where(
      "receiverId",
      "==",
      currentUser.uid
    )
  );


  unsubscribeIncomingVideoCalls =
  onSnapshot(

    incomingVideoCallsQuery,

    function(snapshot){

      snapshot.docChanges()
      .forEach(
        function(change){

          const incomingCall =
          change.doc.data();


          const videoCallStatus =
          String(
            incomingCall.status ||
            ""
          ).toLowerCase();


          if(
            change.doc.id ===
            currentIncomingCallId &&
            videoCallStatus !==
            "ringing"
          ){

            hideIncomingCallOverlay();

            return;

          }


          if(
            videoCallStatus !==
            "ringing"
          ){

            return;

          }


          if(
            change.doc.id ===
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


          if(
            incomingCall.receiverId !==
            currentUser.uid
          ){

            return;

          }


          showIncomingVideoCallOverlay(
            change.doc.id,
            incomingCall
          );

        }
      );

    },

    function(error){

      console.error(
        "Incoming video-call listener error:",
        error
      );

    }

  );

}
/* =====================================================
   SHOW INCOMING CALL OVERLAY
===================================================== */

function showIncomingCallOverlay(
  callId,
  callData
){

  currentIncomingCallId =
  callId;


  currentIncomingCallData =
  callData || {};


  const callerName =
  getFirstValue(
    currentIncomingCallData.callerName,
    "Faith Connect Member"
  );


  const callerPicture =
  getFirstValue(
    currentIncomingCallData.callerPicture,
    "images/profile.png"
  );


  incomingCallerName.textContent =
  callerName;


  incomingCallerAvatar.src =
  callerPicture;


  incomingCallerAvatar.onerror =
  function(){

    incomingCallerAvatar.src =
    "images/profile.png";

  };


  if(incomingCallTitle){

    incomingCallTitle.textContent =
    "Incoming Voice Call";

  }


  acceptIncomingCallButton.textContent =
  "📞";


  acceptIncomingCallButton.setAttribute(
    "aria-label",
    "Accept incoming voice call"
  );


  acceptIncomingCallButton.disabled =
  false;


  declineIncomingCallButton.disabled =
  false;


  incomingCallOverlay.classList.add(
    "show"
  );


  incomingCallOverlay.setAttribute(
    "aria-hidden",
    "false"
  );

}

/* =====================================================
   SHOW INCOMING VIDEO CALL OVERLAY
===================================================== */

function showIncomingVideoCallOverlay(
  callId,
  callData
){

  currentIncomingCallId =
  callId;


  currentIncomingCallData = {

    ...callData,

    callType:
    "video"

  };


  const callerName =
  getFirstValue(
    currentIncomingCallData.callerName,
    "Faith Connect Member"
  );


  const callerPicture =
  getFirstValue(
    currentIncomingCallData.callerPicture,
    "images/profile.png"
  );


  if(incomingCallTitle){

    incomingCallTitle.textContent =
    "Incoming Video Call";

  }


  incomingCallerName.textContent =
  callerName;


  incomingCallerAvatar.src =
  callerPicture;


  incomingCallerAvatar.onerror =
  function(){

    incomingCallerAvatar.src =
    "images/profile.png";

  };


  acceptIncomingCallButton.textContent =
  "📹";


  acceptIncomingCallButton.setAttribute(
    "aria-label",
    "Accept incoming video call"
  );


  declineIncomingCallButton.disabled =
  false;


  acceptIncomingCallButton.disabled =
  false;


  incomingCallOverlay.classList.add(
    "show"
  );


  incomingCallOverlay.setAttribute(
    "aria-hidden",
    "false"
  );

}
/* =====================================================
   HIDE INCOMING CALL OVERLAY
===================================================== */

function hideIncomingCallOverlay(){

  incomingCallOverlay.classList.remove(
    "show"
  );


  incomingCallOverlay.setAttribute(
    "aria-hidden",
    "true"
  );


  acceptIncomingCallButton.disabled =
  false;


  declineIncomingCallButton.disabled =
  false;


  currentIncomingCallId =
  "";


  currentIncomingCallData =
  null;

}
/* =====================================================
   ACCEPT INCOMING VOICE OR VIDEO CALL
===================================================== */

acceptIncomingCallButton.addEventListener(
  "click",
  function(){

    const acceptedCallId =
    currentIncomingCallId;


    const acceptedCallType =
    getFirstValue(
      currentIncomingCallData?.callType,
      currentIncomingCallData?.type,
      "voice"
    ).toLowerCase();


    if(!acceptedCallId){

      return;

    }


    if(window.self !== window.top){

      alert(
        "You are already in a call. End it first."
      );

      return;

    }


    acceptIncomingCallButton.disabled =
    true;


    declineIncomingCallButton.disabled =
    true;


    const destinationPage =
    acceptedCallType ===
    "video"
    ? "video-call.html"
    : "voice-call.html";


    hideIncomingCallOverlay();


    window.location.href =
    `${destinationPage}?call=${encodeURIComponent(
      acceptedCallId
    )}`;

  }
);
/* =====================================================
   DECLINE INCOMING VOICE OR VIDEO CALL
===================================================== */

declineIncomingCallButton.addEventListener(
  "click",
  async function(){

    const declinedCallId =
    currentIncomingCallId;


    const declinedCallType =
    getFirstValue(
      currentIncomingCallData?.callType,
      currentIncomingCallData?.type,
      "voice"
    ).toLowerCase();


    if(!declinedCallId){

      hideIncomingCallOverlay();

      return;

    }


    acceptIncomingCallButton.disabled =
    true;


    declineIncomingCallButton.disabled =
    true;


    try{

      await updateDoc(
        doc(
          db,
          declinedCallType === "video"
          ? "videoCalls"
          : "voiceCalls",
          declinedCallId
        ),
        {
          status:
          "rejected",

          endedBy:
          currentUser.uid,

          endedAt:
          serverTimestamp(),

          updatedAt:
          serverTimestamp()
        }
      );

    }catch(error){

      console.error(
        "Decline call error:",
        error
      );

    }


    hideIncomingCallOverlay();

  }
);
/* =====================================================
   AUTHENTICATION LISTENER
===================================================== */

onAuthStateChanged(
  auth,
  async function(user){

    if(!user){

      window.location.href =
      "login.html";

      return;

    }


  currentUser =
user;

disableChatControls();

startIncomingCallListener();

startIncomingVideoCallListener();

await prepareConversation();

  },

  function(error){

    console.error(
      "Authentication error:",
      error
    );


    showChatError(
      "Your account could not be confirmed. Please sign in again."
    );

  }
);


/* =====================================================
   STOP OTHER MEMBER LISTENER
===================================================== */

function stopOtherMemberListener(){

  if(
    typeof unsubscribeOtherUser ===
    "function"
  ){

    unsubscribeOtherUser();

  }


  unsubscribeOtherUser =
  null;

}

/* =====================================================
   PART 7 OF 10
   MEDIA SELECTION, PREVIEWS, EMOJI PICKER,
   IMAGEKIT UPLOAD AND MEDIA VIEWER
===================================================== */


/* =====================================================
   CREATE PREVIEW URL
===================================================== */

function createPreviewUrl(
  file
){

  if(!file){

    return "";

  }


  return URL.createObjectURL(
    file
  );

}


/* =====================================================
   RELEASE PREVIEW URL
===================================================== */

function releasePreviewUrl(){

  if(
    selectedMediaPreviewUrl
  ){

    URL.revokeObjectURL(
      selectedMediaPreviewUrl
    );


    selectedMediaPreviewUrl =
    "";

  }

}


/* =====================================================
   RESET UPLOAD PROGRESS
===================================================== */

function resetUploadProgress(){

  uploadProgressArea.classList.remove(
    "show"
  );


  uploadProgressText.textContent =
  "Uploading media...";


  uploadProgressPercent.textContent =
  "0%";


  progressBar.style.width =
  "0%";

}


/* =====================================================
   UPDATE UPLOAD PROGRESS
===================================================== */

function updateUploadProgress(
  percent,
  message
){

  const safePercent =
  Math.max(
    0,
    Math.min(
      100,
      Math.round(percent)
    )
  );


  uploadProgressArea.classList.add(
    "show"
  );


  uploadProgressText.textContent =
  message ||
  "Uploading media...";


  uploadProgressPercent.textContent =
  `${safePercent}%`;


  progressBar.style.width =
  `${safePercent}%`;

}


/* =====================================================
   CLEAR SELECTED MEDIA
===================================================== */

function clearSelectedMedia(){

  releasePreviewUrl();


  selectedMediaFile =
  null;


  selectedMediaType =
  "none";


  uploadedMediaUrl =
  "";


  uploadedMediaPublicId =
  "";


  selectedFileName =
  "";


  selectedFileSize =
  0;


  selectedFileExtension =
  "";


  recordedAudioBlob =
  null;


  recordedAudioFile =
  null;


  imageInput.value =
  "";


  videoInput.value =
  "";


  fileInput.value =
  "";


  previewContent.innerHTML =
  "";


  mediaPreviewArea.classList.remove(
    "show"
  );


  resetUploadProgress();

}

/* =====================================================
   SHOW IMAGE PREVIEW
===================================================== */

function showImagePreview(
  file
){

  clearSelectedMedia();


  selectedMediaFile =
  file;


  selectedMediaType =
  "image";


  selectedMediaPreviewUrl =
  createPreviewUrl(
    file
  );


  previewContent.innerHTML = `

    <img
      class="previewImage"
      src="${selectedMediaPreviewUrl}"
      alt="Selected picture preview"
    >

    <div class="previewDetails">

      <div class="previewType">
        Picture selected
      </div>

      <div class="previewName">
        ${escapeHtml(file.name)}
      </div>

    </div>

  `;


  mediaPreviewArea.classList.add(
    "show"
  );

}


/* =====================================================
   SHOW VIDEO PREVIEW
===================================================== */

function showVideoPreview(
  file
){

  clearSelectedMedia();


  selectedMediaFile =
  file;


  selectedMediaType =
  "video";


  selectedMediaPreviewUrl =
  createPreviewUrl(
    file
  );


  previewContent.innerHTML = `

    <video
      class="previewVideo"
      src="${selectedMediaPreviewUrl}"
      muted
      playsinline
      preload="metadata"
    ></video>

    <div class="previewDetails">

      <div class="previewType">
        Video selected
      </div>

      <div class="previewName">
        ${escapeHtml(file.name)}
      </div>

    </div>

  `;


  mediaPreviewArea.classList.add(
    "show"
  );

}


/* =====================================================
   SHOW AUDIO PREVIEW
===================================================== */

function showAudioPreview(
  file
){

  clearSelectedMedia();


  selectedMediaFile =
  file;


  selectedMediaType =
  "audio";


  selectedMediaPreviewUrl =
  createPreviewUrl(
    file
  );


  previewContent.innerHTML = `

    <audio
      class="previewAudio"
      src="${selectedMediaPreviewUrl}"
      controls
      preload="metadata"
    ></audio>

    <div class="previewDetails">

      <div class="previewType">
        Voice message ready
      </div>

      <div class="previewName">
        Tap Send to share it
      </div>

    </div>

  `;


  mediaPreviewArea.classList.add(
    "show"
  );

}
/* =====================================================
   FORMAT FILE SIZE
===================================================== */

function formatFileSize(
  bytes
){

  const safeBytes =
  Number(bytes) || 0;


  if(safeBytes < 1024){

    return `${safeBytes} B`;

  }


  if(safeBytes < 1024 * 1024){

    return `${(
      safeBytes / 1024
    ).toFixed(1)} KB`;

  }


  return `${(
    safeBytes /
    (
      1024 * 1024
    )
  ).toFixed(1)} MB`;

}


/* =====================================================
   GET FILE EXTENSION
===================================================== */

function getFileExtension(
  fileName
){

  const safeName =
  String(
    fileName || ""
  );


  const lastDotIndex =
  safeName.lastIndexOf(
    "."
  );


  if(
    lastDotIndex === -1 ||
    lastDotIndex ===
    safeName.length - 1
  ){

    return "";

  }


  return safeName
  .slice(
    lastDotIndex + 1
  )
  .toLowerCase();

}


/* =====================================================
   SHOW FILE PREVIEW
===================================================== */

function showFilePreview(
  file
){

  clearSelectedMedia();


  selectedMediaFile =
  file;


  selectedMediaType =
  "file";


  selectedFileName =
  file.name || "Shared file";


  selectedFileSize =
  Number(file.size) || 0;


  selectedFileExtension =
  getFileExtension(
    selectedFileName
  );


  previewContent.innerHTML = `

    <div
      style="
        width:70px;
        height:70px;
        flex-shrink:0;
        border-radius:12px;
        display:flex;
        align-items:center;
        justify-content:center;
        background:#dde7f1;
        font-size:34px;
      "
    >
      📄
    </div>

    <div class="previewDetails">

      <div class="previewType">
        File selected
      </div>

      <div class="previewName">
        ${escapeHtml(selectedFileName)}
      </div>

      <div class="previewName">
        ${escapeHtml(
          formatFileSize(
            selectedFileSize
          )
        )}
      </div>

    </div>

  `;


  mediaPreviewArea.classList.add(
    "show"
  );

}

/* =====================================================
   VALIDATE IMAGE FILE
===================================================== */

function validateImageFile(
  file
){

  if(!file){

    return false;

  }


  if(
    !file.type.startsWith(
      "image/"
    )
  ){

    alert(
      "Please select a valid picture."
    );


    return false;

  }


  const maximumImageSize =
  12 * 1024 * 1024;


  if(
    file.size >
    maximumImageSize
  ){

    alert(
      "The picture is too large. Please select one smaller than 12 MB."
    );


    return false;

  }


  return true;

}


/* =====================================================
   VALIDATE VIDEO FILE
===================================================== */

function validateVideoFile(
  file
){

  if(!file){

    return false;

  }


  if(
    !file.type.startsWith(
      "video/"
    )
  ){

    alert(
      "Please select a valid video."
    );


    return false;

  }


  const maximumVideoSize =
  100 * 1024 * 1024;


  if(
    file.size >
    maximumVideoSize
  ){

    alert(
      "The video is too large. Please select one smaller than 100 MB."
    );


    return false;

  }


  return true;

}


/* =====================================================
   OPEN ATTACHMENT MENU
===================================================== */

attachmentButton.addEventListener(
  "click",
  function(event){

    event.stopPropagation();


    emojiPicker.classList.remove(
      "show"
    );


    headerOptionsMenu.classList.remove(
      "show"
    );


    attachmentMenu.classList.toggle(
      "show"
    );

  }
);


/* =====================================================
   OPEN EMOJI PICKER
===================================================== */

emojiButton.addEventListener(
  "click",
  function(event){

    event.stopPropagation();


    attachmentMenu.classList.remove(
      "show"
    );


    headerOptionsMenu.classList.remove(
      "show"
    );


    emojiPicker.classList.toggle(
      "show"
    );

  }
);


/* =====================================================
   SELECT PICTURE
===================================================== */

selectImageButton.addEventListener(
  "click",
  function(){

    attachmentMenu.classList.remove(
      "show"
    );


    imageInput.click();

  }
);


/* =====================================================
   SELECT VIDEO
===================================================== */

selectVideoButton.addEventListener(
  "click",
  function(){

    attachmentMenu.classList.remove(
      "show"
    );


    videoInput.click();

  }
);
/* =====================================================
   SELECT FILE / DOCUMENT
===================================================== */

selectFileButton.addEventListener(
  "click",
  function(){

    attachmentMenu.classList.remove(
      "show"
    );


    fileInput.click();

  }
);


/* =====================================================
   VALIDATE FILE / DOCUMENT
===================================================== */

function validateDocumentFile(
  file
){

  if(!file){

    return false;

  }


  const allowedExtensions = [

    "pdf",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "ppt",
    "pptx",
    "txt",
    "zip",
    "rar",
    "csv",
    "rtf"

  ];


  const fileExtension =
  getFileExtension(
    file.name
  );


  if(
    !allowedExtensions.includes(
      fileExtension
    )
  ){

    alert(
      "This file type is not supported. Please select a PDF, Word, Excel, PowerPoint, TXT, CSV, ZIP, RAR or RTF file."
    );


    return false;

  }


  const maximumFileSize =
  25 * 1024 * 1024;


  if(
    file.size >
    maximumFileSize
  ){

    alert(
      "The file is too large. Please select one smaller than 25 MB."
    );


    return false;

  }


  return true;

}


/* =====================================================
   HANDLE SELECTED FILE / DOCUMENT
===================================================== */

fileInput.addEventListener(
  "change",
  function(){

    const file =
    fileInput.files?.[0] ||
    null;


    if(
      !validateDocumentFile(
        file
      )
    ){

      fileInput.value =
      "";


      return;

    }


    showFilePreview(
      file
    );

  }
);

/* =====================================================
   HANDLE SELECTED PICTURE
===================================================== */

imageInput.addEventListener(
  "change",
  function(){

    const file =
    imageInput.files?.[0] ||
    null;


    if(
      !validateImageFile(
        file
      )
    ){

      imageInput.value =
      "";


      return;

    }


    showImagePreview(
      file
    );

  }
);


/* =====================================================
   HANDLE SELECTED VIDEO
===================================================== */

videoInput.addEventListener(
  "change",
  function(){

    const file =
    videoInput.files?.[0] ||
    null;


    if(
      !validateVideoFile(
        file
      )
    ){

      videoInput.value =
      "";


      return;

    }


    showVideoPreview(
      file
    );

  }
);


/* =====================================================
   REMOVE MEDIA PREVIEW
===================================================== */

removePreviewButton.addEventListener(
  "click",
  function(){

    clearSelectedMedia();

  }
);


/* =====================================================
   INSERT SELECTED EMOJI
===================================================== */

emojiPicker
.querySelectorAll(
  "button"
)
.forEach(
  function(emojiOption){

    emojiOption.addEventListener(
      "click",
      function(){

        const emoji =
        emojiOption.textContent;


        const selectionStart =
        messageInput.selectionStart ??
        messageInput.value.length;


        const selectionEnd =
        messageInput.selectionEnd ??
        messageInput.value.length;


        const beginningText =
        messageInput.value.slice(
          0,
          selectionStart
        );


        const endingText =
        messageInput.value.slice(
          selectionEnd
        );


        messageInput.value =
        beginningText +
        emoji +
        endingText;


        const newCursorPosition =
        selectionStart +
        emoji.length;


        messageInput.focus();


        messageInput.setSelectionRange(
          newCursorPosition,
          newCursorPosition
        );


        emojiPicker.classList.remove(
          "show"
        );

      }
    );

  }
);


/* =====================================================
   CLOSE POPUP MENUS
===================================================== */

document.addEventListener(
  "click",
  function(event){

    if(
      !emojiPicker.contains(
        event.target
      ) &&
      event.target !==
      emojiButton
    ){

      emojiPicker.classList.remove(
        "show"
      );

    }


    if(
      !attachmentMenu.contains(
        event.target
      ) &&
      event.target !==
      attachmentButton
    ){

      attachmentMenu.classList.remove(
        "show"
      );

    }


    if(
      !event.target.closest(
        ".messageMenu"
      ) &&
      !event.target.closest(
        ".messageMenuButton"
      )
    ){

      closeAllMessageMenus();

    }

  }
);


/* =====================================================
   GET IMAGEKIT UPLOAD AUTHENTICATION

   Fetches a fresh token/signature/expire from our
   Vercel serverless function before every upload —
   the ImageKit private key never touches this page
   or the browser.
===================================================== */

async function getImagekitAuthParameters(){

  const response =
  await fetch(
    IMAGEKIT_AUTH_ENDPOINT
  );


  if(!response.ok){

    throw new Error(
      "Could not authenticate the media upload. Please try again."
    );

  }


  return response.json();

}


/* =====================================================
   UPLOAD MEDIA TO IMAGEKIT
===================================================== */

async function uploadMediaToImagekit(
  file
){

  if(!file){

    throw new Error(
      "No file was selected."
    );

  }


  const authParameters =
  await getImagekitAuthParameters();


  return new Promise(
    function(resolve,reject){

      const formData =
      new FormData();


      formData.append(
        "file",
        file
      );


      formData.append(
        "fileName",
        file.name || "chat-media"
      );


      formData.append(
        "publicKey",
        IMAGEKIT_PUBLIC_KEY
      );


      formData.append(
        "signature",
        authParameters.signature
      );


      formData.append(
        "expire",
        authParameters.expire
      );


      formData.append(
        "token",
        authParameters.token
      );


      formData.append(
        "folder",
        "/sabasaba-private-chat"
      );


      const uploadRequest =
      new XMLHttpRequest();


      uploadRequest.open(
        "POST",
        IMAGEKIT_UPLOAD_URL,
        true
      );


      uploadRequest.upload.addEventListener(
        "progress",
        function(event){

          if(
            !event.lengthComputable
          ){

            return;

          }


          const uploadPercent =
          (
            event.loaded /
            event.total
          ) * 100;


          updateUploadProgress(
  uploadPercent,
  selectedMediaType ===
  "audio"
  ? "Uploading voice message..."
  : selectedMediaType ===
    "video"
  ? "Uploading video..."
  : selectedMediaType ===
    "file"
  ? "Uploading document..."
  : "Uploading picture..."
);

        }
      );


      uploadRequest.addEventListener(
        "load",
        function(){

          let responseData =
          null;


          try{

            responseData =
            JSON.parse(
              uploadRequest.responseText
            );

          }catch(error){

            reject(
              new Error(
                "ImageKit returned an invalid response."
              )
            );


            return;

          }


          if(
            uploadRequest.status >=
            200 &&
            uploadRequest.status <
            300 &&
            responseData?.url
          ){

            updateUploadProgress(
              100,
              "Upload complete"
            );


            resolve(
  {
    url:
    responseData.url,

    publicId:
    responseData.fileId ||
    "",

    resourceType:
    responseData.fileType ||
    "",

    format:
    getFileExtension(
      responseData.name ||
      file.name ||
      ""
    ),

    duration:
    0,

    originalFilename:
    responseData.name ||
    file.name ||
    ""
  }
);


            return;

          }


          reject(
            new Error(
              responseData?.message ||
              "ImageKit upload failed."
            )
          );

        }
      );


      uploadRequest.addEventListener(
        "error",
        function(){

          reject(
            new Error(
              "Unable to upload media. Check your internet connection."
            )
          );

        }
      );


      uploadRequest.addEventListener(
        "abort",
        function(){

          reject(
            new Error(
              "The media upload was cancelled."
            )
          );

        }
      );


      uploadRequest.send(
        formData
      );

    }
  );

}


/* =====================================================
   RESET MEDIA VIEWER
===================================================== */

function resetMediaViewer(){

  viewerVideo.pause();


  viewerVideo.removeAttribute(
    "src"
  );


  viewerVideo.load();


  viewerImage.removeAttribute(
    "src"
  );


  viewerImage.style.display =
  "none";


  viewerVideo.style.display =
  "none";


  mediaViewer.classList.remove(
    "show"
  );


  mediaViewer.setAttribute(
    "aria-hidden",
    "true"
  );


  document.body.style.overflow =
  "";

}


/* =====================================================
   OPEN PICTURE FULL SCREEN
===================================================== */

function openImageViewer(
  imageUrl
){

  if(!imageUrl){

    return;

  }


  viewerVideo.pause();


  viewerVideo.style.display =
  "none";


  viewerImage.src =
  imageUrl;


  viewerImage.style.display =
  "block";


  mediaViewer.classList.add(
    "show"
  );


  mediaViewer.setAttribute(
    "aria-hidden",
    "false"
  );


  document.body.style.overflow =
  "hidden";


  viewerCloseButton.focus();

}


/* =====================================================
   OPEN VIDEO FULL SCREEN
===================================================== */

function openVideoViewer(
  videoUrl
){

  if(!videoUrl){

    return;

  }


  viewerImage.style.display =
  "none";


  viewerVideo.src =
  videoUrl;


  viewerVideo.style.display =
  "block";


  mediaViewer.classList.add(
    "show"
  );


  mediaViewer.setAttribute(
    "aria-hidden",
    "false"
  );


  document.body.style.overflow =
  "hidden";


  viewerVideo.play()
  .catch(
    function(){

    }
  );

}


/* =====================================================
   MEDIA VIEWER EVENTS
===================================================== */

viewerCloseButton.addEventListener(
  "click",
  resetMediaViewer
);


mediaViewer.addEventListener(
  "click",
  function(event){

    if(
      event.target ===
      mediaViewer
    ){

      resetMediaViewer();

    }

  }
);


document.addEventListener(
  "keydown",
  function(event){

    if(
      event.key ===
      "Escape" &&
      mediaViewer.classList.contains(
        "show"
      )
    ){

      resetMediaViewer();

    }

  }
);


/* =====================================================
   MEDIA VIEWER ERRORS
===================================================== */

viewerImage.addEventListener(
  "error",
  function(){

    alert(
      "Unable to open this picture."
    );


    resetMediaViewer();

  }
);


viewerVideo.addEventListener(
  "error",
  function(){

    alert(
      "Unable to play this video."
    );


    resetMediaViewer();

  }
);

/* =====================================================
   PART 8 OF 10
   VOICE MESSAGE RECORDING,
   MICROPHONE, TIMER AND AUDIO FILE CREATION
===================================================== */


/* =====================================================
   FORMAT RECORDING TIME
===================================================== */

function formatRecordingTime(
  seconds
){

  const safeSeconds =
  Math.max(
    0,
    Math.floor(seconds)
  );


  const minutes =
  Math.floor(
    safeSeconds / 60
  );


  const remainingSeconds =
  safeSeconds % 60;


  return `${String(minutes).padStart(
    2,
    "0"
  )}:${String(remainingSeconds).padStart(
    2,
    "0"
  )}`;

}


/* =====================================================
   UPDATE RECORDING TIMER
===================================================== */

function updateRecordingTimer(){

  recordingTime.textContent =
  formatRecordingTime(
    recordingSeconds
  );

}


/* =====================================================
   START RECORDING TIMER
===================================================== */

function startRecordingTimer(){

  stopRecordingTimer();


  recordingSeconds =
  0;


  updateRecordingTimer();


  recordingTimerInterval =
  window.setInterval(
    function(){

      recordingSeconds +=
      1;


      updateRecordingTimer();


      const maximumRecordingSeconds =
      300;


      if(
        recordingSeconds >=
        maximumRecordingSeconds
      ){

        stopVoiceRecording();

      }

    },
    1000
  );

}


/* =====================================================
   STOP RECORDING TIMER
===================================================== */

function stopRecordingTimer(){

  if(
    recordingTimerInterval
  ){

    window.clearInterval(
      recordingTimerInterval
    );

  }


  recordingTimerInterval =
  null;

}


/* =====================================================
   CHOOSE SUPPORTED AUDIO TYPE
===================================================== */

function getSupportedAudioMimeType(){

  const possibleTypes = [

    "audio/webm;codecs=opus",

    "audio/webm",

    "audio/ogg;codecs=opus",

    "audio/mp4"

  ];


  for(
    const mimeType
    of possibleTypes
  ){

    if(
      window.MediaRecorder &&
      MediaRecorder.isTypeSupported(
        mimeType
      )
    ){

      return mimeType;

    }

  }


  return "";

}


/* =====================================================
   GET AUDIO FILE EXTENSION
===================================================== */

function getAudioFileExtension(
  mimeType
){

  const normalizedType =
  String(
    mimeType || ""
  ).toLowerCase();


  if(
    normalizedType.includes(
      "ogg"
    )
  ){

    return "ogg";

  }


  if(
    normalizedType.includes(
      "mp4"
    )
  ){

    return "m4a";

  }


  return "webm";

}


/* =====================================================
   RELEASE MICROPHONE STREAM
===================================================== */

function releaseRecordingStream(){

  if(
    !recordingStream
  ){

    return;

  }


  recordingStream
  .getTracks()
  .forEach(
    function(track){

      track.stop();

    }
  );


  recordingStream =
  null;

}


/* =====================================================
   RESET RECORDING INTERFACE
===================================================== */

function resetRecordingInterface(){

  isRecording =
  false;


  voiceButton.classList.remove(
    "recording"
  );


  voiceRecordingPanel.classList.remove(
    "show"
  );


  stopRecordingTimer();


  recordingSeconds =
  0;


  updateRecordingTimer();


  releaseRecordingStream();

}


/* =====================================================
   START VOICE RECORDING
===================================================== */

async function startVoiceRecording(){

  if(
    sendingMessage ||
    !chatIsReady
  ){

    return;

  }


  closeInputMenus();


  if(
    !navigator.mediaDevices ||
    !navigator.mediaDevices.getUserMedia
  ){

    alert(
      "Voice recording is not supported by this browser."
    );


    return;

  }


  if(
    typeof MediaRecorder ===
    "undefined"
  ){

    alert(
      "Voice recording is not supported on this device."
    );


    return;

  }


  try{

    clearSelectedMedia();


    recordingStream =
    await navigator.mediaDevices
    .getUserMedia(
      {
        audio:{
          echoCancellation:true,
          noiseSuppression:true,
          autoGainControl:true
        },

        video:false
      }
    );


    const supportedMimeType =
    getSupportedAudioMimeType();


    const mediaRecorderOptions =
    supportedMimeType
    ? {
        mimeType:
        supportedMimeType
      }
    : undefined;


    mediaRecorder =
    new MediaRecorder(
      recordingStream,
      mediaRecorderOptions
    );


    recordedAudioChunks =
    [];


    recordedAudioBlob =
    null;


    recordedAudioFile =
    null;


    mediaRecorder.addEventListener(
      "dataavailable",
      function(event){

        if(
          event.data &&
          event.data.size > 0
        ){

          recordedAudioChunks.push(
            event.data
          );

        }

      }
    );


    mediaRecorder.addEventListener(
      "stop",
      function(){

        const finalMimeType =
        mediaRecorder.mimeType ||
        supportedMimeType ||
        "audio/webm";


        recordedAudioBlob =
        new Blob(
          recordedAudioChunks,
          {
            type:
            finalMimeType
          }
        );


        recordedAudioChunks =
        [];


        if(
          recordedAudioBlob.size ===
          0
        ){

          resetRecordingInterface();


          alert(
            "No sound was recorded. Please try again."
          );


          return;

        }


        const audioExtension =
        getAudioFileExtension(
          finalMimeType
        );


        const audioFilename =
        `voice-message-${Date.now()}.${audioExtension}`;


        recordedAudioFile =
        new File(
          [
            recordedAudioBlob
          ],
          audioFilename,
          {
            type:
            finalMimeType
          }
        );


        resetRecordingInterface();


        showAudioPreview(
          recordedAudioFile
        );

      }
    );


    mediaRecorder.addEventListener(
      "error",
      function(event){

        console.error(
          "Voice recording error:",
          event.error
        );


        resetRecordingInterface();


        alert(
          "Voice recording failed. Please try again."
        );

      }
    );


    mediaRecorder.start(
      250
    );


    isRecording =
    true;


    voiceButton.classList.add(
      "recording"
    );


    voiceRecordingPanel.classList.add(
      "show"
    );


    startRecordingTimer();

  }catch(error){

    console.error(
      "Unable to start voice recording:",
      error
    );


    resetRecordingInterface();


    if(
      error?.name ===
      "NotAllowedError"
    ){

      alert(
        "Microphone permission was denied. Allow microphone access and try again."
      );


      return;

    }


    if(
      error?.name ===
      "NotFoundError"
    ){

      alert(
        "No microphone was found on this device."
      );


      return;

    }


    if(
      error?.name ===
      "NotReadableError"
    ){

      alert(
        "The microphone is already being used by another app."
      );


      return;

    }


    alert(
      "Unable to start voice recording."
    );

  }

}


/* =====================================================
   STOP VOICE RECORDING
===================================================== */

function stopVoiceRecording(){

  if(
    !isRecording ||
    !mediaRecorder
  ){

    return;

  }


  if(
    mediaRecorder.state !==
    "inactive"
  ){

    mediaRecorder.stop();

  }


  isRecording =
  false;


  voiceButton.classList.remove(
    "recording"
  );


  voiceRecordingPanel.classList.remove(
    "show"
  );


  stopRecordingTimer();

}


/* =====================================================
   CANCEL VOICE RECORDING
===================================================== */

function cancelVoiceRecording(){

  if(!mediaRecorder){

    resetRecordingInterface();


    return;

  }


  try{

    mediaRecorder.ondataavailable =
    null;


    mediaRecorder.onstop =
    null;


    if(
      mediaRecorder.state !==
      "inactive"
    ){

      mediaRecorder.stop();

    }

  }catch(error){

    console.error(
      "Voice recording cancellation error:",
      error
    );

  }


  recordedAudioChunks =
  [];


  recordedAudioBlob =
  null;


  recordedAudioFile =
  null;


  clearSelectedMedia();


  resetRecordingInterface();

}


/* =====================================================
   VOICE BUTTON
===================================================== */

voiceButton.addEventListener(
  "click",
  function(){

    if(isRecording){

      stopVoiceRecording();


      return;

    }


    startVoiceRecording();

  }
);


/* =====================================================
   STOP RECORDING BUTTON
===================================================== */

stopRecordingButton.addEventListener(
  "click",
  function(){

    stopVoiceRecording();

  }
);


/* =====================================================
   CANCEL RECORDING BUTTON
===================================================== */

cancelRecordingButton.addEventListener(
  "click",
  function(){

    cancelVoiceRecording();

  }
);


/* =====================================================
   PREVENT SENDING DURING RECORDING
===================================================== */

messageInput.addEventListener(
  "focus",
  function(){

    if(isRecording){

      alert(
        "Stop or cancel the voice recording before typing a message."
      );

    }

  }
);


/* =====================================================
   INITIAL RECORDING STATE
===================================================== */

updateRecordingTimer();

/* =====================================================
   PART 9A OF 10
   MESSAGE RECEIPTS AND MESSAGE CONTENT
===================================================== */


/* =====================================================
   GET MESSAGE DELIVERY STATUS
===================================================== */

function getMessageStatus(
  messageData
){

  if(
    messageData.read ===
    true
  ){

    return {

      symbol:
      "✓✓",

      className:
      "statusRead",

      label:
      "Read"

    };

  }


  if(
    messageData.delivered ===
    true
  ){

    return {

      symbol:
      "✓✓",

      className:
      "statusDelivered",

      label:
      "Delivered"

    };

  }


  return {

    symbol:
    "✓",

    className:
    "statusSent",

    label:
    "Sent"

  };

}


/* =====================================================
   CREATE MESSAGE STATUS ELEMENT
===================================================== */

function createMessageStatusElement(
  messageData,
  isMine
){

  if(!isMine){

    return null;

  }


  const status =
  getMessageStatus(
    messageData
  );


  const statusElement =
  document.createElement(
    "span"
  );


  statusElement.className =
  `messageStatus ${status.className}`;


  statusElement.textContent =
  status.symbol;


  statusElement.title =
  status.label;


  statusElement.setAttribute(
    "aria-label",
    status.label
  );


  return statusElement;

}


/* =====================================================
   GET MESSAGE TEXT
===================================================== */

function getMessageText(
  messageData
){

  return getFirstValue(
    messageData.message,
    messageData.text,
    messageData.content,
    messageData.caption
  );

}


/* =====================================================
   GET MESSAGE MEDIA TYPE
===================================================== */

function getMessageMediaType(
  messageData
){

  return getFirstValue(
    messageData.mediaType,
    messageData.messageType,
    messageData.type,
    "none"
  ).toLowerCase();

}


/* =====================================================
   GET MESSAGE MEDIA URL
===================================================== */

function getMessageMediaUrl(
  messageData
){

  return getFirstValue(
    messageData.mediaUrl,
    messageData.imageUrl,
    messageData.imageURL,
    messageData.photoUrl,
    messageData.photoURL,
    messageData.videoUrl,
    messageData.videoURL,
    messageData.audioUrl,
    messageData.voiceUrl
  );

}


/* =====================================================
   CREATE TEXT MESSAGE
===================================================== */

function createTextMessageElement(
  messageData
){

  const messageText =
  getMessageText(
    messageData
  );


  if(!messageText){

    return null;

  }


  const textElement =
  document.createElement(
    "div"
  );


  textElement.className =
  "messageText";


  textElement.textContent =
  messageText;


  return textElement;

}


/* =====================================================
   CREATE IMAGE MESSAGE
===================================================== */

function createImageMessageElement(
  messageData
){

  const imageUrl =
  getMessageMediaUrl(
    messageData
  );


  if(!imageUrl){

    return null;

  }


  const imageElement =
  document.createElement(
    "img"
  );


  imageElement.className =
  "messageImage";


  imageElement.src =
  imageUrl;


  imageElement.alt =
  "Shared picture";


  imageElement.loading =
  "lazy";


  imageElement.dataset.fullImage =
  imageUrl;


  imageElement.addEventListener(
    "click",
    function(){

      openImageViewer(
        imageUrl
      );

    }
  );


  imageElement.addEventListener(
    "error",
    function(){

      const fallback =
      document.createElement(
        "div"
      );


      fallback.className =
      "mediaFallback";


      fallback.textContent =
      "This picture could not be loaded.";


      imageElement.replaceWith(
        fallback
      );

    },
    {
      once:true
    }
  );


  return imageElement;

}


/* =====================================================
   CREATE VIDEO MESSAGE
===================================================== */

function createVideoMessageElement(
  messageData
){

  const videoUrl =
  getMessageMediaUrl(
    messageData
  );


  if(!videoUrl){

    return null;

  }


  const videoWrapper =
  document.createElement(
    "div"
  );


  videoWrapper.className =
  "messageVideoWrapper";


  videoWrapper.dataset.fullVideo =
  videoUrl;


  const videoElement =
  document.createElement(
    "video"
  );


  videoElement.className =
  "messageVideo";


  videoElement.src =
  videoUrl;


  videoElement.preload =
  "metadata";


  videoElement.playsInline =
  true;


  videoElement.muted =
  true;


  const overlay =
  document.createElement(
    "div"
  );


  overlay.className =
  "videoOpenOverlay";


  const playIcon =
  document.createElement(
    "span"
  );


  playIcon.className =
  "videoPlayIcon";


  playIcon.textContent =
  "▶";


  overlay.appendChild(
    playIcon
  );


  videoWrapper.appendChild(
    videoElement
  );


  videoWrapper.appendChild(
    overlay
  );


  videoWrapper.addEventListener(
    "click",
    function(){

      openVideoViewer(
        videoUrl
      );

    }
  );


  videoElement.addEventListener(
    "error",
    function(){

      const fallback =
      document.createElement(
        "div"
      );


      fallback.className =
      "mediaFallback";


      fallback.textContent =
      "This video could not be loaded.";


      videoWrapper.replaceWith(
        fallback
      );

    },
    {
      once:true
    }
  );


  return videoWrapper;

}


/* =====================================================
   CREATE VOICE MESSAGE
===================================================== */

function createVoiceMessageElement(
  messageData
){

  const audioUrl =
  getMessageMediaUrl(
    messageData
  );


  if(!audioUrl){

    return null;

  }


  const voiceContainer =
  document.createElement(
    "div"
  );


  const voiceMessage =
  document.createElement(
    "div"
  );


  voiceMessage.className =
  "voiceMessage";


  const audioElement =
  document.createElement(
    "audio"
  );


  audioElement.src =
  audioUrl;


  audioElement.controls =
  true;


  audioElement.preload =
  "metadata";


  const voiceLabel =
  document.createElement(
    "div"
  );


  voiceLabel.className =
  "voiceLabel";


  voiceLabel.textContent =
  "Voice message";


  audioElement.addEventListener(
    "error",
    function(){

      voiceMessage.innerHTML =
      "";


      const fallback =
      document.createElement(
        "div"
      );


      fallback.className =
      "mediaFallback";


      fallback.textContent =
      "This voice message could not be played.";


      voiceMessage.appendChild(
        fallback
      );

    },
    {
      once:true
    }
  );


  voiceMessage.appendChild(
    audioElement
  );


  voiceContainer.appendChild(
    voiceMessage
  );


  voiceContainer.appendChild(
    voiceLabel
  );


  return voiceContainer;

}
/* =====================================================
   CREATE FILE / DOCUMENT MESSAGE
===================================================== */

function createFileMessageElement(
  messageData
){

  const fileUrl =
  getFirstValue(
    messageData.fileUrl,
    messageData.mediaUrl
  );


  if(!fileUrl){

    return null;

  }


  const fileName =
  getFirstValue(
    messageData.fileName,
    "Shared document"
  );


  const fileSize =
  Number(
    messageData.fileSize
  ) || 0;


  const fileContainer =
  document.createElement(
    "div"
  );


  fileContainer.className =
  "fileMessage";


  const fileHeader =
  document.createElement(
    "div"
  );


  fileHeader.className =
  "fileMessageHeader";


  const fileIcon =
  document.createElement(
    "div"
  );


  fileIcon.className =
  "fileMessageIcon";


  fileIcon.textContent =
  "📄";


  const fileDetails =
  document.createElement(
    "div"
  );


  fileDetails.className =
  "fileMessageDetails";


  const fileNameElement =
  document.createElement(
    "div"
  );


  fileNameElement.className =
  "fileMessageName";


  fileNameElement.textContent =
  fileName;


  fileNameElement.title =
  fileName;


  const fileSizeElement =
  document.createElement(
    "div"
  );


  fileSizeElement.className =
  "fileMessageSize";


  fileSizeElement.textContent =
  formatFileSize(
    fileSize
  );


  fileDetails.appendChild(
    fileNameElement
  );


  fileDetails.appendChild(
    fileSizeElement
  );


  fileHeader.appendChild(
    fileIcon
  );


  fileHeader.appendChild(
    fileDetails
  );


  const fileActions =
  document.createElement(
    "div"
  );


  fileActions.className =
  "fileMessageActions";


  const openButton =
  document.createElement(
    "a"
  );


  openButton.className =
  "fileMessageButton";


  openButton.href =
  fileUrl;


  openButton.target =
  "_blank";


  openButton.rel =
  "noopener noreferrer";


  openButton.textContent =
  "Open";


  const downloadButton =
  document.createElement(
    "a"
  );


  downloadButton.className =
  "fileMessageButton";


  downloadButton.href =
  fileUrl;


  downloadButton.download =
  fileName;


  downloadButton.target =
  "_blank";


  downloadButton.rel =
  "noopener noreferrer";


  downloadButton.textContent =
  "Download";


  fileActions.appendChild(
    openButton
  );


  fileActions.appendChild(
    downloadButton
  );


  fileContainer.appendChild(
    fileHeader
  );


  fileContainer.appendChild(
    fileActions
  );


  return fileContainer;

}

/* =====================================================
   CREATE MEDIA CAPTION
===================================================== */

function createMediaCaptionElement(
  messageData
){

  const caption =
  getMessageText(
    messageData
  );


  if(!caption){

    return null;

  }


  const captionElement =
  document.createElement(
    "div"
  );


  captionElement.className =
  "mediaCaption";


  captionElement.textContent =
  caption;


  return captionElement;

}


/* =====================================================
   CREATE MESSAGE CONTENT
===================================================== */

/* =====================================================
   CREATE QUOTED MOMENT REFERENCE
===================================================== */

function createMomentQuoteElement(
  messageData
){

  const replyMomentId =
  getFirstValue(
    messageData.replyMomentId
  );


  if(!replyMomentId){

    return null;

  }


  const quoteContainer =
  document.createElement(
    "div"
  );

  quoteContainer.className =
  "momentQuote";


  const thumbnail =
  document.createElement(
    "div"
  );

  thumbnail.className =
  "momentQuoteThumbnail";


  const momentImageUrl =
  getFirstValue(
    messageData.replyMomentImageUrl
  );

  const momentVideoUrl =
  getFirstValue(
    messageData.replyMomentVideoUrl
  );


  if(momentImageUrl){

    const image =
    document.createElement(
      "img"
    );

    image.src =
    momentImageUrl;

    image.alt =
    "Faith Moment photo";

    thumbnail.appendChild(
      image
    );

  }else if(momentVideoUrl){

    const video =
    document.createElement(
      "video"
    );

    video.src =
    momentVideoUrl;

    video.muted =
    true;

    thumbnail.appendChild(
      video
    );

  }else{

    const typeIcons = {

      verse:
      "📖",

      prayer:
      "🙏",

      testimony:
      "💬"

    };

    thumbnail.textContent =
    typeIcons[
      getFirstValue(
        messageData.replyMomentType
      )
    ] ||
    "✨";

  }


  const textArea =
  document.createElement(
    "div"
  );

  textArea.className =
  "momentQuoteText";


  const label =
  document.createElement(
    "div"
  );

  label.className =
  "momentQuoteLabel";

  label.textContent =
  `↩ Replying to a Faith Moment`;


  const snippet =
  document.createElement(
    "div"
  );

  snippet.className =
  "momentQuoteSnippet";

  snippet.textContent =
  getFirstValue(
    messageData.replyMomentSnippet
  );


  textArea.appendChild(
    label
  );

  textArea.appendChild(
    snippet
  );


  quoteContainer.appendChild(
    thumbnail
  );

  quoteContainer.appendChild(
    textArea
  );


  return quoteContainer;

}


function appendMessageContent(
  messageBubble,
  messageData
){

  const momentQuoteElement =
  createMomentQuoteElement(
    messageData
  );


  if(momentQuoteElement){

    messageBubble.appendChild(
      momentQuoteElement
    );

  }


  const mediaType =
  getMessageMediaType(
    messageData
  );


  let mediaElement =
  null;


  if(
    mediaType ===
    "image"
  ){

    mediaElement =
    createImageMessageElement(
      messageData
    );

  }else if(
    mediaType ===
    "video"
  ){

    mediaElement =
    createVideoMessageElement(
      messageData
    );

  }else if(
    mediaType ===
    "audio" ||
    mediaType ===
    "voice"
  ){

    mediaElement =
    createVoiceMessageElement(
      messageData
    );

  }
  else if(
  mediaType ===
  "file"
){

  mediaElement =
  createFileMessageElement(
    messageData
  );

}

  if(mediaElement){

    messageBubble.appendChild(
      mediaElement
    );


    const captionElement =
    createMediaCaptionElement(
      messageData
    );


    if(captionElement){

      messageBubble.appendChild(
        captionElement
      );

    }


    return;

  }


  const textElement =
  createTextMessageElement(
    messageData
  );


  if(textElement){

    messageBubble.appendChild(
      textElement
    );

  }

}


/* =====================================================
   STOP OTHER AUDIO PLAYERS
===================================================== */

chatArea.addEventListener(
  "play",
  function(event){

    if(
      event.target.tagName !==
      "AUDIO"
    ){

      return;

    }


    chatArea
    .querySelectorAll(
      "audio"
    )
    .forEach(
      function(audioPlayer){

        if(
          audioPlayer !==
          event.target
        ){

          audioPlayer.pause();

        }

      }
    );

  },
  true
);


/* =====================================================
   STOP OTHER VIDEO PLAYERS
===================================================== */

chatArea.addEventListener(
  "play",
  function(event){

    if(
      event.target.tagName !==
      "VIDEO"
    ){

      return;

    }


    chatArea
    .querySelectorAll(
      "video"
    )
    .forEach(
      function(videoPlayer){

        if(
          videoPlayer !==
          event.target
        ){

          videoPlayer.pause();

        }

      }
    );

  },
  true
);

/* =====================================================
   PART 9B OF 10
   COMPLETE MESSAGE ELEMENT,
   TIMESTAMP, STATUS AND OPTIONS MENU
===================================================== */


/* =====================================================
   CREATE MESSAGE MENU
===================================================== */

function createMessageMenu(
  messageId,
  isMine
){

  const menuButton =
  document.createElement(
    "button"
  );


  menuButton.type =
  "button";


  menuButton.className =
  "messageMenuButton";


  menuButton.textContent =
  "⋮";


  menuButton.setAttribute(
    "aria-label",
    "Message options"
  );


  const messageMenu =
  document.createElement(
    "div"
  );


  messageMenu.className =
  "messageMenu";


  /* Delete for me */

  const deleteForMeButton =
  document.createElement(
    "button"
  );


  deleteForMeButton.type =
  "button";


  deleteForMeButton.className =
  "messageOption deleteForMe";


  deleteForMeButton.textContent =
  "Delete for me";


  deleteForMeButton.addEventListener(
    "click",
    async function(){

      messageMenu.classList.remove(
        "show"
      );


      await deleteMessageForMe(
        messageId
      );

    }
  );


  messageMenu.appendChild(
    deleteForMeButton
  );


  /* Delete for everyone */

  if(isMine){

    const deleteForEveryoneButton =
    document.createElement(
      "button"
    );


    deleteForEveryoneButton.type =
    "button";


    deleteForEveryoneButton.className =
    "messageOption deleteForEveryone";


    deleteForEveryoneButton.textContent =
    "Delete for everyone";


    deleteForEveryoneButton.addEventListener(
      "click",
      async function(){

        messageMenu.classList.remove(
          "show"
        );


        await deleteMessageForEveryone(
          messageId
        );

      }
    );


    messageMenu.appendChild(
      deleteForEveryoneButton
    );

  }


  /* Open or close message menu */

  menuButton.addEventListener(
    "click",
    function(event){

      event.stopPropagation();


      const menuWasOpen =
      messageMenu.classList.contains(
        "show"
      );


      closeAllMessageMenus();


      if(!menuWasOpen){

        messageMenu.classList.add(
          "show"
        );

      }

    }
  );


  return {
    menuButton,
    messageMenu
  };

}


/* =====================================================
   CREATE MESSAGE FOOTER
===================================================== */

function createMessageFooter(
  messageData,
  isMine
){

  const messageFooter =
  document.createElement(
    "div"
  );


  messageFooter.className =
  "messageFooter";


  const messageTime =
  document.createElement(
    "span"
  );


  messageTime.className =
  "messageTime";


  messageTime.textContent =
  formatMessageTime(
    messageData.timestamp ||
    messageData.createdAt
  );


  messageFooter.appendChild(
    messageTime
  );


  const statusElement =
  createMessageStatusElement(
    messageData,
    isMine
  );


  if(statusElement){

    messageFooter.appendChild(
      statusElement
    );

  }


  return messageFooter;

}


/* =====================================================
   CREATE DELETED MESSAGE CONTENT
===================================================== */

function createDeletedMessageContent(){

  const deletedMessage =
  document.createElement(
    "div"
  );


  deletedMessage.className =
  "deletedMessage";


  deletedMessage.textContent =
  "This message was deleted.";


  return deletedMessage;

}


/* =====================================================
   CREATE COMPLETE MESSAGE ELEMENT
===================================================== */

function createMessageElement(
  messageId,
  messageData
){

  if(
    !currentUser ||
    !messageId
  ){

    return null;

  }


  const senderId =
  getFirstValue(
    messageData.senderId,
    messageData.userId,
    messageData.authorId
  );


  const isMine =
  senderId ===
  currentUser.uid;


  const deletedFor =
  Array.isArray(
    messageData.deletedFor
  )
  ? messageData.deletedFor
  : [];


  /* Do not show messages deleted for this user */

  if(
    deletedFor.includes(
      currentUser.uid
    )
  ){

    return null;

  }


  const messageRow =
  document.createElement(
    "div"
  );


  messageRow.className =
  isMine
  ? "messageRow mineRow"
  : "messageRow otherRow";


  messageRow.dataset.messageId =
  messageId;


  const messageBubble =
  document.createElement(
    "div"
  );


  messageBubble.className =
  isMine
  ? "messageBubble mine"
  : "messageBubble other";


  /* Message options */

  const {
    menuButton,
    messageMenu
  } =
  createMessageMenu(
    messageId,
    isMine
  );


  messageBubble.appendChild(
    menuButton
  );


  messageBubble.appendChild(
    messageMenu
  );


  /* Message content */

  if(
    messageData.deletedForEveryone ===
    true
  ){

    messageBubble.appendChild(
      createDeletedMessageContent()
    );

  }else{

    appendMessageContent(
      messageBubble,
      messageData
    );

  }


  /* Footer */

  messageBubble.appendChild(
    createMessageFooter(
      messageData,
      isMine
    )
  );


  messageRow.appendChild(
    messageBubble
  );


  return messageRow;

}


/* =====================================================
   CREATE MESSAGE DATE DIVIDER
===================================================== */

function createMessageDateDivider(
  label
){

  const dateDivider =
  document.createElement(
    "div"
  );


  dateDivider.className =
  "messageDateDivider";


  dateDivider.textContent =
  label;


  return dateDivider;

}


/* =====================================================
   CREATE NEW MESSAGE INDICATOR
===================================================== */

function createNewMessageIndicator(){

  const indicator =
  document.createElement(
    "div"
  );


  indicator.className =
  "newMessageIndicator";


  indicator.textContent =
  "New messages";


  return indicator;

}


/* =====================================================
   MESSAGE COLLECTION REFERENCE
===================================================== */

function getMessagesCollectionReference(){

  return collection(
    db,
    "conversations",
    conversationId,
    "messages"
  );

}


/* =====================================================
   CHECK WHETHER MESSAGE IS UNREAD
===================================================== */

function messageIsUnread(
  messageData
){

  return Boolean(
    currentUser &&
    messageData.senderId !==
    currentUser.uid &&
    messageData.read !==
    true
  );

}

/* =====================================================
   PART 9C OF 10
   DELIVERED AND READ RECEIPTS
===================================================== */


/* =====================================================
   MARK MESSAGE AS DELIVERED
===================================================== */

async function markMessageAsDelivered(
  messageId,
  messageData
){

  if(
    !currentUser ||
    !conversationId ||
    !messageId
  ){

    return;

  }


  if(
    messageData.senderId ===
    currentUser.uid
  ){

    return;

  }


  if(
    messageData.delivered ===
    true
  ){

    return;

  }


  try{

    await updateDoc(
      doc(
        db,
        "conversations",
        conversationId,
        "messages",
        messageId
      ),
      {

        delivered:
        true,

        deliveredAt:
        serverTimestamp()

      }
    );

  }catch(error){

    console.error(
      "Unable to mark message as delivered:",
      error
    );

  }

}


/* =====================================================
   MARK MESSAGE AS READ
===================================================== */

async function markMessageAsRead(
  messageId,
  messageData
){

  if(
    !currentUser ||
    !conversationId ||
    !messageId
  ){

    return;

  }


  if(
    messageData.senderId ===
    currentUser.uid
  ){

    return;

  }


  if(
    messageData.read ===
    true
  ){

    return;

  }


  if(
    document.visibilityState !==
    "visible"
  ){

    return;

  }


  try{

    await updateDoc(
      doc(
        db,
        "conversations",
        conversationId,
        "messages",
        messageId
      ),
      {

        delivered:
        true,

        deliveredAt:
        messageData.deliveredAt ||
        serverTimestamp(),

        read:
        true,

        readAt:
        serverTimestamp()

      }
    );

  }catch(error){

    console.error(
      "Unable to mark message as read:",
      error
    );

  }

}


/* =====================================================
   BATCH-UPDATE DELIVERED/READ RECEIPTS
===================================================== */

async function batchUpdateIncomingReceipts(
  itemsToUpdate
){

  if(
    !currentUser ||
    !conversationId ||
    itemsToUpdate.length === 0
  ){

    return;

  }


  try{

    const batch =
    writeBatch(db);


    const isPageVisible =
    document.visibilityState ===
    "visible";


    itemsToUpdate.forEach(
      function(item){

        const messageReference =
        doc(
          db,
          "conversations",
          conversationId,
          "messages",
          item.id
        );


        const updateData = {

          delivered:
          true,

          deliveredAt:
          item.data.deliveredAt ||
          serverTimestamp()

        };


        if(isPageVisible){

          updateData.read =
          true;

          updateData.readAt =
          serverTimestamp();

        }


        batch.update(
          messageReference,
          updateData
        );

      }
    );


    await batch.commit();

  }catch(error){

    console.error(
      "Batch receipt update error:",
      error
    );

  }

}


/* =====================================================
   MARK ALL VISIBLE MESSAGES AS READ
===================================================== */

async function markVisibleConversationAsRead(){

  if(
    !currentUser ||
    !conversationId ||
    document.visibilityState !==
    "visible"
  ){

    return;

  }


  const visibleMessageRows =
  chatArea.querySelectorAll(
    "[data-message-id]"
  );


  const itemsToUpdate =
  [];


  visibleMessageRows.forEach(
    function(messageRow){

      const messageId =
      messageRow.dataset.messageId;


      if(!messageId){

        return;

      }


      const messageData =
      loadedMessagesById.get(
        messageId
      );


      if(!messageData){

        return;

      }


      if(
        messageData.senderId !==
        currentUser.uid &&
        messageData.read !==
        true
      ){

        itemsToUpdate.push(
          {
            id:
            messageId,

            data:
            messageData
          }
        );

      }

    }
  );


  await batchUpdateIncomingReceipts(
    itemsToUpdate
  );

}


/* =====================================================
   REFRESH READ STATUS WHEN INPUT IS FOCUSED
===================================================== */

messageInput.addEventListener(
  "focus",
  function(){

    markVisibleConversationAsRead();

  }
);


/* =====================================================
   REFRESH READ STATUS WHEN CHAT IS TAPPED
===================================================== */

chatArea.addEventListener(
  "click",
  function(){

    if(
      document.visibilityState ===
      "visible"
    ){

      markVisibleConversationAsRead();

    }

  }
);

/* =====================================================
   PART 9D OF 10
   REAL-TIME MESSAGE LISTENER,
   DATE DIVIDERS, RENDERING AND AUTO-SCROLL
===================================================== */


/* =====================================================
   STOP MESSAGE LISTENER
===================================================== */

function stopMessagesListener(){

  if(
    typeof unsubscribeMessages ===
    "function"
  ){

    unsubscribeMessages();

  }


  unsubscribeMessages =
  null;

}


/* =====================================================
   RENDER EMPTY CONVERSATION
===================================================== */

function renderEmptyConversation(){

  cha