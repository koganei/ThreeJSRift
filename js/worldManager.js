var World = function(options) {
    this.options = {};
    _.extend(this.options, options, {
        // defaults
        global: window

    });

    var _this = this;

    this.global = this.options.global;
    this.camera = null;
    this.scene = null;
    this.renderer = null;
    this.controls = null;
    this.time = Date.now();
    this.riftEffect = null;

    this.objects = [];
    this.ray = null;
    this.vrstate = new vr.State();
    this.onInit = [];

    

    if (!vr.isInstalled()) {
        //statusEl.innerText = 'NPVR plugin not installed!';
        alert('NPVR plugin not installed!');
    }
    vr.load(function(error) {
        if (error) {
            //statusEl.innerText = 'Plugin load failed: ' + error.toString();
            alert('Plugin load failed: ' + error.toString());
        }

        _this.init();
        _this.animate();
    });

};

World.prototype.init = function() {
    
    this.initCamera();
    this.initScene();
    this.initAmbiance(); // fog + lights
    this.initControls();
    this.initRay();
    this.initFloor();
    this.initObjects();
    this.initRenderer();
    this.pointer.init(this);

    for (var i = this.onInit.length - 1; i >= 0; i--) {
        if(_.isFunction(this.onInit[i])) {
            this.onInit[i].call(this);
        }
    };

};

World.prototype.initCamera = function() {
    this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );
};

World.prototype.initScene = function() {
    this.scene = new THREE.Scene();
};

World.prototype.initAmbiance = function() {
    var light = new THREE.DirectionalLight( 0xffffff, 1.5 );
    light.position.set( 1, 1, 1 );
    this.scene.add( light );

    light = new THREE.DirectionalLight( 0xffffff, 0.75 );
    light.position.set( -1, - 0.5, -1 );
    this.scene.add( light );
};

World.prototype.initControls = function() {
    this.controls = new THREE.OculusRiftControls( this.camera );
    this.scene.add( this.controls.getObject() );
};

World.prototype.initRay = function() {
    this.ray = new THREE.Raycaster();
    this.ray.ray.direction.set( 0, -1, 0 );
};

World.prototype.initFloor = function() {
    // floor

    var geometry = new THREE.PlaneGeometry( 2000, 2000, 100, 100 );
    geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );

    for ( var i = 0, l = geometry.vertices.length; i < l; i ++ ) {

        var vertex = geometry.vertices[ i ];
        vertex.x += Math.random() * 20 - 10;
        vertex.y += Math.random() * 2;
        vertex.z += Math.random() * 20 - 10;

    }

    for ( var i = 0, l = geometry.faces.length; i < l; i ++ ) {

        var face = geometry.faces[ i ];
        face.vertexColors[ 0 ] = new THREE.Color().setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );
        face.vertexColors[ 1 ] = new THREE.Color().setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );
        face.vertexColors[ 2 ] = new THREE.Color().setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );
        face.vertexColors[ 3 ] = new THREE.Color().setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );

    }

    var material = new THREE.MeshBasicMaterial( { vertexColors: THREE.VertexColors } );

    var mesh = new THREE.Mesh( geometry, material );
    this.scene.add( mesh );
};

World.prototype.initObjects = function() {
    var geometry = new THREE.CubeGeometry( 20, 20, 20 );

    for ( var i = 0, l = geometry.faces.length; i < l; i ++ ) {

        var face = geometry.faces[ i ];
        face.vertexColors[ 0 ] = new THREE.Color().setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );
        face.vertexColors[ 1 ] = new THREE.Color().setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );
        face.vertexColors[ 2 ] = new THREE.Color().setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );
        face.vertexColors[ 3 ] = new THREE.Color().setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );

    }

    for ( var i = 0; i < 250; i ++ ) {

        var material = new THREE.MeshPhongMaterial( { specular: 0xffffff, shading: THREE.FlatShading, vertexColors: THREE.VertexColors } );

        var mesh = new THREE.Mesh( geometry, material );
        mesh.position.x = Math.floor( Math.random() * 20 - 10 ) * 20;
        mesh.position.y = Math.floor( Math.random() * 20 ) * 20 + 10;
        mesh.position.z = Math.floor( Math.random() * 20 - 10 ) * 20;
        this.scene.add( mesh );

        material.color.setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );

        this.objects.push( mesh );

    }
};

World.prototype.initRenderer = function() {
    var _this = this;

    this.renderer = new THREE.WebGLRenderer({
        devicePixelRatio: 1,
        alpha: false,
        clearColor: 0xffffff,
        antialias: true
    });

    this.riftEffect = new THREE.OculusRiftEffect( this.renderer );

    document.getElementById('ipd').innerHTML =
            this.riftEffect.getInterpupillaryDistance().toFixed(3);

    document.body.appendChild( this.renderer.domElement );

    //
    var keyPressed = function(event) {
        switch ( event.keyCode ) {
            case 79: // o
                _this.riftEffect.setInterpupillaryDistance(
                        _this.riftEffect.getInterpupillaryDistance() - 0.001);
                document.getElementById('ipd').innerHTML =
                        _this.riftEffect.getInterpupillaryDistance().toFixed(3);
                break;
            case 80: // p
                _this.riftEffect.setInterpupillaryDistance(
                        _this.riftEffect.getInterpupillaryDistance() + 0.001);
                document.getElementById('ipd').innerHTML =
                        _this.riftEffect.getInterpupillaryDistance().toFixed(3);
                break;

            case 70: // f
                if (!vr.isFullScreen()) {
                    vr.enterFullScreen();
                } else {
                    vr.exitFullScreen();
                }
                e.preventDefault();
                break;

            case 32: // space
                vr.resetHmdOrientation();
                e.preventDefault();
                break;
        }
    };

    window.addEventListener( 'resize', this.onWindowResize, false );
    document.addEventListener( 'keydown', keyPressed, false );


};

