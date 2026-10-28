/* =====================================================
   FAITH CONNECT - COMMUNITY WALL (feed.js)
   Clean full version.

   Changes in this version:
   - Faith Moments strip shows EVERY moment as its own
     card (no more one-moment-per-user limit).
   - Strip reads authorName / authorPicture, which is what
     create-faith-moment.html actually saves.
   - Strip icons match the real moment types
     (encouragement, scripture, testimony).
   - Names are HTML-escaped on the strip.
   - Infinite scroll keeps working after sign-in changes.
   - "Load more" no longer re-fetches the first page.
===================================================== */

import {
  auth, db, collection, addDoc, query, where, orderBy, onSnapshot,
  doc, getDoc, getDocs, updateDoc, deleteDoc, serverTimestamp,
  onAuthStateChanged, limit, startAfter
} from "./firebase.js";


/* =====================================================
   CONFIG
===================================================== */

const ADMIN_EMAILS = ["sabasabawk@gmail.com"];
/* Default profile picture drawn by the app itself (grey person),
   so it works even if images/profile.png is missing. */
const DEFAULT_PICTURE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
    '<rect width="100" height="100" fill="#dfe6ec"/>' +
    '<circle cx="50" cy="38" r="18" fill="#9aa8b4"/>' +
    '<path d="M14 100c0-22 16-38 36-38s36 16 36 38z" fill="#9aa8b4"/>' +
    '</svg>'
  );
const POSTS_PER_PAGE = 100;
const MOMENTS_LIMIT = 60;
const MOMENT_LIFETIME_MS = 24 * 60 * 60 * 1000;
const MAX_GRID_PHOTOS = 4;
const READ_MORE_LIMIT = 280;

const FEED_CACHE_KEY = "sabasaba_feed_cache_v1";
const FEED_CACHE_MAX_POSTS = 20;
const FEED_CACHE_MAX_AGE_MS = 30 * 60 * 1000;


/* =====================================================
   PAGE ELEMENTS
===================================================== */

const $ = (id) => document.getElementById(id);

const postsContainer = $("postsContainer");
const loadMoreSentinel = $("loadMoreSentinel");
const refreshButton = $("refreshButton");
const quickPostButton = $("quickPostButton");
const quickPostAvatar = $("quickPostAvatar");
const quickMomentAvatar = $("quickMomentAvatar");
const momentsRow = $("momentsRow");
const notificationBadge = $("notificationBadge");

const photoViewer = $("photoViewer");
const photoViewerImage = $("photoViewerImage");
const photoViewerVideo = $("photoViewerVideo");
const closePhotoViewerButton = $("closePhotoViewer");
const photoViewerPrevButton = $("photoViewerPrevButton");
const photoViewerNextButton = $("photoViewerNextButton");
const photoViewerCounter = $("photoViewerCounter");

const videoReelViewer = $("videoReelViewer");
const videoReelTrack = $("videoReelTrack");
const closeVideoReelViewerButton = $("closeVideoReelViewer");

const reportModal = $("reportModal");
const reportReasonList = $("reportReasonList");
const reportCancelButton = $("reportCancelButton");
const reportSubmitButton = $("reportSubmitButton");


/* =====================================================
   STATE
===================================================== */

let currentUser = null;
let currentProfile = {};
let currentUserIsAdmin = false;

let unsubscribePosts = null;
let unsubscribeNotifications = null;
let unsubscribeMoments = null;

let loadedPostsDocs = [];
const loadedPostIds = new Set();
let lastVisibleDocument = null;
let isLoadingMorePosts = false;
let noMorePostsAvailable = false;
let firstFeedSnapshotHandled = false;
let renderDebounceTimer = null;

let currentGalleryImages = [];
let currentGalleryIndex = 0;

let postsLoadObserver = null;
let videoObserver = null;
let reelScrollObserver = null;


/* =====================================================
   SMALL HELPERS
===================================================== */

function getFirstValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toDate(timestamp) {
  if (!timestamp) return null;
  let date;
  if (typeof timestamp.toDate === "function") date = timestamp.toDate();
  else if (timestamp.seconds) date = new Date(timestamp.seconds * 1000);
  else date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatPostDate(timestamp) {
  const date = toDate(timestamp);
  if (!date) return "Recently";
  return date.toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit"
  });
}

function protectProfilePicture(imageElement) {
  if (!imageElement) return;
  imageElement.addEventListener("error", () => {
    imageElement.src = DEFAULT_PICTURE;
  }, { once: true });
}

function lockScroll(locked) {
  document.body.style.overflow = locked ? "hidden" : "";
}

function goToProfile(uid) {
  window.location.href = "user-profile.html?uid=" + encodeURIComponent(uid);
}


/* =====================================================
   STATUS MESSAGES
===================================================== */

function showLoadingMessage() {
  postsContainer.innerHTML =
    `<div class="statusCard loading">Loading community posts...</div>`;
}

function showEmptyMessage() {
  postsContainer.innerHTML = `
    <div class="statusCard empty">
      No community posts are available yet.<br><br>
      Be the first person to share a testimony, prayer,
      encouragement, photo or video.
    </div>`;
}

function showErrorMessage(message) {
  postsContainer.innerHTML = "";
  const card = document.createElement("div");
  card.className = "statusCard error";
  card.textContent = message;
  postsContainer.appendChild(card);
}


/* =====================================================
   FEED CACHE
===================================================== */

function saveFeedCache(postDocuments) {
  try {
    const posts = postDocuments
      .slice(0, FEED_CACHE_MAX_POSTS)
      .map((d) => ({ id: d.id, data: d.data() }));
    window.localStorage.setItem(
      FEED_CACHE_KEY,
      JSON.stringify({ savedAt: Date.now(), posts })
    );
  } catch (error) {
    console.warn("Feed cache could not be saved:", error);
  }
}

function loadFeedCache() {
  try {
    const raw = window.localStorage.getItem(FEED_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - (parsed.savedAt || 0) > FEED_CACHE_MAX_AGE_MS) return null;
    if (!Array.isArray(parsed.posts) || parsed.posts.length === 0) return null;
    return parsed.posts;
  } catch (error) {
    console.warn("Feed cache could not be read:", error);
    return null;
  }
}

