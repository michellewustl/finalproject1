document.addEventListener('DOMContentLoaded', function () {
    var myModal = new bootstrap.Modal(document.getElementById('instructionModal'));
    myModal.show();
});



function FileInput() {
    const {fileContent, setFileContent}= React.useContext(OSMDContext);

    function readFile(file) {
        const reader = new FileReader();

        reader.onload = function (e) {
            const f = e.target.result;
            setFileContent(f);
        };
        if (file.name.match('.*\.mxl')) {
            // have to read as binary, otherwise JSZip will throw ("corrupted zip: missing 37 bytes" or similar)
            reader.readAsBinaryString(file);
        } else {
            reader.readAsText(file);
        }
    }

    function handleFileSelect(evt) {
        console.log("handling file select")
        var maxOSMDDisplays = 10; // how many scores can be displayed at once (in a vertical layout)
        var files = evt.target.files; // FileList object
        var osmdDisplays = Math.min(files.length, maxOSMDDisplays);

        for (var i = 0, file = files[i]; i < osmdDisplays; i++) {
            if (!file.name.match('.*\.xml') && !file.name.match('.*\.musicxml') && false) {
                alert('You selected a non-xml file. Please select only music xml files.');
                continue;
            }

            readFile(file);
            console.log("setfile content")
        }
    }

    return (
        <div class="my-auto file-select-window">
            <p>Choose the file from the resources folder if there are CORS issues. <a href="https://github.com/opensheetmusicdisplay/RawJavascript-usage-example">The OSMD documentation</a> describes the CORS issues that occur when using this API and how to resolve them.</p>
            <input type="file" id="files" accept=".musicxml" onChange={handleFileSelect} />
        </div>
    )
}


const OSMDContext = React.createContext(null);

// React components are just functions that return JSX
// the function name is capitalized to distinguish it from regular HTML elements
function MyApp() {

    const [fileContent, setFileContent] = React.useState(null);


    const [mode, setMode] = React.useState('edit'); // 'view' or 'edit'

    const [osmd, setOsmd] = React.useState(null);
    const [timestampList, setTimestampList] = React.useState([{ id: 0, value: 0 }]);
    // const [currentTime, setCurrentTime] = React.useState(0);
    const currentTimeRef = React.useRef(0);
    // tick counter used to trigger renders when currentTime changes
    const [currentTimeTick, setCurrentTimeTick] = React.useState(0);
    function setCurrentTime(newTime) {
        currentTimeRef.current = Number(newTime) || 0;
        setCurrentTimeTick(t => t + 1);
    }
    const [totalDuration, setTotalDuration] = React.useState(0);
    const [currentTimestamp, setCurrentTimestamp] = React.useState(0);
    const [isPaused, setIsPaused] = React.useState(true);

    // if mode changes, pause the player and reset time
    React.useEffect(() => {
        setIsPaused(true);
        setCurrentTime(0);
        setCurrentTimestamp(0);
    }, [mode]);

    return (
        <>
            <TimeContext.Provider value={{ currentTimeRef, setCurrentTime, currentTimeTick, totalDuration, setTotalDuration, currentTimestamp, setCurrentTimestamp }}>
                <OSMDContext.Provider value={{ osmd, setOsmd, fileContent, setFileContent }}>
                    <FileInput fileContent={fileContent} setFileContent={setFileContent} />
                    {mode === 'view' ? (
                        <ViewApp timestampList={timestampList} isPaused={isPaused} setIsPaused={setIsPaused} />
                    ) : (
                        <EditApp timestampList={timestampList} setTimestampList={setTimestampList} isPaused={isPaused} setIsPaused={setIsPaused} />
                    )}
                    <ModeButton mode={mode} onClick={() => setMode(mode === 'view' ? 'edit' : 'view')} />
                </OSMDContext.Provider>
            </TimeContext.Provider>
        </>
    );
}

function ModeButton({ mode, onClick }) {
    return (
        <>
            {mode === 'view' ?
                (<div className="fixed-top d-flex flex-row justify-content-start p-4 mt-5 mode-button-container">
                    <button className="mode-btn btn btn-lg btn-primary" onClick={onClick}>
                        Edit Syncing
                    </button>
                </div>)
                :
                (
                    <div className="fixed-bottom d-flex flex-row justify-content-end p-4 mode-button-container">
                        <button className="mode-btn btn btn-lg btn-primary" onClick={onClick}>
                            View & Play From Score
                        </button>
                    </div>
                )
            }
        </>


    )
}

function ViewApp({ timestampList, isPaused, setIsPaused }) {
    return (<>
        <div className="view-measure-map-container d-flex flex-column flex-grow-1">
            <MeasureMap timestampList={timestampList} mode="view" isPaused={isPaused}>
                <OSMDScore mode="view" />
            </MeasureMap>
        </div>
        <div className="view-player-container fixed-bottom d-flex flex-column-reverse align-items-center">
            <Player isPaused={isPaused} setIsPaused={setIsPaused} mode="view" />
        </div>
    </>
    );
}

