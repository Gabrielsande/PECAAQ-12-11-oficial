// =================== script.js (ATUALIZADO para usar listarProdutos.php do DashBoard) ===================
const PRODUCTS_PER_PAGE = 8;
let currentPage = 1;
let products = [];
let filtered = [];
let brandsSet = new Set();
let categoriesSet = new Set();

document.addEventListener('DOMContentLoaded', () => {
    const productsGrid = document.getElementById('productsGrid');
    const productsCount = document.getElementById('productsCount');
    const brandList = document.getElementById('brandList');
    const categoryList = document.getElementById('categoryList');
    const sortSelect = document.getElementById('sortSelect');
    const searchInput = document.getElementById('searchInput');
    const prevPage = document.getElementById('prevPage');
    const nextPage = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');
    const showMoreBrands = document.getElementById('showMoreBrands');
    const priceMin = document.getElementById('priceMin');
    const priceMax = document.getElementById('priceMax');
    const applyPrice = document.getElementById('applyPrice');
    const cartCount = document.getElementById('cartCount');

    let cart = [];

    function addToCart(p) {
        cart.push(p);
        if (cartCount) cartCount.textContent = cart.length;
        alert(`Produto "${p.title}" adicionado ao carrinho!`);
    }

    async function loadProducts() {
        try {
            // Ajuste: buscar o listarProdutos.php que está no DashBoard (conforme seu PHP)
            const resp = await fetch('../DashBoard/listarProdutos.php', { cache: 'no-store' });
            if (!resp.ok) throw new Error(`Erro HTTP: ${resp.status}`);
            const data = await resp.json();

            // Espera { status: 'ok', produtos: [...] }
            const rawList = Array.isArray(data) ? data : (Array.isArray(data.produtos) ? data.produtos : []);

            products = rawList.map(p => ({
                id: p.id_produto ?? p.id ?? null,
                title: p.nome ?? p.title ?? 'Produto',
                brand: p.marca || 'Genérica',
                category: p.categoria || 'Peças',
                price: parseFloat((p.preco ?? 0) || 0) || 0,
                model: p.sku_universal || p.sku || 'Universal',
                // usa o caminho já retornado pelo servidor (se o PHP está construindo '../DashBoard/uploads/arquivo.png')
                // Se o caminho no JSON for relativo (começa com '..' ou '/'), deixamos tal como vem.
                image: p.foto_principal ? p.foto_principal : '../Produtos/img/placeholder.png',
                parcels: 3,
                addedAt: p.data_cadastro ? new Date(p.data_cadastro).getTime() : Date.now()
            }));

            filtered = [...products];

            populateFilterSets();
            renderFilterCheckboxes();
            applyFiltersAndRender();
        } catch (err) {
            console.error('Erro ao carregar produtos:', err);
            if (productsGrid) productsGrid.innerHTML = `<div style="padding:20px;background:#fff;border-radius:10px;border:1px solid #eee;text-align:center;">Erro ao carregar produtos: ${err.message}</div>`;
        }
    }

    // ---------------- FILTERS ----------------
    function populateFilterSets() {
        brandsSet = new Set(products.map(p => p.brand));
        categoriesSet = new Set(products.map(p => p.category));
    }

    function renderFilterCheckboxes() {
        if (brandList) {
            brandList.innerHTML = '';
            let i = 0;
            for (const brand of brandsSet) {
                if (i >= 5 && showMoreBrands?.dataset.expanded !== '1') break;
                const label = document.createElement('label');
                label.innerHTML = `<input type="checkbox" value="${brand}"> ${brand}`;
                brandList.appendChild(label);
                i++;
            }
        }

        if (categoryList) {
            categoryList.innerHTML = '';
            for (const cat of categoriesSet) {
                const label = document.createElement('label');
                label.innerHTML = `<input type="checkbox" value="${cat}"> ${cat}`;
                categoryList.appendChild(label);
            }
        }
    }

    function applyFiltersAndRender() {
        const searchQuery = (searchInput ? searchInput.value.trim().toLowerCase() : '');

        const selectedBrands = brandList ? Array.from(brandList.querySelectorAll('input:checked')).map(i => i.value) : [];
        const selectedCats = categoryList ? Array.from(categoryList.querySelectorAll('input:checked')).map(i => i.value) : [];

        const minPrice = parseFloat(priceMin?.value) || 0;
        const maxPrice = parseFloat(priceMax?.value) || Infinity;

        filtered = products.filter(p => {
            const matchesBrand = selectedBrands.length ? selectedBrands.includes(p.brand) : true;
            const matchesCat = selectedCats.length ? selectedCats.includes(p.category) : true;
            const matchesPrice = p.price >= minPrice && p.price <= maxPrice;
            const matchesSearch = p.title.toLowerCase().includes(searchQuery);
            return matchesBrand && matchesCat && matchesPrice && matchesSearch;
        });

        const sortVal = sortSelect ? sortSelect.value : 'relevance';
        if (sortVal === 'price-asc') filtered.sort((a, b) => a.price - b.price);
        else if (sortVal === 'price-desc') filtered.sort((a, b) => b.price - a.price);
        else if (sortVal === 'recent') filtered.sort((a, b) => b.addedAt - a.addedAt);

        currentPage = 1;
        renderProducts();
    }

    // ---------------- RENDER PRODUCTS ----------------
    function renderProducts() {
        if (!productsGrid) return;
        productsGrid.innerHTML = '';
        if (productsCount) productsCount.textContent = filtered.length;

        const totalPages = Math.max(1, Math.ceil(filtered.length / PRODUCTS_PER_PAGE));
        if (pageInfo) pageInfo.textContent = `${currentPage} / ${totalPages}`;

        const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
        const slice = filtered.slice(start, start + PRODUCTS_PER_PAGE);

        if (slice.length === 0) {
            productsGrid.innerHTML = `<div style="padding:20px;background:#fff;border-radius:10px;border:1px solid #eee;text-align:center;">Nenhum produto encontrado</div>`;
            return;
        }

        const tpl = document.getElementById('productCardTpl');
        if (!tpl) {
            // fallback simples
            slice.forEach(p => {
                const div = document.createElement('div');
                div.className = 'product-card simple';
                div.innerHTML = `
                    <img src="${p.image}" alt="${p.title}" style="width:100%; height:160px; object-fit:cover; border-radius:8px;">
                    <h4>${p.title}</h4>
                    <div>R$ ${(Number(p.price)||0).toFixed(2).replace('.',',')}</div>
                    <button class="buy-btn">Comprar</button>
                `;
                div.addEventListener('click', ev => {
                    if (!ev.target.classList.contains('buy-btn')) {
                        window.location.href = `../Comprar/indexComprar.html?id=${encodeURIComponent(p.id)}`;
                    }
                });
                div.querySelector('.buy-btn')?.addEventListener('click', ev => {
                    ev.stopPropagation();
                    window.location.href = `../Comprar/indexComprar.html?id=${encodeURIComponent(p.id)}`;
                });
                productsGrid.appendChild(div);
            });
            return;
        }

        slice.forEach(p => {
            const node = tpl.content.cloneNode(true);
            const article = node.querySelector('.product-card');
            if (!article) return;

            const img = article.querySelector('img');
            if (img) {
                img.src = p.image;
                img.alt = p.title;
            }

            const titleEl = article.querySelector('.product-title');
            if (titleEl) titleEl.textContent = p.title;

            const priceVal = article.querySelector('.price-value');
            if (priceVal) priceVal.textContent = (Number(p.price) || 0).toFixed(2).replace('.', ',');

            const installEl = article.querySelector('.installments');
            if (installEl) installEl.textContent = `Em até ${p.parcels}x R$ ${(p.price / p.parcels).toFixed(2).replace('.', ',')} sem juros`;

            article.addEventListener('click', (ev) => {
                if (!ev.target.classList.contains('buy-btn')) {
                    window.location.href = `../Comprar/indexComprar.html?id=${encodeURIComponent(p.id)}`;
                }
            });

            const buyBtn = article.querySelector('.buy-btn');
            if (buyBtn) {
                buyBtn.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    window.location.href = `../Comprar/indexComprar.html?id=${encodeURIComponent(p.id)}`;
                });
            }

            productsGrid.appendChild(node);
        });
    }

    // ---------------- PAGINATION ----------------
    if (prevPage) prevPage.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderProducts();
        }
    });
    if (nextPage) nextPage.addEventListener('click', () => {
        const totalPages = Math.max(1, Math.ceil(filtered.length / PRODUCTS_PER_PAGE));
        if (currentPage < totalPages) {
            currentPage++;
            renderProducts();
        }
    });

    // ---------------- EVENTS (filtros e busca) ----------------
    if (sortSelect) sortSelect.addEventListener('change', applyFiltersAndRender);
    if (searchInput) searchInput.addEventListener('input', () => { currentPage = 1; applyFiltersAndRender(); });
    if (brandList) brandList.addEventListener('change', () => { currentPage = 1; applyFiltersAndRender(); });
    if (categoryList) categoryList.addEventListener('change', () => { currentPage = 1; applyFiltersAndRender(); });
    if (applyPrice) applyPrice.addEventListener('click', () => { currentPage = 1; applyFiltersAndRender(); });

    if (showMoreBrands) {
        showMoreBrands.addEventListener('click', () => {
            showMoreBrands.dataset.expanded = showMoreBrands.dataset.expanded === '1' ? '0' : '1';
            renderFilterCheckboxes();
        });
    }

    const whatsappBtn = document.getElementById('whatsappBtn');
    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', () => {
            const url = "https://wa.me/5511999999999?text=Ol%C3%A1%20Pe%C3%A7aAq%2C%20gostaria%20de%20ajuda%20com%20uma%20pe%C3%A7a";
            window.open(url, '_blank');
        });
    }

    // inicializa
    loadProducts();
});

