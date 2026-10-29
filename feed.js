/* =====================================================
   FEED.JS - SABASABA GOSPEL MINISTRY COMMUNITY FEED
   Real-Time Firestore Integration, Video Thumbnails,
   Robust Avatar Fallbacks, Likes & Infinite Scroll
===================================================== */

import {
  auth,
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  onAuthStateChanged
} from "./firebase.js";

import {
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


/* =====================================================
   GLOBAL STATE VARIABLES
===================================================== */

let currentUser = null;
let currentUserProfile = {};
let lastVisiblePostDoc = null;
let isLoadingPosts = false;
let hasMorePosts = true;
const POSTS_PER_PAGE = 10;
let reportingPostId = null;
let selectedReportReason = "";

let currentPhotoUrls = [];
let currentPhotoIndex = 0;


/* =====================================================
   DOM ELEMENTS
===================================================== */

const postsContainer = document.getElementById("postsContainer");
const momentsRow = document.getElementById("momentsRow");
const quickMomentAvatar = document.getElementById("quickMomentAvatar");
const notificationBadge = document.getElementById("notificationBadge");
const loadMoreSentinel = document.getElementById("loadMoreSentinel");

const photoViewer = document.getElementById("photoViewer");
const photoViewerImage = document.getElementById("photoViewerImage");
const photoViewerVideo = document.getElementById("photoViewerVideo");
const closePhotoViewer = document.getElementById("closePhotoViewer");
const photoViewerPrevButton = document.getElementById("photoViewerPrevButton");
const photoViewerNextButton = document.getElementById("photoViewerNextButton");
const photoViewerCounter = document.getElementById("photoViewerCounter");

const videoReelViewer = document.getElementById("videoReelViewer");
const videoReelTrack = document.getElementById("videoReelTrack");
const closeVideoReelViewer = document.getElementById("closeVideoReelViewer");

const reportModal = document.getElementById("reportModal");
const reportReasonList = document.getElementById("reportReasonList");
const reportCancelButton = document.getElementById("reportCancelButton");
const reportSubmitButton = document.getElementById("reportSubmitButton");


/* =====================================================
   INITIALIZATION & AUTH OBSERVER
===================================================== */

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace("login.html");
    return;
  }

  currentUser = user;
  await loadUserProfile();
  listenToNotifications();
  listenToMoments();
  loadInitialPosts();
  setupInfiniteScroll();
});


/* =====================================================
   USER PROFILE & NOTIFICATIONS
===================================================== */

async function loadUserProfile() {
  if (!currentUser) return;
  try {
    const userDocRef = doc(db, "users", currentUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      currentUserProfile = userDocSnap.data();
      const avatarUrl = currentUserProfile.profilePicture || currentUserProfile.photoURL || currentUser.photoURL || "";

      if (quickMomentAvatar) {
        if (avatarUrl) {
          quickMomentAvatar.style.backgroundImage = `url('${avatarUrl}')`;
        }
      }
    }
  } catch (error) {
    console.error("Error loading user profile:", error);
  }
}

function listenToNotifications() {
  if (!currentUser || !notificationBadge) return;

  const notificationsQuery = query(
    collection(db, "notifications"),
    orderBy("timestamp", "desc"),
    limit(20)
  );

  onSnapshot(notificationsQuery, (snapshot) => {
    let unreadCount = 0;
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.recipientId === currentUser.uid && !data.read) {
        unreadCount++;
      }
    });

    notificationBadge.textContent = unreadCount;
    notificationBadge.style.display = unreadCount > 0 ? "inline-block" : "none";
  }, (error) => {
    console.error("Notifications listener error:", error);
  });
}


/* =====================================================
   FAITH MOMENTS (STORIES) LISTENER & RENDERER
===================================================== */

