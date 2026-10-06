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
/*END-OF-PART-3*/
