const fs = require('fs');
const filePath = 'node_modules/sprintf-js/src/sprintf.js';

if (!fs.existsSync(filePath)) {
    console.log('sprintf.js not found, skipping patch.');
    return;
}

let code = fs.readFileSync(filePath, 'utf8');

const targetE = `                    case 'e':
                        arg = ph.precision ? parseFloat(arg).toExponential(ph.precision) : parseFloat(arg).toExponential()
                        break`;

const replacementE = `                    case 'e':
                        {
                            const p = ph.precision ? Math.min(100, Math.max(0, parseInt(ph.precision, 10))) : NaN;
                            arg = !isNaN(p) ? parseFloat(arg).toExponential(p) : parseFloat(arg).toExponential();
                        }
                        break`;

const targetF = `                    case 'f':
                        arg = ph.precision ? parseFloat(arg).toFixed(ph.precision) : parseFloat(arg)
                        break`;

const replacementF = `                    case 'f':
                        {
                            const p = ph.precision ? Math.min(100, Math.max(0, parseInt(ph.precision, 10))) : NaN;
                            arg = !isNaN(p) ? parseFloat(arg).toFixed(p) : parseFloat(arg);
                        }
                        break`;

const targetG = `                    case 'g':
                        arg = ph.precision ? String(Number(arg.toPrecision(ph.precision))) : parseFloat(arg)
                        break`;

const replacementG = `                    case 'g':
                        {
                            const p = ph.precision ? Math.min(100, Math.max(0, parseInt(ph.precision, 10))) : NaN;
                            arg = !isNaN(p) ? String(Number(arg.toPrecision(p))) : parseFloat(arg);
                        }
                        break`;

let patched = false;
if (code.includes(targetE)) {
    code = code.replace(targetE, replacementE);
    patched = true;
}
if (code.includes(targetF)) {
    code = code.replace(targetF, replacementF);
    patched = true;
}
if (code.includes(targetG)) {
    code = code.replace(targetG, replacementG);
    patched = true;
}

if (patched) {
    fs.writeFileSync(filePath, code, 'utf8');
    console.log('Successfully patched sprintf-js precision vulnerability.');
} else {
    console.log('sprintf-js already patched or target patterns not found.');
}
