/* =====================================================
   FAITH CONNECT - COMMUNITY WALL (feed2.js  -  PART 2 of 2)

   Part 2 holds:
   - the full-screen photo viewer and video reel viewer
   - the Faith Moments strip and the full-screen
     Moments viewer (like Facebook Stories)

   It is a separate file on purpose. feed.js (Part 1) keeps
   working even if this file is missing.
===================================================== */


import{
  auth,
  db,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDocs,
  deleteDoc,
  limit,
  onAuthStateChanged
}from "./firebase.js";


/* =====================================================
   SMALL SHARED HELPERS
===================================================== */

function getFirstValue(
  ...values
){

  for(
    const value
    of values
  ){

    if(
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ){

      return String(
        value
      ).trim();

    }

  }

  return "";

}


const defaultProfilePicture =
"data:image/svg+xml;charset=utf-8," +
encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">' +
  '<defs><clipPath id="c"><circle cx="100" cy="100" r="100"/></clipPath></defs>' +
  '<circle cx="100" cy="100" r="100" fill="#e7f3ff"/>' +
  '<g clip-path="url(#c)" fill="#1877f2">' +
  '<circle cx="100" cy="76" r="38"/>' +
  '<path d="M24 200c0-44 33-76 76-76s76 32 76 76z"/></g></svg>'
);


/* =====================================================
   PAGE ELEMENTS FOR THE VIEWERS AND THE STRIP
===================================================== */

const photoViewer =
document.getElementById("photoViewer");

const photoViewerImage =
document.getElementById("photoViewerImage");

const photoViewerVideo =
document.getElementById("photoViewerVideo");

const closePhotoViewerButton =
document.getElementById("closePhotoViewer");

const photoViewerPrevButton =
document.getElementById("photoViewerPrevButton");

const photoViewerNextButton =
document.getElementById("photoViewerNextButton");

const photoViewerCounter =
document.getElementById("photoViewerCounter");

let currentGalleryImages =
[];

let currentGalleryIndex =
0;

const videoReelViewer =
document.getElementById("videoReelViewer");

const videoReelTrack =
document.getElementById("videoReelTrack");

const closeVideoReelViewerButton =
document.getElementById("closeVideoReelViewer");

const momentsRow =
document.getElementById("momentsRow");

let currentUser =
null;

let unsubscribeMomentsStrip =
null;

/* =====================================================
   SIGNED-IN MEMBER (the strip needs to know who you are)
===================================================== */

onAuthStateChanged(
  auth,
  function(user){

    currentUser =
    user || null;

    startMomentsStripListener();

  },
  function(){

    currentUser =
    null;

    startMomentsStripListener();

  }
);


/* =====================================================
   OPEN A VIEWER WHEN PART 1 ASKS
===================================================== */

document.addEventListener(
  "faithconnect:open-photos",
  function(event){

    const detail =
    event.detail || {};

    openPhotoViewer(
      detail.images,
      detail.startIndex || 0
    );

  }
);

document.addEventListener(
  "faithconnect:open-video",
  function(event){

    const detail =
    event.detail || {};

    openVideoReelViewer(
      detail.url
    );

  }
);


/* =====================================================
   PHOTO VIEWER
===================================================== */

function updatePhotoViewerNavigation(){

  const hasMultiplePhotos =
  currentGalleryImages.length > 1;

  photoViewerPrevButton.classList.toggle(
    "hidden",
    !hasMultiplePhotos
  );

  photoViewerNextButton.classList.toggle(
    "hidden",
    !hasMultiplePhotos
  );

  photoViewerCounter.classList.toggle(
    "hidden",
    !hasMultiplePhotos
  );

  if(hasMultiplePhotos){

    photoViewerCounter.textContent =
    `${currentGalleryIndex + 1} of ${currentGalleryImages.length}`;

  }

}


function showGalleryImageAt(
  index
){

  if(
    currentGalleryImages.length === 0
  ){
    return;
  }

  currentGalleryIndex =
  (
    (
      index %
      currentGalleryImages.length
    ) +
    currentGalleryImages.length
  ) %
  currentGalleryImages.length;

  photoViewerImage.src =
  currentGalleryImages[
    currentGalleryIndex
  ];

  updatePhotoViewerNavigation();

}


function openPhotoViewer(
  images,
  startIndex = 0
){

  const galleryImages =
  Array.isArray(images)
  ? images.filter(
      function(url){

        return (
          typeof url === "string" &&
          url.trim() !== ""
        );

      }
    )
  : (
      images
      ? [images]
      : []
    );

  if(
    galleryImages.length === 0
  ){
    return;
  }

  currentGalleryImages =
  galleryImages;

  photoViewerVideo.pause();

  photoViewerVideo.removeAttribute(
    "src"
  );

  photoViewerVideo.load();

  photoViewerVideo.style.display =
  "none";

  photoViewerImage.style.display =
  "block";

  showGalleryImageAt(
    startIndex
  );

  photoViewer.classList.add(
    "open"
  );

  photoViewer.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.style.overflow =
  "hidden";

  closePhotoViewerButton.focus();

}


photoViewerPrevButton.addEventListener(
  "click",
  function(event){

    event.stopPropagation();

    showGalleryImageAt(
      currentGalleryIndex - 1
    );

  }
);


photoViewerNextButton.addEventListener(
  "click",
  function(event){

    event.stopPropagation();

    showGalleryImageAt(
      currentGalleryIndex + 1
    );

  }
);


/* -----------------------------------------------------
   SWIPE LEFT / RIGHT TO MOVE BETWEEN PHOTOS
   (so every photo of a post can be reached on a phone)
----------------------------------------------------- */

let photoSwipeStartX = null;
let photoSwipeStartY = null;

photoViewer.addEventListener(
  "touchstart",
  function(event){

    if(
      event.touches.length !== 1 ||
      currentGalleryImages.length < 2 ||
      event.target === photoViewerVideo
    ){

      photoSwipeStartX = null;

      return;

    }

    photoSwipeStartX =
    event.touches[0].clientX;

    photoSwipeStartY =
    event.touches[0].clientY;

  },
  { passive:true }
);

photoViewer.addEventListener(
  "touchend",
  function(event){

    if(photoSwipeStartX === null){
      return;
    }

    const touch =
    event.changedTouches[0];

    const distanceX =
    touch.clientX - photoSwipeStartX;

    const distanceY =
    touch.clientY - photoSwipeStartY;

    photoSwipeStartX = null;

    if(
      Math.abs(distanceX) > 45 &&
      Math.abs(distanceX) >
      Math.abs(distanceY) * 1.4
    ){

      showGalleryImageAt(
        distanceX < 0
        ? currentGalleryIndex + 1
        : currentGalleryIndex - 1
      );

    }

  },
  { passive:true }
);

