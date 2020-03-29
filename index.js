const Backuper = require('./backup');

const backuper = new Backuper(
    process.env.TOKEN,
    process.env.USER_NAME,
    false
);

backuper.backup();