// ===== scriptComprar.js (VERSÃO LIMPADA E CORRIGIDA) =====

// ----------------- Estado global -----------------
let currentProduct = null;
let carrinho = []; // array de itens { id_anuncio, titulo, preco, quantidade }
const LOCAL_CART_KEY = 'localCart';

// elementos cache
const listaCarrinhoEl = document.getElementById("listaCarrinho");
const qtdCarrinhoEl = document.getElementById("qtdCarrinho");
const totalCarrinhoEl = document.getElementById("totalCarrinho");
const cartCountBadge = document.getElementById("cart-count");

// ----------------- Helpers -----------------
function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function safeParseJSON(s, fallback = null) {
  try { return JSON.parse(s); } catch (e) { return fallback; }
}

// ----------------- Produto / UI da página -----------------
function preencherDOMComProduto(p) {
  if (!p) return;
  const imgEl = document.querySelector('.produto-imagem img');
  if (imgEl && p.image) { imgEl.src = p.image; imgEl.alt = p.titulo || 'Produto'; }

  const idInput = document.getElementById('id_anuncio');
  if (idInput) idInput.value = p.id_anuncio || '';

  const tituloEl = document.querySelector('.produto-detalhes h1');
  if (tituloEl) tituloEl.textContent = p.titulo || '';

  const spans = document.querySelectorAll('.produto-detalhes .marca span');
  if (spans.length) {
    if (spans[0]) spans[0].textContent = p.marca || '';
    if (spans[1]) spans[1].textContent = p.sku || (p.referencia || '');
  }

  const precoEl = document.querySelector('.preco .preco-avista');
  if (precoEl) precoEl.textContent = 'R$ ' + (Number(p.preco || 0).toFixed(2).replace('.', ',') + ' à vista');

  const parcelaEl = document.querySelector('.preco .parcelamento');
  if (parcelaEl) {
    const parcelas = p.parcelas || 3;
    parcelaEl.textContent = `Em até ${parcelas}x R$ ${(Number(p.preco || 0)/parcelas).toFixed(2).replace('.', ',')} sem juros`;
  }

  const h3 = document.querySelector('.produto-detalhes h3');
  if (h3 && h3.nextElementSibling && p.descricao) h3.nextElementSibling.textContent = p.descricao;

  aplicarZoomImagem();
}

function mostrarErroProdutoNaoEncontrado() {
  const container = document.querySelector('.checkout-container') || document.body;
  container.innerHTML = '<p style="padding:20px;">Produto não encontrado. Volte ao catálogo.</p>';
}

// ----------------- Zoom imagem -----------------
function aplicarZoomImagem() {
  const produtoImg = document.querySelector(".produto-imagem img");
  if (!produtoImg) return;
  produtoImg.onmousemove = null;
  produtoImg.onmouseleave = null;

  produtoImg.addEventListener("mousemove", function (e) {
    const { left, top, width, height } = this.getBoundingClientRect();
    const x = ((e.pageX - left) / width) * 100;
    const y = ((e.pageY - top) / height) * 100;
    this.style.transformOrigin = `${x}% ${y}%`;
    this.style.transform = "scale(2)";
  });

  produtoImg.addEventListener("mouseleave", function () {
    this.style.transformOrigin = "center center";
    this.style.transform = "scale(1)";
  });
}

// ----------------- Fetch produto -----------------
async function fetchProductById(id) {
  try {
    const resp = await fetch(`get_product.php?id=${encodeURIComponent(id)}`);
    if (!resp.ok) throw new Error('Produto não encontrado no servidor');
    const p = await resp.json();
    return {
      id_anuncio: Number(p.id_produto),
      titulo: p.nome,
      preco: Number(p.preco),
      image: "../DashBoard/uploads/" + (p.foto_principal || ''),
      descricao: p.descricao_tecnica || '',
      sku: p.sku_universal || '',
      marca: p.marca || '',
      categoria: p.categoria || '',
      parcelas: 10
    };
  } catch (err) {
    console.warn('fetchProductById error:', err);
    throw err;
  }
}

