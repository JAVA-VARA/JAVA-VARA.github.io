// 애니메이션 및 기타 스크립트를 여기에 추가

$(document).ready(function(){
    // Smooth scrolling for links
    $('a[href^="#"]').on('click', function(event) {
        var target = $(this.getAttribute('href'));
        if(target.length) {
            event.preventDefault();
            $('html, body').stop().animate({
                scrollTop: target.offset().top
            }, 1000);
        }
    });
});