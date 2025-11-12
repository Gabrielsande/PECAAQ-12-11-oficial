// ===============================
// UTILIDADES
// ===============================
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

// ===============================
// ANO NO FOOTER
// ===============================
const yearEl = $("#year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ===============================
// MENU MOBILE
// ===============================
const toggle = $(".nav__toggle");
const nav = $(".nav");
if (toggle) {
  toggle.addEventListener("click", () => {
    const open = nav.style.display === "flex";
    nav.style.display = open ? "none" : "flex";
    toggle.setAttribute("aria-expanded", String(!open));
  });
}

// ===============================
// PERFIL, LOGIN E LOGOUT
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const perfilContainer = document.getElementById("perfil-container");
  const userArea = document.getElementById("user-area");
  const usuarioData = localStorage.getItem("usuarioLogado");

  if (!usuarioData) {
    // Sem login → mostrar botão de cadastro
    if (userArea) {
      userArea.textContent = "Faça seu cadastro";
      userArea.classList.add("btnCadastro");
      userArea.onclick = () => window.location.href = "../Cadastro/index.html"; // ajustar rota
    }
    return;
  }

  try {
    const usuario = JSON.parse(usuarioData);

    if (usuario && usuario.tipo) {
      // Botão principal do header
      if (userArea) {
        userArea.textContent = "Perfil";
        userArea.style.padding = "0.5rem 1rem";
        userArea.style.borderRadius = "6px";
        userArea.style.cursor = "pointer";
        userArea.style.color = "#fff";
        userArea.style.fontWeight = "600";
        userArea.style.transition = "0.3s";

        if (usuario.tipo.toLowerCase() === "empresa" || usuario.tipo.toLowerCase() === "fornecedor") {
          userArea.style.backgroundColor = "#f39c12"; // Laranja empresa
          userArea.onclick = () => window.location.href = "../DashBoard/index.html";
        } else {
          userArea.style.backgroundColor = "#27ae60"; // Verde cliente
          userArea.onclick = () => window.location.href = "../PerfilCliente/perfil_cliente.php";
        }
      }

      // Perfil dentro do container específico (se existir)
      if (perfilContainer) {
        const corClasse = usuario.tipo === "empresa" ? "btnPerfil--empresa" : "btnPerfil--cliente";

        perfilContainer.innerHTML = `
          <div class="perfil-info">
            <img src="../Login/imgLogin/perfil.png" alt="Perfil" class="perfil-icon">
            <span>${usuario.nome}</span>
            <a href="${usuario.tipo === 'empresa' ? '../empresa/dashboard.php' : '../cliente/perfilCliente.php'}" 
               class="btnPerfil ${corClasse}">
               Perfil
            </a>
            <button id="logoutBtn" class="btnSair">Sair</button>
          </div>
        `;

        // Logout
        const logoutBtn = document.getElementById("logoutBtn");
        if (logoutBtn) {
          logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("usuarioLogado");
            location.reload();
          });
        }
      }
    }
  } catch (err) {
    console.warn("Erro ao processar dados do usuário:", err);
  }
});

// ===============================
// CARROSSEL HERO
// ===============================
(function initHero() {
  const track = document.querySelector('[data-carousel="hero"]');
  if (!track) return;

  const slides = $$(".hero__slide", track);
  let index = 0;
  let timer;

  const setIndex = (i) => {
    index = (i + slides.length) % slides.length;
    track.style.transform = `translateX(${-index * 100}%)`;
  };

  const next = () => setIndex(index + 1);
  const start = () => { timer = setInterval(next, 5000); };
  const stop = () => clearInterval(timer);

  track.addEventListener("mouseenter", stop);
  track.addEventListener("mouseleave", start);

  setIndex(0);
  start();
})();