function EditApp({ timestampList, setTimestampList, insertTimestamp, isPaused, setIsPaused }) {
    function insertTimestamp(id, value) {
        let map = new Map(timestampList.map(item => [item.id, item.value]));
        map.set(id, value);

        //sort 
        const sortedMap = new Map([...map].sort((a, b) => a[0] - b[0]));

        console.log(sortedMap);
        // contains a voice for each unique timestamp        

        let arr = [];
        for (const [key, v] of sortedMap.entries()) {
            // if previous timestamps have later time values, make new timestamp at the minimum time
            if (arr.length > 0 && arr[arr.length - 1].value > v) {
                arr.push({ id: key, value: arr[arr.length - 1].value })
            }
            // if subsequent timestamps have earlier time values, change to same time
            else if (key > id && v < value) {
                arr.push({ id: key, value: value })
            }
            else {
                arr.push({ id: key, value: v });
            }
        }
        setTimestampList(arr);

    }

    return (
        <>
            <div className="edit-measure-map-container d-flex flex-column flex-grow-1">
                <MeasureMap timestampList={timestampList} insertTimestamp={insertTimestamp} mode="edit" isPaused={isPaused}>
                    <OSMDScore mode="edit" />
                </MeasureMap>
            </div>
            <div className="edit-player-container d-flex flex-column align-items-start">
                <Player isPaused={isPaused} setIsPaused={setIsPaused} />
                <TimestampListController
                    timestampList={timestampList} setTimestampList={setTimestampList} insertTimestamp={insertTimestamp} mode={"edit"} isPaused={isPaused}
                />
            </div>
        </>
    )
}

function RenderReact() {

    // get a handle to the DOM element we want to render into
    const container = document.getElementById('reactWindow')

    // create the "root" of the component tree
    // this tells React to take over the management of a specific part of the DOM
    // a full-fledged React app usually has one root
    // but a page using "sprinkles" of React can have multiple independent roots for different sections
    const root = ReactDOM.createRoot(container)

    // render our component into the root
    root.render(<MyApp />)
}

// document.querySelector('#renderReactButton').addEventListener('click', () => {
//     RenderReact();
// })

(() => {
    RenderReact();
})();


// initially I had currentTime in the TimeContext, but since it updates frequently I changed it to useRef
// using Github Copilot and the prompt "Remove currentTime from TimeContext and change it to useRef"
// replace simple createContext with object shape
const TimeContext = React.createContext({
    currentTimeRef: { current: 0 },
    setCurrentTime: () => { },
    currentTimeTick: 0,
    totalDuration: 0,
    setTotalDuration: () => { },
    currentTimestamp: 0,
    setCurrentTimestamp: () => { }
});

/** 
 *    Player Interface
 * contains all the shared states among player and controls
*/
function Player({ isPaused, setIsPaused, mode }) {
    const [ready, setReady] = React.useState(false);
    const [isPlaying, setIsPlaying] = React.useState(false);
    // const { isPaused, setIsPaused } = React.useContext(PauseContext);
    const [isSeeking, setIsSeeking] = React.useState(false);
    // now read ref + setter from TimeContext
    const { currentTimeRef, setCurrentTime, currentTimeTick } = React.useContext(TimeContext);
    const { totalDuration, setTotalDuration } = React.useContext(TimeContext);
    // const [totalDuration, setTotalDuration] = React.useState(0);
    const currentTimeForRender = currentTimeRef.current;


    function togglePlayPause() {
        if (isPaused) {
            setIsPaused(false);
            setIsPlaying(true);
            // prevMeasureButton.disabled = true;
        } else {
            setIsPaused(true);
            setIsPlaying(false);
            // prevMeasureButton.disabled = false;
        }
        console.log(`Player.togglePlayPause: set isPaused to ${!isPaused}`);

    }
    React.useEffect(() => {
        if (isSeeking) {
            setIsPlaying(false);
        } else {
            if (!isPaused) {
                setIsPlaying(true);
            }
        }
    }, [isSeeking, isPaused]);

    // keyboard shortcuts
    React.useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === " ") {
                event.preventDefault();
            }
            if (event.key === " ") {
                togglePlayPause();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [togglePlayPause]);

    return (
        <>
            <YouTubeIFramePlayer setReady={setReady} mode={mode} isPaused={isPaused} isPlaying={isPlaying} isSeeking={isSeeking} setIsSeeking={setIsSeeking} />
            <PlayerProgressBar ready={ready} isPaused={isPaused} isPlaying={isPlaying} isSeeking={isSeeking} setIsSeeking={setIsSeeking} currentTime={currentTimeForRender} setCurrentTime={setCurrentTime} />
            <PlayButton ready={ready} isPaused={isPaused} onClick={togglePlayPause} />
        </>
    )
}

// ----------- PLAYER COMPONENTS ----------------------------------------------------

