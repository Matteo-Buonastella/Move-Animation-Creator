# Move-Animation-Creator

This application allows you to create your own move animations for Fire Red by combining and manipulating existing animations. You can combine up to 4 move animations 

## Selecting a Background
A dropdown list is provided with all the backgrouds for you to choose from. Below are some details on the options provided. If you select a background for your animation, the default behavior for this application is the following: First it will go through each move animation that you chose and remove it's background (if possible), including colored backgrounds. Secondly, it will combine all the animations together so that they are played in sequence. Lastly, the background you chose will be applied to the start of the animation and will be used for the entire sequence, unless specified otherwise via the Keep Background checkbox explained below

**Default**
* With this option, whatever animation you choose to combine will have it's default background. For example Confusion will have the Psychic Background, Shadow Ball will have the Ghost background etc

**No/Remove Background**
* This option will remove any background from an animation. This includes both regular backgrounds like Shadow Ball and colored backgrounds like Absorb. Some moves cannot have their backgroud removed. A list of moves that can't have their background removed will be listed below. Any attempt to do so will be ignored

**High Impact, Guillotine and Solarbeam**
* These moves use different backgrounds depending on who is attacking (you or CPU). This application automatically uses the correct the background depending on who's attacking so you don't have to worry about it

![Background](https://imgur.com/dHQI22X.png)

## Background Scroll
Some backgrounds are scrollable such as the Thunder background. If you choose to have a scrolling background, the entire animation from start to finish will have it's background scrolled (even if the background gets switched). Backgrounds that can't have a scroll will have the scrolling option auto disabled.

![Scroll](https://imgur.com/Vd3eGeo.png)

## Scroll Speed
This setting will effect how fast the background will scroll vertically/horizontally. This setting has no effect if "No Scroll" is selected for the Background Scroll

![Scroll Speed](https://imgur.com/Cv91Hju.png)

## Animations to Combine
You can combine up to 4 animations together. Select the move(s) you want to use/combine with the dropdown list. Some moves have an abbreviation. The following list will explain what they mean

**Abbreviations**

* CR: Colored Background can not be removed. Any attempt to do so will be ignored. You can still add a background to the move
* BR: Background cannot be removed. Any attempt to do so will be ignored. You can still replace it with another background
* BRR: Background cannot be removed or replaced. Any attempt to do so will be ignored

![AnimationCombine](https://imgur.com/GRRGWVv.png)

## Keep Background Checkbox
If you aren't using a Default Background (see above) and you want a move to keeps its background, check this box. For example: If I Select the background to be "Dark" and the moves I want to combine are Pursuit, Shadow Ball and Tackle, but I want Shadow Ball to keep its Ghost background, I would check Keep Background for Shadow Ball. This is how the animation would look: [Pursuit + Shadow Ball + Tackle](https://www.youtube.com/watch?v=QOTW5hlX6XE&ab_channel=KakashiSensei)

Notice how Tackle uses the Ghost background. This is because when you select Keep background, all moves after it will use the background that you chose to keep. The best way to learn how this works is to play around with the application and create some test animations.

*It is NOT recommended to select Keep Background for more than 1 move with the Psychic Background. If you Select Keep Background for a Psychic move, every move after it will NOT have a background.*

![KeepBackground](https://imgur.com/vfJnVTx.png)

## Pre Attack Animation
A pre attack animation is an animation that will display before the move occurs, such as making the user move in a circle before attacking. These animations are appended to the front and will NOT replace any existing pre attack animations that a move may have.

## Post Attack Animation
A post attack animation is the little animation that occurs after an attack, like the water bubbles after Bubble, the poison bubbles after Poison Sting, the ice crystals after Ice Beam and so on and so on. For each animation in the sequence, you can now control what post attack animation displays. You can either leave it as a default, remove it (like removing the poison bubbles from Poison Sting) or insert your own from a list of 30 options. If you add a post attack animation to an animation that already has one, the program will automatically replace the old one with the new one. Check out the example below where we replace the poison bubbles with scattered flames. If you ever wanted to create a move like Ice Fang, now you can by doing Bite + Ice Crystals

## Inserting an Animation
To insert an animation, you will need to provide a memory offset. A built in Free Space Finder is provided in the tool. Once you insert the animation at an offset, for example, 82748A, assign this animation to a move by going to PGE -> Attack Editor and then inserting the new animation offset to the Animation textbox on the left side of the screen. Make sure yo click Repoint!

![Insert Image](https://imgur.com/UVjpqI7.png)

## Examples
1. [Default Background: Harden + Mach Punch + Take Down + Recover](https://www.youtube.com/watch?v=RDaWZ_JCh1g&ab_channel=KakashiSensei)
2. [No/Remove Background: Rain Dance (CR) + Ice Beam + Scary Face + Hyper Beam](https://www.youtube.com/watch?v=iau3--UqlA8&ab_channel=KakashiSensei)
*Because Rain Dance is a CR move, it can not have its colored background removed which is why it's still present in the animation*
3. [Fire Sting: Poison Sting + Scattered Flames](https://www.youtube.com/watch?v=-wl_ENibbT4&ab_channel=KakashiSensei)
4. [Scald: (Light Red Background + Hydro Pump + Scattered Flames)](https://www.youtube.com/watch?v=YQaVM0Ecfxo&ab_channel=KakashiSensei)
5. [Ice Fang: (Bite + Ice Crystals)](https://www.youtube.com/watch?v=R_QNO54coXM&ab_channel=KakashiSensei)
