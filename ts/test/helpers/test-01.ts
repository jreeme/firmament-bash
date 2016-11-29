#!/usr/bin/env node
/*if(process.stdin.isTTY){
  process.stdout.write('It is tty!');
}else{*/
  let i = 0;
  let msg = process.argv[2] || 'Middle ** ';
  process.stdin.on('data',chunk=>{
    ++i;
    process.stdout.write(msg + i.toString() + chunk.toString());
  });
  process.stdin.on('end',()=>{
    process.stdout.write(msg + ' end***');
  });
/*}*/

