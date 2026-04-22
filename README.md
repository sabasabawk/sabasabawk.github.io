<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sabasaba Ministries</title>

  <!-- Manifest -->
  <link rel="manifest" href="manifest.json">

  <style>
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: #f5f7fb;
    }

    header {
      background: #1e3a5f;
      color: white;
      padding: 15px;
      text-align: center;
      font-size: 20px;
      font-weight: bold;
    }

    nav {
      display: flex;
      justify-content: space-around;
      background: white;
      padding: 10px;
      border-bottom: 1px solid #ddd;
    }

    nav button {
      background: none;
      border: none;
      font-size: 16px;
      color: #555;
    }

    nav button.active {
      color: #1e3a5f;
      font-weight: bold;
    }

    .container {
      padding: 15px;
    }

    .card {
      background: white;
      padding: 15px;
      margin-bottom: 15px;
      border-radius: 10px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }

    .btn {
      display: inline-block;
      padding: 10px 15px;
      background: #1e88e5;
      color: white;
      border-radius: 8px;
      text-decoration: none;
      margin-top: 10px;
    }

    .hidden {
      display: none;
    }
  </style>
</head>

<body>

<header>
  Sabasaba Ministries
</header>

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

  <div id="sermons" class="page hidden">
  <div class="card">
    <h3>Do Not Be Silent</h3>
    <p>Mark 10:46-52</p>
    <button class="btn" onclick="openSermon('sermon1')">Read Sermon</button>
  </div>

  <div class="card">
    <h3>When Enough is Never Enough</h3>
    <p>Luke 12:13-21</p>
    <button class="btn" onclick="openSermon('sermon2')">Read Sermon</button>
  </div>
</div>
  <div id="sermons" class="page hidden">
    <div class="card">
      <h3>Do Not Be Silent</h3>
      <p>Faith that cries out - Mark 10:46-52</p>
      <a class="btn" href="#">Read Sermon</a>
    </div>

    <div class="card">
      <h3>When Enough is Never Enough</h3>
      <p>Luke 12:13-21</p>
      <a class="btn" href="#">Read Sermon</a>
    </div>
  </div>

  <!-- PRAYER -->
  <div id="prayer" class="page hidden">
    <div class="card">
      <h3>Send Prayer Request</h3>
      <p>We stand with you in prayer.</p>
      <a class="btn" href="https://wa.me/255653669337">Send via WhatsApp</a>
    </div>
  </div>

  <!-- DONATE -->
  <div id="donate" class="page hidden">
    <div class="card">
      <h3>Support the Ministry</h3>
      <p>Your giving helps spread the Gospel.</p>
      <a class="btn" href="https://wa.me/255653669337">Give via Mobile Money</a>
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
</script>

<!-- Service Worker -->
<script>
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}
</script>

</body>
</html>