// perfil / logout (mostra no header se houver usuarioLogado)
document.addEventListener('DOMContentLoaded', () => {
    const perfilContainer = document.getElementById('perfil-container');
    const loginLink = document.getElementById('loginLink');
    let usuario = null;
    try { usuario = JSON.parse(localStorage.getItem('usuarioLogado')); } catch(e){ usuario = null; }

    if (usuario && perfilContainer) {
      perfilContainer.innerHTML = `
        <div class="perfil-info">
          <img src="../Login/imgLogin/perfil.png" alt="Perfil" class="perfil-icon">
          <span>${usuario.nome_razao_social || usuario.nome || usuario.nome_razao || usuario.nome_razao_social || usuario.nome}</span>
          <button id="logoutBtn">Sair</button>
        </div>
      `;

      document.getElementById('logoutBtn')?.addEventListener('click', () => {
        localStorage.removeItem('usuarioLogado');
        fetch('/Login/logout.php', { method: 'POST', credentials: 'same-origin' }).catch(()=>{});
        window.location.reload();
      });
    } else {
      if (perfilContainer && loginLink) {
        perfilContainer.innerHTML = `<a href="${loginLink.getAttribute('href') || '../Login/indexLogin.html'}">Faça seu cadastro</a>`;
      }
    }
});




