import fs from 'fs';
import path from 'path';

const SRC_DIR = './src';

// Regexes for color names
const colorMappings = [
    { from: /\bemerald-(100|200|300|400|500|600|700|800|900)\b/g, to: 'orange-$1' },
    { from: /\bamber-(100|200|300|400|500|600|700|800|900)\b/g, to: 'blue-$1' },
    { from: /\brose-(100|200|300|400|500|600|700|800|900)\b/g, to: 'orange-$1' },
    { from: /\bred-(100|200|300|400|500|600|700|800|900)\b/g, to: 'orange-$1' },
    { from: /\bviolet-(100|200|300|400|500|600|700|800|900)\b/g, to: 'blue-$1' },
    { from: /\bpurple-(100|200|300|400|500|600|700|800|900)\b/g, to: 'blue-$1' },
    { from: /\bfuchsia-(100|200|300|400|500|600|700|800|900)\b/g, to: 'blue-$1' },
    { from: /\bpink-(100|200|300|400|500|600|700|800|900)\b/g, to: 'blue-$1' },
    { from: /\bindigo-(100|200|300|400|500|600|700|800|900)\b/g, to: 'blue-$1' },
    { from: /\bcyan-(100|200|300|400|500|600|700|800|900)\b/g, to: 'blue-$1' },
    { from: /\bsky-(100|200|300|400|500|600|700|800|900)\b/g, to: 'blue-$1' },
    { from: /\bteal-(100|200|300|400|500|600|700|800|900)\b/g, to: 'blue-$1' },
    { from: /\bgreen-(100|200|300|400|500|600|700|800|900)\b/g, to: 'blue-$1' },

    // Some hex colors replacement if present
    { from: /#10b981/ig, to: '#f97316' }, // emerald-500 -> orange-500
    { from: /#34d399/ig, to: '#fb923c' }, // emerald-400 -> orange-400
    { from: /#f59e0b/ig, to: '#3b82f6' }, // amber-500 -> blue-500
    { from: /#fbbf24/ig, to: '#60a5fa' }, // amber-400 -> blue-400
    { from: /#8b5cf6/ig, to: '#3b82f6' }, // violet-500 -> blue-500
    { from: /#a78bfa/ig, to: '#60a5fa' }, // violet-400 -> blue-400
    { from: /#f43f5e/ig, to: '#f97316' }, // rose-500 -> orange-500
    { from: /#fb7185/ig, to: '#fb923c' }, // rose-400 -> orange-400

    // Hardcoded shadow replacing:
    { from: /rgba\(16,\s*185,\s*129/g, to: 'rgba(249,115,22' },
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

            for (const { from, to } of colorMappings) {
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
