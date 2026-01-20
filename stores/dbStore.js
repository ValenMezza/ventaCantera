// Aca va PostgreSQL mañana.
// Mantener EXACTAMENTE las mismas funciones que memoryStore.
module.exports = {
  // auth
  async findUserByUsername(username) {
    throw new Error('dbStore no implementado');
  },

  // clients
  async listClients() { throw new Error('dbStore no implementado'); },
  async getClient(id) { throw new Error('dbStore no implementado'); },
  async createClient(payload) { throw new Error('dbStore no implementado'); },
  async updateClient(id, payload) { throw new Error('dbStore no implementado'); },
  async deleteClient(id) { throw new Error('dbStore no implementado'); },

  // products
  async listProducts() { throw new Error('dbStore no implementado'); },
  async getProduct(id) { throw new Error('dbStore no implementado'); },
  async createProduct(payload) { throw new Error('dbStore no implementado'); },
  async updateProduct(id, payload) { throw new Error('dbStore no implementado'); },
  async deleteProduct(id) { throw new Error('dbStore no implementado'); },

  // sales
  async createSale(payload) { throw new Error('dbStore no implementado'); },
  async listSalesByTypeBetween(type, fromISO, toISO) { throw new Error('dbStore no implementado'); },
  async listSalesByTypeOnDay(type, dayISO, clientId) { throw new Error('dbStore no implementado'); },
  async getSale(id) { throw new Error('dbStore no implementado'); },

  // payments
  async addPayment(payload) { throw new Error('dbStore no implementado'); }
};