//alteraões


function editarProduto(id) {
  // Busca os dados do produto que foi clicado
  fetch(`buscarProduto.php?id=${id}`)
    .then(res => res.json())
    .then(data => {
      if (data.status === "ok") {
        // Preenche os campos do modal
        document.getElementById("id_produto").value = data.produto.id_produto;
        document.getElementById("nomeEditar").value = data.produto.nome;
        document.getElementById("precoEditar").value = data.produto.preco;

        // Mostra o modal
        document.getElementById("modalEditar").style.display = "flex";
      } else {
        alert("Erro ao buscar dados do produto!");
      }
    })
    .catch(err => console.error("Erro ao buscar produto:", err));
}





function renderizarProdutos(produtos) {
  const lista = document.getElementById("listaProdutos");
  lista.innerHTML = "";

  produtos.forEach(prod => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td><img src="${prod.foto_principal}" width="60" height="60" style="border-radius:8px"></td>
      <td>${prod.nome}</td>
      <td>R$ ${parseFloat(prod.preco).toFixed(2)}</td>
      <td>
        <button class="btn-editar" data-id="${prod.id_produto}">✏️ Editar</button>
      </td>
    `;

    lista.appendChild(tr);
  });

  // 🔹 Vincula o evento de clique a todos os botões de editar
  document.querySelectorAll(".btn-editar").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      abrirModalEdicao(id); // 👈 chama a função que abre o modal
    });
  });


  
}




let produtos = []; // 🔹 variável global pra armazenar os produtos carregados

function abrirModalEdicao(id) {
  const produto = produtos.find(p => p.id_produto == id);
  if (!produto) return alert("Produto não encontrado!");

  document.getElementById("id_produto").value = produto.id_produto;
  document.getElementById("nomeEditar").value = produto.nome;
  document.getElementById("precoEditar").value = produto.preco;

  document.getElementById("modalEditar").style.display = "flex"; // 👈 mostra o modal
}

function fecharModal() {
  document.getElementById("modalEditar").style.display = "none";
}

document.getElementById("formEditarProduto").addEventListener("submit", async function (e) {
  e.preventDefault();

  const formData = new FormData(this);

  const resp = await fetch("atualizarProduto.php", {
    method: "POST",
    body: formData
  });

  const json = await resp.json();
  alert(json.message);

  if (json.status === "success") {
    fecharModal();
    location.reload(); // recarrega a tabela
  }
});


function fecharModalEdicao() {
  document.getElementById("modalEditar").style.display = "none";
}

function carregarProdutos() {
  fetch("listarProdutos.php")
    .then(res => res.json())
    .then(data => {
      produtos = data; // 👈 salva todos os produtos pra poder achar depois
      renderizarProdutos(produtos);
    })
    .catch(err => console.error("Erro ao carregar produtos:", err));
}
