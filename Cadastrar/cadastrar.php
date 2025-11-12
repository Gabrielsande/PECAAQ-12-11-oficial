<?php
session_start();

// Config DB
$servidor = "localhost";
$usuario = "root";
$senha = "";
$banco = "pecaaq"; // ajuste se for diferente

$conn = new mysqli($servidor, $usuario, $senha, $banco);
if ($conn->connect_error) {
    die("Erro na conexão: " . $conn->connect_error);
}

// Recebe dados do formulário (usa null coalescing para evitar notices)
$tipo = $_POST['tipo'] ?? '';
$nome = trim($_POST['nome'] ?? '');
$email = trim($_POST['email'] ?? '');
$senha = $_POST['senha'] ?? '';
$cpf_cnpj_raw = $_POST['cpf_cnpj'] ?? '';
$telefone = trim($_POST['telefone'] ?? '');

// Campos extras para empresas (opcionais no form)
$nome_fantasia = trim($_POST['nome_fantasia'] ?? '');
$razao_social = trim($_POST['razao_social'] ?? '');

// Normaliza documento (apenas dígitos)
$cpf_cnpj = preg_replace('/\D/', '', $cpf_cnpj_raw);

// Validações
function validaCPF($cpf) {
    if (strlen($cpf) != 11 || preg_match('/(\d)\1{10}/', $cpf)) return false;
    for ($t = 9; $t < 11; $t++) {
        for ($d = 0, $c = 0; $c < $t; $c++) $d += $cpf[$c] * (($t + 1) - $c);
        $d = ((10 * $d) % 11) % 10;
        if ($cpf[$c] != $d) return false;
    }
    return true;
}

function validaCNPJ($cnpj) {
    if (strlen($cnpj) != 14) return false;
    $soma1 = $soma2 = 0;
    $pesos1 = [5,4,3,2,9,8,7,6,5,4,3,2];
    $pesos2 = [6,5,4,3,2,9,8,7,6,5,4,3,2];
    for ($i=0;$i<12;$i++) $soma1 += $cnpj[$i]*$pesos1[$i];
    $d1 = ($soma1%11<2)?0:11-($soma1%11);
    for ($i=0;$i<13;$i++) $soma2 += $cnpj[$i]*$pesos2[$i];
    $d2 = ($soma2%11<2)?0:11-($soma2%11);
    return ($cnpj[12]==$d1 && $cnpj[13]==$d2);
}

// Validação básica dos campos obrigatórios
if (empty($tipo) || empty($nome) || empty($email) || empty($senha) || empty($cpf_cnpj)) {
    die("⚠ Preencha todos os campos obrigatórios!");
}

// Valida email básico
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    die("Email inválido!");
}

// Criptografa a senha
$senha_hash = password_hash($senha, PASSWORD_DEFAULT);

// Começa transaction (para garantir consistência quando criar fornecedor)
$conn->begin_transaction();

try {
    // Insere em usuarios (campo documento unifica cpf/cnpj)
    $stmtUser = $conn->prepare("
        INSERT INTO usuarios (tipo, nome_razao_social, email, senha_hash, documento, telefone, data_cadastro)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
    ");

    if (!$stmtUser) throw new Exception("Erro prepare usuarios: " . $conn->error);

    // Define tipo padrão coerente com novo modelo: 'Cliente' ou 'Fornecedor'
    $tipo_usuario = ($tipo === 'Empresa' || strtolower($tipo) === 'fornecedor') ? 'Fornecedor' : 'Cliente';

    $stmtUser->bind_param("ssssss", $tipo_usuario, $nome, $email, $senha_hash, $cpf_cnpj, $telefone);

    if (!$stmtUser->execute()) {
        throw new Exception("Erro ao cadastrar usuário: " . $stmtUser->error);
    }

    $id_usuario = $stmtUser->insert_id;
    $stmtUser->close();

    // Se for fornecedor/empresa, cria registro em fornecedores (usa nome_fantasia/razao_social se existirem)
    if ($tipo_usuario === 'Fornecedor') {
        if (!validaCNPJ($cpf_cnpj)) {
            // rollback e erro
            $conn->rollback();
            die("CNPJ inválido!");
        }

        // Usa campos optionais quando disponíveis
        $nomeFantasia = $nome_fantasia ?: $nome;
        $razaoSocial = $razao_social ?: $nome;
        $emailComercial = $email;
        $telefoneComercial = $telefone;
        $cnpj = $cpf_cnpj;

        $stmtFor = $conn->prepare("
            INSERT INTO fornecedores
            (id_usuario_representante, nome_fantasia, razao_social, cnpj, email_comercial, telefone_comercial, status, data_criacao)
            VALUES (?, ?, ?, ?, ?, ?, 'em_aprovacao', NOW())
        ");
        if (!$stmtFor) throw new Exception("Erro prepare fornecedores: " . $conn->error);

        $stmtFor->bind_param("isssss", $id_usuario, $nomeFantasia, $razaoSocial, $cnpj, $emailComercial, $telefoneComercial);

        if (!$stmtFor->execute()) {
            throw new Exception("Erro ao cadastrar fornecedor: " . $stmtFor->error);
        }
        $stmtFor->close();
    } else {
        // Cliente: valida CPF
        if (!validaCPF($cpf_cnpj)) {
            $conn->rollback();
            die("CPF inválido!");
        }
    }

    // commit
    $conn->commit();

    echo "<h3>Cadastro de $tipo_usuario realizado com sucesso!</h3>";
    echo "<a href='../Login/indexLogin.html'>Voltar para o login</a>";

} catch (Exception $e) {
    $conn->rollback();
    // log do erro se quiser: error_log($e->getMessage());
    die("Erro no cadastro: " . $e->getMessage());
}

$conn->close();
?>