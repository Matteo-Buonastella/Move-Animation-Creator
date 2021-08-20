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
      parent:mainWindow,
      modal: true,
      show: false,
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

    insertWindow.once('ready-to-show', () => {
        insertWindow.show()
    })
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
    var psychicBackgroundUsed;

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

        //CASE 3 User selects a specific Background. 
        //There are LOTS of weird use cases when the user selects a background but then wants to Keep a PSYCHIC background for 1 or more of the moves.
        //When a move has Keep Background checked, all the moves after it will use that background. For example -> Background: Dark; Moves: Absorb, tackle, Shadow Ball with Keep Background checked, Bite; Absorb and Tackle will use dark background, then Shadown Ball will use ghost background and then bite will use ghost background
        else{
            //1 Move
            if(attack2 == "---"){
                var moveData1 = getMoveAnimationData(attack1);
                psychicBackgroundUsed = false;
                //Remove background if animation has one and user hasn't clicked Keep Background
                if(moveData1.background == true && attack1KeepBackground == false){
                    moveData1.code = removeBackground(moveData1)
                //Just remove the black fade out at the end. One will get added later and we don't want to have 2 spearate fade outs
                } else {
                    moveData1.code = removeBackgroundEnding(moveData1.code);
                }

                moveData1.code = trimTrailing08(moveData1.code)
                moveData1.code = addBackground(moveData1.code, background, scrollType, scrollSpeed, psychicBackgroundUsed)

                //Weird scenario where use selects background for 1 move, but then keeps existing background which is Psychic background
                if(moveData1.psychicBackground == true && attack1KeepBackground == true){
                    moveData1.code = moveData1.code.concat(" 0E C7 59 1D 08");
                } else {
                    if(background != "Psychic (03)" && scrollType == "No Scroll"){
                        moveData1.code = moveData1.code.concat(" 15 17");
                    }
                }

                moveData1.code = concat08(moveData1.code)
                bytesNeeded = getBytesNeeded(moveData1.code);

                createInsertWindow();
                insertWindow.webContents.on('did-finish-load', function () {
                    insertWindow.webContents.send('setInsertWindowVariables', bytesNeeded, moveData1.code);
                });
            }
            //2 Moves
            else if (attack2 != '---' && attack3 == "---"){
                var moveData1 = getMoveAnimationData(attack1);
                var moveData2 = getMoveAnimationData(attack2);
                var isLastMoveWithBackgroundPsychic = false;
                psychicBackgroundUsed = false;

                if(moveData1.background == true && attack1KeepBackground == false){
                    moveData1.code = removeBackground(moveData1);
                } else {
                    moveData1.code = removeBackgroundEnding(moveData1.code);
                    if(moveData1.psychicBackground == true){
                        isLastMoveWithBackgroundPsychic = true;
                        psychicBackgroundUsed = true;
                    } else {
                        isLastMoveWithBackgroundPsychic = false
                    }
                }
                if(moveData2.background == true && attack2KeepBackground == false){
                    moveData2.code = removeBackground(moveData2);
                } else {
                    moveData2.code = removeBackgroundEnding(moveData2.code);
                    if(moveData2.psychicBackground == true){
                        isLastMoveWithBackgroundPsychic = true;
                        psychicBackgroundUsed = true;
                    } else {
                        isLastMoveWithBackgroundPsychic = false
                    }
                }

                moveData1.code = trimTrailing08(moveData1.code);

                //Psychic background can not go beyond 1 move when using Keep Background functionality. If another move with a psychic background comes after this, don't incldde closing animation.
                //If 2 Psychic moves are back to back, the 2nd Psychic move will have a glithed background if you use the Psychic ending code on the first move
                if((moveData1.psychicBackground == true && attack1KeepBackground == true) && (moveData2.psychicBackground != true || attack2KeepBackground != true)){
                    moveData1.code = moveData1.code.concat(" 0E C7 59 1D 08");
                }
                if(moveData2.psychicBackground == true && attack2KeepBackground == true){
                    moveData2.code = trimTrailing08(moveData2.code);
                    moveData2.code = moveData2.code.concat(" 0E C7 59 1D 08 08");
                }

                combinedAnimation = concatTwoAnimations(moveData1.code, moveData2.code);
                combinedAnimation = trimTrailing08(combinedAnimation);
                combinedAnimation = addBackground(combinedAnimation, background, scrollType, scrollSpeed, psychicBackgroundUsed);
                //Only add Black Fade out if there are no Psychic Backgrounds in the animation. Otherwise you will get a double black out which looks awkward
                if(isLastMoveWithBackgroundPsychic == false && background != "Psychic (03)" && scrollType == "No Scroll"){
                    combinedAnimation = combinedAnimation.concat(" 15 17");
                }

                combinedAnimation = concat08(combinedAnimation);
                bytesNeeded = getBytesNeeded(combinedAnimation);

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
                var isLastMoveWithBackgroundPsychic = false;
                psychicBackgroundUsed = false;
                //If move has a background and the user doesn't select Keep Background, remove it. Otherwise, just remove the ending fade out part of the background
                
                if(moveData1.background == true && attack1KeepBackground == false){
                    moveData1.code = removeBackground(moveData1);
                } else {
                    //User wants to keep background. Only remove ending
                    moveData1.code = removeBackgroundEnding(moveData1.code);
                    if(moveData1.psychicBackground == true){
                        isLastMoveWithBackgroundPsychic = true;
                        psychicBackgroundUsed = true;
                    } else {
                        isLastMoveWithBackgroundPsychic = false
                    }
                }
                if(moveData2.background == true && attack2KeepBackground == false){
                    moveData2.code = removeBackground(moveData2);
                } else {
                    moveData2.code = removeBackgroundEnding(moveData2.code);
                    if(moveData2.psychicBackground == true){
                        isLastMoveWithBackgroundPsychic = true;
                        psychicBackgroundUsed = true;
                    } else {
                        isLastMoveWithBackgroundPsychic = false
                    }
                }
                if(moveData3.background == true && attack3KeepBackground == false){
                    moveData3.code = removeBackground(moveData3);
                } else {
                    moveData3.code = removeBackgroundEnding(moveData3.code);
                    if(moveData3.psychicBackground == true){
                        isLastMoveWithBackgroundPsychic = true;
                        psychicBackgroundUsed = true;
                    } else {
                        isLastMoveWithBackgroundPsychic = false
                    }
                }

                moveData1.code = trimTrailing08(moveData1.code);
                moveData2.code = trimTrailing08(moveData2.code);

                //If the user wants to keep a Psychic background, unqiue Psychic background ending needs to be added. If there are multiple Psychic backgrounds back to back, only add the closing code to the LAST Psychic animation
                if((moveData1.psychicBackground == true && attack1KeepBackground == true) && (moveData2.psychicBackground != true || attack2KeepBackground != true)){
                    moveData1.code = moveData1.code.concat(" 0E C7 59 1D 08");
                }
                if(moveData2.psychicBackground == true && attack2KeepBackground == true && (moveData3.psychicBackground != true || attack3KeepBackground != true)){
                    moveData2.code = moveData2.code.concat(" 0E C7 59 1D 08");
                }
                if(moveData3.psychicBackground == true && attack3KeepBackground == true){
                    moveData3.code = trimTrailing08(moveData3.code);
                    moveData3.code = moveData3.code.concat(" 0E C7 59 1D 08 08");
                }

                combinedAnimation = concatThreeAnimations(moveData1.code, moveData2.code, moveData3.code);
                combinedAnimation = trimTrailing08(combinedAnimation);
                combinedAnimation = addBackground(combinedAnimation, background, scrollType, scrollSpeed, psychicBackgroundUsed);
                //Add Black fade out for all bakgrounds except Psychic
              //  if((moveData1.psychicBackground != true || attack1KeepBackground != true) && (moveData2.psychicBackground != true || attack2KeepBackground != true) && (moveData3.psychicBackground != true || attack3KeepBackground != true)){
                //    combinedAnimation = combinedAnimation.concat(" 15 17");
               // }
                if(isLastMoveWithBackgroundPsychic == false && background != "Psychic (03)" && scrollType == "No Scroll"){
                    combinedAnimation = combinedAnimation.concat(" 15 17");
                }
                combinedAnimation = concat08(combinedAnimation);
                bytesNeeded = getBytesNeeded(combinedAnimation);

                createInsertWindow();
                insertWindow.webContents.on('did-finish-load', function () {
                    insertWindow.webContents.send('setInsertWindowVariables', bytesNeeded, combinedAnimation);
                });
            }
            //4 Moves
            else if(attack2 != '---' && attack3 != "---" && attack4 != "---"){
                var moveData1 = getMoveAnimationData(attack1);
                var moveData2 = getMoveAnimationData(attack2);
                var moveData3 = getMoveAnimationData(attack3);
                var moveData4 = getMoveAnimationData(attack4);
                var isLastMoveWithBackgroundPsychic = false;
                psychicBackgroundUsed = false;

                if(moveData1.background == true && attack1KeepBackground == false){
                    moveData1.code = removeBackground(moveData1);
                } else {
                    moveData1.code = removeBackgroundEnding(moveData1.code);
                    if(moveData1.psychicBackground == true){
                        isLastMoveWithBackgroundPsychic = true;
                        psychicBackgroundUsed = true;
                    } else {
                        isLastMoveWithBackgroundPsychic = false
                    }
                }
                if(moveData2.background == true && attack2KeepBackground == false){
                    moveData2.code = removeBackground(moveData2);
                } else {
                    moveData2.code = removeBackgroundEnding(moveData2.code);
                    if(moveData2.psychicBackground == true){
                        isLastMoveWithBackgroundPsychic = true;
                        psychicBackgroundUsed = true;
                    } else {
                        isLastMoveWithBackgroundPsychic = false
                    }
                }
                if(moveData3.background == true && attack3KeepBackground == false){
                    moveData3.code = removeBackground(moveData3);
                } else {
                    moveData3.code = removeBackgroundEnding(moveData3.code);
                    if(moveData3.psychicBackground == true){
                        isLastMoveWithBackgroundPsychic = true;
                        psychicBackgroundUsed = true;
                    } else {
                        isLastMoveWithBackgroundPsychic = false
                    }
                }
                if(moveData4.background == true && attack4KeepBackground == false){
                    moveData4.code = removeBackground(moveData4);
                } else {
                    moveData4.code = removeBackgroundEnding(moveData4.code);
                    if(moveData4.psychicBackground == true){
                        isLastMoveWithBackgroundPsychic = true;
                        psychicBackgroundUsed = true;
                    } else {
                        isLastMoveWithBackgroundPsychic = false
                    }
                }

                moveData1.code = trimTrailing08(moveData1.code);
                moveData2.code = trimTrailing08(moveData2.code);
                moveData3.code = trimTrailing08(moveData3.code);

                //If the user wants to keep a Psychic background, unqiue Psychic background ending needs to be added. If there are multiple Psychic backgrounds back to back, only add the closing code to the LAST Psychic animation
                if((moveData1.psychicBackground == true && attack1KeepBackground == true) && (moveData2.psychicBackground != true || attack2KeepBackground != true)){
                    moveData1.code = moveData1.code.concat(" 0E C7 59 1D 08");
                }
                if(moveData2.psychicBackground == true && attack2KeepBackground == true && (moveData3.psychicBackground != true || attack3KeepBackground != true)){
                    moveData2.code = moveData2.code.concat(" 0E C7 59 1D 08");
                }
                if(moveData3.psychicBackground == true && attack3KeepBackground == true){
                    moveData3.code = moveData3.code.concat(" 0E C7 59 1D 08");
                }
                if(moveData4.psychicBackground == true && attack4KeepBackground == true){
                    moveData4.code = trimTrailing08(moveData4.code);
                    moveData4.code = moveData4.code.concat(" 0E C7 59 1D 08 08");
                }

                combinedAnimation = concatFourAnimations(moveData1.code, moveData2.code, moveData3.code, moveData4.code);
                combinedAnimation = trimTrailing08(combinedAnimation);
                combinedAnimation = addBackground(combinedAnimation, background, scrollType, scrollSpeed, psychicBackgroundUsed);
                if(isLastMoveWithBackgroundPsychic == false && background != "Psychic (03)" && scrollType == "No Scroll"){
                    combinedAnimation = combinedAnimation.concat(" 15 17");
                }
                combinedAnimation = concat08(combinedAnimation);

                bytesNeeded = getBytesNeeded(combinedAnimation);

                createInsertWindow();
                insertWindow.webContents.on('did-finish-load', function () {
                    insertWindow.webContents.send('setInsertWindowVariables', bytesNeeded, combinedAnimation);
                });
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
    var success = isValidOffset(memoryHex);
    
    if(success == true){
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
                            insertWindow.webContents.send('errorMessage', "Error writing to ROM");
                        }
                    }
                );
            } else{
                mainWiinsertWindowndow.webContents.send('errorMessage', "Error: Could not open ROM for writing");
            }
        });
    }
    else{
        insertWindow.webContents.send('errorMessage', 'Error: Invalid offset.');
    } 
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
            if(moveData.name == "Attract" || moveData.name == "Destiny Bond" || moveData.name == "Earth Power" || moveData.name == "Fissure" || moveData.name == "Guillotine" || moveData.name == "Hyper Fang" || moveData.name == "Mega Kick" || moveData.name == "Mega Punch" || moveData.name == "Nasty Plot" || moveData.name == "Power Whip" || moveData.name == "Grudge" || moveData.name == "Solarbeam Turn 2" || moveData.name == "Spite"){
                return moveData.code;
            } else {
                var position = 0;
                var positionToDelete = []; //Start of background
                var positionEndToDelete = []; //End of some backgrounds
                //Search for 14 WW 17 or 14 WW 16 where WW can be 00 - 1A
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

//Function recieves a move hex code and adds a background to it
function addBackground(hex, backgroundName, scrollType, scrollSpeed, psychicBackgroundUsed){
    var backgroundObject = getBackgroundObject(backgroundName)  //Gets ths background object i.e. (Dark (00), Ghost(02))

    //Background is static (not scrolling)
    if(scrollType == "No Scroll"){
        if(backgroundName == "Psychic (03)"){
            var backgroundStart = background.srollBackground[0].psychicCode;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(" 0E C7 59 1D 08");
        }
        else if(backgroundName == "Solarbeam (18)"){
            var backgroundStart = background.staticBackground[0].solarbeamCode;
            hex = hex.replace(/^/, backgroundStart + " ");
        }
        else if(backgroundName == "High Impact (04)"){
            var backgroundStart = background.staticBackground[0].highImpactCode;
            hex = hex.replace(/^/, backgroundStart + " ");
        }
        else if(backgroundName == "Guillotine (0C)"){
            var backgroundStart = background.staticBackground[0].guillotineCode;
            hex = hex.replace(/^/, backgroundStart + " ");
        }
        else {
            var backgroundStart = background.staticBackground[0].code;
            backgroundStart = addBackgroundIdToCode(backgroundStart, backgroundObject.code);
            hex = hex.replace(/^/, backgroundStart + " ");
            //hex = hex.concat(" 15 17");
        }
    } 
    //Background is scrolling vertically or horizontally
    else{
        var backgroundStart = background.srollBackground[0].code;
        backgroundStart = addBackgroundIdToCode(backgroundStart, backgroundObject.code);
        if(scrollType == "Vertical Scroll"){
            backgroundStart = addVerticalSpeedToCode(backgroundStart, scrollSpeed);
            backgroundStart = addHorizontalSpeedToCode(backgroundStart, "00");
        } 
        else if (scrollType == "Horizontal Scroll"){
            backgroundStart = addHorizontalSpeedToCode(backgroundStart, scrollSpeed);
            backgroundStart = addVerticalSpeedToCode(backgroundStart, "00")
        }
        hex = hex.replace(/^/, backgroundStart + " ");
        //If a Psychic background has already been used in the animation, that means 0E C7 59 1D 08 has already been added, so no need to append it again
        if(psychicBackgroundUsed == false){
            hex = hex = hex.concat(" 0E C7 59 1D 08");
        }
    }
    return hex;
}

//Function receives a background and removes the ending (fade) part of the anumation i.e (15 17) or Psychic ending
function removeBackgroundEnding(hex){
    var position = 0;
    var positionEndToDelete = []; //End of some backgrounds
    var psychicEndToDelete = []; 

    for(var i=0; i<hex.length; i++){
        if(hex[i] == '1' && hex[i+1] == '5' && hex[i+3] == '1' && (hex[i+4] == '7' || hex[i+4] == '6')){
            positionEndToDelete.push(position);
        }
        if(hex[i] == '0' && hex[i+1] == 'E' && hex[i+3] == 'C' && hex[i+4] == '7' && hex[i+6] == '5' && hex[i+7] == '9'){
            psychicEndToDelete.push(position);
        }
        position += 1;
    }

    var codeWithoutEndFade = "";
    var reachedPosition;
    var blackScreenReached;
    var psychicScreenReached;

    //Delete Bytes
    for(var i=0; i<hex.length; i++){
        reachedPosition = false
        blackScreenReached = false
        psychicScreenReached = false;

        for(var j=0; j<psychicEndToDelete.length; j++){
            if(i == psychicEndToDelete[j]){
                psychicScreenReached = true
            }
        }
        for(var z=0; z<positionEndToDelete.length; z++){
            if(i == positionEndToDelete[z]){
                blackScreenReached = true;
            }
        }
        if(blackScreenReached == true){
            //Skip over black screen that occurs at the end of background transition
            i += 5
        }
        else if (psychicScreenReached == true){
            i += 14
        }
        else {
            codeWithoutEndFade += hex[i]
        }
    }
    return codeWithoutEndFade
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

function getBackgroundObject(backgroundName){
    for(var i=0; i<background.backgrounds.length; i++){
        if(backgroundName == background.backgrounds[i].name){
            return background.backgrounds[i]
        }
    }
}


function isValidOffset(memoryOffset){
    //Make sure there are no spaces
    if(memoryOffset.indexOf(' ') >= 0){
        return false;
    }

    return true;
}

//Function recieves background code (i.e. 14 WW 17) and background Id and replaces WW with Id
function addBackgroundIdToCode(code, Id){
    return code.replace("WW", Id);
}

function addHorizontalSpeedToCode(code, value){
    return code.replace("XX", value);
}

function addVerticalSpeedToCode(code, value){
    return code.replace("YY", value)
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

