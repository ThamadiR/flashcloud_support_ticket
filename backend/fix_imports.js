const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.ts')) results.push(file);
        }
    });
    return results;
}

const files = walk(srcDir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // Replace service paths
    content = content.replace(/['"]\.\.\/\.\.\/services\/common\/apiError['"]/g, "'../services/apiError'");
    content = content.replace(/['"]\.\.\/\.\.\/services\/auth\/authService['"]/g, "'../services/authService'");
    content = content.replace(/['"]\.\.\/\.\.\/\.\.\/services\/common\/apiError['"]/g, "'../services/apiError'");
    content = content.replace(/['"]\.\.\/\.\.\/\.\.\/services\/management\/managementService['"]/g, "'../services/managementService'");
    content = content.replace(/['"]\.\.\/\.\.\/\.\.\/services\/users\/usersService['"]/g, "'../services/usersService'");
    
    // Replace internal service paths
    content = content.replace(/['"]\.\.\/\.\.\/repositories\/userRepository['"]/g, "'../repositories/userRepository'");
    content = content.replace(/['"]\.\.\/\.\.\/repositories\/managementRepository['"]/g, "'../repositories/managementRepository'");
    content = content.replace(/['"]\.\.\/common\/apiError['"]/g, "'./apiError'");
    content = content.replace(/['"]\.\.\/users\/userHelpers['"]/g, "'./userHelpers'");
    content = content.replace(/['"]\.\.\/\.\.\/\.\.\/repositories\/managementRepository['"]/g, "'../repositories/managementRepository'");

    fs.writeFileSync(file, content);
});
console.log('Fixed imports in controllers and services');
