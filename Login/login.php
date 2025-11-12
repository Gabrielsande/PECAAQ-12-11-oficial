<?php
session_start();

// Config DB
$servidor = "localhost";
$usuario = "root";
$senha = "";
$banco = "pecaaq"; // sem acento

$conn = new mysqli($servidor, $usuario, $senha, $banco);
if ($conn->connect_error) {
    die("Erro na conexão: " . $conn->connect_error);
}

// Recebe dados
$tipo = $_POST['tipo'] ?? '';
$login = trim($_POST['login'] ?? '');
$senha = $_POST['senha'] ?? '';

if (empty($tipo) || empty($login) || empty($senha)) {
    die("⚠ Todos os campos são obrigatórios!");
}

// Normaliza login (remove pontuação para comparar com documento)
$loginLimpo = preg_replace('/\D/', '', $login);

// Define qual valor de tipo esperamos na tabela usuarios
$tipo_map = strtolower($tipo) === 'empresa' ? 'Fornecedor' : ucfirst(strtolower($tipo));
if (!in_array($tipo_map, ['Cliente', 'Fornecedor'])) {
    die("Tipo de login inválido!");
}

// Prepara query: buscamos pelo email ou pelo documento (campo 'documento' unificado)
$sql = "SELECT id_usuario, nome_razao_social, email, senha_hash, tipo, documento 
        FROM usuarios 
        WHERE tipo = ? AND (email = ? OR documento = ?) 
        LIMIT 1";

$stmt = $conn->prepare($sql);
if (!$stmt) {
    die("Erro na query: " . $conn->error);
}

$stmt->bind_param("sss", $tipo_map, $login, $loginLimpo);
$stmt->execute();

$result = $stmt->get_result();
if ($result->num_rows === 0) {
    $stmt->close();
    $conn->close();
    die("❌ Usuário não encontrado!");
}

$usuario = $result->fetch_assoc();
$stmt->close();

// Verifica senha usando password_verify com o campo senha_hash
if (!isset($usuario['senha_hash']) || !password_verify($senha, $usuario['senha_hash'])) {
    $conn->close();
    die("❌ Senha incorreta!");
}

// Cria sessão (nomes compatíveis com cadastro)
$_SESSION['id_usuario'] = $usuario['id_usuario'];
$_SESSION['nome_razao_social'] = $usuario['nome_razao_social'];
$_SESSION['tipo_usuario'] = $usuario['tipo'];

// Preparar dados seguros para salvar no localStorage (evite colocar dados sensíveis)
$usuarioParaLocal = [
    'id_usuario' => (int)$usuario['id_usuario'],
    'nome_razao_social' => $usuario['nome_razao_social'],
    'email' => $usuario['email'] ?? '',
    'tipo' => $usuario['tipo'] ?? 'Cliente'
];

// Decida para onde redirecionar depois do login
$destino = '../LaningPage/indexLandingPage.html'; // ajuste se necessário

// Em vez de header(Location) direto, imprimimos uma página que:
//  - grava os dados seguros no localStorage
//  - redireciona para a landing (ou outra página)
?>
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Login realizado</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body { font-family: Arial, Helvetica, sans-serif; padding:30px; text-align:center; }
    .msg { margin-top:20px; }
  </style>
</head>
<body>
  <h2>Login realizado com sucesso!</h2>
  <p class="msg">Você será redirecionado em instantes...</p>

  <script>
    (function(){
      try {
        // dados vindos do servidor (JSON safe-encoded)
        var usuario = <?php echo json_encode($usuarioParaLocal, JSON_HEX_TAG|JSON_HEX_APOS|JSON_HEX_QUOT|JSON_HEX_AMP); ?>;
        // grava no localStorage para ser usado nas outras telas
        localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
      } catch (e) {
        console.warn('Não foi possível gravar localStorage:', e);
      }
      // redireciona para a página desejada
      setTimeout(function(){
        window.location.href = '<?php echo addslashes($destino); ?>';
      }, 600);
    })();
  </script>
</body>
</html>

<?php
$conn->close();
exit;
?>
