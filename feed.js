/* =====================================================
   PART 6 OF 10
   FIREBASE IMPORTS, DOM ELEMENTS,
   GLOBAL VARIABLES AND HELPER FUNCTIONS
===================================================== */


/* =====================================================
   FIREBASE IMPORTS
   (limit + startAfter added for pagination)
===================================================== */

import{
  auth,
  db,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  onAuthStateChanged,
  limit,
  startAfter
}from "./firebase.js";


/* =====================================================
   PAGE ELEMENTS
===================================================== */

const postsContainer =
document.getElementById(
  "postsContainer"
);


const loadMoreSentinel =
document.getElementById(
  "loadMoreSentinel"
);


const refreshButton =
document.getElementById(
  "refreshButton"
);


const quickPostButton =
document.getElementById(
  "quickPostButton"
);


const quickPostAvatar =
document.getElementById(
  "quickPostAvatar"
);


const photoViewer =
document.getElementById(
  "photoViewer"
);


const photoViewerImage =
document.getElementById(
  "photoViewerImage"
);


const photoViewerVideo =
document.getElementById(
  "photoViewerVideo"
);


const closePhotoViewerButton =
document.getElementById(
  "closePhotoViewer"
);


const photoViewerPrevButton =
document.getElementById(
  "photoViewerPrevButton"
);


const photoViewerNextButton =
document.getElementById(
  "photoViewerNextButton"
);


const photoViewerCounter =
document.getElementById(
  "photoViewerCounter"
);


let currentGalleryImages =
[];


let currentGalleryIndex =
0;


const videoReelViewer =
document.getElementById(
  "videoReelViewer"
);


const videoReelTrack =
document.getElementById(
  "videoReelTrack"
);


const closeVideoReelViewerButton =
document.getElementById(
  "closeVideoReelViewer"
);


const reportModal =
document.getElementById(
  "reportModal"
);


const reportReasonList =
document.getElementById(
  "reportReasonList"
);


const reportCancelButton =
document.getElementById(
  "reportCancelButton"
);


const reportSubmitButton =
document.getElementById(
  "reportSubmitButton"
);


const notificationBadge =
document.getElementById(
  "notificationBadge"
);


const topBarActions =
document.querySelector(
  ".topBarActions"
);


const momentsRow =
document.getElementById(
  "momentsRow"
);


const quickMomentAvatar =
document.getElementById(
  "quickMomentAvatar"
);


/* =====================================================
   GLOBAL VARIABLES
===================================================== */

let currentUser =
null;


let currentProfile =
{};


/*
   Set to true only for the app owner's
   account, via an isAdmin:true field on
   their profile document in Firestore. This
   is what quietly unlocks report review and
   removing any post — invisible to every
   other account.
*/

let currentUserIsAdmin =
false;


let unsubscribePosts =
null;


let unsubscribeNotifications =
null;


let unsubscribeMomentsStrip =
null;


const defaultProfilePicture =
"images/profile.png";


/* Stores loaded user profiles temporarily */

const userProfileCache =
new Map();


/* =====================================================
   PAGINATION STATE
   (this is what stops the app loading every
   post at once — only POSTS_PER_PAGE load
   to start, more load as the user scrolls)
===================================================== */

const POSTS_PER_PAGE =
100;


/*
   SIMPLE LOCAL CACHE FOR FASTER REPEAT LOADS

   The first time the feed loads, it has to
   wait for Firestore over the network — this
   is what makes the app feel slow to open.
   From then on, a lightweight copy of the
   most recent posts is saved in the browser's
   local storage. On the next visit, that
   cached copy renders immediately while the
   live Firestore listener quietly fetches
   fresh data in the background and replaces
   it the moment it arrives. This never
   changes what data exists — it only changes
   how fast something appears on screen.
*/

const FEED_CACHE_KEY =
"sabasaba_feed_cache_v1";

const FEED_CACHE_MAX_POSTS =
20;

const FEED_CACHE_MAX_AGE_MS =
30 * 60 * 1000;


function saveFeedCache(postDocuments){

  try{

    const cachedPosts =
    postDocuments

    .slice(0, FEED_CACHE_MAX_POSTS)

    .map(
      postDocument => ({

        id:
        postDocument.id,

        data:
        postDocument.data()

      })
    );


    window.localStorage.setItem(

      FEED_CACHE_KEY,

      JSON.stringify({

        savedAt:
        Date.now(),

        posts:
        cachedPosts

      })

    );

  }catch(error){

    console.warn(
      "Feed cache could not be saved:",
      error
    );

  }

}


function loadFeedCache(){

  try{

    const rawCache =
    window.localStorage.getItem(
      FEED_CACHE_KEY
    );


    if(!rawCache){

      return null;

    }


    const parsedCache =
    JSON.parse(rawCache);


    const cacheAge =
    Date.now() -
    (parsedCache.savedAt || 0);


    if(cacheAge > FEED_CACHE_MAX_AGE_MS){

      return null;

    }


    if(

      !Array.isArray(
        parsedCache.posts
      ) ||

      parsedCache.posts.length === 0

    ){

      return null;

    }


    return parsedCache.posts;

  }catch(error){

    console.warn(
      "Feed cache could not be read:",
      error
    );


    return null;

  }

}


function renderPostsFromCache(cachedPosts){

  postsContainer.innerHTML =
  "";


  cachedPosts.forEach(
    cachedPost => {

      try{

        const postCard =
        createPostCard(
          {

            id:
            cachedPost.id,

            ...cachedPost.data

          }
        );


        postCard.classList.add(
          "postCardCached"
        );


        postsContainer.appendChild(
          postCard
        );

      }catch(error){

        console.error(
          "Error rendering cached post:",
          error
        );

      }

    }
  );


  startVideoAutoPlay();

}


let lastVisibleDocument =
null;


let isLoadingMorePosts =
false;


let noMorePostsAvailable =
false;


let postsLoadObserver =
null;


/*
   FACEBOOK-STYLE FEED MODEL

   A single ordered list of every post currently
   loaded into the page, newest first. Unlike the
   old design, this list is never wholesale replaced
   by the live listener — new posts are only ever
   PREPENDED to the front as they arrive, and older
   posts loaded by scrolling are only ever APPENDED
   to the end. Nothing already on screen ever falls
   out just because someone else posted something
   new — the same behaviour Facebook, Instagram, etc.
   all use for their feeds.
*/

let loadedPostsDocs =
[];


const loadedPostIds =
new Set();


let firstFeedSnapshotHandled =
false;


/*
/*
   Groups rapid bursts of live updates
   (e.g. many people posting at once)
   into a single smooth redraw instead
   of rebuilding the feed dozens of
   times in quick succession.
*/

let renderDebounceTimer =
null;


/* =====================================================
   RETURN FIRST AVAILABLE VALUE
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


/* =====================================================
   SHOW LOADING MESSAGE
===================================================== */

function showLoadingMessage(){

  postsContainer.innerHTML = `

    <div class="statusCard loading">

      Loading community posts...

    </div>

  `;

}


/* =====================================================
   SHOW EMPTY MESSAGE
===================================================== */

function showEmptyMessage(){

  postsContainer.innerHTML = `

    <div class="statusCard empty">

      No community posts are available yet.

      <br><br>

      Be the first person to share
      a testimony, prayer,
      encouragement, photo or video.

    </div>

  `;

}


