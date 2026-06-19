const fs = require('fs');
const file = 'src/components/admin/Topbar.jsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/\\\$\{hasUnread/g, '${hasUnread');
fs.writeFileSync(file, content);
