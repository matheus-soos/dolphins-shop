const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const compression = require("compression");
const auth = require("./middleware/auth");
const path = require("path")
const https = require('https');
const fs = require('fs');
require("dotenv").config();

const app = express();

// Conexão com Banco de Dados
const database = require('./config/database');
require('./models').defineModels()
database.sync();

// Aplicação das dependências para melhorias de desempenho, segurança, etc.
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.disable('x-powered-by')

app.use(cors({
    origin: '*'
}));

app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

app.use(compression())

// Utilização das rotas do sistema
app.use('/api', require("./routes/routes"))

app.use('/uploads/productImages', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
}, express.static(path.join(__dirname, 'uploads', 'productImages')));

app.use('/uploads/banners', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
}, express.static(path.join(__dirname, 'uploads', 'banners')));

// Rota para teste da autenticação
app.get("/welcome", auth, (req, res) => {
    res.status(200).send("Welcome")
})

// Iniciar servidor express
const { API_PORT } = process.env
const port = API_PORT || 3000

const options = {
    key: fs.readFileSync('./private.key'),
    cert: fs.readFileSync('./certificate.crt')
};

https.createServer(options, app).listen(3060, () => {
    console.log('Servidor HTTPS iniciado');
});

module.exports = app