function renderPostsFromCache(cachedPosts) {
  postsContainer.innerHTML = "";
  cachedPosts.forEach((cached) => {
    try {
      const card = createPostCard({ id: cached.id, ...cached.data });
      card.classList.add("postCardCached");
      postsContainer.appendChild(card);
    } catch (error) {
      console.error("Error rendering cached post:", error);
    }
  });
  startVideoAutoPlay();
}


/* =====================================================
   ADMIN SHORTCUTS STRIP
===================================================== */

function updateAdminReportsLink() {
  const oldStrip = $("adminToolsStrip");

  ["adminReportsLink", "adminFeedbackLink"].forEach((id) => {
    const old = $(id);
    if (old) old.remove();
  });

  if (!currentUserIsAdmin) {
    if (oldStrip) oldStrip.remove();
    return;
  }
  if (oldStrip) return;

  const pageContainer = document.querySelector(".pageContainer");
  if (!pageContainer) return;

  const strip = document.createElement("div");
  strip.id = "adminToolsStrip";
  strip.style.cssText = "display:flex;gap:8px;margin:0 0 10px;";

  [
    { href: "admin-feedback.html", label: "📋 User Feedback" },
    { href: "admin-reports.html", label: "🛡️ Reported Posts" }
  ].forEach((info) => {
    const link = document.createElement("a");
    link.href = info.href;
    link.textContent = info.label;
    link.style.cssText =
      "flex:1;text-align:center;padding:9px 6px;border-radius:12px;" +
      "background:#e7f3ff;color:#0873c9;font-size:13px;font-weight:bold;" +
      "text-decoration:none;";
    strip.appendChild(link);
  });

  pageContainer.insertBefore(strip, pageContainer.firstChild);
}


/* =====================================================
   CURRENT USER PROFILE
===================================================== */

function setMyAvatar(url) {
  if (quickPostAvatar) quickPostAvatar.src = url;
  if (quickMomentAvatar) {
    quickMomentAvatar.style.backgroundImage = `url("${url}")`;
  }
}

async function loadCurrentUserProfile() {
  currentProfile = {};
  currentUserIsAdmin = false;

  if (!currentUser) {
    setMyAvatar(DEFAULT_PICTURE);
    updateAdminReportsLink();
    return;
  }

  currentUserIsAdmin = ADMIN_EMAILS.includes(
    String(currentUser.email || "").toLowerCase()
  );
  updateAdminReportsLink();

  try {
    const snapshot = await getDoc(doc(db, "users", currentUser.uid));
    if (snapshot.exists()) {
      currentProfile = snapshot.data();
      currentUserIsAdmin = currentUserIsAdmin || currentProfile.isAdmin === true;
    }
    setMyAvatar(getFirstValue(
      currentProfile.picture,
      currentProfile.profilePicture,
      currentProfile.photoURL,
      currentProfile.photoUrl,
      currentUser.photoURL,
      DEFAULT_PICTURE
    ));
  } catch (error) {
    console.error("Error loading current user profile:", error);
    if (quickPostAvatar) quickPostAvatar.src = DEFAULT_PICTURE;
  }

  updateAdminReportsLink();
}

if (quickPostButton) {
  quickPostButton.addEventListener("click", () => {
    window.location.href = currentUser ? "createpost.html" : "login.html";
  });
}
protectProfilePicture(quickPostAvatar);


/* =====================================================
   NOTIFICATION BADGE
===================================================== */

function stopNotificationListener() {
  if (typeof unsubscribeNotifications === "function") unsubscribeNotifications();
  unsubscribeNotifications = null;
}

function setBadge(count) {
  if (!notificationBadge) return;
  if (count > 0) {
    notificationBadge.style.display = "flex";
    notificationBadge.textContent = count > 99 ? "99+" : String(count);
  } else {
    notificationBadge.style.display = "none";
    notificationBadge.textContent = "0";
  }
}

function startNotificationListener() {
  stopNotificationListener();
  if (!currentUser) {
    setBadge(0);
    return;
  }

  const unreadQuery = query(
    collection(db, "notifications"),
    where("recipientId", "==", currentUser.uid),
    where("read", "==", false)
  );

  unsubscribeNotifications = onSnapshot(
    unreadQuery,
    (snapshot) => setBadge(snapshot.size),
    (error) => {
      console.error("Notification badge error:", error);
      setBadge(0);
    }
  );
}


/* =====================================================
   COMMUNITY FEED: START / STOP
===================================================== */

function stopPostsListener() {
  if (typeof unsubscribePosts === "function") unsubscribePosts();
  unsubscribePosts = null;
}

function startCommunityFeed() {
  stopPostsListener();

  lastVisibleDocument = null;
  noMorePostsAvailable = false;
  isLoadingMorePosts = false;
  loadedPostsDocs = [];
  loadedPostIds.clear();
  firstFeedSnapshotHandled = false;
  loadMoreSentinel.textContent = "";

  const cachedPosts = loadFeedCache();
  if (cachedPosts) renderPostsFromCache(cachedPosts);
  else showLoadingMessage();

  loadCommunityPosts();
}

onAuthStateChanged(
  auth,
  (user) => {
    currentUser = user || null;
    startCommunityFeed();
    startNotificationListener();
    startMomentsListener();
    loadCurrentUserProfile();
  },
  (error) => {
    console.error("Authentication listener error:", error);
    currentUser = null;
    currentProfile = {};
    currentUserIsAdmin = false;
    updateAdminReportsLink();
    stopNotificationListener();
    setBadge(0);
    setMyAvatar(DEFAULT_PICTURE);
    startCommunityFeed();
  }
);


/* =====================================================
   COMMUNITY FEED: LOAD + RENDER
===================================================== */

function scheduleCommunityPostsRender() {
  if (renderDebounceTimer) clearTimeout(renderDebounceTimer);
  renderDebounceTimer = window.setTimeout(() => {
    renderDebounceTimer = null;
    renderCommunityPosts();
    updateLoadMoreSentinel();
    scrollToSharedPost();
  }, 250);
}

