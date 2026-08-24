const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav-links');

if (menuButton && nav) {
  menuButton.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
    });
  });
}

const yearTarget = document.getElementById('current-year');
if (yearTarget) {
  yearTarget.textContent = new Date().getFullYear();
}

const DRIVER_RELEASE = {
  version: '9.7.9-alpha.1',
  label: '9.7.9 Alpha 1',
  apk: 'J.R-Drive-App-9.7.9-alpha.1.apk',
  size: '8.2 MB'
};

const SUPABASE = {
  url: 'https://bldmkfdgdqlhpxgpvhmf.supabase.co',
  publishableKey: 'sb_publishable_PLRXhKoZ2DoRpSsRWHn3vg_LCf6TYiT'
};

const downloadLinks = [...document.querySelectorAll('[data-download-link]')];
const versionTargets = document.querySelectorAll('[data-current-version]');
const versionLabelTargets = document.querySelectorAll('[data-current-version-label]');
const sizeTargets = document.querySelectorAll('[data-current-size]');
const countTarget = document.getElementById('download-count');
const countStatus = document.getElementById('download-counter-status');

versionTargets.forEach((target) => { target.textContent = DRIVER_RELEASE.version; });
versionLabelTargets.forEach((target) => { target.textContent = DRIVER_RELEASE.label; });
sizeTargets.forEach((target) => { target.textContent = DRIVER_RELEASE.size; });
downloadLinks.forEach((link) => {
  link.href = DRIVER_RELEASE.apk;
  link.setAttribute('download', DRIVER_RELEASE.apk);
});

async function callCounterRpc(functionName, body = {}) {
  const response = await fetch(`${SUPABASE.url}/rest/v1/rpc/${functionName}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE.publishableKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body),
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`contador HTTP ${response.status}`);
  }

  return response.json();
}

function setCounter(value, status = 'downloads iniciados pelo site oficial') {
  if (countTarget && Number.isFinite(Number(value))) {
    countTarget.textContent = Number(value).toLocaleString('pt-BR');
  }
  if (countStatus) countStatus.textContent = status;
}

async function loadDownloadCount() {
  try {
    const total = await callCounterRpc('get_jr_driver_download_count');
    setCounter(total);
  } catch (error) {
    if (countTarget) countTarget.textContent = '—';
    if (countStatus) countStatus.textContent = 'contador aguardando ativação';
    console.warn('Contador de downloads indisponível:', error);
  }
}

let downloadBeingHandled = false;

async function handleDownload(event) {
  if (downloadBeingHandled) return;

  event.preventDefault();
  downloadBeingHandled = true;

  const apkUrl = new URL(DRIVER_RELEASE.apk, window.location.href).href;

  try {
    const total = await callCounterRpc('register_jr_driver_download', {
      p_version: DRIVER_RELEASE.version
    });
    setCounter(total);
  } catch (error) {
    console.warn('Não foi possível registrar o download:', error);
  } finally {
    const temporaryLink = document.createElement('a');
    temporaryLink.href = apkUrl;
    temporaryLink.download = DRIVER_RELEASE.apk;
    temporaryLink.style.display = 'none';
    document.body.appendChild(temporaryLink);
    temporaryLink.click();
    temporaryLink.remove();

    window.setTimeout(() => {
      downloadBeingHandled = false;
    }, 800);
  }
}

downloadLinks.forEach((link) => {
  link.addEventListener('click', handleDownload);
});

loadDownloadCount();

const copyEmailButton = document.querySelector('.copy-email');
const emailFeedback = document.getElementById('email-feedback');

if (copyEmailButton && emailFeedback) {
  copyEmailButton.addEventListener('click', async () => {
    const email = copyEmailButton.dataset.email;
    if (!email) return;

    try {
      await navigator.clipboard.writeText(email);
      copyEmailButton.textContent = 'E-mail copiado';
      emailFeedback.textContent = 'Copiado para a área de transferência';
    } catch {
      emailFeedback.textContent = email;
    }

    window.setTimeout(() => {
      copyEmailButton.textContent = 'Copiar e-mail';
      emailFeedback.textContent = email;
    }, 2400);
  });
}
