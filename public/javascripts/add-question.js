document.addEventListener('DOMContentLoaded', function () {

    const questionType =
        document.getElementById('questionType');

    const multipleChoiceSection =
        document.getElementById('multipleChoiceSection');

    const trueFalseSection =
        document.getElementById('trueFalseSection');

    const essaySection =
        document.getElementById('essaySection');

    const textQuestionSection =
        document.getElementById('textQuestionSection');

    const textCorrectAnswer =
        document.getElementById('textCorrectAnswer');

    const drawingSection =
        document.getElementById('drawingSection');


    // =========================
    // تغيير نوع السؤال
    // =========================

    function updateQuestionType() {

        if (!questionType) return;

        multipleChoiceSection.style.display = 'none';
        trueFalseSection.style.display = 'none';
        essaySection.style.display = 'none';
        drawingSection.style.display = 'none';
        textQuestionSection.style.display = 'none';


        if (textCorrectAnswer) {
            textCorrectAnswer.disabled = true;
        }


        if (questionType.value === 'multiple-choice') {

            multipleChoiceSection.style.display = 'block';

        }

        else if (questionType.value === 'true-false') {

            trueFalseSection.style.display = 'block';

        }

        else if (questionType.value === 'essay') {

            essaySection.style.display = 'block';

        }

        else if (questionType.value === 'drawing') {

            drawingSection.style.display = 'block';

        }

        else if (
            questionType.value === 'correction' ||
            questionType.value === 'scientific-term' ||
            questionType.value === 'complete'
        ) {

            textQuestionSection.style.display = 'block';

            if (textCorrectAnswer) {
                textCorrectAnswer.disabled = false;
            }

        }

    }


    if (questionType) {

        questionType.addEventListener(
            'change',
            updateQuestionType
        );

        updateQuestionType();

    }


    // =========================
    // Canvas الرسم
    // =========================

    const drawingCanvas =
        document.getElementById('drawingCanvas');

    const drawingImage =
        document.getElementById('drawingImage');

    const clearDrawing =
        document.getElementById('clearDrawing');

    const penTool =
        document.getElementById('penTool');

    const eraserTool =
        document.getElementById('eraserTool');

    const eraserSize =
        document.getElementById('eraserSize');

    const questionForm =
        document.getElementById('questionForm');


    let ctx;
    let isDrawing = false;
    let isErasing = false;


    // الصورة القديمة المحفوظة للسؤال
    const existingDrawingImage =
        questionForm
            ? questionForm.dataset.drawingImage
            : '';


    if (drawingCanvas) {

        ctx =
            drawingCanvas.getContext('2d');


        // =========================
        // تحميل الصورة القديمة
        // عند تعديل سؤال الرسم
        // =========================

        if (existingDrawingImage) {

            const image =
                new Image();

            image.onload = function () {

                ctx.clearRect(
                    0,
                    0,
                    drawingCanvas.width,
                    drawingCanvas.height
                );

                ctx.fillStyle = '#ffffff';

                ctx.fillRect(
                    0,
                    0,
                    drawingCanvas.width,
                    drawingCanvas.height
                );


                const canvasRatio =
                    drawingCanvas.width /
                    drawingCanvas.height;

                const imageRatio =
                    image.width /
                    image.height;


                let width;
                let height;
                let x;
                let y;


                if (imageRatio > canvasRatio) {

                    width =
                        drawingCanvas.width;

                    height =
                        width / imageRatio;

                    x = 0;

                    y =
                        (
                            drawingCanvas.height -
                            height
                        ) / 2;

                }

                else {

                    height =
                        drawingCanvas.height;

                    width =
                        height * imageRatio;

                    x =
                        (
                            drawingCanvas.width -
                            width
                        ) / 2;

                    y = 0;

                }


                ctx.drawImage(
                    image,
                    x,
                    y,
                    width,
                    height
                );

            };


            image.src =
                existingDrawingImage;

        }


        // خلفية بيضاء

        ctx.fillStyle = '#ffffff';

        ctx.fillRect(
            0,
            0,
            drawingCanvas.width,
            drawingCanvas.height
        );


        // إعداد القلم

        ctx.lineWidth = 3;

        ctx.lineCap = 'round';

        ctx.lineJoin = 'round';

        ctx.strokeStyle = '#000000';


        // =========================
        // معرفة مكان المؤشر
        // =========================

        function getPosition(event) {

            const rect =
                drawingCanvas.getBoundingClientRect();


            let clientX;
            let clientY;


            if (event.touches) {

                clientX =
                    event.touches[0].clientX;

                clientY =
                    event.touches[0].clientY;

            }

            else {

                clientX =
                    event.clientX;

                clientY =
                    event.clientY;

            }


            const scaleX =
                drawingCanvas.width /
                rect.width;

            const scaleY =
                drawingCanvas.height /
                rect.height;


            return {

                x:
                    (clientX - rect.left) *
                    scaleX,

                y:
                    (clientY - rect.top) *
                    scaleY

            };

        }


        // =========================
        // بداية الرسم
        // =========================

        function startDrawing(event) {

            event.preventDefault();

            isDrawing = true;


            const position =
                getPosition(event);


            ctx.beginPath();

            ctx.moveTo(
                position.x,
                position.y
            );

        }


        // =========================
        // الرسم
        // =========================

        function draw(event) {

            if (!isDrawing) return;

            event.preventDefault();


            const position =
                getPosition(event);


            if (isErasing) {

                ctx.globalCompositeOperation =
                    'destination-out';

                ctx.lineWidth =
                    Number(
                        eraserSize.value
                    );

            }

            else {

                ctx.globalCompositeOperation =
                    'source-over';

                ctx.lineWidth = 3;

            }


            ctx.lineTo(
                position.x,
                position.y
            );

            ctx.stroke();

        }


        // =========================
        // نهاية الرسم
        // =========================

        function stopDrawing(event) {

            if (event) {
                event.preventDefault();
            }

            isDrawing = false;

            ctx.closePath();

        }


        // =========================
        // Mouse
        // =========================

        drawingCanvas.addEventListener(
            'mousedown',
            startDrawing
        );

        drawingCanvas.addEventListener(
            'mousemove',
            draw
        );

        drawingCanvas.addEventListener(
            'mouseup',
            stopDrawing
        );

        drawingCanvas.addEventListener(
            'mouseleave',
            stopDrawing
        );


        // =========================
        // Touch
        // =========================

        drawingCanvas.addEventListener(
            'touchstart',
            startDrawing,
            { passive: false }
        );

        drawingCanvas.addEventListener(
            'touchmove',
            draw,
            { passive: false }
        );

        drawingCanvas.addEventListener(
            'touchend',
            stopDrawing,
            { passive: false }
        );


        // =========================
        // قلم
        // =========================

        if (penTool) {

            penTool.addEventListener(
                'click',
                function () {

                    isErasing = false;

                    ctx.globalCompositeOperation =
                        'source-over';

                    ctx.lineWidth = 3;

                }
            );

        }


        // =========================
        // ممحاة
        // =========================

        if (eraserTool) {

            eraserTool.addEventListener(
                'click',
                function () {

                    isErasing = true;

                    ctx.globalCompositeOperation =
                        'destination-out';

                }
            );

        }


        // =========================
        // رفع صورة
        // =========================

        if (drawingImage) {

            drawingImage.addEventListener(
                'change',
                function () {

                    const file =
                        this.files[0];


                    if (!file) {
                        return;
                    }


                    if (!file.type.startsWith('image/')) {

                        alert(
                            'من فضلك اختاري ملف صورة'
                        );

                        this.value = '';

                        return;

                    }


                    const reader =
                        new FileReader();


                    reader.onload =
                        function (event) {

                            const image =
                                new Image();


                            image.onload =
                                function () {

                                    ctx.clearRect(
                                        0,
                                        0,
                                        drawingCanvas.width,
                                        drawingCanvas.height
                                    );


                                    ctx.fillStyle =
                                        '#ffffff';


                                    ctx.fillRect(
                                        0,
                                        0,
                                        drawingCanvas.width,
                                        drawingCanvas.height
                                    );


                                    const canvasRatio =
                                        drawingCanvas.width /
                                        drawingCanvas.height;

                                    const imageRatio =
                                        image.width /
                                        image.height;


                                    let width;
                                    let height;
                                    let x;
                                    let y;


                                    if (
                                        imageRatio >
                                        canvasRatio
                                    ) {

                                        width =
                                            drawingCanvas.width;

                                        height =
                                            width /
                                            imageRatio;

                                        x = 0;

                                        y =
                                            (
                                                drawingCanvas.height -
                                                height
                                            ) / 2;

                                    }

                                    else {

                                        height =
                                            drawingCanvas.height;

                                        width =
                                            height *
                                            imageRatio;

                                        x =
                                            (
                                                drawingCanvas.width -
                                                width
                                            ) / 2;

                                        y = 0;

                                    }


                                    ctx.drawImage(
                                        image,
                                        x,
                                        y,
                                        width,
                                        height
                                    );

                                };


                            image.src =
                                event.target.result;

                        };


                    reader.readAsDataURL(file);

                }
            );

        }


        // =========================
        // مسح الرسم
        // =========================

        if (clearDrawing) {

            clearDrawing.addEventListener(
                'click',
                function () {

                    ctx.clearRect(
                        0,
                        0,
                        drawingCanvas.width,
                        drawingCanvas.height
                    );


                    ctx.fillStyle =
                        '#ffffff';


                    ctx.fillRect(
                        0,
                        0,
                        drawingCanvas.width,
                        drawingCanvas.height
                    );

                }
            );

        }

    }


    // =========================
    // إضافة / تعديل السؤال
    // =========================

    if (questionForm) {

        questionForm.addEventListener(
            'submit',
            async function (e) {

                e.preventDefault();


                const questionId =
                    questionForm.dataset.questionId;


                const examId =
                    questionForm.action
                        .split('/')
                        .pop();


                const formData =
                    new FormData(questionForm);


                let correctAnswer = '';


                const type =
                    formData.get('type');


                // =========================
                // اختيار من متعدد
                // =========================

                if (type === 'multiple-choice') {

                    const checkedAnswer =
                        questionForm.querySelector(
                            '#multipleChoiceSection input[name="correctAnswer"]:checked'
                        );


                    if (checkedAnswer) {

                        const index =
                            Number(
                                checkedAnswer.dataset.optionIndex
                            );


                        const options =
                            formData.getAll('options');


                        correctAnswer =
                            options[index] || '';

                    }

                }


                // =========================
                // صح وخطأ
                // =========================

                else if (type === 'true-false') {

                    const checkedAnswer =
                        questionForm.querySelector(
                            '#trueFalseSection input[name="correctAnswer"]:checked'
                        );


                    if (checkedAnswer) {

                        correctAnswer =
                            checkedAnswer.value || '';

                    }

                }


                // =========================
                // صوّب ما تحته خط
                // اكتب المصطلح العلمي
                // أكمل الإجابة الصحيحة
                // =========================

                else if (
                    type === 'correction' ||
                    type === 'scientific-term' ||
                    type === 'complete'
                ) {

                    // مهم جدًا:
                    // لا نستخدم formData.get('correctAnswer')
                    // لأن عندنا Radio Buttons بنفس الاسم
                    // وقيمتها الافتراضية ممكن تكون "on".

                    if (textCorrectAnswer) {

                        correctAnswer =
                            textCorrectAnswer.value.trim();

                    }

                }


                // =========================
                // بيانات السؤال
                // =========================

    const data = {

    questionText:
        formData.get('questionText'),

    type:
        type,

    marks:
        formData.get('marks'),

    options:
        formData.getAll('options'),

    correctAnswer:
        correctAnswer,

    modelAnswer:
        formData.get('modelAnswer'),

    answerMode:
        formData.get('answerMode'),

    underlinedText:
        formData.get('underlinedText')

};

                // =========================
                // الرسم
                // =========================

                if (
                    type === 'drawing' &&
                    drawingCanvas
                ) {

                    const canvasContext =
                        drawingCanvas.getContext('2d');


                    const imageData =
                        canvasContext.getImageData(
                            0,
                            0,
                            drawingCanvas.width,
                            drawingCanvas.height
                        );


                    let hasDrawing = false;


                    // فحص الـCanvas
                    // هل يوجد أي بكسل ليس أبيض؟

                    for (
                        let i = 0;
                        i < imageData.data.length;
                        i += 4
                    ) {

                        const red =
                            imageData.data[i];

                        const green =
                            imageData.data[i + 1];

                        const blue =
                            imageData.data[i + 2];

                        const alpha =
                            imageData.data[i + 3];


                        if (
                            alpha !== 0 &&
                            (
                                red !== 255 ||
                                green !== 255 ||
                                blue !== 255
                            )
                        ) {

                            hasDrawing = true;

                            break;

                        }

                    }


                    // لو المدرس رسم فعلًا

                    if (hasDrawing) {

                        data.drawingData =
                            drawingCanvas.toDataURL(
                                'image/png'
                            );

                    }

                }


                console.log(
                    'Question Data:',
                    data
                );


                try {


                    // =========================
                    // تعديل السؤال
                    // =========================

                    if (questionId) {

                        const response =
                            await fetch(
                                `/question/edit/${questionId}`,
                                {

                                    method: 'PUT',

                                    headers: {

                                        'Content-Type':
                                            'application/json'

                                    },

                                    body:
                                        JSON.stringify(data)

                                }
                            );


                        const result =
                            await response.json();


                        console.log(
                            'Update Result:',
                            result
                        );


                        if (result.success) {

                            alert(
                                'تم تعديل السؤال بنجاح'
                            );


                            window.location.href =
                                `/questions/${examId}`;

                        }

                        else {

                            alert(
                                result.message ||
                                'حدث خطأ أثناء تعديل السؤال'
                            );

                        }

                    }


                    // =========================
                    // إضافة سؤال جديد
                    // =========================

                    else {

                        const response =
                            await fetch(
                                `/questions/add/${examId}`,
                                {

                                    method: 'POST',

                                    headers: {

                                        'Content-Type':
                                            'application/json'

                                    },

                                    body:
                                        JSON.stringify(data)

                                }
                            );


                        console.log(
                            'Add Question Response:',
                            response
                        );


                        if (response.redirected) {

                            window.location.href =
                                response.url;

                        }

                        else {

                            const result =
                                await response.json()
                                    .catch(() => null);


                            if (
                                result &&
                                result.success === false
                            ) {

                                alert(
                                    result.message ||
                                    'حدث خطأ أثناء إضافة السؤال'
                                );

                                return;

                            }


                            alert(
                                'تم إضافة السؤال بنجاح'
                            );


                            window.location.href =
                                `/questions/${examId}`;

                        }

                    }

                }

                catch (error) {

                    console.error(
                        'Save Error:',
                        error
                    );


                    alert(
                        'حدث خطأ أثناء الاتصال بالسيرفر'
                    );

                }

            }
        );

    }


    // =========================
    // حذف السؤال
    // =========================

    const deleteButtons =
        document.querySelectorAll(
            '.delete-question'
        );


    deleteButtons.forEach(function (button) {

        button.addEventListener(
            'click',
            async function () {

                const questionId =
                    button.dataset.questionId;


                console.log(
                    'Question To Delete:',
                    questionId
                );


                try {

                    const response =
                        await fetch(
                            `/question/delete/${questionId}`,
                            {
                                method: 'DELETE'
                            }
                        );


                    const result =
                        await response.json();


                    console.log(
                        'Delete Result:',
                        result
                    );


                    if (result.success) {

                        alert(
                            'تم حذف السؤال بنجاح'
                        );

                        window.location.reload();

                    }

                }

                catch (error) {

                    console.error(
                        'Delete Error:',
                        error
                    );

                }

            }
        );

    });

});