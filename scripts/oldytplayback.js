// function createYouTubeIframePlayer(name = 'player', options = undefined) {

// const defaultOptions = {
//     // height: '100%',
//     width: '100%',
//     videoId: 's11K70Xs1cE',
//     playerVars: {
//         'controls': 0,
//         'playsinline': 1
//     },
//     events: {
//         'onReady': onPlayerReady,
//         'onStateChange': onPlayerStateChange
//     }
// };

// let options
// // if (options == undefined) {
//     options = defaultOptions;
// // }

// // 2. This code loads the IFrame Player API code asynchronously.
// const tag = document.createElement('script');

// tag.src = "https://www.youtube.com/iframe_api";
// const firstScriptTag = document.getElementsByTagName('script')[0];
// firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);


// // 3. This function creates an <iframe> (and YouTube player)
// //    after the API code downloads.
// let player;
// function onYouTubeIframeAPIReady() {
//     console.log("YouTube Iframe API is ready in window");
//     player = new YT.Player('player', options);
// }

// // 4. The API will call this function when the video player is ready.
// function onPlayerReady(event) {
//     // initProgressBar(getDuration());
// }

// // 5. The API calls this function when the player's state changes.
// //    The function indicates that when playing a video (state=1),
// //    the player should play for six seconds and then stop.
// //   var done = false;
// //   function onPlayerStateChange(event) {
// //     if (event.data == YT.PlayerState.PLAYING && !done) {
// //       setTimeout(stopVideo, 6000);
// //       done = true;
// //     }
// //   }
// function onPlayerStateChange(event) {
//     // if (event.data == YT.PlayerState.PLAYING) {
//     // }
// }

//     // // should be unneeded if returning player
//     // function getCurrentTime() {
//     //     return player.getCurrentTime();
//     // }

//     // function getDuration() {
//     //     return player.getDuration();
//     // }

//     // function playVideo() {
//     //     player.playVideo();
//     // }
//     // function pauseVideo() {
//     //     player.pauseVideo();
//     // }
//     // function stopVideo() {
//     //     player.stopVideo();
//     // }

//     // function seekToInPlayer(seconds, player) {
//     //     if (player != undefined) {
//     //         player.seekTo(seconds, true)
//     //     }
//     // }

//     return player;
// }

// let timestamps = new Map();

