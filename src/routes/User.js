const express =require('express')
const router = express.Router()
const userControl = require('../controller/userController')

router.post('/login',userControl.loginUser)
router.post('/register',userControl.registerUser)
router.get('/profile',userControl.profile)
router.get('/messages/:userId',userControl.userMessages)
router.post('/logout',userControl.logout)
router.get('/people',userControl.people)

module.exports =router