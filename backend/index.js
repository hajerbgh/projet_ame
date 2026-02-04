import express from 'express';
import cors from 'cors';
import mysql from 'mysql2';
import multer from 'multer';
import path from 'path';
import PDFDocument from 'pdfkit';
import nodemailer from 'nodemailer';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Parser } from 'json2csv';
import csvParser from 'csv-parser';
import axios from 'axios';
const passwordResetCodes = {}; // Stockage temporaire des codes
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 5000;
const transporter = nodemailer.createTransport({
  service: 'gmail', // Utilisez 'service' au lieu de host/port
  auth: {
    user: 'hajerbenghazi2003@gmail.com',
    pass: 'kzdc ddjp node vopy' // Votre mot de passe d'application
  },
  tls: {
    rejectUnauthorized: false
  }
});

// === Middleware ===
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// === Multer configuration ===
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// === Database connection with POOL ===
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'stage_db',
  port: 3306
});
console.log('Pool de connexions MySQL prêt.');

// Exécuter la procédure après l'initialisation de la base de données
db.query('CALL update_contract_statuses()', (err) => {
  if (err) {
    console.error('Erreur lors de l\'exécution de la procédure:', err);
  }
});

setInterval(() => {
  db.query('CALL update_contract_statuses()', (err) => {
    if (err) {
      console.error('Erreur lors de l\'exécution périodique:', err);
    }
  });
}, 3600000); // Toutes les heures

// === ROUTES ===

// Signup
app.post('/api/signup', upload.single('photo'), (req, res) => {
  const { fullName, cin, phoneNumber, email, password } = req.body;
  const photo = req.file ? req.file.filename : null;

  if (!fullName || !cin || !password) {
    return res.status(400).json({ message: 'Champs obligatoires manquants.' });
  }

  const sql = `INSERT INTO users (name, cin, phone_number, email, password, photo) VALUES (?, ?, ?, ?, ?, ?)`;
  db.query(sql, [fullName, cin, phoneNumber, email, password, photo], (err) => {
    if (err) {
      console.error('Erreur lors de l\'insertion :', err);
      return res.status(500).json({ message: 'Erreur lors de l\'inscription.' });
    }
    res.status(200).json({ message: 'Inscription réussie !' });
  });
});

// Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const sql = 'SELECT * FROM users WHERE email = ? AND password = ?';

  db.query(sql, [email, password], (err, results) => {
    if (err) {
      console.error('Erreur login :', err);
      return res.status(500).json({ message: 'Erreur serveur.' });
    }

    if (results.length > 0) {
      const user = results[0];
      return res.status(200).json({
        message: 'Connexion réussie',
        user: {
          id: user.id,
          nom: user.name,
          email: user.email,
          
          photo: user.photo,
          role: 'Employé'
        }
      });
    } else {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
  });
});

// Route pour traiter un sinistre (accepter/rejeter)
app.put('/api/claims/:id/process', async (req, res) => {
  const { id } = req.params;
  const { statut, adminSignature } = req.body;

  try {
    // 1. Mettre à jour le statut dans la base
    await db.promise().query(
      'UPDATE sinistres SET statut = ? WHERE id = ?',
      [statut, id]
    );

    // 2. Récupérer les infos complètes du sinistre
   const [claim] = await db.promise().query(`
  SELECT 
    s.*, 
    cl.email AS client_email, 
    cl.name AS client_name,
    cl.phone AS client_phone
  FROM sinistres s
  JOIN contrats c ON s.contrat_id = c.id
  JOIN clients cl ON c.client_id = cl.id
  WHERE s.id = ?
`, [id]);

    if (claim.length === 0) {
      return res.status(404).json({ error: 'Sinistre non trouvé' });
    }

    const claimData = claim[0];

    // 3. Générer le PDF
    const pdfFileName = `sinistre_${id}_${Date.now()}.pdf`;
    const pdfPath = path.join(__dirname, 'pdfs', pdfFileName);
    
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(path.dirname(pdfPath))) {
      fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
    }

    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(pdfPath));

    // Design du PDF
    doc.fillColor('#1a5632') // Vert foncé
       .fontSize(20)
       .text('Règlement de Sinistre', { align: 'center' });
    
    doc.moveDown();
    doc.fillColor('#000000')
       .fontSize(12)
       .text(`Référence: SIN-${id}`, { align: 'left' });
    
    doc.moveDown();
    doc.text(`Client: ${claimData.client_name}`);
    doc.text(`Type de sinistre: ${claimData.type_sinistre}`);
    doc.text(`Date: ${new Date(claimData.date_sinistre).toLocaleDateString()}`);
    doc.text(`Montant: ${claimData.montant} DT`);
    doc.text(`Statut: ${statut.toUpperCase()}`);

    doc.moveDown(2);
    doc.text('Décision:');
    doc.text(statut === 'traité' 
      ? 'Votre sinistre a été accepté et sera remboursé selon les termes du contrat.'
      : 'Votre sinistre a été rejeté pour les raisons indiquées dans notre règlement.');

    // Ajouter la signature électronique (simulée)
    doc.moveDown();
    doc.fillColor('#1a5632')
       .text('Signature électronique:', { continued: true })
       .fillColor('#000000')
       .text(adminSignature || 'Admin Assurance');
    
    doc.end();

    // 4. Envoyer l'email
    const mailOptions = {
      from: '"Assurance" <hajerbenghazi2003@gmail.com>',
      to: claimData.client_email,
      subject: `Votre sinistre ${id} a été traité`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #1a5632;">
          <h2>Bonjour ${claimData.client_name},</h2>
          <p>Votre sinistre <strong>SIN-${id}</strong> a été traité avec le statut: <strong>${statut}</strong>.</p>
          <p>Veuillez trouver ci-joint le document officiel de règlement.</p>
          <p style="color: #666;">Cordialement,<br/>L'équipe Assurance</p>
        </div>
      `,
      attachments: [{
        filename: `sinistre_${id}.pdf`,
        path: pdfPath
      }]
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: `Sinistre ${statut} et email envoyé` });
  } catch (err) {
    console.error('Erreur traitement sinistre:', err);
    res.status(500).json({ error: 'Erreur lors du traitement' });
  }
});

// Liste des sinistres
app.get('/api/claims', (req, res) => {
  const sql = `
    SELECT 
      s.id,
      s.contrat_id,
      c.name AS client_name,
      c.cin,
      c.phone AS client_phone,
      s.date_sinistre,
      s.type_sinistre,
      s.zone,
      s.montant,
      s.statut,
      s.description,
      co.type_contrat,
      co.date_debut,
      co.date_fin,
      CASE 
        WHEN co.date_fin < CURDATE() THEN 'expiré'
        ELSE co.statut
      END AS contrat_statut
    FROM sinistres s
    JOIN contrats co ON s.contrat_id = co.id
    JOIN clients c ON co.client_id = c.id
    ORDER BY s.date_sinistre DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Erreur récupération sinistres:', err);
      return res.status(500).json({ message: 'Erreur serveur.' });
    }
    res.json(results);
  });
});

