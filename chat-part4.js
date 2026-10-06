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

  chatArea.innerHTML = `

    <div class="emptyMessage">

      No messages yet.

      <br><br>

      Start this private conversation.

    </div>

  `;

}


/* =====================================================
   RENDER MESSAGE LOAD ERROR
===================================================== */

function renderMessageLoadError(){

  chatArea.innerHTML = `

    <div class="errorMessage">

      Unable to load this conversation.

      <br><br>

      Please check your internet connection and refresh the page.

    </div>

  `;

}


/* =====================================================
   MESSAGE PAGINATION STATE
===================================================== */

const MESSAGES_PAGE_SIZE =
50;


let latestMessagesDocsCache =
[];


let olderMessagesDocs =
[];


let oldestLoadedMessageDoc =
null;


let noOlderMessages =
false;


let isLoadingOlderMessages =
false;


const loadedMessagesById =
new Map();


/* =====================================================
   SIMPLE LOCAL CACHE FOR FASTER REPEAT LOADS
===================================================== */

const CHAT_CACHE_PREFIX =
"sabasaba_chat_cache_v1_";

const CHAT_CACHE_MAX_MESSAGES =
30;

const CHAT_CACHE_MAX_AGE_MS =
30 * 60 * 1000;


function getChatCacheKey(){

  return CHAT_CACHE_PREFIX +
  conversationId;

}


function saveMessagesCache(orderedDocs){

  try{

    const cachedMessages =
    orderedDocs

    .slice(
      -CHAT_CACHE_MAX_MESSAGES
    )

    .map(
      messageDoc => ({

        id:
        messageDoc.id,

        data:
        messageDoc.data()

      })
    );


    window.localStorage.setItem(

      getChatCacheKey(),

      JSON.stringify({

        savedAt:
        Date.now(),

        messages:
        cachedMessages

      })

    );

  }catch(error){

    console.warn(
      "Chat cache could not be saved:",
      error
    );

  }

}


function loadMessagesCache(){

  try{

    const rawCache =
    window.localStorage.getItem(
      getChatCacheKey()
    );


    if(!rawCache){

      return null;

    }


    const parsedCache =
    JSON.parse(rawCache);


    const cacheAge =
    Date.now() -
    (parsedCache.savedAt || 0);


    if(cacheAge > CHAT_CACHE_MAX_AGE_MS){

      return null;

    }


    if(

      !Array.isArray(
        parsedCache.messages
      ) ||

      parsedCache.messages.length === 0

    ){

      return null;

    }


    return parsedCache.messages.map(
      item => ({

        id:
        item.id,

        data:
        () => item.data

      })
    );

  }catch(error){

    console.warn(
      "Chat cache could not be read:",
      error
    );


    return null;

  }

}


/* =====================================================
   RENDER ALL MESSAGES
===================================================== */

