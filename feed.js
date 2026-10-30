/* =====================================================
   COMMUNITY WALL FEED SCRIPT (FIREBASE STORAGE OPTIMIZED)
===================================================== */

import { 
  db, 
  auth, 
  collection, 
  getDocs, 
  doc, 
  deleteDoc, 
  query, 
  orderBy, 
  onAuthStateChanged 
} from "./firebase.js";

const feedContainer = document.getElementById("communityFeed");
let currentAuthUser = null;

// Initialize auth observer
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace("login.html");
    return;
  }
  currentAuthUser = user;
  loadCommunityPosts();
});

async function loadCommunityPosts() {
  if (!feedContainer) return;

  try {
    const q = query(collection(db, "communityPosts"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      feedContainer.innerHTML = `<div class="empty">No posts shared on the Community Wall yet. Be the first!</div>`;
      return;
    }

    let html = "";

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const postId = docSnap.id;

      const createdAt = data.timestamp?.toMillis ? data.timestamp.toMillis() : (data.timestamp?.seconds ? data.timestamp.seconds * 1000 : Date.now());
      const name = data.name || data.fullName || "Community Member";
      const avatar = data.picture || data.profilePicture || "https://via.placeholder.com/40";
      const timeAgo = timeSince(createdAt);
      const category = data.category || "Encouragement";
      const message = data.post || data.message || "";

      let mediaHTML = "";
      let mediaUrl = data.videoUrl || data.imageUrl || data.mediaUrl || "";

      // Strictly bypass any legacy ImageKit URLs
      if (mediaUrl.includes("imagekit.io")) {
        mediaUrl = "";
      }

      if (mediaUrl) {
        if (data.mediaType === "video" || mediaUrl.match(/\.(mp4|mov|webm|m4v)/i)) {
          mediaHTML = `
            <div class="media-box" style="width:100%; background:#000; border-radius:6px; overflow:hidden; margin-top:8px;">
              <video src="${mediaUrl}" controls preload="metadata" playsinline crossorigin="anonymous" style="width:100%; max-height:450px; display:block;"></video>
              <a href="${mediaUrl}" target="_blank" style="display:block; padding:10px; background:#000; color:#ffeb3b; text-align:center; font-size:13px; text-decoration:none; border-top:1px solid #333;">⚠️ Having trouble playing? Tap to open video directly.</a>
            </div>
          `;
        } else {
          mediaHTML = `
            <div class="media-box" style="width:100%; background:#000; border-radius:6px; overflow:hidden; margin-top:8px;">
              <img src="${mediaUrl}" alt="Post media" style="width:100%; max-height:450px; object-fit:contain; display:block;">
            </div>
          `;
        }
      }

      // Check if current user is owner of the post
      const isOwner = currentAuthUser && (data.userId === currentAuthUser.uid || data.authorId === currentAuthUser.uid || data.uid === currentAuthUser.uid);
      const deleteButtonHTML = isOwner ? `<button class="delete-btn" onclick="window.deleteCommunityPost('${postId}')" style="background:#fdecec; color:#b00020; border:none; padding:4px 8px; border-radius:4px; font-size:12px; font-weight:bold; cursor:pointer;">Delete</button>` : "";

      html += `
        <div class="post-card" id="post-${postId}" style="background:#fff; border-radius:8px; border:1px solid #e4e6eb; margin-bottom:12px; padding:12px;">
          <div class="post-header" style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
            <img src="${avatar}" class="author-avatar" alt="Avatar" style="width:40px; height:40px; border-radius:50%; object-fit:cover; background:#ddd;">
            <div>
              <div class="author-name" style="font-weight:bold; font-size:14px;">${escapeHTML(name)}</div>
              <div class="post-time" style="font-size:11px; color:#65676b;">${timeAgo}</div>
            </div>
          </div>
          <div class="category-badge" style="display:inline-block; background:#e7f3ff; color:#1877f2; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:bold; margin-bottom:8px;">${escapeHTML(category)}</div>
          <div class="post-message" style="font-size:14px; line-height:1.4; margin-bottom:10px; white-space:pre-wrap; word-break:break-word;">${escapeHTML(message)}</div>
          ${mediaHTML}
          <div class="post-footer" style="display:flex; justify-content:space-between; align-items:center; margin-top:12px; padding-top:8px; border-top:1px solid #e4e6eb; font-size:13px; color:#65676b;">
            <span>❤️ ${data.likes?.length || 0} Likes</span>
            ${deleteButtonHTML}
          </div>
        </div>
      `;
    });

    feedContainer.innerHTML = html;

  } catch (err) {
    console.error("Error loading feed:", err);
    feedContainer.innerHTML = `<div class="empty" style="color:red;">Failed to load posts. Please refresh.</div>`;
  }
}

// Global delete handler attached to window so inline onclick attributes can access it
window.deleteCommunityPost = async function(postId) {
  if (!window.confirm("Are you sure you want to delete this post?")) return;
  try {
    await deleteDoc(doc(db, "communityPosts", postId));
    const postElement = document.getElementById(`post-${postId}`);
    if (postElement) postElement.remove();
  } catch (err) {
    alert("Failed to delete post: " + err.message);
  }
};

function timeSince(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return "Just now";
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
