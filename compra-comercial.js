const LICENSE_API = 'https://bldmkfdgdqlhpxgpvhmf.supabase.co/functions/v1/commercial-license';
const storageKey = 'jr-commercial-claim-token';
const params = new URLSearchParams(window.location.search);
const claimFromUrl = params.get('claim');
if (claimFromUrl && /^[0-9a-f]{64}$/i.test(claimFromUrl)) {
  sessionStorage.setItem(storageKey, claimFromUrl);
  window.history.replaceState({}, document.title, 'compra-comercial.html');
}
const claimToken = sessionStorage.getItem(storageKey) || '';
const title = document.getElementById('delivery-title');
const message = document.getElementById('delivery-message');
const seal = document.getElementById('delivery-seal');
const progress = document.getElementById('delivery-progress');
const panel = document.getElementById('license-panel');
const code = document.getElementById('license-code');
const copyButton = document.getElementById('copy-license');
const actions = document.getElementById('delivery-actions');
const download = document.getElementById('download-commercial');
let attempts = 0;
let finished = false;

function showError(headline, details) {
  finished = true;
  seal.textContent = '!';
  seal.classList.add('is-error');
  title.textContent = headline;
  message.textContent = details;
  progress.hidden = true;
}
function showPending() {
  title.textContent = 'Pagamento em processamento';
  message.textContent = 'Assim que o Mercado Pago confirmar, sua licença aparecerá nesta página automaticamente.';
}
function showApproved(data) {
  finished = true;
  seal.textContent = '✓';
  title.textContent = 'Pagamento aprovado!';
  message.textContent = 'Sua licença permanente foi criada. Copie o código, baixe o sistema e faça a ativação no primeiro acesso.';
  progress.hidden = true;
  code.textContent = data.license_code;
  download.href = data.download_url;
  panel.hidden = false;
  actions.hidden = false;
}
async function checkPurchase() {
  if (finished) return;
  if (!claimToken) {
    showError('Compra não identificada', 'Use o botão de compra do site oficial para iniciar um pagamento e receber sua licença automática.');
    return;
  }
  attempts += 1;
  try {
    const response = await fetch(LICENSE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ action: 'claim', claim_token: claimToken }),
    });
    const data = await response.json();
    if (response.ok && data.status === 'approved') return showApproved(data);
    if (response.status === 202 || data.status === 'pending') showPending();
    else if (data.status === 'refunded' || data.status === 'charged_back') showError('Pagamento devolvido', 'Esta compra não possui uma licença ativa. Fale com o suporte se precisar de ajuda.');
    else if (response.status >= 400 && response.status < 500) showError('Não foi possível liberar a licença', 'Confira o resultado do pagamento no Mercado Pago ou fale com o suporte J.R.');
  } catch {
    message.textContent = 'A conexão oscilou. Tentaremos novamente automaticamente.';
  }
  if (!finished && attempts < 90) window.setTimeout(checkPurchase, 4000);
  else if (!finished) showError('Confirmação demorando mais que o esperado', 'Você pode manter esta página salva e tentar novamente mais tarde ou falar com o suporte J.R.');
}
copyButton.addEventListener('click', async () => {
  await navigator.clipboard.writeText(code.textContent || '');
  copyButton.textContent = 'Código copiado ✓';
});
checkPurchase();