/* Larger, always-visible arrows and counter for phones */

const photoViewerExtraStyle =
document.createElement("style");

photoViewerExtraStyle.textContent = `
  #photoViewer .photoViewerNavButton{
    width:52px !important;
    height:52px !important;
    font-size:34px !important;
    line-height:1 !important;
    z-index:5 !important;
    background:rgba(0,0,0,.55) !important;
    color:#fff !important;
    border-radius:50% !important;
  }
  #photoViewer .photoViewerNavButton.hidden,
  #photoViewer .photoViewerCounter.hidden{
    display:none !important;
  }
  #photoViewer .photoViewerCounter{
    z-index:5 !important;
    background:rgba(0,0,0,.55) !important;
    color:#fff !important;
    padding:5px 12px !important;
    border-radius:14px !important;
    font-size:13px !important;
  }
`;

document.head.appendChild(
  photoViewerExtraStyle
);


function openVideoViewer(
  videoUrl
){

  if(!videoUrl){
    return;
  }

  photoViewerImage.removeAttribute(
    "src"
  );

  photoViewerImage.style.display =
  "none";

  photoViewerVideo.src =
  videoUrl;

  photoViewerVideo.style.display =
  "block";

  photoViewerVideo.muted =
  false;

  photoViewer.classList.add(
    "open"
  );

  photoViewer.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.style.overflow =
  "hidden";

  photoViewerVideo.play()
  .catch(
    function(){
    }
  );

  closePhotoViewerButton.focus();

}


function hidePhotoViewer(){

  photoViewer.classList.remove(
    "open"
  );

  photoViewer.setAttribute(
    "aria-hidden",
    "true"
  );

  photoViewerImage.src =
  "";

  currentGalleryImages =
  [];

  currentGalleryIndex =
  0;

  photoViewerVideo.pause();

  photoViewerVideo.removeAttribute(
    "src"
  );

  photoViewerVideo.load();

  document.body.style.overflow =
  "";

}


/* =====================================================
   REELS-STYLE VIDEO VIEWER
===================================================== */

let reelScrollObserver =
null;


function collectFeedVideoUrls(){

  const videoElements =
  document.querySelectorAll(
    ".communityPostVideoWrapper video"
  );

  const videoUrls =
  [];

  videoElements.forEach(
    function(videoElement){

      if(
        videoElement.src &&
        !videoUrls.includes(
          videoElement.src
        )
      ){

        videoUrls.push(
          videoElement.src
        );

      }

    }
  );

  return videoUrls;

}


function openVideoReelViewer(
  startingVideoUrl
){

  const videoUrls =
  collectFeedVideoUrls();

  if(
    videoUrls.length === 0
  ){
    return;
  }

  videoReelTrack.innerHTML =
  "";

  videoUrls.forEach(
    function(videoUrl){

      const slide =
      document.createElement("div");

      slide.className =
      "videoReelSlide";

      const videoElement =
      document.createElement("video");

      videoElement.src =
      videoUrl;

      videoElement.controls =
      true;

      videoElement.loop =
      true;

      videoElement.playsInline =
      true;

      videoElement.preload =
      "metadata";

      videoElement.muted =
      false;

      slide.appendChild(
        videoElement
      );

      videoReelTrack.appendChild(
        slide
      );

    }
  );

  videoReelViewer.classList.add(
    "open"
  );

  videoReelViewer.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.style.overflow =
  "hidden";

  const startingIndex =
  Math.max(
    0,
    videoUrls.indexOf(
      startingVideoUrl
    )
  );

  const allSlides =
  videoReelTrack.querySelectorAll(
    ".videoReelSlide"
  );

  if(
    allSlides[startingIndex]
  ){

    allSlides[startingIndex].scrollIntoView(
      {
        behavior:
        "auto"
      }
    );

  }

  startReelAutoplayObserver();

}


function startReelAutoplayObserver(){

  if(reelScrollObserver){

    reelScrollObserver.disconnect();

  }

  const allReelVideos =
  videoReelTrack.querySelectorAll(
    "video"
  );

  reelScrollObserver =
  new IntersectionObserver(

    function(entries){

      entries.forEach(
        function(entry){

          const video =
          entry.target;

          if(
            entry.isIntersecting &&
            entry.intersectionRatio >= 0.6
          ){

            allReelVideos.forEach(
              function(otherVideo){

                if(
                  otherVideo !== video
                ){

                  otherVideo.pause();

                }

              }
            );

            const playPromise =
            video.play();

            if(
              playPromise !== undefined
            ){

              playPromise.catch(
                function(){
                }
              );

            }

          }else{

            video.pause();

          }

        }
      );

    },

    {
      threshold:[
        0,
        0.6,
        1
      ]
    }

  );

  allReelVideos.forEach(
    function(videoElement){

      reelScrollObserver.observe(
        videoElement
      );

    }
  );

}


function closeVideoReelViewer(){

  if(reelScrollObserver){

    reelScrollObserver.disconnect();

    reelScrollObserver =
    null;

  }

  videoReelTrack
  .querySelectorAll(
    "video"
  )
  .forEach(
    function(videoElement){

      videoElement.pause();

    }
  );

  videoReelViewer.classList.remove(
    "open"
  );

  videoReelViewer.setAttribute(
    "aria-hidden",
    "true"
  );

  videoReelTrack.innerHTML =
  "";

  document.body.style.overflow =
  "";

}


closeVideoReelViewerButton.addEventListener(
  "click",
  closeVideoReelViewer
);



/* =====================================================
   VIEWER BUTTONS AND KEYBOARD
===================================================== */

closePhotoViewerButton.addEventListener(
  "click",
  hidePhotoViewer
);


photoViewer.addEventListener(
  "click",
  function(event){

    if(
      event.target === photoViewer
    ){

      hidePhotoViewer();

    }

  }
);



document.addEventListener(
  "keydown",
  function(event){

    if(
      photoViewer.classList.contains(
        "open"
      )
    ){

      if(
        event.key === "ArrowLeft"
      ){

        showGalleryImageAt(
          currentGalleryIndex - 1
        );

        return;

      }

      if(
        event.key === "ArrowRight"
      ){

        showGalleryImageAt(
          currentGalleryIndex + 1
        );

        return;

      }

    }

    if(
      event.key !== "Escape"
    ){
      return;
    }

    if(
      photoViewer.classList.contains(
        "open"
      )
    ){

      hidePhotoViewer();

    }

    if(
      videoReelViewer.classList.contains(
        "open"
      )
    ){

      closeVideoReelViewer();

    }

  }
);


