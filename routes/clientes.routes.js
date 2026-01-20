const express = require('express');
const router = express.Router();

const clientesController = require('../controllers/clientes.controller');

// LISTADO
router.get('/', clientesController.list);

// CREAR (FORM + POST)
router.get('/nuevo', clientesController.viewCreate);
router.post('/nuevo', clientesController.create);

// EDITAR (FORM + POST)
router.get('/:id/editar', clientesController.viewEdit);
router.post('/:id/editar', clientesController.update);

// ELIMINAR
router.post('/:id/eliminar', clientesController.remove);

module.exports = router;