// Liste des contrats
app.get('/api/update-contract-statuses', (req, res) => {
  db.query('CALL update_contract_statuses()', (err) => {
    if (err) {
      console.error('Erreur mise à jour statuts:', err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    res.json({ message: 'Statuts des contrats mis à jour' });
  });
});

// Modifiez la route des contrats pour inclure le statut calculé
app.get('/api/contracts', (req, res) => {
  const sql = `
    SELECT 
      c.id,
      c.client_id,
      cl.name AS client_name,
      cl.cin,
      c.type_contrat AS type,
      c.date_debut AS start_date,
      c.date_fin AS end_date,
      CASE 
        WHEN c.date_fin < CURDATE() THEN 'expiré'
        ELSE c.statut
      END AS status
    FROM contrats c
    JOIN clients cl ON c.client_id = cl.id
    ORDER BY c.date_debut DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Erreur récupération contrats:', err);
      return res.status(500).json({ message: 'Erreur serveur.' });
    }
    res.json(results);
  });
});
// Route pour traiter un sinistre (accepter/rejeter)
app.put('/api/claims/:id/process', async (req, res) => {
  const { id } = req.params;
  const { statut, signatureData } = req.body;

  try {
    // 1. Mettre à jour le statut dans la base
    await db.promise().query(
      'UPDATE sinistres SET statut = ? WHERE id = ?',
      [statut, id]
    );

    // 2. Récupérer les infos complètes du sinistre
    const [claim] = await db.promise().query(`
      SELECT s.*, c.email AS client_email, cl.name AS client_name
      FROM sinistres s
      JOIN contrats c ON s.contrat_id = c.id
      JOIN clients cl ON c.client_id = cl.id
      WHERE s.id = ?
    `, [id]);

    if (claim.length === 0) {
      return res.status(404).json({ error: 'Sinistre non trouvé' });
    }

    const claimData = claim[0];

    // 3. Générer le PDF
    const pdfFileName = `sinistre_${id}_${Date.now()}.pdf`;
    const pdfPath = path.join(__dirname, 'pdfs', pdfFileName);
    
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(path.dirname(pdfPath))) {
      fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
    }

    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(pdfPath));

    // Design du PDF
    doc.fillColor('#1a5632') // Vert foncé
       .fontSize(20)
       .text('Règlement de Sinistre', { align: 'center' });
    
    doc.moveDown();
    doc.fillColor('#000000')
       .fontSize(12)
       .text(`Référence: SIN-${id}`, { align: 'left' });
    
    doc.moveDown();
    doc.text(`Client: ${claimData.client_name}`);
    doc.text(`Type de sinistre: ${claimData.type_sinistre}`);
    doc.text(`Date: ${new Date(claimData.date_sinistre).toLocaleDateString()}`);
    doc.text(`Montant: ${claimData.montant} DT`);
    doc.text(`Statut: ${statut.toUpperCase()}`);

    doc.moveDown(2);
    doc.text('Décision:');
    doc.text(statut === 'traité' 
      ? 'Votre sinistre a été accepté et sera remboursé selon les termes du contrat.'
      : 'Votre sinistre a été rejeté pour les raisons indiquées dans notre règlement.');

    // Ajouter la signature électronique
    if (signatureData) {
      doc.moveDown();
      doc.text('Signature électronique:');
      doc.moveDown(0.5);
      
      // Ajouter l'image de la signature
      const signatureBuffer = Buffer.from(signatureData.split(',')[1], 'base64');
      doc.image(signatureBuffer, {
        width: 150,
        align: 'left'
      });
    }

    doc.end();

    // 4. Envoyer l'email (même code qu'avant)
    // ... (votre code existant pour l'envoi d'email)

    res.json({ success: true, message: `Sinistre ${statut} et email envoyé` });
  } catch (err) {
    console.error('Erreur traitement sinistre:', err);
    res.status(500).json({ error: 'Erreur lors du traitement' });
  }
});
// GET all clients
app.get('/api/clients', (req, res) => {
  const sql = 'SELECT * FROM clients ORDER BY name ASC';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Erreur récupération clients:', err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    res.json(results);
  });
});

// GET single client
app.get('/api/clients/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'SELECT * FROM clients WHERE id = ?';
  
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error('Erreur récupération client:', err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }
    res.json(results[0]);
  });
});

// POST new client (version corrigée)
app.post('/api/clients', (req, res) => {
  const { name, cin, email, phone, birth_date, address } = req.body;
  
  // Validation des champs
  if (!name || !cin || !phone) {
    return res.status(400).json({ error: 'Nom, CIN et téléphone sont obligatoires' });
  }

  if (!/^\d{8}$/.test(cin)) {
    return res.status(400).json({ error: 'Le CIN doit contenir 8 chiffres' });
  }

  if (!/^\d{8}$/.test(phone)) {
    return res.status(400).json({ error: 'Le téléphone doit contenir 8 chiffres' });
  }

  const sql = `INSERT INTO clients (name, cin, email, phone, birth_date, address) 
               VALUES (?, ?, ?, ?, ?, ?)`;
  
  db.query(sql, [name, cin, email, phone, birth_date, address], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ 
          error: err.sqlMessage.includes('cin') 
            ? 'Un client avec ce CIN existe déjà' 
            : 'Un client avec ce numéro de téléphone existe déjà'
        });
      }
      return res.status(500).json({ error: 'Erreur base de données' });
    }
    
    // Retourner le client créé
    db.query('SELECT * FROM clients WHERE id = ?', [result.insertId], (err, results) => {
      res.status(201).json(results[0]);
    });
  });
});

// PUT update client
app.put('/api/clients/:id', (req, res) => {
  const { id } = req.params;
  const { name, cin, email, phone, birth_date, address } = req.body;

  if (!name || !cin) {
    return res.status(400).json({ error: 'Le nom et le CIN sont obligatoires' });
  }

  const sql = `UPDATE clients SET 
               name=?, cin=?, email=?, phone=?, birth_date=?, address=?
               WHERE id=?`;
  
  db.query(sql, [name, cin, email, phone, birth_date, address, id], (err, result) => {
    if (err) {
      console.error('Erreur modification client:', err);
      
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ 
          error: 'Un client avec ce CIN existe déjà',
          details: err.message
        });
      }
      
      return res.status(500).json({ 
        error: 'Erreur base de données',
        details: err.message
      });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }
    
    // Retourner le client mis à jour plutôt qu'un simple message
    db.query('SELECT * FROM clients WHERE id = ?', [id], (err, results) => {
      if (err || results.length === 0) {
        return res.status(200).json({
          message: 'Client mis à jour avec succès',
          clientId: id
        });
      }
      res.status(200).json(results[0]);
    });
  });
});

// DELETE client
app.delete('/api/clients/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM clients WHERE id = ?';
  
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Erreur suppression client:', err);
      return res.status(500).json({ 
        error: 'Erreur base de données',
        details: err.message
      });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }
    
    res.json({ message: 'Client supprimé avec succès' });
  });
});

// Dashboard
app.get('/api/dashboard', (req, res) => {
  const stats = {
    totalSinistres: 0,
    nombreClients: 0,
    coutTotal: 0,
    sinistresParType: [],
    evolutionMensuelle: [],
    predictionsRisqueEleve: 0
  };

  const queryTotalSinistres = `SELECT COUNT(*) AS total FROM sinistres`;
  const queryTotalClients = `SELECT COUNT(*) AS total FROM clients`;
 const queryCoutTotal = `
  SELECT SUM(montant) AS total
  FROM sinistres
  WHERE MONTH(date_sinistre) = MONTH(CURRENT_DATE()) 
  AND YEAR(date_sinistre) = YEAR(CURRENT_DATE())
`;
  const querySinistresParType = `
    SELECT type_sinistre AS name, COUNT(*) AS value
    FROM sinistres
    GROUP BY type_sinistre
  `;
  const queryEvolutionMensuelle = `
    SELECT MONTHNAME(date_sinistre) AS mois, COUNT(*) AS sinistres
    FROM sinistres
    WHERE date_sinistre >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
    GROUP BY mois, MONTH(date_sinistre)
    ORDER BY MONTH(date_sinistre)
  `;
  const queryPrediction = `
  SELECT COUNT(*) AS predictionsRisqueEleve
  FROM scores_risque
  WHERE score >= 0.8
  AND date_calcul >= DATE_SUB(NOW(), INTERVAL 1 DAY)
`;

  db.query(queryTotalSinistres, (err, result1) => {
    if (err) return res.status(500).json({ error: 'Erreur total sinistres' });
    stats.totalSinistres = result1[0].total;

    db.query(queryTotalClients, (err, result2) => {
      if (err) return res.status(500).json({ error: 'Erreur total clients' });
      stats.nombreClients = result2[0].total;

      db.query(queryCoutTotal, (err, result3) => {
        if (err) return res.status(500).json({ error: 'Erreur coût total' });
        stats.coutTotal = result3[0].total || 0;

        db.query(querySinistresParType, (err, result4) => {
          if (err) return res.status(500).json({ error: 'Erreur sinistres par type' });
          stats.sinistresParType = result4;

          db.query(queryEvolutionMensuelle, (err, result5) => {
            if (err) return res.status(500).json({ error: 'Erreur évolution mensuelle' });
            stats.evolutionMensuelle = result5;

            db.query(queryPrediction, (err, result6) => {
              if (err) return res.status(500).json({ error: 'Erreur prédictions risque élevé' });
              stats.predictionsRisqueEleve = result6[0].predictionsRisqueEleve;
              res.json(stats);
            });
          });
        });
      });
    });
  });
});

// Export CSV
app.get('/api/export-csv', (req, res) => {
  const sql = `
    SELECT
      cl.id AS client_id,
      cl.name AS client_name,
      cl.email,
      cl.phone,
      cl.address,
      cl.birth_date,
      cl.cin,
      co.type_contrat,
      co.date_debut,
      co.date_fin,
      co.statut AS contrat_statut,
      s.type_sinistre,
      s.date_sinistre,
      s.zone,
      s.montant,
      s.statut AS sinistre_statut
    FROM clients cl
    LEFT JOIN contrats co ON co.client_id = cl.id
    LEFT JOIN sinistres s ON s.contrat_id = co.id
    ORDER BY cl.id;
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Erreur export CSV:', err);
      return res.status(500).json({ error: 'Erreur serveur lors de l\'export CSV' });
    }

    try {
      const fields = [
        'client_id', 'client_name', 'email', 'phone', 'address', 'birth_date', 'cin',
        'type_contrat', 'date_debut', 'date_fin', 'contrat_statut',
        'type_sinistre', 'date_sinistre', 'zone', 'montant', 'sinistre_statut'
      ];

      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(results);

      const filePath = path.join(__dirname, 'exports', 'data_export.csv');
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, csv);

      res.download(filePath, 'data_export.csv', (err) => {
        if (err) {
          console.error('Erreur lors de l\'envoi du fichier:', err);
          res.status(500).send('Erreur lors de l\'envoi du fichier');
        }
      });
    } catch (err) {
      console.error('Erreur transformation CSV:', err);
      res.status(500).json({ error: 'Erreur transformation CSV' });
    }
  });
});
///////
app.get('/test-email', async (req, res) => {
  try {
    const mailOptions = {
      from: '"Test Assurance" <hajerbenghazi2003@gmail.com>',
      to: 'hajerbenghazi2003@gmail.com', // Envoyez à vous-même pour tester
      subject: 'Test SMTP - ' + new Date().toISOString(),
      text: 'Ceci est un email de test depuis votre application Assurance',
      html: '<b>Ceci est un email de test depuis votre application Assurance</b>'
    };

    const info = await transporter.sendMail(mailOptions);
    res.send(`
      <h1>Email de test envoyé avec succès</h1>
      <p>Message ID: ${info.messageId}</p>
      ${nodemailer.getTestMessageUrl(info) ? 
        `<p>URL de prévisualisation: ${nodemailer.getTestMessageUrl(info)}</p>` : ''}
    `);
  } catch (err) {
    console.error('Échec du test email:', {
      code: err.code,
      response: err.response,
      stack: err.stack
    });
    res.status(500).send(`
      <h1>Échec d'envoi d'email</h1>
      <p><strong>Erreur:</strong> ${err.message}</p>
      <p><strong>Code:</strong> ${err.code}</p>
      ${err.response ? `<p><strong>Réponse:</strong> ${err.response}</p>` : ''}
    `);
  }
});
///////
// AI Prediction
app.post('/api/predict-risk', async (req, res) => {
  try {
    const clientData = req.body;
    const response = await axios.post('http://localhost:5001/predict', clientData);
    res.json(response.data);
  } catch (err) {
    console.error('Erreur prédiction :', err);
    res.status(500).json({ error: 'Erreur prédiction IA' });
  }
});

