//canvas setup
const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');
canvas.width = 1920;
canvas.height= 1080;

//collision mapping
const collisionsMap = [];
const boundaries = [];
const walkablesMap = [];
const walkableBoundaries = [];
class Boundary {
    static defaultWidth = 64;
    static defaultHeight = 64;
    constructor({position, width = Boundary.defaultWidth, height = Boundary.defaultHeight}){
        this.position = position;
        this.width = width;
        this.height = height;
    }
    draw(){
        c.fillStyle = 'rgba(255, 0, 0, 0.3)';
        c.fillRect(this.position.x, this.position.y, this.width, this.height);
    }
}
const offset = {
    x: -300,
    y: -1200
}

for(let i = 0; i < collisions.length; i += 70){
    collisionsMap.push(collisions.slice(i, i + 70));
}
for(let i = 0; i < walkables.length; i += 70){
    const row = walkables.slice(i, i + 70).map(symbol => symbol === 99); // Assuming 99 represents walkable
    walkablesMap.push(row);
}

collisionsMap.forEach((row, i) => {
    row.forEach((symbol, j) => {
        if(symbol === 95){
            boundaries.push(new Boundary({
                    position: {
                        x: j * Boundary.defaultWidth + offset.x,
                        y: i * Boundary.defaultHeight + offset.y
                    }
                })
            )
        }
    })
})
walkablesMap.forEach((row, i) => {
    row.forEach((isWalkable, j) => {
        if(isWalkable){
            walkableBoundaries.push(new Boundary({
                position: {
                    x: j * Boundary.defaultWidth + offset.x,
                    y: i * Boundary.defaultHeight + offset.y
                }
            }));
        }
    });
});

//images loading and drawing
function createImage(src) {
    const img = new Image();
    img.onload = () => {
        console.log(`Image loaded from ${src}`);
    };
    img.src = src;
    return img;
}
const images = {
    house: {
        default: createImage('./img/House_Blue.png'),
        construct: createImage('./img/House_Construction.png'),
        destroyed: createImage('./img/House_Destroyed.png')
    },
    castle: {
        default: createImage('./img/Castle_Blue.png'),
        construct: createImage('./img/Castle_Construction.png'),
        destroyed: createImage('./img/Castle_Destroyed.png')
    },
    pawnB: {
        default: createImage('./img/Warrior_Blue.png'),
        dead: createImage('./img/Dead.png')
    },
    torchGoblin: {
        default: createImage('./img/Torch_Red.png'),
        dead: createImage('./img/Dead.png')
    }
};
const map = new Image();
map.src = './img/map2.png';
const healtBg = new Image();
healtBg.src = './img/Health_Bg.png';
const pointer = new Image();
pointer.src = './img/Pointer.png';

//sound loading
class SoundManager {
    constructor() {
        this.sounds = {};
        this.currentlyPlaying = {};
    }
    loadSound(name, src) {
        this.sounds[name] = src;
    }
    playSound(name, duration = null, volume = 1.0, loop = false, allowOverlap = false) {
        if (this.sounds[name]) {
            const sound = new Audio(this.sounds[name]); // Create a new Audio object
            sound.volume = volume; // Set the volume
            sound.loop = loop; // Set the loop
            sound.currentTime = 0; // Rewind to the start
            sound.play();

            if (!allowOverlap) {
                this.stopSound(name);
            }

            if (loop) {
                this.currentlyPlaying[name] = sound; // Track the looping sound
            }

            if (duration && !loop) {
                setTimeout(() => {
                    sound.pause();
                    sound.currentTime = 0;
                }, duration);
            }
        }
    }
    stopSound(name) {
        if (this.currentlyPlaying[name]) {
            this.currentlyPlaying[name].pause();
            this.currentlyPlaying[name].currentTime = 0;
            delete this.currentlyPlaying[name];
        }
    }
}
const soundManager = new SoundManager();
soundManager.loadSound('buildingCompleted', './sounds/buildingCompleted.mp3');
soundManager.loadSound('constructing', './sounds/constructing.mp3');
soundManager.loadSound('cameraMovement', './sounds/cameraMovement.mp3');
soundManager.loadSound('selection', './sounds/selection.mp3');
soundManager.loadSound('seaWavesAmbient', './sounds/seaWavesAmbient.mp3');
soundManager.loadSound('natureSoundsAmbient', './sounds/natureSoundsAmbient.mp3');
soundManager.loadSound('walking', './sounds/walking.mp3');
soundManager.loadSound('knightHit', './sounds/knightHit.mp3');
soundManager.loadSound('knightDie', './sounds/knightDie.mp3');
soundManager.loadSound('swordSwingShort', './sounds/swordSwingShort.mp3');
soundManager.loadSound('torchSlashLong', './sounds/torchSlashLong.mp3');
soundManager.loadSound('goblinHit', './sounds/goblinHit.mp3');
soundManager.loadSound('goblinDie', './sounds/goblinDie.mp3');
soundManager.loadSound('goblinWalking', './sounds/goblinWalking.mp3');
soundManager.loadSound('bgMusic', './sounds/bgMusic.mp3');
soundManager.loadSound('bgMusic2', './sounds/bgMusic2.mp3');
let ambientSoundStarted = false;

