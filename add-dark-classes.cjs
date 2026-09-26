const fs = require('fs');
const path = require('path');

const replacements = [
  { regex: /(?<!dark:)bg-white(?!\/)/g, replacement: 'bg-white dark:bg-slate-900' },
  { regex: /(?<!dark:)bg-slate-50/g, replacement: 'bg-slate-50 dark:bg-slate-800' },
  { regex: /(?<!dark:)bg-gray-50/g, replacement: 'bg-gray-50 dark:bg-slate-800' },
  { regex: /(?<!dark:)bg-gray-100/g, replacement: 'bg-gray-100 dark:bg-slate-800' },
  { regex: /(?<!dark:)bg-slate-100(?!\/)/g, replacement: 'bg-slate-100 dark:bg-slate-800' },
  { regex: /(?<!dark:)text-slate-800/g, replacement: 'text-slate-800 dark:text-slate-100' },
  { regex: /(?<!dark:)text-gray-900/g, replacement: 'text-gray-900 dark:text-slate-100' },
  { regex: /(?<!dark:)text-slate-700/g, replacement: 'text-slate-700 dark:text-slate-200' },
  { regex: /(?<!dark:)text-gray-700/g, replacement: 'text-gray-700 dark:text-slate-200' },
  { regex: /(?<!dark:)text-slate-600/g, replacement: 'text-slate-600 dark:text-slate-300' },
  { regex: /(?<!dark:)text-gray-600/g, replacement: 'text-gray-600 dark:text-slate-300' },
  { regex: /(?<!dark:)text-slate-500/g, replacement: 'text-slate-500 dark:text-slate-400' },
  { regex: /(?<!dark:)text-gray-500/g, replacement: 'text-gray-500 dark:text-slate-400' },
  { regex: /(?<!dark:)border-slate-100/g, replacement: 'border-slate-100 dark:border-slate-700' },
  { regex: /(?<!dark:)border-slate-200(?!\/)/g, replacement: 'border-slate-200 dark:border-slate-700' },
  { regex: /(?<!dark:)border-gray-200(?!\/)/g, replacement: 'border-gray-200 dark:border-slate-700' },
  { regex: /(?<!dark:)border-gray-100/g, replacement: 'border-gray-100 dark:border-slate-700' },
  { regex: /(?<!dark:)border-b(?!-)/g, replacement: 'border-b dark:border-slate-700' },
  { regex: /(?<!dark:)border-t(?!-)/g, replacement: 'border-t dark:border-slate-700' },
  { regex: /(?<!dark:)border(?!-)/g, replacement: 'border dark:border-slate-700' },
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      for (const { regex, replacement } of replacements) {
        content = content.replace(regex, replacement);
      }
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDirectory(path.join(__dirname, 'src'));
console.log("Done adding dark mode classes!");