// Get predictions
app.get('/api/predictions', (req, res) => {
  const results = [];
  fs.createReadStream('clients.csv')
    .pipe(csvParser())
    .on('data', (data) => {
      results.push({
        id: Number(data.ID),
        name: data.name,
        cin: data.cin,
        age: Number(data.age),
        nombre_sinistres: Number(data.nombre_sinistres),
        montant_total: Number(data.montant_total),
        type_contrat: data.type_contrat,
        score: data.risque === 'élevé' ? 0.9 : data.risque === 'moyen' ? 0.6 : 0.2,
      });
    })
    .on('end', () => {
      res.json(results);
    });
});

// Save prediction
app.post('/api/save-prediction', (req, res) => {
  const { name, cin, age, type_contrat, nombre_sinistres, score } = req.body;
  const sql = `INSERT INTO scores_risque (name, cin, age, type_contrat, nombre_sinistres, score, date_calcul)
               VALUES (?, ?, ?, ?, ?, ?, NOW())`;

  db.query(sql, [name, cin, age, type_contrat, nombre_sinistres, score], (err) => {
    if (err) {
      console.error('Erreur sauvegarde prédiction:', err);
      return res.status(500).json({ error: 'Erreur sauvegarde' });
    }
    res.status(200).json({ message: 'Prédiction enregistrée' });
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Erreur non gérée:', err);
  res.status(500).json({ 
    error: 'Erreur interne du serveur',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(` Serveur démarré sur http://localhost:${PORT}`);
});
// GET all clients
app.get('/api/clients', (req, res) => {
  const sql = 'SELECT * FROM clients ORDER BY name ASC';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Erreur récupération clients:', err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    res.json(results);
  });
});

// GET single client
app.get('/api/clients/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'SELECT * FROM clients WHERE id = ?';
  
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error('Erreur récupération client:', err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }
    res.json(results[0]);
  });
});

