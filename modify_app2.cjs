const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'App.jsx');
let content = fs.readFileSync(appPath, 'utf8');

// Add import for api
if (!content.includes("import { api, subscribeToNode }")) {
  content = content.replace(
    "import AdminLayout from './components/admin/AdminLayout';",
    "import AdminLayout from './components/admin/AdminLayout';\nimport { api, subscribeToNode } from './lib/api';"
  );
}

const oldTicketsBlock = `  const [tickets, setTickets] = useState(() => {
    try {
      const saved = localStorage.getItem('sea_tickets_database');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return initialTicketDatabase;
  });

  const ticketDatabase = tickets;

  const saveTicketsDatabase = (newTickets) => {
    setTickets(newTickets);
    try {
      localStorage.setItem('sea_tickets_database', JSON.stringify(newTickets));
    } catch (e) {
      console.error(e);
    }
  };`;

const newTicketsBlock = `  const [tickets, setTickets] = useState(initialTicketDatabase);
  
  useEffect(() => {
    const unsubscribe = subscribeToNode('tickets', (data) => {
      if (data) {
        // Convert object to array if needed, but assuming api.js usage handles format or we store as array-like object.
        // Actually, initialTicketDatabase is an array. When saved to Firebase RTDB with numeric keys, it acts like an array.
        const ticketsArray = Array.isArray(data) ? data.filter(Boolean) : Object.keys(data).map(k => data[k]);
        setTickets(ticketsArray);
      } else {
        // If empty, initialize with default
        api.set('tickets', initialTicketDatabase);
        setTickets(initialTicketDatabase);
      }
    });
    return () => unsubscribe();
  }, []);

  const ticketDatabase = tickets;

  const saveTicketsDatabase = async (newTickets) => {
    try {
      await api.set('tickets', newTickets);
    } catch (e) {
      console.error(e);
      showToast('Gagal menyimpan jadwal ke database', 'error');
    }
  };`;

if (content.includes("localStorage.getItem('sea_tickets_database')")) {
  content = content.replace(oldTicketsBlock, newTicketsBlock);
}

fs.writeFileSync(appPath, content);
console.log('App.jsx modified with Firebase tickets!');
