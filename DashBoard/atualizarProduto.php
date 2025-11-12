<?php
header('Content-Type: application/json; charset=utf-8');
$host = "localhost";
$user = "root";
$pass = "";
$db   = "pecaaq";

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
  die(json_encode(["status"=>"error","message"=>"Erro na conexão"]));
}

$id = $_POST['id_produto'];
$nome = $_POST['nome'];
$preco = $_POST['preco'];

// Atualiza com ou sem imagem
if (!empty($_FILES['foto']['name'])) {
  $foto_nome = uniqid() . "_" . basename($_FILES["foto"]["name"]);
  $destino = "../uploads/" . $foto_nome;
  move_uploaded_file($_FILES["foto"]["tmp_name"], $destino);

  $sql = "UPDATE produtos SET nome=?, preco=?, foto_principal=? WHERE id_produto=?";
  $stmt = $conn->prepare($sql);
  $stmt->bind_param("sdsi", $nome, $preco, $destino, $id);
} else {
  $sql = "UPDATE produtos SET nome=?, preco=? WHERE id_produto=?";
  $stmt = $conn->prepare($sql);
  $stmt->bind_param("sdi", $nome, $preco, $id);
}

if ($stmt->execute()) {
  echo json_encode(["status"=>"success","message"=>"Produto atualizado com sucesso!"]);
} else {
  echo json_encode(["status"=>"error","message"=>"Erro ao atualizar produto."]);
}

$conn->close();
?>
