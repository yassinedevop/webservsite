$(document).ready(function(){

	var board = [
  ['', '', ''],
  ['', '', ''],
  ['', '', '']
];


	// var choix = Math.random();
	// if(choix > 0.5){
	// 	player1 = 'X'
	// 	player2 = 'O'
	// 	var turn1 = true;//want to play first ? just change them or play random with choice above
	// 	var turn2 = false;
	// }
	// else{
	// 	player1 = 'O'
	// 	player2 = 'X'
	// }


//la position de la souris = la position du X ou O
	var mouse = { x : 0,
				  y : 0 };

	var innerHeight = $("#myCanvas").innerHeight();
	var innerWidth = $("#myCanvas").innerWidth();

	var innerHeight3 = innerHeight/3;
	var innerHeight23 = innerHeight*(2/3);

	var innerWidth3 = innerWidth/3;
	var innerWidth23 = innerWidth*(2/3);

// //création du X ou du O
var l = 20; //minimiser le size du X et du O 
	function drawX(X1,Y1){
		
		$("#myCanvas").drawLine({
		x1 : X1 + innerWidth3/4 + l,
		y1 : Y1 + innerHeight3/4 + l,
		x2 : X1+innerWidth3*3/4 - l,
		y2 : Y1+innerHeight3*3/4 - l,
		strokeStyle : "white",
		strokeWidth : 5
	});	
	$("#myCanvas").drawLine({
		x1 : X1+innerWidth3 *3/4 - l,
		y1 : Y1+ innerHeight3/4  + l,
		x2 : X1 + innerWidth3/4 + l,
		y2 : Y1+innerHeight3 * 3/4 - l,
		strokeStyle : "white",
		strokeWidth : 5
	});	
		
	}
	function drawO(X1,Y1){
		
		$("#myCanvas").drawArc({
			x : X1,
			y : Y1,
			radius : l,
			strokeStyle : "white",
			strokeWidth : 5
		});

	}
	let s1,s2,z1,z2;
	/* le dernier mouvement / _ | */ 
	function draw(name,k){
		var r = 20
		if (name == "horizontale") {
			s1 = innerWidth3/2 - r;
			s2 = innerHeight3/2 + innerHeight3*k;
			z1 = innerWidth3/2 + 2*innerWidth3 + r;
			z2 = innerHeight3/2 + innerHeight3*k  ;
		}
		if (name == "verticale") {
			s1 = innerWidth3/2 + innerHeight3*k;
			s2 = innerHeight3/2 - r;
			z1 = innerWidth3/2 + innerHeight3*k;
			z2 = innerHeight3/2 + 2*innerHeight3 + r;
		}
		if(name == "diagonale"){
			s1 = innerWidth3/2 + k 
			s2 = innerHeight3/2 
			z1 = innerWidth*5/6 - k 
			z2 = innerHeight*5/6 
		}
		$("#myCanvas").drawLine({
			x1 : s1,
			y1 : s2,
			x2 : z1,
			y2 : z2,
			strokeStyle : "orange",
			strokeWidth : 4
		});
	}
	
		
		var turn1 = true;//want to play first ? just change them or play random with choice above
		var turn2 = false;
		var played = false ;
		var movesplayedi = [];
		var movesplayedj = [];

		 let result;
		 function equals3(a, b, c) {
  return a == b && b == c && a != '';
}
var Gamefinished = false
		function checkwinner(){
				var notyet = 0;
				let winner = null ;
				//verticale
				for (var a = 0; a< 3; a++) {
					for (var b = 0; b< 3; b++) {
						if(board[a][b] != '' ){
							notyet+=1;
						}

					}
				}
				//verticale
					for (var k = 0; k < 3 ; k++) {
						if(equals3(board[k][0], board[k][1], board[k][2])){
							winner = board[k][0];
							draw("verticale",k);
							Gamefinished =  true
						}
				//horizontale
						if(equals3(board[0][k], board[1][k], board[2][k])){
							winner = board[0][k];
							draw("horizontale",k);
							Gamefinished = true
						}
						}
					
					if (equals3(board[0][0], board[1][1], board[2][2])) {
						    winner = board[0][0];
						    Gamefinished = true
						    draw("diagonale", 0)
						  }
					if (equals3(board[2][0], board[1][1], board[0][2])) {
    					winner = board[2][0];
    					Gamefinished = true
    					draw("diagonale" , innerHeight23)
    				}
    				if (winner == null && notyet > 8) {
    					Gamefinished = true
						    return 'tie';
						  } else
						  {
						  	return winner;
						  }
  }  

function sendpos(player,posx,posy){
$.ajax({
  method: "POST",
  url: "game/posw",
  data: { player : player, namex: toString(posx), namey: toString(posy) }
})
  .done(function( msg ) {
    alert( "Data Saved: " + msg );
  });}

	function getpos(){
	$.post("game/posr" , {} ,function(data,status){
					console.log(data);
					if(data.charAt(0) == 'O'){
						turn2 = false
						turn1 = true
						var j1 = data.charAt(1);
						var i = data.charAt(2);
						drawO(innerWidth3*j1 +innerWidth3/2  , innerHeight3/2 + innerHeight3*i1);
						board[j1][i1] = 'O';
					}
					});
}
			
		function checkplayer(i,j){
			/*stocker les mouvements joués*/
			if (!Gamefinished) {
				
				
				for (var z = 0; z < movesplayedi.length; z++) {
			
			if(movesplayedi[z] == i && movesplayedj[z] == j ){
						played = true;
					}
				else{
						played = false;
					
				}

			}

			movesplayedi.push(i);
			movesplayedj.push(j);

				if (!played) {
					if(turn1){

				drawX(incdrawX[j],incdrawY[i]);
				turn1 = false;
				turn2 = true;
				board[j][i] = 'X';

				sendpos('X',j,i); /*******************************/
			}
				
				}
				if(turn2) {
					setInterval(getpos , 1000);
				}
			// else if(turn2){
			// 	drawO(innerWidth3*j +innerWidth3/2  , innerHeight3/2 + innerHeight3*i);
			// 	turn2 = false
			// 	turn1 = true
			// 	board[j][i] = 'O';
				
			// }
				// }
				result = checkwinner();
				if(result != null){
				if(result == 'tie'){
					$("div").html("<div>IT'S A  " + result +" </div>");
				}
				else {
					
					$("div").html("<div>THE WINNER IS " + result +" </div>");
				
}
	
}
	}
}


		var canvas = document.getElementById("myCanvas");
		var rect = canvas.getBoundingClientRect();

		var xy = [innerWidth3 , innerWidth23];

			/*Création de la base*/

			for (var j = 0; j < 2; j++) {	
				$("#myCanvas").drawLine({
					x1 :  0,
					y1 : xy[j],
					x2 : innerWidth,
					y2 :  xy[j],
					strokeStyle : "white",
					strokeWidth : 5
				});
				$("#myCanvas").drawLine({
						x1 : xy[j],
						y1 : 0,
						x2 : xy[j],
						y2 : innerHeight,
						strokeStyle : "white",
						strokeWidth : 5
					});		
			}		
			
				var incdrawX = [ 0 , innerWidth3 , innerWidth23];
				var incdrawY = [ 0 , innerHeight3 , innerHeight23 ];

				var maxincX = [innerWidth3 , innerWidth23 , innerWidth];
				var maxincY = [innerHeight3 , innerHeight23, innerHeight];
			
			
				$("#myCanvas").click(function(event){
					mouse.x = event.pageX - rect.left // on soustrait pour avoir la position de la souris dans l'élement seulement le début de l'élement a mtn la position (0,0) 
					mouse.y = event.pageY - rect.top
					
				for (var i = 0; i < 3; i++) {
					for (var j = 0; j < 3; j++) {
						if (mouse.x > incdrawX[j] && mouse.x<maxincX[j] && mouse.y > incdrawY[i] && mouse.y< maxincY[i]) { // quel carreau 
							checkplayer(i,j);
							


						}
					}
				}
				

				});
			
				
				});
			
	

			