World.prototype.onWindowResize = function() {};

World.prototype.animate = function() {
    
    var _this = this;

    var loop = function() {
        vr.requestAnimationFrame(loop);

        _this.controls.isOnObject( false );

        _this.ray.ray.origin.copy( _this.controls.getObject().position );
        _this.ray.ray.origin.y -= 10;

        var intersections = _this.ray.intersectObjects( _this.objects );
        if ( intersections.length > 0 ) {
            var distance = intersections[ 0 ].distance;
            if ( distance > 0 && distance < 10 ) {
                _this.controls.isOnObject( true );
            }
        }

        // Poll VR, if it's ready.
        var polled = vr.pollState(_this.vrstate);
        _this.controls.update( Date.now() - _this.time, polled ? _this.vrstate : null );


        _this.pointer.toggle(_this.pointer.pointers[0], _this.vrstate.sixense.present);
        _this.pointer.toggle(_this.pointer.pointers[1], _this.vrstate.sixense.present);
        if (_this.vrstate.sixense.present) {
          _this.pointer.update(
            _this.pointer.pointers[0],
            _this.vrstate.sixense.controllers[0]);
          _this.pointer.update(_this.pointer.pointers[1], _this.vrstate.sixense.controllers[1]);

        } else {
          // Not plugged in.
          console.log('Sixense controller not found!');
        }


        //renderer.render( scene, camera );
        _this.riftEffect.render( _this.scene, _this.camera, polled ? _this.vrstate : null );

        _this.time = Date.now();
    };

    loop();
};

World.prototype.ShowGUI = function(text, actions) {
    var geometry = new THREE.PlaneGeometry( 20, 20 );

    for ( var i = 0, l = geometry.faces.length; i < l; i ++ ) {

        var face = geometry.faces[ i ];
        face.vertexColors[ 0 ] = new THREE.Color().setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );
        face.vertexColors[ 1 ] = new THREE.Color().setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );
        face.vertexColors[ 2 ] = new THREE.Color().setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );
        face.vertexColors[ 3 ] = new THREE.Color().setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );

    }

    var material = new THREE.MeshPhongMaterial( { specular: 0xffffff, shading: THREE.FlatShading, vertexColors: THREE.VertexColors } );
    // var material = new THREE.MeshNormalMaterial();

    var mesh = new THREE.Mesh( geometry, material );

    // mesh.position = this.camera.position;
    mesh.position.x = this.camera.position.x;
    mesh.position.y = this.camera.position.y;
    mesh.position.z = this.camera.position.z;
    mesh.position.x += 2;

    this.scene.add( mesh );

    material.color.setRGB( 255, 0, 0 );

    this.objects.push( mesh );

    window.myMesh = mesh;
};


/************* HYDRA SUPPORT ******************/
World.prototype.pointer = {};
World.prototype.pointer.defaultMaterial = new THREE.MeshLambertMaterial({
        color: 0xCC0000
      });
World.prototype.pointer.activeMaterial = new THREE.MeshLambertMaterial({
color: 0x00CC00
});

World.prototype.pointer.create = function(world) {
    var container = new THREE.Object3D();
    container.useQuaternion = true;
    world.scene.add(container);

    var arrow = new THREE.ArrowHelper(
        new THREE.Vector3(0, 0, -1),
        new THREE.Vector3(0, 0, 0),
        50,
        0x00CC00);
    container.add(arrow);

    var axis = new THREE.AxisHelper(50);
    container.add(axis);

    var ball = new THREE.Mesh(
        new THREE.SphereGeometry(10, 16, 16),
        this.defaultMaterial);
    container.add(ball);

    return {
      container: container,
      ball: ball
    };
};

World.prototype.pointer.init = function(world) {
    var _this = this;

    this.update = function(pointer, controller) {
        var container = pointer.container;
        container.position.x = controller.position[0];
        container.position.y = controller.position[1];
        container.position.z = controller.position[2];
        container.quaternion.x = controller.rotation[0];
        container.quaternion.y = controller.rotation[1];
        container.quaternion.z = controller.rotation[2];
        container.quaternion.w = controller.rotation[3];

        var ball = pointer.ball;
        ball.material = controller.buttons ? _this.activeMaterial : _this.defaultMaterial;
        ball.position.x = controller.joystick[0] * 10;
        ball.position.y = controller.joystick[1] * 10;
        ball.scale.x = 1 + controller.trigger;
        ball.scale.y = 1 + controller.trigger;
        ball.scale.z = 1 + controller.trigger;
    };

    this.pointers = [this.create(world), this.create(world)];
};

World.prototype.pointer.toggle = function(pointer, visible) {
    pointer.container.traverse(function(object) {
      object.visible = visible;
    });
};