/* =====================================================
   CHAT LOADER
   The chat code is stored in 4 smaller files
   (chat-part1.js ... chat-part4.js) so that every file is
   small enough to upload safely. This loader downloads the
   four parts, checks that each one is complete, joins them
   and runs them as ONE module (same behaviour as before).
===================================================== */

(async function(){

  window.__chatLoaderRan = "v3";

  const PART_FILES = [
    "chat-part1.js",
    "chat-part2.js",
    "chat-part3.js",
    "chat-part4.js"
  ];

  function showLoaderError(message){
    const chatArea = document.getElementById("chatArea");
    const html = '<div class="errorMessage" style="margin:20px;padding:16px;border-radius:14px;background:#fdecec;color:#8a1f1f;font:700 14px/1.6 Arial,sans-serif;text-align:left">' + message + '</div>';
    if(chatArea){ chatArea.innerHTML = html; }
    else{ document.body.insertAdjacentHTML("afterbegin", html); }
    console.error(message);
  }

  try{

    const version = Date.now();

    const texts = await Promise.all(
      PART_FILES.map(async function(file, index){

        let response;
        try{
          response = await fetch(file + "?v=" + version, { cache: "no-store" });
        }catch(error){
          throw new Error(file + " could not be downloaded (network).");
        }

        if(!response.ok){
          throw new Error(file + " was not found (error " + response.status + "). Upload it in the same folder as chat.html.");
        }

        const text = await response.text();
        const marker = "/*END-OF-PART-" + (index + 1) + "*/";
        const markerPosition = text.lastIndexOf(marker);

        if(markerPosition === -1){
          throw new Error(file + " is incomplete (the end of the file is missing). Upload it again.");
        }

        return text.slice(0, markerPosition);

      })
    );

    const firebaseUrl = new URL("firebase.js", window.location.href).href;

    const code = texts.join("").replace(
      /from\s*["']\.\/firebase\.js["']/,
      'from "' + firebaseUrl + '"'
    );

    const blobUrl = URL.createObjectURL(
      new Blob([code], { type: "text/javascript" })
    );

    await import(blobUrl);

  }catch(error){

    showLoaderError("Chat could not start: " + error.message);

  }

})();
