// headerProfile.js
// Substitui dinamicamente a área do usuário no header usando localStorage,
// tenta chamar logout.php relativo quando o usuário faz logout e recarrega a página.

(function(){
  const selector = '#user-area'; // ajuste se o seu header usar outro id/selector
  const STORAGE_KEY = 'usuarioLogado';

  // tenta localizar um endpoint relativo subindo níveis (evita 404 por uso de /Login)
  async function tryPostToLoginEndpoint(filename, body = {}) {
    const parts = location.pathname.split('/').filter(Boolean);
    // cria caminhos: ./Login/..., ../Login/..., ../../Login/..., /Login/...
    const tries = [];
    // nível 0: same dir /Login/filename
    tries.push('./Login/' + filename);
    for (let i=1;i<=parts.length;i++){
      const base = '/' + parts.slice(0, parts.length - i).join('/');
      tries.push(base + '/Login/' + filename);
    }
    // also try absolute root
    tries.push('/Login/' + filename);

    for (const p of tries) {
      try {
        const resp = await fetch(p, {
          method: 'POST',
          headers: {'Content-Type':'application/x-www-form-urlencoded'},
          credentials: 'same-origin',
          body: new URLSearchParams(body).toString()
        });
        // consider success on 2xx or 4xx where server replied (we only need to avoid 404)
        if (resp.status >= 200 && resp.status < 400) return { ok: true, path: p, resp };
      } catch (err) {
        // fallo: servidor não encontrou / bloqueio CORS / etc -> tenta próximo
      }
    }
    return { ok: false };
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]; });
  }

  function buildProfileHtml(usuario) {
    // Exibe avatar inicial e tipo. Ajuste classes se quiser.
    const initials = (usuario.nome_razao_social || 'U').trim().charAt(0).toUpperCase();
    const tipo = usuario.tipo || usuario.tipo_usuario || '';
    // mostra links diferentes conforme tipo
    const minhaContaHref = (tipo.toLowerCase()==='fornecedor') ? '../DashBoard/index.html' : '../DashBoard/index.html';
    // (ajuste os hrefs conforme suas rotas)
    return `
      <div id="user-profile" style="display:flex;align-items:center;gap:10px;position:relative;">
        <div style="width:40px;height:40px;border-radius:50%;background:#2d89ef;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;">
          ${escapeHtml(initials)}
        </div>
        <div style="display:flex;flex-direction:column;min-width:120px;">
          <span style="font-size:14px;font-weight:600;">${escapeHtml(usuario.nome_razao_social || usuario.email || 'Usuário')}</span>
          <small style="opacity:0.8">${escapeHtml(tipo)}</small>
        </div>
        <button id="user-menu-btn" aria-expanded="false" style="background:none;border:none;cursor:pointer;font-size:18px;">▾</button>

        <div id="user-menu" style="position:absolute;right:0;top:56px;background:#fff;border:1px solid #ddd;padding:8px;border-radius:6px;display:none;box-shadow:0 6px 20px rgba(0,0,0,0.08);min-width:160px;z-index:9999;">
          <div style="padding:6px 8px;"><a id="link-minha-conta" href="${minhaContaHref}" style="text-decoration:none;color:#333;">Minha conta</a></div>
          <div style="padding:6px 8px;"><button id="logoutBtn" style="background:none;border:none;color:#c0392b;cursor:pointer;padding:0;font-weight:600;">Sair</button></div>
        </div>
      </div>
    `;
  }

  function showOriginalText(container) {
    // tenta restaurar texto original: se usuário removeu innerHTML, coloca texto padrão
    // (se quiser, coloque um anchor para cadastro: <a href="/Login/indexLogin.html">Faça seu cadastro</a>)
    container.innerHTML = `<a href="../Login/indexLogin.html" id="link-cadastrar" style="color:inherit;text-decoration:none;">Faça seu cadastro</a>`;
  }

  async function init() {
    const container = document.querySelector(selector);
    if (!container) return;

    // verifica localStorage primeiro
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // não logado: restaura o texto original (mantém link para cadastro)
      showOriginalText(container);
      return;
    }

    let usuario;
    try { usuario = JSON.parse(raw); } catch (e) { console.warn('usuarioLogado inválido', e); showOriginalText(container); return; }
    if (!usuario) { showOriginalText(container); return; }

    // substitui conteúdo pelo perfil
    container.innerHTML = buildProfileHtml(usuario);

    // handlers do menu
    const btn = container.querySelector('#user-menu-btn');
    const menu = container.querySelector('#user-menu');
    const logoutBtn = container.querySelector('#logoutBtn');

    if (btn && menu) {
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const shown = menu.style.display === 'block';
        menu.style.display = shown ? 'none' : 'block';
        btn.setAttribute('aria-expanded', (!shown).toString());
      });
      // fechar click fora
      document.addEventListener('click', () => { if (menu) menu.style.display = 'none'; if (btn) btn.setAttribute('aria-expanded','false'); });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        // limpa local
        localStorage.removeItem(STORAGE_KEY);

        // tenta notificar o servidor (logout.php) sem travar UX — usa caminhos relativos
        try {
          await tryPostToLoginEndpoint('logout.php', {}); // ignora resultado
        } catch(e){ /* ignore */ }

        // forçar recarga na página de login (tenta localizar indexLogin.html)
        const possibleLoginPaths = [
          './Login/indexLogin.html',
          '../Login/indexLogin.html',
          '/PECAQteste-main/Login/indexLogin.html',
          '/Login/indexLogin.html'
        ];
        let navigated = false;
        for (const p of possibleLoginPaths) {
          try {
            // tentativa rápida para ver se o arquivo existe
            const r = await fetch(p, { method: 'HEAD', credentials:'same-origin' });
            if (r.ok) {
              window.location.href = p;
              navigated = true;
              break;
            }
          } catch (err) { /* next */ }
        }
        if (!navigated) {
          // fallback: recarrega a página atual para mostrar "Faça seu cadastro"
          window.location.reload();
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