function YouTubeIFramePlayer({ name = 'player', options = undefined, mode, setReady, isPaused, isPlaying, isSeeking }) {

    const containerRef = React.useRef(null); // div containing the IFrame
    const playerRef = React.useRef(null); // actual YT.Player instance
    // read currentTimeRef and setter from context
    const { currentTimeRef, setCurrentTime } = React.useContext(TimeContext);
    const { setTotalDuration } = React.useContext(TimeContext);

    // load API script when component mounts
    React.useEffect(() => {

        // made with reference to: https://stackoverflow.com/questions/54017100/how-to-integrate-youtube-iframe-api-in-reactjs-solution
        // On mount, check to see if the API script is already loaded
        if (!window.YT) { // If not, load the script asynchronously

            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';

            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

            // onYouTubeIframeAPIReady will load the video after the script is loaded
            window.onYouTubeIframeAPIReady = () => {
                loadVideo(options);
            }

        } else { // If script is already there, load the video directly
            loadVideo(options);
        }

        return () => {
            stop();
            playerRef.current?.destroy();
            playerRef.current = null;
        }
    }, []);

    function loadVideo(options) {
        const defaultOptions = {
            // height: '100%',
            width: '100%',
            videoId: 's11K70Xs1cE',
            playerVars: {
                'controls': 0,
                'playsinline': 1
            },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
            }
        };

        // if(mode === "view") {
        //     defaultOptions.height = '200px';
        // }

        if (options == undefined) {
            options = defaultOptions;
        }

        playerRef.current = new window.YT.Player(containerRef.current, options);
    };

    function onPlayerReady(event) {
        setTotalDuration(getDuration());
        setReady(true);
    };
    function onPlayerStateChange(event) {
    };

    // play/pause, updates IFrame player based on React isPlaying state
    React.useEffect(() => {
        if (!playerRef.current) return;
        if (isPlaying) {
            play();
        } else {
            pause();
        }
    }, [isPlaying]);

    // seek
    React.useEffect(() => {
        if (!playerRef.current) return;
        // console.log('isSeeking changed detected by YouTubeIFramePlayer, isSeeking: ' + isSeeking + ', currentTime: ' + currentTime);
        if (!isSeeking) { // just finished seeking, so seek to current time in player
            seekTo(currentTimeRef.current);
        }
    }, [isSeeking, currentTimeRef]);

    React.useEffect(() => {
        if (!playerRef.current) return;
        // console.log('isSeeking changed detected by YouTubeIFramePlayer, isSeeking: ' + isSeeking + ', currentTime: ' + currentTime);
        if (!isSeeking) { // just finished seeking, so seek to current time in player
            seekTo(currentTimeRef.current);
        }
    }, [currentTimeRef]);


    // set timer to update currentTime React state while player is playing
    React.useEffect(() => {
        console.log('isPlaying changed to ' + isPlaying + ', updating currentTime from YouTubeIFramePlayer');
        let currentTimeUpdateTimer;
        if (isPlaying && !isSeeking) {
            currentTimeUpdateTimer = setInterval(() => {
                // only update if player is actually playing
                if (getPlayerState() == 1) {
                    const t = getCurrentTime();
                    setCurrentTime(t);
                    // console.log(`updated currentTime to ${getCurrentTime()}`);
                }
            }, 20);
        } else {
            clearInterval(currentTimeUpdateTimer);
        }
        return () => {
            console.log('cleared currentTimeUpdateTimer')
            clearInterval(currentTimeUpdateTimer);
        }
    }, [isPlaying, isSeeking, setCurrentTime]);

    function getCurrentTime() {
        return playerRef.current?.getCurrentTime?.() ?? 0;
    }
    function getDuration() {
        return playerRef.current?.getDuration?.() ?? 0;
    }
    function getPlayerState() {
        // Possible values are:
        // -1 – unstarted
        // 0 – ended
        // 1 – playing
        // 2 – paused
        // 3 – buffering
        // 5 – video cued
        return playerRef.current?.getPlayerState?.();
    }
    function play() {
        playerRef.current?.playVideo?.();
    }
    function pause() {
        playerRef.current?.pauseVideo?.();
    }
    function stop() {
        playerRef.current?.stopVideo?.();
    }
    function seekTo(seconds) {
        playerRef.current?.seekTo?.(seconds, true);
    }

    return (
        <div id={`${name}`} ref={containerRef}></div>
    );

}

function PlayerProgressBar({ ready, isPlaying, isPaused, isSeeking, setIsSeeking, currentTime, setCurrentTime }) {

    if (!ready) {
        return (<div>Loading...</div>);
    }

    const { totalDuration } = React.useContext(TimeContext);
    const progressBarContainerRef = React.useRef(null);
    const [progressPercentage, setProgressPercentage] = React.useState(0);
    const [mouseDown, setMouseDown] = React.useState(false);
    const [isActive, setIsActive] = React.useState(false);

    if (totalDuration === 0) {
        return (<div>Error with the video length.</div>);
    }

    // set timer to update progress display on an interval while player is playing
    React.useEffect(() => {
        setProgressPercentage(currentTime / totalDuration * 100);
    }, [currentTime]);

    // helper functions
    function percentToSeconds(percent) {
        return percent * 0.01 * totalDuration
    }
    function secondsToPercent(seconds) {
        return 100 * seconds / totalDuration
    }
    function handleMouseDown(event) {
        console.log('progress bar mouse down');
        setMouseDown(true);
        setIsSeeking(true);
    }

    function handleMouseUp(event) {
        console.log('progress bar mouse up');
        updateProgressPercentageAndCurrentTime(event);
        setMouseDown(false);
        setIsSeeking(false);
    }

    function handleMouseMove(event) {
        if (mouseDown) {
            event.preventDefault();
            updateProgressPercentageAndCurrentTime(event);
        }
    }

    function updateProgressPercentageAndCurrentTime(event) {
        const containerRect = progressBarContainerRef.current.getBoundingClientRect();
        const relativeX = event.clientX - containerRect.left;
        const containerWidth = containerRect.width;
        const percentWidth = (relativeX / containerWidth) * 100;
        const constrainedPercentWidth = Math.min(100, Math.max(0, percentWidth))

        setProgressPercentage(constrainedPercentWidth);
        console.log(`setting current time via progress bar to percent: ${constrainedPercentWidth} / seconds: ${percentToSeconds(constrainedPercentWidth)}`);
        setCurrentTime(percentToSeconds(constrainedPercentWidth));
    }

    function handleMouseEnter() {
        setIsActive(true);
    }

    function handleMouseLeave() {
        setIsActive(false);
    }

    const progressBarClassName = "progress-bar" + (isActive ? " active bg-primary" : " bg-secondary") + (isSeeking ? " seeking" : "");
    const progressPointerClassName = "progress-pointer" + (isActive ? " active bg-primary" : " bg-secondary") + (isSeeking ? " seeking" : "");

    return (
        <div className="seeker-container card p-3 d-flex flex-row gap-3 align-items-center">
            <div id="videoTime" className="video-time">
                <PlayerTimeDisplay currentTime={currentTime} />
            </div>
            <div id="progress-wrapper" className="progress-wrapper flex-grow-1">
                <div ref={progressBarContainerRef} id="progress" className="progress flex-grow-1" onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onMouseMove={handleMouseMove} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                    <div id="progress-bar" className={progressBarClassName} style={{ width: `${progressPercentage}%` }}></div>
                </div>
                <span id="progress-pointer" className={progressPointerClassName} style={{ left: `${progressPercentage}%` }}></span>
            </div>
        </div>
    );

}

