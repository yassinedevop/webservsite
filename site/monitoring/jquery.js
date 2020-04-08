$(document).ready(function(){
	var clicked1 = true;
	var clicked2 = true;
	var clicked3 = true;
	var clicked4 = true;
	var clicked = true;

	
	$("#LED1").click(function(){
		$.post("/cmd/ledxhr", {},
		function(data,status){
			 
	if(clicked1){
		clicked1 = !clicked1;
		$("#led_results").css("background","green");
		$("#text1").text("allumé");
	}
	else if(!clicked1){
		clicked1 = !clicked1;
		$("#led_results").css("background","white");
		$("#text1").text("éteinte");
	}	
});
	});

$("#LED2").click(function(){
	$.post("/cmd/led1xhr", {},
			function(data,status){
	if (clicked2) {
		clicked2 = !clicked2;
		$("#text2").text("allumé");
		$("#led1_results").css("background","green");
	}
	else{
		clicked2 = !clicked2;
		$("#text2").text("éteinte");
		$("#led1_results").css("background","white");
	}	
	});
	});

	$("#LED3").click(function(){
		$.post("/cmd/led2xhr", {},
			function(data,status){ 
	if(clicked3){
		clicked3 = !clicked3;
		$("#text3").text("allumé");
		$("#led2_results").css("background","green");
	}
	else{
		clicked3 = !clicked3;
		$("#text3").text("éteinte");
		$("#led2_results").css("background","white");
	}	
	});	
	});

	$("#LED4").click(function(){
		$.post("/cmd/led3xhr", {},
			function(data,status){ 
	if(clicked4){
		clicked4 = !clicked4;
		$("#text4").text("allumé");
		$("#led3_results").css("background","green");
	}
	else{
		clicked4 = !clicked4;
		$("#text4").text("éteinte");
		$("#led3_results").css("background","");
	}	
	});	
	});

	function getingswitch(){
		$.post("/cmd/switchxhr", {},
			function(data){ 
				if(data.charAt(3)=="0"){$("#switch3_results").css("background","white");}
			else{ $("#switch3_results").css("background","green");}
			
				if(data.charAt(2)=="0"){$("#switch2_results").css("background","white");}
			else{ $("#switch2_results").css("background","green");}
			 
				if(data.charAt(1)=="0"){$("#switch1_results").css("background","white");}
			else{ $("#switch1_results").css("background","green");}
			 
				if(data.charAt(0)=="0"){$("#switch_results").css("background","white");}
			else{ $("#switch_results").css("background","green");}
	});
	}
	


var tempera;

	function gettemp(){
		$.post("/cmd/temp" , {} , function(data){
			tempera = data;
			$("#text_input").text("Température = "+ data +"°C");
		});
	}
	setInterval(gettemp,1000);
	setInterval(getingswitch,1200);


function temperature(){
	return tempera;
}

Plotly.newPlot('line_to_x',[{
	y : [temperature()],
	mode : 'lines',
	line : {color : '#80CAF6'}
}]);
	var cnt = 0;
	var interval = setInterval(function(){
		Plotly.extendTraces('line_to_x',{
			y : [[temperature()]]
		}, [0]);
		if (++cnt == 100) clearInterval(interval);
	},1000);

			
	});




