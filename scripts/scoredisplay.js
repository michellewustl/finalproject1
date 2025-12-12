// helper functions

function getVoiceEntryAtTimestamp(timestamp) {
    const cursor = osmd.cursor;
    cursor.reset();
    const oldVoiceEntry = cursor.Iterator.CurrentVoiceEntries[0];
    let newVoiceEntry = undefined;
    while (!cursor.Iterator.EndReached) {
        const currentVoiceEntry = cursor.Iterator.CurrentVoiceEntries[0];
        if (cursor.Iterator.currentTimeStamp.realValue === timestamp) {
            newVoiceEntry = currentVoiceEntry;
        }
        if (newVoiceEntry != undefined) {
            break;
        }
        cursor.next();
    }
        // move cursor back to original position
        cursor.reset();
        while (!cursor.Iterator.EndReached && cursor.Iterator.CurrentVoiceEntries[0] != oldVoiceEntry) {
            cursor.next();
        }
    return newVoiceEntry;
}

function getTimestampValueFromVoiceEntry(voiceEntry) {
    return voiceEntry.timestamp.realValue;
}

function getOSMDCoordinates(clickLocation, osmdCanvas) {
    const sheetX = (clickLocation.x - osmdCanvas.offsetLeft) / 10;
    const sheetY = (clickLocation.y - osmdCanvas.offsetTop) / 10;
    return new opensheetmusicdisplay.PointF2D(sheetX, sheetY);
}
function getAbsolutePageCoordinates(sheetLocation, osmdCanvas) {
    const x = (sheetLocation.x * 10 + osmdCanvas.offsetLeft);
    const y = (sheetLocation.y * 10 + osmdCanvas.offsetTop);
    return new opensheetmusicdisplay.PointF2D(x, y);
}

// offset from top of staff line, in OSMD units, negative is above staff line
function getMinSkyline(voiceEntry) {
    const skyline = voiceEntry.parentSourceStaffEntry.verticalContainerParent.parentMeasure.verticalMeasureList[0].parentStaffLine.SkyLine;
    const minSkyline = Math.min(...skyline);
    return minSkyline;
}

function getAbsoluteTimestampPosition(voiceEntry, osmdCanvas) {
    const measure = voiceEntry.parentSourceStaffEntry.verticalContainerParent.parentMeasure.verticalMeasureList[0];
    const staffLine = voiceEntry.parentSourceStaffEntry.verticalContainerParent.parentMeasure.verticalMeasureList[0].parentStaffLine;
    const skylineOffset = getMinSkyline(voiceEntry);
    const xOffset = 2.5;
    const yOffset = -1.5;
    const x = measure.PositionAndShape.absolutePosition.x + xOffset;
    const y = staffLine.PositionAndShape.absolutePosition.y + skylineOffset + yOffset;
    const sheetLocation = new opensheetmusicdisplay.PointF2D(x, y);
    // draws a point at click location for troubleshooting
    // osmd.Drawer.DrawOverlayLine({ x: sheetLocation.x - 0.05, y: sheetLocation.y - 0.05 }, { x: sheetLocation.x + 0.05, y: sheetLocation.y + 0.05 }, osmd.graphic.MusicPages[0])

    return getAbsolutePageCoordinates(sheetLocation, osmdCanvas);

}

function moveCursorToVoiceEntry(clickedVoiceEntry) {
    const cursor = osmd.cursor;
    cursor.reset();
    const oldVoiceEntry = cursor.Iterator.CurrentVoiceEntries[0];
    let newVoiceEntry = undefined;
    while (!cursor.Iterator.EndReached) {
        for (let i = 0; i < cursor.Iterator.CurrentVoiceEntries.length; i++) {
            const currentVoiceEntry = cursor.Iterator.CurrentVoiceEntries[i];
            if (currentVoiceEntry == clickedVoiceEntry) {
                newVoiceEntry = currentVoiceEntry;
                console.log(`cursor moved to clicked voice entry`)
            }
        }
        if (newVoiceEntry != undefined) {
            break;
        }
        cursor.next();
    }
    if (newVoiceEntry == undefined) {
        // move cursor back to original position
        cursor.reset();
        while (!cursor.Iterator.EndReached && cursor.Iterator.CurrentVoiceEntries[0] != oldVoiceEntry) {
            cursor.next();
        }
    }
    // draws a point at click location for troubleshooting
    // osmd.Drawer.DrawOverlayLine({ x: sheetLocation.x - 0.05, y: sheetLocation.y - 0.05 }, { x: sheetLocation.x + 0.05, y: sheetLocation.y + 0.05 }, osmd.graphic.MusicPages[0])

    // const nearestNote = osmd.GraphicSheet.GetNearestNote(sheetLocation);
    // nearestNote.sourceNote.noteheadColor = "#0000FF";
}

// PRE-LOADED VERSION, NEED HTTP SERVER:


// document.addEventListener("DOMContentLoaded", () => {
//     const SCORE_DIV_ID = "osmdCanvasScore";
//     var osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay(SCORE_DIV_ID, {
//         // set options here
//         backend: "svg",
//         drawFromMeasureNumber: 1,
//         drawUpToMeasureNumber: Number.MAX_SAFE_INTEGER // draw all measures, up to the end of the sample
//     });

//     osmd.load("../../resources/examples/scores/bach-violin-sonata-2-in-am-andante-bwv1003.musicxml").then(
//         function () {
//             window.osmd = osmd; // give access to osmd object in Browser console, e.g. for osmd.setOptions()
//             //console.log("e.target.result: " + e.target.result);
//             osmd.render();
//             osmd.cursor.show();

//             // flexbox resizing
//             window.addEventListener("resize", () => {
//                 osmd.render();
//             });

