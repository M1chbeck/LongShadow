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
        alert('shape: '+shape.length+" x:"+shape[0].pathPoints[0].anchor[0]+" y:"+shape[0].pathPoints[0].anchor[1]);
        alert('shape: '+shape[0].pathPoints.toString());
        //layerRef.fillOpacity = 70;
        //DrawShape([100, 100], [100, 200], [200, 200], [200, 100]);   
        var arr= new Array();
        for ( var i=0;i < shape[0].pathPoints.length;i++)
        {
            var tmp = new Array();
            tmp[0] = parseFloat(shape[0].pathPoints[i].anchor[0]);
            tmp[1] = parseFloat(shape[0].pathPoints[i].anchor[1]);
            arr[i] = tmp;
        }
        DrawShape(arr);
   
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
    var arr = arguments;
    var shapeOne = arr[0];
    var y = shapeOne.length;
    var i = 0;
    
  /* var lineArray = [];
    for (i = 0; i < y; i++) {
        lineArray[i] = new PathPointInfo;
        lineArray[i].kind = PointKind.CORNERPOINT;
        lineArray[i].anchor = arguments[i];
        lineArray[i].leftDirection = lineArray[i].anchor;
        lineArray[i].rightDirection = lineArray[i].anchor;
    }
 
    var lineSubPathArray = new Array();
    lineSubPathArray[0] = new SubPathInfo();
    lineSubPathArray[0].closed = true;
    lineSubPathArray[0].operation = ShapeOperation.SHAPEADD;
    lineSubPathArray[0].entireSubPath = lineArray;
*/
    var lineSubPathArray = new Array();
    for (var count = 0; count < 50; count++) 
    {
        var lineArray = [];
        for (i = 0; i < y; i++) {
            lineArray[i] = new PathPointInfo;
            lineArray[i].kind = PointKind.CORNERPOINT;
            var posx = shapeOne[i][0];
            var posy = shapeOne[i][1];
            //alert("posx: "+posx+" posy: "+posy);
            
            
            posx +=count;
            posy +=count;
            lineArray[i].anchor = Array(posx,posy);
            lineArray[i].leftDirection = lineArray[i].anchor;
            lineArray[i].rightDirection = lineArray[i].anchor;
        }
        lineSubPathArray[count] = new SubPathInfo();
        lineSubPathArray[count].closed = true;
        lineSubPathArray[count].operation = ShapeOperation.SHAPEADD;
        lineSubPathArray[count].entireSubPath = lineArray;
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
