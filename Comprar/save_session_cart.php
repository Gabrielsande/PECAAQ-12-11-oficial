<?php
// save_session_cart.php
session_start();
header('Content-Type: application/json; charset=utf-8');

$raw = $_POST['cart'] ?? null;
if (!$raw) {
    http_response_code(400);
    echo json_encode(['status'=>'error','message'=>'Parâmetro cart faltando']);
    exit;
}

$decoded = json_decode($raw, true);
if ($decoded === null) {
    http_response_code(400);
    echo json_encode(['status'=>'error','message'=>'JSON inválido no campo cart']);
    exit;
}

// Espera um array de objetos [{id_anuncio, quantidade, titulo, preco}, ...] ou similar
// Vamos normalizar para map id => quantidade
$sessionCart = [];

foreach ($decoded as $item) {
    // tentar extrair id (aceita id_anuncio, id, id_produto)
    $id = 0;
    if (isset($item['id_anuncio'])) $id = (int)$item['id_anuncio'];
    elseif (isset($item['id'])) $id = (int)$item['id'];
    elseif (isset($item['id_produto'])) $id = (int)$item['id_produto'];

    $qtd = isset($item['quantidade']) ? max(1,(int)$item['quantidade']) : (isset($item['qty']) ? max(1,(int)$item['qty']) : 1);

    if ($id > 0) {
        if (!isset($sessionCart[$id])) $sessionCart[$id] = 0;
        $sessionCart[$id] += $qtd;
    }
}

// substitui sessão
$_SESSION['cart'] = $sessionCart;

echo json_encode(['status'=>'ok','message'=>'Carrinho salvo na sessão','cart'=>$_SESSION['cart'],'cart_count'=>array_sum($_SESSION['cart'])]);
exit;
