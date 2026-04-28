import fs from 'fs';
import path from 'path';

const srcDir: string = path.join(__dirname, 'src');

function walk(dir: string): string[] {
  let results: string[] = [];
  const list: string[] = fs.readdirSync(dir);

  list.forEach((file: string) => {
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

const importReplacements: [RegExp, string][] = [
  // Service paths
  [/['"]\.\.\/\.\.\/services\/common\/apiError['"]/g,                          "'../services/apiError'"],
  [/['"]\.\.\/\.\.\/services\/auth\/authService['"]/g,                         "'../services/authService'"],
  [/['"]\.\.\/\.\.\/\.\.\/services\/common\/apiError['"]/g,                    "'../services/apiError'"],
  [/['"]\.\.\/\.\.\/\.\.\/services\/management\/managementService['"]/g,       "'../services/managementService'"],
  [/['"]\.\.\/\.\.\/\.\.\/services\/users\/usersService['"]/g,                 "'../services/usersService'"],

  // Repository paths
  [/['"]\.\.\/\.\.\/repositories\/userRepository['"]/g,                        "'../repositories/userRepository'"],
  [/['"]\.\.\/\.\.\/repositories\/managementRepository['"]/g,                  "'../repositories/managementRepository'"],
  [/['"]\.\.\/\.\.\/\.\.\/repositories\/managementRepository['"]/g,            "'../repositories/managementRepository'"],

  // Internal service paths
  [/['"]\.\.\/common\/apiError['"]/g,                                          "'./apiError'"],
  [/['"]\.\.\/users\/userHelpers['"]/g,                                         "'./userHelpers'"],
];

const files: string[] = walk(srcDir);

files.forEach((file: string) => {
  let content: string = fs.readFileSync(file, 'utf8');

  importReplacements.forEach(([pattern, replacement]: [RegExp, string]) => {
    content = content.replace(pattern, replacement);
  });

  fs.writeFileSync(file, content);
});

console.log('Fixed imports in controllers and services');