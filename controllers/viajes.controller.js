const store = require('../stores/store');
const { weekdaysFromWeekStart, weeksForMonth } = require('../utils/dates');

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

exports.viewDashboard = (req, res) => {
  res.render('viajes/index');
};

exports.viewMensual = (req, res) => {
  res.render('viajes/mensual');
};

exports.viewVender = async (req, res) => {
  const clients = await store.listClients();
  const products = (await store.listProducts()).filter((p) => p.active);
  res.render('viajes/vender', { clients, products, error: null });
};

exports.createVenta = async (req, res) => {
  const clients = await store.listClients();
  const products = (await store.listProducts()).filter((p) => p.active);

  const {
    sale_datetime,

    client_manual_enabled,
    client_id,
    client_name_manual,
    phone,

    driver_name,
    address,

    product_id,
    product_price,
    qty,

    freight_price,

    payment_method,
    allow_edit_final,
    final_price
  } = req.body;

  if (!sale_datetime) {
    return res.status(400).render('viajes/vender', { clients, products, error: 'Falta fecha y hora' });
  }

  // Cliente obligatorio
  const manual = client_manual_enabled === 'on';
  let finalClientId = null;

  if (manual) {
    const name = (client_name_manual || '').trim();
    if (!name) {
      return res.status(400).render('viajes/vender', { clients, products, error: 'Cliente manual: falta nombre' });
    }
    const created = await store.createClient({ full_name: name, phone: phone || '' });
    finalClientId = created.id;
  } else {
    if (!client_id) {
      return res.status(400).render('viajes/vender', { clients, products, error: 'Debe seleccionar un cliente' });
    }
    finalClientId = Number(client_id);
  }

  // Producto obligatorio
  if (!product_id) {
    return res.status(400).render('viajes/vender', { clients, products, error: 'Debe seleccionar un producto' });
  }

  const q = Math.max(1, toNum(qty || 1));

  // Precio unitario
  let unit = toNum(product_price);
  if (!unit) {
    const p = await store.getProduct(product_id);
    unit = p ? toNum(p.price) : 0;
  }

  const freight = toNum(freight_price);
  const subtotal = unit * q;
  const computed = subtotal + freight;

  let final = computed;
  if (allow_edit_final === 'on') final = toNum(final_price);

  let paid = 0;
  if (payment_method === 'efectivo' || payment_method === 'transferencia') paid = final;

  await store.createSale({
    sale_type: 'VIAJES',
    sale_datetime,
    client_id: finalClientId,

    phone: phone || null,
    driver_name: driver_name || null,
    address: address || null,

    product_id,
    product_price: unit,
    qty: q,

    freight_price: freight,
    final_price: final,

    payment_method,
    paid_amount: paid
  });

  return res.redirect('/viajes/semanal');
};