function listenToMoments() {
  if (!momentsRow) return;

  const momentsQuery = query(
    collection(db, "faithMoments"),
    orderBy("timestamp", "desc"),
    limit(20)
  );

  onSnapshot(momentsQuery, (snapshot) => {
    const myAvatar = currentUserProfile.profilePicture || currentUserProfile.photoURL || currentUser?.photoURL || "";
    
    let createCardHTML = `
      <a href="create-faith-moment.html" class="momentCard createMomentCard">
        <div id="quickMomentAvatar" class="createMomentCardTop" ${myAvatar ? `style="background-image: url('${myAvatar}')"` : ''}></div>
        <div class="createMomentCardPlusButton">＋</div>
        <div class="createMomentCardBottom">Create Moment</div>
      </a>
    `;

    let momentsHTML = createCardHTML;
    const now = new Date();

    snapshot.forEach((docSnap) => {
      const moment = docSnap.data();
      moment.id = docSnap.id;

      if (moment.expiresAt && moment.expiresAt.toDate() < now) {
        return;
      }

      let bgMediaHTML = "";

      if (moment.mediaUrl) {
        if (moment.mediaType === "video" || moment.mediaUrl.includes(".mp4")) {
          bgMediaHTML = `
            <video class="momentBg" muted playsinline preload="metadata">
              <source src="${moment.mediaUrl}#t=0.5" type="video/mp4">
            </video>
          `;
        } else {
          bgMediaHTML = `
            <img class="momentBg" src="${moment.mediaUrl}" alt="${escapeHTML(moment.authorName || 'Faith Moment')}" loading="lazy">
          `;
        }
      } else {
        bgMediaHTML = `
          <div class="momentFallbackBg">
            <span>🕊️</span>
          </div>
        `;
      }

      const avatarUrl = moment.authorPicture || moment.picture || "";
      const authorName = moment.authorName || moment.name || "Member";

      const avatarMarkup = avatarUrl 
        ? `<img class="momentAvatar" src="${avatarUrl}" alt="${escapeHTML(authorName)}" onerror="this.style.display='none';">`
        : `<div class="momentAvatar" style="background:#e4e6eb;display:flex;align-items:center;justify-content:center;font-size:14px;">👤</div>`;

      momentsHTML += `
        <div class="momentCard" data-moment-id="${moment.id}" data-media-url="${moment.mediaUrl || ''}" data-media-type="${moment.mediaType || 'none'}">
          ${bgMediaHTML}
          ${avatarMarkup}
          <span class="momentName">${escapeHTML(authorName)}</span>
        </div>
      `;
    });

    momentsRow.innerHTML = momentsHTML;
    attachMomentClickEvents();
  }, (error) => {
    console.error("Moments listener error:", error);
  });
}

function attachMomentClickEvents() {
  const cards = momentsRow.querySelectorAll(".momentCard:not(.createMomentCard)");
  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const mediaUrl = card.dataset.mediaUrl;
      const mediaType = card.dataset.mediaType;

      if (!mediaUrl) return;

      if (mediaType === "video" || mediaUrl.includes(".mp4")) {
        openVideoReel(mediaUrl);
      } else {
        openPhotoViewer([mediaUrl], 0);
      }
    });
  });
}


/* =====================================================
   COMMUNITY POSTS - INITIAL LOAD & PAGINATION
===================================================== */

async function loadInitialPosts() {
  isLoadingPosts = true;
  postsContainer.innerHTML = `<div class="statusCard loading">Loading community posts...</div>`;

  try {
    const postsQuery = query(
      collection(db, "communityPosts"),
      orderBy("timestamp", "desc"),
      limit(POSTS_PER_PAGE)
    );

    const snapshot = await getDocs(postsQuery);

    if (snapshot.empty) {
      postsContainer.innerHTML = `<div class="statusCard">No posts shared yet. Be the first to post!</div>`;
      hasMorePosts = false;
      isLoadingPosts = false;
      return;
    }

    lastVisiblePostDoc = snapshot.docs[snapshot.docs.length - 1];
    postsContainer.innerHTML = "";

    snapshot.forEach((docSnap) => {
      const postCard = renderPostCard(docSnap.id, docSnap.data());
      postsContainer.appendChild(postCard);
    });

    if (snapshot.docs.length < POSTS_PER_PAGE) {
      hasMorePosts = false;
    }
  } catch (error) {
    console.error("Error loading initial posts:", error);
    postsContainer.innerHTML = `<div class="statusCard">Unable to load posts right now. Please refresh.</div>`;
  } finally {
    isLoadingPosts = false;
  }
}

