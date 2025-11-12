<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

// DB (mesmo estilo do seu cadastro/login)
$servidor = "localhost";
$usuario = "root";
$senha = "";
$banco = "pecaaq";

$conn = new mysqli($servidor, $usuario, $senha, $banco);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['status'=>'error','message'=>'Erro na conexão: '.$conn->connect_error]);
    exit;
}

// Recebe POST (application/x-www-form-urlencoded)
$id_anuncio = isset($_POST['id_anuncio']) ? (int) $_POST['id_anuncio'] : 0;
$quantidade = isset($_POST['quantidade']) ? max(1, (int) $_POST['quantidade']) : 1;

if ($id_anuncio <= 0) {
    http_response_code(400);
    echo json_encode(['status'=>'error','message'=>'ID de anúncio inválido']);
    $conn->close();
    exit;
}

// opcional: checar se o anúncio existe e preço/estoque
$stmt = $conn->prepare("SELECT id_anuncio, titulo, preco, quantidade_estoque FROM anuncio WHERE id_anuncio = ? LIMIT 1");
$stmt->bind_param("i", $id_anuncio);
$stmt->execute();
$res = $stmt->get_result();
if ($res->num_rows === 0) {
    echo json_encode(['status'=>'error','message'=>'Anúncio não encontrado']);
    $stmt->close();
    $conn->close();
    exit;
}
$anuncio = $res->fetch_assoc();
$stmt->close();

// inicializa carrinho em sessão
if (!isset($_SESSION['cart']) || !is_array($_SESSION['cart'])) {
    $_SESSION['cart'] = [];
}

// soma quantidades mas não ultrapassa estoque disponível
$current = $_SESSION['cart'][$id_anuncio] ?? 0;
$newQty = $current + $quantidade;
$available = (int)$anuncio['quantidade_estoque'];
if ($newQty > $available) {
    // determina máxima permitida
    $newQty = $available;
}

$_SESSION['cart'][$id_anuncio] = $newQty;

echo json_encode([
    'status' => 'ok',
    'message' => 'Adicionado ao carrinho',
    'cart_count' => array_sum($_SESSION['cart']),
    'cart' => $_SESSION['cart'],
    'item' => [
       'id_anuncio' => $id_anuncio,
       'titulo' => $anuncio['titulo'],
       'preco' => (float)$anuncio['preco'],
       'quantidade' => $_SESSION['cart'][$id_anuncio]
    ]
]);


$conn->close();
