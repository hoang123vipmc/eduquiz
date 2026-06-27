const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'frontend/src');

const replacements = [
    { regex: /bg-\[#020617\]/g, replacement: 'bg-background' },
    { regex: /bg-\[#0f172a\]/g, replacement: 'bg-card' },
    { regex: /bg-\[#071026\]/g, replacement: 'bg-secondary' },
    { regex: /bg-\[#18233b\]/g, replacement: 'bg-muted' },
    { regex: /border-white\/5/g, replacement: 'border-border' },
    { regex: /border-white\/10/g, replacement: 'border-border' },
    { regex: /text-slate-400/g, replacement: 'text-muted-foreground' },
    { regex: /text-slate-500/g, replacement: 'text-muted-foreground' },
    { regex: /text-slate-300/g, replacement: 'text-foreground' },
    { regex: /text-slate-200/g, replacement: 'text-foreground' },
    { regex: /text-white/g, replacement: 'text-foreground' }
];

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;
            
            replacements.forEach(rule => {
                content = content.replace(rule.regex, rule.replacement);
            });
            
            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    });
}

processDirectory(directoryPath);
console.log('Theme replacement complete!');