async function loadMorePosts() {
  if (isLoadingPosts || !hasMorePosts || !lastVisiblePostDoc) return;

  isLoadingPosts = true;

  try {
    const postsQuery = query(
      collection(db, "communityPosts"),
      orderBy("timestamp", "desc"),
      startAfter(lastVisiblePostDoc),
      limit(POSTS_PER_PAGE)
    );

    const snapshot = await getDocs(postsQuery);

    if (snapshot.empty) {
      hasMorePosts = false;
      isLoadingPosts = false;
      return;
    }

    lastVisiblePostDoc = snapshot.docs[snapshot.docs.length - 1];

    snapshot.forEach((docSnap) => {
      const postCard = renderPostCard(docSnap.id, docSnap.data());
      postsContainer.appendChild(postCard);
    });

    if (snapshot.docs.length < POSTS_PER_PAGE) {
      hasMorePosts = false;
    }
  } catch (error) {
    console.error("Error loading more posts:", error);
  } finally {
    isLoadingPosts = false;
  }
}

function setupInfiniteScroll() {
  if (!loadMoreSentinel) return;

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasMorePosts && !isLoadingPosts) {
        loadMorePosts();
      }
    },
    { rootMargin: "200px" }
  );

  observer.observe(loadMoreSentinel);
}


/* =====================================================
   POST CARD RENDERER (WITH ROBUST AVATAR FALLBACK)
===================================================== */

function renderPostCard(postId, postData) {
  const card = document.createElement("article");
  card.className = "postCard";
  card.id = `post-${postId}`;

  const likesArray = Array.isArray(postData.likes) ? postData.likes : [];
  const isLiked = currentUser ? likesArray.includes(currentUser.uid) : false;
  const likeCount = likesArray.length;
  const commentCount = postData.commentCount || 0;

  const authorName = postData.fullName || postData.name || "Community Member";
  const avatarUrl = postData.profilePicture || postData.picture || "";
  const formattedDate = formatDate(postData.timestamp);
  const category = postData.category || "General";
  const postText = postData.post || postData.message || "";

  // Robust Avatar Markup (Shows profile photo or falls back to icon silhouette)
  const avatarMarkup = avatarUrl
    ? `<img class="postAvatar" src="${avatarUrl}" alt="${escapeHTML(authorName)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
       <div class="postAvatarFallback" style="display:none;">👤</div>`
    : `<div class="postAvatarFallback">👤</div>`;

  let mediaHTML = "";
  const imageUrls = postData.imageUrls || (postData.imageUrl ? [postData.imageUrl] : []);
  const videoUrl = postData.videoUrl || (postData.mediaType === "video" ? postData.mediaUrl : "");

  if (videoUrl) {
    mediaHTML = `
      <div class="postMediaContainer">
        <video controls playsinline preload="metadata">
          <source src="${videoUrl}" type="video/mp4">
        </video>
      </div>
    `;
  } else if (imageUrls.length > 0) {
    mediaHTML = `
      <div class="postMediaContainer mediaGrid grid-${Math.min(imageUrls.length, 4)}">
        ${imageUrls.map((url, idx) => `
          <img src="${url}" alt="Post image ${idx + 1}" loading="lazy" data-idx="${idx}">
        `).join("")}
      </div>
    `;
  }

  card.innerHTML = `
    <div class="postHeader">
      <div class="postAuthorArea">
        ${avatarMarkup}
        <div class="postAuthorMeta">
          <div class="postAuthorName">${escapeHTML(authorName)}</div>
          <div class="postCategoryDate">${escapeHTML(category)} • ${formattedDate}</div>
        </div>
      </div>
      <button class="topIconLink reportTrigger" aria-label="Report post" title="Report">🚩</button>
    </div>

    ${postText ? `<div class="postText">${escapeHTML(postText)}</div>` : ""}

    ${mediaHTML}

    <div class="postActionRow">
      <button class="postActionButton likeButton ${isLiked ? 'liked' : ''}">
        <span>${isLiked ? '❤️' : '🤍'}</span>
        <span class="likeCountText">${likeCount > 0 ? likeCount : ''} Like${likeCount === 1 ? '' : 's'}</span>
      </button>
      <a href="comments.html?postId=${postId}" class="postActionButton">
        <span>💬</span>
        <span>${commentCount > 0 ? commentCount : ''} Comment${commentCount === 1 ? '' : 's'}</span>
      </a>
      <button class="postActionButton shareButton">
        <span>↪️</span>
        <span>Share</span>
      </button>
    </div>
  `;

  const likeBtn = card.querySelector(".likeButton");
  likeBtn.addEventListener("click", () => handleToggleLike(postId, likeBtn));

  const shareBtn = card.querySelector(".shareButton");
  shareBtn.addEventListener("click", () => handleSharePost(postId, postText));

  const reportBtn = card.querySelector(".reportTrigger");
  reportBtn.addEventListener("click", () => openReportModal(postId));

  if (imageUrls.length > 0) {
    const images = card.querySelectorAll(".postMediaContainer img");
    images.forEach((img) => {
      img.addEventListener("click", () => {
        const index = parseInt(img.dataset.idx, 10) || 0;
        openPhotoViewer(imageUrls, index);
      });
    });
  }

  return card;
}


