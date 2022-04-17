const electron = require('electron');
const path = require('path');
const url = require('url');
const checkDiskSpace = require('check-disk-space').default
const {app, BroswerWindow, dialog, BrowserView, BrowserWindow, ipcMain, Menu} = electron;
const fs = require('fs');

var ipc = require('electron').ipcRenderer;

var background = require('./data/background/background.json');
var preAttackAnimation = require('./data/attacks/preAttackAnimation.json')
var postAttackAnimation = require('./data/attacks/postAttackAnimation.json');
var attackData = require('./data/attacks/attacks.json');

let mainWindow;
let insertWindow
let preAnimationWindow;
let postAnimationWindow;
let freeSpaceFinderWindow;
var rom = null;

//Create main Browser window
function createWindow(){
    mainWindow = new BrowserWindow({
        width: 1100,
        height: 800,
        title:'Move Animation Creator 1.4',
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

    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.setTitle("Move Animation Creator 1.4")
    })
}

//Creates Insert Offset Animation Window
function createInsertWindow(){
    insertWindow = new BrowserWindow({
      parent:mainWindow,
      modal: true,
      show: false,
      width: 290,
      height: 270,
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

    insertWindow.webContents.on('did-finish-load', () => {
        insertWindow.setTitle("Insert Animation")
    })
  }

  function createPostAnimationWindow(){
    postAnimationWindow = new BrowserWindow({
        modal: true,
        show: false,
        width: 600,
        height: 250,
        title:'Post Animation Images',
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
          enableRemoteModule: true,
        },
      });

      postAnimationWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'postAttackImages.html'),
        protocol: 'file:',
        slashes:true
      }));
      postAnimationWindow.setMenu(null);
      // Handle garbage collection
      postAnimationWindow.on('close', function(){
        postAnimationWindow = null;
      });
  
      postAnimationWindow.once('ready-to-show', () => {
        postAnimationWindow.show()
      })
  
      postAnimationWindow.webContents.on('did-finish-load', () => {
        postAnimationWindow.setTitle("Post Animation")
      })
  }

  function createPreAnimationWindow(){
    preAnimationWindow = new BrowserWindow({
        modal: true,
        show: false,
        width: 600,
        height: 250,
        title:'Pre Animation Images',
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
          enableRemoteModule: true,
        },
      });

      preAnimationWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'preAttackImages.html'),
        protocol: 'file:',
        slashes:true
      }));
      preAnimationWindow.setMenu(null);
      // Handle garbage collection
      preAnimationWindow.on('close', function(){
        preAnimationWindow = null;
      });
  
      preAnimationWindow.once('ready-to-show', () => {
        preAnimationWindow.show()
      })
  
      preAnimationWindow.webContents.on('did-finish-load', () => {
        preAnimationWindow.setTitle("Pre Animation")
      })
  }

  function createFreeSpaceFinderWindow(){
    freeSpaceFinderWindow = new BrowserWindow({
        parent:insertWindow,
        modal: true,
        show: false,
        width: 350,
        height: 300,
        title:'Free Space Search',
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
          enableRemoteModule: true,
        },
      });
      freeSpaceFinderWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'searchFreeSpace.html'),
        protocol: 'file:',
        slashes:true
      }));
      freeSpaceFinderWindow.setMenu(null);
      // Handle garbage collection
      freeSpaceFinderWindow.on('close', function(){
        freeSpaceFinderWindow = null;
      });
  
      freeSpaceFinderWindow.once('ready-to-show', () => {
        freeSpaceFinderWindow.show()
      })
  
      freeSpaceFinderWindow.webContents.on('did-finish-load', () => {
        freeSpaceFinderWindow.setTitle("Search Free Space")
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
        ],
    }
]

mainMenuTemplate.push({
    label: 'Pre Attack Images',
    submenu: [
        {
            label: 'View',
            click(item, focusedWindow){
                createPreAnimationWindow();
            }
        }
    ]
})

mainMenuTemplate.push({
    label: 'Post Attack Images',
    submenu: [
        {
            label: 'View',
            click(item, focusedWindow){
                createPostAnimationWindow();
            }
        }
    ]
})