//classes
class Sprite{
    constructor({position, image, frames = {max: 1, rows: 1}, hitbox, animation, direction = 0}){
        this.position = position;
        this.image = image;
        this.frames = {...frames, val: 0, elapsed: 0};
        
        this.hitbox = hitbox;
        this.animation = animation;
        this.moving = false;
        this.direction = this.direction; //0 - right, 1 - left
        this.image.onload = () => {
            this.width = this.image.width / this.frames.max;
            this.height = this.image.height / this.frames.max;
        };
        if (this.image.complete) {
            this.width = this.image.width / this.frames.max;
            this.height = this.image.height / this.frames.rows;
        }
    }
    draw(){
        c.save();
        if(this.direction === 1){
            // Flip the image vertical
            c.translate(this.position.x + this.width, this.position.y);
            c.scale(-1, 1);
            c.drawImage(
                this.image, 
                this.frames.val * this.width, //crop begin x
                this.animation * this.height, //crop begin y
                this.image.width / this.frames.max, //crop width
                this.image.height / this.frames.rows, //crop height
                0, // this.position.x - pivot point for flipping
                0, // this.position.y - pivot point for flipping
                this.image.width / this.frames.max, //render width
                this.image.height / this.frames.rows, //render height
            );
        } 
        else {
            // Draw the image normally
            c.drawImage(
                this.image, 
                this.frames.val * this.width, //crop begin x
                this.animation * this.height, //crop begin y
                this.image.width / this.frames.max, //crop width
                this.image.height / this.frames.rows, //crop height
                this.position.x,
                this.position.y,
                this.image.width / this.frames.max, //render width
                this.image.height / this.frames.rows, //render height
            );
        }
        c.restore();
        
        if(this.frames.max > 1){
            this.frames.elapsed++;
        }
        if(this.frames.elapsed % 10 === 0){
            if(this.frames.val < this.frames.max - 1){
                this.frames.val++;
            }
            else{
                this.frames.val = 0;
            }
        }
    }
}
class Building extends Sprite {
    constructor(
    {position, image, frames = {max: 1, rows: 1}, 
    hitbox, animation, health,
    destroyImg = null, constructImg = null, type = 'building',
    }){
        super({position, image, frames, hitbox, animation});
        this.health = health;
        this.defaultImg = image;
        this.destroyImg = destroyImg;
        this.constructImg = constructImg;
        this.isDestroyed = false;
        this.isConstructed = false;
        this.type = type;

        //collision for building
        this.boundary = new Boundary({
            position: {
                x: this.position.x,
                y: this.position.y,
            },
            width: this.hitbox.width,
            height: this.hitbox.height,
        });
        this.buildingConstruct();
        boundaries.push(this.boundary);
        buildings.push(this);
        stationaries.push(this.boundary);
        stationaries.push(this);
    }
    buildingConstruct(){
        const rnd = Math.floor(Math.random() * (15000 - 5000 + 1)) + 5000;

        if (!this.isConstructed) {
            //Adjust the boundary for not yet constructed building
            this.image = this.constructImg;
            if (this.type === 'house') {
                this.boundary.position.x += 20;
                this.boundary.position.y += 86;
            }
            else if (this.type === 'castle') {
                this.boundary.position.x += 25;
                this.boundary.position.y += 148;
            }
            const attemptConstructionCompletion = () => {
                //Check for collision with pawnB
                let collisionDetected = false;
                for (const pawn of pawns) {
                    let tempBoundary = {
                        position: { ...this.boundary.position },
                        width: this.boundary.width,
                        height: this.boundary.height
                    };
            
                    // Adjust the temporary boundary based on the building type
                    if (this.type === 'house') {
                        tempBoundary.position.y -= 55;
                        tempBoundary.height += 32;
                    } else if (this.type === 'castle') {
                        tempBoundary.position.y -= 100;
                        tempBoundary.height += 86;
                    }
            
                    // Check for collision with the current pawn using the temporary boundary
                    const collision = rectangularCollision({
                        rectangle1: pawn,
                        rectangle2: tempBoundary
                    });
            
                    if (collision) {
                        collisionDetected = true;
                        break; // Exit the loop
                    }
                }
                if (!collisionDetected) {
                    // If no collision with any pawn, complete construction
                    this.isConstructed = true;
                    soundManager.playSound('buildingCompleted', null, 0.1, false, true);
                    this.image = this.defaultImg;
                    
                    // Adjust the boundary for the constructed building
                    if (this.type === 'house') {
                        this.boundary.position.y -= 55;
                        this.boundary.height += 32;
                    } else if (this.type === 'castle') {
                        this.boundary.position.y -= 100;
                        this.boundary.height += 86;
                    }
                } else {
                    // If there is a collision, try again after a delay
                    setTimeout(attemptConstructionCompletion, 100);
                }
            };
            setTimeout(attemptConstructionCompletion, rnd);
        }
    }
    buildingDestroy() {
        if (this.isDestroyed) return; //Prevent multiple calls to buildingDestroy
        this.isDestroyed = true;
        if (this.destroyImg) {
            this.image = this.destroyImg;
            //Remove from collsions
            const boundaryIndex = boundaries.indexOf(this.boundary);
            if (boundaryIndex > -1) {
                boundaries.splice(boundaryIndex, 1); 
            }
        }
        setTimeout(() => {
            //Remove from buildings
            const buildingIndex = buildings.indexOf(this);
            if (buildingIndex > -1) {
                buildings.splice(buildingIndex, 1);
            }
        }, 2000); 
    }
}
class Pawn extends Sprite {
    constructor({ position, image, frames = { max: 1, rows: 1 }, hitbox, animation, health, type, deadImg }) {
        super({ position, image, frames, hitbox, animation });
        this.health = health;
        this.type = type;
        this.isAlive = true;
        this.isMoving = false;
        this.deadImg = deadImg;
        this.deadAnimationPlayed = false;
        this.deadAnimationFinished = false;
        this.attackCounter = 0;
        this.currentAnimation = null;
    }
    draw() {
        if (!this.isAlive && !this.deadAnimationPlayed) {
            this.image = this.deadImg;
            this.frames = {
                max: 7,
                rows: 2,
                val: 0,
                elapsed: 0
            };
            this.width = this.image.width / this.frames.max;
            this.height = this.image.height / this.frames.rows;
            this.deadAnimationPlayed = true;
        }

        if (this.isAlive) {
            super.draw();
            // for debug:
            if (this.isSelected) {
                c.lineWidth = 2;
                c.fillStyle = 'rgba(255, 0, 0, 0.6)';
                const centerX = this.position.x + this.width / 2;
                const triangleHeight = -20; 
                const triangleWidth = 40;

                c.beginPath();
                c.moveTo(centerX, this.position.y); // Top point of the triangle
                c.lineTo(centerX - triangleWidth / 2, this.position.y + triangleHeight); // Bottom-left point
                c.lineTo(centerX + triangleWidth / 2, this.position.y + triangleHeight); // Bottom-right point
                c.closePath();
                
                c.fill();
            }
        } 
        else {
            // If not alive, handle the death animation
            if (!this.deadAnimationFinished) {
                if (this.frames.elapsed % 10 === 0) {
                    if (this.frames.val < this.frames.max * this.frames.rows - 1) {
                        this.frames.val++;
                    } else {
                        this.deadAnimationFinished = true;
                    }
                }
                this.frames.elapsed++;
            }
            // Draw the current frame of the death animation or the last frame if finished
            c.drawImage(
                this.image,
                (this.frames.val % this.frames.max) * this.width,
                Math.floor(this.frames.val / this.frames.max) * this.height,
                this.width,
                this.height,
                this.position.x,
                this.position.y, 
                this.width,
                this.height 
            );
        }       
    }
    triggerBox() {
        const attackRange = 150;
        let goblinInRange = false;
        const triggerBox = {
            position: {
                x: this.position.x - this.width / 2,
                y: this.position.y - this.height / 2
            },
            width: this.width * 2,
            height: this.height * 2
        };
        // Check for any goblins within the trigger box
        for (const goblin of goblins) {
            if (goblin.isAlive && rectangularCollision({
                rectangle1: goblin,
                rectangle2: triggerBox
            })) {
                const dx = goblin.position.x + goblin.width / 2 - (this.position.x + this.width / 2);
                const dy = goblin.position.y + goblin.height / 2 - (this.position.y + this.height / 2);
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // If the goblin is within the attack range, attack it
                if (distance < attackRange) {
                    goblinInRange = true;
                    this.animation = 2;
                    if (!this.isMoving) {
                        this.direction = (goblin.position.x + goblin.width / 2) < triggerBox.position.x + (triggerBox.width / 2) ? 1 : 0;
                    }
                    this.attackCounter++;
                    if (this.attackCounter % 100 === 0) {
                        goblin.takeDamage(10);
                        this.attackCounter = 0;
                    }
                    break;
                }
                return goblin; // Return the goblin
            }
        }
        if (!goblinInRange && !this.isMoving) {
            this.animation = 0;
        }
        return null; // Return null if no goblin are inside the trigger box
    }
    moveTo(target) {
        const pawnCenter = {
            x: this.position.x + this.width / 2,
            y: this.position.y + this.height / 2
        };
        
        // Calculate the direction from the pawn to the target point
        const dx = target.x - pawnCenter.x;
        const dy = target.y - pawnCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Change animation direction 
        if (this.isMoving) {
            this.direction = dx < 0 ? 1 : 0;
        }

        if (distance < 5) {
            this.animation = 0;
            this.isMoving = false;
            currentPoint = null;
            return true; // Pawn has reached the target
        } 
        else {
            this.isMoving = true;
            this.animation = 1;
            const speed = 2;
            const moveX = (dx / distance) * speed;
            const moveY = (dy / distance) * speed;

            const nextPosition = {
                x: pawnCenter.x + moveX - this.width / 2,
                y: pawnCenter.y + moveY - this.height / 2
            };

            // Define the pawn's future bounding box based on the next position
            const futureBoundingBox = {
                position: {
                    x: nextPosition.x,
                    y: nextPosition.y
                },
                hitbox: {
                    width: this.hitbox.width,
                    height: this.hitbox.height
                }
            };

            // Check for collision with boundaries
            const willCollide = boundaries.some(boundary => rectangularCollision({
                rectangle1: futureBoundingBox,
                rectangle2: boundary
            }));

            if (!willCollide) {
                // If no collision, move the pawn
                this.position.x = nextPosition.x;
                this.position.y = nextPosition.y;
            }
        }
        return false; // Pawn is still moving towards the target
    }
    takeDamage(damage) {
        this.health -= damage;
        soundManager.playSound('knightHit', null, 0.07, false, true)
        if (this.health <= 0) {
            this.health = 0;
            this.isAlive = false;
            soundManager.playSound('knightDie', null, 0.2, false, true)
            setTimeout(() => {
                alert("You died. Game Over");
            }, 1000); 
        }
    }
    playAnimationSound() {
        if (this.animation !== this.currentAnimation) {
            this.currentAnimation = this.animation;
            switch (this.animation) {
                case 1: // Walking animation
                    soundManager.stopSound('swordSwingShort');
                    soundManager.playSound('walking', null, 0.05, true, false);
                    break;
                case 2: // Attack animation
                    soundManager.stopSound('walking');
                    soundManager.playSound('swordSwingShort', null, 0.1, true, true);
                    break;
                default:
                    soundManager.stopSound('walking');
                    soundManager.stopSound('swordSwingShort');
                    break;
            }
        }
    }   
}
class TorchGoblin extends Sprite {
    constructor({ position, image, frames = { max: 1, rows: 1 }, hitbox, animation, health, type, deadImg }) {
        super({ position, image, frames, hitbox, animation });
        this.health = health;
        this.type = type;
        this.attackCounter = 0;
        this.isAlive = true;
        this.deadImg = deadImg;
        this.deadAnimationPlayed = false;
        this.deadAnimationFinished = false;
        this.currentAnimation = null;
    }
    draw() {
        if (!this.isAlive && !this.deadAnimationPlayed) {
            this.image = this.deadImg;
            this.frames = {
                max: 7,
                rows: 2,
                val: 0,
                elapsed: 0
            };
            this.width = this.image.width / this.frames.max;
            this.height = this.image.height / this.frames.rows;
            this.deadAnimationPlayed = true;
        }

        if (this.isAlive) {
            super.draw();
        } 
        else {
            // If not alive, handle the death animation
            if (!this.deadAnimationFinished) {
                if (this.frames.elapsed % 10 === 0) {
                    if (this.frames.val < this.frames.max * this.frames.rows - 1) {
                        this.frames.val++;
                    } else {
                        this.deadAnimationFinished = true;
                    }
                }
                this.frames.elapsed++;
            }
            // Draw the current frame of the death animation or the last frame if finished
            c.drawImage(
                this.image,
                (this.frames.val % this.frames.max) * this.width,
                Math.floor(this.frames.val / this.frames.max) * this.height,
                this.width,
                this.height,
                this.position.x,
                this.position.y, 
                this.width,
                this.height 
            );
        }
    }
    triggerBox() {
        const triggerBox = {
            position: {
                x: this.position.x - this.width / 2,
                y: this.position.y - this.height / 2
            },
            width: this.width * 2,
            height: this.height * 2
        };

        //for debug:
        /* c.strokeStyle = 'orange';
        c.lineWidth = 2;
        c.strokeRect(triggerBox.position.x, triggerBox.position.y, triggerBox.width, triggerBox.height); */

        // Check for any pawns within the trigger box and return the first one
        for (const pawn of pawns) {
            if (pawn.isAlive && rectangularCollision({
                rectangle1: pawn,
                rectangle2: triggerBox
            })) {
                return pawn; // Return the first pawn found inside the trigger box
            }
        }
        return null; // Return null if no pawns are inside the trigger box
    }
    moveTo() {
        const targetPawn = this.triggerBox();
        
        if (!targetPawn) {
            // If there's no target pawn, don't move
            this.animation = 0; // idle animation
            return;
        }

        const triggerBoxLeftEdge = this.position.x - this.width / 2;
        const triggerBoxRightEdge = this.position.x + this.width / 2;
        const pawnIsCloserToLeft = (targetPawn.position.x + targetPawn.width / 2) < (triggerBoxLeftEdge + (triggerBoxRightEdge - triggerBoxLeftEdge) / 2);

        // Set the target position to the opposite side of the target pawn
        const target = {
            x: pawnIsCloserToLeft ? targetPawn.position.x + targetPawn.width /2 : targetPawn.position.x - this.width /2,
            y: targetPawn.position.y 
        };

        // Calculate the direction from the goblin to the target point
        const dx = target.x - this.position.x;
        const dy = target.y - this.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        this.direction = dx < 0 && pawnIsCloserToLeft > 0 ? 1 : 0;

        if (distance < 50) {
            this.animation = 2;
            this.attackCounter++;
            if (this.attackCounter % 100 === 0) {
                targetPawn.takeDamage(5);
                this.attackCounter = 0;
            }
        } else {
            this.animation = 1; // walking animation
        }

        if (distance < 5) {
            this.moving = false;
            if (this.animation !== 2) {
                this.animation = 0; // idle animation
            }
            return true; // Target has been reached
        } else {
            this.moving = true;
            const speed = 1.5;
            const moveX = (dx / distance) * speed;
            const moveY = (dy / distance) * speed;
            
            // Check for collision with boundaries before moving
            const willCollide = boundaries.some(boundary => rectangularCollision({
                rectangle1: {
                    position: {
                        x: this.position.x + moveX,
                        y: this.position.y + moveY
                    },
                    hitbox: {
                        width: this.hitbox.width,
                        height: this.hitbox.height
                    }
                },
                rectangle2: boundary
            }));
            
            if (!willCollide) {
                this.position.x += moveX;
                this.position.y += moveY;
            } else {
                this.moving = false;
                this.animation = 0; // idle animation
            }
            return false; // Target has not been reached, continue moving
        }
    }
    takeDamage(damage) {
        this.health -= damage;
        soundManager.playSound('goblinHit', null, 0.02, false, true)
        if (this.health <= 0) {
            this.health = 0;
            this.isAlive = false;
            soundManager.playSound('goblinDie', null, 0.07, false, true)
            soundManager.stopSound('goblinWalking');
            soundManager.stopSound('torchSlashLong');
            // remove from the goblins
            setTimeout(() => {
                const index = goblins.indexOf(this);
                if (index > -1) {
                    goblins.splice(index, 1);
                }
            }, 5000); 
        }
    }
    playAnimationSound() {
        if (this.animation !== this.currentAnimation) {
            this.currentAnimation = this.animation;
            switch (this.animation) {
                case 1: // Walking animation
                    soundManager.stopSound('torchSlashLong'); // Stop other sounds
                    soundManager.playSound('goblinWalking', null, 0.04, true, false);
                    break;
                case 2: // Attack animation
                    soundManager.stopSound('goblinWalking'); // Stop other sounds
                    soundManager.playSound('torchSlashLong', null, 0.07, true, false);
                    break;
                default:
                    soundManager.stopSound('goblinWalking');
                    soundManager.stopSound('torchSlashLong');
                    break;
            }
        }
    }
}

