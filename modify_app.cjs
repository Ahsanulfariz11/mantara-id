const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'App.jsx');
let content = fs.readFileSync(appPath, 'utf8');

// 1. Add import
if (!content.includes('import AdminLayout')) {
  content = content.replace(
    "import Footer from './components/Footer';",
    "import Footer from './components/Footer';\nimport AdminLayout from './components/admin/AdminLayout';"
  );
}

// 2. Add early return for AdminLayout
const adminReturnStr = `
  if (activeTab === 'admin_dashboard' && currentUser?.role === 'admin') {
    return (
      <AdminLayout
        tickets={tickets}
        saveTickets={saveTicketsDatabase}
        bookingHistory={bookingHistory}
        showToast={showToast}
        setActiveTab={setActiveTab}
        handleLogout={handleLogout}
      />
    );
  }

  if (activeTab === 'login') {`;

if (!content.includes("if (activeTab === 'admin_dashboard' && currentUser?.role === 'admin')")) {
  content = content.replace("  if (activeTab === 'login') {", adminReturnStr);
}

// 3. Remove old <AdminDashboardView ... /> call
const oldCallRegex = /\{\s*currentUser\?\.role === 'admin' && activeTab === 'admin_dashboard' && \(\s*<AdminDashboardView[\s\S]*?\/>\s*\)\s*\}/g;
content = content.replace(oldCallRegex, '');

// 4. Remove AdminDashboardView function definition
const funcIndex = content.indexOf('function AdminDashboardView({');
if (funcIndex !== -1) {
  content = content.substring(0, funcIndex);
}

fs.writeFileSync(appPath, content);
console.log('App.jsx modified successfully!');
