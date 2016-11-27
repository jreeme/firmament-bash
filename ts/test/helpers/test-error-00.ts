function sleepError(milliseconds) {
  let start = new Date().getTime();
  for (let i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds) {
      break;
    }
  }
}
(function () {
  let msg = process.argv[3] || 'Unset Error Me: ';
  let count = process.argv[2] || 3;
  for (let i = 0; i < count; ++i) {
    if(i == 2){
      process.exit(3);
    }
    sleepError(500);
    process.stdout.write(`${msg} ${i}\n`);
  }
  process.exit(0);
})();