//creating objects, images, etc.
const buildings = [];
const pawns = [];
const goblins = [];
const allImagePromises = [];
//state of keys
const keys = {
    w: {
        pressed: false
    },
    s: {
        pressed: false
    },
    a: {
        pressed: false
    },
    d: {
        pressed: false
    }
}
let pressedKeys = []; //order of pressed kseys
let isSelecting = false;
let currentPoint = null;
let userInteracted = false;
const background = new Sprite({
    position: {
        x: offset.x,
        y: offset.y,
    },
    image: map,
    animation: 0,
});
Object.values(images).forEach(typeImages => {
    Object.values(typeImages).forEach(img => {
        allImagePromises.push(new Promise(resolve => {
            img.onload = resolve;
        }));
    });
});
Promise.all(allImagePromises).then(() => {
    //All images are loaded
    createPawn('pawnB', {x: 1000, y: 300});
    createTrochGoblin('torchGoblin', {x: 2100, y: 200});
    createTrochGoblin('torchGoblin', {x: 2650, y: -850});
    createTrochGoblin('torchGoblin', {x: 2500, y: -300});
    createTrochGoblin('torchGoblin', {x: 2850, y: 150});
    createTrochGoblin('torchGoblin', {x: 3000, y: -400});
    createTrochGoblin('torchGoblin', {x: 3000, y: -700});
    createTrochGoblin('torchGoblin', {x: 3300, y: -1000});
    createTrochGoblin('torchGoblin', {x: 3700, y: -150});
    createTrochGoblin('torchGoblin', {x: 1000, y: -500});
    createTrochGoblin('torchGoblin', {x: 0, y: -800});
    createTrochGoblin('torchGoblin', {x: 400, y: -600});
    createBuilding('house', {x: 750, y: 700});
    createBuilding('house', {x: 900, y: 100});
    createBuilding('house', {x: 950, y: -100});
    createBuilding('house', {x: 1100, y: 0});
    createBuilding('house', {x: 1300, y: 300});
    createBuilding('castle', {x: 800, y: 400});
    // Start the animation loop
    animate();
});
const stationaries = [background, ...boundaries, ...walkableBoundaries, ...buildings];//stationary objects, that should move with a camera (everything except UI)


