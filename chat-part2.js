

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


/*END-OF-PART-2*/
