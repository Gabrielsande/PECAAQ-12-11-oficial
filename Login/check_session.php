<?php
// Login/check_session.php
session_start();
header('Content-Type: application/json; charset=utf-8');

// Responde { logado: true|false, id: ..., nome: ..., tipo: ... }
if (!empty($_SESSION['id_usuario'])) {
    echo json_encode([
        'logado' => true,
        'id' => $_SESSION['id_usuario'],
        'nome' => $_SESSION['nome_razao_social'] ?? '',
        'tipo' => $_SESSION['tipo_usuario'] ?? ''
    ]);
} else {
    echo json_encode(['logado' => false]);
}
exit;
