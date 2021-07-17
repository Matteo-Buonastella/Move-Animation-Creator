//Moves I couldn't find animations for: Solarbeam Turn 2, Sky Attack Turn 2. //Future Sight is basically the same as Psychic
const electron = require('electron');
const path = require('path');
const url = require('url');
const checkDiskSpace = require('check-disk-space').default
const {app, BroswerWindow, dialog, BrowserView, BrowserWindow, ipcMain, Menu} = electron;
const fs = require('fs');

var ipc = require('electron').ipcRenderer;
var background = require('./data/background/background.json');
var attackData = require('./data/attacks/attacks.json');

let mainWindow;
let insertWindow
var rom = null;

//Create main Browser window
function createWindow(){
    mainWindow = new BrowserWindow({
        width: 900,
        height: 700,
        title:'Move Animation Creator 1.0',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
        },
    })

    //Load index.html
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file',
        slashes: true
    }));

    //Build Menu from template
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    Menu.setApplicationMenu(mainMenu);

    mainWindow.on('closed', () => {
        mainWindow = null;
    })    
}

//Creates Insert Offset Animation Window
function createInsertWindow(){
    insertWindow = new BrowserWindow({
      width: 280,
      height: 250,
      title:'Insert Animation',
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true,
      },
    });
    insertWindow.loadURL(url.format({
      pathname: path.join(__dirname, 'insertAnimationWindow.html'),
      protocol: 'file:',
      slashes:true
    }));
    insertWindow.setMenu(null);
    // Handle garbage collection
    insertWindow.on('close', function(){
        insertWindow = null;
    });
  }


//Create Menu Template
const mainMenuTemplate = [
    {
        label: "File",
        submenu:[
            {
                label: 'Load ROM',
                accelerator: 'CmdOrCtrl+O',
                click(){
                    openRom();
                }
            },
            {
                label: 'Quit', 
                click(){
                    app.quit();
                }
            }
        ]
    }
]

//Add developer tools item if not in production
if(process.env.Node_ENV !== 'production'){
    mainMenuTemplate.push({
        label: 'Developer Tools',
        submenu: [
            {
                label: 'Toggle DevTools',
                click(item, focusedWindow){
                    focusedWindow.toggleDevTools();
                }
            }
        ]
    })
} 