/* =====================================================
   POST ACTIONS (LIKE & SHARE)
===================================================== */

async function handleToggleLike(postId, likeBtn) {
  if (!currentUser) return;

  const postRef = doc(db, "communityPosts", postId);
  const isCurrentlyLiked = likeBtn.classList.contains("liked");
  const countSpan = likeBtn.querySelector(".likeCountText");
  const iconSpan = likeBtn.querySelector("span:first-child");

  let currentLikes = parseInt(countSpan.textContent, 10) || 0;
  if (isCurrentlyLiked) {
    likeBtn.classList.remove("liked");
    iconSpan.textContent = "🤍";
    currentLikes = Math.max(0, currentLikes - 1);
  } else {
    likeBtn.classList.add("liked");
    iconSpan.textContent = "❤️";
    currentLikes += 1;
  }
  countSpan.textContent = `${currentLikes > 0 ? currentLikes : ''} Like${currentLikes === 1 ? '' : 's'}`;

  try {
    await updateDoc(postRef, {
      likes: isCurrentlyLiked
        ? arrayRemove(currentUser.uid)
        : arrayUnion(currentUser.uid)
    });
  } catch (error) {
    console.error("Error toggling like:", error);
    likeBtn.classList.toggle("liked", isCurrentlyLiked);
    iconSpan.textContent = isCurrentlyLiked ? "❤️" : "🤍";
  }
}

async function handleSharePost(postId, postText) {
  const shareUrl = `${window.location.origin}/comments.html?postId=${postId}`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: "Faith Connect Community Post",
        text: postText ? postText.slice(0, 100) : "Check out this post on Faith Connect!",
        url: shareUrl
      });
    } catch (err) {
      if (err.name !== "AbortError") console.error("Share failed:", err);
    }
  } else {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert("Post link copied to clipboard!");
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  }
}


/* =====================================================
   FULLSCREEN PHOTO VIEWER MODAL
===================================================== */

function openPhotoViewer(urls, initialIndex = 0) {
  if (!urls || urls.length === 0) return;

  currentPhotoUrls = urls;
  currentPhotoIndex = initialIndex;

  updatePhotoViewerDisplay();
  photoViewer.classList.add("show");
  photoViewer.setAttribute("aria-hidden", "false");
}

function updatePhotoViewerDisplay() {
  const currentUrl = currentPhotoUrls[currentPhotoIndex];

  photoViewerVideo.style.display = "none";
  photoViewerImage.style.display = "block";
  photoViewerImage.src = currentUrl;

  if (currentPhotoUrls.length > 1) {
    photoViewerCounter.textContent = `${currentPhotoIndex + 1} / ${currentPhotoUrls.length}`;
    photoViewerCounter.classList.remove("hidden");
    photoViewerPrevButton.classList.remove("hidden");
    photoViewerNextButton.classList.remove("hidden");
  } else {
    photoViewerCounter.classList.add("hidden");
    photoViewerPrevButton.classList.add("hidden");
    photoViewerNextButton.classList.add("hidden");
  }
}