/* =====================================================
   SHOW ERROR MESSAGE
===================================================== */

function showErrorMessage(
  message
){

  postsContainer.innerHTML =
  "";


  const errorCard =
  document.createElement(
    "div"
  );


  errorCard.className =
  "statusCard error";


  errorCard.textContent =
  message;


  postsContainer.appendChild(
    errorCard
  );

}


/* =====================================================
   PROTECT PROFILE PICTURES
===================================================== */

function protectProfilePicture(
  imageElement
){

  if(!imageElement){

    return;

  }


  imageElement.addEventListener(
    "error",
    function(){

      imageElement.src =
      defaultProfilePicture;

    },
    {
      once:true
    }
  );

}


/* =====================================================
   FORMAT FIREBASE DATE
===================================================== */

function formatPostDate(
  timestamp
){

  if(!timestamp){

    return "Recently";

  }


  try{

    let postDate;


    if(
      typeof timestamp.toDate ===
      "function"
    ){

      postDate =
      timestamp.toDate();

    }else if(
      timestamp.seconds
    ){

      postDate =
      new Date(
        timestamp.seconds *
        1000
      );

    }else{

      postDate =
      new Date(
        timestamp
      );

    }


    if(
      Number.isNaN(
        postDate.getTime()
      )
    ){

      return "Recently";

    }


    return postDate.toLocaleString(
      undefined,
      {
        year:
        "numeric",

        month:
        "short",

        day:
        "numeric",

        hour:
        "numeric",

        minute:
        "2-digit"
      }
    );

  }catch(error){

    console.error(
      "Date formatting error:",
      error
    );


    return "Recently";

  }

}


/* =====================================================
   ADMIN REPORTS LINK

   Creates the 🛡️ Reports icon in the top bar
   only when currentUserIsAdmin is true — for
   every other account this function does
   nothing, so the icon is never added to the
   page at all, not just hidden with CSS.
===================================================== */

function updateAdminReportsLink(){

  if(!topBarActions){

    return;

  }


  const existingLink =
  document.getElementById(
    "adminReportsLink"
  );


  if(!currentUserIsAdmin){

    if(existingLink){

      existingLink.remove();

    }

    return;

  }


  if(existingLink){

    return;

  }


  const adminLink =
  document.createElement("a");

  adminLink.id =
  "adminReportsLink";

  adminLink.href =
  "admin-reports.html";

  adminLink.className =
  "topIconLink";

  adminLink.setAttribute(
    "aria-label",
    "Review reported posts"
  );

  adminLink.title =
  "Reported posts";

  adminLink.textContent =
  "🛡️";


  topBarActions.insertBefore(
    adminLink,
    topBarActions.firstChild
  );

}
/* =====================================================
   PART 7 OF 10
   AUTHENTICATION, CURRENT USER PROFILE
   AND QUICK POST NAVIGATION
===================================================== */


/* =====================================================
   LOAD CURRENT USER PROFILE

   This now runs INDEPENDENTLY of the feed —
   nothing else waits for this to finish. It
   only fills in personal touches (your avatar,
   the admin icon), so there is no reason the
   whole Community Wall should sit on a blank
   "Loading..." screen just because this one
   Firestore read is slow on a weak connection.
===================================================== */

async function loadCurrentUserProfile(){

  currentProfile = {};

  currentUserIsAdmin =
  false;


  if(!currentUser){

    if(quickPostAvatar){

      quickPostAvatar.src =
      defaultProfilePicture;

    }

    updateAdminReportsLink();

    return;

  }


  try{

    const profileReference =
    doc(
      db,
      "users",
      currentUser.uid
    );


    const profileSnapshot =
    await getDoc(
      profileReference
    );


    if(
      profileSnapshot.exists()
    ){

      currentProfile =
      profileSnapshot.data();


      currentUserIsAdmin =
      currentProfile.isAdmin ===
      true;

    }


    const profilePicture =
    getFirstValue(
      currentProfile.picture,
      currentProfile.profilePicture,
      currentProfile.photoURL,
      currentProfile.photoUrl,
      currentUser.photoURL,
      defaultProfilePicture
    );


    if(quickPostAvatar){

      quickPostAvatar.src =
      profilePicture;

    }


    if(quickMomentAvatar){

      quickMomentAvatar.style.backgroundImage =
      `url("${profilePicture}")`;

    }

  }catch(error){

    console.error(
      "Error loading current user profile:",
      error
    );


    if(quickPostAvatar){

      quickPostAvatar.src =
      defaultProfilePicture;

    }

  }


  updateAdminReportsLink();

}


/* =====================================================
   QUICK POST BUTTON
   (removed from the page — creating a post now
   happens only through the floating + button,
   which did the same thing)
===================================================== */

if(quickPostButton){

  quickPostButton.addEventListener(
    "click",
    function(){

      if(!currentUser){

        window.location.href =
        "login.html";

        return;

      }


      window.location.href =
      "createpost.html";

    }
  );

}


/* =====================================================
   QUICK PROFILE PICTURE
===================================================== */

if(quickPostAvatar){

  protectProfilePicture(
    quickPostAvatar
  );

}


/* =====================================================
   STOP CURRENT FIRESTORE LISTENER
===================================================== */

function stopPostsListener(){

  if(
    typeof unsubscribePosts ===
    "function"
  ){

    unsubscribePosts();

  }


  unsubscribePosts =
  null;

}


/* =====================================================
   START COMMUNITY FEED
===================================================== */

function startCommunityFeed(){

  stopPostsListener();


  if(
    postsLoadObserver
  ){

    postsLoadObserver.disconnect();

  }


  lastVisibleDocument =
  null;


  noMorePostsAvailable =
  false;


  isLoadingMorePosts =
  false;


  loadedPostsDocs =
  [];


  loadedPostIds.clear();


  firstFeedSnapshotHandled =
  false;


  loadMoreSentinel.textContent =
  "";


  const cachedPosts =
  loadFeedCache();


  if(cachedPosts){

    renderPostsFromCache(
      cachedPosts
    );

  }else{

    showLoadingMessage();

  }


  loadCommunityPosts();

}


/* =====================================================
   STOP NOTIFICATION LISTENER
===================================================== */

function stopNotificationListener(){

  if(
    typeof unsubscribeNotifications ===
    "function"
  ){

    unsubscribeNotifications();

  }


  unsubscribeNotifications =
  null;

}


/* =====================================================
   SHOW UNREAD NOTIFICATION NUMBER
===================================================== */

function startNotificationListener(){

  stopNotificationListener();


  if(!currentUser){

    notificationBadge.style.display =
    "none";


    notificationBadge.textContent =
    "0";


    return;

  }


  const unreadNotificationsQuery =
  query(

    collection(
      db,
      "notifications"
    ),

    where(
      "recipientId",
      "==",
      currentUser.uid
    ),

    where(
      "read",
      "==",
      false
    )

  );


  unsubscribeNotifications =
  onSnapshot(

    unreadNotificationsQuery,


    function(snapshot){

      const totalUnread =
      snapshot.size;


      if(totalUnread > 0){

        notificationBadge.style.display =
        "flex";


        notificationBadge.textContent =
        totalUnread > 99
        ? "99+"
        : String(totalUnread);

      }else{

        notificationBadge.style.display =
        "none";


        notificationBadge.textContent =
        "0";

      }

    },


    function(error){

      console.error(
        "Notification badge error:",
        error
      );


      notificationBadge.style.display =
      "none";

    }

  );

}