function initProgressBar(totalVideoDuration) {
    let playing = false;
    let paused = true;
    let currentInternalTime = 0
    let internalTimeUpdateTimer;
    let progressBarUpdateTimer;
    const totalDuration = totalVideoDuration;
    function startInternalTimer() {
        setInternalTime(getCurrentTime());
        updateTimeDisplay();
    }
    function startProgressBarUpdateTimer() {
        updateProgressBar();
    }

    function startTimers() {
        internalTimeUpdateTimer = setInterval(startInternalTimer, 10);
        progressBarUpdateTimer = setInterval(startProgressBarUpdateTimer, 500);
    }
    function clearTimers() {
        clearInterval(internalTimeUpdateTimer);
        clearInterval(progressBarUpdateTimer);
    }

    function updateTime(event) {
        updateProgressBar(event)
        updateTimeDisplay()
    }

    function setInternalTime(seconds) {
        currentInternalTime = seconds;
        // console.log(`current internal time set to: ${currentInternalTime}`)
    }

    function percentToSeconds(percent) {
        return percent * 0.01 * totalDuration
    }
    function secondsToPercent(seconds) {
        return 100 * seconds / totalDuration
    }

    const progressBar = document.querySelector('#progress-bar')
    const progressBarContainer = document.querySelector('#progress')
    const progressPointer = document.querySelector('#progress-pointer')
    let progress = 0

    let mouseDown = false;
    progressBarContainer.addEventListener('mousedown', function (event) {
        mouseDown = true;
        playing = false;
        pauseVideo();
        clearTimers();
        // console.log(`cleared timer during event ${event}`)

    })
    progressBarContainer.addEventListener('mouseup', function (event) {
        mouseDown = false;
        if (!paused) {
            playing = true;
            playVideo();
            startTimers();
            // console.log(`started timer during event ${event}`)
        }

        updateTime(event)
        seekToInPlayer(currentInternalTime, player);
    })

    progressBarContainer.addEventListener('mouseenter', function (event) {
        progressPointer.style.height = '16px'
        progressPointer.style.width = '16px'
        progressPointer.style.marginTop = '-8px'
        progressBar.classList.remove('bg-secondary')
        progressBar.classList.add('bg-primary')
        progressPointer.classList.remove('bg-secondary')
        progressPointer.classList.add('bg-primary')
    })

    progressBarContainer.addEventListener('mouseleave', function (event) {
        progressPointer.style.height = '12px'
        progressPointer.style.width = '12px'
        progressPointer.style.marginLeft = '-6px'
        progressPointer.style.marginTop = '-6px'
        progressBar.classList.remove('bg-primary')
        progressBar.classList.add('bg-secondary')
        progressPointer.classList.remove('bg-primary')
        progressPointer.classList.add('bg-secondary')
    })
    progressBarContainer.addEventListener('mousemove', function (event) {
        if (mouseDown) {
            event.preventDefault();

            updateTime(event)

        }

    });


    function updateProgressBar(event = undefined) {
        // update progress bar based on internal time
        if (event == undefined) {
            progress = currentInternalTime / totalDuration * 100

            progressBar.style.transition = "all 0.1s"
            progressPointer.style.transition = "all 0.1s"
        }
        // update progress and internal time based on manual event
        else {
            const containerRect = progressBarContainer.getBoundingClientRect();
            const relativeX = event.clientX - containerRect.left;
            const containerWidth = containerRect.width;
            const percentWidth = (relativeX / containerWidth) * 100;
            const constrainedPercentWidth = Math.min(100, Math.max(0, percentWidth))

            progress = constrainedPercentWidth
            setInternalTime(percentToSeconds(progress))
            // console.log(`set internal time via ${percentWidth} / ${constrainedPercentWidth} to: ` + currentInternalTime)

            progressBar.style.transition = "all 0.1s, width 0s"
            progressPointer.style.transition = "all 0.1s, left 0s"
        }

        // set progress bar width
        progressBar.style.width = progress + '%'

        // move progress pointer
        progressPointer.style.left = progress + '%'
    }
    //rename
    function updateTimeDisplay() {
        let time = [];
        const hours = Math.floor(currentInternalTime / 3600);
        if (hours > 0) {
            time.push(hours.toString().padStart(2, '0'));
        }
        const minutes = Math.floor((currentInternalTime % 3600) / 60);
        time.push(minutes.toString().padStart(2, '0'));
        const seconds = (currentInternalTime % 60).toFixed(2);
        time.push(seconds.toString().padStart(5, '0'));
        const timeString = time.join(':');
        const videoTime = document.querySelector('#videoTime')
        videoTime.innerHTML = timeString
    }

    // let keyDown = false;
    // document.addEventListener('keydown', function (event) {
    //     if (event.key === " ") {
    //         event.preventDefault();
    //     }
    //     if (!keyDown) {
    //         keyDown = true;

    //         if (event.key === " ") {
    //             togglePlayPause();
    //         }
    //         if (event.key == "ArrowLeft") {
    //             handlePrevMeasureButton();
    //         }
    //         if (event.key == "ArrowRight") {
    //             handleNextMeasureButton();
    //         }
    //     }
    // })
    // document.addEventListener('keyup', function (event) {
    //     keyDown = false;
    // });
    // const playButton = document.querySelector("#playButton");
    // playButton.addEventListener('click', () => {
    //     togglePlayPause();
    // });
    // const prevMeasureButton = document.querySelector("#prevMeasureButton");
    // prevMeasureButton.addEventListener('click', () => {
    //     handlePrevMeasureButton();
    // });
    // const nextMeasureButton = document.querySelector("#nextMeasureButton");
    // nextMeasureButton.addEventListener('click', () => {
    //     handleNextMeasureButton();
    // });

    // function handlePrevMeasureButton() {
    //     console.log(`prev`);
    //     osmd.cursor.previousMeasure();
    // }

    // function handleNextMeasureButton() {
    //     console.log(`next`);
    //     insertTimestampAtCursor(currentInternalTime, timestamps);
    //     osmd.cursor.nextMeasure();
    // }


    function togglePlayPause() {
        console.log(`togglePlayPause`);
        if (paused) {
            paused = false;
            playing = true;
            prevMeasureButton.disabled = true;
            playVideo();
            startTimers();
        } else {
            paused = true;
            playing = false;
            prevMeasureButton.disabled = false;
            pauseVideo();
            clearTimers();
        }
        updateTime()

    }


}

