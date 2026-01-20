const router = require('express').Router();
const { requireAuth } = require('../middlewares/auth');
const v = require('../controllers/viajes.controller');

router.get('/', requireAuth, v.viewDashboard);

router.get('/vender', requireAuth, v.viewVender);
router.post('/vender', requireAuth, v.createVenta);

router.get('/semanal', requireAuth, v.viewSemanalSelector);

router.get('/resumen/dia', requireAuth, v.viewResumenDia);

router.post('/pagos', requireAuth, v.registrarPago);

router.get('/mensual', requireAuth, v.viewMensual);

module.exports = router;