/* =====================================================
   AUTHENTICATION LISTENER
===================================================== */

onAuthStateChanged(

  auth,


  function(user){

    currentUser =
    user || null;


    startCommunityFeed();


    startNotificationListener();


    startMomentsStripListener();


    loadCurrentUserProfile();

  },


  function(error){

    console.error(
      "Authentication listener error:",
      error
    );


    currentUser =
    null;


    currentProfile =
    {};


    currentUserIsAdmin =
    false;


    updateAdminReportsLink();


    stopNotificationListener();


    notificationBadge.style.display =
    "none";


    notificationBadge.textContent =
    "0";


    if(quickPostAvatar){

      quickPostAvatar.src =
      defaultProfilePicture;

    }


    startCommunityFeed();

  }

);
/* =====================================================
   PART 8 OF 10
   LOAD COMMUNITY POSTS FROM FIRESTORE
===================================================== */


function scheduleCommunityPostsRender(){

  if(
    renderDebounceTimer
  ){

    clearTimeout(
      renderDebounceTimer
    );

  }


  renderDebounceTimer =
  window.setTimeout(
    function(){

      renderDebounceTimer =
      null;


      renderCommunityPosts();


      updateLoadMoreSentinel();


      scrollToSharedPost();

    },
    250
  );

}


function renderCommunityPosts(){

  postsContainer.innerHTML =
  "";


  const combinedDocs =
  loadedPostsDocs;


  if(
    combinedDocs.length === 0
  ){

    showEmptyMessage();

    return;

  }


  combinedDocs.forEach(
    function(postDocument){

      try{

        const postData = {

          id:
          postDocument.id,

          ...postDocument.data()

        };


        const postCard =
        createPostCard(
          postData
        );


        postsContainer.appendChild(
          postCard
        );

      }catch(error){

        console.error(
          "Error creating post card:",
          error
        );

      }

    }
  );


  if(
    postsContainer.children.length ===
    0
  ){

    showErrorMessage(
      "Community posts were found, but they could not be displayed."
    );

    return;

  }


  startVideoAutoPlay();

}


function loadCommunityPosts(){

  try{

    const postsReference =
    collection(
      db,
      "communityPosts"
    );


    const firstPageQuery =
    query(
      postsReference,
      orderBy(
        "timestamp",
        "desc"
      ),
      limit(
        POSTS_PER_PAGE
      )
    );


    unsubscribePosts =
    onSnapshot(

      firstPageQuery,


      function(snapshot){

        /*
           FACEBOOK-STYLE LIVE UPDATE

           The very first snapshot fill loadedPostsDocs
           from scratch (this is the initial page load).
           Every snapshot AFTER that only ever PREPENDS
           brand-new posts that were not already loaded —
           it never removes or reshuffles anything already
           on screen, even if a new post pushes an older
           one out of this top-50 query window. That
           reshuffling was exactly what caused the "oldest
           post disappears" bug: the old code replaced the
           whole top section on every single change.
        */

        if(!firstFeedSnapshotHandled){

          firstFeedSnapshotHandled =
          true;


          loadedPostsDocs =
          snapshot.docs.slice();


          loadedPostIds.clear();


          loadedPostsDocs.forEach(
            function(postDoc){

              loadedPostIds.add(
                postDoc.id
              );

            }
          );


          if(
            snapshot.docs.length > 0
          ){

            lastVisibleDocument =
            snapshot.docs[
              snapshot.docs.length - 1
            ];

          }


          noMorePostsAvailable =
          snapshot.docs.length ===
          0;


          saveFeedCache(
            loadedPostsDocs
          );


          scheduleCommunityPostsRender();


          return;

        }


        const newlyAddedDocs =
        [];


        snapshot.docChanges().forEach(
          function(change){

            if(
              change.type !==
              "added"
            ){

              /*
                 "modified" (likes/comments/edits) and
                 "removed" (often just a post falling out
                 of the top-50 window, not an actual
                 delete) are intentionally ignored here —
                 likes and edits already update their own
                 post card directly, and real deletions are
                 removed from the DOM immediately by the
                 delete button itself, not by this listener.
              */

              return;

            }


            if(
              loadedPostIds.has(
                change.doc.id
              )
            ){

              return;

            }


            loadedPostIds.add(
              change.doc.id
            );


            newlyAddedDocs.push(
              change.doc
            );

          }
        );


        if(
          newlyAddedDocs.length === 0
        ){

          return;

        }


        newlyAddedDocs.sort(
          function(firstDoc,secondDoc){

            const firstTime =
            firstDoc.data()?.timestamp?.seconds ||
            0;


            const secondTime =
            secondDoc.data()?.timestamp?.seconds ||
            0;


            return secondTime - firstTime;

          }
        );


        loadedPostsDocs =
        newlyAddedDocs.concat(
          loadedPostsDocs
        );


        saveFeedCache(
          loadedPostsDocs
        );


        newlyAddedDocs
        .slice()
        .reverse()
        .forEach(
          function(postDoc){

            try{

              const postData = {

                id:
                postDoc.id,

                ...postDoc.data()

              };


              const newCard =
              createPostCard(
                postData
              );


              postsContainer.insertBefore(
                newCard,
                postsContainer.firstChild
              );

            }catch(error){

              console.error(
                "Error inserting new post card:",
                error
              );

            }

          }
        );


        startVideoAutoPlay();

      },


      function(error){

        console.error(
          "Error loading community posts:",
          error
        );


        if(
          error.code ===
          "permission-denied"
        ){

          showErrorMessage(
            "Firebase permission denied access to community posts."
          );

          return;

        }


        if(
          error.code ===
          "failed-precondition"
        ){

          showErrorMessage(
            "Firebase requires an index before community posts can be displayed."
          );

          return;

        }


        if(
          error.code ===
          "unavailable"
        ){

          showErrorMessage(
            "The Community Wall is temporarily unavailable. Check your internet connection and try again."
          );

          return;

        }


        showErrorMessage(
          "Community posts could not be loaded. Please try again."
        );

      }

    );

  }catch(error){

    console.error(
      "Community feed setup error:",
      error
    );


    showErrorMessage(
      "The Community Wall could not be started."
    );

  }

}


