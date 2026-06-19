const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'components', 'admin');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // replace colors
  content = content.replace(/bg-ocean/g, 'bg-primary');
  content = content.replace(/text-ocean/g, 'text-primary');
  content = content.replace(/border-ocean/g, 'border-primary');
  content = content.replace(/ring-ocean/g, 'ring-primary');
  content = content.replace(/shadow-ocean/g, 'shadow-primary');
  content = content.replace(/accent-ocean/g, 'accent-primary');
  
  content = content.replace(/bg-navy/g, 'bg-blue-900');
  content = content.replace(/text-navy/g, 'text-blue-900');
  content = content.replace(/hover:bg-navy/g, 'hover:bg-blue-900');
  
  content = content.replace(/bg-aqua/g, 'bg-sky-400');
  content = content.replace(/text-aqua/g, 'text-sky-500');
  content = content.replace(/border-aqua/g, 'border-sky-400');
  content = content.replace(/ring-aqua/g, 'ring-sky-400');
  
  fs.writeFileSync(filePath, content);
});

console.log('Fixed colors in JSX files');
