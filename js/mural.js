
var socket = io.connect('http://'+window.location.hostname);

var cells = {};
stepRate = 30;

var delta = 1, clock = new THREE.Clock();
var group = new THREE.Object3D();

var speed = 50;
var particleCloud, sparksEmitter, emitterPos;
var delta = 1, clock = new THREE.Clock();


//x,y,z,color,id

socket.on('connect', function(){
  socket.emit('identify', {data:'mural'});
  console.log('connected');
});

socket.on('mural', function(data){
  var d = data.data;

  if(!(d.id in cells)){
    cells[d.id] = new Cell(d.id, d.color);
  }

  cells[d.id].read(d.actions);
});


//create a mobile object for each id, if it doesnt exist else update it

$(document).ready(function(){
  initParticleSystem();
});


var initParticleSystem = function(){
   var particlesLength = 70000;
   var particles = new THREE.Geometry();
   var Pool = {
     __pools: [],
     // Get a new Vector
     get: function() {
       if ( this.__pools.length > 0 ) {
         return this.__pools.pop();
       }
       console.log( "pool ran out!" )
         return null;
     },

     // Release a vector back into the pool
     add: function( v ) {
       this.__pools.push( v );
     }
   };

   for ( i = 0; i < particlesLength; i ++ ) {
     particles.vertices.push( newpos( Math.random() * 200 - 100, Math.random() * 100 + 150, Math.random() * 50 ) );
     Pool.add( i );
   }

   attributes = {
     size:  { type: 'f', value: [] },
     pcolor: { type: 'c', value: [] }
   };

   var sprite = generateSprite();
   texture = new THREE.Texture( sprite );
   texture.needsUpdate = true;
   uniforms = {
     texture:   { type: "t", value: texture }
   };



   var shaderMaterial = new THREE.ShaderMaterial( {

     uniforms: uniforms,
       attributes: attributes,

       vertexShader: document.getElementById( 'vertexshader' ).textContent,
       fragmentShader: document.getElementById( 'fragmentshader' ).textContent,

       blending: THREE.AdditiveBlending,
       depthWrite: false,
       transparent: true

   });

   particleCloud = new THREE.ParticleSystem( particles, shaderMaterial );

   particleCloud.dynamic = true;
   // particleCloud.sortParticles = true;

   var vertices = particleCloud.geometry.vertices;
   var values_size = attributes.size.value;
   var values_color = attributes.pcolor.value;

   for( var v = 0; v < vertices.length; v ++ ) {

     values_size[ v ] = 50;
     values_color[ v ] = new THREE.Color( 0x000000 );

     particles.vertices[ v ].set( Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY );

   }

   group.add( particleCloud );
   particleCloud.y = 800;


   var hue = 0;

   var setTargetParticle = function() {

     var target = Pool.get();
     values_size[ target ] = Math.random() * 100 + 50;

     return target;

   };

   var onParticleCreated = function( p ) {

     var position = p.position;
     p.target.position = position;
     p.velocity.x = 0;
     p.velocity.y = 10;
     var velocity = p.velocity;
     p.target.velocity= velocity;
     var target = p.target;

     if ( target ) {
       if ( hue > 1 ) hue -= 1;
       emitterpos.x = 0;
       emitterpos.y = 0;
       pointLight.position.x = emitterpos.x;
       pointLight.position.y = emitterpos.y;
       pointLight.position.z = 10;
       particles.vertices[ target ] = p.position;
       values_color[ target ].setHSL( hue, 0.6, 0.1 );
       pointLight.color.setHSL( hue, 0.8, 0.5 );

     };
   };

   var onParticleDead = function( particle ) {
     var target = particle.target;
     if ( target ) {
       // Hide the particle
       values_color[ target ].setRGB( 0, 0, 0 );
       particles.vertices[ target ].set( Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY );

       // Mark particle system as available by returning to pool
       Pool.add( particle.target );
     }
   };

   var engineLoopUpdate = function() {

   };

   sparksEmitter = new SPARKS.Emitter( new SPARKS.SteadyCounter( 500 ) );

   emitterpos = new THREE.Vector3( 0, 0, 0 );

   sparksEmitter.addInitializer( new SPARKS.Position( new SPARKS.PointZone( emitterpos ) ) );
   sparksEmitter.addInitializer( new SPARKS.Lifetime( 1, 15 ));
   sparksEmitter.addInitializer( new SPARKS.Target( null, setTargetParticle ) );


   sparksEmitter.addInitializer( new SPARKS.Velocity( new
         SPARKS.PointZone( new THREE.Vector3( 0, 200, 0 ) ) ) );

   sparksEmitter.addAction( new SPARKS.Age() );
   sparksEmitter.addAction( new SPARKS.Accelerate( 0, -90, 0 ) );
   sparksEmitter.addAction( new SPARKS.Move() );
   sparksEmitter.addAction( new SPARKS.RandomDrift( 90, 100, 500 ) );


   sparksEmitter.addCallback( "created", onParticleCreated );
   sparksEmitter.addCallback( "dead", onParticleDead );

   //weird hack
   sparksEmitter._actions[0]._easing = TWEEN.Easing.Linear.None;
   sparksEmitter.start();

   var effectFocus = new THREE.ShaderPass( THREE.FocusShader );

   var effectCopy = new THREE.ShaderPass( THREE.CopyShader );
   effectFilm = new THREE.FilmPass( 0.5, 0.25, 2048, false );

   var shaderBlur = THREE.TriangleBlurShader;
   effectBlurX = new THREE.ShaderPass( shaderBlur, 'texture' );
   effectBlurY = new THREE.ShaderPass( shaderBlur, 'texture' );

   var radius = 15;
   var blurAmountX = radius / window.innerWidth;
   var blurAmountY = radius / window.innerHeight;

   hblur = new THREE.ShaderPass( THREE.HorizontalBlurShader );
   vblur = new THREE.ShaderPass( THREE.VerticalBlurShader);

   hblur.uniforms[ 'h' ].value =  1 / window.innerWidth;
   vblur.uniforms[ 'v' ].value =  1 / window.innerHeight;

   effectBlurX.uniforms[ 'delta' ].value = new THREE.Vector2( blurAmountX, 0 );
   effectBlurY.uniforms[ 'delta' ].value = new THREE.Vector2( 0, blurAmountY );

   effectFocus.uniforms[ 'sampleDistance' ].value = 0.99; //0.94
   effectFocus.uniforms[ 'waveFactor' ].value = 0.003;  //0.00125

   var renderScene = new THREE.RenderPass( scene, camera );


   vblur.renderToScreen = true;
   effectBlurY.renderToScreen = true;
   effectFocus.renderToScreen = true;
   effectCopy.renderToScreen = true;
   effectFilm.renderToScreen = true;



   function onWindowResize() {

     windowHalfX = window.innerWidth / 2;
     windowHalfY = window.innerHeight / 2;

     camera.aspect = window.innerWidth / window.innerHeight;
     camera.updateProjectionMatrix();

     renderer.setSize( window.innerWidth, window.innerHeight );

     hblur.uniforms[ 'h' ].value =  1 / window.innerWidth;
     vblur.uniforms[ 'v' ].value =  1 / window.innerHeight;

     var radius = 15;
     var blurAmountX = radius / window.innerWidth;
     var blurAmountY = radius / window.innerHeight;

     effectBlurX.uniforms[ 'delta' ].value = new THREE.Vector2( blurAmountX, 0 );
     effectBlurY.uniforms[ 'delta' ].value = new THREE.Vector2( 0, blurAmountY );

   }


   window.addEventListener( 'resize', onWindowResize, false );
  render();

}


