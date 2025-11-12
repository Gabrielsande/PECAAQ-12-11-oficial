<?php
// Login/logout.php
session_start();
header('Content-Type: application/json; charset=utf-8');

// Força destruir sessão
$_SESSION = [];
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}
session_destroy();

// Resposta amigável (o front-end pode recarregar ou tratar)
echo json_encode(['status'=>'ok','message'=>'Desconectado']);
exit;
