import express from "express";
import multer from "multer";
import Tesseract from "tesseract.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// 🧠 Función mejorada para extraer TODOS los códigos válidos de embolsador
function detectarEmbolsadores(textoOCR) {
  // Convertir a mayúsculas para evitar errores de detección
  const upperText = textoOCR.toUpperCase();

  // Buscar TODOS los códigos válidos tipo E1, E2, ..., E9
  const matches = upperText.match(/\bE[1-9]\b/g) || [];
  return matches.map(x => x.trim());
}

// 📸 Endpoint: subir ticket
router.post("/upload-ticket", upload.single("ticketImage"), async (req, res) => {
  try {
    const imagePath = req.file.path;

    // Procesar OCR
    const { data: { text } } = await Tesseract.recognize(imagePath, "spa");

    // Buscar código de embolsador
    const embolsadores = detectarEmbolsadores(text);
    
    // Extraer más datos (ejemplo: fecha, valor, etc.)
    // Puedes expandir esto con más regex según tus necesidades
    const fechaTicket = new Date().toISOString().split("T")[0];

    // Simular guardado (aquí puedes enviar a tu DB o Google Sheet)
    const resultado = {
      fecha: fechaTicket,
      embolsadores,
      textoOCR: text.slice(0, 200) + "...",
    };
    console.log("Ticket procesado:", resultado);
    res.status(200).json({ success: true, data: resultado });

  } catch (error) {
    console.error("Error procesando ticket:", error);
    res.status(500).json({ success: false, message: "Error procesando ticket" });
  }
});

export default router;
