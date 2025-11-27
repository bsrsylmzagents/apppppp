const generateRandomId = () => Math.floor(Math.random() * 100000).toString();

const getTomorrowDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const dispatchInputEvents = (el) => {
  const inputEvent = new Event('input', { bubbles: true });
  const changeEvent = new Event('change', { bubbles: true });
  el.dispatchEvent(inputEvent);
  el.dispatchEvent(changeEvent);
};

const getFieldMeta = (el) => {
  const name = (el.getAttribute('name') || '').toLowerCase();
  const id = (el.getAttribute('id') || '').toLowerCase();
  const placeholder = (el.getAttribute('placeholder') || '').toLowerCase();
  const type = (el.getAttribute('type') || '').toLowerCase();
  const meta = `${name} ${id} ${placeholder} ${type}`.trim();
  return { name, id, placeholder, type, meta };
};

const shouldSkipElement = (el) => {
  if (el.readOnly || el.disabled) return true;
  if (el.type === 'hidden' || el.type === 'submit' || el.type === 'button') return true;
  if (el.value && String(el.value).trim().length > 0) return true;
  if (!(el.offsetWidth || el.offsetHeight || el.getClientRects().length)) return true;
  return false;
};

export const autoFillCurrentForm = () => {
  try {
    const allInputs = Array.from(
      document.querySelectorAll('input, select, textarea')
    );

    if (!allInputs.length) {
      return;
    }

    const activeElement = document.activeElement;
    let scopeElements = allInputs;

    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'SELECT' || activeElement.tagName === 'TEXTAREA')) {
      if (activeElement.form) {
        scopeElements = Array.from(
          activeElement.form.querySelectorAll('input, select, textarea')
        );
      }
    }

    const randomId = generateRandomId();

    scopeElements.forEach((el) => {
      if (shouldSkipElement(el)) return;

      const { meta, type } = getFieldMeta(el);

      let value = null;

      if (meta.includes('email')) {
        value = `testuser_${randomId}@tourcast.com`;
      } else if (meta.includes('password')) {
        value = '123456';
      } else if (type === 'date' || meta.includes('date') || meta.includes('tarih')) {
        value = getTomorrowDate();
      } else if (type === 'time' || meta.includes('time') || meta.includes('saat')) {
        value = '09:00';
      } else if (
        meta.includes('price') ||
        meta.includes('amount') ||
        meta.includes('tutar') ||
        meta.includes('ucret') ||
        meta.includes('ücret')
      ) {
        value = '150';
      } else if (
        meta.includes('pax') ||
        meta.includes('person_count') ||
        meta.includes('kisi_sayisi') ||
        meta.includes('kişi_sayısı')
      ) {
        value = '2';
      } else if (
        meta.includes('vehicle_count') ||
        meta.includes('atv_count') ||
        meta.includes('arac_sayisi') ||
        meta.includes('araç_sayısı')
      ) {
        value = '1';
      } else if (
        meta.includes('phone') ||
        meta.includes('telefon') ||
        meta.includes('gsm')
      ) {
        value = '5551234567';
      } else if (
        meta.includes('name') ||
        meta.includes('title') ||
        meta.includes('description') ||
        meta.includes('isim') ||
        meta.includes('ad') ||
        meta.includes('açıklama')
      ) {
        value = `Test Kayıt ${randomId}`;
      } else if (el.tagName === 'SELECT') {
        const options = Array.from(el.options || []).filter(
          (o) => o.value && !o.disabled
        );
        if (options.length > 0) {
          value = options[0].value;
        }
      }

      // Fallback: tanınmayan ama doldurulabilir alanları da doldur
      if (value === null) {
        const fallbackType = type || el.tagName.toLowerCase();
        const isTextLike =
          fallbackType === 'text' ||
          fallbackType === 'tel' ||
          fallbackType === 'search' ||
          fallbackType === 'number' ||
          el.tagName === 'TEXTAREA';

        if (isTextLike) {
          if (fallbackType === 'number') {
            value = '1';
          } else {
            value = `Test Değer ${randomId}`;
          }
        }
      }

      if (value === null) return;

      if (el.tagName === 'SELECT') {
        el.value = value;
        dispatchInputEvents(el);
      } else if (el.type === 'checkbox' || el.type === 'radio') {
        el.checked = true;
        dispatchInputEvents(el);
      } else {
        el.value = value;
        dispatchInputEvents(el);
      }
    });
  } catch (error) {
    console.error('DebugToolkit autoFillCurrentForm error:', error);
  }
};