function PlayButton({ ready, isPaused, onClick }) {
    if (!ready) {
        return (<></>);
    }
    const playChar = '\u23F5'; // ⏵
    const pauseChar = '\u23F8'; // ⏸
    return (
        <div className="d-flex justify-content-center">
            <button className="btn btn-primary play-btn" onClick={onClick}>
                {isPaused ? playChar : pauseChar}
            </button>
        </div>
    )
}

function PlayerTimeDisplay() {
    const { currentTimeRef, totalDuration } = React.useContext(TimeContext);

    function formatTime(time) {
        let timeArr = [];
        const hours = Math.floor(time / 3600);
        if (hours > 0) {
            timeArr.push(hours.toString().padStart(2, '0'));
        }
        const minutes = Math.floor((time % 3600) / 60);
        timeArr.push(minutes.toString().padStart(2, '0'));
        const seconds = (time % 60).toFixed(2);
        timeArr.push(seconds.toString().padStart(5, '0'));
        const timeString = timeArr.join(':');
        return timeString;
    }

    return (
        <div className="time-display d-flex flex-row align-items-center justify-content-space-between">
            <div className="current-time flex-grow">{formatTime(currentTimeRef.current)}</div>
            <div>/ {formatTime(totalDuration)}</div>

        </div>
    );
}


// ------- TIMESTAMP COMPONENTS ----------------------------------------------------

