<?php
session_start();

// ============================
// CONFIGURAÇÃO DO BANCO
// ============================
$servidor = "localhost";
$usuario = "root";
$senha = "";
$banco = "pecaaq";
$conn = new mysqli($servidor, $usuario, $senha, $banco);

if ($conn->connect_error) {
  die("Erro na conexão: " . $conn->connect_error);
}

// ============================
// VERIFICA SESSÃO
// ============================
$id_usuario = $_SESSION['id_usuario'] ?? $_SESSION['id'] ?? null;
$nomeSessao = $_SESSION['nome_razao_social'] ?? $_SESSION['nome'] ?? '';
$tipoSessao = $_SESSION['tipo_usuario'] ?? $_SESSION['tipo'] ?? '';

if (!$id_usuario || strtolower($tipoSessao) !== 'cliente') {
  header("Location: ../Login/indexLogin.html");
  exit;
}

// ============================
// ATUALIZAR DADOS (CONFIGURAÇÕES)
// ============================
if ($_SERVER["REQUEST_METHOD"] === "POST") {
  $novoNome = trim($_POST['novo_nome'] ?? '');
  $novaSenha = trim($_POST['nova_senha'] ?? '');

  if (!empty($novoNome)) {
    $stmt = $conn->prepare("UPDATE usuarios SET nome_razao_social = ? WHERE id_usuario = ?");
    $stmt->bind_param("si", $novoNome, $id_usuario);
    $stmt->execute();
    $_SESSION['nome_razao_social'] = $novoNome;
    $stmt->close();
  }

  if (!empty($novaSenha)) {
    $hash = password_hash($novaSenha, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("UPDATE usuarios SET senha_hash = ? WHERE id_usuario = ?");
    $stmt->bind_param("si", $hash, $id_usuario);
    $stmt->execute();
    $stmt->close();
  }

  header("Location: perfil_cliente.php");
  exit;
}

// ============================
// CARREGA DADOS DO CLIENTE
// ============================
$sql = "SELECT nome_razao_social, email FROM usuarios WHERE id_usuario = ? LIMIT 1";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $id_usuario);
$stmt->execute();
$stmt->bind_result($nomeCliente, $emailCliente);
$stmt->fetch();
$stmt->close();

$itensCarrinho = [
  ["produto" => "Mouse Gamer RGB", "quantidade" => 1, "preco" => 149.90],
  ["produto" => "Teclado Mecânico", "quantidade" => 1, "preco" => 299.00],
  ["produto" => "Parafuso M6 x 20 (pacote 50)", "quantidade" => 2, "preco" => 24.50],
];

$landingPage = "../LaningPage/indexLandingPage.html";
$logoutEndpoint = "../Login/logout.php";
?>

<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="utf-8" />
  <title>Perfil do Cliente</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root {
      --sidebar-bg: #0b1220;
      --sidebar-hover: #1e2a47;
      --accent: #3b82f6;
      --card-bg: #ffffff;
      --text-dark: #111827;
      --text-light: #9ca3af;
      --bg: #f3f4f6;
    }

    * {
      box-sizing: border-box;
      font-family: 'Inter', sans-serif;
    }

    body {
      margin: 0;
      display: flex;
      background: var(--bg);
      color: var(--text-dark);
      min-height: 100vh;
    }

    /* Sidebar */
    .sidebar {
      width: 250px;
      background: var(--sidebar-bg);
      color: #fff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 24px 16px;
    }

    .brand {
      text-align: center;
      margin-bottom: 30px;
    }

    .brand img {
      width: 70px;
      height: auto;
      margin-bottom: 10px;
      object-fit: contain;
      filter: drop-shadow(0 0 4px rgba(59,130,246,0.5));
    }

    .brand h2 {
      font-size: 18px;
      margin: 0;
    }

    .nav a {
      display: flex;
      align-items: center;
      padding: 12px 14px;
      color: #d1d5db;
      text-decoration: none;
      border-radius: 8px;
      transition: background 0.3s, color 0.3s;
    }

    .nav a:hover, .nav a.active {
      background: var(--sidebar-hover);
      color: #fff;
    }

    .btn-group {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .logout {
      background: #ef4444;
      color: #fff;
      text-align: center;
      padding: 10px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 500;
    }

    .landing {
      background: #3b82f6;
      color: #fff;
      text-align: center;
      padding: 10px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 500;
    }

    /* Main */
    .main {
      flex: 1;
      padding: 24px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--card-bg);
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      margin-bottom: 24px;
    }

    .header h1 {
      margin: 0;
      font-size: 22px;
      color: var(--text-dark);
    }

    .muted {
      color: var(--text-light);
      font-weight: 500;
    }

    .card-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }

    .card {
      background: var(--card-bg);
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    }

    .card h3 {
      margin-top: 0;
      color: var(--accent);
      font-size: 18px;
    }

    .cart-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-top: 10px;
    }

    .cart-item {
      background: var(--card-bg);
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 14px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
    }

    .config-form {
      display: flex;
      flex-direction: column;
      gap: 15px;
      max-width: 400px;
    }

    .config-form input {
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 8px;
    }

    .config-form button {
      background: var(--accent);
      color: #fff;
      padding: 10px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: bold;
    }

    .config-form button:hover {
      opacity: 0.9;
    }

    @media (max-width: 768px) {
      .sidebar {
        display: none;
      }
    }
  </style>
