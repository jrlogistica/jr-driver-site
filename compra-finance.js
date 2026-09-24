const API = 'https://bldmkfdgdqlhpxgpvhmf.supabase.co/functions/v1/finance-license';
const CLAIM_KEY = 'jr-finance-claim-token';
const params = new URLSearchParams(location.search);
const fromUrl = params.get('claim');

if (fromUrl && /^[0-9a-f]{64}$/i.test(fromUrl)) {
  sessionStorage.setItem(CLAIM_KEY, fromUrl);
  history.replaceState({}, document.title, 'compra-finance.html');
}

const claim = sessionStorage.getItem(CLAIM_KEY) || '';
const title = document.getElementById('delivery-title');
const message = document.getElementById('delivery-message');
const seal = document.getElementById('delivery-seal');
const progress = document.getElementById('delivery-progress');
const panel = document.getElementById('license-panel');
const code = document.getElementById('license-code');
const copy = document.getElementById('copy-license');
const actions = document.getElementById('delivery-actions');
const download = document.getElementById('download-finance');

let attempts = 0;
let finished = false;
let downloading = false;

function fail(heading, detail) {
  finished = true;
  seal.textContent = '!';
  seal.classList.add('is-error');
  title.textContent = heading;
  message.textContent = detail;
  progress.hidden = true;
}

function pending() {
  title.textContent = 'Pagamento em processamento';
  message.textContent = 'Quando o Mercado Pago confirmar, sua licença aparecerá aqui automaticamente.';
}

function approved(data) {
  if (!data.download_url) {
    return fail(
      'Instalador temporariamente indisponível',
      'Seu pagamento foi aprovado e a licença foi criada. Fale com o suporte J.R para receber o instalador.'
    );
  }

  finished = true;
  title.textContent = 'Pagamento aprovado!';
  message.textContent = 'Copie a licença, baixe o J.R Finance e ative no primeiro acesso.';
  progress.hidden = true;
  code.textContent = data.license_code;
  download.href = '#download';
  panel.hidden = false;
  actions.hidden = false;
}

async function check() {
  if (finished) return;
  if (!claim) return fail('Compra não identificada', 'Inicie a compra pelo site oficial para receber sua licença.');

  attempts++;

  try {
    const response = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ action: 'claim', claim_token: claim })
    });
    const data = await response.json();

    if (response.ok && data.status === 'approved') return approved(data);

    if (['pending', 'created', 'processing'].includes(data.status)) {
      pending();
    } else if (['refunded', 'charged_back'].includes(data.status)) {
      return fail('Pagamento devolvido', 'Esta compra não possui licença ativa.');
    } else if (response.status >= 400 && response.status < 500) {
      return fail('Não foi possível liberar a licença', 'Confira o pagamento ou fale com o suporte J.R.');
    }
  } catch {
    message.textContent = 'A conexão oscilou. Tentaremos novamente.';
  }

  if (!finished && attempts < 90) {
    setTimeout(check, 4000);
  } else if (!finished) {
    fail('Confirmação demorando', 'Tente novamente mais tarde ou fale com o suporte J.R.');
  }
}

copy.addEventListener('click', async () => {
  await navigator.clipboard.writeText(code.textContent || '');
  copy.textContent = 'Código copiado ✓';
});

download.addEventListener('click', async (event) => {
  event.preventDefault();
  if (downloading || !claim) return;

  downloading = true;
  const originalText = download.innerHTML;
  download.setAttribute('aria-disabled', 'true');
  download.textContent = 'Preparando download...';

  try {
    const response = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ action: 'download', claim_token: claim })
    });
    const data = await response.json();

    if (!response.ok || !data.download_url) {
      throw new Error(data.error || 'download_unavailable');
    }

    window.location.assign(data.download_url);
  } catch (error) {
    message.textContent = 'Não foi possível iniciar o download. Tente novamente ou fale com o suporte J.R.';
    console.warn('Falha ao liberar o instalador:', error);
  } finally {
    window.setTimeout(() => {
      downloading = false;
      download.removeAttribute('aria-disabled');
      download.innerHTML = originalText;
    }, 1200);
  }
});

check();
