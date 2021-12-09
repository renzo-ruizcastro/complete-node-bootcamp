const fs = require('fs');

// Blocking synchronous way
/*
const textIn = fs.readFileSync('./txt/input.txt', 'utf-8');
console.log(textIn);

const textOut = `This is what we know about avocado: ${textIn}.\nCreated on ${Date.now()}`;
fs.writeFileSync('./txt/output.txt', textOut);
console.log('File written!');
*/

// Non-blocking asynchronous way
// fs.readFile('./txt/start.txt', 'utf-8', (err, data) => {
//   console.log(data);
// });

// reaching and reading read-this.txt from start.txt
fs.readFile('./txt/start.txt', 'utf-8', (err, data1) => {
  if (err) return console.log('ERROR! 💥');
  // data1 = 'read-this';
  fs.readFile(`./txt/${data1}.txt`, 'utf-8', (err, data2) => {
    console.log(data2);
    // Goal: appeding append.txt to read-this.txt
    // First read append.txt
    fs.readFile('./txt/append.txt', 'utf-8', (err, data3) => {
      console.log(data3);
      // Now appending data3 to data2 in a new file
      fs.writeFile('./txt/final.txt', `${data2}\n${data3}`, 'utf-8', err => {
        console.log('Your file has been written 😁');
      });
    });
  });
});
console.log('Will read file!');