// POST new client (version corrigée)
app.post('/api/clients', (req, res) => {
  const { name, cin, email, phone, birth_date, address } = req.body;
  
  // Validation des champs
  if (!name || !cin || !phone) {
    return res.status(400).json({ error: 'Nom, CIN et téléphone sont obligatoires' });
  }

  if (!/^\d{8}$/.test(cin)) {
    return res.status(400).json({ error: 'Le CIN doit contenir 8 chiffres' });
  }

  if (!/^\d{8}$/.test(phone)) {
    return res.status(400).json({ error: 'Le téléphone doit contenir 8 chiffres' });
  }

  const sql = `INSERT INTO clients (name, cin, email, phone, birth_date, address) 
               VALUES (?, ?, ?, ?, ?, ?)`;
  
  db.query(sql, [name, cin, email, phone, birth_date, address], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ 
          error: err.sqlMessage.includes('cin') 
            ? 'Un client avec ce CIN existe déjà' 
            : 'Un client avec ce numéro de téléphone existe déjà'
        });
      }
      return res.status(500).json({ error: 'Erreur base de données' });
    }
    
    // Retourner le client créé
    db.query('SELECT * FROM clients WHERE id = ?', [result.insertId], (err, results) => {
      res.status(201).json(results[0]);
    });
  });
});

