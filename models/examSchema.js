
// الاسكيما الخاصه بصفحة انشاء الامتحان

const mongoose = require('mongoose')

const examSchema = new mongoose.Schema({

    teacher : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Teacher',
        required : true
    },

    title :{
        type : String,
        required : true,
        trim : true
    },

    subject :{
        type : String,
        required : true,
        trim : true
    },

    grade :{
        type : String,
        required : true,
        trim : true
    },

    academicYear :{
        type : String,
        required : true,
        trim : true
    },

    examType :{
        type : String,
        required : true,
        enum : ['اخري', 'سنوي','نصف سنوي','شهري']
    },

     duration :{
        type : String,
        required : true,
        min : 1,
    },

     totalMarks :{
        type : Number,
        required : true,
        min : 0,
    },

    status : {
        type  : String,
        enum : ['Draft', 'Ready', 'Published', 'Closed'],
        default : 'Draft',
    },


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


}, {timestamps : true})


module.exports = mongoose.model('Exam', examSchema)