import fs from 'fs';
import path from 'path';

const SRC_DIR = './src';

// Additional Hex Color mappings
const hexMappings = [
    // cyans to blues
    { from: /#06b6d4/ig, to: '#3b82f6' },
    { from: /#0891b2/ig, to: '#2563eb' },
    { from: /#22d3ee/ig, to: '#60a5fa' },
    { from: /#7dd3fc/ig, to: '#93c5fd' },
    // sky to blues
    { from: /#38bdf8/ig, to: '#60a5fa' },
    { from: /#0ea5e9/ig, to: '#3b82f6' },

    // random reds/pinks from CreateAgentModal
    { from: /#ef4444/ig, to: '#f97316' },
    { from: /#ec4899/ig, to: '#3b82f6' },
    { from: /#14b8a6/ig, to: '#3b82f6' },

    // TIER COLORS object string updates (if still referencing cyan/sky)
    { from: /\/\/ cyan-500/ig, to: '// blue-500' },
    { from: /\/\/ sky-500/ig, to: '// blue-500' },
];

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            walkDir(filePath);
        } else if (file.match(/\.(tsx|ts|css)$/)) {
            let content = fs.readFileSync(filePath, 'utf8');
            let changed = false;

            for (const { from, to } of hexMappings) {
                if (content.match(from)) {
                    content = content.replace(from, to);
                    changed = true;
                }
            }

            if (changed) {
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`Updated ${filePath}`);
            }
        }
    }
}

walkDir(SRC_DIR);