function renderCommunityPosts() {
  postsContainer.innerHTML = "";

  if (loadedPostsDocs.length === 0) {
    showEmptyMessage();
    return;
  }

  loadedPostsDocs.forEach((postDocument) => {
    try {
      postsContainer.appendChild(
        createPostCard({ id: postDocument.id, ...postDocument.data() })
      );
    } catch (error) {
      console.error("Error creating post card:", error);
    }
  });

  if (postsContainer.children.length === 0) {
    showErrorMessage("Community posts were found, but they could not be displayed.");
    return;
  }

  startVideoAutoPlay();
}

function loadCommunityPosts() {
  try {
    const firstPageQuery = query(
      collection(db, "communityPosts"),
      orderBy("timestamp", "desc"),
      limit(POSTS_PER_PAGE)
    );

    unsubscribePosts = onSnapshot(
      firstPageQuery,

      (snapshot) => {
        if (!firstFeedSnapshotHandled) {
          firstFeedSnapshotHandled = true;

          loadedPostsDocs = snapshot.docs.slice();
          loadedPostIds.clear();
          loadedPostsDocs.forEach((d) => loadedPostIds.add(d.id));

          if (snapshot.docs.length > 0) {
            lastVisibleDocument = snapshot.docs[snapshot.docs.length - 1];
          }
          noMorePostsAvailable = snapshot.docs.length < POSTS_PER_PAGE;

          saveFeedCache(loadedPostsDocs);
          scheduleCommunityPostsRender();
          return;
        }

        const newlyAdded = [];
        snapshot.docChanges().forEach((change) => {
          if (change.type !== "added") return;
          if (loadedPostIds.has(change.doc.id)) return;
          loadedPostIds.add(change.doc.id);
          newlyAdded.push(change.doc);
        });

        if (newlyAdded.length === 0) return;

        newlyAdded.sort((a, b) =>
          (b.data()?.timestamp?.seconds || 0) - (a.data()?.timestamp?.seconds || 0)
        );

        loadedPostsDocs = newlyAdded.concat(loadedPostsDocs);
        saveFeedCache(loadedPostsDocs);

        newlyAdded.slice().reverse().forEach((postDoc) => {
          try {
            postsContainer.insertBefore(
              createPostCard({ id: postDoc.id, ...postDoc.data() }),
              postsContainer.firstChild
            );
          } catch (error) {
            console.error("Error inserting new post card:", error);
          }
        });

        startVideoAutoPlay();
      },

      (error) => {
        console.error("Error loading community posts:", error);
        const messages = {
          "permission-denied": "Firebase permission denied access to community posts.",
          "failed-precondition": "Firebase requires an index before community posts can be displayed.",
          "unavailable": "The Community Wall is temporarily unavailable. Check your internet connection and try again."
        };
        showErrorMessage(
          messages[error.code] || "Community posts could not be loaded. Please try again."
        );
      }
    );
  } catch (error) {
    console.error("Community feed setup error:", error);
    showErrorMessage("The Community Wall could not be started.");
  }
}

async function loadMoreCommunityPosts() {
  if (isLoadingMorePosts || noMorePostsAvailable || !lastVisibleDocument) return;

  isLoadingMorePosts = true;
  loadMoreSentinel.textContent = "Loading more posts...";

  try {
    const nextPageQuery = query(
      collection(db, "communityPosts"),
      orderBy("timestamp", "desc"),
      startAfter(lastVisibleDocument),
      limit(POSTS_PER_PAGE)
    );

    const snapshot = await getDocs(nextPageQuery);

    if (snapshot.empty) {
      noMorePostsAvailable = true;
      return;
    }

    const olderDocs = snapshot.docs.filter((d) => !loadedPostIds.has(d.id));
    olderDocs.forEach((d) => loadedPostIds.add(d.id));
    loadedPostsDocs = loadedPostsDocs.concat(olderDocs);

    olderDocs.forEach((postDoc) => {
      try {
        postsContainer.appendChild(
          createPostCard({ id: postDoc.id, ...postDoc.data() })
        );
      } catch (error) {
        console.error("Error appending older post card:", error);
      }
    });

    startVideoAutoPlay();

    lastVisibleDocument = snapshot.docs[snapshot.docs.length - 1];
    if (snapshot.docs.length < POSTS_PER_PAGE) noMorePostsAvailable = true;

  } catch (error) {
    console.error("Error loading more community posts:", error);
    loadMoreSentinel.textContent = "Could not load more posts. Scroll to try again.";
    isLoadingMorePosts = false;
    return;
  } finally {
    isLoadingMorePosts = false;
  }

  updateLoadMoreSentinel();
}

function updateLoadMoreSentinel() {
  if (noMorePostsAvailable && postsContainer.children.length === 0) {
    loadMoreSentinel.textContent = "Be the first to share something with the community 🙏";
  } else {
    loadMoreSentinel.textContent = "";
  }
}

postsLoadObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) loadMoreCommunityPosts();
    });
  },
  { rootMargin: "300px" }
);
postsLoadObserver.observe(loadMoreSentinel);


/* =====================================================
   POST CARD
===================================================== */

function makeEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function makeButton(className, html, dataset = {}) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.innerHTML = html;
  Object.entries(dataset).forEach(([k, v]) => { button.dataset[k] = v; });
  return button;
}

