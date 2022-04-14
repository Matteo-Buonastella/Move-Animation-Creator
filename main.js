const electron = require('electron');
const path = require('path');
const url = require('url');
const checkDiskSpace = require('check-disk-space').default
const {app, BroswerWindow, dialog, BrowserView, BrowserWindow, ipcMain, Menu, Notification} = electron;
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
let opacityWindow;
var rom = null;
var romType = null; //Either FireRed or Emerald


//Create main Browser window
function createWindow(){
    mainWindow = new BrowserWindow({
        width: 1100,
        height: 800,
        title:'Move Animation Creator 1.4.1',
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
    mainWindow.setTitle("Move Animation Creator 1.4.1")
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
        height: 350,
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
        height: 350,
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

  function createOpacityMenu(){
    opacityWindow = new BrowserWindow({
        parent:insertWindow,
        modal: true,
        show: false,
        width: 520,
        height: 560,
        title:'Opacity Levels',
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
          enableRemoteModule: true,
        },
      });
      opacityWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'opacityLevel.html'),
        protocol: 'file:',
        slashes:true
      }));
      opacityWindow.setMenu(null);
      // Handle garbage collection
      opacityWindow.on('close', function(){
        opacityWindow = null;
      });
  
      opacityWindow.once('ready-to-show', () => {
        opacityWindow.show()
      })
  
      opacityWindow.webContents.on('did-finish-load', () => {
        opacityWindow.setTitle("Opacity Levels")
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
    label: 'View',
    submenu: [
        {
            label: 'Pre Attack Images',
            click(item, focusedWindow){
                createPreAnimationWindow();
            }
        },
        {
            label: 'Post Attack Images',
            click(item, focusedWindow){
                createPostAnimationWindow();
            }
        },
        {
            label: 'Opacity Levels',
            click(item, focusedWindow){
                createOpacityMenu();
            }
        },
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
}  */

//Run create window
app.whenReady().then(() => {
    createWindow();
   
    app.on('activate', function(){
        if (BrowserWindow.getAllWindows().length === 0){
            createWindow();
        } 
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
        romType = determineRomType(rom);
        mainWindow.webContents.send('romName', filepath.filePaths[0]);
    });
}


//This function determines if the ROM is FireRed or Emerald
function determineRomType(rom){
    var array = []
    var romHex = fs.readFileSync(rom)
    var startingOffsetDecimal = 172 //Location of the Header (in decimal) that tells you the type of game (Fire Red or Emerald)
    for (var i=startingOffsetDecimal; i<176; i++){
        array.push(romHex[i].toString('16'))
    }

    if(array[0] == "42" && array[1] == "50" && array[2] == "52" && array[3] == "45"){
        return "Fire Red";
    } else if (array[0] == "42" && array[1] == "50" && array[2] == "45" && array[3] == "45"){
        return "Emerald";
    } else {
        mainWindow.webContents.send('errorMessage', "Error: ROM is neither Fire Red or Emerald.");
    }
}

/////Ipc's

//Create Animation
ipcMain.on('form:submit', function(event, attackName, background, scrollType, scrollSpeed, removeBlink, attack1, attack2, attack3, attack4, attack1KeepBackground, attack2KeepBackground, attack3KeepBackground, attack4KeepBackground, postAnimation1, postAnimation2, postAnimation3, postAnimation4, preAnimation1, preAnimation2, preAnimation3, preAnimation4, customParticleColour1, customParticleColour2, customParticleColour3, customParticleColour4, particleColour1, particleColour2, particleColour3, particleColour4, particleOpacity1, particleOpacity2, particleOpacity3, particleOpacity4) {
    var combinedAnimation;
    var bytesNeeded;
    var psychicBackgroundUsed = false;
    var moveData1;
    var moveData2;
    var moveData3;
    var moveData4;
    
    //Check if ROM is open
    if(rom != null){
        //Case 1. User selects Default Background or No Background
        if(background == 'Default' || background == "No Background"){
            moveData1 = getMoveAnimationData(attack1);
            moveData1.code = selectAnimationCodeToUse(moveData1);
            if(background == "No Background" && moveData1.background == true && attack1KeepBackground == false){
                moveData1.code = removeBackground(moveData1);
            }
            if(removeBlink == true){
                moveData1.code = removeBlinkTemp(moveData1.code);
            }
            moveData1.code = trimTrailing08(moveData1.code);
            moveData1.code = addPreAnimation(moveData1, preAnimation1);
            moveData1.code = addPostAnimation(moveData1, postAnimation1);
            if(customParticleColour1 == "Custom"){
                moveData1.code = changeParticleColor(moveData1, particleColour1, particleOpacity1, preAnimation1);
            }
            if(attack2 != "---"){
                moveData2 = getMoveAnimationData(attack2);
                moveData2.code = selectAnimationCodeToUse(moveData2);
                if(background == "No Background" && moveData2.background == true && attack2KeepBackground == false){
                    moveData2.code = removeBackground(moveData2);
                }
                if(removeBlink == true){
                    moveData2.code = removeBlinkTemp(moveData2.code);
                }
                moveData2.code = trimTrailing08(moveData2.code);
                moveData2.code = addPreAnimation(moveData2, preAnimation2);
                moveData2.code = addPostAnimation(moveData2, postAnimation2);
                if(customParticleColour2 == "Custom"){
                    moveData2.code = changeParticleColor(moveData2, particleColour2, particleOpacity2, preAnimation2);
                }
            }
            if(attack3 != "---"){
                moveData3 = getMoveAnimationData(attack3);
                moveData3.code = selectAnimationCodeToUse(moveData3);
                if(background == "No Background" && moveData3.background == true && attack3KeepBackground == false){
                    moveData3.code = removeBackground(moveData3);
                }
                if(removeBlink == true){
                    moveData3.code = removeBlinkTemp(moveData3.code);
                }
                moveData3.code = trimTrailing08(moveData3.code);
                moveData3.code = addPreAnimation(moveData3, preAnimation3);
                moveData3.code = addPostAnimation(moveData3, postAnimation3);
                if(customParticleColour3 == "Custom"){
                    moveData3.code = changeParticleColor(moveData3, particleColour3, particleOpacity3, preAnimation3);
                }
            }
            if(attack4 != "---"){
                moveData4 = getMoveAnimationData(attack4);
                moveData4.code = selectAnimationCodeToUse(moveData4);
                if(background == "No Background" && moveData4.background == true && attack4KeepBackground == false){
                    moveData4.code = removeBackground(moveData4);
                }
                if(removeBlink == true){
                    moveData4.code = removeBlinkTemp(moveData4.code);
                }
                moveData4.code = trimTrailing08(moveData4.code);
                moveData4.code = addPreAnimation(moveData4, preAnimation4);
                moveData4.code = addPostAnimation(moveData4, postAnimation4);
                if(customParticleColour4 == "Custom"){
                    moveData4.code = changeParticleColor(moveData4, particleColour4, particleOpacity4, preAnimation4);
                }
            }

            combinedAnimation = concatAnimation(moveData1, moveData2, moveData3, moveData4);
            combinedAnimation = concat08(combinedAnimation);
            bytesNeeded = getBytesNeeded(combinedAnimation)
            createInsertWindow();
            insertWindow.webContents.on('did-finish-load', function () {
                insertWindow.webContents.send('setInsertWindowVariables', bytesNeeded, combinedAnimation);
            });   
        } 
        //CASE 2 User selects a specific Background. 
        //There are LOTS of weird use cases when the user selects a background but then wants to Keep a PSYCHIC background for 1 or more of the moves.
        //When a move has Keep Background checked, all the moves after it will use that background. For example -> Background: Dark; Moves: Absorb, tackle, Shadow Ball with Keep Background checked, Bite; Absorb and Tackle will use dark background, then Shadown Ball will use ghost background and then bite will use ghost background
        else {
            moveData1 = getMoveAnimationData(attack1);
            moveData1.code = selectAnimationCodeToUse(moveData1);
            if(moveData1.background == true && attack1KeepBackground == false){
                moveData1.code = removeBackground(moveData1)
            } else {
                //Just remove the black fade out at the end. One will get added later and we don't want to have 2 spearate fade outs
                moveData1.code = removeBackgroundEnding(moveData1.code);
                //Keep track if a psychic background was used
                if(moveData1.psychicBackground == true){
                    psychicBackgroundUsed = true;
                }
            }
            
            moveData1.code = trimTrailing08(moveData1.code)
            moveData1.code = addPreAnimation(moveData1, preAnimation1);
            moveData1.code = addPostAnimation(moveData1, postAnimation1)
            if(customParticleColour1 == "Custom"){
                moveData1.code = changeParticleColor(moveData1, particleColour1, particleOpacity1, preAnimation1);
            }

            if(attack2 != "---"){
                moveData2 = getMoveAnimationData(attack2);
                moveData2.code = selectAnimationCodeToUse(moveData2);
                if(moveData2.background == true && attack2KeepBackground == false){
                    moveData2.code = removeBackground(moveData2);
                } else {
                    moveData2.code = removeBackgroundEnding(moveData2.code);
                    if(moveData2.psychicBackground == true){
                        psychicBackgroundUsed = true;
                    }
                }
                moveData2.code = trimTrailing08(moveData2.code);
                moveData2.code = addPreAnimation(moveData2, preAnimation2);
                moveData2.code = addPostAnimation(moveData2, postAnimation2)
                if(customParticleColour2 == "Custom"){
                    moveData2.code = changeParticleColor(moveData2, particleColour2, particleOpacity2, preAnimation2);
                }
            }

            if(attack3 != "---"){
                moveData3 = getMoveAnimationData(attack3);
                moveData3.code = selectAnimationCodeToUse(moveData3);
                if(moveData3.background == true && attack3KeepBackground == false){
                    moveData3.code = removeBackground(moveData3);
                } else {
                    moveData3.code = removeBackgroundEnding(moveData3.code);
                     if(moveData3.psychicBackground == true){
                        psychicBackgroundUsed = true;
                    }
                }
                moveData3.code = trimTrailing08(moveData3.code);
                moveData3.code = addPreAnimation(moveData3, preAnimation3);
                moveData3.code = addPostAnimation(moveData3, postAnimation3)
                if(customParticleColour3 == "Custom"){
                    moveData3.code = changeParticleColor(moveData3, particleColour3, particleOpacity3, preAnimation3);
                }
            }

            if(attack4 != "---"){
                moveData4 = getMoveAnimationData(attack4);
                moveData4.code = selectAnimationCodeToUse(moveData4);
                if(moveData4.background == true && attack4KeepBackground == false){
                    moveData4.code = removeBackground(moveData4);
                } else {
                    moveData4.code = removeBackgroundEnding(moveData4.code);
                     if(moveData4.psychicBackground == true){
                        psychicBackgroundUsed = true;
                    } 
                }
                moveData4.code = trimTrailing08(moveData4.code);
                moveData4.code = addPreAnimation(moveData4, preAnimation4);
                moveData4.code = addPostAnimation(moveData4, postAnimation4);
                if(customParticleColour4 == "Custom"){
                    moveData4.code = changeParticleColor(moveData4, particleColour4, particleOpacity4, preAnimation4);
                }
            }

            combinedAnimation = concatAnimation(moveData1, moveData2, moveData3, moveData4);
            combinedAnimation = addBackground(combinedAnimation, background, scrollType, scrollSpeed, psychicBackgroundUsed)
            //If the background isn't Psychic, but a move with a psychic background was used and the user selected keep background, append the psychic closig to the end of the animation
            if(psychicBackgroundUsed == true && background != "Psychic (03)"){
                if(romType == "Fire Red"){
                    combinedAnimation = combinedAnimation.concat(" 0E C7 59 1D 08")
                } else if(romType == "Emerald"){
                    combinedAnimation = combinedAnimation.concat(" 0E DD 7C 2D 08")
                }
            } 
            if (background != "Psychic (03)"  && psychicBackgroundUsed == false && background != "Fissure (15)"
            && background != "Light Green" && background != "Deep Green" && background != "Light Red" && background != "Deep Red" && background != "Light Orange" && background != "Deep Orange" 
            && background != "Light Blue" && background != "Deep Blue" && background != "Light Sky Blue" && background != "Deep Sky Blue" && background != "Light Pink" && background != "Deep Pink"
            && background != "Light Purple" && background != "Deep Purple" && background != "Light Black" && background != "Deep Black"
            && scrollType == "No Scroll")
            {
                combinedAnimation = combinedAnimation.concat(" 15 17");
            }
            combinedAnimation = concat08(combinedAnimation);
            bytesNeeded = getBytesNeeded(combinedAnimation);
            createInsertWindow();
            insertWindow.webContents.on('did-finish-load', function () {
                insertWindow.webContents.send('setInsertWindowVariables', bytesNeeded, combinedAnimation);
            });
        }
    } else {
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
    var obj = getPostAnimationObject(data);
    postAnimationWindow.webContents.send('postAttackImage', data, obj);
   // loadPostAttackImageToUI(data);
});

ipcMain.on('preAttack:change', function(event, data) {
    var obj = getPreAnimationObject(data);
    preAnimationWindow.webContents.send('preAttackImage', data, obj);
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
});

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
                mainWindow.webContents.send('errorMessage', "Error: Could not open ROM for writing");
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

//Function recieves a move object and returns the animation code to use. (Either Fire Red  or Emerald)
function selectAnimationCodeToUse(moveData){
    if(romType == "Fire Red"){
        return moveData.code;
    } else if(romType == "Emerald"){
        return moveData.emeraldCode;
    }
}

//Function recieves a move name and returns its entire move object 
function getMoveAnimationData(move){
    var moveData;
    attackData.attacks.map(function(attack){
        if(move == attack.name){
            moveData = JSON.parse(JSON.stringify(attack));
        }
    })
    return moveData;
}

//Function receives Move Data Object and removes the background hex data from the animation code including the ending animation code
function removeBackground(moveData){
    //CASE 1 Remove Colored Background (i.e absorb, Ice Beam).
    if(moveData.coloredBackground == true && moveData.scroll == false){  
        //These moves can not have their colored backgrounds removed
        if (moveData.name == "Calm Mind 1" || moveData.name == "Explosion" || moveData.name == "Flatter"){
            return moveData.code;
        } 
        else if (moveData.name == "Thunderbolt" || moveData.name == "Thundershock" || moveData.name == "Thunder Wave" || moveData.name == "Volt Tackle"){
            return removeElectricBackground(moveData);
        }
        else if (moveData.name == "Glare" || moveData.name == "Hail" || moveData.name == "Rain Dance" || moveData.name == "Sky Attack Turn 1" || moveData.name == "Sunny Day"){
            return removeFadePalette(moveData)
        }
        else {
            return removeColoredBackground(moveData);
        }
    } 
    //CASE 2: Background is Psychic. No need to check for scroll as it doesn't work with Psychcic background
    else if(moveData.psychicBackground == true){
        return removePsychicBackground(moveData);
    }
    //CASE 3: Background is template like Ghost, Dark etc
    else{
        //If background isn't scrolling
        if(moveData.scroll == false){
            if (moveData.name == "Focus Punch" || moveData.name == "Hyper Fang" || moveData.name == "Mega Kick" || moveData.name == "Mega Punch"){
                return removeChooseBGImpact(moveData);
            }
            else if (moveData.name == "Guillotine"){
                return removeChooseBGGuillotine(moveData);
            }
            else if(moveData.name == "Destiny Bond" || moveData.name == "Grudge" || moveData.name == "Spite"){
                return removeDestinyBondBackground(moveData);
            } 
            else if(moveData.name == "Fissure"){
                return removeFissureBackground(moveData);
            } 
            else if(moveData.name == "Solarbeam Turn 2"){
                return removeSolarbeamBackground(moveData)
            }
            else {
                return removeStaticTemplateBackground(moveData);
            }
        } 
        //Else Background is scrolling vertically or horizontally
        else {
            if(moveData.name == "Aeroblast" || moveData.name == "Sky Attack Turn 2"){
                return removeScrollFlyingBackground(moveData);
            }
            return removeScrollingTemplateBackground(moveData);
        }   
    }
}


//Function recieves a move hex code and adds a background to it as well as the code to end the background at the end
function addBackground(hex, backgroundName, scrollType, scrollSpeed, psychicBackgroundUsed){
    var backgroundObject = getBackgroundObject(backgroundName)  //Gets ths background object i.e. (Dark (00), Ghost(02))
    var backgroundStart;
    var backgroundEnd;
    var emeraldColourCodePointer = background.coloredBackground[0].startOfEmeraldCodePointer;
    var fireRedColourCodePointer = background.coloredBackground[0].pointer;
    //Background is static (not scrolling)
    if(scrollType == "No Scroll"){
        if(backgroundName == "Psychic (03)"){
            if(romType == "Fire Red"){
                backgroundStart = background.srollBackground[0].psychicCode;
                hex = hex.concat(" 0E C7 59 1D 08");
            } else if(romType == "Emerald") {
                backgroundStart = background.srollBackground[0].psychicCodeEmerald;
                hex = hex.concat(" 0E DD 7C 2D 08");
            }
            hex = hex.replace(/^/, backgroundStart + " ");
        }
        else if(backgroundName == "Solarbeam (18)"){
            if(romType == "Fire Red"){
                backgroundStart = background.staticBackground[0].solarbeamCode;
            } else if(romType == "Emerald"){
                backgroundStart = background.staticBackground[0].solarbeamCodeEmerald;
            }
            hex = hex.replace(/^/, backgroundStart + " ");
        }
        else if(backgroundName == "High Impact (04)"){
            if(romType == "Fire Red"){
                backgroundStart = background.staticBackground[0].highImpactCode;
            } else if(romType == "Emerald"){
                backgroundStart = background.staticBackground[0].highImpactCodeEmerald;
            }
            hex = hex.replace(/^/, backgroundStart + " ");
        }
        else if(backgroundName == "Guillotine (0C)"){
            if(romType == "Fire Red"){
                backgroundStart = background.staticBackground[0].guillotineCode;
            } else if(romType == "Emerald"){
                backgroundStart = background.staticBackground[0].guillotineCodeEmerald;
            }
            hex = hex.replace(/^/, backgroundStart + " ");
        }
        else if(backgroundName == "Fissure (15)"){
            if(romType == "Fire Red"){
                backgroundStart = background.staticBackground[0].fissureBackgroundCode;
            } else if(romType == "Emerald"){
                backgroundStart = background.staticBackground[0].fissureBackgroundEmerald;
            }
            backgroundEnd = background.staticBackground[0].fissureBackgroundEndCode;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
        }
        else if(backgroundName == "Light Green"){
            backgroundStart = background.coloredBackground[0].lightGreen;
            var backgroundEnd = background.coloredBackground[0].lightGreenEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
            if(romType == "Emerald"){
                //Replace the start of Fire Red Colour background pointer with Emerald
                hex = replaceCode(hex, fireRedColourCodePointer, emeraldColourCodePointer)
            }
        }
        else if(backgroundName == "Deep Green"){
            backgroundStart = background.coloredBackground[0].deepGreen;
            var backgroundEnd = background.coloredBackground[0].deepGreenEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
            if(romType == "Emerald"){
                hex = replaceCode(hex, fireRedColourCodePointer, emeraldColourCodePointer)
            }
        }
        else if(backgroundName == "Deep Green Slow"){
            backgroundStart = background.coloredBackground[0].deepGreenSlow;
            var backgroundEnd = background.coloredBackground[0].deepGreenSlowEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
            if(romType == "Emerald"){
                hex = replaceCode(hex, fireRedColourCodePointer, emeraldColourCodePointer)
            }
        }
        else if(backgroundName == "Light Red"){
            backgroundStart = background.coloredBackground[0].lightRed;
            var backgroundEnd = background.coloredBackground[0].lightRedEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
            if(romType == "Emerald"){
                hex = replaceCode(hex, fireRedColourCodePointer, emeraldColourCodePointer)
            }
        }
        else if(backgroundName == "Deep Red"){
            backgroundStart = background.coloredBackground[0].deepRed;
            var backgroundEnd = background.coloredBackground[0].deepRedEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
            if(romType == "Emerald"){
                hex = replaceCode(hex, fireRedColourCodePointer, emeraldColourCodePointer)
            }
        }
        else if(backgroundName == "Deep Red Slow"){
            backgroundStart = background.coloredBackground[0].deepRedSlow;
            var backgroundEnd = background.coloredBackground[0].deepRedSlowEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
            if(romType == "Emerald"){
                hex = replaceCode(hex, fireRedColourCodePointer, emeraldColourCodePointer)
            }
        }
        else if(backgroundName == "Light Orange"){
            backgroundStart = background.coloredBackground[0].lightOrange;
            var backgroundEnd = background.coloredBackground[0].lightOrangeEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
            if(romType == "Emerald"){
                hex = replaceCode(hex, fireRedColourCodePointer, emeraldColourCodePointer)
            }
        }
        else if (backgroundName == "Deep Orange"){
            backgroundStart = background.coloredBackground[0].deepOrange;
            var backgroundEnd = background.coloredBackground[0].deepOrangeEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
            if(romType == "Emerald"){
                hex = replaceCode(hex, fireRedColourCodePointer, emeraldColourCodePointer)
            }
        }
        else if (backgroundName == "Deep Orange Slow"){
            backgroundStart = background.coloredBackground[0].deepOrangeSlow;
            var backgroundEnd = background.coloredBackground[0].deepOrangeSlowEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
            if(romType == "Emerald"){
                hex = replaceCode(hex, fireRedColourCodePointer, emeraldColourCodePointer)
            }
        }
        else if (backgroundName == "Light Blue"){
            backgroundStart = background.coloredBackground[0].lightBlue;
            var backgroundEnd = background.coloredBackground[0].lightBlueEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
            if(romType == "Emerald"){
                hex = replaceCode(hex, fireRedColourCodePointer, emeraldColourCodePointer)
            }
        }
        else if (backgroundName == "Deep Blue"){
            backgroundStart = background.coloredBackground[0].deepBlue;
            var backgroundEnd = background.coloredBackground[0].deepBlueEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
            if(romType == "Emerald"){
                hex = replaceCode(hex, fireRedColourCodePointer, emeraldColourCodePointer)
            }
        }
        else if(backgroundName == "Deep Blue Slow"){
            backgroundStart = background.coloredBackground[0].deepBlueSlow;
            var backgroundEnd = background.coloredBackground[0].deepBlueSlowEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
            if(romType == "Emerald"){
                hex = replaceCode(hex, fireRedColourCodePointer, emeraldColourCodePointer)
            }
        }
        else if (backgroundName == "Light Sky Blue"){
            backgroundStart = background.coloredBackground[0].lightSkyBlue;
            var backgroundEnd = background.coloredBackground[0].lightSkyBlueEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
            if(romType == "Emerald"){
                hex = replaceCode(hex, fireRedColourCodePointer, emeraldColourCodePointer)
            }
        }
        else if (backgroundName == "Deep Sky Blue"){
            backgroundStart = background.coloredBackground[0].deepSkyBlue;
            var backgroundEnd = background.coloredBackground[0].deepSkyBlueEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
            if(romType == "Emerald"){
                hex = replaceCode(hex, fireRedColourCodePointer, emeraldColourCodePointer)
            }
        }
        else if(backgroundName == "Deep Sky Blue Slow"){
            backgroundStart = background.coloredBackground[0].deepSkyBlueSlow;
            var backgroundEnd = background.coloredBackground[0].deepSkyBlueSlowEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
            if(romType == "Emerald"){
                hex = replaceCode(hex, fireRedColourCodePointer, emeraldColourCodePointer)
            }
        }
        else if (backgroundName == "Light Pink"){
            backgroundStart = background.coloredBackground[0].lightPink;
            var backgroundEnd = background.coloredBackground[0].lightPinkEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
            if(romType == "Emerald"){
                hex = replaceCode(hex, fireRedColourCodePointer, emeraldColourCodePointer)
            }
        }
        else if (backgroundName == "Deep Pink"){
            backgroundStart = background.coloredBackground[0].deepPink;
            var backgroundEnd = background.coloredBackground[0].deepPinkEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
            if(romType == "Emerald"){
                hex = replaceCode(hex, fireRedColourCodePointer, emeraldColourCodePointer)
            }
        }
        else if(backgroundName == "Deep Pink Slow"){
            backgroundStart = background.coloredBackground[0].deepPinkSlow;
            var backgroundEnd = background.coloredBackground[0].deepPinkSlowEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
            if(romType == "Emerald"){
                hex = replaceCode(hex, fireRedColourCodePointer, emeraldColourCodePointer)
            }
        }
        else if (backgroundName == "Light Purple"){
            backgroundStart = background.coloredBackground[0].lightPurple;
            var backgroundEnd = background.coloredBackground[0].lightPurpleEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
            if(romType == "Emerald"){
                hex = replaceCode(hex, fireRedColourCodePointer, emeraldColourCodePointer)
            }
        }
        else if (backgroundName == "Deep Purple"){
            backgroundStart = background.coloredBackground[0].deepPurple;
            var backgroundEnd = background.coloredBackground[0].deepPurpleEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
            if(romType == "Emerald"){
                hex = replaceCode(hex, fireRedColourCodePointer, emeraldColourCodePointer)
            }
        }
        else if(backgroundName == "Deep Purple Slow"){
            backgroundStart = background.coloredBackground[0].deepPurpleSlow;
            var backgroundEnd = background.coloredBackground[0].deepPurpleSlowEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
            if(romType == "Emerald"){
                hex = replaceCode(hex, fireRedColourCodePointer, emeraldColourCodePointer)
            }
        }
        else if (backgroundName == "Light Black"){
            backgroundStart = background.coloredBackground[0].lightBlack;
            var backgroundEnd = background.coloredBackground[0].lightBlackEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
            if(romType == "Emerald"){
                hex = replaceCode(hex, fireRedColourCodePointer, emeraldColourCodePointer)
            }
        }
        else if (backgroundName == "Deep Black") {
            backgroundStart = background.coloredBackground[0].deepBlack;
            var backgroundEnd = background.coloredBackground[0].deepBlackEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
            if(romType == "Emerald"){
                hex = replaceCode(hex, fireRedColourCodePointer, emeraldColourCodePointer)
            }
        }
        else if (backgroundName == "Deep Black Slow"){
            backgroundStart = background.coloredBackground[0].deepBlackSlow;
            var backgroundEnd = background.coloredBackground[0].deepBlackSlowEnd;
            hex = hex.replace(/^/, backgroundStart + " ");
            hex = hex.concat(backgroundEnd);
            if(romType == "Emerald"){
                hex = replaceCode(hex, fireRedColourCodePointer, emeraldColourCodePointer)
            }
        }
        else {
            backgroundStart = background.staticBackground[0].code;
            backgroundStart = addBackgroundIdToCode(backgroundStart, backgroundObject.code);
            hex = hex.replace(/^/, backgroundStart + " ");
            //hex = hex.concat(" 15 17");
        }
    } 
    //Background is scrolling vertically or horizontally
    else{
        if(romType == "Fire Red"){
            backgroundStart = background.srollBackground[0].code;
        } else if(romType == "Emerald"){
            backgroundStart = background.srollBackground[0].codeEmerald;
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
        //If a Psychic background has already been used in the animation, Psychic ending has already been appended to the end, so no need to add background scroll ending on top of that.
        if(psychicBackgroundUsed == false){
            hex = hex.concat(" 15 16 10 07 FF FF 17")
        }
    }
    return hex;
}

//Function removes the Background and background ending for Aeroblast and Sky Attack Turn 2
function removeScrollFlyingBackground(moveData){
    var codeWithoutBackground = "";
    var positionToDelete;
    var positionEndToDelete;
    var aeroblastCode;
    var aeroblastEndCode;

    if(romType == "Fire Red"){
        if(moveData.name == "Aeroblast"){
            aeroblastCode = background.srollBackground[0].aeroblastCode;
            aeroblastEndCode = background.srollBackground[0].aeroblastEndCode;
        } else if(moveData.name == "Sky Attack Turn 2"){
            aeroblastCode = background.srollBackground[0].skyAttackCode;
            aeroblastEndCode = background.srollBackground[0].aeroblastEndCode;
        }
    } else if(romType == "Emerald"){
        if(moveData.name == "Aeroblast"){
            aeroblastCode = background.srollBackground[0].aeroblastCodeEmerald;
            aeroblastEndCode = background.srollBackground[0].aeroblastEndCodeEmerald;
        } else if(moveData.name == "Sky Attack Turn 2"){
            aeroblastCode = background.srollBackground[0].skyAttackCodeEmerald;
            aeroblastEndCode = background.srollBackground[0].skyAttackEndCodeEmerald;
        }
    }
    positionToDelete = findWhereCodeBegins(moveData.code, aeroblastCode);
    positionEndToDelete = findWhereCodeBegins(moveData.code, aeroblastEndCode)

    //Delete Bytes
    for(var i=0; i<moveData.code.length; i++){
         //Skip over background
        if(i == positionToDelete){
            i += aeroblastCode.length;
        }
        if(i == positionEndToDelete){
            i += aeroblastEndCode.length;
        }
        codeWithoutBackground += moveData.code[i];
    }
    return codeWithoutBackground;
}

//Function removes the Fissure background from an animation
function removeFissureBackground(moveData){
    var codeWithoutBackground = "";
    var fissureBackgroundPos;
    var scrollEndingPos;
    var fissureBackgroundCode;
    var scrollEndingCode =  background.srollBackground[0].scrollEnding; //Fissure uses scrollEnding to end Fissure background
    
    if(romType == "Fire Red"){
        fissureBackgroundCode = background.staticBackground[0].fissureBackground;
    } else if(romType == "Emerald"){
        fissureBackgroundCode = background.staticBackground[0].fissureBackgroundEmerald;
    }

    fissureBackgroundPos = findWhereCodeBegins(moveData.code, fissureBackgroundCode);
    scrollEndingPos = findWhereCodeBegins(moveData.code, scrollEndingCode);

    for(var i=0; i<moveData.code.length; i++){
        if (i == fissureBackgroundPos){
            i += fissureBackgroundCode.length;
        }
        if (i == scrollEndingPos){
            i += scrollEndingCode.length;
        }
        codeWithoutBackground += moveData.code[i];
    }
    return codeWithoutBackground;
}

function removeSolarbeamBackground(moveData){
    var codeWithoutBackground = "";
    var solarbeamLoadPosition;
    var solarbeamEndPosition;
    var solarbeamStartCode
    var solarbeamEndCode

    if(romType == "Fire Red"){
        solarbeamStartCode = background.staticBackground[0].solarbeamCode;
        solarbeamEndCode = background.staticBackground[0].solarbeamEndCode;
    } else if(romType == "Emerald"){
        solarbeamStartCode = background.staticBackground[0].solarbeamCodeEmerald;
        solarbeamEndCode = background.staticBackground[0].solarbeamEndCodeEmerald;
    }

    solarbeamLoadPosition = findWhereCodeBegins(moveData.code, solarbeamStartCode);
    solarbeamEndPosition = findWhereCodeBegins(moveData.code, solarbeamEndCode);

    for(var i=0; i<moveData.code.length; i++){
        if (i == solarbeamLoadPosition){
            i += solarbeamStartCode.length;
        }
        if (i == solarbeamEndPosition){
            i += solarbeamEndCode.length;
        }
        codeWithoutBackground += moveData.code[i];
    }
    return codeWithoutBackground;
}

//Function recieves a move object for a scrolled animation and removes the background from it
function removeScrollingTemplateBackground(moveData){
    var codeWithoutBackground = "";
    var scrollingBackgroundLoadPosition;
    var scrollingFadeoutPosition;
    var psychicEndingPosition;
    var blackFadeoutPosition;
    var scrollingFadeoutCode = background.srollBackground[0].scrollEnding;
    var psychicEndingCode =  background.srollBackground[0].endingCode;
    var blackFadeoutCode =  background.staticBackground[0].blackFadeout;

    scrollingBackgroundLoadPosition = findStartOfScrollingBackground(moveData.code);
    scrollingFadeoutPosition = findWhereCodeBegins(moveData.code, scrollingFadeoutCode);
    psychicEndingPosition = findWhereCodeBegins(moveData.code, psychicEndingCode);
    blackFadeoutPosition = findWhereCodeBegins(moveData.code, blackFadeoutCode);
    
    //Delete Bytes
    for(var i=0; i<moveData.code.length; i++){
        if(i == scrollingBackgroundLoadPosition){
            i += 53; //Length of scrolling background code
        }
        if(i == scrollingFadeoutPosition){
            i += scrollingFadeoutCode.length;
        }
        if(i == psychicEndingPosition){
            i += psychicEndingCode.length;
        }
        if(i == blackFadeoutPosition){
            i += blackFadeoutCode.length;
        }
        codeWithoutBackground += moveData.code[i];
    }
    return codeWithoutBackground;
}

//This function removes the background from moves with the Impact background that changes depending on if the user or foe is attacking. I.e. Mega Punch, Focus Punch etc
function removeChooseBGImpact(moveData){
    var codeWithoutBackground = "";
    var chooseBGImpactCode = background.generalCommands[0].chooseBGImpact;  //... 16
    var chooseBGImpactTransparent = background.generalCommands[0].chooseBGImpactTransparent; //... 17
    var transparentFadeoutCode = background.generalCommands[0].waitForTransparentBGFadeOut; //15 17
    var blackFadeoutCode = background.staticBackground[0].blackFadeout; //15 16
    var chooseBackgroundPos;
    var chooseBackgroundTransparentPos
    var transparenFadeoutPos;
    var chooseBgAlternatePos;
    var colorCodeStart;
    var colorCodeLength = background.coloredBackground[0].code.length; //53
    var chooseBGImpactAlternate;
    var colourCodePositions = [];

    if(romType == "Fire Red"){
        colorCodeStart = background.coloredBackground[0].startOfCode;
        chooseBGImpactAlternate = background.generalCommands[0].chooseBGImpactAlternate;
    } else if (romType == "Emerald"){
        colorCodeStart = background.coloredBackground[0].startOfEmeraldCode; 
        chooseBGImpactAlternate = background.generalCommands[0].chooseBGImpactAlternateEmerald;
    }

    chooseBackgroundPos = findWhereCodeBegins(moveData.code, chooseBGImpactCode);
    chooseBackgroundTransparentPos = findWhereCodeBegins(moveData.code, chooseBGImpactTransparent);
    transparenFadeoutPos = findWhereCodeBegins(moveData.code, transparentFadeoutCode);
    blackFadeoutPosition = findWhereCodeBegins(moveData.code, blackFadeoutCode);
    colourCodePositions = findWhereCodeExists(moveData.code, colorCodeStart);
    chooseBgAlternatePos = findWhereCodeBegins(moveData.code, chooseBGImpactAlternate);

    for(var i=0; i<moveData.code.length; i++){
        if (i == chooseBackgroundPos){
            i += chooseBGImpactCode.length;
        }
        if(i == chooseBackgroundTransparentPos){
            i += chooseBGImpactTransparent.length;
        }
        if(i == transparenFadeoutPos){
            i += transparentFadeoutCode.length;
        }
        if(i == blackFadeoutPosition){
            i += blackFadeoutCode.length;
        }
        if(i == chooseBgAlternatePos){
            i += chooseBGImpactAlternate.length;
        }
        if(i == colourCodePositions[0]){
            i += colorCodeLength - 2; //Wait command isn't used for impact color code
            colourCodePositions.shift();
        }
        codeWithoutBackground += moveData.code[i];
    }
    return codeWithoutBackground;
}

//Function removes the Choose Guillotine background command from an animation
function removeChooseBGGuillotine(moveData){
    var codeWithoutBackground = "";
    var chooseBGGuillotineCode = background.generalCommands[0].chooseBGGuillotineTransparent; 
    var transparentFadeoutCode = background.generalCommands[0].waitForTransparentBGFadeOut; 
    var chooseBackgroundPos;
    var transparentFadeoutPos;

    chooseBackgroundPos = findWhereCodeBegins(moveData.code, chooseBGGuillotineCode);
    transparentFadeoutPos = findWhereCodeBegins(moveData.code, transparentFadeoutCode);

    for(var i=0; i<moveData.code.length; i++){
        if(i == chooseBackgroundPos){
            i += chooseBGGuillotineCode.length;
        }
        if(i == transparentFadeoutPos){
            i += transparentFadeoutCode.length;
        }
        codeWithoutBackground += moveData.code[i];
    }
    return codeWithoutBackground;
}

function removeStaticTemplateBackground(moveData){
    var position = 0;
    var positionToDelete = []; //Start of background
    var positionEndToDelete = []; //End of some backgrounds
    var codeWithoutBackground = "";
    var reachedPosition;
    var blackScreenReached;

    //Some template backgrounds also have colored backgrounds that you also need to remove (Ex: Icy Wind)
    if(moveData.name == "Icy Wind"){
        moveData.code = removeFadePalette(moveData);
    }

    //Search for 14 WW 17 or 14 WW 16 where WW can be 00 - 1A
    //Search for 15 (17 or 16) (split second black screen often used at the end of animations like Shadow Ball and Confuse Ray)
    for (var i=0; i<moveData.code.length; i++){
        if(moveData.code[i] == '1' && moveData.code[i+1] == '4' && moveData.code[i+6] == "1" && (moveData.code[i+7] == "7" || moveData.code[i+7] == "6")){
            positionToDelete.push(position);
        }
        if(moveData.code[i] == '1' && moveData.code[i+1] == '5' && moveData.code[i+3] == '1' && (moveData.code[i+4] == '7' || moveData.code[i+4] == '6')){
            positionEndToDelete.push(position);
        }
        position += 1;
    }

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

//Destiny Bond background doesn't load background like other moves. It loads background partially (14 02 instead of 14 02 16), does something else and then waits for background to fully load (17)
function removeDestinyBondBackground(moveData){
    var codeWithoutBackground = "";
    var backgroundBeginPos;
    var transparentBGLoadPos;
    var blackFadeoutPos;
    var partialBackgroundLoad = "14 02"
    var WaitForTransparentBGLoad = background.generalCommands[0].waitForTransparentBGLoad; 
    var blackFadeoutCode =  background.generalCommands[0].waitForTransparentBGFadeOut;

    backgroundBeginPos = findWhereCodeBegins(moveData.code, partialBackgroundLoad);
    transparentBGLoadPos = findWhereCodeBegins(moveData.code, WaitForTransparentBGLoad);
    blackFadeoutPos = findWhereCodeBegins(moveData.code, blackFadeoutCode);

    for(var i=0; i<moveData.code.length; i++){
        if(i == backgroundBeginPos){
            i += partialBackgroundLoad.length;
        }
        if(i == transparentBGLoadPos){
            i += WaitForTransparentBGLoad.length;
        }
        if(i == blackFadeoutPos){
            i += blackFadeoutCode.length;
        }
        codeWithoutBackground += moveData.code[i];
    }
    return codeWithoutBackground;
}

//Function receives a move data object and removes the Psychic background from it
function removePsychicBackground(moveData){
    var codeWithoutBackground = "";
    var psychicStartCode;
    var psychicEndCode;
    var psychicStartPosition;
    var psychicEndPosition;
    var psychicRareStartPosition; //Only for Luster Purge and Psycho Boost
    var psychicRareStartCode; 

    if(romType == "Fire Red"){
        psychicStartCode = background.srollBackground[0].psychicCode; 
        psychicEndCode = background.srollBackground[0].endingCode; 
        psychicRareStartCode = background.srollBackground[0].psychicCodeRare; 
    } else if(romType == "Emerald"){
        psychicStartCode = background.srollBackground[0].psychicCodeEmerald; 
        psychicEndCode = background.srollBackground[0].psychicEndingCodeEmerald; 
        psychicRareStartCode = background.srollBackground[0].psychicCodeRareEmerald;
    }

    psychicStartPosition = findWhereCodeBegins(moveData.code, psychicStartCode);
    psychicEndPosition = findWhereCodeBegins(moveData.code, psychicEndCode);
    psychicRareStartPosition = findStartOfScrollingBackground(moveData.code, psychicRareStartCode);

    //Skip over Bytes
    for(var i=0; i<moveData.code.length; i++){
        if(i == psychicStartPosition){
            i +=  psychicStartCode.length;
        }
        if(i == psychicRareStartPosition){
            i += psychicRareStartCode.length;
        }
        if(i == psychicEndPosition){
            i += psychicEndCode.length;
        }
        codeWithoutBackground += moveData.code[i];
    }
    return codeWithoutBackground;
}

//Function removes a colored background from its animation
//For some reason, a handful of Emerald colored animations use a different start code which means standard algorithm wont pick them up. They must be manually entered. More research/testing needed
function removeColoredBackground(moveData){
    var colorCodeStart;
    var fadeTempCodeStart;
    var aromatherapyCodeStart;
    var fireBlastCodeStart;
    var frenzyPlantCodeStart;
    var powderSnowStart;
    var scaryFaceStart;
    var spiderWebStart;
    var colorCodeLength;
    var codeWithoutBackground="";
    var coloredCodePosition = [];

    if(romType == "Fire Red"){
        colorCodeStart = background.coloredBackground[0].startOfCode;
        fadeTempCodeStart = background.generalCommands[0].fadeTempStart;
        aromatherapyCodeStart = background.aromatherapyBackground[0].startOfCodeAromatherapy;
        fireBlastCodeStart = background.fireBlastBackground[0].startOfBackground;
        frenzyPlantCodeStart = background.frenzyPlantBackground[0].startOfBackground;
        powderSnowStart = background.powderSnowBackground[0].startOfBackground;
        scaryFaceStart = background.scaryFaceBackground[0].startOfBackground;
        spiderWebStart = background.spiderWebBackground[0].startOfBackground;
    } else if (romType == "Emerald"){
        colorCodeStart = background.coloredBackground[0].startOfEmeraldCode; 
        fadeTempCodeStart = background.generalCommands[0].fadeTempStartEmerald;
        aromatherapyCodeStart = background.aromatherapyBackground[0].startOfCodeAromatherapyEmerald;
        fireBlastCodeStart = background.fireBlastBackground[0].startOfBackgroundEmerald;
        frenzyPlantCodeStart = background.frenzyPlantBackground[0].startOfBackgroundEmerald;
        powderSnowStart = background.powderSnowBackground[0].startOfBackgroundEmerald;
        scaryFaceStart = background.scaryFaceBackground[0].startOfBackgroundEmerald;
        spiderWebStart = background.spiderWebBackground[0].startOfBackgroundEmerald;
    }
    
    //Some moves have their own slight variations to the colored background code
    if(moveData.name == "Eruption"){
        colorCodeStart = fadeTempCodeStart;
        colorCodeLength = background.generalCommands[0].fadeTempCode.length; //34
    } else if(moveData.name == "Aromatherapy"){
        colorCodeStart = aromatherapyCodeStart;
        //colorCodeLength = background.aromatherapyBackground[0].code.length; //51
        colorCodeLength = background.coloredBackground[0].code.length;
    } 
    else if(moveData.name == "Fire Blast"){
        colorCodeStart = fireBlastCodeStart;
       // colorCodeLength = background.fireBlastBackground[0].code.length; //51
       colorCodeLength = background.coloredBackground[0].code.length;
    } else if(moveData.name == "Frenzy Plant"){
        colorCodeStart = frenzyPlantCodeStart;
      //  colorCodeLength = background.frenzyPlantBackground[0].code.length; //
      colorCodeLength = background.coloredBackground[0].code.length;
    } else if(moveData.name == "Powder Snow"){
        colorCodeStart = powderSnowStart;
        colorCodeLength = background.coloredBackground[0].code.length;
    } else if(moveData.name == "Scary Face"){
        colorCodeStart = scaryFaceStart;
        colorCodeLength = background.coloredBackground[0].code.length;
    } else if(moveData.name == "Spider Web" || moveData.name == "String Shot"){
        colorCodeStart = spiderWebStart;
        colorCodeLength = background.coloredBackground[0].code.length;
    }
    //All other colored background that use standard method
    else {
        colorCodeLength = background.coloredBackground[0].code.length; //53
    }

    coloredCodePosition = findWhereCodeExists(moveData.code, colorCodeStart);

    for(var i=0; i<moveData.code.length; i++){
        if(i == coloredCodePosition[0]){
            //If colored background ends with wait command (05) delete that too
            if(checkForEndingWaitAnimation(moveData.code, coloredCodePosition[0], colorCodeLength) ){
                i += colorCodeLength;
            } else {
                i += (colorCodeLength - 2);
            }
            coloredCodePosition.shift();
        }
        codeWithoutBackground += moveData.code[i];
    }
    return codeWithoutBackground;
}

//Function recieves one of a few electric moves and removes the light black custom background used in it
function removeElectricBackground(moveData){
    var codeWithoutBackground="";
    var reachedPosition;
    var position = 0;
    var electricPositionToDelete = [];
    var colorCodeStart;
    
    if(romType == "Fire Red"){
        colorCodeStart = background.coloredBackground[0].startOfElectricCode; //03 F9 A7 0B 08 0A 05 01 00 00 00 00 00 06 00 00 00 05
    } else if(romType == "Emerald"){
        colorCodeStart = background.coloredBackground[0].startOfElectricCodeEmerald; 
    }

    for(var i=0; i<moveData.code.length; i++){
        if(moveData.code[i] == colorCodeStart[0] && moveData.code[i+1] == colorCodeStart[1] && moveData.code[i+3] == colorCodeStart[3] && moveData.code[i+4] == colorCodeStart[4]){ //Only need to search for 03 F9 A7 0B 08
            electricPositionToDelete.push(position)
        }  
        position += 1; 
    }

    for(var i=0; i<moveData.code.length; i++){
        reachedPosition = false
        for(var j=0; j<electricPositionToDelete.length; j++){
            if(i == electricPositionToDelete[j]){
                reachedPosition = true
            } 
        }
        if(reachedPosition == true){
            //Some electric moves have an 04 appended, but not always. Example is Thunderbolt. If 04 is present, delete it too
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

//Function receives a background and removes the ending (fade) part of the animation i.e (15 17) or Psychic ending. Does NOT touch Colored Ending
function removeBackgroundEnding(hex){
    var codeWithoutEndFade = "";
    var blackFadeoutCode = background.staticBackground[0].blackFadeout;
    var blackFadeoutTransparentCode = background.generalCommands[0].waitForTransparentBGFadeOut;
    var psychicEndingCode;
    

    if(romType == "Fire Red"){
        psychicEndingCode = background.srollBackground[0].endingCode;
    } else if(romType == "Emerald"){
        psychicEndingCode = background.srollBackground[0].psychicEndingCodeEmerald;
    }

    var blackFadeoutPos = findWhereCodeBegins(hex, blackFadeoutCode);
    var blackFadeoutTransparentPos = findWhereCodeBegins(hex, blackFadeoutTransparentCode);
    var psychicEndPos = findWhereCodeBegins(hex, psychicEndingCode);

    for(var i=0; i<hex.length; i++){
        if (i == blackFadeoutPos){
            i += blackFadeoutCode.length;
        }
        if(i == blackFadeoutTransparentPos){
            i += blackFadeoutTransparentCode.length;
        }
        if(i == psychicEndPos){
            i += psychicEndingCode.length;
        }
        codeWithoutEndFade += hex[i]
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
        //If rom is Emerald, switch to Emerald Code
        if(romType == "Emerald"){
            postAnimationObjectToAdd.pointer = postAnimationObjectToAdd.emeraldPointer;
        }
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

        if(romType == "Emerald"){
            preAnimationObjectToAdd.pointer = preAnimationObjectToAdd.emeraldPointer;
            preAnimationObjectToAdd.ending = preAnimationObjectToAdd.endingEmerald;
        }

        //Add the animation pointer to the start
        moveData.code = moveData.code.replace(/^/, preAnimationObjectToAdd.pointer + " ");

        //Add any imports to the start
        if(preAnimationObjectToAdd.import != ""){
            moveData.code = moveData.code.replace(/^/, preAnimationObjectToAdd.import + " ");
        }

        //Add any ending commands to the end
        if(preAnimationObjectToAdd.ending != ""){
            moveData.code = moveData.code.concat(" " + preAnimationObjectToAdd.ending)
        }

        return moveData.code;
    }
}

//Function recieves a move and changes the color of each particle in it (if it has one) to specified color/opacity
function changeParticleColor(moveData, particleColour, particleOpacity, preAnimation){
    //Get all the particles
    var particles = getAllParticlesFromAnimation(moveData.code, preAnimation)

    //If no particles, just return
    if(particles.length == 0){
        return moveData.code;
    } else {
        //Convert color to GBA format
        var colorCode = hexToE(particleColour);
        //Swap particle color >> AABB to BBAA
        colorCode = colorCode.substring(2) + colorCode.substring(0, 2);

        var codeToAdd = [];
        for(var i=0; i<particles.length; i++){
            //Trim the 00 + space at the start of each particle code as it's not needed
            particles[i] = particles[i].substring(3);
            codeToAdd.push(createParticleColorCode(particles[i], colorCode, particleOpacity))
        }
        //Now its time to insert the code. Needs to be inserted AFTER the last particle decleration
        var positionToInsert = findWhereCodeBegins(moveData.code, particles[particles.length - 1])
        positionToInsert += 6 //Skip over final particle decleration => 00 XX 27.
        
        var newCode = "";
        for(var i=0; i<moveData.code.length; i++){
            if(i == positionToInsert){
                //Insert colored particle code
                for(var j=0; j<codeToAdd.length; j++){
                   // for(var z=0; z<codeToAdd[j].length; z++)
                    newCode += (codeToAdd[j])
                } 
            }
            newCode += moveData.code[i];
        }
        return newCode;
    }
   
}

//Function creates and returns the code that changes the color/opacity of the given particle
function createParticleColorCode(particle, colorCode, particleOpacity){
    var baseCode; 
    if(romType == "Fire Red"){
        baseCode = background.nonBackgroundCommands[0].colourParticle;
    } else if(romType == "Emerald"){
        baseCode = background.nonBackgroundCommands[0].colourParticleEmerald;
    }

    //Append 0 to if value is 0-9. (This ensures result is 01, not 1 for example)
    if(particleOpacity.length = 1){
        particleOpacity = "0" + particleOpacity
    }
    baseCode = baseCode.replaceAll('XX', particle)
    baseCode = baseCode.replaceAll('YY', particleOpacity)
    baseCode = baseCode.replaceAll('ZZ', colorCode)
    
    return baseCode;
}

//Function recieves animation code and searches for all particle declarations -> 00 XX 27 or 00 xx 28 and returns them in an array
//Since particle declarations only happen at the beginning of the code, we only need to search in the first 30 byes
//Since an animation might have a pre animation, you have to look further into the code to find the particle declarations
function getAllParticlesFromAnimation(code, preAnimation){
    var particleArray = [];
    var bytes = 33;

    if(code.length < 33){
        bytes = code.length;
    }

    //Increase the search radius for particle declerations if the animation has a pre animation
    if(preAnimation != "None"){
        var preAnimationObjectToAdd = getPreAnimationObject(preAnimation);
        bytes += preAnimationObjectToAdd.pointer.length;
    }

    for(var i=0; i<bytes; i++){
        if(code[i] == '0' && code[i+1] == '0' && code[i+6] == '2' && (code[i+7] == '7' || code[i+7] == '8')){
            particleArray.push(code[i] + "" + code[i+1] + " " + code[i+3] +"" + code[i+4] + " " + code[i+6] + "" + code[i+7])
        }
    }
    
    return particleArray;

}

function hexToE(h){
	// get int values of html hex RGB components
	var red = parseInt((cutHex(h)).substring(0,2),16);	
	var green = parseInt((cutHex(h)).substring(2,4),16);
	var blue = parseInt((cutHex(h)).substring(4,6),16)

	// reduce to 5-bit integer values
	red = Math.floor(red/8);
	green = Math.floor(green/8);
	blue = Math.floor(blue/8);

	// convert 5-bit RGB values to binary and combine
	var bR = PadZero(5,red.toString(2));
	var bG = PadZero(5,green.toString(2));
	var bB = PadZero(5,blue.toString(2));
	var bBGR = bB + bG + bR;

	// convert final binary value to hex
	var hfinal = PadZero(4,Bin2Hex(bBGR).toUpperCase());
	return hfinal;
}

function cutHex(h) { return (h.charAt(0)=="#") ? h.substring(1,7) : h}
function checkBin(n){return/^[01]{1,64}$/.test(n)}
function Bin2Hex(n){if(!checkBin(n))return 0;return parseInt(n,2).toString(16)}
function PadZero(len, input, str){
	return Array(len-String(input).length+1).join(str||'0')+input;
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

    if(romType == "Emerald"){
        postAnimationObject.pointer = postAnimationObject.emeraldPointer;
    }

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

//Function receives code for a scrolling background and searches for 1st instance of 14 XX 17 03 or 14 XX 16 03
function findStartOfScrollingBackground(code){
    for(var i=0; i<code.length; i++){
        if(code[i] == '1' && code[i+1] == '4' && code[i+6] == '1' && (code[i+7] == '7' || code[i+7] == '6') && code[i+9] == '0' && code[i+10] == '3'){
            return i;
        }
    }
}

//Function receives animation code and finds the starting position of ALL instances of colored backgrounds
function findAllColoredBackgrounds(code){
    var array = [];
    var coloredBackground = background.coloredBackground[0].startOfCode;

    for(var i=0; i<code.length; i++){
        var found = true;
        var pos = i
        for(var j=0; j<coloredBackground.length; j++){
            if(code[pos] != coloredBackground[j]){
                found = false;
                break;
            }
            pos++;
        }
        if(found == true){
            array.push(i);
        }
    }
    return array;
}

//Function recieves an animation code, and a string of characters to search for. It returns the FIRST location where these string of characters begin
//Example: code = 10 11 12 13 14 15 -> stringToSearchFor = 13 14 >>>>>  function will return 9 as 13 14 occurs 9 spaces from the start of code
function findWhereCodeBegins(code, stringToSearchFor){
    for(var i=0; i<code.length; i++){
        var found = true;
        var pos = i
        for(var j=0; j<stringToSearchFor.length; j++){
            if(code[pos] != stringToSearchFor[j]){
                found = false;
                break;
            }
            pos++;
        }
        if(found == true){
            return i;
        }
    }
}

//The same as findWhereCodeBegins except this will return ALL locations of the string instead of just the 1st
function findWhereCodeExists(code, stringToSearchFor){
    var array = []
    for(var i=0; i<code.length; i++){
        var found = true;
        var pos = i
        for(var j=0; j<stringToSearchFor.length; j++){
            if(code[pos] != stringToSearchFor[j]){
                found = false;
                break;
            }
            pos++;
        }
        if(found == true){
            array.push(i);
        }
    }
    return array;
}

//Function replaces code at a specific loctation with different code
function replaceCode(code, codeToReplace, codeToAdd){
    var newCode = ""
    var positionToDelete = [];

    positionToDelete = findWhereCodeExists(code, codeToReplace);

    for(var i=0; i<code.length; i++){
        if(i == positionToDelete[0]){
            //Skip over code
            i += codeToReplace.length;
            positionToDelete.shift();
            //Add new code in its place
            for(var j=0; j<codeToAdd.length; j++){
                newCode += codeToAdd[j];
            }
        }
        if(typeof(code[i]) != "undefined"){
            newCode += code[i];
        }
    }
    return newCode;
}

//Function recieves an animation code and removes the BlinkTemp command from it
//Blink Template is a command that causes the screen to flash between 2 colours over a period of time, Example: Explosion OR is used on impact as a quick flash such as Blaze Kick/Double Edge
function removeBlinkTemp(code){
    var blinkTemplateShort;
    var blinkTemplate = background.generalCommands[0].blinkTemplate;
    var blinkPositions = [];
    var codeWithoutBlinkTemplate = ""

    if(romType == "Fire Red"){
        blinkTemplateShort = background.generalCommands[0].blinkTemplateStart;
    } else if(romType == "Emerald"){
        blinkTemplateShort = background.generalCommands[0].blinkTemplateEmeraldStart;
    }

    blinkPositions = findWhereCodeExists(code, blinkTemplateShort);

    for(var i=0; i<code.length; i++){
        if(i == blinkPositions[0]){
            //Some blink templates end in 05. If so, delete the 05 as well
            if(checkForEndingWaitAnimation(code, blinkPositions[0], blinkTemplate.length)){
                i += blinkTemplate.length;
            } else {
                i += (blinkTemplate.length - 2);
            }   
            blinkPositions.shift();
        }
        codeWithoutBlinkTemplate += code[i];
    }
    return codeWithoutBlinkTemplate;
}

//Function recieves an animation code and removes the fade palette code from it
function removeFadePalette(moveData){
    var fadePaletteShort;
    var fadePalette = background.generalCommands[0].fadePaletteCode;
    var fadePalettePositions = [];
    var codeWithoutFadePalette = ""

    if(romType == "Fire Red"){
        fadePaletteShort = background.generalCommands[0].fadePaletteStart;
    } else if (romType == "Emerald"){
        fadePaletteShort = background.generalCommands[0].fadePaletteStartEmerald;
    }

    fadePalettePositions = findWhereCodeExists(moveData.code, fadePaletteShort);

    for(var i=0; i<moveData.code.length; i++){
        if(i == fadePalettePositions[0]){
            i += fadePalette.length;
            fadePalettePositions.shift();
        }
        codeWithoutFadePalette += moveData.code[i];
    }
    return codeWithoutFadePalette;
}

//Function recieves animation code and checks to see if the last 2 bytes are the wait animation command (05)
//Recieves 3 arguments. 1st is the entire animation code. 2nd is index to start looking from. 3rd is index to stop looking from
function checkForEndingWaitAnimation(code, searchFromIndex, searchToIndex){
    var section;

    for(var i=searchFromIndex; i<(searchFromIndex + searchToIndex); i++){
        section += code[i];
    }
    var bit1 = (section[section.length - 2]);
    var bit2 = (section[section.length - 1]);
    bit1 = bit1.concat(bit2);
    if(bit1 == "05"){
        return true;
    } else {
        return false;
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

function replaceCodeWithGivenValue(code, value, codeToReplace){
    return code.replace(codeToReplace, value)
}

function concatAnimation(move1, move2, move3, move4){
    var combinedAnimation = move1.code
    if(typeof(move2) != 'undefined'){
        combinedAnimation = combinedAnimation.concat(move2.code);
    }
    if(typeof(move3) != 'undefined'){
        combinedAnimation = combinedAnimation.concat(move3.code);
    }
    if(typeof(move4) != 'undefined'){
        combinedAnimation = combinedAnimation.concat(move4.code);
    }
    return combinedAnimation;
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

