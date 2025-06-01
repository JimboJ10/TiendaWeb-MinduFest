const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const multer = require('multer');
const { Server } = require('socket.io');

dotenv.config();
const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:4400',
    }
});

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('delete-carrito', (data) => {
        io.emit('new-carrito', data);
        console.log(data);
    });
    socket.on('add-carrito-add', (data) => {
        io.emit('new-carrito-add', data);
        console.log(data);
    });
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError || err.message === 'Solo se permiten archivos CSV') {
        return res.status(400).json({ error: err.message });
    }
    next(err);
});

// Registrar las rutas
app.use(require('./routes/usuarios'));
app.use(require('./routes/auth'));
app.use(require('./routes/cliente')); 
app.use(require('./routes/producto'));
app.use(require('./routes/categoria'));
app.use(require('./routes/carrito'));
app.use(require('./routes/nventa'));
app.use(require('./routes/admin'));
app.use(require('./routes/respaldos'));
app.use(require('./routes/2fa'));
app.use(require('./routes/proveedor'));
app.use(require('./routes/ordenCompra'));

server.listen(port, () => {
    console.log("Puerto ==> ", port);
});