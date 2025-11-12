<?php
// Arquivo: Produtos/processaProduto.php
header('Content-Type: application/json; charset=utf-8');

// Configuração do Banco de Dados
$host = "localhost";
$user = "root";
$pass = "";
$db   = "pecaaq";

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    echo json_encode(['status' => 'erro', 'mensagem_erro' => 'Falha na conexão com o banco de dados']);
    exit;
}

// ------------------------------------------
// 🖼️ 1. LÓGICA DE UPLOAD DE ARQUIVOS
// ------------------------------------------
$foto_nome = null;
// Define o caminho absoluto para a pasta 'uploads/' que está na mesma pasta do PHP (Produtos/)
$upload_dir = __DIR__ . '/uploads/'; 

// Verifica se o diretório existe, caso contrário, tenta criá-lo
if (!is_dir($upload_dir)) {
    // ⚠️ Se este mkdir falhar, o problema é permissão na pasta Produtos/
    mkdir($upload_dir, 0777, true);
}

if (isset($_FILES['foto']) && $_FILES['foto']['error'] === UPLOAD_ERR_OK) {
    
    $arquivo_temp = $_FILES['foto']['tmp_name'];
    $extensao = pathinfo($_FILES['foto']['name'], PATHINFO_EXTENSION);
    
    // Gera um nome único para o arquivo
    $foto_nome = uniqid('foto_') . '.' . strtolower($extensao);
    $destino = $upload_dir . $foto_nome;

    // Move o arquivo temporário
    if (!move_uploaded_file($arquivo_temp, $destino)) {
        echo json_encode(['status' => 'erro', 'mensagem_erro' => 'Falha ao mover o arquivo. Verifique as permissões da pasta uploads/']);
        exit;
    }
}
// ------------------------------------------
// FIM DA LÓGICA DE UPLOAD
// ------------------------------------------

// Recebe e sanitiza outros dados do formulário
$nome = $_POST['nome'] ?? '';
$sku  = $_POST['sku'] ?? '';
$marca = $_POST['marca'] ?? '';
$descricao = $_POST['descricao'] ?? '';
// Substitui vírgula por ponto para salvar no formato FLOAT
$preco = str_replace(',', '.', $_POST['preco'] ?? '0.00'); 
$id_categoria = 1; 
$categoria = 'Peça'; 

// Prepara e executa a query de inserção
$stmt = $conn->prepare("INSERT INTO produtos (nome, sku_universal, marca, descricao_tecnica, preco, foto_principal, id_categoria, categoria) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                        
// Os tipos ('ssssdsis') devem corresponder aos tipos das colunas no seu banco de dados
$stmt->bind_param("ssssdsis", $nome, $sku, $marca, $descricao, $preco, $foto_nome, $id_categoria, $categoria);

if ($stmt->execute()) {
    echo json_encode(['status' => 'ok', 'mensagem' => 'Produto cadastrado com sucesso!']);
} else {
    echo json_encode(['status' => 'erro', 'mensagem_erro' => 'Erro SQL: ' . $stmt->error]);
}

$stmt->close();
$conn->close();
?>