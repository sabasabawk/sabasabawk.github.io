
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>Sabasaba Ministries</title>

<link rel="manifest" href="manifest.json">

<style>
body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: #f4f6fb;
}

header {
  background: #1e3a5f;
  color: white;
  text-align: center;
  padding: 15px;
  font-size: 20px;
  font-weight: bold;
}

<nav>
  <button onclick="showPage('home')" class="active">Home</button>
  <button onclick="showPage('sermons')">Sermons</button>
  <button onclick="showPage('live')">Live</button>
  <button onclick="showPage('prayer')">Prayer</button>
  <button onclick="showPage('donate')">Donate</button>
</nav>

.container {
  padding: 15px;
}

.card {
  background: white;
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

.btn {
  display: inline-block;
  background: #1e88e5;
  color: white;
  padding: 10px 15px;
  border-radius: 8px;
  text-decoration: none;
  margin-top: 10px;
  border: none;
}

.hidden {
  display: none;
}

audio {
  width: 100%;
  margin-top: 10px;
}
</style>
</head>

<body>

<header>Sabasaba Ministries</header>

<nav>
  <button onclick="showPage('home')" class="active">Home</button>
  <button onclick="showPage('sermons')">Sermons</button>
  <button onclick="showPage('prayer')">Prayer</button>
  <button onclick="showPage('donate')">Donate</button>
</nav>

<div class="container">

<!-- HOME -->
<div id="home" class="page">
  <div class="card">
    <h3>Welcome</h3>
    <p>Preaching the Word. Teaching the Truth. Transforming Lives.</p>
  </div>

  <div class="card">
    <h3>Quick Actions</h3>
    <a class="btn" href="https://wa.me/255653669337">Chat on WhatsApp</a><br>
    <a class="btn" href="https://wa.me/255653669337">Send Prayer Request</a>
  </div>
</div>

<!-- SERMON LIST -->
<div id="sermons" class="page hidden">
  <div class="card">
    <h3>Do Not Be Silent</h3>
    <p>Mark 10:46-52</p>
    <button class="btn" onclick="openSermon('sermon1')">Read / Listen</button>
  </div>

  <div class="card">
    <h3>When Enough is Never Enough</h3>
    <p>Luke 12:13-21</p>
    <button class="btn" onclick="openSermon('sermon2')">Read / Listen</button>
  </div>
</div>

<!-- SERMON 1 -->
<div id="sermon1" class="page hidden">
  <div class="card">
    <h2>DO NOT BE SILENT – FAITH THAT CRIES OUT</h2>
    <p><b>Mark 10:46-52</b></p>

    <audio controls>
      <source src="sermon1.mp3" type="audio/mpeg">
    </audio>

    <h3>Introduction</h3>
    <p>Bartimaeus refused silence. Faith must speak.</p>

    <h3>1. Your condition is not your end</h3>
    <p>He was blind, but not finished.</p>

    <h3>2. Faith must cry out</h3>
    <p>He shouted until Jesus responded.</p>

    <h3>3. Jesus stops for faith</h3>
    <p>Your voice of faith moves heaven.</p>

    <h3>Conclusion</h3>
    <p>Do not be silent.</p>

    <button class="btn" onclick="showPage('sermons')">⬅ Back</button>
  </div>
</div>

<!-- SERMON 2 -->
<div id="sermon2" class="page hidden">
  <div class="card">
    <h2>WHEN ENOUGH IS NEVER ENOUGH</h2>
    <p><b>Luke 12:13-21</b></p>

    <audio controls>
      <source src="sermon2.mp3" type="audio/mpeg">
    </audio>

    <h3>Introduction</h3>
    <p>Life is more than accumulation.</p>

    <h3>1. The trap of wealth</h3>
    <p>He stored but did not serve.</p>

    <h3>2. Ignoring eternity</h3>
    <p>He planned for earth only.</p>

    <h3>Conclusion</h3>
    <p>Be rich toward God.</p>

    <button class="btn" onclick="showPage('sermons')">⬅ Back</button>
  </div>
</div>
<!-- YOUTUBE LIVE -->
<div id="live" class="page hidden">
  <div class="card">
    <h3>Live Preaching</h3>
    <p>Watch live or recent messages</p>

    <iframe src="https://www.youtube.com/embed/abc123XYZ"></iframe>
      frameborder="0"
      allowfullscreen>
    </iframe>

  </div>
</div>

<!-- PRAYER -->
<div id="prayer" class="page hidden">
  <div class="card">
    <h3>Prayer Request</h3>
    <p>We are praying with you.</p>
    <a class="btn" href="https://wa.me/255653669337">Send via WhatsApp</a>
  </div>
</div>

<!-- DONATION -->
<div id="donate" class="page hidden">
  <div class="card">
    <h3>Support the Ministry</h3>
    <p>M-Pesa / Airtel Money: <b>+255653669337</b></p>
    <a class="btn" href="https://wa.me/255653669337">Confirm Giving</a>
  </div>
</div>

</div>

<script>
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById(pageId).classList.remove('hidden');

  document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
}

function openSermon(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}
</script>

<script>
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}
</script>

</body>
</html>