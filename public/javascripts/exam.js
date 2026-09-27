

document.addEventListener('DOMContentLoaded', function () {

    console.log('exam.js loaded');
    const examForm = document.getElementById('examForm');
    const submitExamBtn = document.getElementById('submitExamBtn');

    const examTimer = document.getElementById('examTimer');

    const drawingCanvases =
    document.querySelectorAll('[id^="studentDrawingCanvas_"]');


    // =========================
    // Timer
    // =========================

    if (examTimer) {

        const duration = Number(examTimer.dataset.duration);

        const startedAt = new Date(
            examTimer.dataset.startedAt
        );

        const endTime =
            startedAt.getTime() + (duration * 60 * 1000);


        function updateTimer() {

            const now = Date.now();

            let remainingMilliseconds =
                endTime - now;


            if (remainingMilliseconds <= 0) {

                clearInterval(timer);

                examTimer.textContent = '00:00';

                alert('انتهى وقت الامتحان');

                return;
            }


            const remainingSeconds =
                Math.floor(remainingMilliseconds / 1000);


            const minutes =
                Math.floor(remainingSeconds / 60);


            const seconds =
                remainingSeconds % 60;


            examTimer.textContent =
                `${minutes}:${seconds.toString().padStart(2, '0')}`;

        }


        const timer = setInterval(updateTimer, 1000);

        updateTimer();

    }


    // =========================
// Canvas أسئلة الرسم
// =========================

drawingCanvases.forEach(function (canvas) {

    const questionId =
        canvas.dataset.questionId;

    const ctx =
        canvas.getContext('2d');


        const penTool =
    document.querySelector(
        `[data-pen-tool="${questionId}"]`
    );

const eraserTool =
    document.querySelector(
        `[data-eraser-tool="${questionId}"]`
    );

const eraserSize =
    document.querySelector(
        `[data-eraser-size="${questionId}"]`
    );

    let isDrawing = false;
    let isErasing = false;


    // خلفية بيضاء

    ctx.fillStyle = '#ffffff';

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
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
            canvas.getBoundingClientRect();


        let clientX;
        let clientY;


        // Touch

        if (event.touches) {

            clientX =
                event.touches[0].clientX;

            clientY =
                event.touches[0].clientY;

        }

        // Mouse

        else {

            clientX =
                event.clientX;

            clientY =
                event.clientY;

        }


        const scaleX =
            canvas.width / rect.width;

        const scaleY =
            canvas.height / rect.height;


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

        if (!isDrawing) {
            return;
        }


        event.preventDefault();


        const position =
            getPosition(event);


        if (isErasing) {

    ctx.globalCompositeOperation =
        'destination-out';

    ctx.lineWidth =
        Number(eraserSize.value);

} else {

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

    canvas.addEventListener(
        'mousedown',
        startDrawing
    );

    canvas.addEventListener(
        'mousemove',
        draw
    );

    canvas.addEventListener(
        'mouseup',
        stopDrawing
    );

    canvas.addEventListener(
        'mouseleave',
        stopDrawing
    );


    // =========================
    // Touch
    // =========================

    canvas.addEventListener(
        'touchstart',
        startDrawing,
        { passive: false }
    );

    canvas.addEventListener(
        'touchmove',
        draw,
        { passive: false }
    );

    canvas.addEventListener(
        'touchend',
        stopDrawing,
        { passive: false }
    );


    // =========================
// أدوات الرسم
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

    const uploadInput =
        document.querySelector(
            `[data-drawing-upload="${questionId}"]`
        );


    if (uploadInput) {

        uploadInput.addEventListener(
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

                                // مسح الـCanvas

                                ctx.clearRect(
                                    0,
                                    0,
                                    canvas.width,
                                    canvas.height
                                );


                                // خلفية بيضاء

                                ctx.fillStyle =
                                    '#ffffff';

                                ctx.fillRect(
                                    0,
                                    0,
                                    canvas.width,
                                    canvas.height
                                );


                                // تناسب الصورة

                                const canvasRatio =
                                    canvas.width /
                                    canvas.height;

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
                                        canvas.width;

                                    height =
                                        width /
                                        imageRatio;

                                    x = 0;

                                    y =
                                        (
                                            canvas.height -
                                            height
                                        ) / 2;

                                } else {

                                    height =
                                        canvas.height;

                                    width =
                                        height *
                                        imageRatio;

                                    x =
                                        (
                                            canvas.width -
                                            width
                                        ) / 2;

                                    y = 0;

                                }


                                // وضع الصورة على الـCanvas

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

    const clearButton =
        document.querySelector(
            `[data-clear-drawing="${questionId}"]`
        );


    if (clearButton) {

        clearButton.addEventListener(
            'click',
            function () {

                ctx.clearRect(
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );


                ctx.fillStyle =
                    '#ffffff';

                ctx.fillRect(
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );

            }
        );

    }

});


    // =========================
    // تسليم الامتحان
    // =========================

    if (examForm) {

        examForm.addEventListener('submit', async function (e) {

            e.preventDefault();


            const attemptId =
                examForm.dataset.attemptId;


            const formData =
                new FormData(examForm);


          
const answers = {};


// =========================
// الإجابات العادية
// =========================

for (const [key, value] of formData.entries()) {

    // إجابة سؤال عادي
    if (key.startsWith('question_')) {

        answers[key] = value;

    }

}


// =========================
// إجابات أسئلة الرسم
// =========================

const drawingQuestions =
    document.querySelectorAll(
        '[data-answer-mode]'
    );


drawingQuestions.forEach(function (questionElement) {

    const questionId =
        questionElement.dataset.questionId;

    const answerMode =
        questionElement.dataset.answerMode;


    // =========================
    // إجابة نصية
    // =========================

    if (
        answerMode === 'text' ||
        answerMode === 'both'
    ) {

        const textInput =
            questionElement.querySelector(
                `[data-drawing-text="${questionId}"]`
            );


        const drawingText =
            textInput
                ? textInput.value
                : '';


        answers[`drawingText_${questionId}`] =
            drawingText;

    }


    // =========================
    // إجابة بالرسم
    // =========================

    if (
        answerMode === 'drawing' ||
        answerMode === 'both'
    ) {

        const canvas =
            questionElement.querySelector(
                `#studentDrawingCanvas_${questionId}`
            );


        if (canvas) {

            const drawingData =
                canvas.toDataURL('image/png');


            answers[`drawing_${questionId}`] =
                drawingData;

        }

    }

});
  

   


console.log('Attempt ID:', attemptId);

console.log('Answers:', answers);


            const response = await fetch(
                `/exam/submit/${attemptId}`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json'
                    },

                    body: JSON.stringify(answers)
                }
            );


   



const result = await response.json();

console.log('Submit Result:', result);

if (result.success) {

    window.location.href =
        `/exam/result/${result.attemptId}`;

}
else {

    alert(result.message);

}

        });

    }

});