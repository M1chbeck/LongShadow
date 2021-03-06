﻿var ErrorEnum = {
  NoDocument: {value: 0, name: "NoDocument", explanation: "Could not retrieve the active Document."}, 
  NoSubPathItems: {value: 1, name: "NoSubPathItems", explanation: "The shape does not contain any subpaths."}, 
  NoShape: {value: 2, name: "NoShape", explanation: "No active layer, or not containing a shape called: <LayerName> Vector Mask (CS5) or Shape Path(CS6)"},
  NoActiveLayer: {value: 3, name: "NoActiveLayer", explanation: "No active layer found."},
  LongTimeWarning: {value: 4, name: "LongTimeWarning", explanation: "This process could take a very long time."}
};
// TO DO List
// gradient shadow
// lod-independence for non-curved shapes
// 

// ways to build a GUI for a Photoshop Pluging
/* 1. ScriptUI
        dialog or palette
            through a resource object ( http://www.davidebarranca.com/2013/08/extendscript-scriptui-events-call-notify-dispatchevent/)
            pure code
            native skin from OS
    2.  Adobe Configurator
        panel ( with themes and everything)
            no checkboxes/native gui elements except buttons/actions from 
            skin from PS_theme
    3 Adobe Extension Builder ( plugin for FlashBuilder )
        .mxml-files 
            own skin 
    4 HTML5 Extension ( only for PS_CC )
        with Adobe Extension Builder 3( plugin for Eclipse )
    5 Adobe Flash Panels ( cs4 and above) // http://v2.scriptplayground.com/tutorials/as/Creating-Flash-Panels-for-Photoshop-using-Flash-CS4/
        create an SWF file in Flash 
    // more inspiration
    - http://sandbox.juan-i.com/longshadows/    
*/
#target photoshop
app.bringToFront(); // bring top
var startDisplayDialogs = app.displayDialogs; // safe the old setting for displaying Dialogs
app.displayDialogs = DialogModes.ALL; // showing Dialogs
var g_cancelScript = false;
var g_len=50;
var g_dir=45;
var g_fadePercent=100;
var g_lod=1;
var g_style=0; // 0 = flat, 1 = gradient;
var g_isCurved = false;
var g_resolutionFactor = 1.0;
var g_startTime = 0.0;
var g_endTime = 0.0;
main();
displayDialogs = startDisplayDialogs; // return to the old setting for displaying Dialogs

