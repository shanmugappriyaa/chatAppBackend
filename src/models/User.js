const mongoose = require('./index');

const userSchema = new mongoose.Schema({
    userName:{type:String,unique:true,required:[true,"User Name is Required"]},
    password:{type:String,required:[true,"Password is Required"]}
},{timestamps:true, versionKey:false})

 const  userModel = mongoose.model('User',userSchema)
 module.exports =userModel