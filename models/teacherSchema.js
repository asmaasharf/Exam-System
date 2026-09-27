
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const teacherSchema = new mongoose.Schema({

    teacherName : {
        type : String,
        required : true,
        trim : true
    },

    teacherPhone : {
        type : String,
        required : true,
        trim : true

    },

    password : {
        type : String,
        required : true,
        trim : true

    }
}, {timestamps : true})

teacherSchema.methods.hashPassword = function(password){
    return bcrypt.hashSync(password, bcrypt.genSaltSync(12))
}





module.exports = mongoose.model('Teacher', teacherSchema )