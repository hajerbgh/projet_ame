import mysql from 'mysql2/promise';
import fs from 'fs/promises';

function predireRisque(nombre_sinistres, montant_total) {
  if (nombre_sinistres > 5 || montant_total > 20000) {
    return 'élevé';
  } else if (nombre_sinistres >= 2 || montant_total > 10000) {
    return 'moyen';
  } else {
    return 'faible';
  }
}

async function exportDataToCSV() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'stage_db'
  });

  const [rows] = await connection.execute(`
    SELECT
      c.id AS ID,
  c.name,
  c.cin,
  TIMESTAMPDIFF(YEAR, c.birth_date, CURDATE()) AS age,
  COUNT(s.id) AS nombre_sinistres,
  IFNULL(SUM(s.montant), 0) AS montant_total,
  TIMESTAMPDIFF(YEAR, MIN(co.date_debut), CURDATE()) AS anciennete,
  (SELECT co2.type_contrat
   FROM contrats co2
   WHERE co2.client_id = c.id
   ORDER BY co2.date_debut DESC
   LIMIT 1) AS type_contrat
    FROM clients c
    LEFT JOIN contrats co ON co.client_id = c.id
    LEFT JOIN sinistres s ON s.contrat_id = co.id
    GROUP BY c.id, c.birth_date
    ORDER BY c.id;
  `);

  let csv = 'ID,name,cin,age,nombre_sinistres,montant_total,anciennete,type_contrat,risque\n';

  rows.forEach(row => {
    const risque = predireRisque(row.nombre_sinistres, row.montant_total);
    csv += `${row.ID},"${row.name}","${row.cin}",${row.age},${row.nombre_sinistres},${row.montant_total},${row.anciennete},${row.type_contrat || ''},${risque}\n`;
  });

  await fs.writeFile('clients.csv', csv, 'utf8');
  console.log('Export CSV avec prédiction terminé avec succès');
  await connection.end();
}

exportDataToCSV().catch(err => console.error('Erreur :', err));
