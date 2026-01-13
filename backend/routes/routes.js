const router = require("express").Router()

router.use('/users', require('./users'))
router.use('/safrapay', require('./safrapay'))
router.use('/protheus', require('./protheus'))
router.use('/produtos', require('./produtos'))
router.use('/categorias', require('./categorias'))
router.use('/carrinhos', require('./carrinhos'))
router.use('/checkout', require('./checkout'))
router.use('/cupons', require('./cupons'))

module.exports = router