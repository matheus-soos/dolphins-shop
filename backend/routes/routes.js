const router = require("express").Router()

router.use('/users', require('./users'))
router.use('/protheus', require('./protheus'))
router.use('/produtos', require('./produtos'))
router.use('/categorias', require('./categorias'))
router.use('/carrinhos', require('./carrinhos'))
router.use('/checkout', require('./checkout'))
router.use('/pagamentos', require('./pagamentos'))
router.use('/frete', require('./frete'))
router.use('/cupons', require('./cupons'))
router.use('/pedidos' ,require('./pedidos_venda'))
router.use('/banners' ,require('./banners'))

module.exports = router