// PUT update client
app.put('/api/clients/:id', (req, res) => {
  const { id } = req.params;
  const { name, cin, email, phone, birth_date, address } = req.body;

  if (!name || !cin) {
    return res.status(400).json({ error: 'Le nom et le CIN sont obligatoires' });
  }

  const sql = `UPDATE clients SET 
               name=?, cin=?, email=?, phone=?, birth_date=?, address=?
               WHERE id=?`;
  
  db.query(sql, [name, cin, email, phone, birth_date, address, id], (err, result) => {
    if (err) {
      console.error('Erreur modification client:', err);
      
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ 
          error: 'Un client avec ce CIN existe déjà',
          details: err.message
        });
      }
      
      return res.status(500).json({ 
        error: 'Erreur base de données',
        details: err.message
      });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }
    
    // Retourner le client mis à jour plutôt qu'un simple message
    db.query('SELECT * FROM clients WHERE id = ?', [id], (err, results) => {
      if (err || results.length === 0) {
        return res.status(200).json({
          message: 'Client mis à jour avec succès',
          clientId: id
        });
      }
      res.status(200).json(results[0]);
    });
  });
});

// DELETE client
app.delete('/api/clients/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM clients WHERE id = ?';
  
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Erreur suppression client:', err);
      return res.status(500).json({ 
        error: 'Erreur base de données',
        details: err.message
      });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }
    
    res.json({ message: 'Client supprimé avec succès' });
  });
});