function closePhotoViewerModal() {
  photoViewer.classList.remove("show");
  photoViewer.setAttribute("aria-hidden", "true");
  photoViewerImage.src = "";
  photoViewerVideo.pause();
  photoViewerVideo.src = "";
  currentPhotoUrls = [];
  currentPhotoIndex = 0;
}

if (closePhotoViewer) {
  closePhotoViewer.addEventListener("click", closePhotoViewerModal);
}

if (photoViewerPrevButton) {
  photoViewerPrevButton.addEventListener("click", () => {
    if (currentPhotoIndex > 0) {
      currentPhotoIndex--;
      updatePhotoViewerDisplay();
    }
  });
}

if (photoViewerNextButton) {
  photoViewerNextButton.addEventListener("click", () => {
    if (currentPhotoIndex < currentPhotoUrls.length - 1) {
      currentPhotoIndex++;
      updatePhotoViewerDisplay();
    }
  });
}


/* =====================================================
   REELS-STYLE VIDEO VIEWER MODAL
===================================================== */

function openVideoReel(videoUrl) {
  if (!videoUrl || !videoReelViewer || !videoReelTrack) return;

  videoReelTrack.innerHTML = `
    <video controls autoplay playsinline style="max-width:100%;max-height:100vh;object-fit:contain;">
      <source src="${videoUrl}" type="video/mp4">
    </video>
  `;

  videoReelViewer.classList.add("show");
  videoReelViewer.setAttribute("aria-hidden", "false");
}

function closeVideoReel() {
  if (!videoReelViewer || !videoReelTrack) return;

  const vid = videoReelTrack.querySelector("video");
  if (vid) vid.pause();

  videoReelTrack.innerHTML = "";
  videoReelViewer.classList.remove("show");
  videoReelViewer.setAttribute("aria-hidden", "true");
}

if (closeVideoReelViewer) {
  closeVideoReelViewer.addEventListener("click", closeVideoReel);
}


/* =====================================================
   REPORT POST MODAL
===================================================== */

function openReportModal(postId) {
  reportingPostId = postId;
  selectedReportReason = "";

  const options = reportReasonList.querySelectorAll(".reportReasonOption");
  options.forEach((opt) => opt.classList.remove("selected"));

  reportSubmitButton.disabled = true;
  reportModal.classList.add("show");
  reportModal.setAttribute("aria-hidden", "false");
}

function closeReportModal() {
  reportingPostId = null;
  selectedReportReason = "";
  reportModal.classList.remove("show");
  reportModal.setAttribute("aria-hidden", "true");
}

if (reportReasonList) {
  reportReasonList.querySelectorAll(".reportReasonOption").forEach((button) => {
    button.addEventListener("click", () => {
      reportReasonList.querySelectorAll(".reportReasonOption").forEach((btn) => btn.classList.remove("selected"));
      button.classList.add("selected");
      selectedReportReason = button.dataset.reason;
      reportSubmitButton.disabled = false;
    });
  });
}

if (reportCancelButton) {
  reportCancelButton.addEventListener("click", closeReportModal);
}

if (reportSubmitButton) {
  reportSubmitButton.addEventListener("click", async () => {
    if (!reportingPostId || !selectedReportReason || !currentUser) return;

    reportSubmitButton.disabled = true;
    reportSubmitButton.textContent = "Submitting...";

    try {
      await addDoc(collection(db, "reports"), {
        postId: reportingPostId,
        reporterId: currentUser.uid,
        reason: selectedReportReason,
        timestamp: serverTimestamp()
      });

      alert("Thank you. Your report has been submitted for review.");
      closeReportModal();
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("Could not submit report right now. Please try again.");
    } finally {
      reportSubmitButton.textContent = "Submit report";
    }
  });
}


/* =====================================================
   HELPER UTILITIES
===================================================== */

function escapeHTML(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(timestamp) {
  if (!timestamp) return "Just now";

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
