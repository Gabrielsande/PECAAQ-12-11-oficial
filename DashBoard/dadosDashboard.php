<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

// 🔹 Conexão com o banco
$servidor = "localhost";
$usuario  = "root";
$senha    = "";
$banco    = "pecaaq";

$conn = new mysqli($servidor, $usuario, $senha, $banco);

if ($conn->connect_error) {
    echo json_encode(['status' => 'erro', 'msg' => 'Erro de conexão com o banco.']);
    exit;
}

// 🔹 Verifica se há usuário logado
if (!isset($_SESSION['id_usuario'])) {
    echo json_encode(['status' => 'erro', 'msg' => 'Usuário não autenticado.']);
    exit;
}

$id_usuario = intval($_SESSION['id_usuario']);

// 🔹 TOTAL DE PRODUTOS (apenas da empresa logada)
$sqlProdutos = "SELECT COUNT(*) AS total_produtos FROM produtos WHERE id_usuario = ?";
$stmtProdutos = $conn->prepare($sqlProdutos);
$stmtProdutos->bind_param("i", $id_usuario);
$stmtProdutos->execute();
$resProdutos = $stmtProdutos->get_result();
$totalProdutos = $resProdutos->fetch_assoc()['total_produtos'] ?? 0;
$stmtProdutos->close();

// 🔹 TOTAL DE ANÚNCIOS (se quiser também por empresa, descomente abaixo)
/*
$sqlAnuncios = "SELECT COUNT(*) AS total_anuncios FROM anuncio WHERE id_usuario = ?";
$stmtAnuncios = $conn->prepare($sqlAnuncios);
$stmtAnuncios->bind_param("i", $id_usuario);
$stmtAnuncios->execute();
$resAnuncios = $stmtAnuncios->get_result();
$totalAnuncios = $resAnuncios->fetch_assoc()['total_anuncios'] ?? 0;
$stmtAnuncios->close();
*/

// 🔹 TOTAL DE ANÚNCIOS (sem filtro por empresa — se quiser mostrar todos)
$sqlAnuncios = "SELECT COUNT(*) AS total_anuncios FROM anuncio";
$resAnuncios = $conn->query($sqlAnuncios);
$totalAnuncios = $resAnuncios->fetch_assoc()['total_anuncios'] ?? 0;

// 🔹 Retorno em JSON
echo json_encode([
    'status' => 'ok',
    'produtos' => $totalProdutos,
    'anuncios' => $totalAnuncios
]);

$conn->close();
?>