// Dashboard
app.get('/api/dashboard', (req, res) => {
  const stats = {
    totalSinistres: 0,
    nombreClients: 0,
    coutTotal: 0,
    sinistresParType: [],
    evolutionMensuelle: [],
    predictionsRisqueEleve: 0
  };

  const queryTotalSinistres = `SELECT COUNT(*) AS total FROM sinistres`;
  const queryTotalClients = `SELECT COUNT(*) AS total FROM clients`;
  const queryCoutTotal = `
    SELECT SUM(montant) AS total
    FROM sinistres
    WHERE MONTH(date_sinistre) = MONTH(CURDATE()) AND YEAR(date_sinistre) = YEAR(CURDATE())
  `;
  const querySinistresParType = `
    SELECT type_sinistre AS name, COUNT(*) AS value
    FROM sinistres
    GROUP BY type_sinistre
  `;
  const queryEvolutionMensuelle = `
    SELECT MONTHNAME(date_sinistre) AS mois, COUNT(*) AS sinistres
    FROM sinistres
    WHERE date_sinistre >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
    GROUP BY mois, MONTH(date_sinistre)
    ORDER BY MONTH(date_sinistre)
  `;
  const queryPrediction = `
  SELECT COUNT(*) AS predictionsRisqueEleve
  FROM scores_risque
  WHERE (nombre_sinistres > 5 OR score >= 0.8)
  AND date_calcul >= DATE_SUB(NOW(), INTERVAL 7 DAY)
`;

  db.query(queryTotalSinistres, (err, result1) => {
    if (err) return res.status(500).json({ error: 'Erreur total sinistres' });
    stats.totalSinistres = result1[0].total;

    db.query(queryTotalClients, (err, result2) => {
      if (err) return res.status(500).json({ error: 'Erreur total clients' });
      stats.nombreClients = result2[0].total;

      db.query(queryCoutTotal, (err, result3) => {
        if (err) return res.status(500).json({ error: 'Erreur coût total' });
        stats.coutTotal = result3[0].total || 0;

        db.query(querySinistresParType, (err, result4) => {
          if (err) return res.status(500).json({ error: 'Erreur sinistres par type' });
          stats.sinistresParType = result4;

          db.query(queryEvolutionMensuelle, (err, result5) => {
            if (err) return res.status(500).json({ error: 'Erreur évolution mensuelle' });
            stats.evolutionMensuelle = result5;

            db.query(queryPrediction, (err, result6) => {
              if (err) return res.status(500).json({ error: 'Erreur prédictions risque élevé' });
              stats.predictionsRisqueEleve = result6[0].predictionsRisqueEleve;
              res.json(stats);
            });
          });
        });
      });
    });
  });
});

