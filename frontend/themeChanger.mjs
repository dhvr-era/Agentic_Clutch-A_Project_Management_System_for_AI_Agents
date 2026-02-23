import fs from 'fs';
import path from 'path';

const SRC_DIR = './src';

// Map harsh/game-like colors to an elegant SaaS palette
const replacements = [
    { from: /\borange-(100|200|300|400|500|600|700|800|900)\b/g, to: 'amber-$1' },
    { from: /\bblue-(100|200|300|400|500|600|700|800|900)\b/g, to: 'indigo-$1' },

    // Hex code translations for the new elegant vibe
    { from: /#f97316/ig, to: '#f59e0b' }, // orange-500 -> amber-500
    { from: /#fb923c/ig, to: '#fbbf24' }, // orange-400 -> amber-400
    { from: /#ea580c/ig, to: '#d97706' }, // orange-600 -> amber-600

    { from: /#3b82f6/ig, to: '#6366f1' }, // blue-500 -> indigo-500
    { from: /#60a5fa/ig, to: '#818cf8' }, // blue-400 -> indigo-400
    { from: /#2563eb/ig, to: '#4f46e5' }, // blue-600 -> indigo-600

    { from: /rgba\(249,\s*115,\s*22/g, to: 'rgba(245,158,11' }, // shadow colors orange to amber

    // Backgrounds in index.css for elegant Charcoal
    { from: /--bg-color: #000;/, to: '--bg-color: #0c0c0e;' },
    { from: /--bg-gradient: radial-gradient\(circle at 0% 0%, #111 0%, #000 100%\);/, to: '--bg-gradient: radial-gradient(circle at 50% 0%, #17171a 0%, #0c0c0e 100%);' },
    { from: /--glass-border: rgba\(255, 255, 255, 0.1\);/, to: '--glass-border: rgba(255, 255, 255, 0.06);' },
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

            for (const { from, to } of replacements) {
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
