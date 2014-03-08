var World = function(options) {
    this.options = {};
    _.extend(this.options, options, {
        // defaults
        global: window

    });

    this.global = this.options.global;
    this.mouse = null;

    this.camera = null;
    this.renderer = null;
    this.riftRenderer = null;
    this.currentScene = null;
    this.controls = null;
    this.time = Date.now();
    this.objects = [];

    // declare the rendering loop
    this.onRender = [];
};

World.prototype.init = function() {

    // setup webgl renderer full page
    this.renderer    = new THREE.WebGLRenderer();

    this.renderer.setSize( this.global.innerWidth, this.global.innerHeight );
    document.body.appendChild( this.renderer.domElement );

    // handle window resize events
    var winResize   = new THREEx.WindowResize(this.renderer, this.camera);

    this.initScene();
    
    this.riftRenderer  = new THREE.OculusRiftEffect(this.renderer);
    window.riftr = this.riftRenderer;

    this.initLights();
    this.initCamera();
    this.initControls();
    this.initObjects();
    this.render();

    this.loop();
};

World.prototype.initScene = function() {

    // setup a scene and camera
    this.currentScene   = new THREE.Scene();
    window.myScene = this.currentScene;
    this.camera  = new THREE.PerspectiveCamera(45, this.global.innerWidth / this.global.innerHeight, 0.01, 1000);
    this.camera.position.z = 3;
};

World.prototype.initLights = function() {
    //////////////////////////////////////////////////////////////////////////////////
    //      default 3 points lightning                  //
    //////////////////////////////////////////////////////////////////////////////////
    
    var ambientLight= new THREE.AmbientLight( 0x020202 )
    this.currentScene.add( ambientLight)
    var frontLight  = new THREE.DirectionalLight('white', 1)
    frontLight.position.set(0.5, 0.5, 2)
    this.currentScene.add( frontLight )
    var backLight   = new THREE.DirectionalLight('white', 0.75)
    backLight.position.set(-0.5, -0.5, -2)
    this.currentScene.add( backLight )  
};

World.prototype.initObjects = function() {
    this.objects.push(this.makeBlock());
};

World.prototype.makeBlock = function() {
    //////////////////////////////////////////////////////////////////////////////////
    //      add an object and make it move                  //
    //////////////////////////////////////////////////////////////////////////////////  
    var geometry    = new THREE.CubeGeometry( 1, 1, 1);
    var material    = new THREE.MeshPhongMaterial();
    var mesh        = new THREE.Mesh( geometry, material );
    this.currentScene.add( mesh );
    
    this.onRender.push(function renderBlock(delta, now){
        mesh.matrixRotationWorld.rotateX(0.5 * delta);
        mesh.matrixRotationWorld.rotateY(2.0 * delta);      
    });

    return mesh;
};

World.prototype.initCamera = function() {
    //////////////////////////////////////////////////////////////////////////////////
    //      Camera Controls                         //
    //////////////////////////////////////////////////////////////////////////////////
    this.mouse   = {x : 0, y : 0};
    var mouse = this.mouse;
    var camera = this.camera;
    var scene = this.currentScene;

    document.addEventListener('mousemove', function(event){
        mouse.x = (event.clientX / window.innerWidth ) - 0.5
        mouse.y = (event.clientY / window.innerHeight) - 0.5
    }, false)
    this.onRender.push(function renderCamera(delta, now){
        camera.position.x += (mouse.x*5 - camera.position.x) * (delta*3);
        camera.position.y += (mouse.y*5 - camera.position.y) * (delta*3);
        camera.lookAt( scene.position );
    });
};

World.prototype.initControls = function() {
    this.controls = new THREE.OculusRiftControls( this.camera );
    this.currentScene.add( this.controls.getObject() );

    this.ray = new THREE.Raycaster();

    this.ray.ray.direction.set( 0, -1, 0 );
};

World.prototype.render = function(polled, vrstate) {
    //////////////////////////////////////////////////////////////////////////////////
    //      render the scene                        //
    //////////////////////////////////////////////////////////////////////////////////
    this.riftRenderer.render( this.currentScene, this.camera, polled ? vrstate : null );

    // this.onRender.push(function renderWorld(){
    //     _this.renderer.render( _this.currentScene, _this.camera );       
    // });
};


World.prototype.loop = function() {
    //////////////////////////////////////////////////////////////////////////////////
    //      Rendering Loop runner                       //
    //////////////////////////////////////////////////////////////////////////////////
    var onRender = this.onRender;

    var lastTimeMsec= null;

    var controls = this.controls,
        ray      = this.ray,
        vrstate  = new vr.State(),
        _this    = this;

    requestAnimationFrame(function animate(nowMsec){
        // keep looping
        requestAnimationFrame( animate );

        // controls
        controls.isOnObject( false );
        
        ray.ray.origin.copy( controls.getObject().position );
        ray.ray.origin.y -= 10;

        var intersections = ray.intersectObjects( _this.objects );
        if ( intersections.length > 0 ) {
            var distance = intersections[ 0 ].distance;
            if ( distance > 0 && distance < 10 ) {
                controls.isOnObject( true );
            }
        }

        // Poll VR, if it's ready.
        var polled = vr.pollState(vrstate);
        controls.update( Date.now() - this.time, polled ? vrstate : null );


        // measure time
        lastTimeMsec    = lastTimeMsec || nowMsec-1000/60
        var deltaMsec   = Math.min(200, nowMsec - lastTimeMsec)
        lastTimeMsec    = nowMsec

        _this.render(polled, vrstate);

        // call each update function
        onRender.forEach(function(onRenderFct){
            onRenderFct(deltaMsec/1000, nowMsec/1000)
        });

        this.time = Date.now();
    });
};