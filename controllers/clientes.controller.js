const store = require('../stores/store');

/* LISTADO */
exports.list = async (req, res) => {
  const clients = await store.listClients();
  res.render('clientes/index', { clients });
};

/* FORM NUEVO */
exports.viewCreate = (req, res) => {
  res.render('clientes/form', {
    title: 'Nuevo cliente',
    mode: 'create',
    client: { full_name: '', phone: '' },
    error: null
  });
};

/* CREAR */
exports.create = async (req, res) => {
  const { full_name, phone } = req.body;

  if (!full_name || !full_name.trim()) {
    return res.status(400).render('clientes/form', {
      title: 'Nuevo cliente',
      mode: 'create',
      client: { full_name: full_name || '', phone: phone || '' },
      error: 'El nombre es obligatorio'
    });
  }

  await store.createClient({
    full_name: full_name.trim(),
    phone: phone ? phone.trim() : ''
  });

  res.redirect('/clientes');
};

/* FORM EDITAR */
exports.viewEdit = async (req, res) => {
  const client = await store.getClient(req.params.id);

  if (!client) {
    return res.status(404).render('error', {
      error: { status: 404, message: 'Cliente no encontrado' }
    });
  }

  res.render('clientes/form', {
    title: 'Editar cliente',
    mode: 'edit',
    client,
    error: null
  });
};

/* ACTUALIZAR */
exports.update = async (req, res) => {
  const { full_name, phone } = req.body;

  // buscamos el cliente para poder re-renderizar bien si hay error
  const client = await store.getClient(req.params.id);

  if (!client) {
    return res.status(404).render('error', {
      error: { status: 404, message: 'Cliente no encontrado' }
    });
  }

  if (!full_name || !full_name.trim()) {
    return res.status(400).render('clientes/form', {
      title: 'Editar cliente',
      mode: 'edit',
      client: { ...client, full_name: full_name || '', phone: phone || '' },
      error: 'El nombre es obligatorio'
    });
  }

  await store.updateClient(req.params.id, {
    full_name: full_name.trim(),
    phone: phone ? phone.trim() : ''
  });

  res.redirect('/clientes');
};

/* ELIMINAR */
exports.remove = async (req, res) => {
  await store.deleteClient(req.params.id);
  res.redirect('/clientes');
};