async function loadMoreCommunityPosts(){

  if(
    isLoadingMorePosts ||
    noMorePostsAvailable
  ){

    return;

  }


  isLoadingMorePosts =
  true;


  loadMoreSentinel.textContent =
  "Loading more posts...";


  try{

    const postsReference =
    collection(
      db,
      "communityPosts"
    );


    const nextPageQuery =
    lastVisibleDocument

    ? query(
        postsReference,
        orderBy(
          "timestamp",
          "desc"
        ),
        startAfter(
          lastVisibleDocument
        ),
        limit(
          POSTS_PER_PAGE
        )
      )

    : query(
        postsReference,
        orderBy(
          "timestamp",
          "desc"
        ),
        limit(
          POSTS_PER_PAGE
        )
      );


    const snapshot =
    await getDocs(
      nextPageQuery
    );


    if(snapshot.empty){

      if(
        loadedPostsDocs.length === 0
      ){

        noMorePostsAvailable =
        true;


        updateLoadMoreSentinel();


        return;

      }


      /*
         Reached the true end of the feed —
         loop back to the very top instead of
         showing "no more posts". Everything
         already loaded stays exactly where it
         is (nothing is cleared or re-fetched),
         so this is just a smooth scroll home;
         the next scroll-down continues pulling
         in the same posts again from the top,
         exactly like Facebook's endless feed.
      */

      lastVisibleDocument =
      loadedPostsDocs.length > 0

      ? loadedPostsDocs[
          loadedPostsDocs.length - 1
        ]

      : null;


      window.scrollTo(
        {
          top:0,
          behavior:"smooth"
        }
      );


      isLoadingMorePosts =
      false;


      updateLoadMoreSentinel();


      return;

    }


    const newOlderDocs =
    snapshot.docs.filter(
      function(postDoc){

        return !loadedPostIds.has(
          postDoc.id
        );

      }
    );


    newOlderDocs.forEach(
      function(postDoc){

        loadedPostIds.add(
          postDoc.id
        );

      }
    );


    loadedPostsDocs =
    loadedPostsDocs.concat(
      newOlderDocs
    );


    newOlderDocs.forEach(
      function(postDoc){

        try{

          const postData = {

            id:
            postDoc.id,

            ...postDoc.data()

          };


          const olderCard =
          createPostCard(
            postData
          );


          postsContainer.appendChild(
            olderCard
          );

        }catch(error){

          console.error(
            "Error appending older post card:",
            error
          );

        }

      }
    );


    startVideoAutoPlay();


    lastVisibleDocument =
    snapshot.docs.length <
    POSTS_PER_PAGE

    ? null

    : snapshot.docs[
        snapshot.docs.length - 1
      ];


  }catch(error){

    console.error(
      "Error loading more community posts:",
      error
    );


    loadMoreSentinel.textContent =
    "Could not load more posts. Scroll to try again.";


    isLoadingMorePosts =
    false;


    return;

  }


  isLoadingMorePosts =
  false;


  updateLoadMoreSentinel();

}


function updateLoadMoreSentinel(){

  if(noMorePostsAvailable){

    loadMoreSentinel.textContent =
    postsContainer.children.length >
    0
    ? ""
    : "Be the first to share something with the community 🙏";

  }else{

    loadMoreSentinel.textContent =
    "";

  }

}


postsLoadObserver =
new IntersectionObserver(

  function(entries){

    entries.forEach(
      function(entry){

        if(
          entry.isIntersecting
        ){

          loadMoreCommunityPosts();

        }

      }
    );

  },

  {
    rootMargin:
    "300px"
  }

);


postsLoadObserver.observe(
  loadMoreSentinel
);
/* =====================================================
   PART 9 OF 10
   CREATE EACH COMMUNITY POST CARD
===================================================== */