async function renderMessages(
  isLoadingOlder = false
){

  const userWasNearBottom =
  (
    chatArea.scrollHeight -
    chatArea.scrollTop -
    chatArea.clientHeight
  ) < 150;


  const combinedDocs =
  olderMessagesDocs.concat(
    latestMessagesDocsCache
  );


  chatArea.innerHTML =
  "";


  if(
    combinedDocs.length === 0
  ){

    renderEmptyConversation();

    return;

  }


  if(!noOlderMessages){

    const loadOlderButton =
    document.createElement(
      "button"
    );


    loadOlderButton.type =
    "button";


    loadOlderButton.textContent =
    isLoadingOlderMessages
    ? "Loading..."
    : "⬆ Load older messages";


    loadOlderButton.disabled =
    isLoadingOlderMessages;


    loadOlderButton.style.cssText =
    "display:block;margin:0 auto 14px;padding:9px 18px;border:none;border-radius:20px;background:#e5f1ff;color:#0056a6;font-size:12px;font-weight:900;";


    loadOlderButton.addEventListener(
      "click",
      loadOlderMessages
    );


    chatArea.appendChild(
      loadOlderButton
    );

  }


  let lastDateLabel =
  "";


  let newMessageIndicatorAdded =
  false;


  const itemsNeedingReceiptUpdate =
  [];


  combinedDocs.forEach(
    function(messageSnapshot){

      const messageId =
      messageSnapshot.id;


      const messageData =
      messageSnapshot.data();


      loadedMessagesById.set(
        messageId,
        messageData
      );


      const dateLabel =
      formatMessageDate(
        messageData.timestamp ||
        messageData.createdAt
      );


      if(
        dateLabel !==
        lastDateLabel
      ){

        chatArea.appendChild(
          createMessageDateDivider(
            dateLabel
          )
        );


        lastDateLabel =
        dateLabel;

      }


      if(
        !newMessageIndicatorAdded &&
        messageIsUnread(
          messageData
        )
      ){

        chatArea.appendChild(
          createNewMessageIndicator()
        );


        newMessageIndicatorAdded =
        true;

      }


      const messageElement =
      createMessageElement(
        messageId,
        messageData
      );


      if(messageElement){

        chatArea.appendChild(
          messageElement
        );

      }


      if(
        currentUser &&
        messageData.senderId !==
        currentUser.uid &&
        (
          messageData.delivered !==
          true ||
          (
            document.visibilityState ===
            "visible" &&
            messageData.read !==
            true
          )
        )
      ){

        itemsNeedingReceiptUpdate.push(
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


  if(
    itemsNeedingReceiptUpdate.length > 0
  ){

    await batchUpdateIncomingReceipts(
      itemsNeedingReceiptUpdate
    );

  }


  if(
    !isLoadingOlder &&
    (
      userWasNearBottom ||
      newMessageIndicatorAdded
    )
  ){

    scrollToLatestMessage();

  }

}


/* =====================================================
   LOAD OLDER MESSAGES ON REQUEST
===================================================== */

async function loadOlderMessages(){

  if(
    isLoadingOlderMessages ||
    noOlderMessages ||
    !oldestLoadedMessageDoc
  ){

    return;

  }


  isLoadingOlderMessages =
  true;


  await renderMessages(
    true
  );


  try{

    const olderQuery =
    query(
      getMessagesCollectionReference(),
      orderBy(
        "timestamp",
        "desc"
      ),
      startAfter(
        oldestLoadedMessageDoc
      ),
      limit(
        MESSAGES_PAGE_SIZE
      )
    );


    const snapshot =
    await getDocs(
      olderQuery
    );


    if(
      snapshot.docs.length > 0
    ){

      oldestLoadedMessageDoc =
      snapshot.docs[
        snapshot.docs.length - 1
      ];

    }


    noOlderMessages =
    snapshot.docs.length <
    MESSAGES_PAGE_SIZE;


    const orderedOlderDocs =
    snapshot.docs
    .slice()
    .reverse();


    olderMessagesDocs =
    orderedOlderDocs.concat(
      olderMessagesDocs
    );


    const previousScrollHeight =
    chatArea.scrollHeight;


    const previousScrollTop =
    chatArea.scrollTop;


    isLoadingOlderMessages =
    false;


    await renderMessages(
      true
    );


    chatArea.scrollTop =
    (
      chatArea.scrollHeight -
      previousScrollHeight
    ) +
    previousScrollTop;

  }catch(error){

    console.error(
      "Unable to load older messages:",
      error
    );


    isLoadingOlderMessages =
    false;


    await renderMessages(
      true
    );

  }

}


/* =====================================================
   LOAD REAL-TIME MESSAGES
===================================================== */

function loadMessages(){

  if(
    !currentUser ||
    !conversationId
  ){

    return;

  }


  stopMessagesListener();


  loadedMessagesById.clear();


  olderMessagesDocs =
  [];


  latestMessagesDocsCache =
  [];


  oldestLoadedMessageDoc =
  null;


  noOlderMessages =
  false;


  const cachedDocs =
  loadMessagesCache();


  if(cachedDocs){

    latestMessagesDocsCache =
    cachedDocs;


    renderMessages();

  }else{

    chatArea.innerHTML = `

      <div class="loadingMessage">

        Loading conversation...

      </div>

    `;

  }


  const messagesQuery =
  query(
    getMessagesCollectionReference(),
    orderBy(
      "timestamp",
      "desc"
    ),
    limit(
      MESSAGES_PAGE_SIZE
    )
  );


  unsubscribeMessages =
  onSnapshot(

    messagesQuery,

    async function(messagesSnapshot){

      try{

        if(
          messagesSnapshot.docs.length > 0
        ){

          oldestLoadedMessageDoc =
          messagesSnapshot.docs[
            messagesSnapshot.docs.length - 1
          ];

        }


        noOlderMessages =
        messagesSnapshot.docs.length <
        MESSAGES_PAGE_SIZE;


        latestMessagesDocsCache =
        messagesSnapshot.docs
        .slice()
        .reverse();


        saveMessagesCache(
          latestMessagesDocsCache
        );


        await renderMessages();

      }catch(error){

        console.error(
          "Message rendering error:",
          error
        );


        renderMessageLoadError();

      }

    },


    function(error){

      console.error(
        "Unable to load messages:",
        error
      );


      renderMessageLoadError();

    }

  );

}


/* =====================================================
   SCROLL AFTER MEDIA LOADS
===================================================== */

chatArea.addEventListener(
  "load",
  function(event){

    if(
      event.target.tagName ===
      "IMG" ||
      event.target.tagName ===
      "VIDEO" ||
      event.target.tagName ===
      "AUDIO"
    ){

      scrollToLatestMessage();

    }

  },
  true
);


/* =====================================================
   SCROLL WHEN DEVICE ORIENTATION CHANGES
===================================================== */

window.addEventListener(
  "orientationchange",
  function(){

    window.setTimeout(
      scrollToLatestMessage,
      250
    );

  }
);


/* =====================================================
   SCROLL WHEN WINDOW SIZE CHANGES
===================================================== */

window.addEventListener(
  "resize",
  function(){

    if(
      document.activeElement !==
      messageInput
    ){

      return;

    }


    window.setTimeout(
      scrollToLatestMessage,
      150
    );

  }
);

/* =====================================================
   PART 9E OF 10
   DELETE, CLEAR CHAT, TYPING INDICATOR
   AND PAGE CLEANUP
===================================================== */


/* =====================================================
   DELETE MESSAGE FOR ME
===================================================== */

async function deleteMessageForMe(
  messageId
){

  if(
    !currentUser ||
    !conversationId
  ){
    return;
  }

  const confirmed =
  window.confirm(
    "Delete this message for you?"
  );

  if(!confirmed){
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
        deletedFor:
        arrayUnion(
          currentUser.uid
        )
      }
    );

  }catch(error){

    console.error(error);

    alert(
      "Unable to delete the message."
    );

  }

}


/* =====================================================
   DELETE MESSAGE FOR EVERYONE
===================================================== */

async function deleteMessageForEveryone(
  messageId
){

  if(
    !currentUser ||
    !conversationId
  ){
    return;
  }

  const confirmed =
  window.confirm(
    "Delete this message for everyone?"
  );

  if(!confirmed){
    return;
  }

  try{

    const messageReference =
    doc(
      db,
      "conversations",
      conversationId,
      "messages",
      messageId
    );

    const snapshot =
    await getDoc(
      messageReference
    );

    if(
      !snapshot.exists()
    ){
      return;
    }

    const data =
    snapshot.data();

    if(
      data.senderId !==
      currentUser.uid
    ){

      alert(
        "You can only delete your own messages."
      );

      return;

    }

    await updateDoc(
      messageReference,
      {
        deletedForEveryone:true,
        deletedAt:serverTimestamp()
      }
    );

  }catch(error){

    console.error(error);

    alert(
      "Unable to delete message."
    );

  }

}


/* =====================================================
   CLEAR CHAT FOR ME
===================================================== */

clearChatButton.addEventListener(
  "click",
  async function(){

    headerOptionsMenu.classList.remove(
      "show"
    );

    if(
      !conversationId
    ){
      return;
    }

    const confirmed =
    window.confirm(
      "Delete every message in this conversation for you?"
    );

    if(!confirmed){
      return;
    }

    try{

      showBusyOverlay(
        "Clearing conversation..."
      );

      const snapshot =
      await getDocs(
        query(
          getMessagesCollectionReference()
        )
      );

      const promises = [];

      snapshot.forEach(
        function(message){

          promises.push(

            updateDoc(
              message.ref,
              {
                deletedFor:
                arrayUnion(
                  currentUser.uid
                )
              }
            )

          );

        }
      );

      await Promise.allSettled(
        promises
      );

      hideBusyOverlay();

    }catch(error){

      hideBusyOverlay();

      console.error(error);

      alert(
        "Unable to clear this conversation."
      );

    }

  }
);

/* =====================================================
   TYPING LISTENER STATE
===================================================== */

let unsubscribeTyping =
null;


/* =====================================================
   TYPING DOCUMENT REFERENCE
===================================================== */

function getTypingDocumentReference(){

  return doc(
    db,
    "conversations",
    conversationId,
    "typing",
    "status"
  );

}


/* =====================================================
   SEND TYPING STATUS
===================================================== */

async function updateTypingStatus(
  typing
){

  if(
    !conversationId ||
    !currentUser
  ){

    return;

  }


  try{

    await setDoc(
      getTypingDocumentReference(),
      {
        [currentUser.uid]:
        typing,

        updatedAt:
        serverTimestamp()
      },
      {
        merge:true
      }
    );

  }catch(error){

    console.error(
      "Typing status update error:",
      error
    );

  }

}


/* =====================================================
   USER STARTED TYPING
===================================================== */

messageInput.addEventListener(
  "input",
  function(){

    if(
      !currentUserTyping
    ){

      currentUserTyping =
      true;


      updateTypingStatus(
        true
      );

    }


    window.clearTimeout(
      typingStopTimer
    );


    typingStopTimer =
    window.setTimeout(
      function(){

        currentUserTyping =
        false;


        updateTypingStatus(
          false
        );

      },
      1500
    );

  }
);


/* =====================================================
   STOP TYPING LISTENER
===================================================== */

function stopTypingListener(){

  if(
    typeof unsubscribeTyping ===
    "function"
  ){

    unsubscribeTyping();

  }


  unsubscribeTyping =
  null;

}


/* =====================================================
   LISTEN FOR OTHER USER TYPING
===================================================== */

function startTypingListener(){

  stopTypingListener();


  if(
    !conversationId ||
    !otherUid
  ){

    return;

  }


  unsubscribeTyping =
  onSnapshot(

    getTypingDocumentReference(),

    function(snapshot){

      if(
        !snapshot.exists()
      ){

        typingIndicator.classList.remove(
          "show"
        );


        return;

      }


      const typingData =
      snapshot.data();


      const otherMemberIsTyping =
      typingData?.[otherUid] ===
      true;


      typingIndicator.classList.toggle(
        "show",
        otherMemberIsTyping
      );

    },

    function(error){

      console.error(
        "Typing listener error:",
        error
      );


      typingIndicator.classList.remove(
        "show"
      );

    }

  );

}


/* =====================================================
   CLEAN UP
===================================================== */

function cleanUpChatPage(){
stopIncomingCallListener();
  stopMessagesListener();

  loadedMessagesById.clear();

  olderMessagesDocs =
  [];

  latestMessagesDocsCache =
  [];

  stopOtherMemberListener();

stopTypingListener();

window.clearTimeout(
  typingStopTimer
);

typingStopTimer =
null;

if(
  currentUserTyping
){

  currentUserTyping =
  false;

  updateTypingStatus(
    false
  );

}

releasePreviewUrl();

  resetMediaViewer();

  stopRecordingTimer();

  releaseRecordingStream();

  if(isRecording){

    cancelVoiceRecording();

  }

}


/* =====================================================
   PAGE HIDE
===================================================== */

window.addEventListener(
  "pagehide",
  cleanUpChatPage
);


/* =====================================================
   BEFORE UNLOAD
===================================================== */

window.addEventListener(
  "beforeunload",
  async function(){

    cleanUpChatPage();

    await setCurrentUserOffline();

  }
);

/* =====================================================
   PART 10 OF 10
   SEND MESSAGES, UPDATE CONVERSATION,
   CREATE NOTIFICATIONS AND FINAL CLOSING
===================================================== */


/* =====================================================
   GET MESSAGE PREVIEW
===================================================== */

function getMessagePreview(
  messageText,
  mediaType
){

  const cleanedMessage =
  String(
    messageText || ""
  ).trim();


  if(cleanedMessage){

    return cleanedMessage.length > 80
    ? `${cleanedMessage.slice(
        0,
        80
      )}...`
    : cleanedMessage;

  }


  if(mediaType === "image"){

    return "📷 Picture";

  }


  if(mediaType === "video"){

    return "🎥 Video";

  }


  if(
    mediaType === "audio" ||
    mediaType === "voice"
  ){

    return "🎤 Voice message";

  }

  if(mediaType === "file"){

  return selectedFileName
  ? `📄 ${selectedFileName}`
  : "📄 Document";

}
  return "New message";

}


/* =====================================================
   SET SENDING STATE
===================================================== */

function setSendingState(
  isSending
){

  sendingMessage =
  isSending;


  sendButton.disabled =
  isSending;


  messageInput.disabled =
  isSending;


  emojiButton.disabled =
  isSending;


  attachmentButton.disabled =
  isSending;


  voiceButton.disabled =
  isSending;


  removePreviewButton.disabled =
  isSending;


  voiceCallButton.disabled =
  isSending;
videoCallButton.disabled =
isSending;

  sendButton.textContent =
  isSending
  ? "Sending..."
  : "Send";


  if(isSending){

    closeInputMenus();

  }

}


/* =====================================================
   CREATE MESSAGE DOCUMENT
===================================================== */

async function createMessageDocument(
  {
    messageText,
    mediaType,
    mediaUrl,
    mediaPublicId,
    mediaFormat,
    mediaDuration,
    fileName,
    fileSize,
    fileExtension,
    momentReply
  }
)
{

  const senderName =
  getProfileName(
    currentProfile,
    getFirstValue(
      currentUser?.displayName,
      currentUser?.email,
      "Member"
    )
  );


  const senderPicture =
  getProfilePicture(
    currentProfile
  );


  const messageReference =
  await addDoc(
    getMessagesCollectionReference(),
    {

      senderId:
      currentUser.uid,

      receiverId:
      otherUid,

      senderName:
      senderName,

      senderPicture:
      senderPicture,

      message:
      messageText || "",

      text:
      messageText || "",

      mediaType:
      mediaType || "none",

      mediaUrl:
      mediaUrl || "",

      mediaPublicId:
      mediaPublicId || "",

      mediaFormat:
      mediaFormat || "",

      mediaDuration:
      Number(
        mediaDuration
      ) || 0,
       fileName:
fileName || "",

fileSize:
Number(
  fileSize
) || 0,

fileExtension:
fileExtension || "",

fileUrl:
mediaType === "file"
? mediaUrl || ""
: "",

      replyMomentId:
      momentReply?.momentId ||
      "",

      replyMomentType:
      momentReply?.momentType ||
      "",

      replyMomentUserName:
      momentReply?.momentUserName ||
      "",

      replyMomentImageUrl:
      momentReply?.momentImageUrl ||
      "",

      replyMomentVideoUrl:
      momentReply?.momentVideoUrl ||
      "",

      replyMomentSnippet:
      momentReply?.momentSnippet ||
      "",

      timestamp:
      serverTimestamp(),

      createdAt:
      serverTimestamp(),

      delivered:
      false,

      read:
      false,

      deletedFor:
      [],

      deletedForEveryone:
      false

    }
  );


  return messageReference;

}


/* =====================================================
   UPDATE CONVERSATION SUMMARY
===================================================== */

async function updateConversationSummary(
  {
    messageText,
    mediaType,
    mediaUrl,
    messageId
  }
){

  if(
    !currentUser ||
    !otherUid ||
    !conversationId
  ){

    return;

  }


  const currentUserName =
  getProfileName(
    currentProfile,
    getFirstValue(
      currentUser.displayName,
      currentUser.email,
      "Member"
    )
  );


  const otherUserName =
  getProfileName(
    otherProfile,
    "Member"
  );


  const currentUserPicture =
  getProfilePicture(
    currentProfile
  );


  const otherUserPicture =
  getProfilePicture(
    otherProfile
  );


  const previewText =
  getMessagePreview(
    messageText,
    mediaType
  );


  try{

    await setDoc(
      doc(
        db,
        "conversations",
        conversationId
      ),
      {

        conversationId:
        conversationId,

        participants:
        [
          currentUser.uid,
          otherUid
        ],

        participantNames:
        {
          [currentUser.uid]:
          currentUserName,

          [otherUid]:
          otherUserName
        },

        participantPictures:
        {
          [currentUser.uid]:
          currentUserPicture,

          [otherUid]:
          otherUserPicture
        },

        lastMessage:
        previewText,

        lastMessageText:
        messageText || "",

        lastMessageType:
        mediaType || "none",

        lastMediaUrl:
        mediaUrl || "",

        lastMessageId:
        messageId || "",

        lastSenderId:
        currentUser.uid,

        updatedAt:
        serverTimestamp()

      },
      {
        merge:true
      }
    );

  }catch(error){

    console.error(
      "Conversation summary update error:",
      error
    );

  }

}


/* =====================================================
   CREATE PRIVATE MESSAGE NOTIFICATION
===================================================== */

async function createMessageNotification(
  {
    messageText,
    mediaType,
    messageId
  }
){

  if(
    !currentUser ||
    !otherUid
  ){

    return;

  }


  const senderName =
  getProfileName(
    currentProfile,
    getFirstValue(
      currentUser.displayName,
      currentUser.email,
      "Member"
    )
  );


  const senderPicture =
  getProfilePicture(
    currentProfile
  );


  const notificationMessage =
  getMessagePreview(
    messageText,
    mediaType
  );


  try{

    await addDoc(
      collection(
        db,
        "notifications"
      ),
      {

        recipientId:
        otherUid,

        receiverId:
        otherUid,

        userId:
        otherUid,

        senderId:
        currentUser.uid,

        senderName:
        senderName,

        senderPicture:
        senderPicture,

        type:
        "private_message",

        message:
        notificationMessage,

        conversationId:
        conversationId,

        messageId:
        messageId || "",

        targetUrl:
        `chat.html?uid=${encodeURIComponent(
          currentUser.uid
        )}`,

        read:
        false,

        timestamp:
        serverTimestamp(),

        createdAt:
        serverTimestamp()

      }
    );

  }catch(error){

    console.error(
      "Private-message notification error:",
      error
    );

  }

}


/* =====================================================
   RESET COMPOSER AFTER SENDING
===================================================== */

function resetMessageComposer(){

  messageInput.value =
  "";


  messageInput.style.height =
  "auto";


  clearSelectedMedia();


  clearMomentReplyBanner();


  currentUserTyping =
  false;


  window.clearTimeout(
    typingStopTimer
  );


  updateTypingStatus(
    false
  );


  messageInput.focus();

}


/* =====================================================
   SEND PRIVATE MESSAGE
===================================================== */

async function sendMessage(){

  if(
    sendingMessage ||
    !chatIsReady ||
    !currentUser ||
    !otherUid ||
    !conversationId
  ){

    return;

  }


  if(isRecording){

    alert(
      "Stop or cancel the voice recording before sending."
    );


    return;

  }


  const messageText =
  messageInput.value.trim();


  const hasMedia =
  Boolean(
    selectedMediaFile &&
    selectedMediaType !==
    "none"
  );


  if(
    !messageText &&
    !hasMedia
  ){

    messageInput.focus();


    return;

  }


  setSendingState(
    true
  );


  const activeMomentReply =
  pendingMomentReply;


  let finalMediaUrl =
  "";


  let finalMediaPublicId =
  "";


  let finalMediaFormat =
  "";


  let finalMediaDuration =
  0;


  try{

    if(hasMedia){

      updateUploadProgress(
  0,
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


      const uploadResult =
      await uploadMediaToImagekit(
        selectedMediaFile
      );


      finalMediaUrl =
      uploadResult.url;


      finalMediaPublicId =
      uploadResult.publicId;


      finalMediaFormat =
      uploadResult.format;


      finalMediaDuration =
      uploadResult.duration;


      uploadedMediaUrl =
      finalMediaUrl;


      uploadedMediaPublicId =
      finalMediaPublicId;

    }


    const finalMediaType =
    hasMedia
    ? selectedMediaType
    : "none";


    const messageReference =
    await createMessageDocument(
      {

        messageText:
        messageText,

        mediaType:
        finalMediaType,

        mediaUrl:
        finalMediaUrl,

        mediaPublicId:
        finalMediaPublicId,

        mediaFormat:
        finalMediaFormat,

        mediaDuration:
finalMediaDuration,

fileName:
finalMediaType === "file"
? selectedFileName
: "",

fileSize:
finalMediaType === "file"
? selectedFileSize
: 0,

fileExtension:
finalMediaType === "file"
? selectedFileExtension
: "",

        momentReply:
        activeMomentReply

      }
    );


    await Promise.allSettled(
      [

        updateConversationSummary(
          {

            messageText:
            messageText,

            mediaType:
            finalMediaType,

            mediaUrl:
            finalMediaUrl,

            messageId:
            messageReference.id

          }
        ),


        createMessageNotification(
          {

            messageText:
            messageText,

            mediaType:
            finalMediaType,

            messageId:
            messageReference.id

          }
        )

      ]
    );


    resetMessageComposer();


    scrollToLatestMessage();

  }catch(error){

    console.error(
      "Private-message sending error:",
      error
    );


    resetUploadProgress();


    if(
      error?.code ===
      "permission-denied"
    ){

      alert(
        "Firebase denied permission to send this message."
      );

    }else{

      alert(
        error?.message ||
        "Unable to send the message. Please try again."
      );

    }

  }finally{

    setSendingState(
      false
    );

  }

}


/* =====================================================
   SEND BUTTON
===================================================== */

sendButton.addEventListener(
  "click",
  function(){

    sendMessage();

  }
);


/* =====================================================
   ENTER KEY TO SEND
===================================================== */

messageInput.addEventListener(
  "keydown",
  function(event){

    if(
      event.key ===
      "Enter" &&
      !event.shiftKey
    ){

      event.preventDefault();


      sendMessage();

    }

  }
);


/* =====================================================
   CLOSE VIEWER WITH BROWSER BACK
===================================================== */

window.addEventListener(
  "popstate",
  function(){

    if(
      mediaViewer.classList.contains(
        "show"
      )
    ){

      resetMediaViewer();

    }

  }
);


/* =====================================================
   RESTORE PAGE WHEN RETURNING
===================================================== */

window.addEventListener(
  "pageshow",
  async function(event){

    if(!event.persisted){

      return;

    }


    sendingMessage =
    false;


    hideBusyOverlay();


    resetUploadProgress();


    if(
      currentUser &&
      conversationId
    ){

      await setCurrentUserOnline();


      watchOtherMemberStatus();


      startTypingListener();


      loadMessages();


      enableChatControls();

    }

  }
);


/* =====================================================
   INITIAL INTERFACE
===================================================== */

messageInput.style.height =
"auto";


resetUploadProgress();


hideBusyOverlay();


/* =====================================================
   PAGE READY
===================================================== */

console.log(
  "Faith Connect private chat with voice calling is ready."
);
/*END-OF-PART-4*/
