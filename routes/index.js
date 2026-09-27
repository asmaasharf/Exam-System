var express = require('express');
var router = express.Router();

const mongoose = require('mongoose')
const Exam = require('../models/examSchema')
const Question = require('../models/questionSchema')
const ExamAttempt = require('../models/examAttempt');
const Teacher = require('../models/teacherSchema')
const bcrypt = require('bcrypt')

const fs = require('fs')
const path = require('path');
const { log } = require('console');

async function saveDrawing(dataUrl) {

  if (!dataUrl) {
    return '';
  }

  const base64Data = dataUrl.replace(
    /^data:image\/png;base64,/,
    ''
  );

  const drawingsDir = path.join(
    __dirname,
    '../public/uploads/drawings'
  );

  await fs.promises.mkdir(
    drawingsDir,
    { recursive: true }
  );

  const fileName = `drawing-${Date.now()}.png`;

  const filePath = path.join(
    drawingsDir,
    fileName
  );

  const imageBuffer = Buffer.from(
    base64Data,
    'base64'
  );

  await fs.promises.writeFile(
    filePath,
    imageBuffer
  );

  return `/uploads/drawings/${fileName}`;
}


async function saveStudentDrawing(dataUrl) {

  if (!dataUrl) {
    return '';
  }

  const base64Data = dataUrl.replace(
    /^data:image\/png;base64,/,
    ''
  );

  const drawingsDir = path.join(
    __dirname,
    '../public/uploads/student-drawings'
  );

  await fs.promises.mkdir(
    drawingsDir,
    { recursive: true }
  );

  const fileName = `student-drawing-${Date.now()}.png`;

  const filePath = path.join(
    drawingsDir,
    fileName
  );

  const imageBuffer = Buffer.from(
    base64Data,
    'base64'
  );

  await fs.promises.writeFile(
    filePath,
    imageBuffer
  );

  return `/uploads/student-drawings/${fileName}`;
}


// راوتر انشاء الحساب  للمدرس 

router.get('/createAcount-exam-system', (req, res, next)=>{

  res.render('createAcount')
})

router.post('/createAcount-exam-system', async(req, res, next)=>{

  try {

    const {

      teacherName,
      teacherPhone,
      password

    } = req.body

    const teacher = new Teacher({

      teacherName,
      teacherPhone,
      password

    })

    teacher.password = teacher.hashPassword(password)

    await teacher.save()

     console.log('Teacher Created : ', teacher)

    res.redirect('/login-exam-system')

  }
  catch(err){
    console.log(err);
    next(err)
    
  }
})

// صفحة تسجيل الدخول للمدرس

router.get('/login-exam-system', (req, res, next)=>{

  res.render('login')
})

router.post('/login-exam-system', async(req, res, next)=>{
  
  try{

    const {

      teacherName,

      password,

    } = req.body

    const teacher = await Teacher.findOne({teacherName : teacherName})

    if (!teacher){
    return  res.status(404).send(' المدرس غير موجود')
    }

    const passwordMatch = await bcrypt.compare(
      password, teacher.password
    )

    if (!passwordMatch){
     return res.status(404).send('كلمة المرور غير صحيحة')
    }

    req.session.teacherId = teacher._id

     console.log('SESSION TEACHER ID : ', req.session.teacherId)


        res.redirect('/createExam')


  }
  catch(err){
    console.log(err);
    next(err)
    
  }
})



// راوتر انشاء الامتحان

router.get('/createExam', async (req, res, next) => {

    try {

        // هل المدرس عامل Login؟
        if (!req.session.teacherId) {

            return res.redirect('/login-exam-system')

        }


        // هل المدرس الموجود في الـ Session ما زال موجودًا؟
        const teacher = await Teacher.findById(req.session.teacherId)


        if (!teacher) {

            return res.status(404).send('المدرس غير موجود')

        }


        res.render('create-exam', {
            teacher: teacher
        })

    }
    catch (err) {

        console.log(err)
        next(err)

    }

})

router.post('/createExam', async (req, res, next)=>{

        try {

          // التأكد ان المدرس عامل  login الاول
          if(!req.session.teacherId){
            return res.redirect('/login-exam-system')
          }

          const {
            title,
            teacherName,
            teacherPhone,
            subject,
            grade,
            academicYear,
            examType,
            duration,
            totalMarks,
        } = req.body

      // نجيب بيانات المدرس من ال session
        const teacher = await Teacher.findById(req.session.teacherId)

        if (!teacher){
          return res.status(404).send('المدرس غير موجود')
        }

      // انشاء امتحان وربطه بالمدرس الحالي 

        const exam = await Exam.create({

            teacher : teacher._id,
            title,
            teacherName : teacher.teacherName,
            teacherPhone : teacher.teacherPhone,
            subject,
            grade,
            academicYear,
            examType,
            duration,
            totalMarks,
        })


          console.log('Exam Created : ', exam);
          
          res.redirect(`/questions/${exam._id}`)

        }catch(err){
          console.log(err);
          next(err)
          
        }

})