function createPostCard(postData){

  const postCard =
  document.createElement("article");

  postCard.className =
  "postCard";

  postCard.id =
  `post-${postData.id}`;

  postCard.dataset.postId =
  postData.id;


  const authorId =
  getFirstValue(
    postData.userId,
    postData.authorId,
    postData.uid
  );


  const authorName =
  getFirstValue(
    postData.name,
    postData.fullName,
    postData.displayName,
    "Community Member"
  );


  const authorPicture =
  getFirstValue(
    postData.picture,
    postData.profilePicture,
    postData.photoURL,
    postData.photoUrl,
    defaultProfilePicture
  );


  const authorCountry =
  getFirstValue(
    postData.country
  );


  const postDate =
  formatPostDate(
    postData.timestamp
  );


  const postMessage =
  getFirstValue(
    postData.post,
    postData.message,
    postData.content,
    postData.text,
    postData.description
  );


  const postCategory =
  getFirstValue(
    postData.category,
    postData.postCategory,
    postData.type,
    "General"
  );


  const mediaType =
  getFirstValue(
    postData.mediaType
  ).toLowerCase();


  let imageUrl =
  "";

  let videoUrl =
  "";


  if(mediaType === "image"){

    imageUrl =
    getFirstValue(
      postData.imageUrl,
      postData.imageURL,
      postData.photoUrl,
      postData.photoURL,
      postData.postImage,
      postData.image,
      postData.mediaUrl
    );

  }else if(mediaType === "video"){

    videoUrl =
    getFirstValue(
      postData.videoUrl,
      postData.videoURL,
      postData.postVideo,
      postData.video,
      postData.mediaUrl
    );

  }else{

    imageUrl =
    getFirstValue(
      postData.imageUrl,
      postData.imageURL,
      postData.photoUrl,
      postData.photoURL,
      postData.postImage,
      postData.image
    );


    videoUrl =
    getFirstValue(
      postData.videoUrl,
      postData.videoURL,
      postData.postVideo,
      postData.video
    );

  }


  /*
     MULTIPLE PHOTOS PER POST
     (Facebook-style — a post can now carry more
     than one photo. imageUrls is the array field
     createpost.html saves; older posts only ever
     have the single imageUrl above, so those still
     fall back to a one-photo gallery.)
  */

  let imageUrls =
  Array.isArray(
    postData.imageUrls
  )
  ? postData.imageUrls.filter(
      function(url){

        return (
          typeof url === "string" &&
          url.trim() !== ""
        );

      }
    )
  : [];


  if(
    imageUrls.length === 0 &&
    imageUrl
  ){

    imageUrls =
    [imageUrl];

  }


  if(
    imageUrls.length > 0
  ){

    imageUrl =
    imageUrls[0];

  }


  const MAXIMUM_GRID_PHOTOS_SHOWN =
  4;


  const likes =
  Array.isArray(
    postData.likes
  )
  ? postData.likes
  : [];


  const userHasLiked =
  Boolean(
    currentUser &&
    likes.includes(
      currentUser.uid
    )
  );


  const postHeader =
  document.createElement("div");

  postHeader.className =
  "postHeader";


  const profileImage =
  document.createElement("img");

  profileImage.className =
  "authorPicture";

  profileImage.src =
  authorPicture;

  profileImage.loading =
  "lazy";

  profileImage.alt =
  `${authorName}'s profile picture`;


  protectProfilePicture(
    profileImage
  );


  const authorInformation =
  document.createElement("div");

  authorInformation.className =
  "authorInformation";


  const authorNameRow =
  document.createElement("div");

  authorNameRow.className =
  "authorNameRow";


  const authorNameElement =
  document.createElement("div");

  authorNameElement.className =
  "authorName";

  authorNameElement.textContent =
  authorName;


  const verifiedBadge =
  document.createElement("span");

  verifiedBadge.className =
  "verifiedBadge";


  const accountIsVerified =
  postData.verified === true;


  const accountType =
  getFirstValue(
    postData.accountType,
    postData.userType,
    postData.profileType,
    "member"
  ).toLowerCase();


  if(accountIsVerified){

    verifiedBadge.classList.add(
      "show"
    );


    if(
      accountType ===
      "ministry"
    ){

      verifiedBadge.classList.add(
        "ministry"
      );


      verifiedBadge.textContent =
      "✔ Ministry";

    }else{

      verifiedBadge.textContent =
      "✔ Verified";

    }

  }


  authorNameRow.appendChild(
    authorNameElement
  );

  authorNameRow.appendChild(
    verifiedBadge
  );


  const postDetails =
  document.createElement("div");

  postDetails.className =
  "postDetails";

  postDetails.textContent =
  authorCountry
  ? `${authorCountry} • ${postDate}`
  : postDate;


  authorInformation.appendChild(
    authorNameRow
  );

  authorInformation.appendChild(
    postDetails
  );


  postHeader.appendChild(
    profileImage
  );

  postHeader.appendChild(
    authorInformation
  );


  postCard.appendChild(
    postHeader
  );


  if(postCategory){

    const categoryElement =
    document.createElement("div");

    categoryElement.className =
    "postCategory";

    categoryElement.textContent =
    postCategory;


    postCard.appendChild(
      categoryElement
    );

  }


  if(postMessage){

    const messageElement =
    document.createElement("div");

    messageElement.className =
    "postMessage";

    messageElement.textContent =
    postMessage;


    postCard.appendChild(
      messageElement
    );


    /*
       READ MORE / READ LESS

       Long passages (testimonies, Bible study
       notes, prayer requests) are clipped at a
       fixed height and given a toggle link,
       the same way Facebook and Instagram
       shorten long captions instead of letting
       them push the whole feed down.
    */

    const READ_MORE_CHARACTER_LIMIT =
    280;


    if(
      postMessage.length >
      READ_MORE_CHARACTER_LIMIT
    ){

      messageElement.classList.add(
        "truncated"
      );


      const readMoreButton =
      document.createElement(
        "button"
      );


      readMoreButton.type =
      "button";


      readMoreButton.className =
      "readMoreToggle";


      readMoreButton.textContent =
      "Read more";


      readMoreButton.addEventListener(
        "click",
        function(){

          const isStillTruncated =
          messageElement.classList.toggle(
            "truncated"
          );


          readMoreButton.textContent =
          isStillTruncated
          ? "Read more"
          : "Read less";

        }
      );


      postCard.appendChild(
        readMoreButton
      );

    }

  }


  const mediaContainer =
  document.createElement("div");

  mediaContainer.className =
  "postMediaContainer";


  if(imageUrls.length > 0){

    const photoGrid =
    document.createElement("div");

    photoGrid.className =
    `postPhotoGrid count-${
      Math.min(
        imageUrls.length,
        MAXIMUM_GRID_PHOTOS_SHOWN
      )
    }`;


    photoGrid.dataset.images =
    JSON.stringify(
      imageUrls
    );


    const visibleImageUrls =
    imageUrls.slice(
      0,
      MAXIMUM_GRID_PHOTOS_SHOWN
    );


    const remainingPhotosCount =
    imageUrls.length -
    visibleImageUrls.length;


    visibleImageUrls.forEach(
      function(url,index){

        const tile =
        document.createElement("div");

        tile.className =
        "postPhotoTile";


        const postImage =
        document.createElement("img");

        postImage.className =
        "communityPostImage";

        postImage.src =
        url;

        postImage.alt =
        `Community post photo ${index + 1}`;

        postImage.loading =
        "lazy";

        postImage.dataset.fullImage =
        url;

        postImage.dataset.galleryIndex =
        String(index);


        postImage.addEventListener(
          "error",
          function(){

            tile.remove();

          },
          {
            once:true
          }
        );


        tile.appendChild(
          postImage
        );


        const isLastVisibleTile =
        index ===
        visibleImageUrls.length - 1;


        if(
          isLastVisibleTile &&
          remainingPhotosCount > 0
        ){

          const moreOverlay =
          document.createElement("div");

          moreOverlay.className =
          "postPhotoMoreOverlay";

          moreOverlay.textContent =
          `+${remainingPhotosCount}`;


          tile.appendChild(
            moreOverlay
          );

        }


        photoGrid.appendChild(
          tile
        );

      }
    );


    mediaContainer.appendChild(
      photoGrid
    );

  }else if(videoUrl){

    const videoWrapper =
    document.createElement("div");

    videoWrapper.className =
    "communityPostVideoWrapper";


    const postVideo =
    document.createElement("video");

    postVideo.className =
    "communityPostVideo";

    postVideo.src =
    videoUrl;

    postVideo.controls =
    false;

    postVideo.muted =
    true;

    postVideo.preload =
    "metadata";

    postVideo.playsInline =
    true;

    postVideo.loop =
    true;


    postVideo.addEventListener(
      "error",
      function(){

        videoWrapper.remove();

      },
      {
        once:true
      }
    );


    const expandOverlay =
    document.createElement("div");

    expandOverlay.className =
    "videoExpandOverlay";

    expandOverlay.innerHTML =
    "▶";


    videoWrapper.appendChild(
      postVideo
    );

    videoWrapper.appendChild(
      expandOverlay
    );


    videoWrapper.addEventListener(
      "click",
      function(){

        openVideoReelViewer(
          videoUrl
        );

      }
    );


    mediaContainer.appendChild(
      videoWrapper
    );

  }


  if(
    mediaContainer.children.length >
    0
  ){

    postCard.appendChild(
      mediaContainer
    );

  }


  const actionsContainer =
  document.createElement("div");

  actionsContainer.className =
  "postActions";


  const likeButton =
  document.createElement("button");

  likeButton.type =
  "button";

  likeButton.className =
  userHasLiked
  ? "likeButton liked"
  : "likeButton";

  likeButton.dataset.postId =
  postData.id;

  likeButton.dataset.authorId =
  authorId;

  likeButton.dataset.likes =
  JSON.stringify(
    likes
  );

  likeButton.innerHTML =
  `❤️ <span>${likes.length}</span>`;


  const commentButton =
  document.createElement("button");

  commentButton.type =
  "button";

  commentButton.className =
  "commentButton";

  commentButton.dataset.postId =
  postData.id;

  const commentsCount =
  Number(
    postData.commentsCount
  ) || 0;


  commentButton.innerHTML =
  commentsCount > 0
  ? `💬 <span>${commentsCount}</span>`
  : "💬 Comment";


  const shareButton =
  document.createElement("button");

  shareButton.type =
  "button";

  shareButton.className =
  "shareButton";

  shareButton.dataset.postId =
  postData.id;

  shareButton.dataset.message =
  postMessage;

  shareButton.innerHTML =
  "🔗 Share";


  actionsContainer.appendChild(
    likeButton
  );

  actionsContainer.appendChild(
    commentButton
  );

  actionsContainer.appendChild(
    shareButton
  );


  if(
    currentUser &&
    authorId &&
    authorId !== currentUser.uid
  ){

    const reportButton =
    document.createElement("button");

    reportButton.type =
    "button";

    reportButton.className =
    "reportButton";

    reportButton.dataset.postId =
    postData.id;

    reportButton.dataset.authorId =
    authorId;

    reportButton.dataset.message =
    postMessage;

    reportButton.innerHTML =
    "🚩 Report";


    actionsContainer.appendChild(
      reportButton
    );

  }


  postCard.appendChild(
    actionsContainer
  );


  if(
    currentUser &&
    authorId === currentUser.uid
  ){

    const ownerActions =
    document.createElement("div");

    ownerActions.className =
    "postActions ownerActions";


    const editButton =
    document.createElement("button");

    editButton.type =
    "button";

    editButton.className =
    "editButton";

    editButton.dataset.postId =
    postData.id;

    editButton.dataset.message =
    postMessage;

    editButton.innerHTML =
    "✏️ Edit";


    const deleteButton =
    document.createElement("button");

    deleteButton.type =
    "button";

    deleteButton.className =
    "deleteButton";

    deleteButton.dataset.postId =
    postData.id;

    deleteButton.innerHTML =
    "🗑️ Delete";


    ownerActions.appendChild(
      editButton
    );

    ownerActions.appendChild(
      deleteButton
    );


    postCard.appendChild(
      ownerActions
    );

  }else if(
    currentUserIsAdmin &&
    currentUser
  ){

    const adminActions =
    document.createElement("div");

    adminActions.className =
    "postActions ownerActions adminActions";


    const adminDeleteButton =
    document.createElement("button");

    adminDeleteButton.type =
    "button";

    adminDeleteButton.className =
    "deleteButton adminDeleteButton";

    adminDeleteButton.dataset.postId =
    postData.id;

    adminDeleteButton.innerHTML =
    "🛡️ Remove Post (Admin)";


    adminActions.appendChild(
      adminDeleteButton
    );


    postCard.appendChild(
      adminActions
    );

  }


  if(authorId){

    profileImage.addEventListener(
      "click",
      function(){

        window.location.href =
        "user-profile.html?uid=" +
        encodeURIComponent(
          authorId
        );

      }
    );


    authorNameElement.addEventListener(
      "click",
      function(){

        window.location.href =
        "user-profile.html?uid=" +
        encodeURIComponent(
          authorId
        );

      }
    );

  }


  return postCard;

}
/* =====================================================
   PART 10 OF 10
   POST ACTIONS, PHOTO VIEWER, REFRESH,
   SHARED POST SCROLLING AND FINAL CLOSING
===================================================== */


