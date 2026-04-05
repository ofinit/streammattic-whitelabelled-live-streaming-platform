const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();

// 1. Update Headers
const pagePaths = [
  'app/admin/control-center/page.tsx',
  'app/studio/control-center/page.tsx',
  'app/streamer/control-center/page.tsx',
  'app/admin/create-events/page.tsx',
  'app/studio/create-events/page.tsx',
  'app/streamer/create-events/page.tsx'
];

for (const p of pagePaths) {
  const fullPath = path.join(rootDir, p);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    if (p.includes('control-center')) {
      content = content.replace(/<h1[^>]*>.*?<\/h1>/g, '<h1 className="text-2xl font-bold">Control Center</h1>');
      content = content.replace(/Manage your live streaming events/g, 'Manage and control your live streaming events');
    } else if (p.includes('create-events')) {
      content = content.replace(/<h1[^>]*>.*?<\/h1>/g, '<h1 className="text-3xl font-bold">Create Events</h1>');
    }
    
    fs.writeFileSync(fullPath, content);
  }
}

// 2. Deep replace URLs
function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) {
      if (!['node_modules', '.next', '.git', 'public', '.gemini', 'artifacts'].includes(f)) {
        walk(dirPath, callback);
      }
    } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
      callback(dirPath);
    }
  });
}

const replacements = [
  { from: /\/admin\/events/g, to: '/admin/control-center' },
  { from: /\/studio\/events/g, to: '/studio/control-center' },
  { from: /\/streamer\/events/g, to: '/streamer/control-center' },
  { from: /\/admin\/calendar/g, to: '/admin/create-events' },
  { from: /\/studio\/calendar/g, to: '/studio/create-events' },
  { from: /\/streamer\/calendar/g, to: '/streamer/create-events' },
];

walk(rootDir, (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // We want to specifically EXCLUDE /api/ routes from being modified as the backend hasn't moved
  if (!filePath.includes(path.join('app', 'api'))) {
    // Avoid accidentally breaking api fetch paths
    let lines = content.split('\n');
    let modifiedLines = lines.map(line => {
      if (line.includes('/api/')) return line; // Skip API fetch lines

      let modLine = line;
      replacements.forEach(r => {
        modLine = modLine.replace(r.from, r.to);
      });
      return modLine;
    });
    
    let finalContent = modifiedLines.join('\n');
    if (finalContent !== originalContent) {
      fs.writeFileSync(filePath, finalContent);
      console.log(`Updated URLs in: ${path.relative(rootDir, filePath)}`);
    }
  }
});
console.log('Update script completed.');
