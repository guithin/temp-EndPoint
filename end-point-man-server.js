const { Server } = require('socket.io');
const express = require('express');
const multer = require('multer');
const http = require('http');

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

/**
 * @type {Object.<string, import('socket.io').Socket>}
 */
const endPByUuid = {};

io.on('connection', (socket) => {
  socket.on('regist-uuid', (uuid) => {
    console.log('regist-uuid ', uuid);
    socket.data.uuid = uuid;
    endPByUuid[uuid] = socket;
    socket.emit('regist-done');
  });
  socket.on('disconnect', () => {
    console.log('disconnect ', socket.data.uuid);
    delete endPByUuid[socket.data.uuid];
  });
});

app.use((req, res, next) => {
  if (req.path !== '/socket.io/') {
    console.log(req.path);
  }
  next();
})

app.post('/readdir', (req, res) => {
  const { uuid, qpath } = req.body;
  const socket = endPByUuid[uuid];
  if (!socket) {
    console.log('invalid uuid')
    res.status(400).send('invalid uuid');
    return;
  }
  socket.once('readDir-res', (stats) => {
    res.status(200).send(stats);
  });
  socket.emit('readDir-req', qpath);
});

app.post('/mkdir', (req, res) => {
  const { uuid, qpath } = req.body;
  const socket = endPByUuid[uuid];
  if (!socket) {
    console.log('invalid uuid')
    res.status(400).send('invalid uuid');
    return;
  }
  socket.once('mkdir-res', (ret) => {
    res.status(200).send(ret);
  });
  socket.emit('mkdir-req', qpath);
});

app.post('/rm', (req, res) => {
  const { uuid, qpath } = req.body;
  const socket = endPByUuid[uuid];
  if (!socket) {
    console.log('invalid uuid')
    res.status(400).send('invalid uuid');
    return;
  }
  socket.once('rm-res', (ret) => {
    res.status(200).send(ret);
  });
  socket.emit('rm-req', qpath);
});

app.post('/getinfo', (req, res) => {
  const { uuid, qpath } = req.body;
  const socket = endPByUuid[uuid];
  if (!socket) {
    console.log('invalid uuid')
    res.status(400).send('invalid uuid');
    return;
  }
  socket.once('getInfo-res', (ret) => {
    res.status(200).send(ret);
  });
  socket.emit('getInfo-req', qpath);
});

const upload = multer({
  storage: multer.memoryStorage(),
});

// TODO
app.post('/upload', upload.fields([
  { name: 'file' },
  { name: 'uuid' },
  { name: 'qpath' },
  { name: 'filename' },
]), (req, res) => {
  const { uuid, qpath, filename } = req.body;
  const [file] = req.files.file;
  console.log(file);
  const socket = endPByUuid[uuid];
  if (!socket) {
    console.log('invalid uuid')
    res.status(400).send('invalid uuid');
    return;
  }
  socket.once('upload-res', (ret) => {
    res.status(200).send(ret);
  });
  socket.emit('upload-req', qpath, filename, file.buffer);
});

app.post('/mv', (req, res) => {
  const { uuid, srcPath, destPath } = req.body;
  const socket = endPByUuid[uuid];
  if (!socket) {
    console.log('invalid uuid')
    res.status(400).send('invalid uuid');
    return;
  }
  socket.once('rename-res', (ret) => {
    res.status(200).send(ret);
  });
  socket.emit('rename-req', srcPath, destPath);
});

app.post('/download', (req, res) => {
  const { uuid, qpath } = req.body;
  const socket = endPByUuid[uuid];
  if (!socket) {
    console.log('invalid uuid')
    res.status(400).send('invalid uuid');
    return;
  }
  socket.once('download-res', (ret) => {
    res.status(200).send(ret);
  });
  socket.emit('download-req', qpath);
});

server.listen(8080, () => {
  console.log('listening on 8080');
});
