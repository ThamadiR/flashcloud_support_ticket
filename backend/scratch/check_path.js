const path = require('path');
const fs = require('fs');
const uploadsDir = path.resolve('uploads');
console.log('Uploads Dir:', uploadsDir);
console.log('Exists:', fs.existsSync(uploadsDir));
