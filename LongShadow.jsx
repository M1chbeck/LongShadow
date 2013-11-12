var currDoc = app.activeDocument;

currDoc.close (SaveOptions.DONOTSAVECHANGES);
currDoc  = app.documents.add(800, 500, 72, "myDocument", NewDocumentMode.RGB)

    alert('No of pathItems: #'+app.activeDocument.pathItems.length);
DrawShape([100, 100], [100, 200], [200, 200], [200, 100]);

var layerRef = app.activeDocument.artLayers.getByName("LongShadow");
if( layerRef != null)
{
    layerRef.fillOpacity = 70;
}

function DrawShape() {
    
    var doc = app.activeDocument;
    var y = arguments.length;
    var i = 0;
    
    var lineArray = [];
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

    
    for (var count = 1; count < 50; count++) 
    {
        var lineArray = [];
        for (i = 0; i < y; i++) {
            lineArray[i] = new PathPointInfo;
            lineArray[i].kind = PointKind.CORNERPOINT;
            var posx = arguments[i][0];
            var posy = arguments[i][1];
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
