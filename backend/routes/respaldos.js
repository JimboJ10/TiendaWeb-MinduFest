const { Router } = require('express');
const router = Router();
const uploads = require('../middlewares/uploadsMiddleware');
const { exportarCsv, importarCsv, exportarCsvClientes, importarCsvClientes } = require('../controllers/respaldosController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Ruta para exportar CSV
router.get('/exportarCSV', authMiddleware, exportarCsv);

// Ruta para importar CSV a una tabla
router.post('/importarCSV', authMiddleware, uploads.single('file'), importarCsv);

// Exportar clientes con rol Cliente
router.get('/exportarClientes', authMiddleware, exportarCsvClientes);

// Importar clientes con rol Cliente
router.post('/importarClientes', authMiddleware, uploads.single('file'), importarCsvClientes);


module.exports = router;
