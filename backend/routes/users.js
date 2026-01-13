const User = require("../models/user");
const router = require("express").Router()
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken");
const Cliente = require("../models/cliente");
const Endereco = require("../models/endereco");

router.post('/register', async (req, res, next) => {
    try {
        const { email, password, isAdmin } = req.body

        if (!(email && password)) {
            return res.status(400).send("Preencha os campos obrigatórios")
        }

        const oldUser = await User.findOne({
            where: { email: email }
        })

        if (oldUser) {
            return res.status(409).send("Usuário já existente")
        }

        const hash = await bcrypt.hash(password, 10)

        const user = await User.create({
            email: email.toLowerCase(),
            password: hash,
            isAdmin: isAdmin
        })

        const token = jwt.sign(
            { user_id: user._id, email },
            process.env.TOKEN_KEY,
            {
                expiresIn: "30d",
            }
        );

        user.token = token

        res.status(201).json(user)
    }
    catch (err) {
        console.log(err)
        res.status(400).json({ err })
    }
})

router.post('/login', async (req, res, next) => {
    try {
        const { email, password, keep_login } = req.body

        if (!(email && password)) {
            return res.status(400).send("Preencha os campos obrigatórios")
        }

        const user = await User.findOne({ where: { email: email } })

        if (user && (await bcrypt.compare(password, user.password))) {
            const expiresIn = "30d"

            const token = jwt.sign(
                { user_id: user.id, email },
                process.env.TOKEN_KEY,
                {
                    expiresIn: expiresIn,
                }
            );

            res.status(200).json({
                user: user,
                token: {
                    token: token,
                    expiresIn: expiresIn
                }
            });
        }
        else {
            res.status(400).send("Credenciais inválidas")
        }
    }
    catch (err) {
        console.log(err)
    }
})

router.get("/getUsers", async (req, res, next) => {
    try {
        const users = await User.findAll()

        res.json({ success: true, users })
    } catch (error) {
        console.error(error)
        res.status(400).json({ error })
    }
})

router.get("/getUser/:id", async (req, res, next) => {
    try {
        const user = await User.findOne({
            where: { id: req.params.id }
        })

        res.json({ success: true, user })
    } catch (error) {
        console.error(error)
        res.status(400).json({ error })
    }
})

router.post('/cadastroCliente', async (req, res, next) => {
    try {
        const { email, password, nome, cpf, telefone, dataNascimento, endereco } = req.body

        if (!(email && password)) {
            return res.status(400).send("Preencha os campos obrigatórios")
        }

        const oldUser = await User.findOne({
            where: { email: email }
        })

        if (oldUser) {
            return res.status(409).send("Usuário já existente")
        }

        const hash = await bcrypt.hash(password, 10)

        const user = await User.create({
            email: email.toLowerCase(),
            password: hash,
            isAdmin: false
        })

        const cliente = await Cliente.create({
            user_id: user.id,
            nome: nome,
            cpf: cpf,
            telefone: telefone,
            data_nascimento: new Date(dataNascimento)
        })

        await Endereco.create({
            cliente_id: cliente.id,
            nome: endereco.nomeEndereco,
            cep: endereco.cep,
            rua: endereco.rua,
            numero: endereco.numero,
            complemento: endereco.complemento,
            bairro: endereco.bairro,
            cidade: endereco.cidade,
            estado: endereco.estado,
            principal: true
        })

        const expiresIn = "30d"

        const token = jwt.sign(
            { user_id: user._id, email },
            process.env.TOKEN_KEY,
            {
                expiresIn: expiresIn,
            }
        );

        user.token = token

        res.status(201).json({
            user,
            cliente,
            token: {
                token: token,
                expiresIn: expiresIn
            }
        })
    }
    catch (err) {
        console.log(err)
        res.status(400).json({ err })
    }
})

module.exports = router