function createPoint(position) {
    //Remove last Point from stationaries
    const index = stationaries.indexOf(currentPoint);
    if (index > -1) {
        stationaries.splice(index, 1);
    }
    currentPoint = {
        position: { ...position },
    };
    stationaries.push(currentPoint); 
}
function createBuilding(type, position) {
    if (type === 'house') {
        new Building({
            position: position,
            image: images[type].default,
            frames: {max: 1, rows: 1},
            hitbox: {width: 86, height: 64},
            animation: 0,
            health: 100,
            destroyImg: images[type].destroyed,
            constructImg: images[type].construct,
            type: type
        });
    }
    else if (type === 'castle') {
        new Building({
            position: position,
            image: images[type].default,
            frames: {max: 1, rows: 1},
            hitbox: {width: 270, height: 70},
            animation: 0,
            health: 100,
            destroyImg: images[type].destroyed,
            constructImg: images[type].construct,
            type: type
        });
    }
}
function createPawn(type, position) {
    const pawnImage = images[type].default;
    const pawnDeadImg = images[type].dead;
    const newPawn = new Pawn({
        frames: {max: 6, rows: 8},
        position: position,
        image: pawnImage,
        deadImg: pawnDeadImg,
        hitbox: { width: 32, height: 32 },
        animation: 0,
        health: 100,
        type: type,
    });
    pawns.push(newPawn);
    stationaries.push(newPawn);
}
function createTrochGoblin(type, position) {
    const torchGoblinImage = images[type].default;
    const torchGoblinDeadImg = images[type].dead;
    const newTorchGoblin = new TorchGoblin({
        frames: {max: 6, rows: 5},
        position: position,
        image: torchGoblinImage,
        deadImg: torchGoblinDeadImg,
        hitbox: { width: 32, height: 32 },
        animation: 0,
        health: 100,
        type: type
    });
    goblins.push(newTorchGoblin);
    stationaries.push(newTorchGoblin);
}
//collision between 2 rectangles/hitboxes
function rectangularCollision({rectangle1, rectangle2}) {
    return (
        rectangle1.position.x + 72 + rectangle1.hitbox.width >= rectangle2.position.x && 
        rectangle1.position.x + 72 <= rectangle2.position.x + rectangle2.width &&
        rectangle1.position.y + 72 <= rectangle2.position.y + rectangle2.height &&
        rectangle1.position.y + 72 + rectangle1.hitbox.height >= rectangle2.position.y
    )
}
function selectPawnsWithinArea() {
    const selectionRect = {
        position: selectionStart,
        width: selectionEnd.x - selectionStart.x,
        height: selectionEnd.y - selectionStart.y
    };

    pawns.forEach(pawn => {
        if (rectangularCollision({
            rectangle1: pawn,
            rectangle2: selectionRect
        })) {
            soundManager.playSound('selection', 3000, 0.5);
            pawn.isSelected = true;
            
        } else {
            pawn.isSelected = false;
        }
    });
}
function handleCameraMovement() {
    const movementSpeed = 3;
    if(keys.w.pressed && background.position.y <= 192) {
        stationaries.forEach(stationary => {
            stationary.position.y += movementSpeed;
        });
    }
    if(keys.s.pressed && background.position.y >= -2512) {
        stationaries.forEach(stationary => {
            stationary.position.y -= movementSpeed;
        });
    }
    if(keys.a.pressed && background.position.x <= 1024) {
        stationaries.forEach(stationary => {
            stationary.position.x += movementSpeed;
        });
    }
    if(keys.d.pressed && background.position.x >= -4380) {
        stationaries.forEach(stationary => {
            stationary.position.x -= movementSpeed;
        });
    }
}
function drawCurrentPoint() {
    if (currentPoint) {
        c.drawImage(pointer, currentPoint.position.x, currentPoint.position.y, 32, 32);
    }
}
function drawEnemyHealthBar(goblin){
    const barWidth = 60; // Width of the health bar
    const barHeight = 10; // Height of the health bar
    const barX = goblin.position.x + goblin.width / 2 - barWidth / 2; // Center the bar above the pawn
    const barY = goblin.position.y + 32; // Position the bar above the pawn

    // Draw the background of the health bar
    c.fillStyle = 'red';
    c.fillRect(barX, barY, barWidth, barHeight);

    // Draw the current health
    const healthWidth = (goblin.health / 100) * barWidth;
    c.fillStyle = 'green';
    c.fillRect(barX, barY, healthWidth, barHeight);
}
function drawHealthBar() {
    // health bar background
    const healthBgWidth = healtBg.width * 2;
    const healthBgHeight = healtBg.height + 32;
    const healthBgX = canvas.width / 2 - healtBg.width;
    const healthBgY = canvas.height - healtBg.height - 32;
    c.drawImage(healtBg, healthBgX, healthBgY, healthBgWidth, healthBgHeight);

    const firstPawn = pawns[0];

    if (firstPawn) {
        const barWidth = healthBgWidth - 64; 
        const barHeight = 40; 
        const barX = healthBgX + 32; 
        const barY = healthBgY + 16; 
        const radius = 20;

        // Current health
        const healthWidth = (firstPawn.health / 100) * barWidth;
        c.fillStyle = 'rgba(39, 189, 34, 0.8)';
        c.beginPath();
        c.moveTo(barX + radius, barY);
        c.arcTo(barX + healthWidth, barY, barX + healthWidth, barY + barHeight, radius);
        c.arcTo(barX + healthWidth, barY + barHeight, barX, barY + barHeight, radius);
        c.arcTo(barX, barY + barHeight, barX, barY, radius);
        c.arcTo(barX, barY, barX + healthWidth, barY, radius);
        c.closePath();
        c.fill();
    }
}

