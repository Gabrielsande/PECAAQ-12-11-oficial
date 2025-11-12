<?php
header('Content-Type: application/json; charset=utf-8');

$host = "localhost";
$user = "root";
$pass = "";
$db   = "pecaaq";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
  die(json_encode(["status"=>"error","message"=>"Erro de conexão."]));
}

$id = intval($_GET['id'] ?? 0);
if ($id <= 0) {
  echo json_encode(["status"=>"error","message"=>"ID inválido."]);
  exit;
}

$sql = "SELECT * FROM produtos WHERE id_produto = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $id);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows > 0) {
  echo json_encode(["status"=>"ok","produto"=>$res->fetch_assoc()]);
} else {
  echo json_encode(["status"=>"error","message"=>"Produto não encontrado."]);
}

$stmt->close();
$conn->close();
?>