// راوتر عرض  امتحانات المدرس

router.get('/teacherExams', async function(req, res, next) {

    try {

        const teacherName = req.query.teacherName;

        console.log('Teacher Name:', teacherName);


        const exams = await Exam.find({
            teacherName: teacherName
        }).sort({ createdAt: -1 });


        console.log('Teacher Exams:', exams);


      res.render('teacher-exams', {
        teacherName: teacherName,
        exams: exams
});

    } catch (err) {

        console.log(err);
        next(err);

    }

});



// صفحة اعداد الامتحان والاسئلة


router.get('/questions/:_id', async (req, res, next) => {

    try {

        // =====================================
        // 1 - هل المدرس عامل Login؟
        // =====================================

        if (!req.session.teacherId) {

            return res.redirect('/login-exam-system');

        }


        // =====================================
        // 2 - هات الامتحان المطلوب
        // =====================================

        const exam =
            await Exam.findById(req.params._id);


        // =====================================
        // 3 - هل الامتحان موجود؟
        // =====================================

        if (!exam) {

            return res.status(404).send(
                'الامتحان غير موجود'
            );

        }


        // =====================================
        // 4 - هل الامتحان يخص المدرس الحالي؟
        // =====================================

        if (!exam.teacher) {

            return res.status(403).send(
                'هذا الامتحان غير مرتبط بك'
            );

        }


        if (
            exam.teacher.toString() !==
            req.session.teacherId.toString()
        ) {

            return res.status(403).send(
                'ليس لديك صلاحية لفتح هذا الامتحان'
            );

        }


        // =====================================
        // 5 - جلب أسئلة الامتحان
        // =====================================

        const questions =
            await Question.find({
                exam: exam._id
            })
            .sort({
                groupOrder: 1,
                order: 1
            });


        // =====================================
        // 6 - حساب إجمالي درجات الأسئلة
        // =====================================

        const questionsTotalMarks =
            questions.reduce(
                (total, question) =>
                    total + question.marks,
                0
            );


        // =====================================
        // 7 - عناوين أنواع الأسئلة
        // =====================================

        const typeTitles = {

            'multiple-choice':
                'اختيار من متعدد',

            'true-false':
                'صح أو خطأ',

            'essay':
                'الأسئلة المقالية',

            'drawing':
                'أسئلة الرسم',

            'correction':
                'صوّب ما تحته خط',

            'scientific-term':
                'اكتب المصطلح العلمي',

            'complete':
                'أكمل الإجابة الصحيحة'

        };


        // =====================================
        // 8 - تكوين مجموعات الأسئلة
        // =====================================

        const groupsMap = new Map();


        questions.forEach(question => {

            if (!groupsMap.has(question.type)) {

                groupsMap.set(
                    question.type,
                    {

                        type:
                            question.type,

                        title:
                            typeTitles[question.type]
                            || question.type,

                        groupOrder:
                            question.groupOrder,

                        questions: []

                    }
                );

            }


            groupsMap
                .get(question.type)
                .questions
                .push(question);

        });


        // =====================================
        // 9 - تحويل Map إلى Array
        // =====================================

        const questionGroups =
            Array.from(
                groupsMap.values()
            );


        // =====================================
        // 10 - ترتيب المجموعات
        // =====================================

        questionGroups.sort(
            (a, b) =>
                a.groupOrder -
                b.groupOrder
        );


        // =====================================
        // 11 - إعطاء كل مجموعة رقم
        // الـ Helper يحوله إلى:
        // الأول - الثاني - الثالث...
        // =====================================

        questionGroups.forEach(
            (group, index) => {

                group.groupNumber =
                    index + 1;

            }
        );


        // =====================================
        // 12 - المصفوفات القديمة
        // نتركها كما هي حتى لا نكسر
        // أي جزء قديم في الصفحة
        // =====================================

        const multipleChoiceQuestions =
            questions.filter(
                question =>
                    question.type ===
                    'multiple-choice'
            );


        const trueFalseQuestions =
            questions.filter(
                question =>
                    question.type ===
                    'true-false'
            );


        const essayQuestions =
            questions.filter(
                question =>
                    question.type ===
                    'essay'
            );


        const drawingQuestions =
            questions.filter(
                question =>
                    question.type ===
                    'drawing'
            );


        const correctionQuestions =
            questions.filter(
                question =>
                    question.type ===
                    'correction'
            );


        const scientificTermQuestions =
            questions.filter(
                question =>
                    question.type ===
                    'scientific-term'
            );


        const completeQuestions =
            questions.filter(
                question =>
                    question.type ===
                    'complete'
            );


        // =====================================
        // 13 - عرض الصفحة
        // =====================================

        res.render(
            'manage-questions',
            {

                exam,

                questions,

                questionsTotalMarks,

                questionGroups,

                multipleChoiceQuestions,

                trueFalseQuestions,

                essayQuestions,

                drawingQuestions,

                correctionQuestions,

                scientificTermQuestions,

                completeQuestions

            }
        );


    }
    catch (err) {

        console.log(err);

        next(err);

    }

});