// Export CSV
app.get('/api/export-csv', (req, res) => {
  const sql = `
    SELECT
      cl.id AS client_id,
      cl.name AS client_name,
      cl.email,
      cl.phone,
      cl.address,
      cl.birth_date,
      cl.cin,
      co.type_contrat,
      co.date_debut,
      co.date_fin,
      co.statut AS contrat_statut,
      s.type_sinistre,
      s.date_sinistre,
      s.zone,
      s.montant,
      s.statut AS sinistre_statut
    FROM clients cl
    LEFT JOIN contrats co ON co.client_id = cl.id
    LEFT JOIN sinistres s ON s.contrat_id = co.id
    ORDER BY cl.id;
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Erreur export CSV:', err);
      return res.status(500).json({ error: 'Erreur serveur lors de l\'export CSV' });
    }

    try {
      const fields = [
        'client_id', 'client_name', 'email', 'phone', 'address', 'birth_date', 'cin',
        'type_contrat', 'date_debut', 'date_fin', 'contrat_statut',
        'type_sinistre', 'date_sinistre', 'zone', 'montant', 'sinistre_statut'
      ];

      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(results);

      const filePath = path.join(__dirname, 'exports', 'data_export.csv');
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, csv);

      res.download(filePath, 'data_export.csv', (err) => {
        if (err) {
          console.error('Erreur lors de l\'envoi du fichier:', err);
          res.status(500).send('Erreur lors de l\'envoi du fichier');
        }
      });
    } catch (err) {
      console.error('Erreur transformation CSV:', err);
      res.status(500).json({ error: 'Erreur transformation CSV' });
    }
  });
});
///////
app.get('/test-email', async (req, res) => {
  try {
    const mailOptions = {
      from: '"Test Assurance" <hajerbenghazi2003@gmail.com>',
      to: 'hajerbenghazi2003@gmail.com', //  pour tester
      subject: 'Test SMTP - ' + new Date().toISOString(),
      text: 'Ceci est un email de test depuis votre application Assurance',
      html: '<b>Ceci est un email de test depuis votre application Assurance</b>'
    };

    const info = await transporter.sendMail(mailOptions);
    res.send(`
      <h1>Email de test envoyé avec succès</h1>
      <p>Message ID: ${info.messageId}</p>
      ${nodemailer.getTestMessageUrl(info) ? 
        `<p>URL de prévisualisation: ${nodemailer.getTestMessageUrl(info)}</p>` : ''}
    `);
  } catch (err) {
    console.error('Échec du test email:', {
      code: err.code,
      response: err.response,
      stack: err.stack
    });
    res.status(500).send(`
      <h1>Échec d'envoi d'email</h1>
      <p><strong>Erreur:</strong> ${err.message}</p>
      <p><strong>Code:</strong> ${err.code}</p>
      ${err.response ? `<p><strong>Réponse:</strong> ${err.response}</p>` : ''}
    `);
  }
});
///////
// AI Prediction
app.post('/api/predict-risk', async (req, res) => {
  try {
    const clientData = req.body;
    const response = await axios.post('http://localhost:5001/predict', clientData);
    res.json(response.data);
  } catch (err) {
    console.error('Erreur prédiction :', err);
    res.status(500).json({ error: 'Erreur prédiction IA' });
  }
});

// Get predictions
app.get('/api/predictions', (req, res) => {
  const results = [];
  fs.createReadStream('clients.csv')
    .pipe(csvParser())
    .on('data', (data) => {
      results.push({
        id: Number(data.ID),
        name: data.name,
        cin: data.cin,
        age: Number(data.age),
        nombre_sinistres: Number(data.nombre_sinistres),
        montant_total: Number(data.montant_total),
        type_contrat: data.type_contrat,
        score: data.risque === 'élevé' ? 0.9 : data.risque === 'moyen' ? 0.6 : 0.2,
      });
    })
    .on('end', () => {
      res.json(results);
    });
});

// Save prediction
app.post('/api/save-prediction', (req, res) => {
  const { name, cin, age, type_contrat, nombre_sinistres, score } = req.body;
  const sql = `INSERT INTO scores_risque (name, cin, age, type_contrat, nombre_sinistres, score, date_calcul)
               VALUES (?, ?, ?, ?, ?, ?, NOW())`;

  db.query(sql, [name, cin, age, type_contrat, nombre_sinistres, score], (err) => {
    if (err) {
      console.error('Erreur sauvegarde prédiction:', err);
      return res.status(500).json({ error: 'Erreur sauvegarde' });
    }
    res.status(200).json({ message: 'Prédiction enregistrée' });
  });
});
// GET all users
app.get('/api/users', (req, res) => {
  const sql = 'SELECT id, name, cin, email, phone_number, photo FROM users ORDER BY name ASC';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Erreur récupération utilisateurs:', err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    res.json(results);
  });
});

// POST new user
app.post('/api/users', upload.single('photo'), (req, res) => {
  const { name, cin, email, phone_number, password } = req.body;
  const photo = req.file ? req.file.filename : null;

  if (!name || !cin || !password || !phone_number) {
    return res.status(400).json({ error: 'Tous les champs sont obligatoires' });
  }

  const sql = `INSERT INTO users (name, cin, email, phone_number, password, photo) 
               VALUES (?, ?, ?, ?, ?, ?)`;
  
  db.query(sql, [name, cin, email, phone_number, password, photo], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ 
          error: err.sqlMessage.includes('cin') 
            ? 'Un utilisateur avec ce CIN existe déjà' 
            : 'Un utilisateur avec cet email existe déjà'
        });
      }
      return res.status(500).json({ error: 'Erreur base de données' });
    }
    
    res.status(201).json({ 
      id: result.insertId,
      name,
      cin,
      email,
      phone_number,
      photo
    });
  });
});

// PUT update user
app.put('/api/users/:id', upload.single('photo'), (req, res) => {
  const { id } = req.params;
  const { name, cin, email, phone_number, password } = req.body;
  const photo = req.file ? req.file.filename : req.body.existingPhoto;

  if (!name || !cin) {
    return res.status(400).json({ error: 'Le nom et le CIN sont obligatoires' });
  }

  let sql, params;
  if (password) {
    sql = `UPDATE users SET 
           name=?, cin=?, email=?, phone_number=?, password=?, photo=?
           WHERE id=?`;
    params = [name, cin, email, phone_number, password, photo, id];
  } else {
    sql = `UPDATE users SET 
           name=?, cin=?, email=?, phone_number=?, photo=?
           WHERE id=?`;
    params = [name, cin, email, phone_number, photo, id];
  }

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('Erreur modification utilisateur:', err);
      return res.status(500).json({ error: 'Erreur base de données' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    res.json({ 
      id,
      name,
      cin,
      email,
      phone_number,
      photo
    });
  });
});

// DELETE user
app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM users WHERE id = ?';
  
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Erreur suppression utilisateur:', err);
      return res.status(500).json({ error: 'Erreur base de données' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    res.json({ message: 'Utilisateur supprimé avec succès' });
  });
});
app.get('/api/users/:id', (req, res) => {
  const id = req.params.id;
  db.query('SELECT * FROM users WHERE id = ?', [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const user = results[0];
    res.json({
      name: user.name,
      cin: user.cin,
      email: user.email,
      phone: user.phone_number,
      photo: user.photo
    });
  });
});
app.get('/api/sinistres/carte', (req, res) => {
  const sql = `
    SELECT 
      s.id,
      s.zone,
      s.type_sinistre,
      s.montant,
      s.date_sinistre,
      c.latitude,
      c.longitude
    FROM sinistres s
    LEFT JOIN coordonnees c ON s.zone = c.nom_zone
    WHERE c.latitude IS NOT NULL AND c.longitude IS NOT NULL
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Erreur récupération sinistres pour carte:', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    res.json(results);
  });
});
// Après la connexion DB
setInterval(async () => {
  try {
    await db.query('CALL calculer_risques()');
    console.log('Mise à jour des risques effectuée');
  } catch (err) {
    console.error('Erreur mise à jour risques:', err);
  }
}, 3600000); // Toutes les heures
// Récupérer les données de l'utilisateur connecté
app.get('/api/users/me', authenticate, async (req, res) => {
  try {
    const [users] = await db.promise().query(
      'SELECT id, name, email, phone_number, cin, photo FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json(users[0]);
  } catch (err) {
    console.error('Erreur:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Middleware d'authentification 
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Non authentifié' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token invalide' });
  }
}
// Mise à jour du profile
app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone_number, cin } = req.body;

  try {
    const sql = `UPDATE users SET 
                 name = ?, email = ?, phone_number = ?, cin = ?
                 WHERE id = ?`;
    
    await db.promise().query(sql, [name, email, phone_number, cin, id]);
    
    // Récupérer l'utilisateur mis à jour
    const [updatedUser] = await db.promise().query('SELECT * FROM users WHERE id = ?', [id]);
    
    res.json({ 
      success: true, 
      message: 'Profile mis à jour',
      user: updatedUser[0]
    });
  } catch (err) {
    console.error('Erreur mise à jour utilisateur:', err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
});

