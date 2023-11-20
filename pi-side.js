const io = require('socket.io-client');
const path = require('path');
const fs = require('fs');

const uuid = process.env.UUID;
const BASE_DIR = process.env.BASE_DIR;

const socket = io.connect(process.env.EP_MAN_SERVER_URL);

socket.on('connect', () => {
  console.log('connected');
  socket.emit('regist-uuid', uuid);
});

const attachFuncs = () => {
  socket.onAny((evt) => console.log(evt));
  socket.on('readDir-req', async (qpath) => {
    const rpath = path.join(BASE_DIR, qpath);
    const files = await fs.promises.readdir(rpath).catch(() => []);
    const promises = files.map((file) => fs.promises.stat(path.join(rpath, file)).then((fileStat) => ({
      name: file,
      size: fileStat.size,
      atime: fileStat.atime,
      mtime: fileStat.mtime,
      ctime: fileStat.ctime,
      birthtime: fileStat.birthtime,
      isFile: fileStat.isFile(),
    })));
    const stats = await Promise.all(promises).catch(() => []);
    socket.emit('readDir-res', stats);
  });

  socket.on('mkdir-req', async (qpath) => {
    console.log(qpath)
    const rpath = path.join(BASE_DIR, qpath);
    const ret = await fs.promises.mkdir(rpath)
      .then(() => true)
      .catch(() => false);
    socket.emit('mkdir-res', ret ? 'success': 'fail');
  });

  socket.on('rm-req', async (qpath) => {
    const rpath = path.join(BASE_DIR, qpath);
    const ret = await fs.promises.rm(rpath)
      .then(() => true)
      .catch(() => false);
    socket.emit('rm-res', ret ? 'success': 'fail');
  });

  socket.on('getInfo-req', async (qpath) => {
    const rpath = path.join(BASE_DIR, qpath);
    const fileName = qpath.split(path.sep).at(-1) || '';
    const ret = await fs.promises.stat(rpath)
      .then((fileStat) => ({
        name: fileName,
        size: fileStat.size,
        atime: fileStat.atime,
        mtime: fileStat.mtime,
        ctime: fileStat.ctime,
        birthtime: fileStat.birthtime,
        isFile: fileStat.isFile(),
      }))
      .catch(() => null);
    socket.emit('getInfo-res', ret);
  });

  socket.on('upload-req', async (qpath, filename, fileBin) => {
    const rpath = path.join(BASE_DIR, qpath, filename);
    const ret = await fs.promises.writeFile(rpath, fileBin)
      .then(() => true)
      .catch(() => false);
    socket.emit('upload-res', ret ? 'success': 'fail');
  });

  socket.on('rename-req', async (srcPath, destPath) => {
    const rsrcPath = path.join(BASE_DIR, srcPath);
    const rdestPath = path.join(BASE_DIR, destPath);
    const ret = await fs.promises.rename(rsrcPath, rdestPath)
      .then(() => true)
      .catch(() => false);
    socket.emit('rename-res', ret ? 'success': 'fail');
  });

  socket.on('download-req', async (qpath) => {
    const rpath = path.join(BASE_DIR, qpath);
    socket.emit('download-res', fs.readFileSync(rpath));
  });
};

socket.on('regist-done', () => {
  console.log('regist-done');
  attachFuncs();
});
