﻿var ErrorEnum = {
  NoDocument: {value: 0, name: "NoDocument", explanation: "Could not retrieve the active Document."}, 
  NoSubPathItems: {value: 1, name: "NoSubPathItems", explanation: "The shape does not contain any subpaths."}, 
  NoShape: {value: 2, name: "NoShape", explanation: "No active layer, or no not containing a shape called: <LayerName> Vector Mask"},
  LongTimeWarning: {value: 3, name: "LongTimeWarning", explanation: "This process could take a very long time."}
};

main();

function main()
{    
    var currDoc, currPathItem, allShapes;
    try{ currDoc = app.activeDocument; } // if no Document open
    catch (e) { alert( ErrorEnum.NoDocument.explanation ); return;} // show error and end
    
    try { currPathItem = currDoc.pathItems.getByName(currDoc.activeLayer.name+" Vector Mask"); } // try to retrieve the Path of an active Shape
    catch (e) { alert( ErrorEnum.NoShape.explanation ); return;} // show error and end
    
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

    allShapes= retrieveAllShapes(currPathItem.subPathItems);  // try to retrieve all the subPathItems of the active layer
    CreateShadowsFrom(currDoc, allShapes,250 );
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

function CreateShadowsFrom(inCurrDoc,inAllShapes,inShadowLength)
{    
    var allShapes = inAllShapes;
    var dir = new Array(1,1);
    var currShape = null;
    var totalCount = 0;
    inShadowLength = typeof inShadowLength !== 'undefined' ? inShadowLength : 50; // default value for shadow length
    
    var lineSubPathArray = new Array();
    for (var shapeCount = 0; shapeCount < allShapes.length;shapeCount++) 
    {
        currShape  = allShapes[shapeCount];
        for (var count = 0; count < inShadowLength; count++) 
        {
            var lineArray = [];
            for (var pathPointCount = 0; pathPointCount < currShape.length; pathPointCount++) {
                lineArray[pathPointCount] = new PathPointInfo;
                lineArray[pathPointCount].kind = PointKind.CORNERPOINT;
                var tmpXoffset = count*dir[0];
                var tmpYoffset = count*dir[1];
                lineArray[pathPointCount].anchor = Array(currShape[pathPointCount][0]+tmpXoffset,
                                                                              currShape[pathPointCount][1]+tmpYoffset);
                lineArray[pathPointCount].leftDirection = Array(currShape[pathPointCount][2]+tmpXoffset,
                                                                                     currShape[pathPointCount][3]+tmpYoffset);
                lineArray[pathPointCount].rightDirection = Array(currShape[pathPointCount][4]+tmpXoffset,
                                                                                       currShape[pathPointCount][5]+tmpYoffset);
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
}