async function createLikeNotification(
  recipientId,
  postId
){

  if(
    !currentUser ||
    !recipientId ||
    !postId
  ){

    return;

  }


  if(
    recipientId ===
    currentUser.uid
  ){

    return;

  }


  const senderName =
  getFirstValue(
    currentProfile.fullName,
    currentProfile.name,
    currentUser.displayName,
    currentUser.email,
    "A community member"
  );


  try{

    await addDoc(
      collection(
        db,
        "notifications"
      ),
      {

        recipientId:
        recipientId,

        senderId:
        currentUser.uid,

        senderName:
        senderName,

        type:
        "like",

        postId:
        postId,

        targetUrl:
        `feed.html?post=${encodeURIComponent(postId)}`,

        message:
        `${senderName} liked your post.`,

        read:
        false,

        timestamp:
        serverTimestamp()

      }
    );

  }catch(error){

    console.error(
      "Error creating like notification:",
      error
    );

  }

}


async function handleLikeButton(
  button
){

  if(!currentUser){

    window.location.href =
    "login.html";

    return;

  }


  const postId =
  button.dataset.postId;


  const postAuthorId =
  button.dataset.authorId ||
  "";


  if(!postId){

    return;

  }


  let likes =
  [];


  try{

    const savedLikes =
    JSON.parse(
      button.dataset.likes ||
      "[]"
    );


    likes =
    Array.isArray(
      savedLikes
    )
    ? savedLikes
    : [];

  }catch(error){

    console.error(
      "Could not read post likes:",
      error
    );


    likes =
    [];

  }


  const currentUserId =
  currentUser.uid;


  const userAlreadyLiked =
  likes.includes(
    currentUserId
  );


  const updatedLikes =
  userAlreadyLiked

  ? likes.filter(
      function(userId){

        return (
          userId !==
          currentUserId
        );

      }
    )

  : [
      ...likes,
      currentUserId
    ];


  button.disabled =
  true;


  try{

    const postReference =
    doc(
      db,
      "communityPosts",
      postId
    );


    await updateDoc(
      postReference,
      {
        likes:
        updatedLikes
      }
    );


    button.dataset.likes =
    JSON.stringify(
      updatedLikes
    );


    button.classList.toggle(
      "liked",
      !userAlreadyLiked
    );


    const likeCount =
    button.querySelector(
      "span"
    );


    if(likeCount){

      likeCount.textContent =
      updatedLikes.length;

    }


    if(!userAlreadyLiked){

      await createLikeNotification(
        postAuthorId,
        postId
      );

    }

  }catch(error){

    console.error(
      "Error updating likes:",
      error
    );


    alert(
      "The like could not be updated."
    );

  }finally{

    button.disabled =
    false;

  }

}


function handleCommentButton(
  button
){

  const postId =
  button.dataset.postId;


  if(!postId){

    return;

  }


  window.location.href =
  `comments.html?postId=${encodeURIComponent(postId)}`;

}


async function handleShareButton(
  button
){

  const postId =
  button.dataset.postId;


  if(!postId){

    return;

  }


  const postMessage =
  button.dataset.message ||
  "";


  const postUrl =
  `${window.location.origin}${window.location.pathname}?post=${encodeURIComponent(postId)}`;


  const shareText =
  postMessage

  ? `${postMessage}\n\nSABASABA Gospel Ministry`

  : "See this post on SABASABA Gospel Ministry.";


  try{

    if(
      navigator.share
    ){

      await navigator.share(
        {

          title:
          "SABASABA Gospel Ministry",

          text:
          shareText,

          url:
          postUrl

        }
      );


      return;

    }


    if(
      navigator.clipboard &&
      window.isSecureContext
    ){

      await navigator.clipboard.writeText(
        postUrl
      );


      alert(
        "Post link copied."
      );


      return;

    }


    window.prompt(
      "Copy this post link:",
      postUrl
    );

  }catch(error){

    if(
      error.name !==
      "AbortError"
    ){

      console.error(
        "Error sharing post:",
        error
      );


      alert(
        "The post could not be shared."
      );

    }

  }

}


async function handleEditButton(
  button
){

  if(!currentUser){

    window.location.href =
    "login.html";

    return;

  }


  const postId =
  button.dataset.postId;


  const oldMessage =
  button.dataset.message ||
  "";


  if(!postId){

    return;

  }


  const newMessage =
  window.prompt(
    "Edit your post:",
    oldMessage
  );


  if(
    newMessage === null
  ){

    return;

  }


  const cleanedMessage =
  newMessage.trim();


  if(!cleanedMessage){

    alert(
      "The post cannot be empty."
    );

    return;

  }


  button.disabled =
  true;


  try{

    const postReference =
    doc(
      db,
      "communityPosts",
      postId
    );


    await updateDoc(
      postReference,
      {
        post:
        cleanedMessage
      }
    );


    button.dataset.message =
    cleanedMessage;

  }catch(error){

    console.error(
      "Error editing post:",
      error
    );


    alert(
      "The post could not be edited."
    );

  }finally{

    button.disabled =
    false;

  }

}


