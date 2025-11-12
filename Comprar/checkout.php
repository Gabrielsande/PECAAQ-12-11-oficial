<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

// usuário deve estar logado
$id_usuario = $_SESSION['id_usuario'] ?? null;
if (!$id_usuario) {
    http_response_code(401);
    echo json_encode(['status'=>'error','message'=>'Faça login para finalizar a compra.']);
    exit;
}

$cart = $_SESSION['cart'] ?? [];
if (empty($cart)) {
    http_response_code(400);
    echo json_encode(['status'=>'error','message'=>'Carrinho vazio.']);
    exit;
}

// DB
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

// bloquear e checar estoque usando SELECT ... FOR UPDATE dentro de transação
$ids = array_keys($cart);
$placeholders = implode(',', array_fill(0, count($ids), '?'));
$sql = "SELECT id_anuncio, preco, quantidade_estoque FROM anuncio WHERE id_anuncio IN ($placeholders) FOR UPDATE";

$stmt = $conn->prepare($sql);
$types = str_repeat('i', count($ids));
$stmt->bind_param($types, ...$ids);

$conn->begin_transaction();
try {
    $stmt->execute();
    $res = $stmt->get_result();
    $anuncios = [];
    while ($row = $res->fetch_assoc()) {
        $anuncios[(int)$row['id_anuncio']] = $row;
    }
    $stmt->close();

    // valida estoque
    foreach ($cart as $id => $qtd) {
        $available = isset($anuncios[$id]) ? (int)$anuncios[$id]['quantidade_estoque'] : 0;
        if ($qtd > $available) {
            throw new Exception("Estoque insuficiente para o anúncio $id (solicitado: $qtd, disponível: $available).");
        }
    }

    // calcula valor_total
    $valor_total = 0.0;
    foreach ($cart as $id => $qtd) {
        $valor_total += ((float)$anuncios[$id]['preco']) * $qtd;
    }

    // insere pedido (status inicial AguardandoPagamento)
    $stmtIns = $conn->prepare("INSERT INTO pedidos (id_usuario_comprador, data_pedido, status, valor_total, valor_frete, endereco_entrega_id, observacoes) VALUES (?, NOW(), 'AguardandoPagamento', ?, 0.00, NULL, NULL)");
    if (!$stmtIns) throw new Exception("Erro prepare pedidos: ".$conn->error);
    $stmtIns->bind_param("id", $id_usuario, $valor_total);
    if (!$stmtIns->execute()) throw new Exception("Erro inserir pedido: ".$stmtIns->error);
    $id_pedido = $stmtIns->insert_id;
    $stmtIns->close();

    // insere itens e atualiza estoque
    $stmtInsItem = $conn->prepare("INSERT INTO itens_pedido (id_pedido, id_anuncio, quantidade, preco_unitario_venda) VALUES (?, ?, ?, ?)");
    if (!$stmtInsItem) throw new Exception("Erro prepare itens_pedido: ".$conn->error);

    $stmtUpdStock = $conn->prepare("UPDATE anuncio SET quantidade_estoque = quantidade_estoque - ? WHERE id_anuncio = ?");
    if (!$stmtUpdStock) throw new Exception("Erro prepare update estoque: ".$conn->error);

    foreach ($cart as $id => $qtd) {
        $preco = (float)$anuncios[$id]['preco'];
        $stmtInsItem->bind_param("iiid", $id_pedido, $id, $qtd, $preco);
        if (!$stmtInsItem->execute()) throw new Exception("Erro inserir item: ".$stmtInsItem->error);

        $stmtUpdStock->bind_param("ii", $qtd, $id);
        if (!$stmtUpdStock->execute()) throw new Exception("Erro atualizar estoque: ".$stmtUpdStock->error);
    }

    $stmtInsItem->close();
    $stmtUpdStock->close();

    $conn->commit();

    // limpa carrinho da sessão
    unset($_SESSION['cart']);

    echo json_encode(['status'=>'ok','sucesso'=>true,'id_pedido'=>$id_pedido]);

} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(['status'=>'error','message'=>$e->getMessage()]);
}

$conn->close();
