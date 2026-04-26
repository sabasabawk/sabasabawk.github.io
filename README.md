<!DOCTYPE html>
<html>
<head>
  <title>Sabasaba Ministry</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <style>
    body {
      margin: 0;
      font-family: Arial;
      background: #f4f6f9;
    }

    .header {
      background: #2c3e50;
      color: white;
      padding: 20px;
      text-align: center;
      font-size: 20px;
    }

    .container {
      padding: 20px;
    }

    .card {
      background: white;
      padding: 20px;
      margin-bottom: 15px;
      border-radius: 12px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
      text-align: center;
    }

    .btn {
      display: block;
      background: #3498db;
      color: white;
      padding: 15px;
      margin-top: 10px;
      border-radius: 10px;
      text-decoration: none;
    }

    /* Floating WhatsApp */
    .whatsapp {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #25D366;
      color: white;
      padding: 15px;
      border-radius: 50%;
      font-size: 20px;
      text-decoration: none;
    }
  </style>
</head>

<body>

  <div class="nav">
  <button onclick="show('home', this)" class="active">🏠<br>Home</button>
  <button onclick="show('sermons', this)">📖<br>Sermons</button>
  <button onclick="show('prayer', this)">🙏<br>Prayer</button>
  <button onclick="show('donate', this)">💰<br>Donate</button>
</div>

  <!-- Floating WhatsApp -->
  <a class="whatsapp" href="https://wa.me/255653669337" target="_blank">💬</a>

</body>
</html>