function createPostCard(postData) {
  const postCard = makeEl("article", "postCard");
  postCard.id = `post-${postData.id}`;
  postCard.dataset.postId = postData.id;

  const authorId = getFirstValue(postData.userId, postData.authorId, postData.uid);
  const authorName = getFirstValue(
    postData.name, postData.fullName, postData.displayName, "Community Member"
  );
  const authorPicture = getFirstValue(
    postData.picture, postData.profilePicture, postData.photoURL,
    postData.photoUrl, DEFAULT_PICTURE
  );
  const authorCountry = getFirstValue(postData.country);
  const postDate = formatPostDate(postData.timestamp);
  const postMessage = getFirstValue(
    postData.post, postData.message, postData.content,
    postData.text, postData.description
  );
  const postCategory = getFirstValue(
    postData.category, postData.postCategory, postData.type, "General"
  );
  const mediaType = getFirstValue(postData.mediaType).toLowerCase();

  /* ----- media urls ----- */
  let imageUrl = "";
  let videoUrl = "";

  if (mediaType === "image") {
    imageUrl = getFirstValue(
      postData.imageUrl, postData.imageURL, postData.photoUrl,
      postData.photoURL, postData.postImage, postData.image, postData.mediaUrl
    );
  } else if (mediaType === "video") {
    videoUrl = getFirstValue(
      postData.videoUrl, postData.videoURL, postData.postVideo,
      postData.video, postData.mediaUrl
    );
  } else {
    imageUrl = getFirstValue(
      postData.imageUrl, postData.imageURL, postData.photoUrl,
      postData.photoURL, postData.postImage, postData.image
    );
    videoUrl = getFirstValue(
      postData.videoUrl, postData.videoURL, postData.postVideo, postData.video
    );
  }

  let imageUrls = Array.isArray(postData.imageUrls)
    ? postData.imageUrls.filter((u) => typeof u === "string" && u.trim() !== "")
    : [];
  if (imageUrls.length === 0 && imageUrl) imageUrls = [imageUrl];

  const likes = Array.isArray(postData.likes) ? postData.likes : [];
  const userHasLiked = Boolean(currentUser && likes.includes(currentUser.uid));

  /* ----- header ----- */
  const postHeader = makeEl("div", "postHeader");

  const profileImage = makeEl("img", "authorPicture");
  profileImage.src = authorPicture;
  profileImage.loading = "lazy";
  profileImage.alt = `${authorName}'s profile picture`;
  protectProfilePicture(profileImage);

  const authorInformation = makeEl("div", "authorInformation");
  const authorNameRow = makeEl("div", "authorNameRow");
  const authorNameElement = makeEl("div", "authorName", authorName);
  const verifiedBadge = makeEl("span", "verifiedBadge");

  if (postData.verified === true) {
    const accountType = getFirstValue(
      postData.accountType, postData.userType, postData.profileType, "member"
    ).toLowerCase();
    verifiedBadge.classList.add("show");
    if (accountType === "ministry") {
      verifiedBadge.classList.add("ministry");
      verifiedBadge.textContent = "✔ Ministry";
    } else {
      verifiedBadge.textContent = "✔ Verified";
    }
  }

  authorNameRow.append(authorNameElement, verifiedBadge);

  const postDetails = makeEl(
    "div", "postDetails",
    authorCountry ? `${authorCountry} • ${postDate}` : postDate
  );

  authorInformation.append(authorNameRow, postDetails);
  postHeader.append(profileImage, authorInformation);
  postCard.appendChild(postHeader);

  /* ----- category ----- */
  if (postCategory) {
    postCard.appendChild(makeEl("div", "postCategory", postCategory));
  }

  /* ----- message ----- */
  if (postMessage) {
    const messageElement = makeEl("div", "postMessage", postMessage);
    postCard.appendChild(messageElement);

    if (postMessage.length > READ_MORE_LIMIT) {
      messageElement.classList.add("truncated");
      const readMore = makeButton("readMoreToggle", "Read more");
      readMore.addEventListener("click", () => {
        const stillTruncated = messageElement.classList.toggle("truncated");
        readMore.textContent = stillTruncated ? "Read more" : "Read less";
      });
      postCard.appendChild(readMore);
    }
  }

  /* ----- media ----- */
  const mediaContainer = makeEl("div", "postMediaContainer");

  if (imageUrls.length > 0) {
    const visible = imageUrls.slice(0, MAX_GRID_PHOTOS);
    const remaining = imageUrls.length - visible.length;

    const photoGrid = makeEl(
      "div", `postPhotoGrid count-${Math.min(imageUrls.length, MAX_GRID_PHOTOS)}`
    );
    photoGrid.dataset.images = JSON.stringify(imageUrls);

    visible.forEach((url, index) => {
      const tile = makeEl("div", "postPhotoTile");
      const img = makeEl("img", "communityPostImage");
      img.src = url;
      img.alt = `Community post photo ${index + 1}`;
      img.loading = "lazy";
      img.dataset.fullImage = url;
      img.dataset.galleryIndex = String(index);
      img.addEventListener("error", () => tile.remove(), { once: true });
      tile.appendChild(img);

      if (index === visible.length - 1 && remaining > 0) {
        tile.appendChild(makeEl("div", "postPhotoMoreOverlay", `+${remaining}`));
      }
      photoGrid.appendChild(tile);
    });

    mediaContainer.appendChild(photoGrid);

  } else if (videoUrl) {
    const wrapper = makeEl("div", "communityPostVideoWrapper");
    const video = makeEl("video", "communityPostVideo");
    video.src = videoUrl;
    video.controls = false;
    video.muted = true;
    video.preload = "metadata";
    video.playsInline = true;
    video.loop = true;
    video.addEventListener("error", () => wrapper.remove(), { once: true });

    const overlay = makeEl("div", "videoExpandOverlay", "▶");
    wrapper.append(video, overlay);
    wrapper.addEventListener("click", () => openVideoReelViewer(videoUrl));
    mediaContainer.appendChild(wrapper);
  }

  if (mediaContainer.children.length > 0) postCard.appendChild(mediaContainer);

  /* ----- main actions ----- */
  const actions = makeEl("div", "postActions");

  const likeButton = makeButton(
    userHasLiked ? "likeButton liked" : "likeButton",
    `❤️ <span>${likes.length}</span>`,
    { postId: postData.id, authorId, likes: JSON.stringify(likes) }
  );

  const commentsCount = Number(postData.commentsCount) || 0;
  const commentButton = makeButton(
    "commentButton",
    commentsCount > 0 ? `💬 <span>${commentsCount}</span>` : "💬 Comment",
    { postId: postData.id }
  );

  const shareButton = makeButton(
    "shareButton", "🔗 Share",
    { postId: postData.id, message: postMessage }
  );

  actions.append(likeButton, commentButton, shareButton);

  if (currentUser && authorId && authorId !== currentUser.uid) {
    actions.appendChild(makeButton(
      "reportButton", "🚩 Report",
      { postId: postData.id, authorId, message: postMessage }
    ));
  }

  postCard.appendChild(actions);

  /* ----- owner / admin actions ----- */
  if (currentUser && authorId === currentUser.uid) {
    const ownerActions = makeEl("div", "postActions ownerActions");
    ownerActions.append(
      makeButton("editButton", "✏️ Edit", { postId: postData.id, message: postMessage }),
      makeButton("deleteButton", "🗑️ Delete", { postId: postData.id })
    );
    postCard.appendChild(ownerActions);

  } else if (currentUserIsAdmin && currentUser) {
    const adminActions = makeEl("div", "postActions ownerActions adminActions");
    adminActions.appendChild(makeButton(
      "deleteButton adminDeleteButton", "🛡️ Remove Post (Admin)",
      { postId: postData.id }
    ));
    postCard.appendChild(adminActions);
  }

  /* ----- profile navigation ----- */
  if (authorId) {
    profileImage.addEventListener("click", () => goToProfile(authorId));
    authorNameElement.addEventListener("click", () => goToProfile(authorId));
  }

  return postCard;
}


