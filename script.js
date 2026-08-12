// تفعيل التمرير السلس (Smooth Scrolling) عند الضغط على روابط القائمة
document.querySelectorAll('nav a').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');

        // التأكد من أن الرابط للتنقل داخل الصفحة
        if (targetId.startsWith('#')) {
            e.preventDefault();
            const targetElement = document.getElementById(targetId.substring(1));

            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 60, // طرح 60 بيكسل بسبب الشريط العلوي الثابت
                    behavior: 'smooth'
                });
            }
        }
    });
});

// ==========================================
// أكواد تشغيل ملفات الـ PDF (بواسطة PDF.js)
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    // ملف PDF.js Worker
    pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

    let pdfDoc = null;
    let pageNum = 1;
    let pageIsRendering = false;
    let pageNumIsPending = null;

    // ضبط حجم الـ PDF حسب الشاشة
    const scale = window.innerWidth < 600 ? 1.2 : 1.5;

    const canvas = document.getElementById("pdf-render");
    const ctx = canvas.getContext("2d");

    // =========================
    // عرض الصفحة
    // =========================

    function renderPage(num) {

        pageIsRendering = true;

        pdfDoc.getPage(num).then(function (page) {

            const viewport = page.getViewport({
                scale: scale
            });

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderCtx = {
                canvasContext: ctx,
                viewport: viewport
            };

            page.render(renderCtx).promise.then(function () {

                pageIsRendering = false;

                if (pageNumIsPending !== null) {
                    renderPage(pageNumIsPending);
                    pageNumIsPending = null;
                }

            });

            document.getElementById("page-num").textContent = num;

        });
    }


    // =========================
    // انتظار انتهاء عرض الصفحة
    // =========================

    function queueRenderPage(num) {

        if (pageIsRendering) {
            pageNumIsPending = num;
        } else {
            renderPage(num);
        }

    }


    // =========================
    // الصفحة السابقة
    // =========================

    document.getElementById("prev-page").addEventListener("click", function () {

        if (!pdfDoc || pageNum <= 1) {
            return;
        }

        pageNum--;

        queueRenderPage(pageNum);

    });


    // =========================
    // الصفحة التالية
    // =========================

    document.getElementById("next-page").addEventListener("click", function () {

        if (!pdfDoc || pageNum >= pdfDoc.numPages) {
            return;
        }

        pageNum++;

        queueRenderPage(pageNum);

    });


    // =========================
    // فتح PDF
    // =========================

    window.openPDF = function (pdfPath) {

        const modal = document.getElementById("pdfModal");

        modal.style.display = "block";

        pageNum = 1;
        pageIsRendering = false;
        pageNumIsPending = null;

        console.log("جاري تحميل PDF:");
        console.log(pdfPath);

        pdfjsLib.getDocument(pdfPath).promise

            .then(function (pdf) {

                pdfDoc = pdf;

                document.getElementById("page-count").textContent =
                    pdfDoc.numPages;

                renderPage(pageNum);

            })

            .catch(function (err) {

                console.error("خطأ في تحميل الملف:", err);

                alert(
                    "حدث خطأ أثناء فتح ملف PDF.\n\n" +
                    "تأكد أن اسم الملف ومساره صحيحان."
                );

            });

    };


    // =========================
    // إغلاق PDF
    // =========================

    window.closePDF = function () {

        const modal = document.getElementById("pdfModal");

        modal.style.display = "none";

        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

    };


    // =========================
    // الضغط خارج النافذة
    // =========================

    window.addEventListener("click", function (event) {

        const modal = document.getElementById("pdfModal");

        if (event.target === modal) {
            closePDF();
        }

    });

});