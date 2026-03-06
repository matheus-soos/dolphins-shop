const User = require("../models/user");
const router = require("express").Router()
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken");
const Cliente = require("../models/cliente");
const auth = require("../middleware/auth")

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

        res.status(201).json({
            user: user,
            token: {
                token: token,
                expiresIn: "30d"
            }
        })
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

router.get("/getUsers", auth, async (req, res, next) => {
    try {
        const users = await User.findAll()

        res.json({ success: true, users })
    } catch (error) {
        console.error(error)
        res.status(400).json({ error })
    }
})

router.get("/getUser/:id", auth, async (req, res, next) => {
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

router.post('/cadastroCliente', auth, async (req, res, next) => {
    try {
        const { email, password, nome, cpf, telefone, dataNascimento, cep, logradouro, numero, complemento, bairro, cidade, estado, } = req.body

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
            data_nascimento: new Date(dataNascimento),
            cep,
            logradouro,
            numero,
            complemento,
            bairro,
            cidade,
            estado,
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

router.get("/getCliente/:user_id", auth, async (req, res, next) => {
    try {
        const user = await User.findOne({
            where: { id: req.params.user_id },
            attributes: ["id", "email"],
            include: [
                { model: Cliente, as: "Cliente" }
            ]
        })

        if(!user) {
            res.status(401).send("Usuário não encontrado.")
            return
        }

        res.json({ success: true, user })
    } catch (error) {
        res.status(500).json({ error })
    }
})

module.exports = router