// صفحة اضافة سؤال
router.get('/questions/add/:_id', async (req, res, next) => {

  try{
    const exam = await Exam.findById(req.params._id)

    if(!exam){
     return res.status(404).send('الامتحان غير موجود')
    }


    res.render('add-question' , {exam});
  }

  catch(err){
    console.log(err)
    next(err)
  }

   

});

// راوتر حفظ السؤال
router.post('/questions/add/:_id', async (req, res, next) => {

    try {

        const {
            questionText,
            type,
            marks,
            options,
            correctAnswer,
            modelAnswer,
            drawingData,
            answerMode,
            underlinedText
        } = req.body;


        console.log('REQ.BODY:', req.body);


        // ========================================
        // التأكد من وجود الامتحان
        // ========================================

        const exam =
            await Exam.findById(req.params._id);


        if (!exam) {

            return res.status(404).send(
                'الامتحان غير موجود'
            );

        }


        // ========================================
        // حفظ صورة سؤال الرسم
        // ========================================

        let drawingImage = '';


        if (
            type === 'drawing' &&
            drawingData
        ) {

            drawingImage =
                await saveDrawing(drawingData);

        }


        // ========================================
        // البحث عن آخر سؤال من نفس النوع
        // لتحديد الرقم الداخلي
        // ========================================

        const lastQuestionOfSameType =
            await Question.findOne({

                exam: exam._id,

                type: type

            })
            .sort({
                order: -1
            });


        const order =
            lastQuestionOfSameType
                ? lastQuestionOfSameType.order + 1
                : 1;



// تحديد رقم مجموعة السؤال
let groupOrder = 1;

const existingQuestionOfSameType =
    await Question.findOne({
        exam: exam._id,
        type: type,
        groupOrder: { $exists: true, $ne: null }
    }).sort({
        groupOrder: 1
    });

if (existingQuestionOfSameType) {

    groupOrder = Number(existingQuestionOfSameType.groupOrder);

} else {

    const lastGroup =
        await Question.findOne({
            exam: exam._id,
            groupOrder: { $exists: true, $ne: null }
        }).sort({
            groupOrder: -1
        });

    groupOrder = lastGroup
        ? Number(lastGroup.groupOrder) + 1
        : 1;
}

console.log('GROUP ORDER AFTER CALCULATION:', groupOrder);



        // ========================================
        // إنشاء السؤال
        // ========================================

        const question =
            await Question.create({

                exam: exam._id,

                questionText,

                type,

                marks,

                options,

                correctAnswer,

                modelAnswer,

                drawingImage,

                answerMode,

                // الكلمة المراد تصويبها
                underlinedText:
                    type === 'correction'
                        ? (underlinedText || '')
                        : '',

                order,

                groupOrder

            });


        console.log(
            'Question Created:',
            question
        );


        res.redirect(
            `/questions/${exam._id}`
        );


    }
    catch(err) {

        console.log(err);

        next(err);

    }

});



// راوتر تعديل السؤال

router.get('/question/edit/:_id', async (req, res, next)=>{
  try{
    const question = await Question.findById(req.params._id)
    .populate('exam')
    if (!question){
      return res.status(404).send('الامتحان غير موجود')
    }

    console.log('Question To Edit : ', question)
    res.render('add-question', {
      question,
      exam : question.exam
    
    })

  }
  catch(err){
    console.log(err)
    next(err)
  }
})


