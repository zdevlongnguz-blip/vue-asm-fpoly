// Đóng gói source (bỏ node_modules, dist, .git) thành zip để nộp LMS
// Dùng: npm run pack -- PH12345   -> WEB207_PH12345_Assignment.zip
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ZipArchive } from 'archiver';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const studentId = process.argv[2] || 'MaSV';
const outName = `WEB207_${studentId}_Assignment.zip`;
const outPath = path.join(root, '..', outName);
const folderName = path.basename(root);

const output = fs.createWriteStream(outPath);
const archive = new ZipArchive({ zlib: { level: 9 } });

output.on('close', () => {
  console.log(`Đã tạo ${outPath} (${(archive.pointer() / 1024).toFixed(1)} KB)`);
});
archive.on('warning', (err) => console.warn(err.message));
archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);
archive.glob('**/*', {
  cwd: root,
  dot: true,
  ignore: ['**/node_modules/**', '**/dist/**', '.git/**', '*.zip'],
}, { prefix: folderName });

// Thêm file báo cáo nếu đã có (N3)
for (const name of ['BaoCao.doc', 'BaoCao.docx']) {
  const p = path.join(root, '..', name);
  if (fs.existsSync(p)) archive.file(p, { name });
}

await archive.finalize();
