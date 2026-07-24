const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    lines.forEach(line => {
        const match = line.match(/^\s*([^#\s=]+)\s*=\s*(.*)$/);
        if (match) {
            const key = match[1];
            let val = match[2].trim();
            if (val.startsWith('"') && val.endsWith('"')) {
                val = val.substring(1, val.length - 1);
            } else if (val.startsWith("'") && val.endsWith("'")) {
                val = val.substring(1, val.length - 1);
            }
            process.env[key] = val;
        }
    });
}

console.log('Environment Keys:', Object.keys(process.env).filter(k => k.toLowerCase().includes('pass') || k.toLowerCase().includes('key') || k.toLowerCase().includes('db') || k.toLowerCase().includes('url') || k.toLowerCase().includes('postgres')));