/* =====================================================
   FAITH MOMENTS STRIP  (Facebook-status style)
===================================================== */

const MOMENT_LIFETIME_MS =
24 * 60 * 60 * 1000;

const MOMENTS_SEEN_KEY =
"faithconnect_seen_moments_v1";

const MOMENT_TEXT_GRADIENTS =
[
  "linear-gradient(160deg,#087bd1,#0c5aa0)",
  "linear-gradient(160deg,#7b2ff7,#4a1a9c)",
  "linear-gradient(160deg,#e8590c,#a12d00)",
  "linear-gradient(160deg,#0f9d58,#056b3a)",
  "linear-gradient(160deg,#c2185b,#7b0f3a)"
];

let stripVisibilityObservers =
[];

let ownActiveMomentIds =
[];

let isCreatingMoment =
false;

/*
   The Moments currently shown in the strip, in order.
   The full-screen story viewer steps through this list.
*/

let stripMomentsList =
[];


/* =====================================================
   SMALL HELPERS
===================================================== */

function getMomentCreatedDate(
  momentData
){

  const rawTimestamp =
  momentData.timestamp ||
  momentData.createdAt;

  if(!rawTimestamp){
    return null;
  }

  let createdDate;

  if(
    typeof rawTimestamp.toDate ===
    "function"
  ){

    createdDate =
    rawTimestamp.toDate();

  }else if(
    rawTimestamp.seconds
  ){

    createdDate =
    new Date(
      rawTimestamp.seconds * 1000
    );

  }else{

    createdDate =
    new Date(
      rawTimestamp
    );

  }

  if(
    Number.isNaN(
      createdDate.getTime()
    )
  ){
    return null;
  }

  return createdDate;

}


function isMomentStillActiveForStrip(
  momentData
){

  const createdDate =
  getMomentCreatedDate(
    momentData
  );

  /*
     A moment that has just been posted may not have its
     server time yet, so it is treated as active.
  */

  if(!createdDate){
    return true;
  }

  return (
    createdDate.getTime() +
    MOMENT_LIFETIME_MS
  ) > Date.now();

}


function loadSeenMoments(){

  try{

    const savedList =
    JSON.parse(
      window.localStorage.getItem(
        MOMENTS_SEEN_KEY
      ) || "[]"
    );

    return new Set(
      Array.isArray(savedList)
      ? savedList
      : []
    );

  }catch(error){

    return new Set();

  }

}


function markMomentSeen(
  momentId
){

  try{

    const seenMoments =
    loadSeenMoments();

    seenMoments.add(
      momentId
    );

    window.localStorage.setItem(
      MOMENTS_SEEN_KEY,
      JSON.stringify(
        Array.from(
          seenMoments
        ).slice(-200)
      )
    );

  }catch(error){

    /* not important */

  }

}


function getStripMomentTypeIcon(
  type
){

  const icons = {
    encouragement:"🕊️",
    scripture:"📖",
    verse:"📖",
    prayer:"🙏",
    testimony:"✨",
    photo:"🖼️",
    video:"🎥"
  };

  return icons[
    String(type || "").toLowerCase()
  ] || "✨";

}


function getStripInitials(
  name
){

  const words =
  String(
    name || "Faith Member"
  )
  .trim()
  .split(/\s+/)
  .filter(Boolean);

  if(words.length === 0){
    return "F";
  }

  return words
  .slice(0,2)
  .map(
    function(word){

      return word.charAt(0).toUpperCase();

    }
  )
  .join("");

}


function isStripVideoUrl(
  url
){

  const cleanUrl =
  String(
    url || ""
  )
  .split("?")[0]
  .split("#")[0]
  .toLowerCase();

  return /\.(mp4|webm|mov|m4v|3gp|mkv|ogv)$/.test(
    cleanUrl
  );

}


function getStripMomentVideoUrl(
  momentData
){

  const explicitVideo =
  getFirstValue(
    momentData.videoUrl,
    momentData.videoURL,
    momentData.video
  );

  if(explicitVideo){
    return explicitVideo;
  }

  if(
    String(momentData.mediaType || "").toLowerCase() === "video" &&
    typeof momentData.mediaUrl === "string" &&
    momentData.mediaUrl.trim() !== ""
  ){
    return momentData.mediaUrl.trim();
  }

  /*
     The video link may be saved under any field name, so
     look through every text value for a video link.
  */

  for(
    const value
    of Object.values(momentData)
  ){

    if(
      typeof value === "string" &&
      /^https?:\/\//i.test(value) &&
      (
        isStripVideoUrl(value) ||
        value.indexOf("/video/upload/") !== -1
      )
    ){

      return value;

    }

  }

  return "";

}


function getStripMomentText(
  momentData
){

  const reference =
  getFirstValue(
    momentData.verseReference
  );

  let text =
  getFirstValue(
    momentData.text,
    momentData.message,
    momentData.caption,
    momentData.verse,
    momentData.prayer,
    momentData.testimony,
    momentData.body,
    momentData.description,
    momentData.content
  );

  if(
    !text ||
    /^https?:\/\//i.test(text)
  ){
    return "";
  }

  if(reference){

    text =
    text + " — " + reference;

  }

  return text.length > 140
  ? text.slice(0,140).trim() + "…"
  : text;

}


function getTextGradientFor(
  momentId
){

  let total = 0;

  String(
    momentId || ""
  )
  .split("")
  .forEach(
    function(character){

      total +=
      character.charCodeAt(0);

    }
  );

  return MOMENT_TEXT_GRADIENTS[
    total % MOMENT_TEXT_GRADIENTS.length
  ];

}


