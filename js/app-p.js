let audioContext;
let audioStart = false;
let cols; 
let rows; 
let cells; 
let size = 25; 
let offset = 2;
let blocks = [];
let lifeState = false;
let speedOfLife = 3;

class Block {
    constructor(x, y, z){
        this.x = x*size+1;
        this.y = y*size+1;
        this.z = z;
        this.state = false;
        this.r = random8bit();  
        this.g = random8bit(); 
        this.b = random8bit(); 
    }

    display() { 
        if (this.state) {this.drawRect();} 
        else {this.drawX();}
    }

    drawRect() {
        fill(this.r,this.g,this.b); 
        rect(this.x, this.y, size, size);
    }

    drawX() {
        fill(200); 
        rect(this.x, this.y, size, size);
    }

    move() {
        let cursor;
        cursor = dist(mouseX, mouseY, this.x+size/2, this.y+size/2);
        if (cursor < size/2) {this.drawRect();}
        else {if (this.state==false) {this.drawX();}}
    }

    click() {
        let cursor;
        cursor = dist(mouseX, mouseY, this.x+size/2, this.y+size/2);
        if (cursor < size/2) {this.state = !this.state};
        this.play(this.state);
    }

    returnState() { 
        let st = this.state;
        return st; 
    }

    chgState(x) {
        this.state = x;
        this.play(this.state);
    }

    play(playState) {

        const note = this.z % 127;
        const degree = Math.floor(this.z / 127);
        const velocity = 2;

        const now = device.context.currentTime * 1000;

        const noteOn  = new RNBO.MIDIEvent(now, 0, [144 + degree, note, velocity]);
        const noteOff = new RNBO.MIDIEvent(now, 0, [128 + degree, note, 0]);
        const noteDegree = new RNBO.MessageEvent(now, 'in1', [degree]);
        
        if (playState) { device.scheduleEvent(noteDegree); device.scheduleEvent(noteOn);}
        else {device.scheduleEvent(noteOff);}; 

        }
}

function setup() {

    let canvas = createCanvas(windowWidth-20, windowHeight-20);        
    cols = Math.floor(width/size+2);
    rows = Math.floor(height/size+2);
    
    for (let i=0, k=1; i<cols; i++) {
        blocks[i] = [];
        for (let j=0; j<rows; j++) {
            blocks[i][j] =  new Block(i,j,k);
            k++;
            }
        cells = k;
    }


    document.body.onclick = () => { 
        if (audioStart === false) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioContext.resume().then(() => { console.log('Playback resumed successfully'); });
        loadRNBO();
        }
    }
    
}

async function loadRNBO() {
    const { createDevice } = RNBO;
    await audioContext.resume();
    const rawPatcher = await fetch('export/patch.export-p.json');
    const patcher = await rawPatcher.json();
    device = await createDevice({ context: audioContext, patcher });
    device.node.connect(audioContext.destination);
    const cellsTotal = new RNBO.MessageEvent(device.context.currentTime * 1000, 'in2', [cells]);
    device.scheduleEvent(cellsTotal);
}

function startAudioContext() {
    if (audioContext.state === 'suspended') { audioContext.resume();}
}




//--------------------------------------------draw--------------------------------------------------------------------


function draw() {
    if (lifeState) { frameRate(speedOfLife)}
    else {frameRate(20)}
    
    fill(0);
    if (lifeState) { background(255); textSize(size); text('LIFE!',width/2,50);
        for (let i=0; i<cols; i++) { 
                for (let j=0; j<rows; j++) {
                     
                    let sum=0;                   
                    if (i > 0) { if (blocks[i-1][j].returnState()) { sum = sum+1; } }; 
                    if (i > 0 && j > 0) { if (blocks[i-1][j-1].returnState()) { sum = sum+1; } };
                    if (i > 0 && j < rows-1) { if (blocks[i-1][j+1].returnState()) { sum = sum+1; } }; 
                    if (j > 0) { if (blocks[i][j-1].returnState()) { sum = sum+1; } };
                    if (j < rows-1) { if (blocks[i][j+1].returnState()) { sum = sum+1; } };
                    if (i < cols-1) {  if (blocks[i+1][j].returnState()) { sum = sum+1; } };
                    if (i < cols-1 && j > 0) {  if (blocks[i+1][j-1].returnState()) { sum = sum+1; } };
                    if (i < cols-1 && j < rows-1) {  if (blocks[i+1][j+1].returnState()) { sum = sum+1; } };
                    //console.log(sum);
                    //console.log("on");
                    if (blocks[i][j].returnState() === true) { 
                        if (sum < 2 || sum > 3) {blocks[i][j].chgState(false);}
                    } 
                    else {if (sum === 3) {blocks[i][j].chgState(true);}}   
                }  
            }
        } else {background(80);}
            

    for (let i=0; i<cols; i++) {
        for (let j=0; j<rows; j++) {
            //blocks[i][j].move();
            blocks[i][j].display();
        }
    }
    textSize(15);
    fill(0);
    text('- click on the grid to start',5,20);
    text('- click on a cell to play a note',5,40);
    text('- press v to toggle life on and off',5,60);
    text('- press c to clear cells',5,80);
    text('- try this shape : □□□ ',5,100);
    text('                            □□□ ',5,109);
}


function mouseClicked() {
    if (audioStart) {
        for (let i=0; i<cols; i++) {
            for (let j=0; j<rows; j++) {
                blocks[i][j].click();
            }
        }
    } 
    else {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioContext.resume().then(() => { console.log('Playback resumed successfully'); });
        loadRNBO();
        audioStart = true;
        textSize(105);
        text('ON', 220, 90)
        }
}

function mouseDragged() {
    for (let i=0; i<cols; i++) {
        for (let j=0; j<rows; j++) {
            blocks[i][j].click();
        }
    }
}

function clearCells() {
    for (let i=0; i<cols; i++) {
        for (let j=0; j<rows; j++) {
            blocks[i][j].chgState(false);
        }
    }
}

function random8bit() {
    return Math.floor(Math.random() * 255);
}

function keyTyped() { if (key === 'v') { lifeState = !lifeState; }
                    if (key === 'c') { clearCells(); }
}

function windowResized() {resizeCanvas(windowWidth, windowHeight);};


