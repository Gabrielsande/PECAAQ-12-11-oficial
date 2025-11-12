<?php
// Empresas/listarProdutos_json.php
header('Content-Type: application/json; charset=utf-8');

$servidor = "localhost";
$usuario = "root";
$senha = "";
$banco = "pecaaq";

$conn = new mysqli($servidor, $usuario, $senha, $banco);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['status'=>'error','message'=>'Erro de conexão: '.$conn->connect_error]);
    exit;
}

$sql = "SELECT id_produto, id_categoria, nome, sku_universal, marca, descricao_tecnica, foto_principal, preco, categoria, data_cadastro FROM produtos ORDER BY id_produto DESC";
$result = $conn->query($sql);

$produtos = [];
$uploads_prefix = '../DashBoard/uploads/'; // ajuste se o caminho real for outro

if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $foto = $row['foto_principal'] ? $uploads_prefix . $row['foto_principal'] : null;
        $produtos[] = [
            'id_produto' => (int)$row['id_produto'],
            'id_categoria' => $row['id_categoria'],
            'nome' => $row['nome'],
            'sku_universal' => $row['sku_universal'],
            'marca' => $row['marca'],
            'descricao_tecnica' => $row['descricao_tecnica'],
            'foto_principal' => $foto,
            'preco' => $row['preco'],
            'categoria' => $row['categoria'],
            'data_cadastro' => $row['data_cadastro']
        ];
    }
}

echo json_encode(['status'=>'ok','produtos'=>$produtos], JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);
$conn->close();
