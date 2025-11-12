<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

// ===========================
// 🔹 Conexão com o banco
// ===========================
$servidor = "localhost";
$usuario  = "root";
$senha    = "";
$banco    = "pecaaq";

$conn = new mysqli($servidor, $usuario, $senha, $banco);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['status' => 'erro', 'mensagem' => 'Erro de conexão com o banco de dados.']);
    exit;
}

// ===========================
// 🔹 Verifica sessão (empresa logada)
// ===========================
if (!isset($_SESSION['id_usuario'])) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Sessão expirada ou usuário não autenticado.']);
    exit;
}

$id_usuario = intval($_SESSION['id_usuario']);

// ===========================
// 🔹 Busca produtos da empresa logada
// ===========================
$sql = "SELECT id_produto, nome, preco, foto_principal 
        FROM produtos 
        WHERE id_usuario = ?
        ORDER BY id_produto DESC";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $id_usuario);
$stmt->execute();
$result = $stmt->get_result();

$produtos = [];
while ($row = $result->fetch_assoc()) {
    // Garante o caminho correto da imagem
    $row['foto_principal'] = !empty($row['foto_principal'])
        ? '../DashBoard/uploads/' . $row['foto_principal']
        : '../DashBoard/uploads/placeholder.png'; // imagem padrão caso não tenha
    $produtos[] = $row;
}

// ===========================
// 🔹 Retorno JSON
// ===========================
echo json_encode([
    'status' => 'ok',
    'produtos' => $produtos
]);

$stmt->close();
$conn->close();
?>
