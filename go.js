$(function() {
  var width = 800,
      height = 600,
      scrollThreshold = 300,
      accelerationRate = 0.4,
      decelerationRate = 0.1,
      collisionTolerance = 0.01,
      oscillatorAccelerationRate = 0.1,
      oscillatorMaximumRate = 2,
      oscillatorMaximumDisplacement = 100,
      maximumXRate = 4,
      jumpSpeed = 10,
      gravityRate = 0.5,
      playerInitialPosition = {x: 400, y: 380},
      r = Raphael("map", width, height);

  $(r).focus();

  var target = r.rect(1390, 420, 200, 20, 0);
  var oscillator = r.rect(1190, 220, 200, 20, 0);
  var terrain = [
    r.rect(50, 400, 700, 100, 0),
    r.rect(50, 320, 200, 100, 0),
    r.rect(550, 320, 200, 100, 0),
    r.rect(350, 220, 200, 20, 0),
    r.rect(50, 120, 200, 20, 0),
    r.rect(790, 420, 200, 20, 0),
    r.rect(990, 320, 200, 20, 0),
    oscillator,
    r.rect(1290, 200, 200, 20, 0),
    target
  ];
  var terrainSet = r.set();
  var completeSet = r.set();
  $.each(terrain, function(index,item) {terrainSet.push(item); completeSet.push(item);});
  terrainSet.push(terrain);
  terrainSet.attr({fill: "#0a0", 'stroke-width': 0});
  target.attr({'target': true, 'fill': '#00f'});

  var xMomentum = 0;
  var yMomentum = 0;
  var environmentalMomentum = 0;
  var totalXMomentum = 0;

  // var background = r.rect(0, 0, width, height).attr({fill: "90-#222-#000"}).toBack();
  var background = r.circle(400, 300, width/1.55).attr({fill: "r#222-#000"}).toBack();
  var player = r.rect(playerInitialPosition['x'], playerInitialPosition['y'], 20, 10)
    .attr({
      'stroke-width': 0, 
      'fill': "#f00",
      'opacity': 1
    })
    .toFront();

  completeSet.push(player);

  var keyFunctionMap = { 
    '37': function (amount) { alterXMomentum(-1 * amount) },
    '38': jump,
    '39': function (amount) { alterXMomentum(amount) }
    // '40': function (amount) { alterYMomentum(amount) }
  };

  var keyStatus = {
    '37': false,
    '38': false,
    '39': false
    // '40': false
  };

  // Set up key bindings
  $(window).keydown(function(e) {
    if (e.keyCode in keyStatus)
      keyStatus[e.keyCode] = true;
  });
  $(window).keyup(function(e) {
    if (e.keyCode in keyStatus)
      keyStatus[e.keyCode] = false;
  });

  function loop() {
    moveOscillator();
    computePlayerMomentumChanges();
    player.translate(xMomentum + environmentalMomentum, yMomentum);
    checkDeath();
    checkDeceleration();
    doGravity();
    checkScroll();
    checkCollisions();
  }
  var loopInterval = setInterval(loop, 20);

  function computePlayerMomentumChanges() {
    $.each(keyStatus, function(key, value) {
        if (value == true) {
          keyFunctionMap[key](accelerationRate);
        }
        else if (key == '38') {
          preventJump = false;
        }
      });
    totalXMomentum = xMomentum + environmentalMomentum;
  }

  function alterXMomentum(amount) {
    xMomentum = xMomentum + amount;
    if (xMomentum > maximumXRate)
      xMomentum = maximumXRate;
    if (xMomentum < -maximumXRate)
      xMomentum = -maximumXRate;
  }
  function alterYMomentum(amount) {
    yMomentum = yMomentum + amount;
  }
  function checkDeceleration() {
    if (keyStatus['37'] || keyStatus['39']) {
      return;
    }
    else {
      if (xMomentum <= -decelerationRate)
        xMomentum += decelerationRate;
      else if (xMomentum >= decelerationRate)
        xMomentum -= decelerationRate;
      else
        xMomentum = 0;
    }
  }
  
  function doGravity() {
    yMomentum += gravityRate;
  }

  var inTheAir = true;
  var preventJump = false;
  function jump() {
    if (!inTheAir && !preventJump) {
      yMomentum = -jumpSpeed;
      preventJump = true;
    }
  }

  function checkCollisions() {
    inTheAir = true;
    $.each(terrain, function(index, thing) {
      if (rectangleIntersectsRectangle(player, thing)) {
        if (thing.attr('target')) {
          displayWin();
        }

        if (yMomentum > 0
          && player.attr('y') + player.attr('height') - yMomentum < thing.attr('y')
          && player.attr('y') + player.attr('height') >= thing.attr('y')) {
          // Player landed on it
          yMomentum = 0;
          player.attr('y', thing.getBBox().y - player.getBBox().height);
          inTheAir = false;
        }
        else if (yMomentum < 0 
          && player.attr('y') - yMomentum > thing.attr('y') + thing.attr('height')
          && player.attr('y') <= thing.attr('y') + thing.attr('height')) {
          // Player hit it from the bottom
          yMomentum = 0;
          player.attr('y', thing.getBBox().y + thing.getBBox().height);
        }

        if (totalXMomentum > 0
          && player.attr('x') + player.attr('width') - totalXMomentum <= thing.attr('x')
          && player.attr('x') + player.attr('width') >= thing.attr('x')) {
          totalXMomentum = 0;
          player.attr('x', thing.attr('x') - player.attr('width'));
        }
        else if (totalXMomentum < 0
          && player.attr('x') - totalXMomentum >= thing.attr('x') + thing.attr('width')
          && player.attr('x') <= thing.attr('x') + thing.attr('width')) {
          totalXMomentum = 0;
          player.attr('x', thing.attr('x') + thing.attr('width'));
        }

      }
    });
  }

  function checkScroll() {
    if (
        (player.attr('x') < scrollThreshold && xMomentum < 0) ||
        (width - (player.attr('x') + player.attr('width')) < scrollThreshold && xMomentum > 0)
    ) {
      completeSet.translate(-xMomentum, 0);
    }
  }
  var oscillatorMomentum = 0;
  var oscillatorDisplacement = 0;
  var oscillatorDirection = 1;
  function moveOscillator() {
    if (oscillatorDisplacement <= 0) {
      oscillatorDirection = 1;
    }
    else if (oscillatorDisplacement >= oscillatorMaximumDisplacement) {
      oscillatorDirection = -1;
    }

    oscillatorMomentum += oscillatorDirection * oscillatorAccelerationRate;
    if (Math.abs(oscillatorMomentum) > oscillatorMaximumRate)
      oscillatorMomentum = oscillatorDirection * oscillatorMaximumRate;

    oscillator.translate(oscillatorMomentum, 0);
    oscillatorDisplacement += oscillatorMomentum;

    if (rectangleAdjacentToRectangle(player, oscillator))
      environmentalMomentum = oscillatorMomentum;
    else
      environmentalMomentum = 0;
  }

  function checkDeath() {
    if (player.attr('y') > height) {
      // you're dead
      clearInterval(loopInterval);

      $.each(completeSet, function(index, item) { item.hide() });
      r.text(404, 304, "GAME\nOVER").attr({'font-size': 180, fill: "#280000", 'stroke-width': 20, 'stroke': '#280000'});
      r.text(400, 300, "GAME\nOVER").attr({'font-size': 180, fill: "red"});
    }
  }

  function displayWin() {
    clearInterval(loopInterval);
    // $.each(completeSet, function(index, item) { item.hide() });
    r.text(402, 152, "YOU\nWIN!").attr({'font-size': 100, 'fill': '#002800', 'stroke-width': 10, 'stroke': '#002800'});
    r.text(400, 150, "YOU\nWIN!").attr({'font-size': 100, fill: 'green'});
  }


  //
  // Collision detection
  //

  function rectangleIntersectsRectangle(r1, r2) {
    var dim1 = r1.getBBox();
    var dim2 = r2.getBBox();

    if (dim1.x + dim1.width > dim2.x && dim1.x < dim2.x + dim2.width) {
      if (dim1.y + dim1.height > dim2.y && dim1.y < dim2.y + dim2.height) {
        return true;
      }
    }
  }

  function rectangleAdjacentToRectangle(r1, r2) {
    var dim1 = r1.getBBox();
    var dim2 = r2.getBBox();

    if (dim1.x + dim1.width >= dim2.x && dim1.x <= dim2.x + dim2.width) {
      if (dim1.y + dim1.height >= dim2.y && dim1.y <= dim2.y + dim2.height) {
        return true;
      }
    }
  }

  function rectangleIntersectsCircle(theRectangle, theCircle) {
    var distanceX = Math.abs(theCircle.attr('cx') - theRectangle.attr('x') - theRectangle.attr('width')/2);
    var distanceY = Math.abs(theCircle.attr('cy') - theRectangle.attr('y') - theRectangle.attr('height')/2);

    if (distanceX > (theRectangle.attr('width')/2 + theCircle.attr('r'))) { return false; }
    if (distanceY > (theRectangle.attr('height')/2 + theCircle.attr('r'))) { return false; }

    if (distanceX <= (theRectangle.attr('width')/2)) { return true; } 
    if (distanceY <= (theRectangle.attr('height')/2)) { return true; } 

    var cornerDistance_sq = Math.pow((distanceX - theRectangle.attr('width')/2), 2) +
                            Math.pow((distanceY - theRectangle.attr('height')/2), 2);

    return (cornerDistance_sq <= Math.pow(theCircle.r, 2));
  }

});