exports.viewSemanalSelector = async (req, res) => {
  const now = new Date();
  const year = Number(req.query.year || now.getFullYear());
  const month = Number(req.query.month || (now.getMonth() + 1)); // 1..12
  const weekStart = req.query.weekStart || '';
  const clientId = req.query.clientId || '';

  const months = [
    { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' }
  ];

  const weeks = weeksForMonth(year, month);
  const clients = await store.listClients();

  let days = [];
  let dashboard = null;
  let weekEnd = null;
  let salesList = [];

  if (weekStart) {
    days = weekdaysFromWeekStart(weekStart);

    const weekObj = weeks.find(w => w.weekStart === weekStart);
    weekEnd = weekObj ? weekObj.weekEnd : days[6]?.date;

    let sales = await store.listSalesByTypeBetween('VIAJES', weekStart, weekEnd);

    // filtro por cliente (opcional)
    if (clientId) {
      sales = sales.filter(s => String(s.client_id) === String(clientId));
    }

    dashboard = {
      sales_count: sales.length,
      saldo_cobrado_efectivo: sales.filter(s => s.payment_method === 'efectivo').reduce((a, s) => a + toNum(s.final_price), 0),
      saldo_cobrado_transferencia: sales.filter(s => s.payment_method === 'transferencia').reduce((a, s) => a + toNum(s.final_price), 0),
      saldo_a_cobrar: sales
        .filter(s => ['fiado', 'vales'].includes(s.payment_method))
        .reduce((a, s) => a + (toNum(s.final_price) - toNum(s.paid_amount)), 0),
      ventas_con_deuda: sales.filter(s => (toNum(s.final_price) - toNum(s.paid_amount)) > 0).length
    };

    salesList = await Promise.all(sales.map(async (s) => {
      const c = s.client_id ? await store.getClient(s.client_id) : null;
      return {
        ...s,
        client_name: c ? c.full_name : 'Sin cliente',
        dayISO: new Date(s.sale_datetime).toISOString().slice(0, 10),
        time: new Date(s.sale_datetime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        debt: Math.max(0, toNum(s.final_price) - toNum(s.paid_amount))
      };
    }));
  }

  res.render('viajes/semanal', {
    year, month, months,
    weeks,
    weekStart,
    weekEnd,
    days,
    clients,
    clientId,
    dashboard,
    salesList
  });
};

exports.viewResumenDia = async (req, res) => {
  const dayISO = req.query.date;
  const clientId = req.query.clientId || '';
  const weekStart = req.query.weekStart || '';
  const month = req.query.month || '';
  const year = req.query.year || '';

  if (!dayISO) return res.redirect('/viajes/semanal');

  const clients = await store.listClients();
  const salesRaw = await store.listSalesByTypeOnDay('VIAJES', dayISO, clientId || null);

  const sales = await Promise.all(salesRaw.map(async (s) => {
    const c = s.client_id ? await store.getClient(s.client_id) : null;
    return {
      ...s,
      client_name: c ? c.full_name : 'Sin cliente',
      debt: Math.max(0, toNum(s.final_price) - toNum(s.paid_amount))
    };
  }));

  const summary = {
    ventas: sales.length,
    efectivo: sales.filter(x => x.payment_method === 'efectivo').reduce((a, s) => a + toNum(s.final_price), 0),
    transferencia: sales.filter(x => x.payment_method === 'transferencia').reduce((a, s) => a + toNum(s.final_price), 0),
    a_cobrar: sales
      .filter(x => ['fiado', 'vales'].includes(x.payment_method))
      .reduce((a, s) => a + (toNum(s.final_price) - toNum(s.paid_amount)), 0)
  };

  res.render('viajes/resumen_dia', {
    date: dayISO,
    clients,
    clientId,
    sales,
    summary,
    back: { weekStart, month, year }
  });
};

exports.registrarPago = async (req, res) => {
  const {
    sale_id, mode, amount, pay_method,
    redirect_date, redirect_clientId,
    redirect_weekStart, redirect_month, redirect_year
  } = req.body;

  const sale = await store.getSale(sale_id);
  if (!sale) return res.redirect('/viajes/semanal');

  const deuda = toNum(sale.final_price) - toNum(sale.paid_amount);
  const backQs = `weekStart=${encodeURIComponent(redirect_weekStart || '')}&month=${encodeURIComponent(redirect_month || '')}&year=${encodeURIComponent(redirect_year || '')}`;

  if (deuda <= 0) {
    return res.redirect(`/viajes/resumen/dia?date=${redirect_date}&clientId=${redirect_clientId || ''}&${backQs}`);
  }

  let toPay = 0;
  if (mode === 'total') toPay = deuda;
  else toPay = Math.min(toNum(amount), deuda);

  if (toPay <= 0) {
    return res.redirect(`/viajes/resumen/dia?date=${redirect_date}&clientId=${redirect_clientId || ''}&${backQs}`);
  }

  await store.addPayment({ sale_id, amount: toPay, method: pay_method });

  return res.redirect(`/viajes/resumen/dia?date=${redirect_date}&clientId=${redirect_clientId || ''}&${backQs}`);
};