function main()
{
    var currDoc, currPathItem, allShapes, currLayer;
    try{ currDoc = app.activeDocument; } // if no Document open
    catch (e) { alert( ErrorEnum.NoDocument.explanation ); return;} // show error and end
    g_resolutionFactor = 72.0 / currDoc.resolution; // factor to make it resolution independent since everything is considered to be 72px/inch

    try { currLayer = currDoc.activeLayer; } // is there an active Layer?
    catch (e) { alert( ErrorEnum.NoActiveLayer.explanation ); return;} // show error and end
    
    if ( parseFloat( app.build ) == 12 ) // CS5 ?
    {
        try { currPathItem = currDoc.pathItems.getByName(currDoc.activeLayer.name+" Vector Mask"); } // try to retrieve the Path of an active Shape CS5
        catch (e) { alert( ErrorEnum.NoShape.explanation ); return;} // show error and end
    }
    else if ( parseFloat( app.build ) == 13 ) // CS6 ?
    {
        try { currPathItem = currDoc.pathItems.getByName(currDoc.activeLayer.name+" Shape Path"); } // try to retrieve the Path of an active Shape CS6
        catch (e) { alert( ErrorEnum.NoShape.explanation ); return;} // show error and end
    }
    isShapeNotCurved(currPathItem.subPathItems);
    prepareUI();
    if( g_cancelScript )
        return;
    
    if ( currPathItem.subPathItems.length < 1) // if there are no subpathitems, then show an error and end
    {
        alert( ErrorEnum.NoSubPathItems.explanation ); 
        return;
    } 

    if ( currPathItem.subPathItems.length >= 10)  // ask the user if he wants to continue even if it takes a long time
    {
        var r=confirm("There are over "+currPathItem.subPathItems.length+" subpathitems. \n\r"+ErrorEnum.LongTimeWarning.explanation );
        if (r!=true)
            return;
    }

    // try to retrieve all the subPathItems of the active layer
    allShapes= retrieveAllShapes(currPathItem.subPathItems);
    
    if(g_style == 0) // flat shadows
    {
        if( g_lod != 0)
            CreateFlatShadows(currDoc, allShapes,g_len,g_dir ); // create LoD dependent shadows
        else
            CreatePerfectFlatShadows(currDoc, allShapes,g_len,g_dir ); // create perfect shadows
        // move the shadow behind the shape          
        currDoc.activeLayer.move(currLayer, ElementPlacement.PLACEAFTER);
    }
    else // gradient shadows
    {
         app.displayDialogs = DialogModes.NO; // show Dialogs
         var shadowGroup= currDoc.layerSets.add()
         shadowGroup.name = "GradientShadow_"+g_len.toString()+"px_"+g_dir.toString()+"°_"+g_fadePercent+"%";   
        CreateGradientShadows(currDoc, allShapes,g_len,g_dir,currLayer,shadowGroup); 
        shadowGroup.move(currLayer, ElementPlacement.PLACEAFTER); 
        app.displayDialogs = DialogModes.ALL; // show Dialogs
    }    

    g_endTime =  new Date().getTime();
    //alert( (g_endTime-g_startTime).toString());
}

