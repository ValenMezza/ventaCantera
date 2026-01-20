const { formatISODate } = require('../utils/dates');

const state = {
  users: [{ id: 1, username: 'admin', password: 'admin123' }],

  clients: [
    { id: 1, full_name: 'Cliente Demo', phone: '3510000000' }
  ],

  products: [
    { id: 1, name: 'Tierra', price: 8500, stock_qty: 100, active: true }
  ],

  sales: [],
  payments: []
};

const ids = { client: 2, product: 2, sale: 1, payment: 1 };
const nextId = (k) => ids[k]++;

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// auth
async function findUserByUsername(username) {
  return state.users.find((u) => u.username === username) || null;
}

// clients
async function listClients() {
  return [...state.clients].sort((a, b) => a.full_name.localeCompare(b.full_name));
}
async function getClient(id) {
  return state.clients.find((c) => c.id === Number(id)) || null;
}
async function createClient(payload) {
  const full_name = (payload.full_name || '').trim();
  const phone = (payload.phone || '').trim();

  const c = { id: nextId('client'), full_name: full_name || 'Sin nombre', phone };
  state.clients.push(c);
  return c;
}
async function updateClient(id, payload) {
  const c = await getClient(id);
  if (!c) return null;
  if (payload.full_name !== undefined) c.full_name = String(payload.full_name).trim();
  if (payload.phone !== undefined) c.phone = String(payload.phone).trim();
  return c;
}
async function deleteClient(id) {
  const idx = state.clients.findIndex((c) => c.id === Number(id));
  if (idx === -1) return false;
  state.clients.splice(idx, 1);
  return true;
}

// products
async function listProducts() {
  return [...state.products].sort((a, b) => a.name.localeCompare(b.name));
}
async function getProduct(id) {
  return state.products.find((p) => p.id === Number(id)) || null;
}
async function createProduct(payload) {
  const p = {
    id: nextId('product'),
    name: payload.name?.trim() || 'Producto',
    price: toNum(payload.price),
    stock_qty: toNum(payload.stock_qty),
    active: payload.active !== undefined ? !!payload.active : true
  };
  state.products.push(p);
  return p;
}
async function updateProduct(id, payload) {
  const p = await getProduct(id);
  if (!p) return null;
  if (payload.name !== undefined) p.name = String(payload.name).trim();
  if (payload.price !== undefined) p.price = toNum(payload.price);
  if (payload.stock_qty !== undefined) p.stock_qty = toNum(payload.stock_qty);
  if (payload.active !== undefined) p.active = !!payload.active;
  return p;
}
async function deleteProduct(id) {
  const p = await getProduct(id);
  if (!p) return false;
  p.active = false; // lógico
  return true;
}

// sales
async function createSale(payload) {
  const s = {
    id: nextId('sale'),
    sale_type: payload.sale_type, // 'CANTERA' | 'VIAJES'
    sale_datetime: payload.sale_datetime, // datetime-local string

    client_id: payload.client_id ? Number(payload.client_id) : null,

    // viajes extras (o null)
    phone: payload.phone || null,
    driver_name: payload.driver_name || null,
    address: payload.address || null,

    product_id: payload.product_id ? Number(payload.product_id) : null,
    product_price: toNum(payload.product_price),
    qty: toNum(payload.qty) || 1,

    freight_price: toNum(payload.freight_price),
    final_price: toNum(payload.final_price),

    payment_method: payload.payment_method,
    paid_amount: toNum(payload.paid_amount)
  };

  state.sales.push(s);
  return s;
}

async function listSalesByTypeBetween(type, fromISO, toISO) {
  return state.sales
    .filter((s) => s.sale_type === type)
    .filter((s) => {
      const d = formatISODate(new Date(s.sale_datetime));
      return d >= fromISO && d <= toISO;
    })
    .sort((a, b) => new Date(a.sale_datetime) - new Date(b.sale_datetime));
}

async function listSalesByTypeOnDay(type, dayISO, clientId) {
  return state.sales
    .filter((s) => s.sale_type === type)
    .filter((s) => formatISODate(new Date(s.sale_datetime)) === dayISO)
    .filter((s) => (!clientId ? true : String(s.client_id) === String(clientId)))
    .sort((a, b) => new Date(a.sale_datetime) - new Date(b.sale_datetime));
}

async function getSale(id) {
  return state.sales.find((s) => s.id === Number(id)) || null;
}

// payments
async function addPayment(payload) {
  const p = {
    id: nextId('payment'),
    sale_id: Number(payload.sale_id),
    amount: toNum(payload.amount),
    method: payload.method,
    paid_datetime: new Date().toISOString()
  };
  state.payments.push(p);

  const sale = await getSale(p.sale_id);
  if (sale) {
    sale.paid_amount = toNum(sale.paid_amount) + p.amount;
    if (sale.paid_amount > sale.final_price) sale.paid_amount = sale.final_price;
  }

  return p;
}

module.exports = {
  findUserByUsername,

  listClients, getClient, createClient, updateClient, deleteClient,
  listProducts, getProduct, createProduct, updateProduct, deleteProduct,

  createSale, listSalesByTypeBetween, listSalesByTypeOnDay, getSale,
  addPayment
};
