import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import axios from "axios";

const execAsync = promisify(exec);

/**
 * Extract text from PDF file using poppler-utils (pdftotext)
 */
export async function extractTextFromPDF(fileUrl: string): Promise<string> {
  const tempPdfPath = join(tmpdir(), `temp-${Date.now()}.pdf`);
  const tempTxtPath = join(tmpdir(), `temp-${Date.now()}.txt`);

  try {
    // Download PDF to temp file
    const response = await axios.get(fileUrl, { responseType: "arraybuffer" });
    await writeFile(tempPdfPath, Buffer.from(response.data));

    // Extract text using pdftotext (from poppler-utils, pre-installed)
    await execAsync(`pdftotext "${tempPdfPath}" "${tempTxtPath}"`);

    // Read extracted text
    const { stdout } = await execAsync(`cat "${tempTxtPath}"`);
    
    // Clean up temp files
    await unlink(tempPdfPath).catch(() => {});
    await unlink(tempTxtPath).catch(() => {});

    return stdout.trim();
  } catch (error) {
    // Clean up on error
    await unlink(tempPdfPath).catch(() => {});
    await unlink(tempTxtPath).catch(() => {});
    
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Extract text from image using OCR (Tesseract)
 */
export async function extractTextFromImage(fileUrl: string): Promise<string> {
  const tempImagePath = join(tmpdir(), `temp-${Date.now()}.jpg`);
  const pythonScript = `
import sys
import pytesseract
from PIL import Image

try:
    image = Image.open("${tempImagePath}")
    text = pytesseract.image_to_string(image, lang='spa+eng')
    print(text)
except Exception as e:
    print(f"Error: {str(e)}", file=sys.stderr)
    sys.exit(1)
`;

  const tempScriptPath = join(tmpdir(), `ocr-${Date.now()}.py`);

  try {
    // Download image to temp file
    const response = await axios.get(fileUrl, { responseType: "arraybuffer" });
    await writeFile(tempImagePath, Buffer.from(response.data));

    // Write Python script
    await writeFile(tempScriptPath, pythonScript);

    // Run OCR using Python + pytesseract
    const { stdout } = await execAsync(`python3.11 "${tempScriptPath}"`);

    // Clean up temp files
    await unlink(tempImagePath).catch(() => {});
    await unlink(tempScriptPath).catch(() => {});

    return stdout.trim();
  } catch (error) {
    // Clean up on error
    await unlink(tempImagePath).catch(() => {});
    await unlink(tempScriptPath).catch(() => {});

    throw new Error(`Failed to extract text from image: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Process uploaded file and extract text based on file type
 */
export async function processFile(fileUrl: string, fileType: "pdf" | "image"): Promise<string> {
  if (fileType === "pdf") {
    return extractTextFromPDF(fileUrl);
  } else {
    return extractTextFromImage(fileUrl);
  }
}
