const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const util = require('util');
const execPromise = util.promisify(exec);

const CONVERTED_DIR = path.join(__dirname, '..', 'converted-slides');

if (!fs.existsSync(CONVERTED_DIR)) {
  fs.mkdirSync(CONVERTED_DIR, { recursive: true });
}

// ── PPT → PDF ─────────────────────────────────────────────

async function convertPptToPdf(inputPath) {
  console.log('📄 Converting PPT/PPTX to PDF...');
  const outputDir = path.dirname(inputPath);
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const pdfPath = path.join(outputDir, `${baseName}.pdf`);

  // Determine which commands to try based on platform
  const isWindows = process.platform === 'win32';

  const commands = isWindows
    ? [
        `soffice --headless --convert-to pdf --outdir "${outputDir}" "${inputPath}"`,
        `"C:\\Program Files\\LibreOffice\\program\\soffice.exe" --headless --convert-to pdf --outdir "${outputDir}" "${inputPath}"`,
        `"C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe" --headless --convert-to pdf --outdir "${outputDir}" "${inputPath}"`,
      ]
    : [
        `soffice --headless --convert-to pdf --outdir "${outputDir}" "${inputPath}"`,
        `libreoffice --headless --convert-to pdf --outdir "${outputDir}" "${inputPath}"`,
        `/usr/bin/soffice --headless --convert-to pdf --outdir "${outputDir}" "${inputPath}"`,
        `/usr/bin/libreoffice --headless --convert-to pdf --outdir "${outputDir}" "${inputPath}"`,
      ];

  for (const command of commands) {
    try {
      console.log(`   📌 Trying: ${command.substring(0, 60)}...`);
      await execPromise(command, { timeout: 120000 });
      if (fs.existsSync(pdfPath)) {
        console.log('   ✅ PPT → PDF success!');
        return pdfPath;
      }
    } catch (e) {
      console.log(`   ⚠️ Failed: ${e.message.substring(0, 100)}`);
    }
  }

  // Fallback: try libreoffice-convert npm package
  try {
    console.log('   📌 Trying libreoffice-convert npm package...');
    const libre = require('libreoffice-convert');
    const convertAsync = util.promisify(libre.convert);
    const inputBuffer = fs.readFileSync(inputPath);
    const outputBuffer = await convertAsync(inputBuffer, '.pdf', undefined);
    fs.writeFileSync(pdfPath, outputBuffer);
    if (fs.existsSync(pdfPath) && fs.statSync(pdfPath).size > 0) {
      console.log('   ✅ PPT → PDF success (npm package)!');
      return pdfPath;
    }
  } catch (e) {
    console.log(`   ⚠️ libreoffice-convert npm failed: ${e.message.substring(0, 100)}`);
  }

  throw new Error(
    'Cannot convert PPT/PPTX. LibreOffice is not available on the server.'
  );
}

// ── PDF → Images ──────────────────────────────────────────

function readSlideFiles(outputDir, presentationId) {
  const files = fs
    .readdirSync(outputDir)
    .filter((f) => f.toLowerCase().endsWith('.png'))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || 0);
      const numB = parseInt(b.match(/\d+/)?.[0] || 0);
      return numA - numB;
    });
  if (files.length === 0) throw new Error('No PNG files generated');
  return files.map((file, index) => ({
    slideNumber: index + 1,
    imagePath: `/converted-slides/${presentationId}/${file}`,
  }));
}

async function convertWithPoppler(pdfPath, presentationId) {
  const outputDir = path.join(CONVERTED_DIR, presentationId);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const outputPrefix = path.join(outputDir, 'slide');
  await execPromise(`pdftoppm -png -r 150 "${pdfPath}" "${outputPrefix}"`, { timeout: 120000 });
  return readSlideFiles(outputDir, presentationId);
}

async function convertWithGhostscript(pdfPath, presentationId) {
  const outputDir = path.join(CONVERTED_DIR, presentationId);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const isWindows = process.platform === 'win32';
  const gsCommands = isWindows ? ['gswin64c', 'gswin32c', 'gs'] : ['gs', 'ghostscript'];
  let gsCmd = null;
  for (const cmd of gsCommands) {
    try { await execPromise(`${cmd} --version`); gsCmd = cmd; break; } catch (e) { /* next */ }
  }
  if (!gsCmd) throw new Error('Ghostscript not found');

  const outputPattern = path.join(outputDir, 'slide-%03d.png');
  await execPromise(`${gsCmd} -dNOPAUSE -dBATCH -dSAFER -sDEVICE=png16m -r150 -sOutputFile="${outputPattern}" "${pdfPath}"`, { timeout: 120000 });
  return readSlideFiles(outputDir, presentationId);
}

async function convertWithMutool(pdfPath, presentationId) {
  const outputDir = path.join(CONVERTED_DIR, presentationId);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const outputPattern = path.join(outputDir, 'slide-%03d.png');
  await execPromise(`mutool convert -o "${outputPattern}" -O resolution=150 "${pdfPath}"`, { timeout: 120000 });
  return readSlideFiles(outputDir, presentationId);
}

// ── MAIN ──────────────────────────────────────────────────

async function convertPresentation(filePath, presentationId) {
  const ext = path.extname(filePath).toLowerCase();
  let pdfPath = filePath;

  if (ext === '.ppt' || ext === '.pptx') {
    pdfPath = await convertPptToPdf(filePath);
  }

  console.log('🖼️  Converting PDF to slide images...');

  const methods = [
    { name: 'Poppler (pdftoppm)', fn: convertWithPoppler },
    { name: 'Ghostscript', fn: convertWithGhostscript },
    { name: 'MuPDF (mutool)', fn: convertWithMutool },
  ];

  for (const method of methods) {
    try {
      console.log(`   📌 Trying ${method.name}...`);
      const outputDir = path.join(CONVERTED_DIR, presentationId);
      if (fs.existsSync(outputDir)) {
        fs.readdirSync(outputDir).filter(f => f.endsWith('.png')).forEach(f => fs.unlinkSync(path.join(outputDir, f)));
      }
      const slides = await method.fn(pdfPath, presentationId);
      if (slides.length > 0) {
        console.log(`   ✅ ${slides.length} slides converted using ${method.name}`);
        if ((ext === '.ppt' || ext === '.pptx') && pdfPath !== filePath) {
          try { fs.unlinkSync(pdfPath); } catch (e) { /* ignore */ }
        }
        return slides;
      }
    } catch (err) {
      console.log(`   ⚠️ ${method.name} failed: ${err.message.substring(0, 100)}`);
    }
  }

  throw new Error('PDF conversion failed. No conversion tool available on the server.');
}

module.exports = { convertPresentation };