router.put('/question/edit/:_id', async (req, res, next) => {

    try {

        const {
            questionText,
            type,
            marks,
            options,
            correctAnswer,
            modelAnswer,
            drawingData,
            answerMode,
            underlinedText
        } = req.body;


        // ========================================
        // جلب السؤال الحالي
        // ========================================

        const currentQuestion =
            await Question.findById(
                req.params._id
            );


        if (!currentQuestion) {

            return res.status(404).send(
                'السؤال غير موجود'
            );

        }


        let drawingImage;


        // ========================================
        // حفظ صورة الرسم الجديدة
        // ========================================

        if (
            type === 'drawing' &&
            drawingData
        ) {

            drawingImage =
                await saveDrawing(drawingData);

        }


        // ========================================
        // هل نوع السؤال اتغير؟
        // ========================================

        const typeChanged =
            currentQuestion.type !== type;


        let order =
            currentQuestion.order;


        let groupOrder =
            currentQuestion.groupOrder;


        // ========================================
        // لو نوع السؤال اتغير
        // ========================================

        if (typeChanged) {


            // ====================================
            // هل النوع الجديد موجود بالفعل؟
            // ====================================

            const existingQuestionOfSameType =
                await Question.findOne({

                    exam: currentQuestion.exam,

                    type: type,

                    _id: {
                        $ne: currentQuestion._id
                    }

                })
                .sort({
                    groupOrder: 1
                });


            if (existingQuestionOfSameType) {

                // نستخدم مجموعة النوع الموجودة

                groupOrder =
                    existingQuestionOfSameType.groupOrder;

            }

            else {

                // ====================================
                // نوع جديد لأول مرة
                // ====================================

                const lastGroup =
                    await Question.findOne({

                        exam: currentQuestion.exam,

                        _id: {
                            $ne: currentQuestion._id
                        }

                    })
                    .sort({
                        groupOrder: -1
                    });


                groupOrder =
                    lastGroup
                        ? lastGroup.groupOrder + 1
                        : 1;

            }


            // ====================================
            // الرقم داخل المجموعة الجديدة
            // ====================================

            const lastQuestionOfSameType =
                await Question.findOne({

                    exam: currentQuestion.exam,

                    type: type,

                    _id: {
                        $ne: currentQuestion._id
                    }

                })
                .sort({
                    order: -1
                });


            order =
                lastQuestionOfSameType
                    ? lastQuestionOfSameType.order + 1
                    : 1;

        }


        // ========================================
        // بيانات التحديث
        // ========================================

    const updateData = {
    questionText,
    type,
    marks,
    options,
    correctAnswer,
    modelAnswer,
    answerMode,

    underlinedText:
        type === 'correction'
            ? (underlinedText || '')
            : '',

    order,
    groupOrder
};


        // إضافة drawingImage فقط لو فيه صورة جديدة

        if (drawingImage) {

            updateData.drawingImage =
                drawingImage;

        }


        // ========================================
        // تحديث السؤال
        // ========================================

        const question =
            await Question.findByIdAndUpdate(

                req.params._id,

                updateData,

                {
                    new: true,
                    runValidators: true
                }

            );


        console.log(
            'Question Update:',
            question
        );


        res.json({

            success: true,

            question

        });


    }
    catch(err) {

        console.log(err);

        next(err);

    }

});



//  راوتر حذف السؤال

router.delete('/question/delete/:_id', async (req, res, next)=>{

  try{

    const question = await Question.findByIdAndDelete(
      req.params._id
    )

    if(!question){
      return res.status(404).send('السؤال غير موجود')
    }


    // هات الأسئلة المتبقية من نفس الامتحان ونفس النوع
    const remainingQuestions = await Question.find({
      exam: question.exam,
      type: question.type
    }).sort({
      order: 1
    })


    // إعادة ترقيم الأسئلة
    let newOrder = 1;


    for (const remainingQuestion of remainingQuestions) {

      remainingQuestion.order = newOrder;

      await remainingQuestion.save();

      newOrder++;

    }


    console.log('Question Deleted:', question);


    res.json({
      success: true
    })

  }
  catch(err){

    console.log(err);
    next(err)

  }

})


// راوتر صفحة بدء الامتحان للطالب

router.get('/exam/start/:_id', async (req, res, next) => {

  try {

    const exam = await Exam.findById(req.params._id)

    if (!exam) {
      return res.status(404).send('الامتحان غير موجود')
    }

    const questions = await Question.find({
      exam: exam._id
    })

    res.render('start-exam', {
      exam,
      questions
    })

  }
  catch(err) {

    console.log(err)
    next(err)

  }

})

router.post('/exam/start/:_id', async (req, res, next)=>{

  try {
     const exam = await Exam.findById(req.params._id)
     if (!exam){
      return res.status(404).send('الامتحان غير موجود');
      
     }

     const {studentName}  = req.body
     if (!studentName){
      return res.status(404).send('اسم الطالب مطلوب')
     }

   

     const attempt = await ExamAttempt.create({
      exam : exam._id,

      studentName,

      startedAt : new Date()

     })

     console.log('Exam Attempt Created : ', attempt);
     
     res.redirect(`/exam/${exam._id}?attempt=${attempt._id}`)
     

  }
  catch(err){
    console.log(err);
    next(err)
    
  }
})