function prepareUI()
{
    #target estoolkit
    var win, windowResource;
    var tmpLodPanel;
    windowResource = "dialog {  \
        orientation: 'column', \
        alignChildren: ['fill', 'top'],  \
        preferredSize:[120, 400], \
        text: 'Long Shadow Creator',  \
        margins:10, \
        \
        dirPanel: Panel { \
            orientation: 'row', \
            alignChildren: 'right', \
            margins:10, \
            text: ' Direction: ', \
            dir_sl: Slider { minvalue: 0, maxvalue: 360, value: 45, size:[220,20] }, \
            te: EditText { text: '45', characters: 4, justify: 'left'} \
            } \
        \
        lenPanel: Panel { \
            orientation: 'row', \
            alignChildren: 'right', \
            margins:10, \
            text: ' Shadow Length: ', \
            len_sl: Slider { minvalue: 1, maxvalue:1000, value: 50, size:[220,20] }, \
            te: EditText { text: '50', characters: 4, justify: 'left'} \
            } \
        \
        lod_indepenent: Checkbox {text: 'LoD-independent'}\
        lodPanel: Panel { \
            orientation: 'row', \
            alignChildren: 'right', \
            margins:10, \
            text: ' Level of Detail: ', \
            lod_0: RadioButton { text: '0.25'}, \
            lod_1: RadioButton { text: '0.5'}, \
            lod_2: RadioButton { text: '1', value: 'true'}, \
            lod_3: RadioButton { text: '2'}, \
            lod_4: RadioButton { text: '4'}, \
            lod_5: RadioButton { text: '8'}, \
            }\
        \
        stylePanel: Panel { \
                orientation: 'row', \
                alignChildren: ['fill','center'], \
                margins:10, \
                text: ' Shadow Style ', \
                style_flat: RadioButton { text: 'Flat', value: 'true'}, \
                style_grad: RadioButton { text: 'Gradient'}, \
                }\
        \
        fadePanel: Panel { \
            orientation: 'row', \
            alignChildren: 'right', \
            margins:10, \
            text: ' Gradient Fade Strength: ', \
            fade_sl: Slider { minvalue: 0, maxvalue: 100, value: 100, size:[220,20] }, \
            te: EditText { text: '100', characters: 4, justify: 'left'} \
            } \
        \
        bottomGroup: Group{ \
            alignChildren: ['fill','center'], \
            cancelButton: Button { text: 'Cancel', properties:{name:'cancel'}, size: [120,24], alignment:['fill', 'center'] }, \
            applyButton: Button { text: 'Apply', properties:{name:'ok'}, size: [120,24], alignment:['fill', 'center'] }, \
        }\
    }"
     
    win = new Window(windowResource);
    
    win.fadePanel.enabled = false;
    win.lod_indepenent.onClick= function () {
        win.lodPanel.enabled = !win.lod_indepenent.value;
        // disable stylePanel when LoD-independent
        win.stylePanel.style_grad.enabled =!win.lod_indepenent.value;        
    } 
    if( g_isCurved)
    {
        win.lod_indepenent.enabled = false;
        win.remove(win.lod_indepenent );    
    }  
    
    // slider for direction
     win.dirPanel.dir_sl.onChanging = function () {
       win.dirPanel.dir_sl.value= parseInt( win.dirPanel.dir_sl.value);
       win.dirPanel.te.text = parseInt( win.dirPanel.dir_sl.value);
    }
    // textfield for direction
    win.dirPanel.te.onChanging = function () {
       win.dirPanel.dir_sl.value= parseInt( win.dirPanel.te.text );
       win.dirPanel.te.text = parseInt( win.dirPanel.te.text );
    }    
    // slider for length
     win.lenPanel.len_sl.onChanging = function () {
       win.lenPanel.len_sl.value= parseInt( win.lenPanel.len_sl.value);
       win.lenPanel.te.text = parseInt( win.lenPanel.len_sl.value);
    }
    // textfield for length
    win.lenPanel.te.onChanging = function () {
       win.lenPanel.len_sl.value= parseInt( win.lenPanel.te.text );
       //win.lenPanel.te.text = parseInt( win.lenPanel.te.text );
    }
    // slider for fade
     win.fadePanel.fade_sl.onChanging = function () {
       win.fadePanel.fade_sl.value= parseInt( win.fadePanel.fade_sl.value);
       win.fadePanel.te.text = parseInt( win.fadePanel.fade_sl.value);
    }
    // textfield for fade
    win.fadePanel.te.onChanging = function () {
       win.fadePanel.fade_sl.value= parseInt( win.fadePanel.te.text );
       //win.lenPanel.te.text = parseInt( win.lenPanel.te.text );
    }
    // radio buttons for style
    var rbPanel = win.stylePanel;
    rbPanel.addEventListener('click', function(event) {
        for (var i = 0; i < rbPanel.children.length; i++) {
            if (rbPanel.children[i].value == true) 
            {
                if (rbPanel.children[i].text == "Flat")
                {   
                    if( !g_isCurved)
                        win.lod_indepenent.enabled = true;     
                     win.fadePanel.enabled = false;
                }
                else
                {                    
                    if( !g_isCurved)
                        win.lod_indepenent.enabled = false;
                    win.fadePanel.enabled = true;
                }
             }
         }
    });
    win.bottomGroup.cancelButton.onClick = function() {
       g_cancelScript = true;
       return win.close();
    };
    win.bottomGroup.applyButton.onClick = function() {
      g_len = parseInt( win.lenPanel.len_sl.value ) ;           
      if(!g_isCurved && win.lod_indepenent.value) 
      {  
            g_lod = 0;
      } 
      else
      {
          if( win.lodPanel.lod_0.value)
            g_lod = 0.25;
          else  if( win.lodPanel.lod_1.value)
            g_lod = 0.5;
          else  if( win.lodPanel.lod_2.value)
            g_lod = 1.0;
          else  if( win.lodPanel.lod_3.value)
            g_lod = 2.0;
          else  if( win.lodPanel.lod_4.value)
            g_lod = 4.0;
          else  if( win.lodPanel.lod_5.value)
            g_lod = 8.0;    
      }
      g_dir = parseInt( win.dirPanel.dir_sl.value ) ;
      g_fadePercent = parseInt( win.fadePanel.fade_sl.value ) ;
      g_style = win.stylePanel.style_flat.value? 0: 1; // flat or gradient ?      

      g_startTime =  new Date().getTime();
      return win.close();
    };
     
    win.show();
}
function isShapeNotCurved(subPathItems)
{    
    for ( var shapeCount = 0;shapeCount < subPathItems.length; shapeCount++)
    {
        if(  g_isCurved )
            break;
        var currShape = new Array();
        for ( var pointCount=0;pointCount < subPathItems[shapeCount].pathPoints.length;pointCount++)
        {
            var tmp = new Array();
            // anchor [0] & [1]
            tmp[0] = parseFloat(subPathItems[shapeCount].pathPoints[pointCount].anchor[0]);
            tmp[1] = parseFloat(subPathItems[shapeCount].pathPoints[pointCount].anchor[1]);
            // leftDirection [2] & [3]
            tmp[2] = parseFloat(subPathItems[shapeCount].pathPoints[pointCount].leftDirection[0]);
            tmp[3] = parseFloat(subPathItems[shapeCount].pathPoints[pointCount].leftDirection[1]);
            // rightDirection [4] & [5]
            tmp[4] = parseFloat(subPathItems[shapeCount].pathPoints[pointCount].rightDirection[0]);
            tmp[5] = parseFloat(subPathItems[shapeCount].pathPoints[pointCount].rightDirection[1]);
            if( tmp[0] != tmp[2] || tmp[0] != tmp[4] || tmp[1] != tmp[3] || tmp[1] != tmp[5] )
            {
                g_isCurved = true;
                break;
            }
        }
    }
}
function retrieveAllShapes(subPathItems)
{
    var allShapes= new Array();
    for ( var shapeCount = 0;shapeCount < subPathItems.length; shapeCount++)
    {
        var currShape = new Array();
        for ( var pointCount=0;pointCount < subPathItems[shapeCount].pathPoints.length;pointCount++)
        {
            var tmp = new Array();
            // anchor [0] & [1]
            tmp[0] = parseFloat(subPathItems[shapeCount].pathPoints[pointCount].anchor[0]);
            tmp[1] = parseFloat(subPathItems[shapeCount].pathPoints[pointCount].anchor[1]);
            // leftDirection [2] & [3]
            tmp[2] = parseFloat(subPathItems[shapeCount].pathPoints[pointCount].leftDirection[0]);
            tmp[3] = parseFloat(subPathItems[shapeCount].pathPoints[pointCount].leftDirection[1]);
            // rightDirection [4] & [5]
            tmp[4] = parseFloat(subPathItems[shapeCount].pathPoints[pointCount].rightDirection[0]);
            tmp[5] = parseFloat(subPathItems[shapeCount].pathPoints[pointCount].rightDirection[1]);
            currShape[pointCount] = tmp;
        }
        allShapes[shapeCount] = currShape;
    }
    return allShapes;
}
function degToRad(inDegrees)
{
    return (inDegrees * (Math.PI/180));
 }