/* =====================================================
   POST ACTIONS
===================================================== */

async function createLikeNotification(recipientId, postId) {
  if (!currentUser || !recipientId || !postId) return;
  if (recipientId === currentUser.uid) return;

  const senderName = getFirstValue(
    currentProfile.fullName, currentProfile.name, currentUser.displayName,
    currentUser.email, "A community member"
  );

  try {
    await addDoc(collection(db, "notifications"), {
      recipientId,
      senderId: currentUser.uid,
      senderName,
      type: "like",
      postId,
      targetUrl: `feed.html?post=${encodeURIComponent(postId)}`,
      message: `${senderName} liked your post.`,
      read: false,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error("Error creating like notification:", error);
  }
}

async function handleLikeButton(button) {
  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  const postId = button.dataset.postId;
  const postAuthorId = button.dataset.authorId || "";
  if (!postId) return;

  let likes = [];
  try {
    const saved = JSON.parse(button.dataset.likes || "[]");
    likes = Array.isArray(saved) ? saved : [];
  } catch (error) {
    console.error("Could not read post likes:", error);
  }

  const uid = currentUser.uid;
  const alreadyLiked = likes.includes(uid);
  const updatedLikes = alreadyLiked
    ? likes.filter((id) => id !== uid)
    : [...likes, uid];

  button.disabled = true;

  try {
    await updateDoc(doc(db, "communityPosts", postId), { likes: updatedLikes });

    button.dataset.likes = JSON.stringify(updatedLikes);
    button.classList.toggle("liked", !alreadyLiked);

    const count = button.querySelector("span");
    if (count) count.textContent = updatedLikes.length;

    if (!alreadyLiked) await createLikeNotification(postAuthorId, postId);

  } catch (error) {
    console.error("Error updating likes:", error);
    alert("The like could not be updated.");
  } finally {
    button.disabled = false;
  }
}

function handleCommentButton(button) {
  const postId = button.dataset.postId;
  if (!postId) return;
  window.location.href = `comments.html?postId=${encodeURIComponent(postId)}`;
}

async function handleShareButton(button) {
  const postId = button.dataset.postId;
  if (!postId) return;

  const postMessage = button.dataset.message || "";
  const postUrl =
    `${window.location.origin}${window.location.pathname}?post=${encodeURIComponent(postId)}`;
  const shareText = postMessage
    ? `${postMessage}\n\nSABASABA Gospel Ministry`
    : "See this post on SABASABA Gospel Ministry.";

  try {
    if (navigator.share) {
      await navigator.share({
        title: "SABASABA Gospel Ministry",
        text: shareText,
        url: postUrl
      });
      return;
    }

    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(postUrl);
      alert("Post link copied.");
      return;
    }

    window.prompt("Copy this post link:", postUrl);

  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("Error sharing post:", error);
      alert("The post could not be shared.");
    }
  }
}

async function handleEditButton(button) {
  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  const postId = button.dataset.postId;
  if (!postId) return;

  const newMessage = window.prompt("Edit your post:", button.dataset.message || "");
  if (newMessage === null) return;

  const cleaned = newMessage.trim();
  if (!cleaned) {
    alert("The post cannot be empty.");
    return;
  }

  button.disabled = true;

  try {
    await updateDoc(doc(db, "communityPosts", postId), { post: cleaned });
    button.dataset.message = cleaned;
  } catch (error) {
    console.error("Error editing post:", error);
    alert("The post could not be edited.");
  } finally {
    button.disabled = false;
  }
}

async function handleDeleteButton(button) {
  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  const postId = button.dataset.postId;
  if (!postId) return;

  if (!window.confirm("Are you sure you want to delete this post?")) return;

  button.disabled = true;

  try {
    await deleteDoc(doc(db, "communityPosts", postId));

    loadedPostIds.delete(postId);
    loadedPostsDocs = loadedPostsDocs.filter((d) => d.id !== postId);

    const cardElement = $(`post-${postId}`);
    if (cardElement) cardElement.remove();

    if (postsContainer.children.length === 0) showEmptyMessage();

  } catch (error) {
    console.error("Error deleting post:", error);
    alert("The post could not be deleted.");
    button.disabled = false;
  }
}


/* =====================================================
   REPORT MODAL
===================================================== */

let reportTargetPostId = null;
let reportTargetAuthorId = null;
let reportTargetMessage = "";
let selectedReportReason = null;

function openReportModal(postId, authorId, message) {
  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  reportTargetPostId = postId;
  reportTargetAuthorId = authorId || "";
  reportTargetMessage = message || "";
  selectedReportReason = null;

  if (reportReasonList) {
    reportReasonList
      .querySelectorAll(".reportReasonOption")
      .forEach((b) => b.classList.remove("selected"));
  }

  if (reportSubmitButton) {
    reportSubmitButton.disabled = true;
    reportSubmitButton.textContent = "Submit report";
  }

  if (reportModal) {
    reportModal.classList.add("open");
    reportModal.setAttribute("aria-hidden", "false");
  }
  lockScroll(true);
}

