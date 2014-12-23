 var navbar = document.getElementsByClassName("navbar")[0],
     nav_narrow = document.getElementsByClassName("nav-narrow")[0],
     navbarPaddingTop = getStyle(navbar, "padding-top").match(/([\d]+)/g)[0];
     console.log(navbarPaddingTop);
 window.addEventListener("scroll", scrollHandler);

 function getStyle(obj, attri) {
    return window.getComputedStyle ? window.getComputedStyle(obj,null)[attri] : obj.currentStyle[attri]; 
 }

 function scrollHandler(e) {
     var event = e || window.event,
         target = event.target || event.srcElement;
     var scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
     var navbarY = (scrollTop / 1.2);
     document.getElementsByTagName("body")[0].style.backgroundPosition = "0px " + navbarY+'px';
     if (scrollTop > navbarPaddingTop) {
         navbar.classList.add("scrollChange");
         nav_narrow.classList.add("scrollChange");
     } else {
         navbar.classList.remove("scrollChange");
         nav_narrow.classList.remove("scrollChange")
     }
 }