/* uses the global g_lod to compute the Direction of the shadow and returns a direction Array [x,y]  */
function computeDirection(inShadowDirection)
{
     var xDir = Math.cos ( degToRad(inShadowDirection ));
     var yDir = Math.sin ( degToRad(inShadowDirection ));
     // normalize
     if ( xDir > yDir ) 
     {
         yDir = yDir/xDir;
         xDir = 1.0;
     }
     else
     {
         xDir = xDir/yDir;
         yDir = 1.0;
     }
    // change level of detail
    xDir = xDir / g_lod;
    yDir = yDir / g_lod;
    return new Array( xDir, yDir);
}
function CreatePerfectFlatShadows(inCurrDoc,inAllShapes,inShadowLength,inShadowDirection)
{
    app.displayDialogs = DialogModes.NO; // showing Dialogs
    var allShapes = inAllShapes;
    inShadowLength = typeof inShadowLength !== 'undefined' ? inShadowLength : 50; // default value for shadow length
    inShadowDirection = typeof inShadowDirection !== 'undefined' ? inShadowDirection : 45; // default value for direction
    g_lod = 1.0;    
    var dir = computeDirection(inShadowDirection);
    dir[0] = dir[0]*inShadowLength*g_resolutionFactor;
    dir[1] = dir[1]*inShadowLength*g_resolutionFactor;
    var currShape = null;
    var totalCount = 0;
    
    var lineSubPathArray = new Array();
    for (var shapeCount = 0; shapeCount < allShapes.length;shapeCount++) 
    {
        currShape  = allShapes[shapeCount];        
        for (var pathPointCount = 0; pathPointCount < currShape.length; pathPointCount++) 
        {
            var lineArray = [];
            var thisPointX = currShape[pathPointCount][0]*g_resolutionFactor;
            var thisPointY = currShape[pathPointCount][1]*g_resolutionFactor;
            var nextPointX = 0; //currShape[pathPointCount+1][0];
            var nextPointY = 0;//currShape[pathPointCount+1][1];
           
            if(  pathPointCount == currShape.length-1)
            {
                nextPointX = currShape[0][0]*g_resolutionFactor;
                nextPointY = currShape[0][1]*g_resolutionFactor;
             }
            else
            {
                nextPointX = currShape[pathPointCount+1][0]*g_resolutionFactor;
                nextPointY = currShape[pathPointCount+1][1]*g_resolutionFactor;            
            }
            //p1
                lineArray[0] = new PathPointInfo;
                lineArray[0].kind = PointKind.CORNERPOINT;
                lineArray[0].anchor = Array(thisPointX,thisPointY);
                lineArray[0].leftDirection = Array(thisPointX,thisPointY);
                lineArray[0].rightDirection = Array(thisPointX,thisPointY);
             //p2   
                lineArray[0+1] = new PathPointInfo;
                lineArray[0+1].kind = PointKind.CORNERPOINT;
                lineArray[0+1].anchor = Array(nextPointX,nextPointY);
                lineArray[0+1].leftDirection = Array(nextPointX,nextPointY);
                lineArray[0+1].rightDirection = Array(nextPointX,nextPointY);
            //p3   
                lineArray[0+2] = new PathPointInfo;
                lineArray[0+2].kind = PointKind.CORNERPOINT;
                lineArray[0+2].anchor = Array(nextPointX+dir[0] ,nextPointY+dir[1] );
                lineArray[0+2].leftDirection = Array(nextPointX+dir[0] ,nextPointY+dir[1] );
                lineArray[0+2].rightDirection = Array(nextPointX+dir[0] ,nextPointY+dir[1] );
            //p4
                lineArray[0+3] = new PathPointInfo;
                lineArray[0+3].kind = PointKind.CORNERPOINT;
                lineArray[0+3].anchor = Array(thisPointX+dir[0] ,thisPointY+dir[1] );
                lineArray[0+3].leftDirection = Array(thisPointX+dir[0] ,thisPointY+dir[1] );
                lineArray[0+3].rightDirection = Array(thisPointX+dir[0] ,thisPointY+dir[1] );
            
            lineSubPathArray[totalCount] = new SubPathInfo();
            lineSubPathArray[totalCount].closed = true;
            lineSubPathArray[totalCount].operation = ShapeOperation.SHAPEADD;
            lineSubPathArray[totalCount].entireSubPath = lineArray;
            totalCount++;
        }
    }    
    var myPathItem = inCurrDoc.pathItems.add("myPath", lineSubPathArray);
    
    var desc88 = new ActionDescriptor();
    var ref60 = new ActionReference();

    ref60.putClass(stringIDToTypeID("contentLayer"));
    desc88.putReference(charIDToTypeID("null"), ref60);
    var desc89 = new ActionDescriptor();
    var desc90 = new ActionDescriptor();
    var desc91 = new ActionDescriptor();
    desc91.putDouble(charIDToTypeID("Rd  "), 0.000000); // R
    desc91.putDouble(charIDToTypeID("Grn "), 0.000000); // G
    desc91.putDouble(charIDToTypeID("Bl  "), 0.000000); // B
    var id481 = charIDToTypeID("RGBC");
    desc90.putObject(charIDToTypeID("Clr "), id481, desc91);
    desc89.putObject(charIDToTypeID("Type"), stringIDToTypeID("solidColorLayer"), desc90);
    desc88.putObject(charIDToTypeID("Usng"), stringIDToTypeID("contentLayer"), desc89);
    executeAction(charIDToTypeID("Mk  "), desc88, DialogModes.NO);
    
    // set the Name of the Layer to "LongShadow"
    var idsetd = charIDToTypeID( "setd" );
    var desc10 = new ActionDescriptor();
    var idnull = charIDToTypeID( "null" );
        var ref4 = new ActionReference();
        var idLyr = charIDToTypeID( "Lyr " );
        var idOrdn = charIDToTypeID( "Ordn" );
        var idTrgt = charIDToTypeID( "Trgt" );
        ref4.putEnumerated( idLyr, idOrdn, idTrgt );
    desc10.putReference( idnull, ref4 );
    var idT = charIDToTypeID( "T   " );
        var desc11 = new ActionDescriptor();
        var idNm = charIDToTypeID( "Nm  " );
        desc11.putString( idNm, "LongShadow" );
    var idLyr = charIDToTypeID( "Lyr " );
    desc10.putObject( idT, idLyr, desc11 );
    executeAction( idsetd, desc10, DialogModes.NO );
    
    myPathItem.remove();
    app.displayDialogs = DialogModes.ALL; // showing Dialogs
}
function CreateFlatShadows(inCurrDoc,inAllShapes,inShadowLength,inShadowDirection)
{    
    app.displayDialogs = DialogModes.NO; // showing Dialogs
    var allShapes = inAllShapes;
    inShadowLength = typeof inShadowLength !== 'undefined' ? inShadowLength : 50; // default value for shadow length
    inShadowDirection = typeof inShadowDirection !== 'undefined' ? inShadowDirection : 45; // default value for direction
    
    var dir = computeDirection(inShadowDirection);
    var currShape = null;
    var totalCount = 0;
    
    var lineSubPathArray = new Array();
    for (var shapeCount = 0; shapeCount < allShapes.length;shapeCount++) 
    {
        currShape  = allShapes[shapeCount];        
        for (var count = 0; count < (inShadowLength*g_lod); count++) 
        {
            var lineArray = [];
            for (var pathPointCount = 0; pathPointCount < currShape.length; pathPointCount++) {
                lineArray[pathPointCount] = new PathPointInfo;
                lineArray[pathPointCount].kind = PointKind.CORNERPOINT;
                var tmpXoffset = count*dir[0]*g_resolutionFactor;
                var tmpYoffset = count*dir[1]*g_resolutionFactor;
                lineArray[pathPointCount].anchor = Array(currShape[pathPointCount][0]*g_resolutionFactor+tmpXoffset,
                                                                              currShape[pathPointCount][1]*g_resolutionFactor+tmpYoffset);
                lineArray[pathPointCount].leftDirection = Array(currShape[pathPointCount][2]*g_resolutionFactor+tmpXoffset,
                                                                                     currShape[pathPointCount][3]*g_resolutionFactor+tmpYoffset);
                lineArray[pathPointCount].rightDirection = Array(currShape[pathPointCount][4]*g_resolutionFactor+tmpXoffset,
                                                                                       currShape[pathPointCount][5]*g_resolutionFactor+tmpYoffset);
            }
            lineSubPathArray[totalCount] = new SubPathInfo();
            lineSubPathArray[totalCount].closed = true;
            lineSubPathArray[totalCount].operation = ShapeOperation.SHAPEADD;
            lineSubPathArray[totalCount].entireSubPath = lineArray;
            totalCount++;
        }
    }    
    var myPathItem = inCurrDoc.pathItems.add("myPath", lineSubPathArray);
    var desc88 = new ActionDescriptor();
    var ref60 = new ActionReference();

    //create Shape Layer from Paths
    ref60.putClass(stringIDToTypeID("contentLayer"));
    desc88.putReference(charIDToTypeID("null"), ref60);
    var desc89 = new ActionDescriptor();
    var desc90 = new ActionDescriptor();
    var desc91 = new ActionDescriptor();
    desc91.putDouble(charIDToTypeID("Rd  "), 0.000000); // R
    desc91.putDouble(charIDToTypeID("Grn "), 0.000000); // G
    desc91.putDouble(charIDToTypeID("Bl  "), 0.000000); // B
    var id481 = charIDToTypeID("RGBC");
    desc90.putObject(charIDToTypeID("Clr "), id481, desc91);
    desc89.putObject(charIDToTypeID("Type"), stringIDToTypeID("solidColorLayer"), desc90);
    desc88.putObject(charIDToTypeID("Usng"), stringIDToTypeID("contentLayer"), desc89);
    executeAction(charIDToTypeID("Mk  "), desc88, DialogModes.NO);
   
    // set the Name of the Layer to "LongShadow"
    var idsetd = charIDToTypeID( "setd" );
    var desc10 = new ActionDescriptor();
    var idnull = charIDToTypeID( "null" );
        var ref4 = new ActionReference();
        var idLyr = charIDToTypeID( "Lyr " );
        var idOrdn = charIDToTypeID( "Ordn" );
        var idTrgt = charIDToTypeID( "Trgt" );
        ref4.putEnumerated( idLyr, idOrdn, idTrgt );
    desc10.putReference( idnull, ref4 );
    var idT = charIDToTypeID( "T   " );
        var desc11 = new ActionDescriptor();
        var idNm = charIDToTypeID( "Nm  " );
        desc11.putString( idNm, "LongShadow_"+g_len.toString()+"px_"+g_dir.toString()+"°_LoD"+g_lod);
    var idLyr = charIDToTypeID( "Lyr " );
    desc10.putObject( idT, idLyr, desc11 );
    executeAction( idsetd, desc10, DialogModes.NO );

   myPathItem.remove();
   app.displayDialogs = DialogModes.ALL; // showing Dialogs
}
function CreateGradientShadows(inCurrDoc,inAllShapes,inShadowLength,inShadowDirection,inOrigLayer,inGroup)
{
     app.displayDialogs = DialogModes.NO; // showing Dialogs
    var allShapes = inAllShapes;
    inShadowLength = typeof inShadowLength !== 'undefined' ? inShadowLength : 50; // default value for shadow length
    inShadowDirection = typeof inShadowDirection !== 'undefined' ? inShadowDirection : 45; // default value for direction
    
    var dir = computeDirection(inShadowDirection);
    var currShape = null;
    var totalCount = 0;
    var randomPathName="myPath"+Math.random().toString();
     var lineSubPathArray = new Array();
     var shapeCount = 0;  
     var prevLayer = null;
     
     for (var count = 0; count <(inShadowLength*g_lod); count++) 
     {
             for (var shapeCount = 0; shapeCount < allShapes.length;shapeCount++) 
            {
                currShape  = allShapes[shapeCount];
                {
                    var lineArray = [];
                    for (var pathPointCount = 0; pathPointCount < currShape.length; pathPointCount++) {
                        lineArray[pathPointCount] = new PathPointInfo;
                        lineArray[pathPointCount].kind = PointKind.CORNERPOINT;
                        var tmpXoffset = (count+1)*dir[0]*g_resolutionFactor;
                        var tmpYoffset = (count+1)*dir[1]*g_resolutionFactor;
                        lineArray[pathPointCount].anchor = Array(currShape[pathPointCount][0]*g_resolutionFactor+tmpXoffset,
                                                                                      currShape[pathPointCount][1]*g_resolutionFactor+tmpYoffset);
                        lineArray[pathPointCount].leftDirection = Array(currShape[pathPointCount][2]*g_resolutionFactor+tmpXoffset,
                                                                                             currShape[pathPointCount][3]*g_resolutionFactor+tmpYoffset);
                        lineArray[pathPointCount].rightDirection = Array(currShape[pathPointCount][4]*g_resolutionFactor+tmpXoffset,
                                                                                               currShape[pathPointCount][5]*g_resolutionFactor+tmpYoffset);
                    }
                    lineSubPathArray[totalCount] = new SubPathInfo();
                    lineSubPathArray[totalCount].closed = true;
                    lineSubPathArray[totalCount].operation = ShapeOperation.SHAPEADD;
                    lineSubPathArray[totalCount].entireSubPath = lineArray;
                    totalCount++;
                }
            }    
            var myPathItem = inCurrDoc.pathItems.add(randomPathName, lineSubPathArray);
            var desc88 = new ActionDescriptor();
            var ref60 = new ActionReference();
            var greyVal = 0.0 + (g_fadePercent/100.0)*(255.0*(count /(inShadowLength*g_lod)));
            
            //create Shape Layer from Paths
            ref60.putClass(stringIDToTypeID("contentLayer"));
            desc88.putReference(charIDToTypeID("null"), ref60);
            var desc89 = new ActionDescriptor();
            var desc90 = new ActionDescriptor();
            var desc91 = new ActionDescriptor();
            desc91.putDouble(charIDToTypeID("Rd  "), greyVal); // R
            desc91.putDouble(charIDToTypeID("Grn "), greyVal); // G
            desc91.putDouble(charIDToTypeID("Bl  "), greyVal); // B
            var id481 = charIDToTypeID("RGBC");
            desc90.putObject(charIDToTypeID("Clr "), id481, desc91);
            desc89.putObject(charIDToTypeID("Type"), stringIDToTypeID("solidColorLayer"), desc90);
            desc88.putObject(charIDToTypeID("Usng"), stringIDToTypeID("contentLayer"), desc89);
            executeAction(charIDToTypeID("Mk  "), desc88, DialogModes.NO);
           
           var name = "LongShadow"+count.toString();
            // set the Name of the Layer to "LongShadow"
            var idsetd = charIDToTypeID( "setd" );
            var desc10 = new ActionDescriptor();
            var idnull = charIDToTypeID( "null" );
                var ref4 = new ActionReference();
                var idLyr = charIDToTypeID( "Lyr " );
                var idOrdn = charIDToTypeID( "Ordn" );
                var idTrgt = charIDToTypeID( "Trgt" );
                ref4.putEnumerated( idLyr, idOrdn, idTrgt );
            desc10.putReference( idnull, ref4 );
            var idT = charIDToTypeID( "T   " );
                var desc11 = new ActionDescriptor();
                var idNm = charIDToTypeID( "Nm  " );
                desc11.putString( idNm, name);
            var idLyr = charIDToTypeID( "Lyr " );
            desc10.putObject( idT, idLyr, desc11 );
            executeAction( idsetd, desc10, DialogModes.NO );
            
            //move behind previous layer
            if( prevLayer != null)
            {
                inCurrDoc.activeLayer.move(prevLayer, ElementPlacement.PLACEAFTER);
             }
            prevLayer = inCurrDoc.activeLayer;
            myPathItem.remove();
    } 
   //inCurrDoc.artLayers.getByName("LongShadow").move(inGroup, ElementPlacement.INSIDE); // apparently you create the new Layer inside the folder
    app.displayDialogs = DialogModes.ALL; // show Dialogs
}