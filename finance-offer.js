(() => {
  // O valor cobrado é calculado no servidor; este código apenas atualiza a apresentação.
  const promoEndsAt = Date.parse('2026-10-07T13:31:55.166Z');
  const promotional = Date.now() < promoEndsAt;
  const price = promotional ? '19,90' : '29,90';
  document.querySelectorAll('[data-finance-price]').forEach((element) => {
    element.textContent = price;
  });
  const label = document.getElementById('finance-offer-label');
  if (label && !promotional) label.textContent = 'PREÇO REGULAR';
})();
