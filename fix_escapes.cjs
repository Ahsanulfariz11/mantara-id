const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'components', 'admin');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // replace \` with `
  content = content.replace(/\\`/g, '`');
  
  // replace \${ with ${
  content = content.replace(/\\\${/g, '${');
  
  fs.writeFileSync(filePath, content);
});

console.log('Fixed escape sequences in JSX files');
