#!/usr/bin/env node

(function () {
  function sleep(milliseconds) {
    let start = new Date().getTime();
    for (let i = 0; i < 1e7; i++) {
      if ((new Date().getTime() - start) > milliseconds) {
        break;
      }
    }
  }
  let msg = process.argv[3] || 'Unset Me: ';
  let count = process.argv[2] || 3;
  for (let i = 0; i < count; ++i) {
    sleep(500);
    process.stdout.write(`${msg} ${i}\n`);
  }
  process.exit(0);
})();
