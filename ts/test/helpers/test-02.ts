#!/usr/bin/env node

/*if(process.stdin.isTTY){
  process.stdout.write('It is tty!');
}else{*/
(()=>{
  let msg = process.argv[2] || 'End ** ';
  process.stdin.on('data',chunk=>{
    process.stdout.write(msg + chunk.toString());
  });
  process.stdin.on('end',()=>{
    process.stdout.write(msg + '- end***');
  });
})();
/*}*/

