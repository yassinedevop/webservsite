$("document").ready(function(){
				// hauteur/largeur du canvas
				var innerHeight = $("#yeah").innerHeight();
				var innerWidth = $("#yeah").innerWidth();
        		//default paosition
        		var mouse = {
							    x: innerWidth/ 4,
							    y: innerHeight / 4 
							  }
				//déclaration des variables
				var x = mouse.x;
				var y = mouse.y;
				var dx = 2;
				var dy = 1;
				var radius = 30;
				//les couleurs des bubbles
				var colors= [
                    "#5d5c61" , "#379683" ,
                    "#7395ae" , "#557a95" ,
                    "#b1a296"
                ];
				// var colors= [
    //                 "#f9f9f9" , "#0294a5" ,
    //                 "#a79c93" , "#c1403d" ,
    //                 "#bf988f"
    //             ];
			// detection du mouvement de la souris
                	$("#yeah").mousemove(function(event){
                		x = event.clientX;
                	 y = event.clientY;
                	});

		//création des particles (cercles)
	function circle(x,y,dx,dy,radius,color){
		this.timeToLive = 8;
		this.color = color;
		this.x = x;
		this.y = y;
		this.dx = dx;
		this.dy = dy;
		this.radius = radius; 
						//logique des bubbles	

		this.update = function(){

			if(this.x + this.radius >= innerWidth || this.x-this.radius <= 0)
					{
						this.dx = -this.dx;
					}
					 else if (this.y+this.radius >= innerHeight || this.y-this.radius <= 0) {
						this.dy = -this.dy;
					}

					this.x = Math.min(Math.max(this.x, 0 + this.radius), innerWidth- this.radius)
				    this.y = Math.min(Math.max(this.y, 0 + this.radius), innerHeight - this.radius)	
					// création d'un seul cercle
				    $("canvas").drawArc({
                            strokeStyle : this.color,
                            x : this.x,
                            y: this.y,
                            radius : this.radius
                        });

					this.x += this.dx;
					this.y += this.dy;
				
				      this.radius -= radius / (this.timeToLive / 0.1);

				      if (this.radius < 0) this.radius = 0; 

				      this.timeToLive -= 0.1;

}			
				// Si ttl est 0 l'élement doit disparaitre sa case memoire sera liberé 
					this.remove = function(){
						return this.timeToLive <=0;
					} 
				

  }
 
    				function Explosion(x,y){
    					this.x = x;
    					this.y = y;
    					this.particles = [];
    					
    						 var Velocity = {
  								x: (Math.random()-0.5)*3.5,
		  						y: (Math.random()-0.5)*3.5
		 													 }
							//génération de plusieurs particles
    							this.particles.push(new circle(this.x, this.y ,Velocity.x,Velocity.y,
    							radius,colors[Math.floor(Math.random() * colors.length)]));
    				
    				this.draw = function(){
    					for (var i = 0; i < this.particles.length; i++) {
					    						
					        this.particles[i].update();	

					        if (this.particles[i].remove() == true) {
					          this.particles.splice(i, 1);	
					        }
    					
    				}
    			}
    		}


    				
													
				
	
  
				
          var explosions = [];              

	function animation(){

					requestAnimationFrame(animation);
					    $("#yeah").clearCanvas();

					    explosions.push(new Explosion(x-10, y));

					    for (var i = 0; i < explosions.length; i++) {
					      explosions[i].draw();
					    }


		
	}
			

	animation();
			




});
