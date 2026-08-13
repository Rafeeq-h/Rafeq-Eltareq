// ==========================================
// تفعيل التمرير السلس
// ==========================================

document.querySelectorAll('nav a').forEach(anchor => {

    anchor.addEventListener('click', function (e) {

        const targetId = this.getAttribute('href');

        if (targetId.startsWith('#')) {

            e.preventDefault();

            const targetElement =
                document.getElementById(targetId.substring(1));

            if (targetElement) {

                window.scrollTo({
                    top: targetElement.offsetTop - 60,
                    behavior: 'smooth'
                });

            }
        }
    });
});


// ==========================================
// تشغيل PDF بواسطة PDF.js
// ==========================================

pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';


let pdfDoc = null;
let pageNum = 1;
let pageIsRendering = false;
let pageNumIsPending = null;


// ==========================================
// تجهيز Canvas
// ==========================================

const canvas = document.getElementById('pdf-render');
const ctx = canvas.getContext('2d');


// ==========================================
// حساب حجم PDF تلقائياً
// ==========================================

function getPDFScale(page) {

    const container =
        document.querySelector('.canvas-container');

    if (!container) {
        return 1;
    }

    // المساحة المتاحة لعرض الـ PDF
    const availableWidth =
        container.clientWidth - 4;

    // الحجم الطبيعي للصفحة
    const baseViewport =
        page.getViewport({
            scale: 1
        });

    // حساب الـ Scale تلقائياً
    const scale =
        availableWidth / baseViewport.width;

    // منع الـ Scale من أن يكون صغير جداً
    return Math.max(scale, 0.1);
}


// ==========================================
// رسم الصفحة
// ==========================================

function renderPage(num) {

    if (!pdfDoc) return;

    pageIsRendering = true;

    pdfDoc.getPage(num).then(page => {

        // حساب الحجم المناسب للنافذة
        const scale = getPDFScale(page);

        const viewport =
            page.getViewport({
                scale: scale
            });

        // تحديد حجم الـ Canvas الحقيقي
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // جعل الـ Canvas متجاوباً
        canvas.style.width = "100%";
        canvas.style.height = "auto";

        const renderCtx = {
            canvasContext: ctx,
            viewport: viewport
        };

        // رسم الصفحة
        page.render(renderCtx).promise.then(() => {

            pageIsRendering = false;

            // لو فيه صفحة مستنية الرسم
            if (pageNumIsPending !== null) {

                renderPage(pageNumIsPending);

                pageNumIsPending = null;
            }

        }).catch(error => {

            console.error(
                "خطأ أثناء رسم الصفحة:",
                error
            );

            pageIsRendering = false;

        });

        // تحديث رقم الصفحة
        document.getElementById('page-num').textContent =
            num;

    }).catch(error => {

        console.error(
            "خطأ أثناء الحصول على الصفحة:",
            error
        );

        pageIsRendering = false;

    });
}


// ==========================================
// انتظار رسم الصفحة
// ==========================================

function queueRenderPage(num) {

    if (pageIsRendering) {

        pageNumIsPending = num;

    } else {

        renderPage(num);

    }
}


// ==========================================
// الصفحة السابقة
// ==========================================

document.getElementById('prev-page').addEventListener(
    'click',
    () => {

        if (!pdfDoc) return;

        if (pageNum <= 1) return;

        pageNum--;

        queueRenderPage(pageNum);

    }
);


// ==========================================
// الصفحة التالية
// ==========================================

document.getElementById('next-page').addEventListener(
    'click',
    () => {

        if (!pdfDoc) return;

        if (pageNum >= pdfDoc.numPages) return;

        pageNum++;

        queueRenderPage(pageNum);

    }
);


// ==========================================
// فتح PDF داخل النافذة الأساسية
// ==========================================

function openPDF(pdfPath) {

    const modal =
        document.getElementById('pdfModal');

    // إظهار النافذة
    modal.style.display = 'block';

    // إعادة الصفحة إلى الأولى
    pageNum = 1;

    // تصفير حالة الرسم
    pageIsRendering = false;
    pageNumIsPending = null;

    // تنظيف الـ Canvas
    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    // إظهار حالة التحميل
    document.getElementById('page-num').textContent =
        '...';

    document.getElementById('page-count').textContent =
        '...';

    // تحميل ملف PDF
    pdfjsLib.getDocument(pdfPath).promise

        .then(pdf => {

            pdfDoc = pdf;

            // عدد صفحات الـ PDF
            document.getElementById(
                'page-count'
            ).textContent =
                pdfDoc.numPages;

            // رسم الصفحة الأولى
            renderPage(pageNum);

        })

        .catch(error => {

            console.error(
                "خطأ في تحميل الملف:",
                error
            );

            alert(
                "عذراً، حدث خطأ أثناء تحميل الملف. تأكد من صحة مسار الملف."
            );

            closePDF();

        });
}


// ==========================================
// إغلاق نافذة PDF
// ==========================================

function closePDF() {

    const modal =
        document.getElementById('pdfModal');

    // إخفاء النافذة
    modal.style.display = 'none';

    // تنظيف الـ Canvas
    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    // إعادة القيم
    pdfDoc = null;
    pageNum = 1;
    pageIsRendering = false;
    pageNumIsPending = null;

    document.getElementById('page-num').textContent =
        '';

    document.getElementById('page-count').textContent =
        '';

}


// ==========================================
// إغلاق PDF عند الضغط خارج النافذة
// ==========================================

window.addEventListener('click', (event) => {

    const modal =
        document.getElementById('pdfModal');

    if (event.target === modal) {

        closePDF();

    }

});


// ==========================================
// إغلاق PDF بزر ESC
// ==========================================

window.addEventListener('keydown', (event) => {

    if (event.key === 'Escape') {

        const modal =
            document.getElementById('pdfModal');

        if (modal.style.display === 'block') {

            closePDF();

        }

    }

});


// ==========================================
// إعادة ضبط حجم PDF عند تغيير حجم الشاشة
// ==========================================

let resizeTimeout;

window.addEventListener('resize', () => {

    // لو مفيش PDF مفتوح
    if (!pdfDoc) return;

    clearTimeout(resizeTimeout);

    resizeTimeout = setTimeout(() => {

        // إعادة رسم الصفحة بالحجم الجديد
        if (!pageIsRendering) {

            renderPage(pageNum);

        }

    }, 200);

});