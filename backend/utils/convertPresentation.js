const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const util = require('util');
const execPromise = util.promisify(exec);

const CONVERTED_DIR = path.join(__dirname, '..', 'converted-slides');

// Ensure directories exist
if (!fs.existsSync(CONVERTED_DIR)) {
  fs.mkdirSync(CONVERTED_DIR, { recursive: true });
}

// ─────────────────────────────────────────────────────────
//  PPT/PPTX → PDF CONVERSION
// ─────────────────────────────────────────────────────────

async function convertPptToPdf(inputPath) {
  console.log('📄 Converting PPT/PPTX to PDF...');
  const outputDir = path.dirname(inputPath);

  // Try different possible LibreOffice paths on Windows
  const possibleCommands = [
    'soffice',
    '"C:\\Program Files\\LibreOffice\\program\\soffice.exe"',
    '"C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe"',
  ];

  for (const soffice of possibleCommands) {
    try {
      const command = `${soffice} --headless --convert-to pdf --outdir "${outputDir}" "${inputPath}"`;
      console.log(`   📌 Trying: ${soffice}...`);
      await execPromise(command, { timeout: 60000 });

      const baseName = path.basename(inputPath, path.extname(inputPath));
      const pdfPath = path.join(outputDir, `${baseName}.pdf`);

      if (fs.existsSync(pdfPath)) {
        console.log('   ✅ PPT → PDF conversion successful!');
        return pdfPath;
      }
    } catch (e) {
      console.log(`   ⚠️ ${soffice} failed: ${e.message}`);
    }
  }

  // Also try libreoffice-convert npm package
  try {
    console.log('   📌 Trying libreoffice-convert npm package...');
    const libre = require('libreoffice-convert');
    const convertAsync = util.promisify(libre.convert);
    const inputBuffer = fs.readFileSync(inputPath);
    const outputBuffer = await convertAsync(inputBuffer, '.pdf', undefined);
    const baseName = path.basename(inputPath, path.extname(inputPath));
    const pdfPath = path.join(outputDir, `${baseName}.pdf`);
    fs.writeFileSync(pdfPath, outputBuffer);
    console.log('   ✅ PPT → PDF conversion successful (via npm package)!');
    return pdfPath;
  } catch (e) {
    console.log(`   ⚠️ libreoffice-convert failed: ${e.message}`);
  }

  throw new Error(
    'Cannot convert PPT/PPTX. Please install LibreOffice: https://www.libreoffice.org/download/'
  );
}

// ─────────────────────────────────────────────────────────
//  PDF → IMAGES CONVERSION (multiple methods)
// ─────────────────────────────────────────────────────────

/**
 * Read generated PNG files from output directory
 */
function readSlideFiles(outputDir, presentationId) {
  const files = fs
    .readdirSync(outputDir)
    .filter((f) => f.toLowerCase().endsWith('.png'))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || 0);
      const numB = parseInt(b.match(/\d+/)?.[0] || 0);
      return numA - numB;
    });

  if (files.length === 0) {
    throw new Error('No PNG files were generated');
  }

  return files.map((file, index) => ({
    slideNumber: index + 1,
    imagePath: `/converted-slides/${presentationId}/${file}`,
  }));
}

/**
 * Method 1: Ghostscript (most common on Windows)
 */
async function convertWithGhostscript(pdfPath, presentationId) {
  const outputDir = path.join(CONVERTED_DIR, presentationId);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Try different Ghostscript executable names
  const gsCommands = ['gswin64c', 'gswin32c', 'gs'];
  let gsCmd = null;

  for (const cmd of gsCommands) {
    try {
      await execPromise(`${cmd} --version`);
      gsCmd = cmd;
      break;
    } catch (e) {
      // not found, try next
    }
  }

  if (!gsCmd) {
    throw new Error('Ghostscript not found on system');
  }

  const outputPattern = path.join(outputDir, 'slide-%03d.png');
  const command = `${gsCmd} -dNOPAUSE -dBATCH -dSAFER -sDEVICE=png16m -r200 -sOutputFile="${outputPattern}" "${pdfPath}"`;

  console.log(`   Running: ${gsCmd}...`);
  await execPromise(command, { timeout: 120000 });

  return readSlideFiles(outputDir, presentationId);
}

/**
 * Method 2: Poppler (pdftoppm)
 */
async function convertWithPoppler(pdfPath, presentationId) {
  const outputDir = path.join(CONVERTED_DIR, presentationId);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPrefix = path.join(outputDir, 'slide');
  const command = `pdftoppm -png -r 200 "${pdfPath}" "${outputPrefix}"`;

  await execPromise(command, { timeout: 120000 });

  return readSlideFiles(outputDir, presentationId);
}

/**
 * Method 3: MuPDF (mutool)
 */
async function convertWithMutool(pdfPath, presentationId) {
  const outputDir = path.join(CONVERTED_DIR, presentationId);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPattern = path.join(outputDir, 'slide-%03d.png');
  const command = `mutool convert -o "${outputPattern}" -O resolution=200 "${pdfPath}"`;

  await execPromise(command, { timeout: 120000 });

  return readSlideFiles(outputDir, presentationId);
}

// ─────────────────────────────────────────────────────────
//  MAIN CONVERSION FUNCTION
// ─────────────────────────────────────────────────────────

async function convertPresentation(filePath, presentationId) {
  const ext = path.extname(filePath).toLowerCase();
  let pdfPath = filePath;

  // STEP 1: If PPT/PPTX, convert to PDF first
  if (ext === '.ppt' || ext === '.pptx') {
    pdfPath = await convertPptToPdf(filePath);
  }

  // STEP 2: Convert PDF to images - try multiple methods
  console.log('🖼️  Converting PDF to slide images...');

  const methods = [
    { name: 'Ghostscript', fn: convertWithGhostscript },
    { name: 'Poppler (pdftoppm)', fn: convertWithPoppler },
    { name: 'MuPDF (mutool)', fn: convertWithMutool },
  ];

  for (const method of methods) {
    try {
      console.log(`   📌 Trying ${method.name}...`);

      // Clean output directory before each attempt
      const outputDir = path.join(CONVERTED_DIR, presentationId);
      if (fs.existsSync(outputDir)) {
        const existingFiles = fs.readdirSync(outputDir).filter((f) => f.endsWith('.png'));
        existingFiles.forEach((f) => fs.unlinkSync(path.join(outputDir, f)));
      }

      const slides = await method.fn(pdfPath, presentationId);

      if (slides.length > 0) {
        console.log(`   ✅ Success! ${slides.length} slides converted using ${method.name}`);

        // Cleanup intermediate PDF if PPT was converted
        if ((ext === '.ppt' || ext === '.pptx') && pdfPath !== filePath) {
          try {
            fs.unlinkSync(pdfPath);
          } catch (e) {
            /* ignore */
          }
        }

        return slides;
      }
    } catch (err) {
      console.log(`   ⚠️ ${method.name} failed: ${err.message}`);
    }
  }

  // ALL METHODS FAILED - give clear instructions
  throw new Error(
    'Could not convert PDF to images. Please install Ghostscript:\n\n' +
      '  1. Go to: https://ghostscript.com/releases/gsdnld.html\n' +
      '  2. Download "Ghostscript 10.x AGPL Release" for Windows (64-bit)\n' +
      '  3. During install, CHECK ✅ "Add to PATH"\n' +
      '  4. CLOSE and REOPEN your terminal / VS Code\n' +
      '  5. Verify by running: gswin64c --version\n' +
      '  6. Then restart the backend: npm run dev'
  );
}

module.exports = { convertPresentation };