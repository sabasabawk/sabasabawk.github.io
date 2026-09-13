/* =====================================================
   SWIPE NAVIGATION BETWEEN MAIN TABS
   Faith Connect | SABASABA Gospel Ministry

   Lets someone swipe left/right anywhere on a main tab
   page to move to the next/previous tab, in the same
   order as the bottom navigation bar — no tapping
   required. Each of these pages is still a separate
   file (not one continuous app), so this does NOT
   animate a sliding transition between them; it simply
   detects the swipe gesture and navigates to the next
   page, the same way tapping the bottom bar link would.

   HOW TO USE:
   Add this one line near the end of <body>, just before
   the closing </body> tag, on each of the six pages:

     <script src="swipe-nav.js"></script>

   Add it to: feed.html, learn.html, groups.html,
   faith-moments.html, prayer-wall.html, profile.html
===================================================== */

(function(){

  /* =====================================================
     FADE TRANSITION OVERLAY

     A full-screen overlay that fades the page IN when it
     first loads, and fades OUT right before a swipe
     navigates to the next/previous tab. This does not
     create a true sliding animation between pages (each
     tab is still a separate page load), but it softens
     the abrupt jump into a smooth fade instead.
  ===================================================== */

  const FADE_DURATION_MS =
  220;


  const fadeOverlay =
  document.createElement(
    "div"
  );


  fadeOverlay.style.cssText = `
    position:fixed;
    inset:0;
    z-index:999999;
    background:#eef3f8;
    opacity:1;
    pointer-events:none;
    transition:opacity ${FADE_DURATION_MS}ms ease;
  `;


  document.documentElement.appendChild(
    fadeOverlay
  );


  /* Fade the newly-loaded page IN */

  window.requestAnimationFrame(
    function(){

      window.requestAnimationFrame(
        function(){

          fadeOverlay.style.opacity =
          "0";

        }
      );

    }
  );


  window.addEventListener(
    "pageshow",
    function(event){

      if(event.persisted){

        fadeOverlay.style.transition =
        "none";


        fadeOverlay.style.opacity =
        "0";


        window.requestAnimationFrame(
          function(){

            fadeOverlay.style.transition =
            `opacity ${FADE_DURATION_MS}ms ease`;

          }
        );

      }

    }
  );


  /* =====================================================
     FADE OUT, THEN NAVIGATE
  ===================================================== */

  function fadeOutThenNavigate(
    destinationUrl
  ){

    fadeOverlay.style.opacity =
    "1";


    window.setTimeout(
      function(){

        window.location.href =
        destinationUrl;

      },
      FADE_DURATION_MS
    );

  }


  /* =====================================================
     TAB ORDER
     Must match the bottom navigation bar's left-to-right
     order. Edit this list if the bar's order ever changes.
  ===================================================== */

  const TAB_PAGE_ORDER = [
    "feed.html",
    "learn.html",
    "groups.html",
    "faith-moments.html",
    "prayer-wall.html",
    "profile.html"
  ];


  /* =====================================================
     FIND CURRENT PAGE'S POSITION IN THE TAB ORDER
  ===================================================== */

  function getCurrentPageIndex(){

    const currentFileName =
    window.location.pathname
    .split("/")
    .pop() || "feed.html";


    const matchedIndex =
    TAB_PAGE_ORDER.indexOf(
      currentFileName
    );


    return matchedIndex;

  }


  /* =====================================================
     SWIPE DETECTION STATE
  ===================================================== */

  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;
  let swipeStartedOnHorizontalScroller = false;


  const MINIMUM_SWIPE_DISTANCE = 70;

  const MAXIMUM_SWIPE_DURATION_MS = 700;


  /* =====================================================
     CHECK WHETHER THE TOUCH STARTED INSIDE A HORIZONTALLY
     SCROLLABLE AREA (e.g. the Faith Moments strip, a
     category filter row) — swiping there should scroll
     that row, not change the whole page.
  ===================================================== */

  function startedOnHorizontalScroller(targetElement){

    let element =
    targetElement;


    while(
      element &&
      element !== document.body
    ){

      if(
        element.scrollWidth >
        element.clientWidth + 4
      ){

        const overflowStyle =
        window.getComputedStyle(
          element
        ).overflowX;


        if(
          overflowStyle === "auto" ||
          overflowStyle === "scroll"
        ){

          return true;

        }

      }


      element =
      element.parentElement;

    }


    return false;

  }


  /* =====================================================
     CHECK WHETHER THE TOUCH STARTED ON SOMETHING THAT
     SHOULD NEVER TRIGGER PAGE NAVIGATION (typing areas,
     buttons the user is trying to press precisely, etc.)
  ===================================================== */

  function startedOnInteractiveElement(targetElement){

    return Boolean(
      targetElement.closest(
        "input, textarea, select, button, a, [contenteditable='true']"
      )
    );

  }


  /* =====================================================
     TOUCH START
  ===================================================== */

  document.addEventListener(

    "touchstart",

    function(event){

      if(
        event.touches.length !== 1
      ){

        return;

      }


      const touch =
      event.touches[0];


      touchStartX =
      touch.clientX;


      touchStartY =
      touch.clientY;


      touchStartTime =
      Date.now();


      swipeStartedOnHorizontalScroller =
      startedOnHorizontalScroller(
        event.target
      ) ||
      startedOnInteractiveElement(
        event.target
      );

    },

    { passive:true }

  );


  /* =====================================================
     TOUCH END
  ===================================================== */

  document.addEventListener(

    "touchend",

    function(event){

      if(
        swipeStartedOnHorizontalScroller
      ){

        return;

      }


      const touch =
      event.changedTouches[0];


      if(!touch){

        return;

      }


      const deltaX =
      touch.clientX - touchStartX;


      const deltaY =
      touch.clientY - touchStartY;


      const elapsedTime =
      Date.now() - touchStartTime;


      if(
        elapsedTime >
        MAXIMUM_SWIPE_DURATION_MS
      ){

        return;

      }


      const isHorizontalSwipe =
      Math.abs(deltaX) >
      Math.abs(deltaY) * 1.5;


      const isLongEnough =
      Math.abs(deltaX) >=
      MINIMUM_SWIPE_DISTANCE;


      if(
        !isHorizontalSwipe ||
        !isLongEnough
      ){

        return;

      }


      const currentIndex =
      getCurrentPageIndex();


      if(currentIndex === -1){

        return;

      }


      /*
         Swiping left (finger moves toward the left,
         negative deltaX) moves forward to the next tab,
         the same direction convention used by most
         swipeable interfaces.
      */

      const movingToNextTab =
      deltaX < 0;


      const targetIndex =
      movingToNextTab
      ? currentIndex + 1
      : currentIndex - 1;


      if(
        targetIndex < 0 ||
        targetIndex >=
        TAB_PAGE_ORDER.length
      ){

        /* Already at the first or last tab — do nothing. */

        return;

      }


      fadeOutThenNavigate(
        TAB_PAGE_ORDER[targetIndex]
      );

    },

    { passive:true }

  );

})();