//  راوتر عرض الامتحان للطالب
router.get('/exam/:_id', async (req, res, next) => {

    try {

        const exam = await Exam.findById(req.params._id);

        if (!exam) {
            return res.status(404).send('الامتحان غير موجود');
        }


        const attemptId = req.query.attempt;


        if (!attemptId) {
            return res.redirect(`/exam/start/${exam._id}`);
        }


        const attempt = await ExamAttempt.findById(attemptId);


        if (!attempt) {
            return res.status(404).send('محاولة الامتحان غير موجودة');
        }


        if (attempt.isSubmitted) {

            return res.redirect(
                `/exam/result/${attempt._id}`
            );

        }


        // =========================================
        // جلب الأسئلة
        // =========================================

        const questions = await Question.find({
            exam: exam._id
        })
        .sort({
            groupOrder: 1,
            order: 1
        });


        console.log(
            'QUESTIONS:',
            questions
        );


questions.forEach(question => {

    if (
        question.type === 'correction' &&
        question.underlinedText
    ) {

        const text =
            String(question.questionText);

        const word =
            String(question.underlinedText);

        const index =
            text.indexOf(word);

        if (index !== -1) {

            question.displayQuestion =
                text.substring(0, index) +
                '<u>' +
                word +
                '</u>' +
                text.substring(
                    index + word.length
                );

        } else {

            question.displayQuestion =
                text;

        }

    } else {

        question.displayQuestion =
            question.questionText;

    }

});

        // =========================================
        // عناوين أنواع الأسئلة
        // =========================================

        const typeTitles = {

            'multiple-choice':
                'اختيار من متعدد',

            'true-false':
                'صح أو خطأ',

            'essay':
                'الأسئلة المقالية',

            'correction':
                'صوّب ما تحته خط',

            'scientific-term':
                'اكتب المصطلح العلمي',

            'complete':
                'أكمل الإجابة الصحيحة',

            'drawing':
                'أسئلة الرسم'

        };


        // =========================================
        // تجميع الأسئلة حسب النوع
        // =========================================

        const groupsMap = new Map();


        questions.forEach(question => {


            if (!groupsMap.has(question.type)) {


                groupsMap.set(
                    question.type,
                    {

                        type:
                            question.type,

                        title:
                            typeTitles[question.type]
                            || question.type,

                        groupOrder:
                            question.groupOrder,

                        questions: []

                    }
                );


            }


            groupsMap
                .get(question.type)
                .questions
                .push(question);


        });


        // =========================================
        // تحويل Map إلى Array
        // =========================================

        const questionGroups =
            Array.from(
                groupsMap.values()
            );


        // =========================================
        // ترتيب المجموعات
        // =========================================

        questionGroups.sort(
            (a, b) =>
                a.groupOrder -
                b.groupOrder
        );


        // =========================================
        // إعطاء كل مجموعة رقمًا
        // الـ Helper يحوله إلى:
        // الأول - الثاني - الثالث ...
        // =========================================

        questionGroups.forEach(
            (group, index) => {

                group.groupNumber =
                    index + 1;

            }
        );


        console.log(
            'QUESTION GROUPS:',
            questionGroups
        );


        console.log(
            'Exam:',
            exam
        );


        console.log(
            'Attempt:',
            attempt
        );


        console.log(
            'Started At:',
            attempt.startedAt
        );


        // =========================================
        // إرسال البيانات إلى صفحة الطالب
        // =========================================

        res.render(
            'exam',
            {

                exam: exam,

                questions: questions,

                questionGroups:
                    questionGroups,

                attempt: attempt,

                isSubmitted:
                    attempt.isSubmitted

            }
        );


    }

    catch (err) {

        console.log(err);

        next(err);

    }

});



// راوتر تسليم الامتحان

// ========================================
// توحيد الإجابات العربية قبل المقارنة
// ========================================


function normalizeAnswer(value) {

    return String(value ?? '')
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/[أإآٱ]/g, 'ا')
        .replace(/ى/g, 'ي')
        .replace(/ؤ/g, 'ء')
        .replace(/ئ/g, 'ء')
        .replace(/ؤ/g, 'و')
        .replace(/ئ/g, 'ي')
        .toLowerCase();

}

// ========================================
// تسليم الامتحان
// ========================================