//Run create window
app.whenReady().then(() => {
    createWindow();
   
    app.on('activate', function(){
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

//Quit when all windows are closed
app.on('window-all-closed', () => {
    //Check to see if user is on MAC
    if(process.platform  !== 'darwin') { //darwin = mac, win32 = windows
        app.quit();
    }
})

//Open ROM
async function openRom(){
    const files = dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            {name: 'ROM', extensions: ['gba']}
        ]
    }).then((filepath) => {
        rom = filepath.filePaths[0];
        mainWindow.webContents.send('romName', filepath.filePaths[0]);
    });

}

/////Ipc's

//Create Animation
ipcMain.on('form:submit', function(event, attackName, background, scrollType, scrollSpeed, attack1, attack2, attack3, attack4, attack1KeepBackground, attack2KeepBackground, attack3KeepBackground, attack4KeepBackground) {
    
    var backgroundCode;
    var removeBackround = false;
    var scrollSpeedCode;
    var animation1;
    var animation2;
    var animation3;
    var animation4;
    var combinedAnimation;
    var bytesNeeded;

    //Check if ROM is open
    if(rom != null){

        //Case 1. User selects Default Background
        if(background == 'Default'){
            backgroundCode = null;
            //If only 1 move
            if(attack2 == "---"){
                var moveData = getMoveAnimationData(attack1);
                bytesNeeded = getBytesNeeded(moveData.code);
                createInsertWindow();
                insertWindow.webContents.on('did-finish-load', function () {
                    insertWindow.webContents.send('setInsertWindowVariables', bytesNeeded, moveData.code);
                });
            }
            //If 2 moves
            else if (attack2 != '---' && attack3 == "---"){
                var moveData1 = getMoveAnimationData(attack1);
                var moveData2 = getMoveAnimationData(attack2);
                moveData1.code = trimTrailing08(moveData1.code)
                combinedAnimation = concatTwoAnimations(moveData1.code, moveData2.code);
                bytesNeeded = getBytesNeeded(combinedAnimation)

                createInsertWindow();
                insertWindow.webContents.on('did-finish-load', function () {
                    insertWindow.webContents.send('setInsertWindowVariables', bytesNeeded, combinedAnimation);
                });
            }
            //3 Moves
            else if (attack2 != '---' && attack3 != "---" && attack4 == "---"){
                var moveData1 = getMoveAnimationData(attack1);
                var moveData2 = getMoveAnimationData(attack2);
                var moveData3 = getMoveAnimationData(attack3);
                moveData1.code = trimTrailing08(moveData1.code)
                moveData2.code = trimTrailing08(moveData2.code)
                combinedAnimation = concatThreeAnimations(moveData1.code, moveData2.code, moveData3.code);
                combinedAnimation = concat08(combinedAnimation)

                bytesNeeded = getBytesNeeded(combinedAnimation)
                createInsertWindow();
                insertWindow.webContents.on('did-finish-load', function () {
                    insertWindow.webContents.send('setInsertWindowVariables', bytesNeeded, combinedAnimation);
                });
            }
            //4 moves
            else if (attack2 != '---' && attack3 != "---" && attack4 != "---"){
                var moveData1 = getMoveAnimationData(attack1);
                var moveData2 = getMoveAnimationData(attack2);
                var moveData3 = getMoveAnimationData(attack3);
                var moveData4 = getMoveAnimationData(attack4);
                moveData1.code = trimTrailing08(moveData1.code)
                moveData2.code = trimTrailing08(moveData2.code)
                moveData3.code = trimTrailing08(moveData3.code)
                combinedAnimation = concatFourAnimations(moveData1.code, moveData2.code, moveData3.code, moveData4.code);
                combinedAnimation = concat08(combinedAnimation)

                bytesNeeded = getBytesNeeded(combinedAnimation)
                createInsertWindow();
                insertWindow.webContents.on('did-finish-load', function () {
                    insertWindow.webContents.send('setInsertWindowVariables', bytesNeeded, combinedAnimation);
                });
            }
            
        } 

        //Case 2 User selects No Background
        else if (background == "No Background"){
            backgroundCode = null;
            removeBackround = true;

            //If only 1 move
            if(attack2 == "---"){
                var moveData1 = getMoveAnimationData(attack1);
                //Remove background if animation has one and user hasn't clicked Keep Background
                if(moveData1.background == true && attack1KeepBackground == false){
                   moveData1.code = removeBackground(moveData1)
                }
                bytesNeeded = getBytesNeeded(moveData1.code);
                createInsertWindow();
                insertWindow.webContents.on('did-finish-load', function () {
                    insertWindow.webContents.send('setInsertWindowVariables', bytesNeeded, moveData1.code);
                });
            }
            //2 Moves
            else if (attack2 != '---' && attack3 == "---"){
                //Remove backgrounds from both animations 
                var moveData1 = getMoveAnimationData(attack1);
                var moveData2 = getMoveAnimationData(attack2);
                if(moveData1.background == true && attack1KeepBackground == false){
                    moveData1.code = removeBackground(moveData1)
                }
                if(moveData2.background == true && attack2KeepBackground == false){
                    moveData2.code = removeBackground(moveData2)
                }

                moveData1.code = trimTrailing08(moveData1.code)
                combinedAnimation = concatTwoAnimations(moveData1.code, moveData2.code);
                bytesNeeded = getBytesNeeded(combinedAnimation)

                createInsertWindow();
                insertWindow.webContents.on('did-finish-load', function () {
                    insertWindow.webContents.send('setInsertWindowVariables', bytesNeeded, combinedAnimation);
                });
            }
            //3 Moves
            else if (attack2 != '---' && attack3 != "---" && attack4 == "---") {
                //Remove backgrounds from both animations (if it has one)
                var moveData1 = getMoveAnimationData(attack1);
                var moveData2 = getMoveAnimationData(attack2);
                var moveData3 = getMoveAnimationData(attack3);
                if(moveData1.background == true && attack1KeepBackground == false){
                    moveData1.code = removeBackground(moveData1)
                }
                if(moveData2.background == true && attack2KeepBackground == false){
                    moveData2.code = removeBackground(moveData2)
                }
                if(moveData3.background == true && attack3KeepBackground == false){
                    moveData3.code = removeBackground(moveData3)
                }

                moveData1.code = trimTrailing08(moveData1.code)
                moveData2.code = trimTrailing08(moveData2.code)
                combinedAnimation = concatThreeAnimations(moveData1.code, moveData2.code, moveData3.code);
                combinedAnimation = concat08(combinedAnimation)
                bytesNeeded = getBytesNeeded(combinedAnimation)

                createInsertWindow();
                insertWindow.webContents.on('did-finish-load', function () {
                    insertWindow.webContents.send('setInsertWindowVariables', bytesNeeded, combinedAnimation);
                });
            }
            //4 Moves
            else if (attack2 != '---' && attack3 != "---" && attack4 != "---") {
                //Remove backgrounds from both animations (if it has one)
                var moveData1 = getMoveAnimationData(attack1);
                var moveData2 = getMoveAnimationData(attack2);
                var moveData3 = getMoveAnimationData(attack3);
                var moveData4 = getMoveAnimationData(attack4);
                if(moveData1.background == true && attack1KeepBackground == false){
                    moveData1.code = removeBackground(moveData1)
                }
                if(moveData2.background == true && attack2KeepBackground == false){
                    moveData2.code = removeBackground(moveData2)
                }
                if(moveData3.background == true && attack3KeepBackground == false){
                    moveData3.code = removeBackground(moveData3)
                }
                if(moveData4.background == true && attack4KeepBackground == false){
                    moveData4.code = removeBackground(moveData4)
                }

                moveData1.code = trimTrailing08(moveData1.code)
                moveData2.code = trimTrailing08(moveData2.code)
                moveData3.code = trimTrailing08(moveData3.code)
                combinedAnimation = concatFourAnimations(moveData1.code, moveData2.code, moveData3.code, moveData4.code);
                combinedAnimation = concat08(combinedAnimation)
                bytesNeeded = getBytesNeeded(combinedAnimation)

                createInsertWindow();
                insertWindow.webContents.on('did-finish-load', function () {
                    insertWindow.webContents.send('setInsertWindowVariables', bytesNeeded, combinedAnimation);
                });
            }
        }

        //CASE 3 User selects a specific Background
        else{
            //Psychic backgrounds have their own unique procedure
            if(background == "Psychic (03)"){

            } else{

            }
        }

    } else{
        //ROM has not been loaded. Display error message
        mainWindow.webContents.send('romNotLoaded');
    }

    

    //Scroll Type

    // Access form data here
   /* console.log(attackName)
    console.log(background)
    console.log(scrollType)
    console.log(scrollSpeed)
    console.log(attack1)
    console.log(attack2)
    console.log(attack3) */
 });

ipcMain.on('backgroud:change', function(event, data) {
    var id;
    var vertical = false;
    var horizontal = false;

    mainWindow.webContents.send('backgroundImage', data);

    background.backgrounds.map(function(backgroundData){
        if(data == backgroundData.name){
            vertical = backgroundData.vertical
            horizontal = backgroundData.horizontal
        }
    })

    loadBackgroundToUI(data);
    setRadioButtonPermission(vertical, horizontal);
    setCheckboxPermisssion(data)
});

//Insert Animation Clicked
ipcMain.on('form:insertAnimationSubmit', function(event, memoryOffset, hex){

    //Animation code in Hex
    var hexArray = convertStringToHexFormat(hex);
    var memoryHex = "0x".concat(memoryOffset)

        fs.open(rom, "r+", (err, fd) => {           
            if(!err) {
                var position = parseInt(memoryHex)
                const data = new Uint8Array(hexArray)
                
                fs.write(fd, data, 0, data.length, position,
                    (err, bw, buf) => {
                        if(!err) {
                            // succesfully wrote byte to offset
                            insertWindow.close();
                            
                        } else{
                            mainWindow.webContents.on('did-finish-load', ()=>{
                                mainWindow.webContents.send('errorMessage', "Error writing to ROM");
                            })
                        }
                    }
                );
            } else{
                mainWindow.webContents.on('did-finish-load', ()=>{
                    mainWindow.webContents.send('errorMessage', "Error: Could not open ROM for writing");
                })
            }
        });


})


//Function displays the background the user to chose to the UI
async function loadBackgroundToUI(data){
    mainWindow.webContents.on('did-finish-load', ()=>{
        mainWindow.webContents.send('backgroundImage', data);
    })
}

//Function enables/disables certain scroll radio buttons depending on background. 
async function setRadioButtonPermission(vertical, horizontal){
        mainWindow.webContents.send('scrollRadioButton', vertical, horizontal);

}

//Function enables/disables checkbox depending on which backgroud is chosen
async function setCheckboxPermisssion(backgroundName){
    mainWindow.webContents.send('keepBackgroundCheckbox', backgroundName);
}


//Insert at Offset
/*
fs.open(filepath.filePaths[0], "r+", (err, fd) => {           
        if(!err) {
            var position = 0x8DD4C0
            const data = new Uint8Array(['0x04', '0x02', '0xC0', '0xd7'])
            fs.write(fd, data, 0, data.length, position,
                (err, bw, buf) => {
                    console.log(bw)
                    console.log(buf)
                    if(!err) {
                        // succesfully wrote byte to offset
                    } else{

                    }
                }
            );
        } else{
            console.log('error')
        }
    });
*/



///HELPER FUNCTIONS
function getMoveAnimationData(move){
    var moveData;
    attackData.attacks.map(function(attack){
        if(move == attack.name){
            moveData = JSON.parse(JSON.stringify(attack));
        }
    })
    return moveData;
}


//Function receives Move Data Object and removes background hex data from an animation including the ending animation code
function removeBackground(moveData){
    //CASE 1 Remove Colored Background (i.e absorb, Ice Beam).  Some colored backgrounds can not have their Background removed
    if(moveData.coloredBackground == true && moveData.scroll == false){  
        //These moves can not have their colored backgrounds removed
        if (moveData.name == "Aromatherapy" || moveData.name == "Calm Mind 1" || moveData.name == "Double Edge" || moveData.name == "Eruption" || moveData.name == "Explosion" || moveData.name == "Fire Blast" || moveData.name == "Flatter" || moveData.name == "Glare" || moveData.name == "Hail" || moveData.name == "Moonlight" || moveData.name == "Rain Dance" || moveData.name == "Sky Attack Turn 1" || moveData.name == "Sky Attack Turn 2" || moveData.name == "Sunny Day" || moveData.name == "Thunderbolt" || moveData.name == "Thundershock" || moveData.name == "Thunder Wave" || moveData.name == "Volt Tackle"){
            return moveData.code;
        } 
        else {
            //53 spaces to remove (52 + 1 empty space) 
            var colorCodeStart = background.coloredBackground[0].startOfCode; //02 24 7B 3E 08 02 05 01 00
            var position = 0;
            var positionToDelete = []; //Array of byte locations where colored background begins

            //Find where color background code is located (There can be multiple locations)
            for(var i = 0; i<moveData.code.length; i++){
                //Search for code that matches the start of color code
                if(moveData.code[i] == colorCodeStart[0] && moveData.code[i+1] == colorCodeStart[1]){
                    //Loop through to make sure the code matches color code
                    var match = true;
                    var z = i;
                    for(var j=0; j<colorCodeStart.length; j++){
                        if(moveData.code[z] == colorCodeStart[j]){
                            //It's a match.
                        } else {
                            match = false
                        }
                        z += 1;
                    }
                    if(match == true){
                        positionToDelete.push(position)
                    }
                } 
                position += 1;
            }

            var codeWithoutBackground="";
            var reachedPosition;
            
            //Loop over Animation code and skip over indexes (Exactly 53 bytes) that contain colored background
            for (var i=0; i<moveData.code.length; i++){
                reachedPosition = false
                for(var j=0; j<positionToDelete.length; j++){
                    if(i == positionToDelete[j]){
                        reachedPosition = true
                    } 
                }
                if(reachedPosition == true){
                    //Skip over colored background code
                    i += 53
                } else {
                    codeWithoutBackground += moveData.code[i]
                }
            }
            return codeWithoutBackground;
        }
    } 

    //CASE 2: Background is Psychic. No need to check for scroll as it doesn't work with Psychcic background
    else if(moveData.psychicBackground == true){
        //These psychic moves can not have their background removed
        if(moveData.name == "Luster Purge" || moveData.name == "Psycho Boost"){
            return moveData.code
        } else {
            var position = 0;
            var positionToDelete = []; //Start of background
            var positionEndToDelete = []; //End of some backgrounds
            //Search for 0E BB 59 1D 08 ->Begin background
            //Search for 0E C7 59 1D 08 ->Close Background
            for(var i=0; i<moveData.code.length; i++){
                if(moveData.code[i] == '0' && moveData.code[i+1] == 'E' && moveData.code[i+3] == 'B' && moveData.code[i+4] == 'B' && moveData.code[i+6] == '5' && moveData.code[i+7] == '9' ) { //Only need to look for OE BB 59. Will always be psychic if this combination is found
                    positionToDelete.push(position);
                }
                if(moveData.code[i] == '0' && moveData.code[i+1] == 'E' && moveData.code[i+3] == 'C' && moveData.code[i+4] == '7' && moveData.code[i+6] == '5' && moveData.code[i+7] == '9'){
                    positionEndToDelete.push(position);
                }
                position += 1;
            }

            var codeWithoutBackground = "";
            var psychicStartAnimation;
            var psychicEndAnimation;

            //Delete bytes
            for (var i=0; i<moveData.code.length; i++){
                psychicStartAnimation = false;
                psychicEndAnimation = false;

                for(var j=0; j<positionToDelete.length; j++){
                    if(i == positionToDelete[j]){
                        psychicStartAnimation = true;
                    }
                }
                for(var z=0; z<positionEndToDelete.length; z++){
                    if(i == positionEndToDelete[z]){
                        psychicEndAnimation = true;
                    }
                }

                if(psychicStartAnimation == true){
                    //Skip over 14 bytes
                    i += 14;
                }
                else if(psychicEndAnimation == true){
                    //Skip over 14 bytes
                    i += 14;
                }
                else {
                    codeWithoutBackground += moveData.code[i]
                }
            }
            return codeWithoutBackground;
        }
    }

    //CASE 3: Background is template like Ghost, Dark etc
    else{
        //If background isn't scrolling
        if(moveData.scroll == false){
            //The following non scrolled backgrounds can not be removed
            if(moveData.name == "Attract" || moveData.name == "Destiny Bond" || moveData.name == "Fissure" || moveData.name == "Guillotine" || moveData.name == "Hyper Fang" || moveData.name == "Mega Kick" || moveData.name == "Mega Punch" || moveData.name == "Grudge" || moveData.name == "Spite"){
                return moveData.code;
            } else {
                var position = 0;
                var positionToDelete = []; //Start of background
                var positionEndToDelete = []; //End of some backgrounds
                //Search for 14 WW 17 or 14 WW 19 where WW can be 00 - 1A
                //Search for 15 17 (split second black screen often used at the end of animations like Shadow Ball and Confuse Ray)
                for (var i=0; i<moveData.code.length; i++){
                    if(moveData.code[i] == '1' && moveData.code[i+1] == '4' && moveData.code[i+6] == "1" && moveData.code[i+7] == "7"){
                        positionToDelete.push(position);
                    }
                    if(moveData.code[i] == '1' && moveData.code[i+1] == '5' && moveData.code[i+3] == '1' && moveData.code[i+4] == '7'){
                        positionEndToDelete.push(position);
                    }
                    position += 1;
                }

                var codeWithoutBackground = "";
                var reachedPosition;
                var blackScreenReached;

                //Delete Bytes
                for(var i=0; i<moveData.code.length; i++){
                    reachedPosition = false
                    blackScreenReached = false
                    for(var j=0; j<positionToDelete.length; j++){
                        if(i == positionToDelete[j]){
                            reachedPosition = true;
                        } 
                    }
                    for(var z=0; z<positionEndToDelete.length; z++){
                        if(i == positionEndToDelete[z]){
                            blackScreenReached = true;
                        }
                    }
                    if(reachedPosition == true){
                        //Skip over template background code (Ghost/Dark etc)
                        i += 8
                    }  else if(blackScreenReached == true){
                        //Skip over black screen that occurs at the end of background transition
                        i += 5
                    }
                    else {
                        codeWithoutBackground += moveData.code[i]
                    }
                }
                return codeWithoutBackground
            }
        } 
        //Else Background is scrolling vertically or horizontally
        else {
            //These scrolling backgrounds can not be removed
            if(moveData.name == "Seismic Toss" || moveData.name == "Sky Uppercut"){
                return moveData.code;
            } else {
                var position = 0;
                var positionToDelete = []; //Start of background
                var positionEndToDelete = []; //End of some backgrounds
                var fadeOutToDelete = []; //15 16
                var colorBackgroundToDelete = [];
                //Search for 14 WW (17 or 16) 03 2D B8 0B 08 05 04 ....
                //Search for 0E C7 59 1D 08
                //Search for 15 16
                for(var i=0; i<moveData.code.length; i++){
                    if(moveData.code[i] == '1' && moveData.code[i+1] == '4' && moveData.code[i+6] == '1' && (moveData.code[i+7] == '7' || moveData.code[i+7] == '6') && moveData.code[i+9] == '0' && moveData.code[i+10] == '3'){
                        positionToDelete.push(position);
                    }
                    if(moveData.code[i] == '0' && moveData.code[i+1] == 'E' && moveData.code[i+3] == 'C' && moveData.code[i+4] == '7' && moveData.code[i+6] == '5' && moveData.code[i+7] == '9') {
                        positionEndToDelete.push(position);
                    }
                    if(moveData.code[i] == '1' && moveData.code[i+1] == '5' && moveData.code[i+3] == '1' && moveData.code[i+4] == '6'){
                        fadeOutToDelete.push(position)
                    }
                    if(moveData.coloredBackground == true && moveData.code[i] == '0' && moveData.code[i+1] == '2' && moveData.code[i+3] == '2' && moveData.code[i+4] == '4' && moveData.code[i+6] == '7' && moveData.code[i+7] == 'B' && moveData.code[i+9] == '3' && moveData.code[i+10] == 'E'){
                        colorBackgroundToDelete.push(position)
                    } 
                    position += 1;
                }
    
                var codeWithoutBackground = "";
                var reachedPosition;
                var scrollEndingReched;
                var colorBackgroundReached;
                var fadeOutReached;

                //Delete Bytes
                for(var i=0; i<moveData.code.length; i++){
                    reachedPosition = false
                    scrollEndingReched = false
                    fadeOutReached = false
                    colorBackgroundReached = false
                    for(var j=0; j<positionToDelete.length; j++){
                        if(i == positionToDelete[j]){
                            reachedPosition = true;
                        } 
                    }
                    for(var z=0; z<positionEndToDelete.length; z++){
                        if(i == positionEndToDelete[z]){
                            scrollEndingReched = true;
                        }
                    }
                    for(var q=0; q<fadeOutToDelete.length; q++){
                        if(i == fadeOutToDelete[q]){
                            fadeOutReached = true
                        }
                    }
                    for(var y=0; y<colorBackgroundToDelete.length; y++){
                        if(i == colorBackgroundToDelete[y]){
                            colorBackgroundReached = true;
                        }
                    }
                    if(reachedPosition == true){
                        //Skip over scrolling background code
                        i += 53
                    }  else if(scrollEndingReched == true){
                        //Skip over scrolling background ending
                        i += 14
                    } else if(fadeOutReached == true){
                        //Skip over black fade out
                        i += 5;
                    } else if(colorBackgroundReached == true){
                        //Skip over colored background. Colored background might end with a 05 or 04. ONLY delete if it's 05
                        if(moveData.code[i+52] == '5'){ 
                            i += 53;
                        } else {
                            i += 50
                        }
                    }
                    else {
                        codeWithoutBackground += moveData.code[i]
                    }
                }
                return codeWithoutBackground
            }
        }   
    }
}

function trimString(str, length){
  //  return str.substr(0,cutStart) + str.substr(cutEnd+1);
  return str.substring(0, length)
}

//Recieves Hex code for move animation and removes 08 from the end 
function trimTrailing08(moveHex){
    var code;
    code = moveHex.slice(0, -3) //Removes 08 and space before it
    return code;
}

function concat08(moveHex){
    return moveHex.concat(' 08');
}

//Function recieves Hex string and determines the number of bytes
function getBytesNeeded(moveHex){
    var bytes;

    //Remove spaces from string
    var code = moveHex.replace(/\s/g, '');
    bytes = code.length/2; //1 Byte is 2 integers
    //bytes = bytes.toString(16); //Convert from decimal to hex

    return bytes;
}

function convertStringToHexFormat(move){
    var hexArray = [];
    var code = move.replace(/\s/g, '');

    for(var i=0; i<code.length; i++){
        var s = "0x"
        s = s.concat(code[i]).concat(code[i+1]);       
        hexArray.push(s)
        i++
    }

    return hexArray;
}

//Function appends move2 to the end of move1
function concatTwoAnimations(move1, move2){
    return move1.concat(move2)
}

function concatThreeAnimations(move1, move2, move3){
    return move1.concat(move2).concat(move3)
}

function concatFourAnimations(move1, move2, move3, move4){
    return move1.concat(move2).concat(move3).concat(move4)
}

