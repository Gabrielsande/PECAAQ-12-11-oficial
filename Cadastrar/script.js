const form = document.getElementById("formCadastro");
const tipoSelect = document.getElementById("tipoCadastro");
const campoCpfCnpj = document.getElementById("campoCpfCnpj");
const confirmarSenha = document.getElementById("confirmarSenha");

// Funções para validar CPF e CNPJ
function validaCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(cpf[i]) * (10 - i);
    let resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    if (resto !== parseInt(cpf[9])) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) soma += parseInt(cpf[i]) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    return resto === parseInt(cpf[10]);
}

function validaCNPJ(cnpj) {
    cnpj = cnpj.replace(/\D/g, '');
    if (cnpj.length !== 14) return false;

    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    let digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
        soma += numeros[tamanho - i] * pos--;
        if (pos < 2) pos = 9;
    }
    let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado != digitos[0]) return false;

    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) {
        soma += numeros[tamanho - i] * pos--;
        if (pos < 2) pos = 9;
    }
    resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    return resultado == digitos[1];
}

// Alteração dinâmica de CPF/CNPJ sem recriar input
tipoSelect.addEventListener("change", () => {
    const input = campoCpfCnpj.querySelector('input[name="cpf_cnpj"]');
    const label = campoCpfCnpj.querySelector('label');

    if (tipoSelect.value === "Cliente") {
        label.textContent = "CPF";
        input.placeholder = "Somente números";
    } else {
        label.textContent = "CNPJ";
        input.placeholder = "00.000.000/0000-00";
    }
});

// Validação de senha, CPF/CNPJ e envio via fetch
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const senha = form.senha.value;
    const confirmar = confirmarSenha.value;
    const inputCpfCnpj = form.querySelector('input[name="cpf_cnpj"]');
    const cpf_cnpj = inputCpfCnpj.value.replace(/\D/g, '');
    const tipo = tipoSelect.value;

    // Validação de senha
    if (senha !== confirmar) {
        alert("As senhas não coincidem!");
        return;
    }

    // Validação de CPF/CNPJ
    if (tipo === "Cliente" && !validaCPF(cpf_cnpj)) {
        alert("CPF inválido!");
        return;
    }

    if (tipo === "Empresa" && !validaCNPJ(cpf_cnpj)) {
        alert("CNPJ inválido!");
        return;
    }

    // Envio via fetch
    const dados = new FormData(form);
    try {
        const resposta = await fetch("cadastrar.php", {
            method: "POST",
            body: dados
        });

        const texto = await resposta.text();
        alert(texto);
        if (texto.includes("sucesso")) {
            form.reset();
        }
    } catch (erro) {
        alert("Erro ao conectar com o servidor!");
        console.error(erro);
    }
});
