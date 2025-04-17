require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Configurar Google Sheets
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON),
  scopes: 'https://www.googleapis.com/auth/spreadsheets'
});

app.post('/guardar', async (req, res) => {
  try {
    const sheets = google.sheets({ version: 'v4', auth });
    const { body } = req;

    // Ordenar las respuestas
    const respuestas = [];
    for (let i = 1; i <= 16; i++) {
      const key = Object.keys(body).find(k => k.endsWith(i.toString()));
      respuestas.push(body[key] || 'Sin respuesta');
    }

    // Preparar datos
    const valores = [
      new Date().toISOString(), // Fecha de registro
      body.evaluador,
      body.vendedor,
      body.fecha,
      ...respuestas
    ];

    // Escribir en Sheets
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEET_ID,
      range: 'A1',
      valueInputOption: 'USER_ENTERED',
      resource: { values: [valores] }
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Error al guardar en Google Sheets' });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
