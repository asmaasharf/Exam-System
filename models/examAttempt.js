
const mongoose = require('mongoose')

const  examAttemptSchema  = new mongoose.Schema({

    exam : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Exam',
        required : true
    },
    studentName : {
        type : String,
        required : true
    },
    startedAt : {
        type : Date,
        required : true
    },

    isSubmitted : {
    type : Boolean,
    default : false
},


answers : [
    {
        question : {
            type : mongoose.Schema.Types.ObjectId,
            ref : 'Question',
            required : true
        },

        answer : {

            text : {
            type : String,
            default : ''
        },

        drawing : {
            type : String,
            default : ''
        }

    },

    marks : {
        type : Number,
        default : 0
    },

        graded : {
            type : Boolean,
            default : false
        }
    }
],


score : {
    type : Number,
    default : 0
},

status : {
    type : String,
    enum : ['pending', 'completed'],
    default : 'pending'
}

}, {timestamps : true})

module.exports = mongoose.model('ExamAttempt', examAttemptSchema)