function safeCssUrl(
  url
){

  return String(url).replace(
    /["\\\n\r]/g,
    function(character){

      return encodeURIComponent(
        character
      );

    }
  );

}


function makeStripElement(
  tagName,
  className,
  text
){

  const element =
  document.createElement(
    tagName
  );

  if(className){

    element.className =
    className;

  }

  if(text !== undefined){

    element.textContent =
    text;

  }

  return element;

}


/* =====================================================
   BUILD ONE MOMENT CARD
===================================================== */

function buildStripMomentCard(
  momentData,
  seenMoments
){

  const name =
  getFirstValue(
    momentData.authorName,
    momentData.name,
    momentData.fullName,
    momentData.displayName,
    "Faith Connect Member"
  );

  const profilePicture =
  getFirstValue(
    momentData.authorPicture,
    momentData.profilePicture,
    momentData.picture,
    momentData.photoURL
  );

  /* the card background is the moment's own content */

  const imageCandidate =
  getFirstValue(
    momentData.thumbnailUrl,
    momentData.thumbnailURL,
    momentData.videoThumbnail,
    momentData.imageUrl,
    momentData.imageURL,
    momentData.photoUrl,
    momentData.photoURL,
    momentData.mediaUrl,
    momentData.contentUrl
  );

  const contentImage =
  (
    imageCandidate &&
    !isStripVideoUrl(imageCandidate) &&
    String(momentData.mediaType || "").toLowerCase() !== "video"
  )
  ? imageCandidate
  : "";

  const videoUrl =
  getStripMomentVideoUrl(
    momentData
  );

  const momentText =
  getStripMomentText(
    momentData
  );

  const typeIcon =
  getStripMomentTypeIcon(
    momentData.type ||
    momentData.momentType
  );

  const card =
  makeStripElement(
    "a",
    "momentCard memberMomentCard"
  );

  card.href =
  `faith-moments.html?moment=${encodeURIComponent(
    momentData.id
  )}`;

  if(
    seenMoments.has(
      momentData.id
    )
  ){

    card.classList.add(
      "seen"
    );

  }

  card.dataset.momentId =
  momentData.id;

  card.addEventListener(
    "click",
    function(event){

      /*
         Open the Moment full screen right here on the feed
         (like Facebook Stories) instead of going to another page.
      */

      event.preventDefault();

      markMomentSeen(
        momentData.id
      );

      card.classList.add(
        "seen"
      );

      openMomentStoryViewer(
        momentData.id
      );

    }
  );

  /* ---------- background ---------- */

  let showIcon =
  false;

  let showText =
  false;

  if(contentImage){

    card.style.backgroundImage =
    `url("${safeCssUrl(contentImage)}")`;

  }else if(videoUrl){

    card.classList.add(
      "momentCardVideoBase"
    );

  }else if(momentText){

    card.classList.add(
      "momentCardTextOnly"
    );

    card.style.background =
    getTextGradientFor(
      momentData.id
    );

    showText =
    true;

  }else{

    card.classList.add(
      "momentCardFallback"
    );

    showIcon =
    true;

  }

  /* ---------- video first frame (plays silently) ---------- */

  if(videoUrl){

    const frameVideo =
    document.createElement("video");

    frameVideo.muted =
    true;

    frameVideo.defaultMuted =
    true;

    frameVideo.loop =
    true;

    frameVideo.autoplay =
    true;

    frameVideo.preload =
    "auto";

    frameVideo.disablePictureInPicture =
    true;

    frameVideo.setAttribute(
      "muted",
      ""
    );

    frameVideo.setAttribute(
      "playsinline",
      ""
    );

    frameVideo.setAttribute(
      "webkit-playsinline",
      ""
    );

    frameVideo.style.cssText =
    "position:absolute;top:0;left:0;width:100%;height:100%;" +
    "object-fit:cover;pointer-events:none;border-radius:inherit;";

    frameVideo.src =
    videoUrl.split("#")[0];

    frameVideo.addEventListener(
      "error",
      function(){

        frameVideo.remove();

        if(
          !card.querySelector(
            ".momentCardFallbackIcon"
          )
        ){

          card.classList.add(
            "momentCardFallback"
          );

          card.insertBefore(
            makeStripElement(
              "div",
              "momentCardFallbackIcon",
              typeIcon
            ),
            card.firstChild
          );

        }

      }
    );

    card.appendChild(
      frameVideo
    );

    const playQuietly =
    function(){

      const playPromise =
      frameVideo.play();

      if(
        playPromise &&
        typeof playPromise.catch ===
        "function"
      ){

        playPromise.catch(
          function(){}
        );

      }

    };

    if("IntersectionObserver" in window){

      const visibilityObserver =
      new IntersectionObserver(

        function(entries){

          entries.forEach(
            function(entry){

              if(entry.isIntersecting){

                playQuietly();

              }else{

                frameVideo.pause();

              }

            }
          );

        },

        {
          threshold:0.4
        }

      );

      visibilityObserver.observe(
        card
      );

      stripVisibilityObservers.push(
        visibilityObserver
      );

    }else{

      frameVideo.addEventListener(
        "loadeddata",
        playQuietly
      );

    }

  }

  /* ---------- overlay, icon, text ---------- */

  card.appendChild(
    makeStripElement(
      "div",
      "momentCardGradient"
    )
  );

  if(showIcon){

    card.appendChild(
      makeStripElement(
        "div",
        "momentCardFallbackIcon",
        typeIcon
      )
    );

  }

  if(showText){

    const textBox =
    makeStripElement(
      "div",
      "momentCardText"
    );

    textBox.appendChild(
      makeStripElement(
        "span",
        "",
        momentText
      )
    );

    card.appendChild(
      textBox
    );

  }

  /* ---------- avatar ---------- */

  const avatar =
  makeStripElement(
    "div",
    "momentCardAvatar"
  );

  const showInitials =
  function(){

    avatar.innerHTML =
    "";

    avatar.appendChild(
      makeStripElement(
        "span",
        "momentCardAvatarInitials",
        getStripInitials(name)
      )
    );

  };

  if(profilePicture){

    const avatarImage =
    document.createElement("img");

    avatarImage.alt =
    name;

    avatarImage.addEventListener(
      "error",
      showInitials,
      {
        once:true
      }
    );

    avatarImage.src =
    profilePicture;

    avatar.appendChild(
      avatarImage
    );

  }else{

    showInitials();

  }

  card.appendChild(
    avatar
  );

  /* ---------- name ---------- */

  card.appendChild(
    makeStripElement(
      "div",
      "momentCardName",
      momentData.isOwn
      ? "Your Moment"
      : name
    )
  );

  return card;

}


/* =====================================================
   DRAW THE STRIP
   One card per person (their newest active moment).
   Your own moment is always shown first.
===================================================== */

function renderMomentsStrip(
  momentsSnapshot
){

  stripVisibilityObservers.forEach(
    function(observer){

      observer.disconnect();

    }
  );

  stripVisibilityObservers =
  [];

  momentsRow
  .querySelectorAll(
    ".memberMomentCard"
  )
  .forEach(
    function(element){

      element.remove();

    }
  );

  const seenMoments =
  loadSeenMoments();

  const momentsByUser =
  new Map();

  ownActiveMomentIds =
  [];

  momentsSnapshot.forEach(
    function(momentDoc){

      const momentData =
      momentDoc.data();

      if(
        !isMomentStillActiveForStrip(
          momentData
        )
      ){
        return;
      }

      const momentUserId =
      getFirstValue(
        momentData.userId,
        momentData.authorId,
        momentData.uid
      );

      if(!momentUserId){
        return;
      }

      const isOwnMoment =
      Boolean(
        currentUser &&
        momentUserId === currentUser.uid
      );

      if(isOwnMoment){

        ownActiveMomentIds.push(
          momentDoc.id
        );

      }

      const privacy =
      String(
        momentData.privacy ||
        "everyone"
      ).toLowerCase();

      if(
        privacy !== "everyone" &&
        !isOwnMoment
      ){
        return;
      }

      /* snapshot is newest first, so the first one wins */

      if(
        momentsByUser.has(momentUserId)
      ){
        return;
      }

      momentsByUser.set(
        momentUserId,
        {
          ...momentData,
          id:momentDoc.id,
          isOwn:isOwnMoment
        }
      );

    }
  );

  const orderedMoments =
  Array.from(
    momentsByUser.values()
  ).sort(
    function(first,second){

      return (
        (second.isOwn ? 1 : 0) -
        (first.isOwn ? 1 : 0)
      );

    }
  );

  stripMomentsList =
  orderedMoments;

  orderedMoments.forEach(
    function(momentData){

      try{

        momentsRow.appendChild(
          buildStripMomentCard(
            momentData,
            seenMoments
          )
        );

      }catch(error){

        console.error(
          "Error building moment card:",
          error
        );

      }

    }
  );

}


/* =====================================================
   LIVE LISTENER FOR THE STRIP
===================================================== */

function stopMomentsStripListener(){

  if(
    typeof unsubscribeMomentsStrip ===
    "function"
  ){

    unsubscribeMomentsStrip();

  }

  unsubscribeMomentsStrip =
  null;

}


function startMomentsStripListener(){

  stopMomentsStripListener();

  const momentsQuery =
  query(
    collection(
      db,
      "faithMoments"
    ),
    orderBy(
      "timestamp",
      "desc"
    ),
    limit(60)
  );

  unsubscribeMomentsStrip =
  onSnapshot(

    momentsQuery,

    function(snapshot){

      renderMomentsStrip(
        snapshot
      );

    },

    function(error){

      console.error(
        "Faith Moments strip error:",
        error
      );

    }

  );

}


/* =====================================================
   ONE MOMENT PER PERSON
   When "Create Moment" is tapped and the person already
   has an active moment, ask before replacing it.
===================================================== */

async function findOwnActiveMomentIds(){

  const foundIds =
  new Set(
    ownActiveMomentIds
  );

  const fieldNames =
  [
    "userId",
    "authorId",
    "uid"
  ];

  for(
    const fieldName
    of fieldNames
  ){

    try{

      const ownMomentsSnapshot =
      await getDocs(
        query(
          collection(
            db,
            "faithMoments"
          ),
          where(
            fieldName,
            "==",
            currentUser.uid
          )
        )
      );

      ownMomentsSnapshot.forEach(
        function(momentDoc){

          if(
            isMomentStillActiveForStrip(
              momentDoc.data()
            )
          ){

            foundIds.add(
              momentDoc.id
            );

          }

        }
      );

    }catch(error){

      console.warn(
        "Could not check moments by " +
        fieldName + ":",
        error
      );

    }

  }

  return Array.from(
    foundIds
  );

}


async function handleCreateMomentClick(
  event
){

  event.preventDefault();

  if(!currentUser){

    window.location.href =
    "login.html";

    return;

  }

  if(isCreatingMoment){
    return;
  }

  isCreatingMoment =
  true;

  try{

    const existingMomentIds =
    await findOwnActiveMomentIds();

    if(
      existingMomentIds.length > 0
    ){

      const wantsToReplace =
      window.confirm(
        "You already have a Moment.\n\n" +
        "Only one Moment is allowed at a time. " +
        "Delete it and create a new one?"
      );

      if(!wantsToReplace){

        isCreatingMoment =
        false;

        return;

      }

      await Promise.all(
        existingMomentIds.map(
          function(momentId){

            return deleteDoc(
              doc(
                db,
                "faithMoments",
                momentId
              )
            );

          }
        )
      );

      ownActiveMomentIds =
      [];

    }

    window.location.href =
    "create-faith-moment.html";

  }catch(error){

    console.error(
      "Create Moment check failed:",
      error
    );

    alert(
      "Your Moment could not be checked. Please try again."
    );

    isCreatingMoment =
    false;

  }

}


const createMomentCardLink =
document.querySelector(
  ".createMomentCard"
);

if(createMomentCardLink){

  createMomentCardLink.addEventListener(
    "click",
    handleCreateMomentClick
  );

}


/* =====================================================
   FAITH MOMENTS STORY VIEWER (Facebook-style)

   Tapping a Moment in the strip opens it full screen
   right here on the feed. No page change.

   Tap the right side  = next Moment
   Tap the left side   = previous Moment
   Press and hold      = pause
   Swipe down / Back   = close
===================================================== */

const STORY_PHOTO_MS =
6000;

const STORY_TEXT_MS =
7000;

let storyViewerElement =
null;

let storyEls =
{};

let storyCurrentId =
"";

let storyRaf =
0;

let storyElapsed =
0;

let storyDuration =
STORY_PHOTO_MS;

let storyLastTick =
0;

let storyPaused =
false;

let storyMuted =
false;

let storyVideoElement =
null;

let storyHistoryPushed =
false;

let storyPointer =
null;


function injectStoryViewerStyles(){

  if(
    document.getElementById(
      "storyViewerStyles"
    )
  ){
    return;
  }

  const styleElement =
  document.createElement("style");

  styleElement.id =
  "storyViewerStyles";

  styleElement.textContent = `

.storyViewer{
  position:fixed;
  inset:0;
  z-index:5000;
  display:none;
  justify-content:center;
  background:#000000;
  -webkit-user-select:none;
  user-select:none;
}

.storyViewer.open{
  display:flex;
}

.storyFrame{
  position:relative;
  width:100%;
  max-width:480px;
  height:100%;
  overflow:hidden;
  background:#111111;
  touch-action:none;
}

.storyContent{
  position:absolute;
  inset:0;
}

.storyMedia{
  position:absolute;
  inset:0;
  width:100%;
  height:100%;
  object-fit:contain;
  background:#000000;
}

.storyTextBackground{
  position:absolute;
  inset:0;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  padding:90px 28px 60px;
  text-align:center;
  color:#ffffff;
  font-size:24px;
  font-weight:bold;
  line-height:1.4;
  white-space:pre-wrap;
  overflow-wrap:anywhere;
}

.storyTextReference{
  margin-top:14px;
  font-size:16px;
  opacity:.92;
}

.storyTextIcon{
  font-size:72px;
}

.storyShadeTop{
  position:absolute;
  top:0;
  left:0;
  right:0;
  height:140px;
  background:linear-gradient(rgba(0,0,0,.55),rgba(0,0,0,0));
  pointer-events:none;
}

.storyBar{
  position:absolute;
  top:10px;
  left:10px;
  right:10px;
  z-index:3;
  height:3px;
  overflow:hidden;
  border-radius:3px;
  background:rgba(255,255,255,.35);
  pointer-events:none;
}

.storyBarFill{
  width:0%;
  height:100%;
  background:#ffffff;
}

.storyHeader{
  position:absolute;
  top:22px;
  left:12px;
  right:12px;
  z-index:3;
  display:flex;
  align-items:center;
  gap:10px;
  color:#ffffff;
}

.storyAvatar{
  width:40px;
  height:40px;
  flex-shrink:0;
  border-radius:50%;
  object-fit:cover;
  background:#e7f3ff;
  border:2px solid #ffffff;
}

.storyAuthor{
  min-width:0;
  flex:1;
  pointer-events:none;
}

.storyAuthorName{
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
  font-size:15px;
  font-weight:bold;
  text-shadow:0 1px 4px rgba(0,0,0,.6);
}

.storyAuthorTime{
  margin-top:2px;
  font-size:12px;
  opacity:.9;
  text-shadow:0 1px 4px rgba(0,0,0,.6);
}

.storyIconButton{
  width:38px;
  height:38px;
  flex-shrink:0;
  border:0;
  border-radius:50%;
  display:flex;
  align-items:center;
  justify-content:center;
  background:rgba(0,0,0,.4);
  color:#ffffff;
  font-size:18px;
  cursor:pointer;
}

.storyCaption{
  position:absolute;
  left:0;
  right:0;
  bottom:0;
  z-index:2;
  display:none;
  max-height:45%;
  overflow:hidden;
  padding:70px 18px 34px;
  background:linear-gradient(rgba(0,0,0,0),rgba(0,0,0,.72));
  color:#ffffff;
  font-size:17px;
  line-height:1.45;
  white-space:pre-wrap;
  overflow-wrap:anywhere;
  pointer-events:none;
}

.storyCaptionReference{
  margin-top:6px;
  font-size:14px;
  font-weight:bold;
  opacity:.95;
}

`;

  document.head.appendChild(
    styleElement
  );

}


function formatStoryTimeAgo(
  momentData
){

  const createdDate =
  getMomentCreatedDate(
    momentData
  );

  if(!createdDate){
    return "Just now";
  }

  const minutes =
  Math.floor(
    (Date.now() - createdDate.getTime()) / 60000
  );

  if(minutes < 1){
    return "Just now";
  }

  if(minutes < 60){
    return minutes + "m ago";
  }

  const hours =
  Math.floor(minutes / 60);

  if(hours < 24){
    return hours + "h ago";
  }

  return Math.floor(hours / 24) + "d ago";

}


function getStoryMedia(
  momentData
){

  const reference =
  getFirstValue(
    momentData.verseReference
  );

  let text =
  getFirstValue(
    momentData.message,
    momentData.text,
    momentData.caption,
    momentData.verse,
    momentData.prayer,
    momentData.testimony,
    momentData.body,
    momentData.description,
    momentData.content
  );

  if(
    /^https?:\/\//i.test(text)
  ){
    text = "";
  }

  const videoUrl =
  getStripMomentVideoUrl(
    momentData
  );

  if(videoUrl){

    return {
      type:"video",
      url:videoUrl,
      text:text,
      reference:reference
    };

  }

  const imageUrl =
  getFirstValue(
    momentData.imageUrl,
    momentData.imageURL,
    momentData.photoUrl,
    momentData.photoURL,
    momentData.mediaUrl,
    momentData.contentUrl
  );

  if(
    imageUrl &&
    !isStripVideoUrl(imageUrl) &&
    String(momentData.mediaType || "").toLowerCase() !== "video"
  ){

    return {
      type:"image",
      url:imageUrl,
      text:text,
      reference:reference
    };

  }

  return {
    type:"text",
    url:"",
    text:text,
    reference:reference
  };

}


function markStripCardSeen(
  momentId
){

  document
  .querySelectorAll(
    ".memberMomentCard"
  )
  .forEach(
    function(cardElement){

      if(
        cardElement.dataset.momentId === momentId
      ){

        cardElement.classList.add(
          "seen"
        );

      }

    }
  );

}


/* ---------- progress bar and timer ---------- */

function setStoryProgress(
  fraction
){

  if(!storyEls.barFill){
    return;
  }

  const safeFraction =
  Math.max(
    0,
    Math.min(
      1,
      fraction || 0
    )
  );

  storyEls.barFill.style.width =
  (safeFraction * 100) + "%";

}


function startStoryTimer(
  durationMs
){

  cancelAnimationFrame(
    storyRaf
  );

  storyDuration =
  durationMs;

  storyElapsed =
  0;

  storyLastTick =
  performance.now();

  const tick =
  function(now){

    if(!storyPaused){

      storyElapsed +=
      now - storyLastTick;

    }

    storyLastTick =
    now;

    setStoryProgress(
      storyElapsed / storyDuration
    );

    if(
      storyElapsed >= storyDuration
    ){

      nextStory();

      return;

    }

    storyRaf =
    requestAnimationFrame(
      tick
    );

  };

  storyRaf =
  requestAnimationFrame(
    tick
  );

}


function stopStoryPlayback(){

  cancelAnimationFrame(
    storyRaf
  );

  const oldVideo =
  storyVideoElement;

  storyVideoElement =
  null;

  if(oldVideo){

    try{

      oldVideo.pause();

      oldVideo.removeAttribute(
        "src"
      );

      oldVideo.load();

    }catch(error){

      /* not important */

    }

  }

}


function pauseStory(){

  storyPaused =
  true;

  if(storyVideoElement){

    storyVideoElement.pause();

  }

}


function resumeStory(){

  storyPaused =
  false;

  storyLastTick =
  performance.now();

  if(storyVideoElement){

    const playPromise =
    storyVideoElement.play();

    if(
      playPromise &&
      typeof playPromise.catch === "function"
    ){

      playPromise.catch(
        function(){}
      );

    }

  }

}


function updateStoryMuteButton(){

  if(storyEls.mute){

    storyEls.mute.textContent =
    storyMuted ? "🔇" : "🔊";

  }

}


/* ---------- showing one Moment ---------- */

function renderTextStory(
  momentData,
  media
){

  storyEls.content.innerHTML =
  "";

  storyEls.caption.style.display =
  "none";

  storyEls.mute.style.display =
  "none";

  const background =
  document.createElement("div");

  background.className =
  "storyTextBackground";

  background.style.background =
  getTextGradientFor(
    momentData.id
  );

  if(
    media.text ||
    media.reference
  ){

    if(media.text){

      const textElement =
      document.createElement("div");

      textElement.textContent =
      media.text;

      background.appendChild(
        textElement
      );

    }

    if(media.reference){

      const referenceElement =
      document.createElement("div");

      referenceElement.className =
      "storyTextReference";

      referenceElement.textContent =
      media.reference;

      background.appendChild(
        referenceElement
      );

    }

  }else{

    const iconElement =
    document.createElement("div");

    iconElement.className =
    "storyTextIcon";

    iconElement.textContent =
    getStripMomentTypeIcon(
      momentData.type ||
      momentData.momentType
    );

    background.appendChild(
      iconElement
    );

  }

  storyEls.content.appendChild(
    background
  );

  startStoryTimer(
    STORY_TEXT_MS
  );

}


function showStoryAt(
  index
){

  if(
    index >= stripMomentsList.length
  ){

    closeStoryViewer();

    return;

  }

  const safeIndex =
  Math.max(
    0,
    index
  );

  const momentData =
  stripMomentsList[
    safeIndex
  ];

  if(!momentData){

    closeStoryViewer();

    return;

  }

  stopStoryPlayback();

  storyCurrentId =
  momentData.id;

  storyPaused =
  false;

  markMomentSeen(
    momentData.id
  );

  markStripCardSeen(
    momentData.id
  );

  const media =
  getStoryMedia(
    momentData
  );

  const authorName =
  momentData.isOwn
  ? "Your Moment"
  : getFirstValue(
      momentData.authorName,
      momentData.name,
      momentData.fullName,
      momentData.displayName,
      "Faith Connect Member"
    );

  const authorPicture =
  getFirstValue(
    momentData.authorPicture,
    momentData.profilePicture,
    momentData.picture,
    momentData.photoURL,
    defaultProfilePicture
  );

  storyEls.name.textContent =
  authorName;

  storyEls.time.textContent =
  formatStoryTimeAgo(
    momentData
  );

  storyEls.avatar.onerror =
  function(){

    storyEls.avatar.onerror =
    null;

    storyEls.avatar.src =
    defaultProfilePicture;

  };

  storyEls.avatar.src =
  authorPicture;

  setStoryProgress(0);

  storyEls.content.innerHTML =
  "";

  storyEls.mute.style.display =
  "none";

  storyEls.caption.innerHTML =
  "";

  storyEls.caption.style.display =
  "none";

  /* ---------- text only ---------- */

  if(media.type === "text"){

    renderTextStory(
      momentData,
      media
    );

    return;

  }

  /* ---------- caption under a photo or video ---------- */

  if(
    media.text ||
    media.reference
  ){

    if(media.text){

      const captionText =
      document.createElement("div");

      captionText.textContent =
      media.text;

      storyEls.caption.appendChild(
        captionText
      );

    }

    if(media.reference){

      const captionReference =
      document.createElement("div");

      captionReference.className =
      "storyCaptionReference";

      captionReference.textContent =
      media.reference;

      storyEls.caption.appendChild(
        captionReference
      );

    }

    storyEls.caption.style.display =
    "block";

  }

  const showTextInstead =
  function(){

    if(
      storyCurrentId !== momentData.id
    ){
      return;
    }

    if(
      media.text ||
      media.reference
    ){

      renderTextStory(
        momentData,
        media
      );

    }else{

      nextStory();

    }

  };

  /* ---------- photo ---------- */

  if(media.type === "image"){

    const imageElement =
    document.createElement("img");

    imageElement.className =
    "storyMedia";

    imageElement.alt =
    "Faith Moment";

    imageElement.addEventListener(
      "load",
      function(){

        if(
          storyCurrentId === momentData.id
        ){

          startStoryTimer(
            STORY_PHOTO_MS
          );

        }

      },
      {
        once:true
      }
    );

    imageElement.addEventListener(
      "error",
      showTextInstead,
      {
        once:true
      }
    );

    imageElement.src =
    media.url;

    storyEls.content.appendChild(
      imageElement
    );

    return;

  }

  /* ---------- video ---------- */

  const videoElement =
  document.createElement("video");

  videoElement.className =
  "storyMedia";

  videoElement.playsInline =
  true;

  videoElement.setAttribute(
    "playsinline",
    ""
  );

  videoElement.muted =
  storyMuted;

  videoElement.preload =
  "auto";

  storyVideoElement =
  videoElement;

  videoElement.addEventListener(
    "timeupdate",
    function(){

      if(
        videoElement.duration
      ){

        setStoryProgress(
          videoElement.currentTime /
          videoElement.duration
        );

      }

    }
  );

  videoElement.addEventListener(
    "ended",
    function(){

      if(
        storyVideoElement === videoElement
      ){

        nextStory();

      }

    }
  );

  videoElement.addEventListener(
    "error",
    function(){

      if(
        storyVideoElement === videoElement
      ){

        showTextInstead();

      }

    }
  );

  videoElement.src =
  media.url;

  storyEls.content.appendChild(
    videoElement
  );

  storyEls.mute.style.display =
  "flex";

  updateStoryMuteButton();

  const startPlayback =
  videoElement.play();

  if(
    startPlayback &&
    typeof startPlayback.catch === "function"
  ){

    startPlayback.catch(
      function(){

        /* the phone may refuse sound: play silently instead */

        videoElement.muted =
        true;

        storyMuted =
        true;

        updateStoryMuteButton();

        videoElement.play().catch(
          function(){}
        );

      }
    );

  }

}


function getStoryIndex(){

  return stripMomentsList.findIndex(
    function(momentData){

      return momentData.id === storyCurrentId;

    }
  );

}


function nextStory(){

  const currentIndex =
  getStoryIndex();

  if(currentIndex < 0){

    closeStoryViewer();

    return;

  }

  showStoryAt(
    currentIndex + 1
  );

}


function previousStory(){

  const currentIndex =
  getStoryIndex();

  if(currentIndex < 0){

    closeStoryViewer();

    return;

  }

  /* on the first Moment, "back" restarts it */

  showStoryAt(
    Math.max(
      0,
      currentIndex - 1
    )
  );

}


/* ---------- building the viewer ---------- */

function buildStoryViewer(){

  if(storyViewerElement){
    return;
  }

  injectStoryViewerStyles();

  const viewer =
  document.createElement("div");

  viewer.className =
  "storyViewer";

  viewer.setAttribute(
    "role",
    "dialog"
  );

  viewer.setAttribute(
    "aria-modal",
    "true"
  );

  viewer.setAttribute(
    "aria-label",
    "Faith Moment"
  );

  viewer.innerHTML = `

<div class="storyFrame">

  <div class="storyContent"></div>

  <div class="storyShadeTop"></div>

  <div class="storyBar">
    <div class="storyBarFill"></div>
  </div>

  <div class="storyHeader">

    <img class="storyAvatar" alt="">

    <div class="storyAuthor">
      <div class="storyAuthorName"></div>
      <div class="storyAuthorTime"></div>
    </div>

    <button type="button" class="storyIconButton storyMuteButton" aria-label="Sound">🔊</button>

    <button type="button" class="storyIconButton storyCloseButton" aria-label="Close">✕</button>

  </div>

  <div class="storyCaption"></div>

</div>

`;

  document.body.appendChild(
    viewer
  );

  storyViewerElement =
  viewer;

  storyEls = {
    frame:
    viewer.querySelector(".storyFrame"),

    content:
    viewer.querySelector(".storyContent"),

    barFill:
    viewer.querySelector(".storyBarFill"),

    avatar:
    viewer.querySelector(".storyAvatar"),

    name:
    viewer.querySelector(".storyAuthorName"),

    time:
    viewer.querySelector(".storyAuthorTime"),

    mute:
    viewer.querySelector(".storyMuteButton"),

    close:
    viewer.querySelector(".storyCloseButton"),

    caption:
    viewer.querySelector(".storyCaption")
  };

  /* keep page-swipe gestures from reacting while a Moment is open */

  [
    "touchstart",
    "touchmove",
    "touchend"
  ].forEach(
    function(eventName){

      viewer.addEventListener(
        eventName,
        function(event){

          event.stopPropagation();

        },
        {
          passive:true
        }
      );

    }
  );

  storyEls.close.addEventListener(
    "click",
    function(){

      closeStoryViewer();

    }
  );

  storyEls.mute.addEventListener(
    "click",
    function(){

      storyMuted =
      !storyMuted;

      if(storyVideoElement){

        storyVideoElement.muted =
        storyMuted;

      }

      updateStoryMuteButton();

    }
  );

  storyEls.frame.addEventListener(
    "pointerdown",
    function(event){

      if(
        event.target.closest("button")
      ){
        return;
      }

      storyPointer = {
        x:event.clientX,
        y:event.clientY,
        t:Date.now()
      };

      pauseStory();

    }
  );

  storyEls.frame.addEventListener(
    "pointerup",
    function(event){

      if(!storyPointer){
        return;
      }

      const start =
      storyPointer;

      storyPointer =
      null;

      const moveX =
      event.clientX - start.x;

      const moveY =
      event.clientY - start.y;

      const heldFor =
      Date.now() - start.t;

      /* swipe down closes */

      if(
        moveY > 100 &&
        Math.abs(moveY) > Math.abs(moveX)
      ){

        closeStoryViewer();

        return;

      }

      resumeStory();

      /* a quick tap moves between Moments */

      if(
        heldFor < 350 &&
        Math.abs(moveX) < 20 &&
        Math.abs(moveY) < 20
      ){

        const frameBox =
        storyEls.frame.getBoundingClientRect();

        if(
          event.clientX - frameBox.left <
          frameBox.width * 0.33
        ){

          previousStory();

        }else{

          nextStory();

        }

      }

    }
  );

  storyEls.frame.addEventListener(
    "pointercancel",
    function(){

      storyPointer =
      null;

      resumeStory();

    }
  );

  document.addEventListener(
    "keydown",
    function(event){

      if(
        !storyViewerElement.classList.contains(
          "open"
        )
      ){
        return;
      }

      if(event.key === "Escape"){

        closeStoryViewer();

      }else if(event.key === "ArrowRight"){

        nextStory();

      }else if(event.key === "ArrowLeft"){

        previousStory();

      }

    }
  );

  document.addEventListener(
    "visibilitychange",
    function(){

      if(
        !storyViewerElement.classList.contains(
          "open"
        )
      ){
        return;
      }

      if(document.hidden){

        pauseStory();

      }else{

        resumeStory();

      }

    }
  );

  /* the phone's Back button closes the viewer */

  window.addEventListener(
    "popstate",
    function(){

      if(
        storyViewerElement.classList.contains(
          "open"
        )
      ){

        storyHistoryPushed =
        false;

        closeStoryViewer();

      }

    }
  );

}


function openMomentStoryViewer(
  momentId
){

  const startIndex =
  stripMomentsList.findIndex(
    function(momentData){

      return momentData.id === momentId;

    }
  );

  if(startIndex < 0){

    /* the list was not ready: fall back to the Moments page */

    window.location.href =
    `faith-moments.html?moment=${encodeURIComponent(momentId)}`;

    return;

  }

  buildStoryViewer();

  storyViewerElement.classList.add(
    "open"
  );

  document.body.style.overflow =
  "hidden";

  try{

    window.history.pushState(
      {
        momentStory:true
      },
      ""
    );

    storyHistoryPushed =
    true;

  }catch(error){

    storyHistoryPushed =
    false;

  }

  showStoryAt(
    startIndex
  );

}


function closeStoryViewer(){

  if(
    !storyViewerElement ||
    !storyViewerElement.classList.contains(
      "open"
    )
  ){
    return;
  }

  stopStoryPlayback();

  storyViewerElement.classList.remove(
    "open"
  );

  storyEls.content.innerHTML =
  "";

  storyCurrentId =
  "";

  document.body.style.overflow =
  "";

  if(storyHistoryPushed){

    storyHistoryPushed =
    false;

    try{

      window.history.back();

    }catch(error){

      /* not important */

    }

  }

}


window.addEventListener(
  "beforeunload",
  stopMomentsStripListener
);


/* =====================================================
   END JAVASCRIPT MODULE
===================================================== */