//Add developer tools item if not in production
/*
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
} */ 

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
ipcMain.on('form:submit', function(event, attackName, background, scrollType, scrollSpeed, attack1, attack2, attack3, attack4, attack1KeepBackground, attack2KeepBackground, attack3KeepBackground, attack4KeepBackground, postAnimation1, postAnimation2, postAnimation3, postAnimation4, preAnimation1, preAnimation2, preAnimation3, preAnimation4) {
    
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
                var moveData1 = getMoveAnimationData(attack1);
                moveData1.code = addPreAnimation(moveData1, preAnimation1);
                moveData1.code = trimTrailing08(moveData1.code)
                moveData1.code = addPostAnimation(moveData1, postAnimation1)
                moveData1.code = concat08(moveData1.code)
                bytesNeeded = getBytesNeeded(moveData1.code);
                createInsertWindow();
                insertWindow.webContents.on('did-finish-load', function () {
                    insertWindow.webContents.send('setInsertWindowVariables', bytesNeeded, moveData1.code);
                });
            }
            //If 2 moves
            else if (attack2 != '---' && attack3 == "---"){
                var moveData1 = getMoveAnimationData(attack1);
                var moveData2 = getMoveAnimationData(attack2);
                moveData1.code = trimTrailing08(moveData1.code)
                moveData2.code = trimTrailing08(moveData2.code)
                moveData1.code = addPreAnimation(moveData1, preAnimation1);
                moveData2.code = addPreAnimation(moveData2, preAnimation2);
                moveData1.code = addPostAnimation(moveData1, postAnimation1)
                moveData2.code = addPostAnimation(moveData2, postAnimation2)

                combinedAnimation = concatTwoAnimations(moveData1.code, moveData2.code);
                combinedAnimation = concat08(combinedAnimation)

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
                moveData3.code = trimTrailing08(moveData3.code)
                moveData1.code = addPreAnimation(moveData1, preAnimation1);
                moveData2.code = addPreAnimation(moveData2, preAnimation2);
                moveData3.code = addPreAnimation(moveData3, preAnimation3);
                moveData1.code = addPostAnimation(moveData1, postAnimation1)
                moveData2.code = addPostAnimation(moveData2, postAnimation2)
                moveData3.code = addPostAnimation(moveData3, postAnimation3)

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
                moveData4.code = trimTrailing08(moveData4.code)
                moveData1.code = addPreAnimation(moveData1, preAnimation1);
                moveData2.code = addPreAnimation(moveData2, preAnimation2);
                moveData3.code = addPreAnimation(moveData3, preAnimation3);
                moveData4.code = addPreAnimation(moveData4, preAnimation4);
                moveData1.code = addPostAnimation(moveData1, postAnimation1)
                moveData2.code = addPostAnimation(moveData2, postAnimation2)
                moveData3.code = addPostAnimation(moveData3, postAnimation3)
                moveData4.code = addPostAnimation(moveData4, postAnimation4)

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
                moveData1.code = trimTrailing08(moveData1.code)
                moveData1.code = addPreAnimation(moveData1, preAnimation1);
                moveData1.code = addPostAnimation(moveData1, postAnimation1)
                moveData1.code = concat08(moveData1.code)

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
                moveData2.code = trimTrailing08(moveData2.code)
                moveData1.code = addPreAnimation(moveData1, preAnimation1);
                moveData2.code = addPreAnimation(moveData2, preAnimation2);
                moveData1.code = addPostAnimation(moveData1, postAnimation1)
                moveData2.code = addPostAnimation(moveData2, postAnimation2)

                combinedAnimation = concatTwoAnimations(moveData1.code, moveData2.code);
                combinedAnimation = concat08(combinedAnimation)

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
                moveData3.code = trimTrailing08(moveData3.code)
                moveData1.code = addPreAnimation(moveData1, preAnimation1);
                moveData2.code = addPreAnimation(moveData2, preAnimation2);
                moveData3.code = addPreAnimation(moveData3, preAnimation3);
                moveData1.code = addPostAnimation(moveData1, postAnimation1)
                moveData2.code = addPostAnimation(moveData2, postAnimation2)
                moveData3.code = addPostAnimation(moveData3, postAnimation3)
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
                moveData4.code = trimTrailing08(moveData4.code)
                moveData1.code = addPreAnimation(moveData1, preAnimation1);
                moveData2.code = addPreAnimation(moveData2, preAnimation2);
                moveData3.code = addPreAnimation(moveData3, preAnimation3);
                moveData4.code = addPreAnimation(moveData4, preAnimation4);
                moveData1.code = addPostAnimation(moveData1, postAnimation1)
                moveData2.code = addPostAnimation(moveData2, postAnimation2)
                moveData3.code = addPostAnimation(moveData3, postAnimation3)
                moveData4.code = addPostAnimation(moveData4, postAnimation4)

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
                moveData1.code = addPreAnimation(moveData1, preAnimation1);
                moveData1.code = addPostAnimation(moveData1, postAnimation1)
                moveData1.code = addBackground(moveData1.code, background, scrollType, scrollSpeed, psychicBackgroundUsed)

                //Weird scenario where use selects background for 1 move, but then keeps existing background which is Psychic background
                if(moveData1.psychicBackground == true && attack1KeepBackground == true){
                    moveData1.code = moveData1.code.concat(" 0E C7 59 1D 08");
                } else {
                    if(background != "Psychic (03)" 
                        && background != "Light Green" && background != "Deep Green" && background != "Light Red" && background != "Deep Red" && background != "Light Orange" 
                        && background != "Deep Orange" && background != "Light Blue" && background != "Deep Blue" && background != "Light Sky Blue" && background != "Deep Sky Blue"
                        && background != "Light Pink" && background != "Deep Pink" && background != "Light Purple" && background != "Deep Purple" && background != "Light Black"
                        && background != "Deep Black"
                        && scrollType == "No Scroll"
                    ){
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
                moveData1.code = addPreAnimation(moveData1, preAnimation1);
                moveData1.code = addPostAnimation(moveData1, postAnimation1)
                moveData2.code = trimTrailing08(moveData2.code);
                moveData2.code = addPreAnimation(moveData2, preAnimation2);
                moveData2.code = addPostAnimation(moveData2, postAnimation2)

                //Psychic background can not go beyond 1 move when using Keep Background functionality. If another move with a psychic background comes after this, don't incldde closing animation.
                //If 2 Psychic moves are back to back, the 2nd Psychic move will have a glithed background if you use the Psychic ending code on the first move
                if((moveData1.psychicBackground == true && attack1KeepBackground == true) && (moveData2.psychicBackground != true || attack2KeepBackground != true)){
                    moveData1.code = moveData1.code.concat(" 0E C7 59 1D 08");
                }
                if(moveData2.psychicBackground == true && attack2KeepBackground == true){
                    moveData2.code = moveData2.code.concat(" 0E C7 59 1D 08 08");
                }

                combinedAnimation = concatTwoAnimations(moveData1.code, moveData2.code);
                //combinedAnimation = trimTrailing08(combinedAnimation);
                combinedAnimation = addBackground(combinedAnimation, background, scrollType, scrollSpeed, psychicBackgroundUsed);
                //Only add Black Fade out if there are no Psychic Backgrounds in the animation. Otherwise you will get a double black out which looks awkward
                if(isLastMoveWithBackgroundPsychic == false && background != "Psychic (03)" 
                    && background != "Light Green" && background != "Deep Green" && background != "Light Red" && background != "Deep Red" && background != "Light Orange" && background != "Deep Orange" 
                    && background != "Light Blue" && background != "Deep Blue" && background != "Light Sky Blue" && background != "Deep Sky Blue" && background != "Light Pink" && background != "Deep Pink"
                    && background != "Light Purple" && background != "Deep Purple" && background != "Light Black" && background != "Deep Black"
                    && scrollType == "No Scroll"
                ){
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
                moveData3.code = trimTrailing08(moveData3.code);
                moveData1.code = addPreAnimation(moveData1, preAnimation1);
                moveData2.code = addPreAnimation(moveData2, preAnimation2);
                moveData3.code = addPreAnimation(moveData3, preAnimation3);
                moveData1.code = addPostAnimation(moveData1, postAnimation1)
                moveData2.code = addPostAnimation(moveData2, postAnimation2)
                moveData3.code = addPostAnimation(moveData3, postAnimation3)

                //If the user wants to keep a Psychic background, unqiue Psychic background ending needs to be added. If there are multiple Psychic backgrounds back to back, only add the closing code to the LAST Psychic animation
                if((moveData1.psychicBackground == true && attack1KeepBackground == true) && (moveData2.psychicBackground != true || attack2KeepBackground != true)){
                    moveData1.code = moveData1.code.concat(" 0E C7 59 1D 08");
                }
                if(moveData2.psychicBackground == true && attack2KeepBackground == true && (moveData3.psychicBackground != true || attack3KeepBackground != true)){
                    moveData2.code = moveData2.code.concat(" 0E C7 59 1D 08");
                }
                if(moveData3.psychicBackground == true && attack3KeepBackground == true){
                    moveData3.code = moveData3.code.concat(" 0E C7 59 1D 08 08");
                }

                combinedAnimation = concatThreeAnimations(moveData1.code, moveData2.code, moveData3.code);
                combinedAnimation = addBackground(combinedAnimation, background, scrollType, scrollSpeed, psychicBackgroundUsed);
                //Add Black fade out for all bakgrounds except Psychic
              //  if((moveData1.psychicBackground != true || attack1KeepBackground != true) && (moveData2.psychicBackground != true || attack2KeepBackground != true) && (moveData3.psychicBackground != true || attack3KeepBackground != true)){
                //    combinedAnimation = combinedAnimation.concat(" 15 17");
               // }
                if(isLastMoveWithBackgroundPsychic == false && background != "Psychic (03)" 
                    && background != "Light Green" && background != "Deep Green" && background != "Light Red" && background != "Deep Red" && background != "Light Orange" && background != "Deep Orange" 
                    && background != "Light Blue" && background != "Deep Blue" && background != "Light Sky Blue" && background != "Deep Sky Blue" && background != "Light Pink" && background != "Deep Pink"
                    && background != "Light Purple" && background != "Deep Purple" && background != "Light Black" && background != "Deep Black"
                    && scrollType == "No Scroll"
                ){
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
                moveData4.code = trimTrailing08(moveData4.code);
                moveData1.code = addPreAnimation(moveData1, preAnimation1);
                moveData2.code = addPreAnimation(moveData2, preAnimation2);
                moveData3.code = addPreAnimation(moveData3, preAnimation3);
                moveData4.code = addPreAnimation(moveData4, preAnimation4);
                moveData1.code = addPostAnimation(moveData1, postAnimation1)
                moveData2.code = addPostAnimation(moveData2, postAnimation2)
                moveData3.code = addPostAnimation(moveData3, postAnimation3)
                moveData4.code = addPostAnimation(moveData4, postAnimation4)

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
                    moveData4.code = moveData4.code.concat(" 0E C7 59 1D 08 08");
                }

                combinedAnimation = concatFourAnimations(moveData1.code, moveData2.code, moveData3.code, moveData4.code);
                combinedAnimation = addBackground(combinedAnimation, background, scrollType, scrollSpeed, psychicBackgroundUsed);

                if(isLastMoveWithBackgroundPsychic == false && background != "Psychic (03)" 
                    && background != "Light Green" && background != "Deep Green" && background != "Light Red" && background != "Deep Red" && background != "Light Orange" && background != "Deep Orange" 
                    && background != "Light Blue" && background != "Deep Blue" && background != "Light Sky Blue" && background != "Deep Sky Blue" && background != "Light Pink" && background != "Deep Pink"
                    && background != "Light Purple" && background != "Deep Purple" && background != "Light Black" && background != "Deep Black"
                    && scrollType == "No Scroll"
                ){
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

ipcMain.on('postAttack:change', function(event, data) {
    postAnimationWindow.webContents.send('postAttackImage', data);

   // loadPostAttackImageToUI(data);
});

ipcMain.on('preAttack:change', function(event, data) {
    preAnimationWindow.webContents.send('preAttackImage', data);
    
});

ipcMain.on('button:searchFreeSpace', function(event, bytesNeeded){
    createFreeSpaceFinderWindow();
    freeSpaceFinderWindow.webContents.on('did-finish-load', function () {
        freeSpaceFinderWindow.webContents.send('setFreeSpaceWindowInitialParameters', bytesNeeded);
    });
});

ipcMain.on('form:freeSpaceFinderInsertMemory', function(event, memoryOffset){
    insertWindow.webContents.send('setInputMemoryOffset', memoryOffset)
    freeSpaceFinderWindow.close();
})

ipcMain.on('form:searchForFreeSpace', function(event, startingOffset, bytesNeeded){

    //Display loading symbol on Search Button
    freeSpaceFinderWindow.webContents.send('setSearchLoadingSpinner', true);
    
    //Make sure you don't look for free space in the header (the first 1040 bytes (0x410))
    if(startingOffset < 1040){
        startingOffset = 410; 
    } 

    //Increase the bytes needed in order to reduce the chances of you inserting a move animation in a block of FF that is actually used by something else
    if(bytesNeeded < 20){
        bytesNeeded = 20
    }
    
    var offset = findOffsetToInsert(startingOffset, bytesNeeded)

    freeSpaceFinderWindow.webContents.send('setSearchLoadingSpinner', false);
    //Make sure an offset was found
    if(offset == "" || typeof(offset) == 'undefined'){
        freeSpaceFinderWindow.webContents.send('errorMessage', "Error, could not find a valid offset.");
    } else {
        freeSpaceFinderWindow.webContents.send('setInsertMemoryOffset', offset.toString('16'));
    }
})

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


//Function displays the background the user to choose to the UI
async function loadBackgroundToUI(data){
    mainWindow.webContents.on('did-finish-load', ()=>{
        mainWindow.webContents.send('backgroundImage', data);
    })
}

/*async function loadPostAttackImageToUI(data){
    mainWindow.webContents.on('did-finish-load', ()=>{
        mainWindow.webContents.send('postAttackImage', data);
    })
} */

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
        if (moveData.name == "Aromatherapy" || moveData.name == "Calm Mind 1" || moveData.name == "Double Edge" || moveData.name == "Eruption" || moveData.name == "Explosion" || moveData.name == "Fire Blast" || moveData.name == "Flatter" || moveData.name == "Glare" || moveData.name == "Hail" || moveData.name == "Moonlight" || moveData.name == "Rain Dance" || moveData.name == "Sky Attack Turn 1" || moveData.name == "Sky Attack Turn 2" || moveData.name == "Sunny Day"){
            return moveData.code;
        } 
        //These elecric moves have their own custom colored background settings
        else if (moveData.name == "Thunderbolt" || moveData.name == "Thundershock" || moveData.name == "Thunder Wave" || moveData.name == "Volt Tackle"){
            var position = 0;
            var electricPositionToDelete = [];
            var colorCodeStart = background.coloredBackground[0].startOfElectricCode; //03 F9 A7 0B 08 0A 05 01 00 00 00 00 00 06 00 00 00 05

            for(var i=0; i<moveData.code.length; i++){
                if(moveData.code[i] == colorCodeStart[0] && moveData.code[i+1] == colorCodeStart[1] && moveData.code[i+3] == colorCodeStart[3] && moveData.code[i+4] == colorCodeStart[4]){ //Only need to search for 03 F9 A7 0B 08
                    electricPositionToDelete.push(position)
                }  
                position += 1; 
            }
            var codeWithoutBackground="";
            var reachedPosition;

            for(var i=0; i<moveData.code.length; i++){
                reachedPosition = false
                for(var j=0; j<electricPositionToDelete.length; j++){
                    if(i == electricPositionToDelete[j]){
                        reachedPosition = true
                    } 
                }
                if(reachedPosition == true){
                    //Some electric moves have an 06 appended, but not always. Example is Thunderbolt. If 06 is present, delete it too
                    if(moveData.code[i+52] == 4){
                        i += 55
                    } else {
                        i += 53
                    }
                    
                } else {
                    codeWithoutBackground += moveData.code[i]
                }
            }
            return codeWithoutBackground;
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
        else if(backgroundName == "Light Green"){
            var backgroundStart = background.coloredBackground[0].lightGreen;
            var backgroundEnd = background.coloredBackground[0].lightGreenEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
        }
        else if(backgroundName == "Deep Green"){
            var backgroundStart = background.coloredBackground[0].deepGreen;
            var backgroundEnd = background.coloredBackground[0].deepGreenEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
        }
        else if(backgroundName == "Deep Green Slow"){
            var backgroundStart = background.coloredBackground[0].deepGreenSlow;
            var backgroundEnd = background.coloredBackground[0].deepGreenSlowEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
        }
        else if(backgroundName == "Light Red"){
            var backgroundStart = background.coloredBackground[0].lightRed;
            var backgroundEnd = background.coloredBackground[0].lightRedEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
        }
        else if(backgroundName == "Deep Red"){
            var backgroundStart = background.coloredBackground[0].deepRed;
            var backgroundEnd = background.coloredBackground[0].deepRedEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
        }
        else if(backgroundName == "Deep Red Slow"){
            var backgroundStart = background.coloredBackground[0].deepRedSlow;
            var backgroundEnd = background.coloredBackground[0].deepRedSlowEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
        }
        else if(backgroundName == "Light Orange"){
            var backgroundStart = background.coloredBackground[0].lightOrange;
            var backgroundEnd = background.coloredBackground[0].lightOrangeEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
        }
        else if (backgroundName == "Deep Orange"){
            var backgroundStart = background.coloredBackground[0].deepOrange;
            var backgroundEnd = background.coloredBackground[0].deepOrangeEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
        }
        else if (backgroundName == "Deep Orange Slow"){
            var backgroundStart = background.coloredBackground[0].deepOrangeSlow;
            var backgroundEnd = background.coloredBackground[0].deepOrangeSlowEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
        }
        else if (backgroundName == "Light Blue"){
            var backgroundStart = background.coloredBackground[0].lightBlue;
            var backgroundEnd = background.coloredBackground[0].lightBlueEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
        }
        else if (backgroundName == "Deep Blue"){
            var backgroundStart = background.coloredBackground[0].deepBlue;
            var backgroundEnd = background.coloredBackground[0].deepBlueEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
        }
        else if(backgroundName == "Deep Blue Slow"){
            var backgroundStart = background.coloredBackground[0].deepBlueSlow;
            var backgroundEnd = background.coloredBackground[0].deepBlueSlowEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
        }
        else if (backgroundName == "Light Sky Blue"){
            var backgroundStart = background.coloredBackground[0].lightSkyBlue;
            var backgroundEnd = background.coloredBackground[0].lightSkyBlueEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
        }
        else if (backgroundName == "Deep Sky Blue"){
            var backgroundStart = background.coloredBackground[0].deepSkyBlue;
            var backgroundEnd = background.coloredBackground[0].deepSkyBlueEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
        }
        else if(backgroundName == "Deep Sky Blue Slow"){
            var backgroundStart = background.coloredBackground[0].deepSkyBlueSlow;
            var backgroundEnd = background.coloredBackground[0].deepSkyBlueSlowEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
        }
        else if (backgroundName == "Light Pink"){
            var backgroundStart = background.coloredBackground[0].lightPink;
            var backgroundEnd = background.coloredBackground[0].lightPinkEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
        }
        else if (backgroundName == "Deep Pink"){
            var backgroundStart = background.coloredBackground[0].deepPink;
            var backgroundEnd = background.coloredBackground[0].deepPinkEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
        }
        else if(backgroundName == "Deep Pink Slow"){
            var backgroundStart = background.coloredBackground[0].deepPinkSlow;
            var backgroundEnd = background.coloredBackground[0].deepPinkSlowEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
        }
        else if (backgroundName == "Light Purple"){
            var backgroundStart = background.coloredBackground[0].lightPurple;
            var backgroundEnd = background.coloredBackground[0].lightPurpleEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
        }
        else if (backgroundName == "Deep Purple"){
            var backgroundStart = background.coloredBackground[0].deepPurple;
            var backgroundEnd = background.coloredBackground[0].deepPurpleEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
        }
        else if(backgroundName == "Deep Purple Slow"){
            var backgroundStart = background.coloredBackground[0].deepPurpleSlow;
            var backgroundEnd = background.coloredBackground[0].deepPurpleSlowEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
        }
        else if (backgroundName == "Light Black"){
            var backgroundStart = background.coloredBackground[0].lightBlack;
            var backgroundEnd = background.coloredBackground[0].lightBlackEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
        }
        else if (backgroundName == "Deep Black") {
            var backgroundStart = background.coloredBackground[0].deepBlack;
            var backgroundEnd = background.coloredBackground[0].deepBlackEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
        }
        else if (backgroundName == "Deep Black Slow"){
            var backgroundStart = background.coloredBackground[0].deepBlackSlow;
            var backgroundEnd = background.coloredBackground[0].deepBlackSlowEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
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
        //Some backgrounds cant start immediately and need to use 14 XX 17 instead of 14 XX 16
        if(backgroundName == "Ghost (02)" || backgroundName == "Space (10)"){
            var backgroundStart = background.srollBackground[0].codeDelay;
        } else{
            var backgroundStart = background.srollBackground[0].code;
        }
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

//Function receives a background and removes the ending (fade) part of the anumation i.e (15 17) or Psychic ending. Does NOT touch Colored Ending
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

//Recieves a Move Object and the post animaton that they want and returns the hex code
function addPostAnimation(moveData, postAnimation){
    if(postAnimation == "Default"){
        return moveData.code
    }
    else if (postAnimation == "None/Remove"){
        //Remove post animation (if one is present)
        return removePostAnimation(moveData)
    }
    else {
        //User wants to add a post animation
        var postAnimationObjectToAdd = getPostAnimationObject(postAnimation);
        //Remove any existing post animation
        if(moveData.postAnimation.length > 0){
            moveData.code = removePostAnimation(moveData)
        }
        //Add the animation import to the start of hex (if it has one)
        if(postAnimationObjectToAdd.import != ""){
            moveData.code = moveData.code.replace(/^/, postAnimationObjectToAdd.import + " ");
        }
        //Append the animation pointer to the end, followed by 05
        moveData.code = moveData.code.concat(' ' + postAnimationObjectToAdd.pointer + ' ' + '05');
        return moveData.code;
    }
}

//Recieves a Move Object and the pre animaton that they want and returns the hex code with pre animation appended.
function addPreAnimation(moveData, preAnimation){
    if(preAnimation == "None"){
        return moveData.code;
    } 
    else{
        var preAnimationObjectToAdd = getPreAnimationObject(preAnimation);

        //Add the animation pointer to the start
        moveData.code = moveData.code.replace(/^/, preAnimationObjectToAdd.pointer + " ");

        //Add any imports to the start
        if(preAnimationObjectToAdd.import != ""){
            moveData.code = moveData.code.replace(/^/, preAnimationObjectToAdd.import + " ");
        }

        return moveData.code;
    }
}

function getPostAnimationObject(postAnimation){
    for(var i=0; i<postAttackAnimation.postAttack.length; i++){
        if(postAnimation == postAttackAnimation.postAttack[i].name){
            return postAttackAnimation.postAttack[i]
        }
    }
}

//Function recieves a pre animation and returns the hex code for it.
function getPreAnimationObject(preAnimation){
    for(var i=0; i<preAttackAnimation.preAttack.length; i++){
        if(preAnimation == preAttackAnimation.preAttack[i].name){
            return preAttackAnimation.preAttack[i]
        }
    }
}

//Function recieves a move data object and removes any post animation code, then returns the hex code
//Note, there can be multiple postAnimation pointers
function removePostAnimation(moveData){
    var hex = moveData.code;
    var pointersToRemove = []; //Stores the pointer like 0E 1B 31 1C 08
    var positionToDelete = []; //Stores the position in the array where the pointer(s) are located

    //First step is to collect all the pointers that need to be removed
    for(var i=0; i<moveData.postAnimation.length; i++){
        pointersToRemove.push(getPostAnimationPointer(moveData.name, moveData.postAnimation[i]))
    }
    //Now we must find where in the hex code the pointers are start and record that position.
    for(var i=0; i<pointersToRemove.length; i++){
        positionToDelete.push(findWhereCodeBegins(moveData.code, pointersToRemove[i]))
    }

    var codeWithoutBackground = "";
    var reachedPosition;

    for(var i=0; i<hex.length; i++){
        reachedPosition = false;
        var index = 0;
        for(var j=0; j<positionToDelete.length; j++){
            if(i == positionToDelete[j]){
                index = j;
                reachedPosition = true;
            }
        }

        if(reachedPosition == true){
            //Skip over the post Animation code.
           /* if (hex[i + pointersToRemove[index].length + 2] == "0" && hex[i + pointersToRemove[index].length + 2 == "5"]){
                console.log('found')
                i += (pointersToRemove[index].length + 3); //Also want to delete the 05 that comes after the pointer
            } else {
                i += pointersToRemove[index].length
            } */
            i += pointersToRemove[index].length
        } 
        else {
            codeWithoutBackground += hex[i];
        }
    }
    return codeWithoutBackground;
}

//Function recieves the name of the move as well as the name of the post animation and returns the hex code of the post animation
//Note, there are some edge cases that use slight variants of the animation code and so use "shortPointer instead of pointer"
function getPostAnimationPointer(moveName, postAnimationName){
    var postAnimationObject = getPostAnimationObject(postAnimationName);

    if(postAnimationName == "Scattered Flames"){
        if(moveName == "Blaze Kick" || moveName == "Fire Punch"){
            return postAnimationObject.shortPointer;
        } else{
            return postAnimationObject.pointer;
        }
    }
    else if (postAnimationName == "Self Sparkle"){
        if(moveName == "Synthesis" || moveName == "Wish"){
            return postAnimationObject.shortPointer;
        } else {
            return postAnimationObject.pointer;
        }
    }
    else if (postAnimationName == "Sparkle"){
        if(moveName == "Light Screen"){
            return postAnimationObject.shortPointer;
        } else {
            return postAnimationObject.pointer;
        }
    } else{
        return postAnimationObject.pointer;
    }
}

//Function recieves move animation hex code, as well as a pointer. It finds the postition where the pointer begins and returns that position
function findWhereCodeBegins(code, pointerToRemove){
    var x = 0;
    for(var i=0; i<code.length; i++){
        if(code[i] == pointerToRemove[x] && code[i+1] == pointerToRemove[x+1] && code[i+3] == pointerToRemove[x+3] && code[i+4] == pointerToRemove[x+4] && code[i+6] == pointerToRemove[x+6] && code[i+7] == pointerToRemove[x+7] && code[i+9] == pointerToRemove[x+9] && code[i+10] == pointerToRemove[x+10] && code[i+12] == pointerToRemove[x+12] && code[i+13] == pointerToRemove[x+13]){
            //console.log(code[i] + "" + code[i+1] + " " + code[i+3] + "" + code[i+4] + " " + code[i+6] + "" + code[i+7] + " " + code[i+9] + "" + code[i+10] + " " + code[i+12] + code[i+13])
            return i;
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

function getBackgroundObject(backgroundName){
    for(var i=0; i<background.backgrounds.length; i++){
        if(backgroundName == background.backgrounds[i].name){
            return background.backgrounds[i]
        }
    }
}

//Function recieves a memory offset to start looking from and the number of bytes needed. Then it returns a memory address that is safe to insert from
function findOffsetToInsert(startingOffset, bytesNeeded){
    var romHex = fs.readFileSync(rom)
    startingOffsetDecimal = parseInt(startingOffset, 16); //Convert hex to dec 

    var offsetToInsert;
    bytesNeeded = parseInt(bytesNeeded)
    for(var i=startingOffsetDecimal; i<romHex.length; i++){
        var locationFound = true;
        var end = i + bytesNeeded;
        for(var j=i; j<=end; j++){
            if(romHex[j] != "0xff" || (j >= "4548160" && j <= "4548859" )){  //There are some protected areas that you want to avoid just to be safe
                locationFound = false;
                break;
            } 
        }
        if(locationFound == true){
            offsetToInsert = i;
            break;
        }
    }

    return offsetToInsert   
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