// React components are just functions that return JSX
// the function name is capitalized to distinguish it from regular HTML elements
function MyApp() {
    return (
        <div>
            <MediaObject />
        </div>
    );
}

function RenderReact() {

    // get a handle to the DOM element we want to render into
    const container = document.getElementById('reactTimestamps')

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



// /**
//  *    Media Object (TODO: rename)
//  */

// function Media() {
//     // const [currentTime, setCurrentTime] = React.useState(0);
//     // const [totalDuration, setTotalDuration] = React.useState(0);

// }

const TimeContext = React.createContext(0);
const PauseContext = React.createContext(true);

function MediaObject() {
    const [currentTime, setCurrentTime] = React.useState(0);
    const [totalDuration, setTotalDuration] = React.useState(0);
    const [isPaused, setIsPaused] = React.useState(true);

    return (
        <TimeContext.Provider value={{ currentTime, setCurrentTime }}>
            <PauseContext.Provider value={{ isPaused, setIsPaused }}>
                <Player totalDuration={totalDuration} setTotalDuration={setTotalDuration} />
                <TimestampList
                    // osmd={osmd}
                    totalDuration={totalDuration}
                />
            </PauseContext.Provider>
        </TimeContext.Provider>
    )
}

/** 
 *    Player Interface
 * contains all the shared states among player and controls
*/
function Player({ totalDuration, setTotalDuration }) {
    const [ready, setReady] = React.useState(false);
    const [isPlaying, setIsPlaying] = React.useState(false);
    const { isPaused, setIsPaused } = React.useContext(PauseContext);
    const [isSeeking, setIsSeeking] = React.useState(false);
    const { currentTime, setCurrentTime } = React.useContext(TimeContext);
    // const { totalDuration, setTotalDuration } = React.useContext(TimeContext);
    // const [totalDuration, setTotalDuration] = React.useState(0);


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
    }, [isSeeking]);

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
        <div>
            <YouTubeIFramePlayer setReady={setReady} isPaused={isPaused} isPlaying={isPlaying} isSeeking={isSeeking} setIsSeeking={setIsSeeking} currentTime={currentTime} setCurrentTime={setCurrentTime} setTotalDuration={setTotalDuration} />
            <PlayerProgressBar ready={ready} isPaused={isPaused} isPlaying={isPlaying} isSeeking={isSeeking} setIsSeeking={setIsSeeking} currentTime={currentTime} setCurrentTime={setCurrentTime} totalDuration={totalDuration} />
            <PlayButton ready={ready} isPaused={isPaused} onClick={togglePlayPause} />
        </div>
    )
}

// ----------- PLAYER COMPONENTS ----------------------------------------------------

function YouTubeIFramePlayer({ name = 'player', options = undefined, setReady, isPaused, isPlaying, isSeeking, currentTime, setCurrentTime, setTotalDuration }) {

    const containerRef = React.useRef(null); // div containing the IFrame
    const playerRef = React.useRef(null); // actual YT.Player instance

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
                'controls': 1, //TODO set to 0 later
                'playsinline': 1
            },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
            }
        };

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

    //TODO TESTING changing this to isPlaying
    // play/pause, updates IFrame player based on React isPlaying state
    React.useEffect(() => {
        if (isPlaying) {
            play();
        } else {
            pause();
        }
    }, [isPlaying]);

    // seek
    React.useEffect(() => {
        console.log('isSeeking changed detected by YouTubeIFramePlayer, isSeeking: ' + isSeeking + ', currentTime: ' + currentTime);
        if (!isSeeking) { // just finished seeking, so seek to current time in player
            seekTo(currentTime);
        }
    }, [isSeeking]);

    // set timer to update currentTime React state while player is playing
    React.useEffect(() => {
        console.log('isPlaying changed to ' + isPlaying + ', updating currentTime from YouTubeIFramePlayer');
        let currentTimeUpdateTimer;
        if (isPlaying && !isSeeking) {
            currentTimeUpdateTimer = setInterval(() => {
                // only update if player is actually playing
                if (getPlayerState() == 1) {
                    setCurrentTime(getCurrentTime());
                    // console.log(`updated currentTime to ${getCurrentTime()}`);
                }
            }, 10);
        } else {
            clearInterval(currentTimeUpdateTimer);
        }
        return () => {
            console.log('cleared currentTimeUpdateTimer')
            clearInterval(currentTimeUpdateTimer);
        }
    }, [isPlaying]);

    function getCurrentTime() {
        return playerRef.current?.getCurrentTime();
    }
    function getDuration() {
        return playerRef.current?.getDuration();
    }
    function getPlayerState() {
        // Possible values are:
        // -1 – unstarted
        // 0 – ended
        // 1 – playing
        // 2 – paused
        // 3 – buffering
        // 5 – video cued

        return playerRef.current?.getPlayerState();
    }
    function play() {
        playerRef.current?.playVideo();
    }
    function pause() {
        playerRef.current?.pauseVideo();
    }
    function stop() {
        playerRef.current?.stopVideo();
    }
    function seekTo(seconds) {
        playerRef.current?.seekTo(seconds, true)
    }

    return (
        <div id={`${name}`} ref={containerRef}></div>
    );

}

