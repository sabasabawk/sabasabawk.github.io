
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sabasaba Ministry</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .container {
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            padding: 60px 40px;
            max-width: 700px;
            width: 100%;
            text-align: center;
        }

        h1 {
            font-size: 3.5em;
            color: #667eea;
            margin-bottom: 15px;
            font-weight: 700;
            letter-spacing: 1px;
        }

        .tagline {
            font-size: 1.8em;
            color: #764ba2;
            margin-bottom: 40px;
            font-weight: 500;
        }

        .contact-section {
            margin-top: 50px;
            padding: 40px;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            border-radius: 12px;
        }

        .contact-section h2 {
            font-size: 2.5em;
            color: #333;
            margin-bottom: 30px;
            font-weight: 600;
        }

        .whatsapp-contact {
            background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
            color: white;
            padding: 35px;
            border-radius: 12px;
            display: inline-block;
            box-shadow: 0 5px 20px rgba(37, 211, 102, 0.3);
        }

        .whatsapp-contact h3 {
            font-size: 2em;
            margin-bottom: 15px;
            font-weight: 600;
        }

        .whatsapp-contact p {
            font-size: 1.3em;
            margin-bottom: 20px;
            line-height: 1.6;
        }

        .whatsapp-link {
            display: inline-block;
            padding: 18px 40px;
            background-color: white;
            color: #25D366;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 1.4em;
            margin: 15px 0;
            transition: all 0.3s ease;
            border: 2px solid white;
        }

        .whatsapp-link:hover {
            background-color: #25D366;
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }

        .contact-note {
            margin-top: 20px;
            font-size: 1.1em;
            font-style: italic;
            opacity: 0.95;
        }

        .divider {
            height: 3px;
            background: linear-gradient(90deg, transparent, #667eea, transparent);
            margin: 30px 0;
            border-radius: 2px;
        }

        @media (max-width: 600px) {
            .container {
                padding: 30px 20px;
            }

            h1 {
                font-size: 2.5em;
            }

            .tagline {
                font-size: 1.4em;
            }

            .contact-section {
                padding: 25px;
                margin-top: 30px;
            }

            .contact-section h2 {
                font-size: 1.8em;
            }

            .whatsapp-contact {
                padding: 25px;
            }

            .whatsapp-contact h3 {
                font-size: 1.6em;
            }

            .whatsapp-contact p {
                font-size: 1.1em;
            }

            .whatsapp-link {
                font-size: 1.2em;
                padding: 15px 30px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🙏 Welcome to My Ministry</h1>
        <p class="tagline">Preaching the Word of God</p>
        
        <div class="divider"></div>

        <section class="contact-section">
            <h2>📞 Contact & Support</h2>
            <div class="whatsapp-contact">
                <h3>WhatsApp</h3>
                <p>Reach us via WhatsApp for inquiries, support, and payment offerings</p>
                <a href="https://wa.me/255653669337" class="whatsapp-link" target="_blank">
                    📱 WhatsApp: +255 653 669 337
                </a>
                <p class="contact-note">💰 You can use this number for contact and payment purposes</p>
            </div>
        </section>
    </div>
</body>
</html>