router.post('/exam/submit/:attemptId', async (req, res, next) => {

    try {

        const attempt = await ExamAttempt.findById(req.params.attemptId);

        if (!attempt) {
            return res.status(404).send('محاولة الامتحان غير موجودة');
        }


        if (attempt.isSubmitted) {

            return res.status(400).json({
                success: false,
                message: 'تم تسليم الامتحان بالفعل'
            });

        }


        const answers = req.body;

        const formattedAnswers = [];

        const drawingAnswers = {};


        // ========================================
        // قراءة إجابات الطالب
        // ========================================

        for (const [key, value] of Object.entries(answers)) {


            // =========================
            // إجابة سؤال عادي
            // =========================

            if (key.startsWith('question_')) {

                const questionId =
                    key.replace('question_', '');

                formattedAnswers.push({

                    question: questionId,

                    answer: {

                        text: value,

                        drawing: ''

                    },

                    marks: 0,

                    graded: false

                });

                continue;

            }


            // =========================
            // إجابة نصية لسؤال الرسم
            // =========================

            if (key.startsWith('drawingText_')) {

                const questionId =
                    key.replace('drawingText_', '');


                if (!drawingAnswers[questionId]) {

                    drawingAnswers[questionId] = {

                        text: '',
                        drawing: ''

                    };

                }


                drawingAnswers[questionId].text = value;

                continue;

            }


            // =========================
            // إجابة رسم لسؤال الرسم
            // =========================

            if (key.startsWith('drawing_')) {

                const questionId =
                    key.replace('drawing_', '');


                if (!drawingAnswers[questionId]) {

                    drawingAnswers[questionId] = {

                        text: '',
                        drawing: ''

                    };

                }


                if (value) {

                    drawingAnswers[questionId].drawing =
                        await saveStudentDrawing(value);

                }

            }

        }


        // ========================================
        // إضافة إجابات أسئلة الرسم
        // كإجابة واحدة لكل سؤال
        // ========================================

        for (const questionId in drawingAnswers) {

            formattedAnswers.push({

                question: questionId,

                answer: drawingAnswers[questionId],

                marks: 0,

                graded: false

            });

        }


        // ========================================
        // جلب أسئلة الامتحان
        // ========================================

        const questions = await Question.find({
            exam: attempt.exam
        });


        // ========================================
        // هل يوجد تصحيح يدوي؟
        // ========================================

        const needsManualCorrection = questions.some(question =>
            question.type === 'essay' ||
            question.type === 'drawing'
        );


        let score = 0;


        // ========================================
        // التصحيح التلقائي
        // ========================================

        for (const item of formattedAnswers) {

            const question = questions.find(q =>
                q._id.toString() === item.question
            );


            if (!question) {
                continue;
            }


            // ========================================
            // الأسئلة التي يتم تصحيحها تلقائيًا
            // ========================================

            if (
                question.type === 'multiple-choice' ||
                question.type === 'true-false' ||
                question.type === 'correction' ||
                question.type === 'scientific-term' ||
                question.type === 'complete'
            ) {

                item.graded = true;


                // ========================================
                // توحيد إجابة الطالب
                // ========================================

                const studentAnswer =
                    normalizeAnswer(item.answer.text);


                // ========================================
                // توحيد الإجابة الصحيحة
                // ========================================

                const correctAnswer =
                    normalizeAnswer(question.correctAnswer);


                // ========================================
                // المقارنة بعد التوحيد
                // ========================================

                if (
                    correctAnswer !== '' &&
                    studentAnswer === correctAnswer
                ) {

                    score += question.marks;

                    item.marks = question.marks;

                }

            }

        }


        // ========================================
        // حفظ النتيجة
        // ========================================

        attempt.answers = formattedAnswers;

        attempt.score = score;


        attempt.status = needsManualCorrection
            ? 'pending'
            : 'completed';


        attempt.isSubmitted = true;


        await attempt.save();


        console.log('Attempt After Save:', attempt);

        console.log('Exam Submitted');

        console.log('Attempt:', attempt);


        res.json({

            success: true,

            message: 'تم تسليم الامتحان بنجاح',

            attemptId: attempt._id

        });


    }
    catch(err) {

        console.log(err);

        next(err);

    }

});


// راوتر نتيجة الامتحان 