function Cell(id, color){
  this.id = id;
  this.color = color;
  this.x;
  this.y;
  this.z;
  this.timeline = [];
  this.velocity = new THREE.Vector3(0,0,0);
  this.acceleration = new THREE.Vector3(0,0,0);
  this.activated = false;
  this.intensity = 0;
  this.angle;

}

Cell.prototype.update = function(x,y,z, gamma, beta, color){
  this.intensity = Math.max(x,y,z);
  this.activated = this.intensity > 0.5;
  if(this.activated){
    this.color = color;

    var lx = Math.cos(theta);
    var ly = Math.sin(theta);
    this.velocity.x = this.intensity * lx;
    this.velocity.y = this.intensity * ly;
  }
}

var bounding = function(val){
  var neg = -50;
  var pos = 50;
  if(val<neg){return pos;}
  if(val>=pos){return neg;}
  return val;
}

var boundingEnv = function(vec){
  vec.x = bounding(vec.x);
  vec.y = bounding(vec.y);
  vec.z = bounding(vec.z);
  return vec;
}


Cell.prototype.read = function(actions){
  //x,y,z,dt
  var that = this;
  actions.forEach(function(c,i){
    c.time = c.deltaTime + new Date().getTime();
    that.timeline.push(c);
  });
}

Cell.prototype.step = function(){
  if (this.timeline.length >0){
    if(this.timeline[0].time < new Date().getTime()){
      var a = this.timeline.shift();
      this.update(a.x, a.y, a.z, a.gamma, a.beta, a.color);
    }
  }
}


//particle system



function newpos( x, y, z ){ return new THREE.Vector3( x, y, z ); }

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 2000 );
camera.position.set( 0, 100, 400 );
var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

// set its position
pointLight = new THREE.PointLight( 0xffffff, 2, 300 );
pointLight.position.set( 0, 0, 0 );

// add to the scene
scene.add(pointLight);
scene.add( group);






function update(){
  //interface w particles
/*
  for(var id in cells){
    cells[id].step();
  }

*/
  delta = speed * clock.getDelta();
  particleCloud.geometry.verticesNeedUpdate = true;
  attributes.size.needsUpdate = true;
  attributes.pcolor.needsUpdate = true;
}

function render() {
  requestAnimationFrame(render);
  update();
  renderer.render(scene, camera);
}



/* accepts parameters
 * h  Object = {h:x, s:y, v:z}
 * OR
 * h, s, v
*/
function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (h && s === undefined && v === undefined) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        r: Math.floor(r * 255),
        g: Math.floor(g * 255),
        b: Math.floor(b * 255)
    };
}

var generateSprite = function() {

  var canvas = document.createElement( 'canvas' );
  canvas.width = 128;
  canvas.height = 128;

  var context = canvas.getContext( '2d' );
  context.beginPath();
  context.arc( 64, 64, 60, 0, Math.PI * 2, false) ;

  context.lineWidth = 0.5;
  context.stroke();
  context.restore();

  var gradient = context.createRadialGradient( canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2 );
  gradient.addColorStop( 0, 'rgba(255,255,255,1)' );
  gradient.addColorStop( 0.1, 'rgba(255,255,255,1)' );
  gradient.addColorStop( 0.5, 'rgba(200,200,200,1)' );
  gradient.addColorStop( 0.9, 'rgba(0,0,0,1)' );
  context.fillStyle = gradient;
  context.fill();
  return canvas;
}