async function handleDeleteButton(
  button
){

  if(!currentUser){

    window.location.href =
    "login.html";

    return;

  }


  const postId =
  button.dataset.postId;


  if(!postId){

    return;

  }


  const confirmed =
  window.confirm(
    "Are you sure you want to delete this post?"
  );


  if(!confirmed){

    return;

  }


  button.disabled =
  true;


  try{

    const postReference =
    doc(
      db,
      "communityPosts",
      postId
    );


    await deleteDoc(
      postReference
    );


    /*
       Remove it from the page and from the
       loaded-post tracking right away — the
       live listener now deliberately ignores
       "removed" snapshot changes (since those
       also fire when a post simply falls out
       of the top-50 window, not just on real
       deletes), so this button is what actually
       takes a deleted post off the screen.
    */

    loadedPostIds.delete(
      postId
    );


    loadedPostsDocs =
    loadedPostsDocs.filter(
      function(postDoc){

        return postDoc.id !==
        postId;

      }
    );


    const postCardElement =
    document.getElementById(
      `post-${postId}`
    );


    if(postCardElement){

      postCardElement.remove();

    }


    if(
      postsContainer.children.length ===
      0
    ){

      showEmptyMessage();

    }

  }catch(error){

    console.error(
      "Error deleting post:",
      error
    );


    alert(
      "The post could not be deleted."
    );


    button.disabled =
    false;

  }

}


let reportTargetPostId =
null;

let reportTargetAuthorId =
null;

let reportTargetMessage =
"";

let selectedReportReason =
null;


function openReportModal(
  postId,
  authorId,
  message
){

  if(!currentUser){

    window.location.href =
    "login.html";

    return;

  }


  reportTargetPostId =
  postId;

  reportTargetAuthorId =
  authorId ||
  "";

  reportTargetMessage =
  message ||
  "";

  selectedReportReason =
  null;


  if(reportReasonList){

    reportReasonList
    .querySelectorAll(
      ".reportReasonOption"
    )
    .forEach(
      optionButton => {

        optionButton.classList.remove(
          "selected"
        );

      }
    );

  }


  if(reportSubmitButton){

    reportSubmitButton.disabled =
    true;

    reportSubmitButton.textContent =
    "Submit report";

  }


  if(reportModal){

    reportModal.classList.add(
      "open"
    );

    reportModal.setAttribute(
      "aria-hidden",
      "false"
    );

  }


  document.body.style.overflow =
  "hidden";

}


function closeReportModal(){

  if(reportModal){

    reportModal.classList.remove(
      "open"
    );

    reportModal.setAttribute(
      "aria-hidden",
      "true"
    );

  }


  document.body.style.overflow =
  "";


  reportTargetPostId =
  null;

  reportTargetAuthorId =
  null;

  reportTargetMessage =
  "";

  selectedReportReason =
  null;

}


if(reportReasonList){

  reportReasonList.addEventListener(
    "click",
    event => {

      const optionButton =
      event.target.closest(
        ".reportReasonOption"
      );


      if(!optionButton){

        return;

      }


      reportReasonList
      .querySelectorAll(
        ".reportReasonOption"
      )
      .forEach(
        button => {

          button.classList.remove(
            "selected"
          );

        }
      );


      optionButton.classList.add(
        "selected"
      );


      selectedReportReason =
      optionButton.dataset.reason ||
      "Other";


      if(reportSubmitButton){

        reportSubmitButton.disabled =
        false;

      }

    }
  );

}


if(reportCancelButton){

  reportCancelButton.addEventListener(
    "click",
    closeReportModal
  );

}


if(reportModal){

  reportModal.addEventListener(
    "click",
    event => {

      if(
        event.target ===
        reportModal
      ){

        closeReportModal();

      }

    }
  );

}


