;(function($, window, document, undefined) {
    "use strict";
    Window = $(window);

    /*============================*/
	/* 01 - VARIABLES */
	/*============================*/

	var swipers = [], winW, winH, winScr, _isresponsive, smPoint = 768, mdPoint = 992, lgPoint = 1200, addPoint = 1600, _ismobile = navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/webOS/i) || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPod/i);


	/*========================*/
	/* 02 - PAGE CALCULATIONS */
	/*========================*/
	
	function pageCalculations(){
		winW = Window.width();
		winH = Window.height();
	}


	/*=================================*/
	/* 03 - FUNCTION ON DOCUMENT READY */
	/*=================================*/
	
	pageCalculations();

	// ************ MENU ***************

	var $first_child_link = $('.menu-item-has-children > a').append('<span class="fa fa-angle-down"></span>'),
		navMenuIcon = $('.nav-menu-icon'),
		wpcNavigation = $('.wpc-navigation'),
		mainmenuItem = $('.main-menu li');

	navMenuIcon.on('click', function(e) {
		$(this).toggleClass('active');
		wpcNavigation.toggleClass('active');
	});

	$first_child_link.find('span').on('click', function(e) {
		$(this).closest('li').toggleClass('active');
	});

	mainmenuItem.on('click', function (e) {
		mainmenuItem.removeClass('active');
		$(this).addClass('active');
	});

	function mainMenu() {
		if(winW <= 992){
			mainmenuItem.on('click', function (e) {
				if(!$(this).hasClass('menu-item-has-children')) {
					navMenuIcon.toggleClass('active');
					wpcNavigation.toggleClass('active');
				}
				else{
					$(this).find('.sub-menu').toggleClass('on-d');
				}
			})
		}
	}
	
	mainMenu();

	// menu style 3
	
	function menu3() {

		winW = Window.width();

		if (winW > 992){
			var menu3_width = + $('.inner-wrap.style-3 .main-menu').width();
			var res_w = $('.a-header').width() - $('.inner-wrap').width();
			var w = menu3_width + 100 + res_w/2;
			var bgHeader = $('.bg-header');

			bgHeader.css('width', w );
			bgHeader.css('right', '-' + res_w/2 + 'px');
		}
	}

	menu3();

	function overflow() {
		
		navMenuIcon.on('click', function () {
			if(winW <= 992) {

				if($(wpcNavigation).hasClass('active')){
					$('html').addClass('overflow');
					$('.main-menu').on('click', '.menu-item:not(.menu-item-has-children)', function () {
						$('html').removeClass('overflow');
					});
				}
				else{
					$('html').removeClass('overflow');
				}
			}
			else {
				$('html').removeClass('overflow');
			}
		});
	}

	overflow();

	// POPUP SEARCH

	var searchBtn = $('.serch-button'),
		searchPopup = $('.search-popup');

	searchBtn.on('click', function(e){
		searchPopup.addClass('open');
		e.preventDefault();
	});

	$('.search-form .close').on('click', function(e){
		searchPopup.removeClass('open');
		e.preventDefault();
	});

	var popupInput = $('.input'),
		popupInputField = $('.input-field');

	popupInput.on('focusin', function(){
		$(this).parent(popupInputField).addClass('active');
	});
	popupInput.on('focusout', function(){
		$(this).parent(popupInputField).removeClass('active');
	});


	$(".btn-more").on("click", function(e){
		$(".hide-item").fadeIn(1000);
		$(this).fadeOut(1000);


		isotopeN();
		e.preventDefault();
	});


	// BACKGROUND VIDEO

	var playBtn = $('.play-btn'),
		videoIframe = $('.video-iframe'),
		closeVideo = $('.close-btn');

	playBtn.on('click', function() {

		var bgVideoHeight = $('.header-video').outerHeight();
		videoIframe.height(bgVideoHeight);

		var videoSrc = $(this).attr('data-video');
		videoIframe.attr('src', videoSrc).show();
		$('.video-tmb').css({
			'display' : 'none'
		});
		closeVideo.show();
	});

	closeVideo.on('click', function() {
		videoIframe.attr('src', 'about:blank').hide();
		$('.video-tmb').css({
			'display' : 'block'
		});
		closeVideo.hide();
	});


	/*============================*/
	/* 04 - FUNCTION ON PAGE LOAD */
	/*============================*/

	Window.on('load',function(){
		$('.preload-wrap').fadeOut(1000);
	    initSwiper();

	});


	/*==============================*/
	/* 05 - FUNCTION ON PAGE RESIZE */
	/*==============================*/

	function resizeCall(){
		pageCalculations();
		var wow = $('.swiper-container.initialized[data-slides-per-view="responsive"]');
		for ( var i = 0; i < wow.length; i++) {
			var thisSwiper = swipers['swiper-'+$(wow[i]).attr('id')], $t = $(wow[i]), slidesPerViewVar = updateSlidesPerView($t), centerVar = thisSwiper.params.centeredSlides;
			thisSwiper.params.slidesPerView = slidesPerViewVar;
			thisSwiper.reInit();
			if(!centerVar){
				var paginationSpan = $t.find('.pagination span');
				var paginationSlice = paginationSpan.hide().slice(0,(paginationSpan.length+1-slidesPerViewVar));
			if(paginationSlice.length<=1 || slidesPerViewVar>=$t.find('.swiper-slide').length) $t.addClass('pagination-hidden');
			else $t.removeClass('pagination-hidden');
			paginationSlice.show();
			}
		}
	}
	if(!_ismobile){
		Window.on('resize', function(){
			resizeCall();
		});
	} else{
		window.addEventListener("orientationchange", function() {
			resizeCall();
		}, false);
	}

	Window.on('resize', function(){
		menu3();
		popUp();
		isotopeN();
		overflow();
		mainMenu();
	});


	/*=====================*/
	/* 07 - SWIPER SLIDERS */
	/*=====================*/

	function initSwiper(){

		var initIterator = 0;
		var swiperContainer = $('.swiper-container');

		for (var i = initIterator; i < swiperContainer.length; i++) {

			var $t = $(swiperContainer[i]);								  

			var index = 'swiper-unique-id-'+initIterator;

			$t.addClass('swiper-'+index + ' initialized').attr('id', index);
			$t.find('.pagination').addClass('pagination-'+index);

			var autoPlayVar = parseInt($t.attr('data-autoplay'),10);
            var mode = $t.attr('data-mode');
			var slidesPerViewVar = $t.attr('data-slides-per-view');
			if(slidesPerViewVar == 'responsive'){
				slidesPerViewVar = updateSlidesPerView($t);
			}
			else slidesPerViewVar = parseInt(slidesPerViewVar,10);

			var loopVar = parseInt($t.attr('data-loop'),10);
			var speedVar = parseInt($t.attr('data-speed'),10);
            var centerVar = parseInt($t.attr('data-center'),10);
			swipers['swiper-'+index] = new Swiper('.swiper-'+index,{
				speed: speedVar,
				pagination: '.pagination-'+index,
				loop: loopVar,
				paginationClickable: true,
				autoplay: autoPlayVar,
				slidesPerView: slidesPerViewVar,
				keyboardControl: true,
				calculateHeight: true, 
				simulateTouch: true,
				roundLengths: true,
				centeredSlides: centerVar,
                mode: mode || 'horizontal',
				onInit: function(swiper){
				    $t.find('.swiper-slide').addClass('active');
				},
				onSlideChangeEnd: function(swiper){
					var activeIndex = (loopVar===1)?swiper.activeLoopIndex:swiper.activeIndex;
				},

				onSlideChangeStart: function(swiper){
					$t.find('.swiper-slide.active').removeClass('active');
				}
			});
			swipers['swiper-'+index].reInit();
				if($t.attr('data-slides-per-view')=='responsive'){
					var paginationSpan = $t.find('.pagination span');
					var paginationSlice = paginationSpan.hide().slice(0,(paginationSpan.length+1-slidesPerViewVar));
					if(paginationSlice.length<=1 || slidesPerViewVar>=$t.find('.swiper-slide').length) $t.addClass('pagination-hidden');
					else $t.removeClass('pagination-hidden');
					paginationSlice.show();
				}
            
            if($t.find('.default-active').length){
                swipers['swiper-'+index].swipeTo($t.find('.swiper-slide').index($t.find('.default-active')), 0);    
            } 

			initIterator++;
		}		
	}

	function updateSlidesPerView(swiperContainer){
		if(winW>=addPoint) return parseInt(swiperContainer.attr('data-add-slides'),10);
		else if(winW>=lgPoint) return parseInt(swiperContainer.attr('data-lg-slides'),10);
		else if(winW>=mdPoint) return parseInt(swiperContainer.attr('data-md-slides'),10);
		else if(winW>=smPoint) return parseInt(swiperContainer.attr('data-sm-slides'),10);
		else return parseInt(swiperContainer.attr('data-xs-slides'),10);
	}


	//swiper arrows
	$('.swiper-arrow-left').on('click', function(){
		swipers['swiper-'+$(this).parent().attr('id')].swipePrev();
	});

	$('.swiper-arrow-right').on('click', function(){
		swipers['swiper-'+$(this).parent().attr('id')].swipeNext();
	});

    $('.swiper-outer-left').on('click', function(){
		swipers['swiper-'+$(this).parent().find('.swiper-container').attr('id')].swipePrev();
	});

	$('.swiper-outer-right').on('click', function(){
		swipers['swiper-'+$(this).parent().find('.swiper-container').attr('id')].swipeNext();
	});



	/***********************************/
	/*WINDOW SCROLL*/
	/**********************************/

	Window.on('scroll', function() {
		wpcProgress();

		if ($(this).scrollTop() >= 80) {
			$('header').addClass('scroll');
		}
		else{
			$('header').removeClass('scroll');
		}
	});


    /***********************************/
	/*BACKGROUND*/
	/**********************************/

    //sets child image as a background


	function wpc_add_img_bg( img_sel, parent_sel){

		if (!img_sel) {
			console.info('no img selector');
			return false;
		}

		var $parent, $imgDataHidden, _this;

		for ( var i = 0; i < $(img_sel).length; i++) {

			_this = $(img_sel)[i];
			$imgDataHidden = $(_this).data('s-hidden');
			$parent = $(_this).closest( parent_sel );
			$parent = $parent.length ? $parent : $(_this).parent();
			$parent.css( 'background-image' , 'url(' + _this.src + ')' ).addClass('wpc-back-bg');
			if ($imgDataHidden) {
				$(_this).css('visibility', 'hidden');
			}
			else {
				$(_this).hide();
			}
		}
	}
	wpc_add_img_bg( '.s-img-switch', '.s-back-switch');


	/***********************************/
	/* 05 - POPUP */
	/**********************************/


	$(".main-menu li a").mPageScroll2id();

	function popUp() {
		var imgPopup = $('.img-popup');

		if (imgPopup.length){

			for ( var i = 0; i < imgPopup.length; i++) {

				imgPopup.magnificPopup({
					type: 'image',
					removalDelay: 100,
					tLoading: 'Loading image #%curr%...',
					mainClass: 'mfp-fade',
					closeBtnInside: false,
					gallery: {
						enabled: true,
						navigateByImgClick: true,
						preload: [0,1]
					}
				});
			}
		}
	}
	
	popUp();


	function isotopeN() {

		var container = $('.izotope-container');

		if (container.length) {

			for (var i = 0; i < container.length; i++) {

				var izo = container[i];
				var layoutM = $(izo).attr('data-layout') || 'masonry';

				$(izo).isotope({
					itemSelector: '.item',
					masonry: {
					    // use outer width of grid-sizer for columnWidth
					    columnWidth: '.item'
				  	}
			  	});
			}
		}

		$('#filters').on('click', '.but', function() {
		  	
		  	var izotope_container = $('.izotope-container');

            for (var i = 0; i < izotope_container.length; i++) {
                $(izotope_container[i]).find('.item').removeClass('animated');
            }
			$('#filters .but').removeClass('activbut');
		  	$(this).addClass('activbut');
			var filterValue = $(this).attr('data-filter');
			$(container).isotope({filter: filterValue});
		});
	}

	isotopeN();

	/***********************************/
	/* SKILLS */
	/**********************************/
	function wpcProgress() {

		var counter = $(".wpc-counter").not('.animated');

		for ( var i = 0; i < counter.length; i++) {
			if(Window.scrollTop() >= $(counter[i]).offset().top-Window.height() ) {

				$(counter[i]).addClass('animated').find('.counter').countTo();

				var lineFill = $(counter[i]).find('.line-fill');

				for ( var y = 0; y < lineFill.length; y++) {

					var objel = $(lineFill[y]);

					var pb_width = $(objel).attr('data-width-pb');
						objel.css({'width':pb_width});
				}
			}
		}	
	}

	/***********************************/
	/* MAP */
	/**********************************/

	var mapContainer = $('.wpc-map');

	if( mapContainer.length ) {
    	for (var i = 0; i < mapContainer.length; i++) {
    		initialize(mapContainer[i]);
    	}
    }

	function initialize(_this) {

		var stylesArray = {
			//style 1
			'style-1' : [{
				"featureType":"water",
				"elementType":"geometry",
				"stylers":[
					{"color":"#e9e9e9"},
					{"lightness":17}
				]},

				{"featureType":"landscape",
					"elementType":"geometry",
					"stylers":[
						{"color":"#f5f5f5"},
						{"lightness":20}
					]},
				{"featureType":"road.highway",
					"elementType":"geometry.fill",
					"stylers":[
						{"color":"#ffffff"},
						{"lightness":17}
					]},
				{"featureType":"road.highway",
					"elementType":"geometry.stroke",
					"stylers":[
						{"color":"#ffffff"},
						{"lightness":29},
						{"weight":0.2}
					]},
				{"featureType":"road.arterial",
					"elementType":"geometry",
					"stylers":[
						{"color":"#ffffff"},
						{"lightness":18}
					]},
				{"featureType":"road.local",
					"elementType":"geometry",
					"stylers":[
						{"color":"#ffffff"},
						{"lightness":16}
					]},
				{"featureType":"poi",
					"elementType":"geometry",
					"stylers":[
						{"color":"#f5f5f5"},
						{"lightness":21}
					]},
				{"featureType":"poi.park",
					"elementType":"geometry",
					"stylers":[
						{"color":"#dedede"},
						{"lightness":21}
					]},
				{"elementType":"labels.text.stroke",
					"stylers":[
						{"visibility":"on"},
						{"color":"#ffffff"},
						{"lightness":16}
					]},
				{"elementType":"labels.text.fill",
					"stylers":[
						{"saturation":36},
						{"color":"#333333"},
						{"lightness":40}
					]},
				{"elementType":"labels.icon",
					"stylers":[{"visibility":"off"}
					]},
				{"featureType":"transit",
					"elementType":"geometry",
					"stylers":[
						{"color":"#f2f2f2"},
						{"lightness":19}
					]},
				{"featureType":"administrative",
					"elementType":"geometry.fill",
					"stylers":[
						{"color":"#fefefe"},
						{"lightness":20}
					]},
				{"featureType":"administrative",
					"elementType":"geometry.stroke",
					"stylers":[
						{"color":"#fefefe"},
						{"lightness":17},
						{"weight":1.2}
					]}
			]
		};

		var styles ,map, marker, infowindow,
			lat = $(_this).attr("data-lat"),
			lng = $(_this).attr("data-lng"),
			contentString = $(_this).attr("data-string"),
			image = $(_this).attr("data-marker"),
			styles_attr = $(_this).attr("data-style"),
			zoomLevel = parseInt($(_this).attr("data-zoom"),10),
			myLatlng = new google.maps.LatLng(lat,lng);


		// style_1
		if (styles_attr == 'style-1') {
			styles = stylesArray[styles_attr];
		}
		// custom
		if (typeof hawa_style_map != 'undefined' && styles_attr == 'custom') {
			styles = hawa_style_map;
		}
		// or default style

		var styledMap = new google.maps.StyledMapType(styles,{name: "Styled Map"});

		var mapOptions = {
			zoom: zoomLevel,
			disableDefaultUI: true,
			center: myLatlng,
			scrollwheel: false,
			mapTypeControlOptions: {
				mapTypeIds: [google.maps.MapTypeId.ROADMAP, 'map_style']
			}
		};

		map = new google.maps.Map(_this, mapOptions);

		map.mapTypes.set('map_style', styledMap);
		map.setMapTypeId('map_style');

		infowindow = new google.maps.InfoWindow({
			content: contentString
		});


		marker = new google.maps.Marker({
			position: myLatlng,
			map: map,
			icon: image
		});

		google.maps.event.addListener(marker, 'click', function() {
			infowindow.open(map,marker);
		});

	}

})(jQuery, window, document);