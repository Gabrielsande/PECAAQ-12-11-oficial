<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

$id_anuncio = isset($_POST['id_anuncio']) ? (int) $_POST['id_anuncio'] : 0;

if ($id_anuncio <= 0) {
    echo json_encode(['status'=>'error','message'=>'ID inválido']);
    exit;
}

if (isset($_SESSION['cart'][$id_anuncio])) {
    unset($_SESSION['cart'][$id_anuncio]);
}

echo json_encode([
    'status'=>'ok',
    'message'=>'Item removido',
    'cart_count' => array_sum($_SESSION['cart'] ?? [])
]);