router.get('/exam/result/:attemptId', async (req, res, next) => {

    try {

        const attempt = await ExamAttempt.findById(
            req.params.attemptId
        )
        .populate('exam');


        if (!attempt) {

            return res.status(404).send(
                'نتيجة الامتحان غير موجودة'
            );

        }


        // =====================================
        // جلب أسئلة الامتحان
        // =====================================

        const questions = await Question.find({
            exam: attempt.exam._id
        })
        .sort({
            groupOrder: 1,
            order: 1
        });


        // =====================================
        // حساب عدد الإجابات الصحيحة والخاطئة
        // =====================================

        let correctCount = 0;
        let wrongCount = 0;


        for (const item of attempt.answers) {

            const question = questions.find(q =>
                q._id.toString() ===
                item.question.toString()
            );


            if (!question) {
                continue;
            }


            // =====================================
            // الأسئلة التي يتم تصحيحها تلقائيًا
            // =====================================

            if (
                question.type === 'multiple-choice' ||
                question.type === 'true-false' ||
                question.type === 'correction' ||
                question.type === 'scientific-term' ||
                question.type === 'complete'
            ) {

                const studentAnswer =
                    normalizeAnswer(
                        item.answer.text
                    );


                const correctAnswer =
                    normalizeAnswer(
                        question.correctAnswer
                    );


                if (
                    correctAnswer !== '' &&
                    studentAnswer === correctAnswer
                ) {

                    correctCount++;

                } else {

                    wrongCount++;

                }

            }

        }


        // =====================================
        // حساب النسبة المئوية
        // =====================================

        const percentage =
            attempt.exam.totalMarks > 0

                ? Math.round(
                    (
                        attempt.score /
                        attempt.exam.totalMarks
                    ) * 100
                )

                : 0;


        // =====================================
        // تحديد حالة الطالب
        // =====================================

        const passed =
            attempt.status === 'completed' &&
            percentage >= 50;


        // =====================================
        // تجهيز تفاصيل كل سؤال
        // =====================================

        const questionResults =
            questions.map(question => {


                const studentAnswer =
                    attempt.answers.find(item =>
                        item.question.toString() ===
                        question._id.toString()
                    );


                let status = 'pending';


                // =====================================
                // الأسئلة التي يتم تصحيحها تلقائيًا
                // =====================================

                if (
                    question.type === 'multiple-choice' ||
                    question.type === 'true-false' ||
                    question.type === 'correction' ||
                    question.type === 'scientific-term' ||
                    question.type === 'complete'
                ) {


                    if (studentAnswer) {

                        const studentText =
                            normalizeAnswer(
                                studentAnswer.answer.text
                            );


                        const correctText =
                            normalizeAnswer(
                                question.correctAnswer
                            );


                        if (
                            correctText !== '' &&
                            studentText === correctText
                        ) {

                            status = 'correct';

                        } else {

                            status = 'wrong';

                        }

                    } else {

                        status = 'wrong';

                    }

                }


                // =====================================
                // المقالي والرسم
                // =====================================

                if (
                    question.type === 'essay' ||
                    question.type === 'drawing'
                ) {

                    if (
                        studentAnswer &&
                        studentAnswer.graded
                    ) {

                        status = 'completed';

                    } else {

                        status = 'pending';

                    }

                }


                return {

                    question: question,

                    studentAnswer:
                        studentAnswer
                            ? studentAnswer.answer
                            : '',

                    marks:
                        studentAnswer
                            ? studentAnswer.marks
                            : 0,

                    status: status

                };

            });


        // =====================================
        // عناوين أنواع الأسئلة
        // =====================================

        const typeTitles = {

            'multiple-choice':
                'اختيار من متعدد',

            'true-false':
                'صح أو خطأ',

            'essay':
                'الأسئلة المقالية',

            'drawing':
                'أسئلة الرسم',

            'correction':
                'صوّب ما تحته خط',

            'scientific-term':
                'اكتب المصطلح العلمي',

            'complete':
                'أكمل الإجابة الصحيحة'

        };


        // =====================================
        // تكوين مجموعات الأسئلة
        // بنفس ترتيب ظهورها في الامتحان
        // =====================================

        const groupsMap = new Map();


        questionResults.forEach(item => {

            const question = item.question;


            if (!groupsMap.has(question.type)) {

                groupsMap.set(
                    question.type,
                    {

                        type:
                            question.type,

                        title:
                            typeTitles[question.type] ||
                            question.type,

                        groupOrder:
                            question.groupOrder,

                        questions: []

                    }
                );

            }


            groupsMap
                .get(question.type)
                .questions
                .push(item);

        });


        // =====================================
        // تحويل Map إلى Array
        // =====================================

        const questionGroups =
            Array.from(
                groupsMap.values()
            );


        // =====================================
        // ترتيب المجموعات
        // =====================================

        questionGroups.sort(
            (a, b) =>
                a.groupOrder -
                b.groupOrder
        );


        // =====================================
        // إعطاء كل مجموعة رقمًا
        // 1 - 2 - 3 ...
        // والـ Helper يحولها إلى:
        // الأول - الثاني - الثالث ...
        // =====================================

        questionGroups.forEach(
            (group, index) => {

                group.groupNumber =
                    index + 1;

            }
        );


        // =====================================
        // عرض صفحة النتيجة
        // =====================================

        res.render('result', {

            attempt:
                attempt,

            correctCount:
                correctCount,

            wrongCount:
                wrongCount,

            percentage:
                percentage,

            passed:
                passed,

            questionResults:
                questionResults,

            questionGroups:
                questionGroups

        });


    }
    catch (err) {

        console.log(err);

        next(err);

    }

});

// راوتر عرض محاولات الطالب لتصحيح المدرس

router.get('/exam/attempts/:examId', async (req, res, next) => {

    try {

        const attempts = await ExamAttempt.find({
            exam: req.params.examId
        })
        .populate('exam')
        .sort({ createdAt: -1 });


        res.render('attempts', {

            attempts: attempts

        });


    } catch (err) {

        console.log(err);

        next(err);

    }

});

// راوتر التصحيح الخاص بالمدرس