if(reportSubmitButton){

  reportSubmitButton.addEventListener(
    "click",
    async () => {

      if(
        !currentUser ||
        !reportTargetPostId ||
        !selectedReportReason
      ){

        return;

      }


      reportSubmitButton.disabled =
      true;

      reportSubmitButton.textContent =
      "Submitting...";


      const reporterName =
      getFirstValue(

        currentProfile.fullName,

        currentProfile.name,

        currentUser.displayName,

        currentUser.email,

        "A community member"

      );


      try{

        await addDoc(

          collection(
            db,
            "reports"
          ),

          {

            postId:
            reportTargetPostId,

            postAuthorId:
            reportTargetAuthorId,

            postMessageSnapshot:
            reportTargetMessage.slice(
              0,
              300
            ),

            reporterId:
            currentUser.uid,

            reporterName:
            reporterName,

            reason:
            selectedReportReason,

            status:
            "pending",

            timestamp:
            serverTimestamp()

          }

        );


        alert(
          "Thank you — this post has been reported and will be reviewed."
        );


        closeReportModal();

      }catch(error){

        console.error(
          "Error submitting report:",
          error
        );


        alert(
          "The report could not be submitted. Please try again."
        );


        reportSubmitButton.disabled =
        false;

        reportSubmitButton.textContent =
        "Submit report";

      }

    }
  );

}


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
      document.createElement(
        "div"
      );

      slide.className =
      "videoReelSlide";


      const videoElement =
      document.createElement(
        "video"
      );

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

  if(
    reelScrollObserver
  ){

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
            entry.intersectionRatio >=
            0.6
          ){

            allReelVideos.forEach(
              function(otherVideo){

                if(
                  otherVideo !==
                  video
                ){

                  otherVideo.pause();

                }

              }
            );


            const playPromise =
            video.play();


            if(
              playPromise !==
              undefined
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

  if(
    reelScrollObserver
  ){

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


postsContainer.addEventListener(
  "click",
  function(event){

    const likeButton =
    event.target.closest(
      ".likeButton"
    );


    if(likeButton){

      handleLikeButton(
        likeButton
      );

      return;

    }


    const commentButton =
    event.target.closest(
      ".commentButton"
    );


    if(commentButton){

      handleCommentButton(
        commentButton
      );

      return;

    }


    const shareButton =
    event.target.closest(
      ".shareButton"
    );


    if(shareButton){

      handleShareButton(
        shareButton
      );

      return;

    }


    const editButton =
    event.target.closest(
      ".editButton"
    );


    if(editButton){

      handleEditButton(
        editButton
      );

      return;

    }


    const deleteButton =
    event.target.closest(
      ".deleteButton"
    );


    if(deleteButton){

      handleDeleteButton(
        deleteButton
      );

      return;

    }


    const reportButton =
    event.target.closest(
      ".reportButton"
    );


    if(reportButton){

      openReportModal(

        reportButton.dataset.postId,

        reportButton.dataset.authorId,

        reportButton.dataset.message

      );

      return;

    }


    const postImage =
    event.target.closest(
      ".communityPostImage"
    );


    if(postImage){

      const photoGrid =
      postImage.closest(
        ".postPhotoGrid"
      );


      let galleryImages =
      [];


      try{

        galleryImages =
        photoGrid
        ? JSON.parse(
            photoGrid.dataset.images ||
            "[]"
          )
        : [];

      }catch(error){

        galleryImages =
        [];

      }


      if(
        !Array.isArray(
          galleryImages
        ) ||
        galleryImages.length === 0
      ){

        galleryImages =
        [
          postImage.dataset.fullImage ||
          postImage.src
        ];

      }


      const startIndex =
      Number(
        postImage.dataset.galleryIndex
      ) ||
      0;


      openPhotoViewer(
        galleryImages,
        startIndex
      );

    }

  }
);


closePhotoViewerButton.addEventListener(
  "click",
  hidePhotoViewer
);


photoViewer.addEventListener(
  "click",
  function(event){

    if(
      event.target ===
      photoViewer
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
        event.key ===
        "ArrowLeft"
      ){

        showGalleryImageAt(
          currentGalleryIndex - 1
        );

        return;

      }


      if(
        event.key ===
        "ArrowRight"
      ){

        showGalleryImageAt(
          currentGalleryIndex + 1
        );

        return;

      }

    }


    if(
      event.key !==
      "Escape"
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


    if(

      reportModal &&

      reportModal.classList.contains(
        "open"
      )

    ){

      closeReportModal();

    }

  }
);


if(refreshButton){

  refreshButton.addEventListener(
    "click",
    function(){

      refreshButton.disabled =
      true;


      refreshButton.textContent =
      "⏳";


      startCommunityFeed();


      window.setTimeout(
        function(){

          refreshButton.disabled =
          false;


          refreshButton.textContent =
          "🔄";

        },
        1000
      );

    }
  );

}


async function scrollToSharedPost(){

  const urlParameters =
  new URLSearchParams(
    window.location.search
  );


  const sharedPostId =
  urlParameters.get(
    "post"
  );


  if(!sharedPostId){

    return;

  }


  let sharedPost =
  document.getElementById(
    `post-${sharedPostId}`
  );


  if(!sharedPost){

    try{

      const postReference =
      doc(
        db,
        "communityPosts",
        sharedPostId
      );


      const postSnapshot =
      await getDoc(
        postReference
      );


      if(
        postSnapshot.exists()
      ){

        const postData = {

          id:
          postSnapshot.id,

          ...postSnapshot.data()

        };


        const postCard =
        createPostCard(
          postData
        );


        postsContainer.insertBefore(
          postCard,
          postsContainer.firstChild
        );


        sharedPost =
        postCard;

      }

    }catch(error){

      console.error(
        "Error loading shared post:",
        error
      );

    }

  }


  if(!sharedPost){

    return;

  }


  window.setTimeout(
    function(){

      sharedPost.scrollIntoView(
        {

          behavior:
          "smooth",

          block:
          "center"

        }
      );

    },
    150
  );

}


window.addEventListener(
  "beforeunload",
  function(){

    stopPostsListener();

    stopNotificationListener();

    stopMomentsStripListener();


    if(
      postsLoadObserver
    ){

      postsLoadObserver.disconnect();

    }


    if(
      renderDebounceTimer
    ){

      clearTimeout(
        renderDebounceTimer
      );

    }

  }
);


console.log(
  "Faith Connect Community Wall is ready."
);


let videoObserver =
null;


function startVideoAutoPlay(){

  if(videoObserver){

    videoObserver.disconnect();

  }


  const communityVideos =
  document.querySelectorAll(
    ".communityPostVideo"
  );


  if(
    !communityVideos.length
  ){

    return;

  }


  videoObserver =
  new IntersectionObserver(

    function(entries){

      entries.forEach(
        function(entry){

          const video =
          entry.target;


          if(
            entry.isIntersecting &&
            entry.intersectionRatio >=
            0.7
          ){

            communityVideos.forEach(
              function(otherVideo){

                if(
                  otherVideo !==
                  video
                ){

                  otherVideo.pause();

                }

              }
            );


            video.muted =
            true;


            const playPromise =
            video.play();


            if(
              playPromise !==
              undefined
            ){

              playPromise.catch(
                function(error){

                  console.log(
                    "Video autoplay was blocked:",
                    error
                  );

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
        0.25,
        0.5,
        0.7,
        1
      ]
    }

  );


  communityVideos.forEach(
    function(video){

      video.muted =
      true;


      video.playsInline =
      true;


      videoObserver.observe(
        video
      );

    }
  );

}


function isMomentStillActiveForStrip(
  momentData
){

  const rawTimestamp =
  momentData.timestamp ||
  momentData.createdAt;

  if(!rawTimestamp){

    return true;

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

    return true;

  }

  const twentyFourHours =
  24 * 60 * 60 * 1000;

  return (
    createdDate.getTime() +
    twentyFourHours
  ) > Date.now();

}


function getStripMomentTypeIcon(
  type
){

  const normalizedType =
  String(
    type || ""
  ).toLowerCase();

  const icons = {

    verse:"📖",
    prayer:"🙏",
    testimony:"💬",
    photo:"🖼️",
    video:"🎥"

  };

  return icons[normalizedType] || "✨";

}


function getStripInitials(
  name
){

  const cleanName =
  String(
    name || "Faith Member"
  ).trim();

  const words =
  cleanName
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


function renderMomentsStrip(
  momentsSnapshot
){

  momentsRow
  .querySelectorAll(
    ".memberMomentCard"
  )
  .forEach(
    function(element){

      element.remove();

    }
  );


  const momentsByUser =
  new Map();


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


      const privacy =
      String(
        momentData.privacy ||
        "everyone"
      ).toLowerCase();


      const momentUserId =
      momentData.userId ||
      momentData.authorId ||
      momentData.uid ||
      "";


      const isOwnMoment =
      Boolean(
        currentUser &&
        momentUserId === currentUser.uid
      );


      if(
        privacy !== "everyone" &&
        !isOwnMoment
      ){

        return;

      }


      if(
        !momentUserId ||
        momentsByUser.has(momentUserId)
      ){

        return;

      }


      momentsByUser.set(
        momentUserId,
        {
          id:momentDoc.id,
          ...momentData
        }
      );

    }
  );


  momentsByUser.forEach(
    function(momentData){

      const name =
      getFirstValue(
        momentData.name,
        momentData.fullName,
        momentData.displayName,
        "Faith Connect Member"
      );


      const profilePicture =
      getFirstValue(
        momentData.profilePicture,
        momentData.picture,
        momentData.photoURL
      );


      /*
         The card's BACKGROUND photo is the moment's
         own content (what the person actually shared),
         not their profile picture — that small circular
         profile picture becomes the corner avatar
         instead, the same way Facebook Stories work.
      */

      const momentContentImage =
      getFirstValue(
        momentData.imageUrl,
        momentData.imageURL,
        momentData.photoUrl,
        momentData.photoURL,
        momentData.mediaUrl,
        momentData.thumbnailUrl,
        momentData.videoThumbnail,
        momentData.contentUrl
      );


      const typeIcon =
      getStripMomentTypeIcon(
        momentData.type ||
        momentData.momentType
      );


      const momentCard =
      document.createElement(
        "a"
      );


      momentCard.href =
      `faith-moments.html?moment=${encodeURIComponent(
        momentData.id
      )}`;


      momentCard.className =
      "momentCard memberMomentCard";


      if(momentContentImage){

        momentCard.style.backgroundImage =
        `url("${momentContentImage}")`;

      }else{

        momentCard.classList.add(
          "momentCardFallback"
        );

      }


      momentCard.innerHTML = `

        <div class="momentCardGradient"></div>

        ${
          !momentContentImage
          ? `<div class="momentCardFallbackIcon">${typeIcon}</div>`
          : ""
        }

        <div class="momentCardAvatar">

          ${
            profilePicture
            ? `<img src="${profilePicture}" alt="${name}">`
            : `<span class="momentCardAvatarInitials">${getStripInitials(name)}</span>`
          }

        </div>

        <div class="momentCardName">
          ${name}
        </div>

      `;


      momentsRow.appendChild(
        momentCard
      );

    }
  );

}


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
    limit(30)
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
   END JAVASCRIPT MODULE
===================================================== */
