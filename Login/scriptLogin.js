document.addEventListener('DOMContentLoaded', () => {
  const abas = document.querySelectorAll('.tab');
  const formLoginCliente = document.getElementById('form-cliente');
  const formLoginEmpresa = document.getElementById('form-empresa');

  // Estado inicial
  if (abas.length) abas[0].classList.add('active');
  if (formLoginCliente) formLoginCliente.style.display = 'grid';
  if (formLoginEmpresa) formLoginEmpresa.style.display = 'none';

  // Alterna entre Cliente e Empresa
  abas.forEach(tab => {
    tab.addEventListener('click', () => {
      abas.forEach(a => a.classList.remove('active'));
      tab.classList.add('active');

      const tipo = tab.dataset.tab;
      if (tipo === 'cliente') {
        formLoginCliente.style.display = 'grid';
        formLoginEmpresa.style.display = 'none';
      } else {
        formLoginEmpresa.style.display = 'grid';
        formLoginCliente.style.display = 'none';
      }
    });
  });

  // Funções de validação simples
  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validateCNPJ(cnpj) {
    return /^\d{14}$/.test(cnpj.replace(/\D/g, ''));
  }

  // Valida antes de enviar Cliente
  if (formLoginCliente) {
    formLoginCliente.addEventListener('submit', e => {
      const email = document.getElementById('email-cliente').value.trim();
      const senha = document.getElementById('senha-cliente').value.trim();

      if (!validateEmail(email)) {
        e.preventDefault();
        alert('Informe um e-mail válido para Cliente.');
      }
      if (!senha) {
        e.preventDefault();
        alert('Informe a senha.');
      }
    });
  }

  // Valida antes de enviar Empresa
  if (formLoginEmpresa) {
    formLoginEmpresa.addEventListener('submit', e => {
      const cnpj = document.getElementById('cnpj').value.trim();
      const senha = document.getElementById('senha-empresa').value.trim();

      if (!validateCNPJ(cnpj)) {
        e.preventDefault();
        alert('Informe um CNPJ válido (somente números).');
      }
      if (!senha) {
        e.preventDefault();
        alert('Informe a senha.');
      }
    });
  }
});

// Exemplo de login bem-sucedido
if (loginValido) {
  const usuario = {
    nome: document.getElementById('nome').value,
    email: document.getElementById('email').value,
    tipo: document.querySelector('input[name="tipo"]:checked')?.value || 'Cliente'
  };

  // salva no localStorage
  localStorage.setItem('usuarioLogado', JSON.stringify(usuario));

  // redireciona pra página principal
  window.location.href = "../LandingPage/indexLandingPage.html";
}