async function loadProduct() {
  const id = getQueryParam('id');
  if (id) {
    try {
      const p = await fetchProductById(id);
      currentProduct = p;
      try { localStorage.setItem('selectedProduct', JSON.stringify(p)); } catch(e){}
      preencherDOMComProduto(currentProduct);
      return;
    } catch (e) {
      console.warn('Erro ao buscar por id, tentando fallback localStorage');
    }
  }

  const raw = localStorage.getItem('selectedProduct');
  if (raw) {
    try {
      const p = JSON.parse(raw);
      currentProduct = {
        id_anuncio: p.id_anuncio || p.id || null,
        titulo: p.titulo || p.title,
        preco: p.preco || p.price,
        image: p.image || p.foto || '',
        descricao: p.descricao || ''
      };
      preencherDOMComProduto(currentProduct);
      return;
    } catch (e) {
      console.warn('Erro parse localStorage.selProd', e);
    }
  }

  mostrarErroProdutoNaoEncontrado();
}

// ----------------- Carrinho (local) -----------------
function persistCart() {
  try { localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(carrinho)); } catch(e){ console.warn(e); }
}

function loadCartFromStorage() {
  const raw = localStorage.getItem(LOCAL_CART_KEY);
  const parsed = safeParseJSON(raw, []);
  if (Array.isArray(parsed)) carrinho = parsed;
  else carrinho = [];
}

