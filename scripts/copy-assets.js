const fs = require('fs');
const path = require('path');
const glob = require('glob');

const SOURCE_ROOT = path.join(__dirname, '..', 'src');
const OUTPUT_ROOT = path.join(__dirname, '..', 'bin');

const pattern = `${SOURCE_ROOT.replace(/\\/g, '/')}/modules/*/assets/**/*`;
const assets = glob.sync(pattern, { nodir: true });

for (const asset of assets) {
    const destination = path.join(
        OUTPUT_ROOT,
        path.relative(SOURCE_ROOT, asset)
    );
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(asset, destination);
}

console.log(`Copied ${assets.length} module assets into ${OUTPUT_ROOT}`);
