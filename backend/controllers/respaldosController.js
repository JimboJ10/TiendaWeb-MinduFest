const pool = require('../db/pool');
const fs = require('fs');
const path = require('path');
const { parse } = require('fast-csv');
const moment = require('moment');

const allowedTables = ['producto', 'inventario', 'venta', 'detalleventa', 'direccion'];

const exportarCsv = async (req, res) => {
  const { tableName } = req.query;

  if (!allowedTables.includes(tableName)) {
    return res.status(400).json({ message: 'Nombre de tabla no permitido.' });
  }

  try {
    const query = `SELECT * FROM ${tableName}`;
    const { rows } = await pool.query(query);

    if (rows.length === 0) {
      return res.status(404).json({ message: `La tabla ${tableName} no contiene datos para exportar.` });
    }

    // Formatear la fecha y preparar la ruta de archivo
    const timestamp = moment().format('YYYYMMDD_HHmmss');
    const uploadsDir = path.resolve(__dirname, '../uploads');
    const exportsDir = path.join(uploadsDir, 'exports');
    const filePath = path.join(exportsDir, `${tableName}_export_${timestamp}.csv`);

    // Asegurar que las carpetas existan
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir); 
    }

    // Transformar las filas, si contienen fechas
    rows.forEach((row) => {
      Object.keys(row).forEach((key) => {
        if (row[key] instanceof Date) {
          row[key] = moment(row[key]).format('YYYY-MM-DD HH:mm:ss');
        }
      });
    });

    const csvStream = require('fast-csv').format({ headers: true });
    const writeStream = fs.createWriteStream(filePath);

    writeStream.on('error', (err) => {
      console.error('Error al escribir en el archivo:', err);
      return res.status(500).json({ message: 'Error al generar el archivo CSV.' });
    });

    // Escribir los datos en el archivo CSV
    csvStream.pipe(writeStream).on('finish', () => {
      // Enviar respuesta con un mensaje de éxito
      res.status(200).json({ message: 'Exportación completada.' });
    });

    rows.forEach((row) => csvStream.write(row));
    csvStream.end();

  } catch (error) {
    console.error('Error al exportar a CSV:', error);
    res.status(500).json({ message: 'Error al exportar a CSV.', error: error.message });
  }
};

const importarCsv = async (req, res) => {
  const { tableName } = req.query;

  if (!allowedTables.includes(tableName)) {
    return res.status(400).send("Nombre de tabla no permitido.");
  }

  if (!req.file) {
    return res.status(400).send("No se ha enviado ningún archivo.");
  }

  const filePath = req.file.path;

  try {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(parse({ headers: true }))
      .on('error', (error) => {
        console.error("Error al leer el archivo CSV:", error);
        res.status(500).send("Error al leer el archivo CSV.");
      })
      .on('data', (row) => {
        Object.keys(row).forEach((key) => {
          const value = row[key];
          if (moment(value, moment.ISO_8601, true).isValid()) {
            row[key] = moment(value).format('YYYY-MM-DD HH:mm:ss');
          }
        });
        rows.push(row);
      })
      .on('end', async () => {
        try {
          if (rows.length === 0) {
            return res.status(400).send("El archivo CSV está vacío.");
          }

          const columns = Object.keys(rows[0]);
          const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
          const insertQuery = `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${placeholders})`;

          for (const row of rows) {
            const values = Object.values(row).map((value) => value || null);
            await pool.query(insertQuery, values);
          }

          res.send("Datos importados correctamente.");
        } catch (error) {
          console.error("Error al importar los datos a la base de datos:", error);
          res.status(500).send("Error al importar los datos a la base de datos.");
        } finally {
          fs.unlinkSync(filePath);
        }
      });
  } catch (error) {
    console.error("Error al procesar el archivo CSV:", error);
    res.status(500).send("Error al procesar el archivo CSV.");
  }
};

const exportarCsvClientes = async (req, res) => {
  try {
    const query = `
      SELECT u.*
      FROM usuario u
      JOIN rol_usuario ru ON u.usuarioid = ru.usuarioid
      JOIN rol r ON ru.rolid = r.rolid
      WHERE r.nombre = 'Cliente';
    `;
    const { rows } = await pool.query(query);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No hay clientes para exportar.' });
    }

    // Formatear las fechas y preparar la ruta del archivo
    rows.forEach((row) => {
      Object.keys(row).forEach((key) => {
        if (row[key] instanceof Date) {
          row[key] = moment(row[key]).format('YYYY-MM-DD HH:mm:ss');
        }
      });
    });

    const timestamp = moment().format('YYYYMMDD_HHmmss');
    const uploadsDir = path.resolve(__dirname, '../uploads');
    const exportsDir = path.join(uploadsDir, 'exports');
    const filePath = path.join(exportsDir, `clientes_export_${timestamp}.csv`);

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir);
    }

    const csvStream = require('fast-csv').format({ headers: true });
    const writeStream = fs.createWriteStream(filePath);

    writeStream.on('error', (err) => {
      console.error('Error al escribir en el archivo:', err);
      return res.status(500).json({ message: 'Error al generar el archivo CSV.' });
    });

    csvStream.pipe(writeStream).on('finish', () => {
      res.status(200).json({ message: 'Exportación completada.' });
    });

    rows.forEach((row) => csvStream.write(row));
    csvStream.end();
  } catch (error) {
    console.error('Error al exportar clientes:', error);
    res.status(500).json({ message: 'Error al exportar clientes.', error: error.message });
  }
};

const importarCsvClientes = async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No se ha enviado ningún archivo.");
  }

  const filePath = req.file.path;

  try {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(parse({ headers: true }))
      .on('error', (error) => {
        console.error("Error al leer el archivo CSV:", error);
        res.status(500).send("Error al leer el archivo CSV.");
      })
      .on('data', (row) => {
        // Validar y formatear fechas en los datos
        Object.keys(row).forEach((key) => {
          const value = row[key];
          if (moment(value, moment.ISO_8601, true).isValid()) {
            row[key] = moment(value).format('YYYY-MM-DD HH:mm:ss');
          }
        });
        rows.push(row);
      })
      .on('end', async () => {
        try {
          if (rows.length === 0) {
            return res.status(400).send("El archivo CSV está vacío.");
          }

          const insertQuery = `
            INSERT INTO usuario (dni, nombres, apellidos, email, pais, password, telefono, fNacimiento, genero)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING usuarioid;
          `;

          for (const row of rows) {
            const values = [
              row.dni,
              row.nombres,
              row.apellidos,
              row.email,
              row.pais,
              row.password,
              row.telefono,
              row.fNacimiento,
              row.genero,
            ];

            const { rows: userRows } = await pool.query(insertQuery, values);

            // Asociar rol de cliente al usuario creado
            const usuarioid = userRows[0].usuarioid;
            const rolQuery = `
              INSERT INTO rol_usuario (usuarioid, rolid)
              VALUES ($1, (SELECT rolid FROM rol WHERE nombre = 'Cliente'));
            `;
            await pool.query(rolQuery, [usuarioid]);
          }

          res.send("Clientes importados correctamente.");
        } catch (error) {
          console.error("Error al importar clientes:", error);
          res.status(500).send("Error al importar clientes.");
        } finally {
          fs.unlinkSync(filePath);
        }
      });
  } catch (error) {
    console.error("Error al procesar el archivo CSV:", error);
    res.status(500).send("Error al procesar el archivo CSV.");
  }
};

module.exports = {
  exportarCsv,
  importarCsv,
  exportarCsvClientes,
  importarCsvClientes,
};
