// الاسكيما الخاصه بتخزين السؤال


const mongoose = require('mongoose')

const questionSchema = new  mongoose.Schema({

    exam :{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Exam',
        required : true,
    },

    questionText : {
        type : String,
        required : true,
        trim : true
    },

    type : {

        type : String,
        required : true,
        enum : [

            'multiple-choice',
            'true-false',
            'essay',
            'drawing',
            'correction',
            'scientific-term',
            'complete'


        ]
    },

    drawingImage: {
    type: String,
    default: ''
    },

    answerMode: {
    type: String,
    enum: ['text', 'drawing', 'both'],
    default: 'text'
},

    marks : {

        type : Number,
        required : true,
        min : 0
    },

    options : {
        type : [String],
        default : []
    },
    correctAnswer : {
        type : String,
        default : null,
    },

    modelAnswer : {
        type : String,
        default : null,
    }, 

    order : {
        type : Number,
        required : true,
    },

    groupOrder : {
    type : Number,
    required : true,
},

underlinedText: {
    type: String,
    default: ''
},

}, {timestamps : true});

module.exports = mongoose.model('Question', questionSchema)