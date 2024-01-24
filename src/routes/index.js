const express = require('express')
const router = express.Router();

const userRoutes = require('./User')
router.use('/user',userRoutes)

module.exports = router