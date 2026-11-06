const User = require("../models/user");
const router = require("express").Router()
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken");
const Cliente = require("../models/cliente");
const auth = require("../middleware/auth")
const database = require("../config/database")

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
            { user_id: user.id, email },
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
        const { password, keep_login } = req.body
        const email = (req.body.email || "").trim().toLowerCase()

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

/**
 * Converte a data de nascimento vinda do front para 'YYYY-MM-DD' (DATEONLY).
 * Aceita 'YYYY-MM-DD', 'DD/MM/YYYY' ou ISO completo. Retorna:
 *  - null se vier vazia (campo é opcional)
 *  - undefined se for inválida
 */
function parseDataNascimento(valor) {
    if (valor === null || valor === undefined || String(valor).trim() === "") {
        return null
    }

    const texto = String(valor).trim()
    let ano, mes, dia

    let m = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (m) {
        [, dia, mes, ano] = m
    } else if ((m = texto.match(/^(\d{4})-(\d{2})-(\d{2})/))) {
        [, ano, mes, dia] = m
    } else {
        return undefined
    }

    ano = Number(ano); mes = Number(mes); dia = Number(dia)

    // Valida dia/mês reais (ex.: 31/02 é inválido)
    const data = new Date(Date.UTC(ano, mes - 1, dia))
    if (data.getUTCFullYear() !== ano || data.getUTCMonth() !== mes - 1 || data.getUTCDate() !== dia) {
        return undefined
    }

    const hoje = new Date()
    if (data > hoje || ano < hoje.getFullYear() - 120) {
        return undefined
    }

    return `${String(ano).padStart(4, "0")}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`
}

router.post('/cadastroCliente', async (req, res, next) => {
    const { password, nome, cpf, telefone, dataNascimento, cep, logradouro, numero, complemento, bairro, cidade, estado, } = req.body
    const email = (req.body.email || "").trim().toLowerCase()

    if (!(email && password)) {
        return res.status(400).send("Preencha os campos obrigatórios")
    }

    const data_nascimento = parseDataNascimento(dataNascimento)

    if (data_nascimento === undefined) {
        return res.status(400).send("Data de nascimento inválida")
    }

    // Usuário + cliente na mesma transação: se o cliente falhar, o usuário
    // não fica "órfão" (antes isso bloqueava o novo cadastro com "Usuário já existente")
    const transaction = await database.transaction()

    try {
        const oldUser = await User.findOne({
            where: { email: email },
            transaction
        })

        if (oldUser) {
            await transaction.rollback()
            return res.status(409).send("Usuário já existente")
        }

        const hash = await bcrypt.hash(password, 10)

        const user = await User.create({
            email: email,
            password: hash,
            isAdmin: false
        }, { transaction })

        const cliente = await Cliente.create({
            user_id: user.id,
            nome: nome,
            cpf: cpf,
            telefone: telefone,
            data_nascimento,
            cep,
            logradouro,
            numero,
            complemento,
            bairro,
            cidade,
            estado,
        }, { transaction })

        await transaction.commit()

        const expiresIn = "30d"

        const token = jwt.sign(
            { user_id: user.id, email },
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
        await transaction.rollback()
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