router.get('/exam/correct/:attemptId', async (req, res, next) => {

    try {

        // =====================================
        // جلب محاولة الطالب
        // =====================================

        const attempt = await ExamAttempt.findById(
            req.params.attemptId
        )
        .populate('exam');


        if (!attempt) {

            return res.status(404).send(
                'محاولة الامتحان غير موجودة'
            );

        }


        // =====================================
        // جلب أسئلة الامتحان
        // حسب ترتيب المجموعات ثم ترتيب السؤال
        // =====================================

        const questions = await Question.find({
            exam: attempt.exam._id
        })
        .sort({
            groupOrder: 1,
            order: 1
        });


        // =====================================
        // تجهيز نتائج الأسئلة
        // =====================================

        const questionResults =
            questions.map(question => {


                const studentAnswer =
                    attempt.answers.find(item =>
                        item.question.toString() ===
                        question._id.toString()
                    );


                return {

                    question: question,

                    studentAnswer:
                        studentAnswer
                            ? studentAnswer.answer
                            : '',

                    currentMarks:
                        studentAnswer
                            ? studentAnswer.marks
                            : 0

                };

            });


        // =====================================
        // عناوين أنواع الأسئلة
        // =====================================

        const typeTitles = {

            'multiple-choice':
                'اختيار من متعدد',

            'true-false':
                'صح أو خطأ',

            'essay':
                'الأسئلة المقالية',

            'drawing':
                'أسئلة الرسم',

            'correction':
                'صوّب ما تحته خط',

            'scientific-term':
                'اكتب المصطلح العلمي',

            'complete':
                'أكمل الإجابة الصحيحة'

        };


        // =====================================
        // تكوين مجموعات الأسئلة
        // =====================================

        const groupsMap = new Map();


        questionResults.forEach(item => {

            const question = item.question;


            if (!groupsMap.has(question.type)) {

                groupsMap.set(
                    question.type,
                    {

                        type:
                            question.type,

                        title:
                            typeTitles[question.type] ||
                            question.type,

                        groupOrder:
                            question.groupOrder,

                        questions: []

                    }
                );

            }


            groupsMap
                .get(question.type)
                .questions
                .push(item);

        });


        // =====================================
        // تحويل المجموعات إلى Array
        // =====================================

        const questionGroups =
            Array.from(
                groupsMap.values()
            );


        // =====================================
        // ترتيب المجموعات
        // =====================================

        questionGroups.sort(
            (a, b) =>
                a.groupOrder -
                b.groupOrder
        );


        questionGroups.forEach((group, index) => {

        group.groupNumber = index + 1;

      });


        // =====================================
        // عرض صفحة التصحيح
        // =====================================

        res.render('correct', {

            attempt:
                attempt,

            questionResults:
                questionResults,

            questionGroups:
                questionGroups

        });


    }
    catch (err) {

        console.log(err);

        next(err);

    }

});



router.post('/exam/correct/:attemptId', async (req, res, next) => {

    try {

        // =====================================
        // جلب محاولة الطالب
        // =====================================

        const attempt = await ExamAttempt.findById(
            req.params.attemptId
        )
        .populate('exam');


        if (!attempt) {

            return res.status(404).send(
                'محاولة الامتحان غير موجودة'
            );

        }


        // =====================================
        // جلب أسئلة الامتحان
        // =====================================

        const questions = await Question.find({
            exam: attempt.exam._id
        });


        // =====================================
        // تصحيح الأسئلة اليدوية
        // المقالي والرسم فقط
        // =====================================

        for (const item of attempt.answers) {


            const question = questions.find(q =>
                q._id.toString() ===
                item.question.toString()
            );


            if (!question) {
                continue;
            }


            // =====================================
            // المقالي والرسم
            // =====================================

            if (
                question.type === 'essay' ||
                question.type === 'drawing'
            ) {


                const fieldName =
                    `marks_${question._id}`;


                const enteredMarks =
                    Number(
                        req.body[fieldName]
                    );


                // =================================
                // التأكد أن الدرجة رقم
                // =================================

                if (!isNaN(enteredMarks)) {


                    // =============================
                    // التأكد من حدود الدرجة
                    // =============================

                    if (
                        enteredMarks >= 0 &&
                        enteredMarks <= question.marks
                    ) {

                        item.marks =
                            enteredMarks;

                        item.graded =
                            true;

                    }

                }

            }

        }


        // =====================================
        // إعادة حساب الدرجة النهائية
        // =====================================

        let score = 0;


        for (const item of attempt.answers) {

            score += item.marks || 0;

        }


        attempt.score = score;


        // =====================================
        // معرفة هل يوجد سؤال يحتاج تصحيح
        // =====================================

        const hasUncorrectedQuestion =
            attempt.answers.some(item => {


                const question =
                    questions.find(q =>
                        q._id.toString() ===
                        item.question.toString()
                    );


                if (!question) {
                    return false;
                }


                // =============================
                // المقالي والرسم فقط
                // =============================

                if (
                    question.type === 'essay' ||
                    question.type === 'drawing'
                ) {

                    return !item.graded;

                }


                return false;

            });


        // =====================================
        // تحديد حالة الامتحان
        // =====================================

        attempt.status =
            hasUncorrectedQuestion
                ? 'pending'
                : 'completed';


        // =====================================
        // حفظ التعديلات
        // =====================================

        await attempt.save();


        // =====================================
        // العودة إلى صفحة النتيجة
        // =====================================

        res.redirect(
            `/exam/result/${attempt._id}`
        );


    }
    catch (err) {

        console.log(err);

        next(err);

    }

});


//  راوتر تسجيل خروج

router.get('/logout-exam-system', (req, res, next)=>{

  req.session.destroy(err =>{

    if(err){
    console.log(err);
    next(err)
  }
  })
    return res.redirect('/login-exam-system');

  
})


module.exports = router;