</head>

<body>
  <aside class="sidebar">
    <div>
      <div class="brand">
        <img src="../LaningPage/imgLandingPage/LogoPecaAq4.png" alt="Logo">
        <h2>PEÇAAQ</h2>
      </div>
      <nav class="nav">
        <a href="#" id="linkInicio" class="active">🏠 Início</a>
        <a href="#" id="linkConfig">⚙️ Configurações</a>
      </nav>
    </div>
    <div class="btn-group">
      <a href="<?php echo $landingPage; ?>" class="landing">Voltar à Landing</a>
      <a href="<?php echo $logoutEndpoint; ?>" class="logout">Sair</a>
    </div>
  </aside>

  <main class="main">
    <div id="paginaInicio">
      <div class="header">
        <h1>Bem-vindo, <?php echo htmlspecialchars($nomeCliente); ?></h1>
        <div class="muted">Logado como Cliente</div>
      </div>

      <div class="card-row">
        <div class="card">
          <h3>Resumo do Carrinho</h3>
          <?php $total = array_sum(array_map(fn($it) => $it['quantidade'] * $it['preco'], $itensCarrinho)); ?>
          <p><strong>Itens:</strong> <?php echo count($itensCarrinho); ?></p>
          <p><strong>Valor total:</strong> R$ <?php echo number_format($total, 2, ',', '.'); ?></p>
        </div>

        <div class="card">
          <h3>Informações</h3>
          <p><strong>Nome:</strong> <?php echo htmlspecialchars($nomeCliente); ?></p>
          <p><strong>ID usuário:</strong> <?php echo htmlspecialchars($id_usuario); ?></p>
        </div>
      </div>

      <section class="card">
        <h3>Itens no Carrinho</h3>
        <div class="cart-grid">
          <?php foreach ($itensCarrinho as $it): ?>
            <div class="cart-item">
              <h4><?php echo htmlspecialchars($it['produto']); ?></h4>
              <p>Quantidade: <?php echo $it['quantidade']; ?></p>
              <p>Preço unitário: R$ <?php echo number_format($it['preco'], 2, ',', '.'); ?></p>
              <p><strong>Total:</strong> R$ <?php echo number_format($it['quantidade'] * $it['preco'], 2, ',', '.'); ?></p>
            </div>
          <?php endforeach; ?>
        </div>
      </section>
    </div>

    <div id="paginaConfig" style="display:none;">
      <div class="header">
        <h1>⚙️ Configurações de Conta</h1>
      </div>
      <div class="card">
        <form method="POST" class="config-form">
          <label>Alterar Nome:</label>
          <input type="text" name="novo_nome" placeholder="Novo nome" />

          <label>Alterar Senha:</label>
          <input type="password" name="nova_senha" id="nova_senha" placeholder="Nova senha" />
          <button type="button" onclick="toggleSenha()">👁 Mostrar/Esconder Senha</button>

          <button type="submit">Salvar Alterações</button>
        </form>
      </div>
    </div>
  </main>

  <script>
    const linkInicio = document.getElementById('linkInicio');
    const linkConfig = document.getElementById('linkConfig');
    const paginaInicio = document.getElementById('paginaInicio');
    const paginaConfig = document.getElementById('paginaConfig');

    linkInicio.addEventListener('click', e => {
      e.preventDefault();
      paginaInicio.style.display = 'block';
      paginaConfig.style.display = 'none';
      linkInicio.classList.add('active');
      linkConfig.classList.remove('active');
    });

    linkConfig.addEventListener('click', e => {
      e.preventDefault();
      paginaInicio.style.display = 'none';
      paginaConfig.style.display = 'block';
      linkConfig.classList.add('active');
      linkInicio.classList.remove('active');
    });

    function toggleSenha() {
      const input = document.getElementById('nova_senha');
      input.type = input.type === 'password' ? 'text' : 'password';
    }
  </script>
</body>
</html>
