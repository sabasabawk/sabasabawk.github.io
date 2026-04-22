index.html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Sabasaba Ministries App</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <style>
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: #f0f2f5;
    }

    /* App Container */
    .app {
      max-width: 420px;
      margin: auto;
      background: white;
      height: 100vh;
      display: flex;
      flex-direction: column;
      border: 1px solid #ddd;
    }

    /* Header */
    .header {
      background: #1e3a5f;
      color: white;
      padding: 15px;
      text-align: center;
      font-size: 18px;
      font-weight: bold;
    }

    /* Content */
    .content {
      flex: 1;
      overflow-y: auto;
      padding: 15px;
    }

    /* Cards */
    .card {
      background: #fff;
      padding: 15px;
      margin-bottom: 15px;
      border-radius: 10px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }

    .card h3 {
      margin: 0 0 10px;
      color: #1e3a5f;
    }

    .card p {
      font-size: 14px;
      color: #555;
    }

    /* Button */
    .btn {
      display: inline-block;
      padding: 8px 12px;
      background: #1e90ff;
      color: white;
      border-radius: 5px;
      text-decoration: none;
      margin-top: 10px;
      font-size: 14px;
    }

    /* Bottom Navigation */
    .nav {
      display: flex;
      border-top: 1px solid #ddd;
      background: white;
    }

    .nav button {
      flex: 1;
      padding: 12px;
      border: none;
      background: none;
      font-size: 12px;
      color: #555;
    }

    .nav button.active {
      color: #1e90ff;
      font-weight: bold;
    }

    /* Sections */
    .section {
      display: none;
    }

    .section.active {
      display: block;
    }

    /* Highlight */
    .highlight {
      background: #eef4ff;
      padding: 10px;
      border-left: 4px solid #1e90ff;
      margin-top: 10px;
      font-size: 14px;
    }

  </style>
</head>

<body>

<div class="app">

  <!-- Header -->
  <div class="header">Sabasaba Ministries</div>

  <!-- Content -->
  <div class="content">

    <!-- HOME -->
    <div id="home" class="section active">
      <div class="card">
        <h3>Welcome</h3>
        <p>Preaching & Teaching the Word of God.</p>
      </div>

      <div class="card">
        <h3>🔥 Latest Sermon</h3>
        <p>Do Not Be Silent – Faith That Cries Out</p>
        <a href="sermon2.html" class="btn">Read</a>
      </div>
    </div>

    <!-- SERMONS -->
    <div id="sermons" class="section">
      <div class="card">
        <h3>When Enough is Never Enough</h3>
        <a href="sermon1.html" class="btn">Read</a>
      </div>

      <div class="card">
        <h3>Do Not Be Silent</h3>
        <a href="sermon2.html" class="btn">Read</a>
      </div>
    </div>

    <!-- PRAYER -->
    <div id="prayer" class="section">
      <div class="card">
        <h3>Prayer Request</h3>
        <p>Send your prayer request.</p>

        <form>
          <input type="text" placeholder="Your Name" style="width:100%;padding:8px;margin-bottom:10px;">
          <textarea placeholder="Your Prayer..." style="width:100%;padding:8px;"></textarea>
          <br>
          <button class="btn" type="submit">Send</button>
        </form>
      </div>
    </div>

    <!-- DONATION -->
    <div id="donate" class="section">
      <div class="card">
        <h3>Support the Ministry</h3>
        <p>You can support this work.</p>

        <div class="highlight">
          📱 Mobile Money:<br>
          0653669337
        </div>

        <button class="btn">Donate</button>
      </div>
    </div>

  </div>

  <!-- Bottom Navigation -->
  <div class="nav">
    <button onclick="show('home', this)" class="active">Home</button>
    <button onclick="show('sermons', this)">Sermons</button>
    <button onclick="show('prayer', this)">Prayer</button>
    <button onclick="show('donate', this)">Donate</button>
  </div>

</div>

<script>
  function show(sectionId, btn) {
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');

    document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
</script>

</body>
</html>
manifest.json
{
  "name": "Sabasaba Ministries",
  "short_name": "Ministry",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1e3a5f",
  "icons": [
    {
      "src": "./icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "./icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
{
  "name": "Sabasaba Ministries",
  "short_name": "Ministry",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1e3a5f",
  "icons": [
    {
      "src": "./icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "./icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}

service-worker.js
self.addEventListener("install", e => {
  self.skipWaiting();
});

self.addEventListener("fetch", e => {});
icon-192.png
icon-512.png