const electron = require('electron');
const {ipcRenderer} = electron;

ipcRenderer.on('romName', (event, accessToken) => {
    document.getElementById("romFileName").innerText = accessToken;
});

ipcRenderer.on('backgroundImage', (event, accessToken) => {
    document.getElementById("displayBackgroundImage").src = "./data/background/images/" + accessToken + ".png";
});

//Rom not loaded. Display error popup
ipcRenderer.on('romNotLoaded', (event) => {
    alert("Error: ROM not loaded")
});

//Generic Popup Error Message
ipcRenderer.on('errorMessage', (event, message) => {
    console.log('errorrrr')
    console.log(message)
    alert(message)
});


//Handles which radio buttons to enable/disable depending on background. Some backgrounds don't allow certain scrolling types
ipcRenderer.on('scrollRadioButton', (event, vertical, horizontal) => {

    //If background has no vertical or background scroll, disable scroll speed
    if(vertical != true && horizontal != true){
        document.getElementById("select-scrollSpeed").disabled = true;
    } else {
        document.getElementById("select-scrollSpeed").disabled = false;
    }

    //If background has no vertical scroll option, disable vertical scroll button and reset to None Selected
    if(vertical != true){
        document.getElementById("verticalScroll").disabled = true;
        document.getElementById("verticalScroll").checked = false;
        document.getElementById("noScroll").checked = true;
    } else{
        document.getElementById("verticalScroll").disabled = false;
    }

    //If background has no horizontal scroll option, disable vertical scroll button and reset to None Selected
    if(horizontal != true){
        document.getElementById("horizontalScroll").disabled = true;
        document.getElementById("horizontalScroll").checked = false;
        document.getElementById("noScroll").checked = true;
    } else{
        document.getElementById("horizontalScroll").disabled = false;
    }
});

//Handles disabling/enabling Keep Background Checkboxes
ipcRenderer.on('keepBackgroundCheckbox', (event, backgroundName) => {
    //Disable checkboxes if default is selected so that the user isn't confused
    if(backgroundName == "Default"){
        document.getElementById("checkbox1").checked = false;
        document.getElementById("checkbox2").checked = false;
        document.getElementById("checkbox3").checked = false;
        document.getElementById("checkbox4").checked = false;
        document.getElementById("checkbox1").disabled = true;
        document.getElementById("checkbox2").disabled = true;
        document.getElementById("checkbox3").disabled = true;
        document.getElementById("checkbox4").disabled = true;
    } else{
        document.getElementById("checkbox1").disabled = false;
        document.getElementById("checkbox2").disabled = false;
        document.getElementById("checkbox3").disabled = false;
        document.getElementById("checkbox4").disabled = false;
    }
});

//Insert Animation
ipcRenderer.on('setInsertWindowVariables', (event, bytes, hex) => {
    document.getElementById("bytesNeeded").innerText = bytes;
    document.getElementById("hex").value = hex;
});