//Main function
function animate(){
    window.requestAnimationFrame(animate);
    background.draw(); 
    buildings.forEach(building => {
        building.draw();
        if (building.health <= 0 && !building.isDestroyed && building.isConstructed) {
            setTimeout(() => {
                building.buildingDestroy(); 
            }, 1000);
        }
    });
    // for debug:
    /* boundaries.forEach(Boundary => {
        Boundary.draw();
    });
    walkableBoundaries.forEach(boundary => {
        c.fillStyle = 'rgba(0, 255, 0, 0.3)'; // Green with some transparency
        c.fillRect(boundary.position.x, boundary.position.y, boundary.width, boundary.height);
    }); */
    pawns.forEach(pawn => {
        if(pawn.isAlive){
            pawn.triggerBox();
            pawn.draw();
            pawn.playAnimationSound();
            if (pawn.isSelected && currentPoint) {
                pawn.moveTo(currentPoint.position);
            }
            else{
                // If not selected, change animation to idle and remove current point
                pawn.animation = 0;
                currentPoint = null
                const index = stationaries.indexOf(currentPoint);
                if (index > -1) {
                    stationaries.splice(index, 1);
                } 
            }
        }
        else if(!pawn.isAlive){
           pawn.draw()
        }
    });
    goblins.forEach(goblin => {
        if(goblin.isAlive){
            goblin.draw();
            goblin.moveTo();
            goblin.playAnimationSound();
        }
        else if(!goblin.isAlive){
            goblin.draw();
        }
        drawEnemyHealthBar(goblin);
    });
    
    handleCameraMovement();
    
    if (isSelecting) {
        c.fillStyle = 'rgba(0, 0, 255, 0.3)';
        c.fillRect(
            selectionStart.x,
            selectionStart.y,
            selectionEnd.x - selectionStart.x,
            selectionEnd.y - selectionStart.y
        );
    }
    drawCurrentPoint();
    drawHealthBar();
} 