// Changement de mot de passe
app.post('/api/users/change-password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id; // Supposant que vous avez un middleware d'authentification

  try {
    // 1. Vérifier l'ancien mot de passe
    const [user] = await db.promise().query('SELECT * FROM users WHERE id = ?', [userId]);
    
    if (user.length === 0 || user[0].password !== currentPassword) {
      return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
    }

    // 2. Mettre à jour le mot de passe
    await db.promise().query('UPDATE users SET password = ? WHERE id = ?', [newPassword, userId]);
    
    res.json({ success: true, message: 'Mot de passe mis à jour' });
  } catch (err) {
    console.error('Erreur changement mot de passe:', err);
    res.status(500).json({ error: 'Erreur lors du changement de mot de passe' });
  }
});
app.post('/api/request-reset-code', (req, res) => {
  const { email } = req.body;

  // Vérifiez d'abord que l'email est fourni
  if (!email) {
    return res.status(400).json({ message: 'Email requis' });
  }

  const sql = 'SELECT * FROM users WHERE email = ?'; // Changé de clients à users
  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error('Erreur DB:', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Email introuvable' });
    }

    // Générer un code à 6 chiffres
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // expire dans 10 minutes
    passwordResetCodes[email] = { code, expires };

    const mailOptions = {
      from: '"Assurance" <hajerbenghazi2003@gmail.com>',
      to: email,
      subject: 'Code de réinitialisation de mot de passe',
      text: `Votre code de réinitialisation est : ${code}\nCe code expire dans 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Réinitialisation de mot de passe</h2>
          <p>Votre code de réinitialisation est : <strong>${code}</strong></p>
          <p>Ce code expire dans 10 minutes.</p>
          <p>Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.</p>
        </div>
      `
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Erreur envoi email:', error);
        return res.status(500).json({ message: 'Erreur lors de l\'envoi du code' });
      }
      console.log('Email envoyé:', info.messageId);
      res.status(200).json({ 
        message: 'Code envoyé par email',
        code: code // À supprimer en production, juste pour les tests
      });
    });
  });
});
app.post('/api/reset-password', (req, res) => {
  const { email, code, newPassword } = req.body;

  // Validation des données
  if (!email || !code || !newPassword) {
    return res.status(400).json({ message: 'Tous les champs sont requis' });
  }

  const stored = passwordResetCodes[email];
  if (!stored || stored.code !== code) {
    return res.status(400).json({ message: 'Code invalide' });
  }

  if (stored.expires < Date.now()) {
    delete passwordResetCodes[email];
    return res.status(400).json({ message: 'Code expiré' });
  }

  const sql = 'UPDATE users SET password = ? WHERE email = ?'; // Changé de clients à users
  db.query(sql, [newPassword, email], (err, result) => {
    if (err) {
      console.error('Erreur DB:', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    delete passwordResetCodes[email];
    res.status(200).json({ message: 'Mot de passe mis à jour avec succès' });
  });
});
// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Erreur non gérée:', err);
  res.status(500).json({ 
    error: 'Erreur interne du serveur',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(` Serveur démarré sur http://localhost:${PORT}`);
});