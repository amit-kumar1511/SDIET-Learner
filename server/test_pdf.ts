import PDFDocument from 'pdfkit';
import fs from 'fs';

try {
  console.log("Creating PDF doc...");
  const doc = new PDFDocument({ margin: 40 });
  const writeStream = fs.createWriteStream('test_output.pdf');
  doc.pipe(writeStream);
  
  // Test header
  doc.fillColor('#4f46e5').rect(0, 0, 612, 100).fill();
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(20).text('SDIET STUDENT ACADEMIC PORTAL', 40, 30);
  
  console.log("Writing text...");
  doc.fillColor('#000000').font('Helvetica').fontSize(12).text('Hello World', 40, 120);
  
  doc.end();
  writeStream.on('finish', () => {
    console.log("PDF generated successfully!");
    process.exit(0);
  });
  writeStream.on('error', (err) => {
    console.error("WriteStream error:", err);
    process.exit(1);
  });
} catch (err) {
  console.error("Caught error:", err);
  process.exit(1);
}