function closeReportModal() {
  if (reportModal) {
    reportModal.classList.remove("open");
    reportModal.setAttribute("aria-hidden", "true");
  }
  lockScroll(false);

  reportTargetPostId = null;
  reportTargetAuthorId = null;
  reportTargetMessage = "";
  selectedReportReason = null;
}

if (reportReasonList) {
  reportReasonList.addEventListener("click", (event) => {
    const option = event.target.closest(".reportReasonOption");
    if (!option) return;

    reportReasonList
      .querySelectorAll(".reportReasonOption")
      .forEach((b) => b.classList.remove("selected"));

    option.classList.add("selected");
    selectedReportReason = option.dataset.reason || "Other";
    if (reportSubmitButton) reportSubmitButton.disabled = false;
  });
}

if (reportCancelButton) reportCancelButton.addEventListener("click", closeReportModal);

if (reportModal) {
  reportModal.addEventListener("click", (event) => {
    if (event.target === reportModal) closeReportModal();
  });
}

if (reportSubmitButton) {
  reportSubmitButton.addEventListener("click", async () => {
    if (!currentUser || !reportTargetPostId || !selectedReportReason) return;

    reportSubmitButton.disabled = true;
    reportSubmitButton.textContent = "Submitting...";

    const reporterName = getFirstValue(
      currentProfile.fullName, currentProfile.name, currentUser.displayName,
      currentUser.email, "A community member"
    );

    try {
      await addDoc(collection(db, "reports"), {
        postId: reportTargetPostId,
        postAuthorId: reportTargetAuthorId,
        postMessageSnapshot: reportTargetMessage.slice(0, 300),
        reporterId: currentUser.uid,
        reporterName,
        reason: selectedReportReason,
        status: "pending",
        timestamp: serverTimestamp()
      });

      alert("Thank you — this post has been reported and will be reviewed.");
      closeReportModal();

    } catch (error) {
      console.error("Error submitting report:", error);
      alert("The report could not be submitted. Please try again.");
      reportSubmitButton.disabled = false;
      reportSubmitButton.textContent = "Submit report";
    }
  });
}


/* =====================================================
   PHOTO VIEWER
===================================================== */

function updatePhotoViewerNavigation() {
  const multiple = currentGalleryImages.length > 1;
  photoViewerPrevButton.classList.toggle("hidden", !multiple);
  photoViewerNextButton.classList.toggle("hidden", !multiple);
  photoViewerCounter.classList.toggle("hidden", !multiple);
  if (multiple) {
    photoViewerCounter.textContent =
      `${currentGalleryIndex + 1} of ${currentGalleryImages.length}`;
  }
}

function showGalleryImageAt(index) {
  const total = currentGalleryImages.length;
  if (total === 0) return;
  currentGalleryIndex = ((index % total) + total) % total;
  photoViewerImage.src = currentGalleryImages[currentGalleryIndex];
  updatePhotoViewerNavigation();
}

function openPhotoViewer(images, startIndex = 0) {
  const gallery = Array.isArray(images)
    ? images.filter((u) => typeof u === "string" && u.trim() !== "")
    : (images ? [images] : []);

  if (gallery.length === 0) return;

  currentGalleryImages = gallery;

  photoViewerVideo.pause();
  photoViewerVideo.removeAttribute("src");
  photoViewerVideo.load();
  photoViewerVideo.style.display = "none";
  photoViewerImage.style.display = "block";

  showGalleryImageAt(startIndex);

  photoViewer.classList.add("open");
  photoViewer.setAttribute("aria-hidden", "false");
  lockScroll(true);
  closePhotoViewerButton.focus();
}

function hidePhotoViewer() {
  photoViewer.classList.remove("open");
  photoViewer.setAttribute("aria-hidden", "true");

  photoViewerImage.src = "";
  currentGalleryImages = [];
  currentGalleryIndex = 0;

  photoViewerVideo.pause();
  photoViewerVideo.removeAttribute("src");
  photoViewerVideo.load();

  lockScroll(false);
}

photoViewerPrevButton.addEventListener("click", (event) => {
  event.stopPropagation();
  showGalleryImageAt(currentGalleryIndex - 1);
});

photoViewerNextButton.addEventListener("click", (event) => {
  event.stopPropagation();
  showGalleryImageAt(currentGalleryIndex + 1);
});

closePhotoViewerButton.addEventListener("click", hidePhotoViewer);

photoViewer.addEventListener("click", (event) => {
  if (event.target === photoViewer) hidePhotoViewer();
});


/* =====================================================
   REELS-STYLE VIDEO VIEWER
===================================================== */

function collectFeedVideoUrls() {
  const urls = [];
  document.querySelectorAll(".communityPostVideoWrapper video").forEach((v) => {
    if (v.src && !urls.includes(v.src)) urls.push(v.src);
  });
  return urls;
}

function openVideoReelViewer(startingVideoUrl) {
  const videoUrls = collectFeedVideoUrls();
  if (videoUrls.length === 0) return;

  videoReelTrack.innerHTML = "";

  videoUrls.forEach((url) => {
    const slide = makeEl("div", "videoReelSlide");
    const video = document.createElement("video");
    video.src = url;
    video.controls = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.muted = false;
    slide.appendChild(video);
    videoReelTrack.appendChild(slide);
  });

  videoReelViewer.classList.add("open");
  videoReelViewer.setAttribute("aria-hidden", "false");
  lockScroll(true);

  const startIndex = Math.max(0, videoUrls.indexOf(startingVideoUrl));
  const slides = videoReelTrack.querySelectorAll(".videoReelSlide");
  if (slides[startIndex]) slides[startIndex].scrollIntoView({ behavior: "auto" });

  startReelAutoplayObserver();
}

