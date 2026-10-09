// Превращает dist-single/index.html в тело страницы для публикации (без doctype/html/head/body).
import fs from 'node:fs';
const [src = 'dist-single/index.html', out = 'dist-single/hak.html'] = process.argv.slice(2);
const html = fs.readFileSync(src, 'utf8');
const head = html.match(/<head>([\s\S]*?)<\/head>/i)[1]
  .replace(/<meta charset[^>]*>/i, '')
  .replace(/<meta name="viewport"[^>]*>/i, '');
const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)[1];
// <title> должен быть в начале файла
const title = head.match(/<title>[\s\S]*?<\/title>/i)[0];
fs.writeFileSync(out, title + '\n' + head.replace(title, '') + '\n' + body);
console.log(out, (fs.statSync(out).size / 1024).toFixed(0) + ' KB');
