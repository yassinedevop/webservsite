
$(document).ready(function(){
	
	$("#img1").mouseenter(function(){
	$(".bigdiv").attr("id" , "one");
	});
	// $(".greenland").mouseenter(function(){
	// 	$(".bigdiv").css("top" , "-200px");
	// });
	
	
	$("#img2").hover(function(){
	$(".bigdiv").attr("id" , "two");
	});

	$("#img3").hover(function(){
	$(".bigdiv").attr("id" , "three");
	});

	$("#img4").hover(function(){
	$(".bigdiv").attr("id" , "four");
	});

	$("#img5").hover(function(){
	$(".bigdiv").attr("id" , "five");
	});
	
});