function startReelAutoplayObserver() {
  if (reelScrollObserver) reelScrollObserver.disconnect();

  const allVideos = videoReelTrack.querySelectorAll("video");

  reelScrollObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;

        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          allVideos.forEach((other) => { if (other !== video) other.pause(); });
          const p = video.play();
          if (p !== undefined) p.catch(() => {});
        } else {
          video.pause();
        }
      });
    },
    { threshold: [0, 0.6, 1] }
  );

  allVideos.forEach((v) => reelScrollObserver.observe(v));
}

function closeVideoReelViewer() {
  if (reelScrollObserver) {
    reelScrollObserver.disconnect();
    reelScrollObserver = null;
  }

  videoReelTrack.querySelectorAll("video").forEach((v) => v.pause());

  videoReelViewer.classList.remove("open");
  videoReelViewer.setAttribute("aria-hidden", "true");
  videoReelTrack.innerHTML = "";
  lockScroll(false);
}

closeVideoReelViewerButton.addEventListener("click", closeVideoReelViewer);


/* =====================================================
   CLICK HANDLING FOR POSTS
===================================================== */

postsContainer.addEventListener("click", (event) => {
  const target = event.target;

  const like = target.closest(".likeButton");
  if (like) return handleLikeButton(like);

  const comment = target.closest(".commentButton");
  if (comment) return handleCommentButton(comment);

  const share = target.closest(".shareButton");
  if (share) return handleShareButton(share);

  const edit = target.closest(".editButton");
  if (edit) return handleEditButton(edit);

  const del = target.closest(".deleteButton");
  if (del) return handleDeleteButton(del);

  const report = target.closest(".reportButton");
  if (report) {
    return openReportModal(
      report.dataset.postId,
      report.dataset.authorId,
      report.dataset.message
    );
  }

  const image = target.closest(".communityPostImage");
  if (image) {
    const grid = image.closest(".postPhotoGrid");
    let gallery = [];

    try {
      gallery = grid ? JSON.parse(grid.dataset.images || "[]") : [];
    } catch (error) {
      gallery = [];
    }

    if (!Array.isArray(gallery) || gallery.length === 0) {
      gallery = [image.dataset.fullImage || image.src];
    }

    openPhotoViewer(gallery, Number(image.dataset.galleryIndex) || 0);
  }
});


/* =====================================================
   KEYBOARD
===================================================== */

document.addEventListener("keydown", (event) => {
  if (photoViewer.classList.contains("open")) {
    if (event.key === "ArrowLeft") return showGalleryImageAt(currentGalleryIndex - 1);
    if (event.key === "ArrowRight") return showGalleryImageAt(currentGalleryIndex + 1);
  }

  if (event.key !== "Escape") return;

  if (photoViewer.classList.contains("open")) hidePhotoViewer();
  if (videoReelViewer.classList.contains("open")) closeVideoReelViewer();
  if (reportModal && reportModal.classList.contains("open")) closeReportModal();
});


/* =====================================================
   REFRESH BUTTON
===================================================== */

if (refreshButton) {
  refreshButton.addEventListener("click", () => {
    refreshButton.disabled = true;
    refreshButton.textContent = "⏳";
    startCommunityFeed();
    window.setTimeout(() => {
      refreshButton.disabled = false;
      refreshButton.textContent = "🔄";
    }, 1000);
  });
}


/* =====================================================
   SCROLL TO SHARED POST (?post=...)
===================================================== */

async function scrollToSharedPost() {
  const sharedPostId = new URLSearchParams(window.location.search).get("post");
  if (!sharedPostId) return;

  let sharedPost = $(`post-${sharedPostId}`);

  if (!sharedPost) {
    try {
      const snapshot = await getDoc(doc(db, "communityPosts", sharedPostId));
      if (snapshot.exists()) {
        sharedPost = createPostCard({ id: snapshot.id, ...snapshot.data() });
        postsContainer.insertBefore(sharedPost, postsContainer.firstChild);
      }
    } catch (error) {
      console.error("Error loading shared post:", error);
    }
  }

  if (!sharedPost) return;

  window.setTimeout(() => {
    sharedPost.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 150);
}


/* =====================================================
   VIDEO AUTOPLAY IN THE FEED
===================================================== */

function startVideoAutoPlay() {
  if (videoObserver) videoObserver.disconnect();

  const videos = document.querySelectorAll(".communityPostVideo");
  if (!videos.length) return;

  videoObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;

        if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
          videos.forEach((other) => { if (other !== video) other.pause(); });
          video.muted = true;
          const p = video.play();
          if (p !== undefined) {
            p.catch((error) => console.log("Video autoplay was blocked:", error));
          }
        } else {
          video.pause();
        }
      });
    },
    { threshold: [0, 0.25, 0.5, 0.7, 1] }
  );

  videos.forEach((video) => {
    video.muted = true;
    video.playsInline = true;
    videoObserver.observe(video);
  });
}


/* =====================================================
   FAITH MOMENTS STRIP
   Every moment gets its own card. Newest first.
===================================================== */

const MOMENT_TYPE_ICONS = {
  encouragement: "🕊️",
  scripture: "📖",
  testimony: "✨",
  verse: "📖",
  prayer: "🙏",
  photo: "🖼️",
  video: "🎥"
};

function momentTypeIcon(type) {
  return MOMENT_TYPE_ICONS[String(type || "").toLowerCase()] || "✨";
}

function momentInitials(name) {
  const words = String(name || "Faith Member").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "F";
  return words.slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join("");
}

function isVideoUrl(url) {
  const clean = String(url || "").split("?")[0].split("#")[0].toLowerCase();
  return /\.(mp4|webm|mov|m4v|3gp|mkv|ogv)$/.test(clean);
}

function isMomentActive(momentData) {
  /* Prefer the explicit expiry saved by the create page. */
  const expires = toDate(momentData.expiresAt);
  if (expires) return expires.getTime() > Date.now();

  const created = toDate(momentData.timestamp || momentData.createdAt);
  if (!created) return true;
  return created.getTime() + MOMENT_LIFETIME_MS > Date.now();
}

