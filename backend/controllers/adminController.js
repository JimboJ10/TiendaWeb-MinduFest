const pool = require('../db/pool');

const kpi_ganancias_mensuales_admin = async (req, res) => {
    try {
        // Obtener el año de la consulta (si no se proporciona, usar el año actual)
        const year = req.query.year || new Date().getFullYear();

        const result = await pool.query(`
            SELECT 
                DATE_TRUNC('month', fecha) AS mes,
                EXTRACT(YEAR FROM fecha) AS anio,
                SUM(subtotal) AS total_mes,
                COUNT(ventaid) AS num_ventas
            FROM venta 
            WHERE EXTRACT(YEAR FROM fecha) = $1
            GROUP BY mes, anio
            ORDER BY mes;
        `, [year]);

        // Crear objeto con los meses del año específico
        const allMonths = Array.from({ length: 12 }, (_, i) => ({
            mes: new Date(year, i, 1),
            total_mes: 0,
            num_ventas: 0,
            anio: parseInt(year)
        }));

        // Combinar resultados
        const monthlyData = allMonths.map(month => {
            const found = result.rows.find(row => 
                new Date(row.mes).getMonth() === month.mes.getMonth()
            );
            return found ? found : month;
        });

        const kpis = {
            year: parseInt(year),
            total_ganancia: result.rows.reduce((sum, row) => sum + parseFloat(row.total_mes), 0),
            total_mes: result.rows.length > 0 ? parseFloat(result.rows[result.rows.length - 1].total_mes) : 0,
            total_mes_anterior: result.rows.length > 1 ? parseFloat(result.rows[result.rows.length - 2].total_mes) : 0,
            count_ventas: result.rows.reduce((sum, row) => sum + parseInt(row.num_ventas, 10), 0),
            monthlyData: monthlyData
        };

        res.json(kpis);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

module.exports = {
    kpi_ganancias_mensuales_admin
};
