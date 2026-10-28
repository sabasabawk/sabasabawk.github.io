/* =====================================================
   FAITH MOMENTS STRIP  (Facebook-status style)

   HOW TO USE:
   In feed.js, find the heading "FAITH MOMENTS STRIP".
   Delete that heading and EVERYTHING below it to the end
   of the file, then paste this whole file in its place.
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

  card.addEventListener(
    "click",
    function(){

      markMomentSeen(
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
   END JAVASCRIPT MODULE
===================================================== */
