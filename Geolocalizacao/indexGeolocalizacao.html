<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Geolocalização OpenStreetMap</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
  <style>
    :root {
      --bg: #0f172a;
      --panel: #111827;
      --muted: #94a3b8;
      --text: #e5e7eb;
      --primary: #22c55e;
      --primary-2: #16a34a;
      --accent: #38bdf8;
      --danger: #ef4444;
      --radius: 16px;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: radial-gradient(1200px 800px at 80% -10%, #0b1023 0%, var(--bg) 40%, #0a0f22 100%);
      color: var(--text);
      min-height: 100dvh;
    }
    header {
      padding: 24px 16px;
      text-align: center;
    }
    header h1 {
      margin: 0 0 6px;
      font-size: clamp(20px, 3vw, 32px);
      letter-spacing: 0.4px;
    }
    header p { margin: 0; color: var(--muted); }

    .container {
      max-width: 1100px;
      margin: 20px auto 40px;
      padding: 16px;
      display: grid;
      grid-template-columns: 1.1fr 1fr;
      gap: 16px;
    }
    @media (max-width: 900px) { .container { grid-template-columns: 1fr; } }

    .card {
      background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02));
      border: 1px solid rgba(148,163,184,0.15);
      border-radius: var(--radius);
      box-shadow: 0 10px 30px rgba(0,0,0,0.35);
      overflow: hidden;
    }
    .card h2 {
      font-size: 18px; margin: 0; padding: 14px 16px; border-bottom: 1px solid rgba(148,163,184,0.12);
      background: rgba(148,163,184,0.06);
    }
    .card .content { padding: 16px; }

    #map { width: 100%; height: min(70dvh, 600px); background: #0b1023; border-radius: var(--radius); }

    .row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
    input[type="text"] {
      background: #0b122a;
      border: 1px solid rgba(148,163,184,0.25);
      color: var(--text);
      border-radius: 12px;
      padding: 10px 12px;
      outline: none;
      flex: 1;
    }
    button {
      appearance: none;
      border: 0; cursor: pointer; font-weight: 600;
      border-radius: 9999px; padding: 10px 14px; font-size: 14px;
      color: #051b0f; background: var(--primary);
      transition: transform .06s ease, background .2s ease, box-shadow .2s ease;
      box-shadow: 0 6px 18px rgba(34,197,94,.25);
    }
    button:hover { background: var(--primary-2); }
    button:active { transform: translateY(1px) }

    .search-box { display: flex; gap: 10px; margin-top: 12px; }
    .stat-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px; margin-top: 12px; }
    .stat { background: rgba(56,189,248,0.06); border: 1px solid rgba(56,189,248,0.25); padding: 12px; border-radius: 12px; font-size: 14px; }
    .stat b { display:block; color: var(--accent); font-size: 12px; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 4px; }
  </style>
</head>
<body>
  <header>
    <h1>Geolocalização com OpenStreetMap</h1>
    <p>Exemplo estilizado com botão para autopeça em Sapucaia do Sul.</p>
  </header>

  <main class="container">
    <section class="card">
      <h2>Mapa</h2>
      <div class="content">
        <div id="map"></div>
        <div class="stat-grid">
          <div class="stat"><b>Latitude</b><span id="lat">–</span></div>
          <div class="stat"><b>Longitude</b><span id="lng">–</span></div>
          <div class="stat"><b>Precisão (m)</b><span id="acc">–</span></div>
        </div>
      </div>
    </section>

    <section class="card">
      <h2>Ações</h2>
      <div class="content">
        <div class="row">
          <button onclick="getLocation()">Usar minha localização</button>
        </div>
        <div class="search-box">
          <input type="text" id="address" placeholder="Digite endereço ou cidade..." />
          <button onclick="searchLocation()">Buscar</button>
        </div>
        <div class="row" style="margin-top:10px;">
          <button onclick="goToAutopeca()">Ir para Autopeça (Sapucaia do Sul)</button>
        </div>
      </div>
    </section>
  </main>

  <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
  <script>
    const map = L.map('map').setView([-29.829, -51.145], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);

    let marker, circle;

    function getLocation() {
      if (!navigator.geolocation) { alert("Geolocalização não suportada."); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          const latlng = [latitude, longitude];
          if (marker) marker.remove();
          if (circle) circle.remove();
          marker = L.marker(latlng).addTo(map);
          circle = L.circle(latlng, { radius: accuracy }).addTo(map);
          map.setView(latlng, 15);
          document.getElementById("lat").textContent = latitude.toFixed(6);
          document.getElementById("lng").textContent = longitude.toFixed(6);
          document.getElementById("acc").textContent = Math.round(accuracy);
        },
        (err) => { alert("Erro ao obter localização: " + err.message); },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }

    async function searchLocation() {
      const address = document.getElementById("address").value;
      if (!address) { alert("Digite um endereço."); return; }
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
        const data = await res.json();
        if (!data.length) { alert("Local não encontrado."); return; }
        const { lat, lon, display_name } = data[0];
        const latlng = [lat, lon];
        if (marker) marker.remove();
        if (circle) circle.remove();
        marker = L.marker(latlng).addTo(map).bindPopup(display_name).openPopup();
        map.setView(latlng, 16);
        document.getElementById("lat").textContent = parseFloat(lat).toFixed(6);
        document.getElementById("lng").textContent = parseFloat(lon).toFixed(6);
        document.getElementById("acc").textContent = "–";
      } catch (e) { alert("Erro ao buscar localização: " + e); }
    }

    function goToAutopeca() {
      const address = "Avenida João Pereira de Vargas,Sapucaia do Sul, RS, Brasil";
      document.getElementById("address").value = address;
      searchLocation();
    }
  </script>
</body>
</html>