function atualizarCarrinhoUI() {
  // atualiza badge e modal listado (se existir)
  const badgeCount = carrinho.reduce((s,i)=>s + (i.quantidade||0), 0);
  if (cartCountBadge) cartCountBadge.innerText = badgeCount || 0;

  // atualiza lista no modal se existe
  if (!listaCarrinhoEl) return;
  listaCarrinhoEl.innerHTML = '';
  let total = 0;
  carrinho.forEach((item, idx) => {
    const li = document.createElement('li');
    li.className = 'carrinho-item';
    li.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
        <div style="flex:1;">
          <strong>${item.titulo}</strong><br/>
          Qtd: ${item.quantidade} — R$ ${Number(item.preco).toFixed(2)}
        </div>
        <div>
          <button class="remover-item" data-index="${idx}" aria-label="Remover item">Remover</button>
        </div>
      </div>
    `;
    listaCarrinhoEl.appendChild(li);
    total += (item.preco * item.quantidade);
  });

  if (qtdCarrinhoEl) qtdCarrinhoEl.textContent = carrinho.length;
  if (totalCarrinhoEl) totalCarrinhoEl.textContent = total.toFixed(2);
}

// adicionar produto atual
function adicionarProdutoAtualAoCarrinho() {
  if (!currentProduct || !currentProduct.id_anuncio) {
    console.warn('Produto não carregado corretamente.');
    return;
  }
  const quantidadeSelect = document.getElementById('quantidade');
  const quantidade = quantidadeSelect ? parseInt(quantidadeSelect.value,10) : 1;
  const existente = carrinho.find(i => i.id_anuncio === currentProduct.id_anuncio);
  if (existente) existente.quantidade += quantidade;
  else {
    carrinho.push({
      id_anuncio: currentProduct.id_anuncio,
      titulo: currentProduct.titulo,
      preco: Number(currentProduct.preco || 0),
      quantidade
    });
  }
  persistCart();
  atualizarCarrinhoUI();
  // opcional: enviar para endpoint do servidor de sessão/carrinho (silencioso)
  fetch('/carrinho/add_to_cart.php', {
    method: 'POST',
    headers: {'Content-Type':'application/x-www-form-urlencoded'},
    body: `id_anuncio=${encodeURIComponent(currentProduct.id_anuncio)}&quantidade=${encodeURIComponent(quantidade)}`
  }).then(r=>r.json()).then(j=>{ if (j && j.status === 'ok') console.log('adicionado no server'); }).catch(()=>{});
}

// adicionar pelos cards semelhantes
function setupAdicionarSemelhantes() {
  document.querySelectorAll('.btn-adicionar').forEach(btn => {
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const id = btn.dataset.id ? parseInt(btn.dataset.id,10) : null;
      const nome = btn.dataset.nome || btn.closest('.card')?.querySelector('p')?.textContent || 'Produto';
      const preco = Number(btn.dataset.preco || btn.dataset.price || 0);
      if (!id) {
        carrinho.push({ id_anuncio: Date.now(), titulo: nome, preco, quantidade: 1 });
      } else {
        const existente = carrinho.find(i => i.id_anuncio === id);
        if (existente) existente.quantidade += 1;
        else carrinho.push({ id_anuncio: id, titulo: nome, preco, quantidade: 1 });
      }
      persistCart();
      atualizarCarrinhoUI();
    });
  });
}

// remover item (delegação)
if (listaCarrinhoEl) {
  listaCarrinhoEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.remover-item');
    if (!btn) return;
    const idx = Number(btn.dataset.index);
    if (!Number.isNaN(idx)) {
      carrinho.splice(idx, 1);
      persistCart();
      atualizarCarrinhoUI();
    }
  });
}

// ----------------- Inicialização DOMContentLoaded -----------------
document.addEventListener('DOMContentLoaded', () => {
  // carrega produto / carrinho / setup handlers
  loadProduct().catch(err => console.warn('Erro loadProduct:', err));
  loadCartFromStorage();
  atualizarCarrinhoUI();

  // add-to-cart btn (página do produto)
  const addToCartBtn = document.getElementById('add-to-cart');
  if (addToCartBtn) addToCartBtn.addEventListener('click', (e) => {
    adicionarProdutoAtualAoCarrinho();
    console.log(`Produto "${currentProduct?.titulo}" adicionado ao carrinho.`);
  });

  // setup carrossel
  setupAdicionarSemelhantes();

  // btn "COMPRAR AGORA" (abre modal pagamento)
  const btnFinalizar = document.getElementById('btn-finalizar');
  if (btnFinalizar) btnFinalizar.addEventListener('click', (e) => { e.preventDefault(); abrirModalPagamento(); });

  // inicializa handlers de modal e carrinho
  connectModalHandlers(); // definida abaixo
  initCartModalHelpers(); // definida abaixo
});

// ----------------- Modais (pagamento / endereço / sucesso) -----------------

function ensureModalMovedToBody(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  if (el.parentNode !== document.body) document.body.appendChild(el);
  return el;
}

function openModal(modalEl) {
  if (!modalEl) return;
  modalEl.classList.add('show');
  modalEl.style.display = 'flex';
  document.body.classList.add('modal-open');
  const mc = modalEl.querySelector('.modal-content');
  if (mc) { mc.setAttribute('tabindex','-1'); mc.focus(); mc.style.pointerEvents = 'auto'; }
}

function closeModal(modalEl) {
  if (!modalEl) return;
  modalEl.classList.remove('show');
  modalEl.style.display = 'none';
  document.body.classList.remove('modal-open');
}

// conecta os handlers dos modais (fechar, overlay, ESC, métodos)
function connectModalHandlers() {
  // garante overlays no body
  ensureModalMovedToBody('modal-pagamento');
  ensureModalMovedToBody('modal-endereco');
  ensureModalMovedToBody('modal-sucesso');
  ensureModalMovedToBody('carrinhoModal');

  // pagamento
  const modalPagamento = document.getElementById('modal-pagamento');
  if (modalPagamento) {
    const btnClose = document.getElementById('fechar');
    if (btnClose) btnClose.addEventListener('click', (e)=>{ e.preventDefault(); closeModal(modalPagamento); });

    modalPagamento.addEventListener('click', (e) => {
      if (e.target === modalPagamento) closeModal(modalPagamento);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalPagamento.classList.contains('show')) closeModal(modalPagamento);
    });

    // métodos
    document.querySelectorAll('.metodo').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('pagamento-cartao')?.classList.add('hidden');
        document.getElementById('pagamento-pix')?.classList.add('hidden');
        if (btn.dataset.metodo === 'cartao') document.getElementById('pagamento-cartao')?.classList.remove('hidden');
        if (btn.dataset.metodo === 'pix') document.getElementById('pagamento-pix')?.classList.remove('hidden');
      });
    });
  }

  // endereco modal close buttons
  const fecharEndereco = document.getElementById('fechar-endereco');
  if (fecharEndereco) fecharEndereco.addEventListener('click', (e)=>{ e.preventDefault(); closeModal(document.getElementById('modal-endereco')); });

  const fecharSucesso = document.getElementById('fechar-sucesso');
  if (fecharSucesso) fecharSucesso.addEventListener('click', (e)=>{ e.preventDefault(); closeModal(document.getElementById('modal-sucesso')); });
}

// abrir/fechar payment modal (API pública usada por outros handlers)
function abrirModalPagamento() {
  const modalPagamento = document.getElementById('modal-pagamento');
  if (!modalPagamento) return console.warn('modal-pagamento não encontrado');
  // hide internal forms
  document.getElementById('pagamento-cartao')?.classList.add('hidden');
  document.getElementById('pagamento-pix')?.classList.add('hidden');
  openModal(modalPagamento);
}

function abrirModalEndereco() { openModal(document.getElementById('modal-endereco')); }
function mostrarSucessoPedido(codigo) {
  const modalSucesso = document.getElementById('modal-sucesso');
  const span = document.getElementById('codigo-rastreio');
  if (span) span.textContent = codigo || gerarCodigoRastreio();
  // fechar outros
  closeModal(document.getElementById('modal-pagamento'));
  closeModal(document.getElementById('modal-endereco'));
  openModal(modalSucesso);
}

// ----------------- Validações simples -----------------
function validarCartao() {
  const num = document.getElementById('num-cartao')?.value.replace(/\s+/g,'') || '';
  const nome = document.getElementById('nome-cartao')?.value.trim() || '';
  const validade = document.getElementById('validade-cartao')?.value.trim() || '';
  const cvv = document.getElementById('cvv-cartao')?.value.trim() || '';

  if (num.length < 13 || !/^\d+$/.test(num)) { alert('Digite um número de cartão válido'); return false; }
  if (!nome) { alert('Digite o nome do titular'); return false; }
  if (!/^\d{2}\/\d{2}$/.test(validade)) { alert('Validade inválida. Use MM/AA'); return false; }
  if (!/^\d{3,4}$/.test(cvv)) { alert('CVV inválido'); return false; }
  return true;
}

function gerarCodigoRastreio() {
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numeros = '0123456789';
  const rand = s => s.charAt(Math.floor(Math.random()*s.length));
  let code = rand(letras)+rand(letras);
  for (let i=0;i<9;i++) code += rand(numeros);
  code += rand(letras)+rand(letras);
  return code;
}

// ----------------- Handlers pagamento / checkout (servidor) -----------------

// util: envia carrinho local para sessão do servidor (save_session_cart.php)
async function sendCartToSession(localCart) {
  const url = '/carrinho/save_session_cart.php';
  const payload = JSON.stringify(localCart);
  const form = new URLSearchParams();
  form.set('cart', payload);

  const resp = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type':'application/x-www-form-urlencoded'},
    body: form.toString(),
    credentials: 'same-origin'
  });
  return resp.json();
}

// chama checkout.php (servidor processa pedido baseado na session)
async function callCheckoutOnServer() {
  const resp = await fetch('/checkout.php', {
    method: 'POST',
    headers: {'Accept':'application/json'},
    credentials: 'same-origin'
  });
  const json = await resp.json();
  if (!resp.ok) throw new Error(json.message || 'Erro no checkout.');
  return json;
}

// fluxo que envia cart -> chama checkout -> trata resposta
async function processarPagamentoFlow() {
  try {
    const localCart = carrinho || safeParseJSON(localStorage.getItem(LOCAL_CART_KEY), []);
    if (!localCart || localCart.length === 0) { alert('Seu carrinho está vazio.'); return; }

    // desativa botões para evitar double-click
    const btnCartao = document.getElementById('btn-pagar-cartao');
    const btnPix = document.getElementById('btn-pagar-pix');
    if (btnCartao) btnCartao.disabled = true;
    if (btnPix) btnPix.disabled = true;

    // 1) envia carrinho para sessão do servidor
    const saveRes = await sendCartToSession(localCart);
    if (!saveRes || saveRes.status !== 'ok') throw new Error(saveRes?.message || 'Falha ao enviar carrinho para sessão.');

    // 2) chama checkout.php
    const checkoutRes = await callCheckoutOnServer();

    // 3) sucesso: limpar carrinho local e mostrar modal sucesso
    if (checkoutRes.status === 'ok' && checkoutRes.id_pedido) {
      const idPedido = checkoutRes.id_pedido;
      const rast = 'PE' + String(idPedido).padStart(8,'0');
      // limpa
      carrinho = [];
      persistCart();
      atualizarCarrinhoUI();
      // mostra sucesso
      mostrarSucessoPedido(rast);
    } else {
      throw new Error(checkoutRes?.message || 'Erro no servidor ao criar pedido.');
    }
  } catch (err) {
    console.error('Erro no fluxo de pagamento:', err);
    alert('Erro ao finalizar compra: ' + (err.message || err));
  } finally {
    const btnCartao = document.getElementById('btn-pagar-cartao');
    const btnPix = document.getElementById('btn-pagar-pix');
    if (btnCartao) btnCartao.disabled = false;
    if (btnPix) btnPix.disabled = false;
  }
}

// Conectar botões do fluxo:
(function connectPaymentButtons() {
  // Pagar com cartão (valida e mostra modal endereço)
  document.getElementById('btn-pagar-cartao')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (!validarCartao()) return;
    abrirModalEndereco();
  });

  // Pagar com Pix (abre modal endereco direto)
  document.getElementById('btn-pagar-pix')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (!confirm('Confirmar pagamento via Pix?')) return;
    abrirModalEndereco();
  });

  // Submit do endereco (aqui finalizamos: enviamos para servidor)
  document.getElementById('form-endereco')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rua = document.getElementById('rua')?.value.trim();
    const numero = document.getElementById('numero')?.value.trim();
    const bairro = document.getElementById('bairro')?.value.trim();
    const cidade = document.getElementById('cidade')?.value.trim();
    const cepEndereco = document.getElementById('cep-endereco')?.value.trim();

    if (!rua || !numero || !bairro || !cidade || !cepEndereco) {
      alert('Por favor, preencha todos os campos do endereço.');
      return;
    }

    // Real flow -> envia carrinho para sessão e chama checkout.php
    await processarPagamentoFlow();
  });

  // botão que abre modal-pagamento a partir do carrinho modal
  document.getElementById('btn-checkout')?.addEventListener('click', (e) => {
    e.preventDefault();
    abrirModalPagamento();
  });

  // botão fechar do modal-sucesso já no HTML: fecha e limpa foco
  document.getElementById('btn-fechar-sucesso')?.addEventListener('click', () => {
    closeModal(document.getElementById('modal-sucesso'));
  });
})();

// ----------------- Helpers para o modal do carrinho -----------------
function initCartModalHelpers() {
  const btnCarrinho = document.getElementById('btnCarrinho');
  const carrinhoModal = document.getElementById('carrinhoModal');
  const fecharCarrinho = document.getElementById('fecharCarrinho');

  // abrir modal do carrinho
  function openCartModal(){
    if (!carrinhoModal) return console.warn('carrinhoModal não encontrado');
    atualizarCarrinhoUI();
    openModal(carrinhoModal);
  }

  function closeCartModal(){
    closeModal(carrinhoModal);
  }

  if (btnCarrinho) btnCarrinho.addEventListener('click', (e) => { e.preventDefault(); openCartModal(); });
  if (fecharCarrinho) fecharCarrinho.addEventListener('click', (e) => { e.preventDefault(); closeCartModal(); });

  if (carrinhoModal) {
    carrinhoModal.addEventListener('click', (e) => { if (e.target === carrinhoModal) closeCartModal(); });
    const mc = carrinhoModal.querySelector('.modal-content');
    if (mc) mc.addEventListener('click', e => e.stopPropagation());
  }
  // botão "Finalizar compra" dentro do modal do carrinho
const btnFinalizarCompra = document.getElementById('btn-checkout');
if (btnFinalizarCompra) {
  btnFinalizarCompra.addEventListener('click', (e) => {
    e.preventDefault();
    if (carrinho.length === 0) {
      alert('Seu carrinho está vazio.');
      return;
    }
    // fecha o modal do carrinho e abre o de pagamento
    closeModal(carrinhoModal);
    abrirModalPagamento();
  });
}

}

// ----------------- Final: export/adapters para uso em outras partes do código -----------------
// se algum outro script espera window.adicionarProdutoAtualAoCarrinho, expomos:
window.adicionarProdutoAtualAoCarrinho = adicionarProdutoAtualAoCarrinho;
window.atualizarCarrinhoUI = atualizarCarrinhoUI;
window.carrinhoLocal = () => carrinho;

document.addEventListener('DOMContentLoaded', () => {
    const perfilContainer = document.getElementById('perfil-container');
    const loginLink = document.getElementById('loginLink');
    const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));

    if (usuario) {
      // Mostra nome/ícone de perfil
      perfilContainer.innerHTML = `
        <div class="perfil-info">
          <img src="../Login/imgLogin/perfil.png" alt="Perfil" class="perfil-icon">
          <span>${usuario.nome}</span>
          <button id="logoutBtn">Sair</button>
        </div>
      `;

      // botão de sair
      document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('usuarioLogado');
        window.location.reload();
      });
    }
  });