function PlayerProgressBar({ ready, isPlaying, isPaused, isSeeking, setIsSeeking, currentTime, setCurrentTime, totalDuration }) {
    if (!ready) {
        return (<div>Loading...</div>);
    }
    if (totalDuration === 0) {
        return (<div>Error with the video length.</div>);
    }

    // helper functions
    function percentToSeconds(percent) {
        return percent * 0.01 * totalDuration
    }
    function secondsToPercent(seconds) {
        return 100 * seconds / totalDuration
    }

    const progressBarContainerRef = React.useRef(null);
    const [progressPercentage, setProgressPercentage] = React.useState(0);
    const [mouseDown, setMouseDown] = React.useState(false);
    const [isActive, setIsActive] = React.useState(false);


    // set timer to update progress display on an interval while player is playing
    React.useEffect(() => {
        setProgressPercentage(currentTime / totalDuration * 100);
    }, [currentTime]);

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
        <div className="card p-3 d-flex flex-row gap-1 align-items-center">
            <div id="videoTime" className="video-time">
                <PlayerTimeDisplay currentTime={currentTime} />
            </div>
            <div id="progress-wrapper" className="progress-wrapper flex-grow-1" style={{ position: 'relative' }}>
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
        <button className="btn btn-primary" onClick={onClick}>
            {isPaused ? playChar : pauseChar}
        </button>
    )
}

function PlayerTimeDisplay({ currentTime }) {
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
        <span>{formatTime(currentTime)}</span>
    );
}


