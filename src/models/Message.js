const mongoose = require('mongoose')
const messageSchema = new mongoose.Schema({
    sender:{type:mongoose.Schema.Types.ObjectId,ref:'User'},
    sender:{type:mongoose.Schema.Types.ObjectId,ref:'User'},
    text:{type:String},
    file:{type:String}
},{timestamps:true,versionKey:false})

const MessageModel = mongoose.model('Message',messageSchema)
module.exports = MessageModel