//event listeners
window.addEventListener('keydown', (e) => {
    //add key to array if it's not pressed yet
    if (!pressedKeys.includes(e.key)) pressedKeys.push(e.key)
    updateMovement();
});
window.addEventListener('keyup', (e) => {
    //remove key from table
    pressedKeys = pressedKeys.filter(key => key !== e.key);
    updateMovement();
});


canvas.addEventListener('mousedown', (e) => { // LMB
    if (e.button === 0) { // Left mouse button
        isSelecting = true;
        selectionStart = { x: e.offsetX, y: e.offsetY };
        selectionEnd = { ...selectionStart };

        // Play sounds only once
        if (!userInteracted) {
            soundManager.playSound('seaWavesAmbient', null, 0.05, true, false);
            soundManager.playSound('natureSoundsAmbient', null, 0.02, true, false);
            soundManager.playSound('bgMusic', null, 0.005, true, false);
            userInteracted = true;
        }
    }
});
canvas.addEventListener('contextmenu', (e) => { //RMB
    e.preventDefault(); //Prevent the RMB menu from appearing
    const mousePosition = { x: e.offsetX, y: e.offsetY };
    const anySelected = pawns.some(pawn => pawn.isSelected);
    if (anySelected) {
        createPoint(mousePosition);
    }
});
canvas.addEventListener('mousemove', (e) => {
    if (isSelecting) {
        //Update end point
        selectionEnd = { x: e.offsetX, y: e.offsetY };
    }
});
canvas.addEventListener('mouseup', (e) => {
    if (e.button === 0 && isSelecting) {
        //End of selection
        selectPawnsWithinArea();
        isSelecting = false;
    }
});

//movement for camera
let isCameraMoving = false;
function updateMovement() {
    //reset keys
    keys.w.pressed = false;
    keys.s.pressed = false;
    keys.a.pressed = false;
    keys.d.pressed = false;
    //set last key
    if (pressedKeys.includes('w')) keys.w.pressed = true;
    if (pressedKeys.includes('s')) keys.s.pressed = true;
    if (pressedKeys.includes('a')) keys.a.pressed = true;
    if (pressedKeys.includes('d')) keys.d.pressed = true;
    
    const anyKeyPressed = keys.w.pressed || keys.s.pressed || keys.a.pressed || keys.d.pressed;
    if (anyKeyPressed && !isCameraMoving) {
        soundManager.playSound('cameraMovement', null, 0.1, true, false);
        isCameraMoving = true;
    } 
    else if (!anyKeyPressed && isCameraMoving) {
        soundManager.stopSound('cameraMovement');
        isCameraMoving = false;
    }
}