//             const canvas = document.querySelector(`#${SCORE_DIV_ID}`);

//             canvas.addEventListener('click', (clickEvent) => {
//                 const clickLocation = new opensheetmusicdisplay.PointF2D(clickEvent.pageX, clickEvent.pageY);
//                 const sheetLocation = getOSMDCoordinates(clickLocation, canvas);
//                 const clickedVoiceEntry = osmd.GraphicSheet.GetNearestVoiceEntry(sheetLocation).parentVoiceEntry;
//                 moveCursorToVoiceEntry(clickedVoiceEntry);
//                 const absoluteTimestampPosition = getAbsoluteTimestampPosition(clickedVoiceEntry, osmdCanvas);
//                 //testing func
//                 function createDivAtPosition(x, y, container) {
//                     const newElement = document.createElement('div');
//                     newElement.classList.add('clickLocation');
//                     newElement.style.backgroundColor = 'red';
//                     newElement.style.width = '5px';
//                     newElement.style.height = '5px';
//                     newElement.style.position = 'absolute'; // Essential for positioning with left/top
//                     newElement.style.left = x + 'px';
//                     newElement.style.top = y + 'px';
//                     container.appendChild(newElement);
//                 };

//                 createDivAtPosition(absoluteTimestampPosition.x, absoluteTimestampPosition.y, osmdCanvas);

//                 // only allowing timestamps at the starts of measures for now, so reset to start of current measure
//                 osmd.cursor.previousMeasure();
//                 if (osmd.cursor.Iterator.currentTimeStamp.realValue < 0) {
//                     osmd.cursor.reset();
//                 } else {
//                     osmd.cursor.nextMeasure();
//                 }
//             });


//         }
//     );

// });
// // FILE SELECT VERSION:

// function readFile(file) {
//     var reader = new FileReader();

//     reader.onload = function (e) {
//         const SCORE_DIV_ID = "osmdCanvasScore";
//         var osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay(SCORE_DIV_ID, {
//             // set options here
//             backend: "svg",
//             drawFromMeasureNumber: 1,
//             drawUpToMeasureNumber: Number.MAX_SAFE_INTEGER // draw all measures, up to the end of the sample
//         });
//         osmd
//             .load(e.target.result)
//             .then(
//                 function () {
//                     window.osmd = osmd; // give access to osmd object in Browser console, e.g. for osmd.setOptions()
//                     //console.log("e.target.result: " + e.target.result);
//                     osmd.render();
//                     osmd.cursor.show(); // this would show the cursor on the first note
//                     // osmd.cursor.next(); // advance the cursor one note

//                     // flexbox resizing
//                     osmd.zoom = 0.8;
//                     osmd.render();
//                     window.addEventListener("resize", () => {
//                         osmd.render();
//                     });

//                     const canvas = document.querySelector(`#${SCORE_DIV_ID}`);

//                     // const canvasSvg = document.querySelector('#osmdCanvas svg');

//                     // const canvasWrapper = document.createElement('div');
//                     // canvasWrapper.classList.add('canvas-wrapper');

//                     // canvasSvg.parentNode.insertBefore(canvasWrapper, canvasSvg);

//                     // canvasWrapper.appendChild(canvasSvg);

//                     // maintain map of osmd timestamps, will be mapped to recording timestamps
//                     let timestamps = new Map();
//                     timestamps.set(0, 0);
//                     let insertIndex = 0;
//                     canvas.addEventListener('click', (clickEvent) => {
//                         const clickLocation = new opensheetmusicdisplay.PointF2D(clickEvent.pageX, clickEvent.pageY);
//                         const sheetLocation = getOSMDCoordinates(clickLocation, canvas);
//                         const clickedVoiceEntry = osmd.GraphicSheet.GetNearestVoiceEntry(sheetLocation).parentVoiceEntry;
//                         moveCursorToVoiceEntry(clickedVoiceEntry);

//                         // insertTimestampAtCursor(`click${insertIndex}`, timestamps);
//                         timestamps.set(osmd.cursor.Iterator.currentTimeStamp.realValue, `click${insertIndex}`);
//                         insertIndex++;

//                         //sort
//                         const sortedMap = new Map([...timestamps].sort((a, b) => String(a[0]).localeCompare(b[0])));
//                         timestamps = sortedMap;

//                         console.log(timestamps);
//                         // contains a voice for each unique timestamp
//                         updateTimestampElements();

//                     });

//                 }
//             );
//     };
//     if (file.name.match('.*\.mxl')) {
//         // have to read as binary, otherwise JSZip will throw ("corrupted zip: missing 37 bytes" or similar)
//         reader.readAsBinaryString(file);
//     } else {
//         reader.readAsText(file);
//     }
// }

// function handleFileSelect(evt) {
//     var maxOSMDDisplays = 10; // how many scores can be displayed at once (in a vertical layout)
//     var files = evt.target.files; // FileList object
//     var osmdDisplays = Math.min(files.length, maxOSMDDisplays);

//     var output = [];
//     for (var i = 0, file = files[i]; i < osmdDisplays; i++) {
//         output.push("<li><strong>", escape(file.name), "</strong> </li>");
//         output.push("<div id='osmdCanvas" + i + "'/>");
//     }
//     document.getElementById("list").innerHTML = "<ul>" + output.join("") + "</ul>";

//     for (var i = 0, file = files[i]; i < osmdDisplays; i++) {
//         if (!file.name.match('.*\.xml') && !file.name.match('.*\.musicxml') && false) {
//             alert('You selected a non-xml file. Please select only music xml files.');
//             continue;
//         }

//         readFile(file);
//     }
// }

// // document.addEventListener('DOMContentLoaded', () => {
// //     readFile();
// // });

// document.getElementById("files").addEventListener("change", handleFileSelect, false);