function getMomentMedia(momentData) {
  const mediaType = String(
    momentData.mediaType || momentData.type || ""
  ).toLowerCase();

  const explicitVideo = getFirstValue(
    momentData.videoUrl, momentData.videoURL, momentData.video
  );

  const imageCandidate = getFirstValue(
    momentData.thumbnailUrl, momentData.thumbnailURL, momentData.videoThumbnail,
    momentData.imageUrl, momentData.imageURL, momentData.photoUrl,
    momentData.photoURL, momentData.mediaUrl, momentData.contentUrl
  );

  let videoUrl = explicitVideo;

  /* The video link may be saved under any field name, so look
     through every text value for a link that points to a video. */
  if (!videoUrl) {
    for (const value of Object.values(momentData)) {
      if (
        typeof value === "string" &&
        /^https?:\/\//i.test(value) &&
        (isVideoUrl(value) || value.indexOf("/video/upload/") !== -1)
      ) {
        videoUrl = value;
        break;
      }
    }
  }

  if (!videoUrl && mediaType === "video") {
    videoUrl = getFirstValue(
      momentData.mediaUrl, momentData.contentUrl, momentData.fileUrl
    );
  }

  if (!videoUrl && imageCandidate && isVideoUrl(imageCandidate)) {
    videoUrl = imageCandidate;
  }

  const imageUrl =
    imageCandidate && !isVideoUrl(imageCandidate) && imageCandidate !== videoUrl
      ? imageCandidate
      : "";

  return { imageUrl, videoUrl };
}

function buildMomentCard(momentData) {
  const name = getFirstValue(
    momentData.authorName, momentData.name, momentData.fullName,
    momentData.displayName, "Faith Connect Member"
  );

  const profilePicture = getFirstValue(
    momentData.authorPicture, momentData.profilePicture,
    momentData.picture, momentData.photoURL
  );

  const { imageUrl, videoUrl } = getMomentMedia(momentData);
  const icon = momentTypeIcon(momentData.momentType || momentData.type);

  const card = document.createElement("a");
  card.href = `faith-moments.html?moment=${encodeURIComponent(momentData.id)}`;
  card.className = "momentCard memberMomentCard";

  if (imageUrl) card.style.backgroundImage = `url("${imageUrl}")`;
  else card.classList.add("momentCardFallback");

  const safeName = escapeHtml(name);

  card.innerHTML = `
    <div class="momentCardGradient"></div>
    ${(!imageUrl && !videoUrl)
      ? `<div class="momentCardFallbackIcon">${icon}</div>`
      : ""}
    <div class="momentCardAvatar">
      ${profilePicture
        ? `<img src="${escapeHtml(profilePicture)}" alt="${safeName}">`
        : `<span class="momentCardAvatarInitials">${escapeHtml(momentInitials(name))}</span>`}
    </div>
    <div class="momentCardName">${safeName}</div>
  `;

  const avatarImg = card.querySelector(".momentCardAvatar img");
  if (avatarImg) protectProfilePicture(avatarImg);

  if (videoUrl) attachMomentVideo(card, videoUrl, icon);

  return card;
}

function attachMomentVideo(card, videoUrl, icon) {
  const frame = document.createElement("video");
  frame.muted = true;
  frame.defaultMuted = true;
  frame.loop = true;
  frame.autoplay = true;
  frame.playsInline = true;
  frame.preload = "auto";
  frame.disablePictureInPicture = true;
  frame.setAttribute("muted", "");
  frame.setAttribute("playsinline", "");
  frame.setAttribute("webkit-playsinline", "");
  frame.setAttribute("loop", "");
  frame.style.cssText =
    "position:absolute;top:0;left:0;width:100%;height:100%;" +
    "object-fit:cover;pointer-events:none;border-radius:inherit;";
  frame.src = videoUrl.split("#")[0];

  frame.addEventListener("error", () => {
    frame.remove();
    if (!card.querySelector(".momentCardFallbackIcon")) {
      card.classList.add("momentCardFallback");
      card.appendChild(makeEl("div", "momentCardFallbackIcon", icon));
    }
  });

  card.style.position = "relative";
  card.style.overflow = "hidden";
  card.insertBefore(frame, card.firstChild);

  const playQuietly = () => {
    const p = frame.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  };

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) playQuietly();
          else frame.pause();
        });
      },
      { threshold: 0.4 }
    ).observe(card);
  } else {
    frame.addEventListener("loadeddata", playQuietly);
  }
}

function renderMomentsStrip(snapshot) {
  if (!momentsRow) return;

  momentsRow.querySelectorAll(".memberMomentCard").forEach((el) => el.remove());

  const fragment = document.createDocumentFragment();

  snapshot.forEach((momentDoc) => {
    const momentData = momentDoc.data();

    if (!isMomentActive(momentData)) return;

    const ownerId = momentData.userId || momentData.authorId || momentData.uid || "";
    if (!ownerId) return;

    const privacy = String(momentData.privacy || "everyone").toLowerCase();
    const isOwn = Boolean(currentUser && ownerId === currentUser.uid);
    if (privacy !== "everyone" && !isOwn) return;

    fragment.appendChild(buildMomentCard({ id: momentDoc.id, ...momentData }));
  });

  momentsRow.appendChild(fragment);
}

function stopMomentsListener() {
  if (typeof unsubscribeMoments === "function") unsubscribeMoments();
  unsubscribeMoments = null;
}

function startMomentsListener() {
  stopMomentsListener();

  const momentsQuery = query(
    collection(db, "faithMoments"),
    orderBy("timestamp", "desc"),
    limit(MOMENTS_LIMIT)
  );

  unsubscribeMoments = onSnapshot(
    momentsQuery,
    (snapshot) => renderMomentsStrip(snapshot),
    (error) => console.error("Faith Moments strip error:", error)
  );
}


/* =====================================================
   CLEANUP + READY
===================================================== */

window.addEventListener("beforeunload", () => {
  stopPostsListener();
  stopNotificationListener();
  stopMomentsListener();
  if (postsLoadObserver) postsLoadObserver.disconnect();
  if (renderDebounceTimer) clearTimeout(renderDebounceTimer);
});

console.log("Faith Connect Community Wall is ready.");
