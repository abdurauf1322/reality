const fs = require('fs');
const path = require('path');

const pages = [
  'Dashboard', 'Products', 'Sales', 'Customers', 
  'Debts', 'Expenses', 'Reports', 'Backup', 'Settings'
];

const componentsPath = path.join(__dirname, 'src', 'pages');

if (!fs.existsSync(componentsPath)) {
  fs.mkdirSync(componentsPath, { recursive: true });
}

pages.forEach(page => {
  const content = `import React from 'react';

const ${page} = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">${page}</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <p className="text-gray-500">Ushbu sahifa tez orada ishga tushadi (Coming soon).</p>
      </div>
    </div>
  );
};

export default ${page};
`;
  
  fs.writeFileSync(path.join(componentsPath, `${page}.tsx`), content);
});

console.log('Pages created successfully.');