// todo better comment since timestamp.html
// TimeInput component adapted from code generated by Github Copilot with prompt: "Change this to a React component" and provided timestamp.html
/**
 * TimeInput React component
 *
* Props:
* - initialSeconds?: number (default 0)
* - step?: number (default 0.1)
* - name?: string (optional, for the hidden input)
* - onChange?: (seconds:number) => void
* - holdDelay?: number (ms before repeat starts, default 500)
* - holdRepeat?: number (ms between repeats, default 100)
*/
function TimeInput({
    time, setTime, totalDuration,
    step = 0.1,
    name,
    onChange,
    holdDelay = 500,
    holdRepeat = 25,
}) {
    const [display, setDisplay] = React.useState(() => formatTime(time));
    const inputRef = React.useRef(null);
    const holdTimerRef = React.useRef(null);
    const holdRepeatRef = React.useRef(null);

    const timeRef = React.useRef(time); // to get most recent time state
    React.useEffect(() => {
        setDisplay(formatTime(time));
        timeRef.current = time;
        // if (onChange) onChange(time); // does anything?
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [time]);

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
        const minutes = Math.floor(totalSeconds / 60);
        const secs = (totalSeconds % 60).toFixed(2);
        const mm = String(minutes).padStart(2, "0");
        const ssss = String(secs).padStart(5, "0"); // ensures "ss.ss"
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
        setTime(newTime);
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
        setTime(parsed);
        setDisplay(formatTime(parsed));
    }

    function handleKeyDown(e) {
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            changeTimeByStep(e.key === "ArrowUp" ? step : -step);
        } else if (e.key === "PageUp" || e.key === "PageDown") {
            e.preventDefault();
            changeTimeByStep(e.key === "PageUp" ? step * 10 : -step * 10);
        } else if (e.key === "Enter") {
            const parsed = parseTime(display);
            setTime(parsed);
            setDisplay(formatTime(parsed));
            inputRef.current?.blur();
        }
    }

    function handleWheel(e) {
        if (document.activeElement !== inputRef.current) return;
        e.preventDefault();
        changeTimeByStep(e.deltaY < 0 ? step : -step);
    }

    // Keep display synced while typing (do not commit until blur/enter)
    function handleChange(e) {
        setDisplay(e.target.value);
    }

    return (
        <div className="time-input" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <label htmlFor="timeInput" style={{ userSelect: "none" }}>Duration</label>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <input
                    id="timeInput"
                    ref={inputRef}
                    inputMode="decimal"
                    aria-label="Time in mm:ss.ss"
                    value={display}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    onWheel={handleWheel}
                    style={{ width: "9ch", fontFamily: "monospace", textAlign: "center" }}
                />
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <button
                        type="button"
                        aria-label={`Increase ${step} seconds`}
                        onMouseDown={handleButtonMouseDown(step)}
                        onMouseUp={handleButtonMouseUp}
                        onMouseLeave={handleButtonMouseUp}
                        style={{ padding: "2px 6px", userSelect: "none" }}
                        className="btn btn-secondary"
                    >
                        ▲
                    </button>
                    <button
                        type="button"
                        aria-label={`Decrease ${step} seconds`}
                        onMouseDown={handleButtonMouseDown(-step)}
                        onMouseUp={handleButtonMouseUp}
                        onMouseLeave={handleButtonMouseUp}
                        style={{ padding: "2px 6px", userSelect: "none" }}
                        className="btn btn-secondary"
                    >
                        ▼
                    </button>
                </div>
            </div>

            {/* hidden numeric value for form submission */}
            {name ? <input type="hidden" name={name} value={seconds} /> : null}
        </div>
    );
}


// todo pass osmd as prop
function TimestampList({ totalDuration }) {
    const [list, setList] = React.useState([]);

    const { currentTime, setCurrentTime } = React.useContext(TimeContext);
    const { isPaused, setIsPaused } = React.useContext(PauseContext);

    // // automatically insert timestamp at beginning
    // React.useEffect(() => {
    //     setList(insertTimestampAtCursor(0, list));
    //     osmd.cursor.nextMeasure();
    // }, []);

    function insertTimestampAtCursor(currentTime) {
        insertTimestamp(osmd.cursor.Iterator.currentTimeStamp.realValue, currentTime);
    }

    // keyboard shortcuts for prev/next measure
    React.useEffect(() => {
        const handleKeyDown = (event) => {

            if (event.key == "ArrowLeft") {
                handlePrevMeasureButton();
            }
            if (event.key == "ArrowRight") {
                handleNextMeasureButton();
            }

        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isPaused, handlePrevMeasureButton, handleNextMeasureButton]);


    function handlePrevMeasureButton() {
        if (isPaused) {
            console.log(`prev`);
            osmd.cursor.previousMeasure();
            if (osmd.cursor.Iterator.currentTimeStamp.realValue < 0) {
                osmd.cursor.reset();
            }
        }
    }

    function handleNextMeasureButton() {
        console.log(`next`);
        insertTimestampAtCursor(currentTime);
        osmd.cursor.nextMeasure();
    }

    function insertTimestamp(id, value) {
        let map = new Map(list.map(item => [item.id, item.value]));
        map.set(id, value);

        //sort 
        const sortedMap = new Map([...map].sort((a, b) => String(a[0]).localeCompare(b[0])));

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
        setList(arr);
    }

    const timestampItems = list.map((item) => (
        // <li>
        <TimeInput key={item.id} time={item.value} setTime={(newTime) => insertTimestamp(item.id, newTime)} totalDuration={totalDuration} />
        /* </li> */
    ));

    return (
        <>
            <button className="btn btn-secondary" onClick={handlePrevMeasureButton} disabled={!isPaused}>prev measure</button>
            <button className="btn btn-primary" onClick={handleNextMeasureButton}>next measure</button>
            <ul>
                {timestampItems}
            </ul>
        </>
    );

}