// todo better comment since timestamp.html
// TimeInput component adapted from code generated by Github Copilot with prompt: "Change this to a React component" and provided timestamp.html
/**
 * TimeInput React component
 *
*/
// styling adapted from code generated by Github Copilot with prompt: "style the timeInput component so that by default it has this className: "badge btn btn-primary p-1 d-flex flex-row gap-1 align-items-center", and the input element is normal text instead of a text box. But then, when clicked, it becomes "badge btn btn-primary p-1 d-flex flex-row gap-1 align-items-center" and focuses the input element"
const TimeInput = React.forwardRef(function TimeInput({
    id, time, insertTimestamp,
    step = 0.1,
    holdDelay = 500,
    holdRepeat = 25,
}, ref) {
    const { totalDuration } = React.useContext(TimeContext);
    const [display, setDisplay] = React.useState(() => formatTime(time));
    const [isEditing, setIsEditing] = React.useState(false);
    const inputRef = React.useRef(null);
    const holdTimerRef = React.useRef(null);
    const holdRepeatRef = React.useRef(null);

    const timeRef = React.useRef(time); // to get most recent time state
    React.useEffect(() => {
        if (!isEditing) {
            setDisplay(formatTime(time));
            timeRef.current = time;
        }
    }, [time, isEditing]);

    // this snippet generated by Github Copilot to allow MeasureMap to access setIsEditing and focus the input
    // expose imperative methods to parent via ref
    React.useImperativeHandle(ref, () => ({
        setIsEditing: (v) => setIsEditing(Boolean(v)),
        focus: () => {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }), []);

    // focus input when entering edit mode
    React.useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);

    // Cleanup hold timers on unmount
    React.useEffect(() => {
        return () => {
            clearTimeout(holdTimerRef.current);
            clearInterval(holdRepeatRef.current);
        };
    }, []);

    // Helpers
    // Clamp to non-negative and round to 2 decimal places
    function clampAndRound(v) {
        const n = Number(v) || 0;
        return Math.min(totalDuration, Math.max(0, Math.round(n * 100) / 100));
    }

    function formatTime(totalSeconds) {
        const s = clampAndRound(totalSeconds);
        const minutes = Math.floor(s / 60);
        const secs = (s % 60).toFixed(2);
        const mm = String(minutes).padStart(2, "0");
        const ssss = String(secs).padStart(5, "0"); // ensures "ss.ss"
        console.log(`formatTime called with totalSeconds: ${totalSeconds}, returning ${mm}:${ssss}`);

        return `${mm}:${ssss}`;
    }

    function parseTime(str) {
        if (!str) return 0;
        const t = String(str).trim();
        if (t.includes(":")) {
            const parts = t.split(":").map((p) => p.trim());
            const secPart = parts.pop();
            const minPart = parts.join(":") || "0";
            const minutes = parseFloat(minPart.replace(/[^\d.-]/g, "") || 0);
            const secondsPart = parseFloat(secPart.replace(/[^\d.-]/g, "") || 0);
            if (Number.isFinite(minutes) && Number.isFinite(secondsPart)) {
                return clampAndRound(minutes * 60 + secondsPart);
            }
            return 0;
        }
        const n = parseFloat(t.replace(/[^\d.-]/g, ""));
        return Number.isFinite(n) ? clampAndRound(n) : 0;
    }

    // Mutators
    function changeTimeByStep(delta) {
        const newTime = clampAndRound(timeRef.current + delta);
        insertTimestamp(id, newTime);
        inputRef.current?.focus();
    }

    // Clear hold timers
    function clearHoldTimers() {
        clearTimeout(holdTimerRef.current);
        clearInterval(holdRepeatRef.current);
        holdTimerRef.current = null;
        holdRepeatRef.current = null;
    }

    // Handle mouse down on arrow buttons: immediate call, then hold-to-repeat
    function handleButtonMouseDown(delta) {
        return (e) => {
            e.preventDefault();
            clearHoldTimers();

            // Immediate call on mouse down
            changeTimeByStep(delta);

            // After holdDelay, start repeating at holdRepeat interval
            holdTimerRef.current = setTimeout(() => {
                holdRepeatRef.current = setInterval(() => {
                    changeTimeByStep(delta);
                }, holdRepeat);
            }, holdDelay);
        };
    }

    // Handle mouse up anywhere: stop the hold-to-repeat
    function handleButtonMouseUp() {
        clearHoldTimers();
    }

    // Events for text input
    function handleBlur() {
        const parsed = parseTime(display);
        insertTimestamp(id, parsed);
        setDisplay(formatTime(parsed));
        setIsEditing(false);
    }

    function handleKeyDown(e) {
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            changeTimeByStep(e.key === "ArrowUp" ? step : -step);
        } else if (e.key === "PageUp" || e.key === "PageDown") {
            e.preventDefault();
            changeTimeByStep(e.key === "PageUp" ? step * 10 : -step * 10);
        } else if (e.key === "Enter") {
            e.stopPropagation();
            const parsed = parseTime(display);
            insertTimestamp(id, parsed);
            setDisplay(formatTime(parsed));
            setIsEditing(false);
            inputRef.current?.blur();
        } else if (e.key === "Escape") {
            setDisplay(formatTime(time));
            setIsEditing(false);
            inputRef.current?.blur();
        }
    }

    function handleWheel(e) {
        if (document.activeElement !== inputRef.current) return;
        e.preventDefault();
        changeTimeByStep(e.deltaY < 0 ? step : -step);
    }

    function handleBadgeClick() {
        setIsEditing(true);
    }

    // Keep display synced while typing (do not commit until blur/enter)
    function handleChange(e) {
        setDisplay(e.target.value);
    }

    return (
        <div className="time-input">
            {!isEditing ? (
                // small badge/inactive
                <div
                    className="badge btn btn-primary p-1 d-flex flex-row gap-1 align-items-center"
                    onClick={handleBadgeClick}
                >
                    <span>{display}</span>
                </div>
            ) : (
                // editing input/active
                <div className=" btn btn-sm btn-primary p-1 d-flex flex-row gap-1 align-items-center">
                    <input
                        id={`timeInput-${id}`}
                        ref={inputRef}
                        inputMode="decimal"
                        aria-label="Time in mm:ss.ss"
                        value={display}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        onWheel={handleWheel}
                    />
                    <div className="btn-group-vertical">
                        <button
                            type="button"
                            aria-label={`Increase ${step} seconds`}
                            onMouseDown={handleButtonMouseDown(step)}
                            onMouseUp={handleButtonMouseUp}
                            onMouseLeave={handleButtonMouseUp}
                            className="btn btn-outline-light btn-sm"
                        >
                            ▲
                        </button>
                        <button
                            type="button"
                            aria-label={`Decrease ${step} seconds`}
                            onMouseDown={handleButtonMouseDown(-step)}
                            onMouseUp={handleButtonMouseUp}
                            onMouseLeave={handleButtonMouseUp}
                            className="btn btn-outline-light btn-sm"
                        >
                            ▼
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
});

// additional safety/ref usage added through Github Copilot after asking to explain errors (e.g. "handleAddTimestampButton works when I click the button but not when I use the right arrow shortcut")
function TimestampListController({ insertTimestamp, mode, isPaused }) {
    const { osmd } = React.useContext(OSMDContext);
    const { currentTimeRef, setCurrentTime } = React.useContext(TimeContext);
    const { setCurrentTimestamp } = React.useContext(TimeContext);

    // refs so keyboard handler always reads latest values (avoid stale closures)
    const osmdRef = React.useRef(osmd);
    React.useEffect(() => { osmdRef.current = osmd; }, [osmd]);

    const isPausedRef = React.useRef(isPaused);
    React.useEffect(() => { isPausedRef.current = Boolean(isPaused); }, [isPaused]);

    // keep insertTimestamp stable via ref (it may be recreated by parent)
    const insertRef = React.useRef(insertTimestamp);
    React.useEffect(() => { insertRef.current = insertTimestamp; }, [insertTimestamp]);

    function insertTimestampAtCursor() {
        const o = osmdRef.current;
        if (!o || mode !== 'edit' || !insertRef.current) return;
        insertRef.current(o.cursor.Iterator.currentTimeStamp.realValue, currentTimeRef.current);
    }

    function handlePrevMeasureButton() {
        const o = osmdRef.current;
        if (!o || !isPausedRef.current) return;
        o.cursor.previousMeasure();
        if (o.cursor.Iterator.currentTimeStamp.realValue < 0) o.cursor.reset();
        setCurrentTimestamp(o.cursor.Iterator.currentTimeStamp.realValue);
    }

    function handleNextMeasureButton() {
        const o = osmdRef.current;
        if (!o) return;
        o.cursor.nextMeasure();
        if (o.cursor.Iterator.EndReached) {
            o.cursor.previous();
        }
        // playing: automatically insert a timestamp
        if (!isPausedRef.current) {

            insertTimestampAtCursor();
        }

        setCurrentTimestamp(o.cursor.Iterator.currentTimeStamp.realValue);
    }

    function handleAddTimestampButton() {
        const o = osmdRef.current;
        if (!o) return;
        if (isPausedRef.current) {
            // paused: insert at selected measure
            insertTimestampAtCursor();
            setCurrentTimestamp(o.cursor.Iterator.currentTimeStamp.realValue);
        }
    }

    // register keydown once and read latest refs inside handler
    React.useEffect(() => {
        const handleKeyDown = (event) => {
            // ignore when focus is in an input/control you don't want to override
            const active = document.activeElement;
            if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) {
                return;
            }

            if (event.key === "ArrowLeft") {
                event.preventDefault();
                handlePrevMeasureButton();
            } else if (event.key === "ArrowRight") {
                event.preventDefault();
                handleNextMeasureButton();
            } else if (event.key === "Enter") {
                event.preventDefault();
                if (isPausedRef.current) {
                    handleAddTimestampButton();
                } else {
                    handleNextMeasureButton();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="d-flex flex-row justify-content-between align-items-center">


            <div className="btn-group" role="group">
                <button type="button" className="btn btn-secondary" onClick={handlePrevMeasureButton} disabled={!isPaused}>
                    <div className="d-flex flex-column align-items-center">
                        <div >←</div>
                        <small>Previous measure</small>
                    </div>
                </button>

                {isPaused ? (
                    <>
                        <button type="button" className="btn btn-primary" onClick={handleAddTimestampButton}>
                            <div className="d-flex flex-column align-items-center">
                                <div >↵</div>
                                <small>Set timestamp</small>
                            </div>
                        </button>
                        <button type="button" className="btn btn-primary" onClick={handleNextMeasureButton}>
                            <div className="d-flex flex-column align-items-center">
                                <div >→</div>
                                <small>Next measure</small>
                            </div>
                        </button>
                    </>)
                    :
                    (
                        <button type="button" className="btn btn-primary" onClick={handleNextMeasureButton}>
                            <div className="d-flex flex-column align-items-center">
                                <div >↵</div>
                                <small>Set timestamp & jump to next measure</small>
                            </div>
                        </button>
                    )
                }
            </div>

        </div>





        // <div className="d-flex flex-row justify-content-between align-items-center">

        //     <div className="d-flex flex-column align-items-center">
        //         <button className="btn btn-secondary btn-lg control-btn" onClick={handlePrevMeasureButton} disabled={!isPaused}>←</button>
        //         <small>Previous measure</small>
        //     </div>

        //     {isPaused ?
        //         (<>
        //             <div className="d-flex flex-column align-items-center">
        //                 <button className="btn btn-primary btn-lg control-btn" onClick={handleAddTimestampButton}>↓</button>
        //                 <small>Set timestamp</small>
        //             </div>
        //             <div className="d-flex flex-column align-items-center">
        //                 <button className="btn btn-secondary btn-lg control-btn" onClick={handleNextMeasureButton}>→</button>
        //                 <small>Next measure</small>
        //             </div>
        //         </>
        //         )
        //         :
        //         (<div className="d-flex flex-column align-items-center">
        //             <button className="btn btn-primary btn-lg control-btn-wide" onClick={handleNextMeasureButton}>↵</button>
        //             <small>Set timestamp & jump to next measure</small>
        //         </div>)}
        // </div>
    );
}


// -------- MEASURE NAVIGATION -----------

// has wrapper over osmd score for measure selection and timestamp placement
function MeasureMap({ children, timestampList, insertTimestamp, mode, isPaused }) {
    const containerRef = React.useRef(null);
    const { osmd } = React.useContext(OSMDContext);
    // const { currentTime, currentTimestamp, setCurrentTimestamp } = React.useContext(TimeContext);
    const { currentTimeRef, setCurrentTime, currentTimestamp, setCurrentTimestamp } = React.useContext(TimeContext);

    // timeInputRefs to access TimeInput elements created with Github Copilot with prompt: "Change handleClick() in MeasureMap so that if there is a timestamp corresponding to the voice entry, setIsEditing(true) on that TimeInput element"
    const timeInputRefsRef = React.useRef(new Map());

    // const { isPaused } = React.useContext(PauseContext);
    const [positionedTimestamps, setPositionedTimestamps] = React.useState([]);

    const [hoverBox, setHoverBox] = React.useState(null);
    const [selectionBox, setSelectionBox] = React.useState(null);

    const isPausedRef = React.useRef(isPaused);
    React.useEffect(() => {
        isPausedRef.current = Boolean(isPaused);
    }, [isPaused]);

    const scrollTargetRef = React.useRef(null);

    // Recalculate positions when timestampList or osmd changes
    // this useEffect was written by Github Copilot with prompt "I want MeasureMap to be a React component that wraps around an OSMD score and performs the same functionality as in scoredisplay.js, that is, getting coordinates by clicking on the OSMD score, moving the OSMD cursor appropriately, and inserting elements at absolute positions in the wrapper." Everything else I had written in scoredisplay.js already.
    React.useEffect(() => {
        if (!osmd || !containerRef.current) return;

        const updated = timestampList.map(item => {
            const voiceEntry = getVoiceEntryAtTimestamp(item.id);
            if (!voiceEntry) return null;

            const position = getAbsoluteTimestampPosition(voiceEntry, containerRef.current);
            return {
                ...item,
                position
            };
        }).filter(Boolean);

        setPositionedTimestamps(updated);
    }, [timestampList, osmd]);

    // update selection box when currentTimestamp changes
    React.useEffect(() => {
        if (!osmd || !containerRef.current) {
            setSelectionBox(null);
            return;
        }
        // find the voiceEntry for the current timestamp
        const voiceEntry = getVoiceEntryAtTimestamp(currentTimestamp);
        if (!voiceEntry) {
            setSelectionBox(null);
            return;
        }

        const dims = getMeasureStaffAbsoluteDimensions(voiceEntry, containerRef.current);
        if (!dims || !dims.absolutePosition || !dims.size) {
            setSelectionBox(null);
            return;
        }
        // use absolutePosition (page coords) and size returned by helper
        const left = dims.absolutePosition.x;
        const top = dims.absolutePosition.y;
        const width = dims.size.width;
        const height = dims.size.height;
        setSelectionBox({ left, top, width, height });
    }, [currentTimestamp, osmd, timestampList]);

    // scroll to selection
    React.useEffect(() => {
        if (scrollTargetRef.current) {
            scrollTargetRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }, [currentTimestamp]);

    // if in view mode, update currentTimestamp based on currentTime
    React.useEffect(() => {
        if (mode === 'view'
            && osmd
            // && (!isPausedRef.current)
        ) {
            setCurrentTimestampAndCursorFromCurrentTime();
        }
    }, [currentTimeRef.current, mode, isPausedRef.current, osmd]);

    // helper functions

    function setCurrentTimestampAndCursorFromCurrentTime() {
        let map = new Map(timestampList.map(item => [item.id, item.value]));
        const sortedMap = new Map([...map].sort((a, b) => a[0] - b[0]));

        let matchingTimestamp = null;
        // find the latest timestamp that is equal or less than currentTimeRef.current

        for (const [key, value] of sortedMap.entries()) {
            if (value <= currentTimeRef.current) {
                matchingTimestamp = key;
            }
        }
        const voiceEntry = getVoiceEntryAtTimestamp(matchingTimestamp);
        if (voiceEntry) {
            setCurrentTimestamp(matchingTimestamp);
            moveCursorToVoiceEntry(voiceEntry);
        }
    }

    function getVoiceEntryAtTimestamp(timestamp) {
        const cursor = osmd.cursor;
        const oldVoiceEntry = cursor.Iterator.CurrentVoiceEntries[0];
        cursor.reset();
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
        if (cursor.Iterator.EndReached) {
            cursor.previous();
        }
        return newVoiceEntry;
    }

    function getTimestampValueFromVoiceEntry(voiceEntry) {
        return voiceEntry.timestamp.realValue;
    }

    function getOSMDCoordinates(clickLocation, osmdCanvas) {
        const sheetX = (clickLocation.x - osmdCanvas.offsetLeft) / 10;
        const sheetY = (clickLocation.y - osmdCanvas.offsetTop) / 10;
        // const sheetX = (clickLocation.x ) / 10;
        // const sheetY = (clickLocation.y ) / 10;
        return new opensheetmusicdisplay.PointF2D(sheetX, sheetY);
    }
    function getAbsolutePageCoordinates(sheetLocation, osmdCanvas) {
        // const x = (sheetLocation.x * 10 + osmdCanvas.offsetLeft);
        // const y = (sheetLocation.y * 10 + osmdCanvas.offsetTop);
        const x = (sheetLocation.x * 10);
        const y = (sheetLocation.y * 10);
        return new opensheetmusicdisplay.PointF2D(x, y);
    }

    function getMeasureStaffAbsoluteDimensions(voiceEntry, osmdCanvas) {
        const measure = voiceEntry.parentSourceStaffEntry.verticalContainerParent.parentMeasure.verticalMeasureList[0].PositionAndShape;
        const staffLine = voiceEntry.parentSourceStaffEntry.verticalContainerParent.parentMeasure.verticalMeasureList[0].parentStaffLine.PositionAndShape;
        const point = new opensheetmusicdisplay.PointF2D(measure.absolutePosition.x + measure.borderLeft, staffLine.absolutePosition.y + staffLine.borderTop);
        const props = {
            absolutePosition: getAbsolutePageCoordinates(point, osmdCanvas),
            size: { width: measure.size.width * 10, height: staffLine.size.height * 10 }
        };
        return props;
    }

    // offset from top of staff line, in OSMD units, negative is above staff line
    function getMinSkyline(voiceEntry) {
        const skyline = voiceEntry.parentSourceStaffEntry.verticalContainerParent.parentMeasure.verticalMeasureList[0].parentStaffLine.SkyLine;
        const minSkyline = Math.min(...skyline);
        return minSkyline;
    }

    function getMaxBottomline(voiceEntry) {
        const bottomline = voiceEntry.parentSourceStaffEntry.verticalContainerParent.parentMeasure.verticalMeasureList[0].parentStaffLine.BottomLine;
        const maxBottomline = Math.max(...bottomline);
        return maxBottomline;
    }

    function getAbsoluteTimestampPosition(voiceEntry, osmdCanvas) {
        const measure = voiceEntry.parentSourceStaffEntry.verticalContainerParent.parentMeasure.verticalMeasureList[0];
        const staffLine = voiceEntry.parentSourceStaffEntry.verticalContainerParent.parentMeasure.verticalMeasureList[0].parentStaffLine;
        const skylineOffset = getMinSkyline(voiceEntry);
        const xOffset = 4;
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
        const oldVoiceEntry = cursor.Iterator.CurrentVoiceEntries[0];
        cursor.reset();
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
        if (cursor.Iterator.EndReached) {
            cursor.previous();
        }
    }

    function getNearestVoiceEntryFromMouseEvent(event) {
        const clickLocation = new opensheetmusicdisplay.PointF2D(event.pageX, event.pageY);
        const sheetLocation = getOSMDCoordinates(clickLocation, containerRef.current);
        return osmd.GraphicSheet.GetNearestVoiceEntry(sheetLocation)?.parentVoiceEntry;

    }

    function handleClick(clickEvent) {
        if (mode === 'edit' && !isPausedRef.current) return;

        const clickedVoiceEntry = getNearestVoiceEntryFromMouseEvent(clickEvent);
        moveCursorToVoiceEntry(clickedVoiceEntry);
        const absoluteTimestampPosition = getAbsoluteTimestampPosition(clickedVoiceEntry, osmdCanvas);

        // only allowing timestamps at the starts of measures for now, so reset to start of current measure
        osmd.cursor.previousMeasure();
        if (osmd.cursor.Iterator.currentTimeStamp.realValue < 0) {
            osmd.cursor.reset();
        } else {
            osmd.cursor.nextMeasure();
            if (osmd.cursor.Iterator.EndReached) {
                osmd.cursor.previous();
            }
        }
        setCurrentTimestamp(osmd.cursor.Iterator.currentTimeStamp.realValue);

        // if view mode, also move the player to the corresponding time
        if (mode === 'view') {
            const newTime = timestampList.find(item => item.id === currentTimestamp)?.value;
            if (newTime != undefined) {
                setCurrentTime(newTime);
                console.log("setting current time to" + newTime)
            }
        }
    }

    // hover handlers generated with prompt: "Use the helper functions in MeasureMap to create a new function that places a translucent #eb6864 colored box behind a measure's dimensions when the mouse hovers over it"
    function handleMouseMoveForHover(ev) {
        if (!isPausedRef.current && mode === "edit") {
            if (hoverBox) setHoverBox(null);
            return;
        }

        if (!osmd || !containerRef.current) {
            setHoverBox(null);
            return;
        }

        const nearestVoiceEntry = getNearestVoiceEntryFromMouseEvent(ev);

        if (!nearestVoiceEntry) {
            setHoverBox(null);
            return;
        }

        const dims = getMeasureStaffAbsoluteDimensions(nearestVoiceEntry, containerRef.current);
        if (!dims || !dims.absolutePosition || !dims.size) {
            setHoverBox(null);
            return;
        }

        // dims.absolutePosition already in page coords from helper
        const left = dims.absolutePosition.x;
        const top = dims.absolutePosition.y;
        const width = dims.size.width;
        const height = dims.size.height;

        setHoverBox({ left, top, width, height });
    }

    function handleMouseLeaveForHover() {
        setHoverBox(null);
    }

    return (
        <div className="canvas-container" onClick={handleClick} ref={containerRef}
            onMouseMove={handleMouseMoveForHover}
            onMouseLeave={handleMouseLeaveForHover}
        >
            {children}

            {/* render translucent highlight box when hovering over a measure */}
            {hoverBox ? (
                <div className="measureHoverBox"
                    style={{
                        left: `${hoverBox.left}px`,
                        top: `${hoverBox.top}px`,
                        width: `${hoverBox.width}px`,
                        height: `${hoverBox.height}px`,
                    }}
                />
            ) : null}

            {/* render selection box for currentTimestamp (around the measure) */}
            {selectionBox ? (
                <div ref={scrollTargetRef} className="measureSelectionBox"
                    style={{
                        left: `${selectionBox.left}px`,
                        top: `${selectionBox.top}px`,
                        width: `${selectionBox.width}px`,
                        height: `${selectionBox.height}px`,
                    }}
                />
            ) : null}

            {mode === "edit" && insertTimestamp ? positionedTimestamps.map(item => (
                <div key={String(item.id)} style={{ position: 'absolute', left: `${item.position.x}px`, top: `${item.position.y}px`, transform: 'translate(-50%, -50%)', pointerEvents: 'auto', zIndex: 100 }}>
                    <TimeInput
                        ref={(ref) => {
                            if (ref) {
                                timeInputRefsRef.current.set(item.id, ref);
                            } else {
                                timeInputRefsRef.current.delete(item.id);
                            }
                        }}
                        id={item.id}
                        time={item.value}
                        insertTimestamp={insertTimestamp}
                    />
                </div>
            )) : null}
        </div>
    );
}


// React component containing OSMD score
function OSMDScore({ name = 'osmdCanvas', mode, file = "resources/examples/scores/bach-violin-sonata-2-in-am-andante-bwv1003.musicxml" }) {

    // const fileRef = React.useRef(null);

    const containerRef = React.useRef(null); // div containing the OSMD canvas
    const { osmd, setOsmd, fileContent } = React.useContext(OSMDContext);

    React.useEffect(() => {
        const newOsmd = new opensheetmusicdisplay.OpenSheetMusicDisplay(containerRef.current, {
            // set options here
            backend: "svg",
            drawCredits: false,
            drawFromMeasureNumber: 1,
            drawUpToMeasureNumber: Number.MAX_SAFE_INTEGER // draw all measures, up to the end of the sample
        });

        console.log("checking file content == null, "+fileContent)

        if(fileContent != null) {
            file = fileContent;
        }

        newOsmd.load(file).then(
            function () {

                window.osmd = newOsmd; // give access to osmd object in Browser console, e.g. for osmd.setOptions()
                //console.log("e.target.result: " + e.target.result);

                // invisible
                let selectCursorOptions = { type: 0, color: "#ffffff", alpha: 0.0, follow: true };
                // let selectCursorOptions = { type: 3, color: "#eb6864", alpha: 0.5, follow: true };

                newOsmd.EngravingRules.DefaultFontFamily = "Times New Roman";

                newOsmd.cursorsOptions[0] = selectCursorOptions;
                newOsmd.render();
                newOsmd.cursor.show();
                // newOsmd.cursor.nextMeasure();

                // flexbox resizing
                window.addEventListener("resize", () => {
                    newOsmd.render();
                });

                setOsmd(newOsmd);

            }
        );

        return () => {
            window.removeEventListener("resize", () => {
                newOsmd.render();
            });
            // todo different cleanup
            // osmd?.destroy();
            setOsmd(null);
        }
    }, [fileContent]);




    return (
        <div id={`${name}`} ref={containerRef}>
        </div>
    );
}
