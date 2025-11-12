<?php
// Produtos/processaProduto.php
session_start();
header('Content-Type: application/json; charset=utf-8');

// ===========================
// 🔹 Conexão com o banco
// ===========================
$host = "localhost";
$user = "root";
$pass = "";
$db   = "pecaaq";

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Falha na conexão com o banco']);
    exit;
}

// ===========================
// 🔹 Verifica sessão (empresa logada)
// ===========================
if (!isset($_SESSION['id_usuario'])) {
    echo json_encode(['status' => 'error', 'message' => 'Sessão expirada. Faça login novamente.']);
    $conn->close();
    exit;
}

$id_usuario = intval($_SESSION['id_usuario']);

// ===========================
// 🔹 Recebe dados do formulário
// ===========================
$nome         = trim($_POST['nome'] ?? '');
$sku          = trim($_POST['sku'] ?? '');
$marca        = trim($_POST['marca'] ?? '');
$descricao    = trim($_POST['descricao'] ?? '');
$preco_raw    = trim($_POST['preco'] ?? '');
$categoria    = trim($_POST['categoria'] ?? '');
$id_categoria = isset($_POST['id_categoria']) && $_POST['id_categoria'] !== '' ? intval($_POST['id_categoria']) : null;

// 🔸 Valida campos obrigatórios
if ($nome === '' || $preco_raw === '') {
    echo json_encode(['status' => 'error', 'message' => 'Preencha pelo menos o nome e o preço.']);
    $conn->close();
    exit;
}

// ===========================
// 🔹 Normaliza preço (aceita "1.234,56" ou "1234.56")
// ===========================
$preco_normalizado = str_replace(['.', ','], ['', '.'], $preco_raw);
$preco_normalizado = preg_replace('/[^\d\.]/', '', $preco_normalizado);
$preco = (float) $preco_normalizado;

// ===========================
// 🔹 Upload da imagem
// ===========================
$foto_field = 'foto';
$foto_db = '';

if (isset($_FILES[$foto_field]) && $_FILES[$foto_field]['error'] === UPLOAD_ERR_OK) {
    $uploadDir = __DIR__ . '/uploads/';

    if (!is_dir($uploadDir)) {
        if (!mkdir($uploadDir, 0777, true)) {
            echo json_encode(['status' => 'error', 'message' => 'Não foi possível criar a pasta de uploads.']);
            $conn->close();
            exit;
        }
    }

    $originalName = basename($_FILES[$foto_field]['name']);
    $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

    if (!in_array($ext, $allowed)) {
        echo json_encode(['status' => 'error', 'message' => 'Tipo de imagem não permitido. Use jpg/png/webp/gif.']);
        $conn->close();
        exit;
    }

    $uniqueName = uniqid('prod_') . '.' . $ext;
    $targetPath = $uploadDir . $uniqueName;

    if (!move_uploaded_file($_FILES[$foto_field]['tmp_name'], $targetPath)) {
        echo json_encode(['status' => 'error', 'message' => 'Erro ao salvar o arquivo de imagem.']);
        $conn->close();
        exit;
    }

    // salva apenas o nome do arquivo no banco
    $foto_db = $uniqueName;
} else {
    $foto_db = ''; // pode deixar vazio
}

// ===========================
// 🔹 Inserção no banco (vinculada ao usuário logado)
// ===========================
$sql = "INSERT INTO produtos 
        (id_usuario, id_categoria, nome, sku_universal, marca, descricao_tecnica, foto_principal, preco, categoria, data_cadastro)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";

$stmt = $conn->prepare($sql);
if (!$stmt) {
    @unlink($targetPath ?? null);
    echo json_encode(['status' => 'error', 'message' => 'Erro ao preparar a query: ' . $conn->error]);
    $conn->close();
    exit;
}

$stmt->bind_param(
    "iisssssds",
    $id_usuario,
    $id_categoria,
    $nome,
    $sku,
    $marca,
    $descricao,
    $foto_db,
    $preco,
    $categoria
);

if (!$stmt->execute()) {
    @unlink($targetPath ?? null);
    echo json_encode(['status' => 'error', 'message' => 'Erro ao inserir produto: ' . $stmt->error]);
    $stmt->close();
    $conn->close();
    exit;
}

$id_produto = $stmt->insert_id;

// ===========================
// 🔹 Retorno JSON
// ===========================
echo json_encode([
    'status' => 'ok',
    'message' => 'Produto cadastrado com sucesso!',
    'produto' => [
        'id_produto' => $id_produto,
        'nome' => $nome,
        'foto_principal' => $foto_db,
        'preco' => number_format($preco, 2, '.', '')
    ]
]);

$stmt->close();
$conn->close();
exit;
?>
