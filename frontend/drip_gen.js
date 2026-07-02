const fs = require('fs');

let d = "M0,0 L1200,0 L1200,20 ";
let x = 1200;
let drips = [
  { w: 40, h: 50 }, { w: 30, h: 80 }, { w: 50, h: 40 },
  { w: 35, h: 90 }, { w: 45, h: 60 }, { w: 40, h: 100 },
  { w: 30, h: 45 }, { w: 50, h: 70 }, { w: 35, h: 50 },
  { w: 45, h: 85 }, { w: 40, h: 60 }, { w: 30, h: 100 },
  { w: 50, h: 50 }, { w: 35, h: 80 }, { w: 45, h: 40 },
  { w: 40, h: 90 }, { w: 30, h: 60 }, { w: 50, h: 100 },
  { w: 35, h: 45 }, { w: 45, h: 70 }, { w: 40, h: 50 },
  { w: 30, h: 85 }, { w: 50, h: 60 }, { w: 35, h: 100 },
  { w: 45, h: 50 }, { w: 40, h: 80 }, { w: 30, h: 40 },
  { w: 50, h: 90 }, { w: 35, h: 60 }
];

let currentX = 1200;
for (let drip of drips) {
  let width = 1200 / drips.length; // roughly 41
  let nextX = currentX - width;
  
  let midX = currentX - width / 2;
  
  // Fixed: Removed the backslashes (\) before ` and ${
  d += `C ${currentX - width * 0.1},20 ${midX + width * 0.3},${20 + drip.h} ${midX},${20 + drip.h} `;
  d += `C ${midX - width * 0.3},${20 + drip.h} ${nextX + width * 0.1},20 ${nextX},20 `;
  
  currentX = nextX;
}

d += "L0,0 Z";

fs.writeFileSync('drip_output.txt', d);
console.log("Done");