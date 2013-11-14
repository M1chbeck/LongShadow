main();

function main()
{
var currDoc;
var shape; // subPathItem
//alwaysStartFresh();
currDoc = app.activeDocument;
    //alert('currDoc.activeLayer: '+currDoc.activeLayer.name+' type:'+currDoc.activeLayer.typename);
   // alert('No of pathItems: #'+currDoc.pathItems.length);
    var currPathItem = getActivePathItem(currDoc);
    if( currPathItem != null)
    {
        //currPathItem.duplicate("TEST");
        shape = currPathItem.subPathItems;        
        
        
        //layerRef.fillOpacity = 70;
        //DrawShape([100, 100], [100, 200], [200, 200], [200, 100]);   
        var allShapes= new Array();
        for ( var shapeCount = 0;shapeCount < shape.length; shapeCount++)
        {
            var currShape = new Array();
            for ( var pointCount=0;pointCount < shape[shapeCount].pathPoints.length;pointCount++)
            {
                var tmp = new Array();
                // anchor [0] & [1]
                tmp[0] = parseFloat(shape[shapeCount].pathPoints[pointCount].anchor[0]);
                tmp[1] = parseFloat(shape[shapeCount].pathPoints[pointCount].anchor[1]);
                // leftDirection [2] & [3]
                tmp[2] = parseFloat(shape[shapeCount].pathPoints[pointCount].leftDirection[0]);
                tmp[3] = parseFloat(shape[shapeCount].pathPoints[pointCount].leftDirection[1]);
                // rightDirection [4] & [5]
                tmp[4] = parseFloat(shape[shapeCount].pathPoints[pointCount].rightDirection[0]);
                tmp[5] = parseFloat(shape[shapeCount].pathPoints[pointCount].rightDirection[1]);
                
                currShape[pointCount] = tmp;
            }
            allShapes[shapeCount] = currShape;
        }
        DrawShape(allShapes);
   
    }
}

function getActivePathItem(doc)
{
    if( doc == undefined)
        return null;
    var tmp = null;
    try
    {
        tmp = doc.pathItems.getByName(doc.activeLayer.name+" Vector Mask");
    }
    catch( err) 
    {
        tmp = null;
    }
    return tmp;
}
function alwaysStartFresh()
{

    try
    {
        currDoc = app.activeDocument;
        currDoc.close (SaveOptions.DONOTSAVECHANGES);
        currDoc = null;
    }
    catch(err)
    {
        currDoc = null;
     
    }
    if ( currDoc == null)
        openTestFile();
}
function getShape(){
    for (var i = 0; i < currDoc.pathItems.length; i++) 
    {
        
    }
 }
function openTestFile()
{
     currDoc = open(File("D:/Eigene Dateien/Code/JavaScript/LongShadow/test_scene.psd"));
}
function DrawShape() {
    
    var doc = app.activeDocument;
    var allShapes = arguments[0];
    var dir = new Array(1,1);
    var currShape = null;
    var totalCount = 0;
    
    var lineSubPathArray = new Array();
    for (var shapeCount = 0; shapeCount < allShapes.length;shapeCount++) 
    {
        currShape  = allShapes[shapeCount];
        for (var count = 0; count < 50; count++) 
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
    var myPathItem = doc.pathItems.add("myPath", lineSubPathArray);
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
