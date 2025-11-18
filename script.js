

//11/17/2025 version

// Wrapped In Black: "http://youtube.com/watch?v=S2I7M0mletI"
// Inside the playlist: https://www.youtube.com/watch?v=S2I7M0mletI&list=PLmsMovhSH3VcIAhxoB8Rtu3su1AtiMcp9&index=42
// * Playlist ID: "list=PLmsMovhSH3VcIAhxoB8Rtu3su1AtiMcp9"
// * Index note: "index=42"
// * Video: "v=S2I7M0mletI"




// YouTube API ready flag
//let ytApiReady = false; // set by onYouTubeIframeAPIReady
let ytPlayerReady = false;
let ytPlayer = null;
// used for playlists
let pendingVideoId = null;
// used for current video id
let currentVideoId = null;
// not sure why this exists
let previousVideoId = null;

// set only by syncVideoState
let lastLoadedVideoId = null;

// this will define our playlist later
let currentPlaylistId = null;

function logEvent(tag, ...args) {
    console.log(new Date().toISOString(), tag, ...args);
}

//window.onYouTubeIframeAPIReady = function () {
//    ytApiReady = true;
//    console.log("**** ONYOUTUBEIFRAMEAPIREADY() -> TRYCREATEPLAYER()");
//    tryCreatePlayer();
//}
// ^ Function called by the YouTube Iframe API when it's ready
// ^^ This function must be placed outside of the event listener (existing on 'window')

function tryCreatePlayer() {
    console.log("**** TRYCREATEPLAYER()")
    // if, for whatever reason, the API is not ready.
    if (!window.ytApiReady) {
        console.log("[TCP()] YouTube API is NOT ready!");
        return;
    }

    // if the ytPlayer already exists, stop here.
    if (ytPlayer) {
        console.log("[TCP()] ytPlayer ALREADY EXISTS");
        return;
    }

    //const element = document.getElementById('video_player_yt');
    //if (element) {
    //    console.log("[TCP()] Page wasn't ready, trying again in 50 ms.");
    //    // Page not ready yet; retry later
    //    setTimeout(tryCreatePlayer, 50);
    //    return;
    //}

    // create the player; player will inject iframe inside #youtube_player
    console.log("[TCP()] Creating YT.Player:::");
    ytPlayer = new YT.Player('video_player', {
        height: '360',
        width: '640',
        playerVars: {
            // customize: autoplay=0 by default
            autoplay: 0,
            controls: 1,
            rel: 0,
            modestbranding: 1
        },
        events: {
            onReady: onPlayerReady,
            //onStateChange: onPlayerStateChange
        }
    });
    console.log("[TCP()] ytPlayer CREATED!");

    // if a video was requested earler, load it now
    //if (pendingVideoId) {
    //    loadVideo(pendingVideoId);
    //    pendingVideoId = null;
    //}
}

/* Player event handlers */
function onPlayerReady(event) {
    console.log("**** ONPLAYERREADY: YT player is ready!");
    // optionally start playing automatically
    // event.target.playVideo();
    //pendingVideoId = "S2I7M0mletI"
    if (pendingVideoId) {
        console.log("[OPR()] pendingVideoId FOUND!", pendingVideoId);
        console.log("!!!! Video LOADED in onPlayerReady()")
        ytPlayer.loadVideoById(pendingVideoId);
        lastLoadedVideoId = pendingVideoId;
        pendingVideoId = null;
    } else {
        console.log("[OPR()] No pendingVideoId!")
    }
}


// play a video if:
// * currentVideoId is valid
// * ytPlayer exists
// * the videoId has changed
function syncVideoState() {
    console.log("**** SYNCVIDEOSTATE")
    console.log("ytPlayer", ytPlayer)
    if (!currentVideoId) {
        console.log("[SVS()] No currentVideoId");
        return;
    }
    console.log("[SVS()] CurrentVideoId exists:::")

    // player not ready yet
    if (!ytPlayer || typeof ytPlayer.loadVideoById !== "function") {
        console.log("[SVS()] Player NOT found,");
        console.log("pendingVideoId =", currentVideoId);
        pendingVideoId = currentVideoId;
        return;
    }

    // if it's the same video, don't reload
    if (currentVideoId === lastLoadedVideoId) {
        console.log("[SVS()] same video; don't reload");
        return;
    }

    // check if ytPlayer.loadVideoById exists
    if (ytPlayer && typeof ytPlayer.loadVideoById !== 'function') {
        console.log("[SVS()] Player FOUND, yet ytPlayer.loadVideoById NOT found!");
        return;
    }

    // new video, load new id
    console.log("[SVS()] ytPlayer.loadVideoById FOUND!");
    console.log("!!!! Video LOADED in SVS!", currentVideoId);
    ytPlayer.loadVideoById(currentVideoId);
    lastLoadedVideoId = currentVideoId;
}

function onPlayerStateChange(event) {
    // YT.PlayerState.ENDED === 0
    // The above must be part of an enum.
    if (event.data === YT.PlayerState.ENDED) {
        console.log('video ended');
        // call the SPA function to play the next video
        playNextVideo();
    }
}

/* Ultility: load a video by id (safe even if player not yet created) */
function loadVideo(videoId) {
    console.log("**** LOADVIDEO():", videoId);
    if (!videoId) {
        console.log("[LV()] No video id found. Returning.")
        return;
    }

    // DEBUG: does the loaded video match?
    if (videoId !== getVideoIdFromURL()) {
        console.log("videoId from URL:", getVideoIdFromURL());
        console.log("Current loaded video id DOES NOT match URL search param");
    } else {
        console.log("Current loaded video id MATCHES URL search param")
    }
    
    // if player is available, use it; overwise, save as pending.
    if (ytPlayer && typeof ytPlayer.loadVideoById === 'function') {
        // Force a clean load so previous thumbnail doesn't linger:
        // unload then request on next frame (optional but recommended)
        ytPlayer.stopVideo && ytPlayer.stopVideo(); // stop current
        // You can call loadVideoById directly:
        ytPlayer.loadVideoById({ videoId: videoId, suggestedQuality: 'default' });
        console.log("!!!! Video loaded successfully!:", videoId);
    } else {
        console.log("[LV()] Player NOT found; pending:", videoId)
        pendingVideoId = videoId;
        // in case API already ready but player not created.
        if (!ytPlayer) {
            tryCreatePlayer();
        } else if (typeof ytPlayer.loadVideoById !== 'function') {
            console.log("[LV()] ytPlayer exists while ytPlayer.loadVideoById does not.")
        }
    }
}

function getVideoIdFromURL() {
    const [page, params] = window.location.hash.replace("#","").split("?") || "home";
    if (page === "video_player" && params) {
        const searchParams = new URLSearchParams(params);
        return searchParams.get("v");
    }
    return null;
}



/* Example stub for autoplay next behavior - implement with your playlist logic */
function playNextVideo() {
    // You must implement: find index of currentVideoId inside playlist,
    // then call loadVideo(nextId) and update SPA state / URL
    console.log('playNextVideo() called - implement playlist logic here')
}

document.addEventListener("DOMContentLoaded", ()=> { //domcl
    console.log("**** DOMCONTENTLOADED")
    // disable automatic scroll restoration
    // this prevents the browser from messing with our custom scroll positions.
    history.scrollRestoration = "manual";

    // get references to our main content div and dynamic menu ul
    const dynamicContent = document.getElementById("dynamic_content");
    const navMenu = document.getElementById("nav_menu");
    const videoContainer = document.getElementById("video_container");
    const videoPlayer = document.getElementById("video_player");
    const afterVideoContainer = document.getElementById("dynamic_content_after_video");

    const scrollPositions = {};

    let previousPage = currentPage();

    let playlistLoaded = false;
    let videoIdChanged = false;


    // set before manually changing the hash to prevent double-handling
    let ignoreHashChange = false;

    // Store the html content for each page in an object.
    const pages = {
        home: `
            <h1>Home</h1>
            <p class="page_subtitle">Figure Drawing Focus Mode!</p>
            <p style="padding: 1rem 1rem;">No need to get flashbanged by YouTube's home page. Let's get going!</p>
            `,
        about: `
            <h1>About</h1>
            <p class="page_subtitle">What's the big idea?</p>
            <p class="textAlign">Here's a fun little html project I made in roughly four days. It's basically YouTube, but it only consists of LinesSensei's tutorials playlist! The idea here is to cut out distractions and focus solely on figure drawing from this amazing professional artist ^^. Next time you need to view a tutorial, you won't be flashbanged by a home page that makes you instantly forget what you set out for.</p>
            <p class="textAlign">I should be drawing now. You should be, too! :D</p>
            `,
        // The HTML for these pages is generated dynamically in loadPage()
        playlist: "",
        video_player: "",
    };

    // function to setup the video input box on the video player page
    function setupVideoInputBox() {
        const btn = document.getElementById("loadVideoBtn");
        const input = document.getElementById("videoURL");

        if (!btn || !input) return; // video player not loaded

        btn.addEventListener("click", () => {
            console.log("*** Load Video button clicked");
            const val = input.value.trim();
            if (!val) return;

            const id = extractYouTubeID(val);
            if (!id) {
                alert("Could not parse video ID.");
                return;
            }

            // update previousVideoId before changing currentVideoId
            previousVideoId = currentVideoId;
            currentVideoId = id;
            console.log("Loading video ID from input box:", currentVideoId);

            // reload the page to update the video player
            // loadPage() doesn't need to be called if we just update the hash.
            // let's change the hash instead.
            location.hash = `video_player?v=${currentVideoId}`;

            //loadPage(currentPageHash());
        });
    }


    // function to extract YouTube video ID from various URL formats
    function extractYouTubeID(input) {
        // define the correct character set
        const YT_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

        // Check if the input is an ID:
        if (YT_ID_REGEX.test(input)) {
            return input;
        }

        try {
            // check if the input is a URL
            const parsed = new URL(input);

            // Standard: youtube.com/watch?v=xxxx
            if (parsed.searchParams.get("v")) {
                return parsed.searchParams.get("v");
            }

            // Shortened: youtu.be/xxxx
            if (parsed.hostname.includes("youtu.be")) {
                return parsed.pathname.slice(1);
            }

            // Shorts: youtube.com/shorts/xxxx
            if (parsed.pathname.startsWith("/shorts/")) {
                return parsed.pathname.split("/")[2];
            }

            


            return null;
        } catch (e) {
            return null;
        }
    }


    // function to generate the playlist page content dynamically from the YouTube API
    async function generatePlaylist() {
        // define the API key, playlist ID, and URL
        const API_KEY = "AIzaSyBIxMJ94JCvW4L1hl8baFKmW6RXtiVlOLQ";
        const PLAYLIST_ID = "PLuKeyozSP_IV-_ZHh_fZLT-cCGcslF8EN";
        const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${PLAYLIST_ID}&key=${API_KEY}`;

        // now we gotta fetch the json data.
        res = await fetch(url);
        //onsole.log("Res: ", res);
        // make sure it's usable
        if (!res.ok) {
            console.error('YouTube API returned', res.status);
            container.textContent = 'Failed to load playlist';
            return;
        };

        // Parse the JSON response
        data = await res.json();
        //onsole.log("data: ", data);

        
        let playlistHTML = ""

        // Generate HTML for each video in the playlist
        for(const item of data.items) {
            const title = item.snippet.title;
            const id = item.snippet.resourceId?.videoId || ''
            const thumbnail = item.snippet.thumbnails?.medium?.url || ''
            
            playlistHTML += `
                <li class="playlist_item">
                    <a href="index.html#video_player?v=${id}">
                        <img src="${thumbnail}" alt="${title}"></img>
                        <p>${title}</p>
                    </a>
                    
                </li>
            
            `
        }

        // Update the playlist page content in the object "pages"
        pages.playlist = `
        <h1>Playlist</h1>
        <p class="page_subtitle">LinesSensei's tutorials! :D</p>
        <div id="playlist_alignment">
            <ul id="playlistContainer">
                ${playlistHTML}
            </ul>
        </div>
        `

        //onsole.log(pages.playlist)
        //onsole.log("Generated playlist")
    };

    // simple function to create nav links dynamically from the "pages" object
    // called only once on page load.
    function createNavLinks() {
        for(let key in pages) {
            // create a new empty list element
            let li = document.createElement("li");
            
            // set the inner HTML to be an anchor link to the page
            // and remove underscores from the key for better readability
            const linkText = key.replace(/_/g, " ");
            li.innerHTML=`<a href="#${key}">${linkText}</a>`;

            // append the list element to the navMenu ul
            navMenu.appendChild(li);
        };
    }

    // function to get the current page from the hash
    // returns plain text of the current page, ex. "about" from "#about"
    function currentPage() { return window.location.hash.replace("#", "") || "home" };
    // function to get the current hash, including the '#'
    function currentPageHash() { return window.location.hash || "#home" };

    // detects when we successfully go to a href with a hash
    window.addEventListener("hashchange", () => {
        console.log("HASHCHANGE")
        if (!ignoreHashChange) {
            console.log("* Hash change function will not be ignored");

            scrollPositions[previousPage] = window.scrollY;
            previousPage = currentPage();
            
            //onsole.log("scroll position: ", window.scrollY);
            //onsole.log("scrollPositions object array: ", scrollPositions)
            

            //onsole.log("hash changed to:", window.location.hash);
            // call loadPage. This is our app function.
            // insert window.location.hash. This the destination of the href hash, ex. "#about" from "index.html#about"
            loadPage(window.location.hash);
        } else {
            // set ignoreHashChange back to false for next time
            ignoreHashChange = false;
            console.log("* Ignored hash change due to manual update.");
        }
    });

    

    // function to dynamically load our page.
    // this function sets our content and then sets the active link to the const page from the inserted hash
    async function loadPage(hash){
        console.log("**** LOADPAGE()");
        //onsole.log("currentVideoId before loading page:", currentVideoId);
        //onsole.log("previousVideoId before loading page:", previousVideoId);
        //onsole.log("Loading page for hash:", hash);

        // get the page name from the hash, removing the '#' character and
        // get parameters if they exist.
        const [page, params] = hash.replace("#","").split("?") || "home";

        // If we haven't loaded the playlist yet, do so here.
        if (!playlistLoaded) {
            await generatePlaylist();
            playlistLoaded = true;
        }

        // get the current video ID:
        // *********************************************************************************

        // Video get priority:
        // * url search param
        // * currentVideoId
        // * previousVideoId
        // * pendingVideoId from playlist
        if (page === "video_player") {
            const urlVideoId = getVideoIdFromURL();
            if (urlVideoId) {
                // set it to current
                currentVideoId = urlVideoId;
            } else if (currentVideoId) {
                // no need to do anything here
            } else if (previousVideoId) {
                // set it to current
                currentVideoId = previousVideoId;
            } else if (pendingVideoId) {
                // set it to current
                currentVideoId = pendingVideoId;
            }

            // set previousVideoId to currentVideoId for next time.
            previousVideoId = currentVideoId;
        }

        // after setting currentVideoId, set pending
        

        // if we still don't have a current video ID, check previousVideoId
        // attempt to fetch a video ID if we don't have one already.
        //if (!currentVideoId && previousVideoId) {
        //    currentVideoId = previousVideoId;
        //    console.log("No param video ID; using previousVideoId:", previousVideoId);
            // update the URL hash to reflect this change.
            //location.hash = `video_player?v=${currentVideoId}`;
        //}
        
        // log if no current video ID is found.
        //if (!currentVideoId && page === "video_player") {
        //    console.log("No current video ID.");
        //}

        // detect if the video ID changed:
        //videoIdChanged = (currentVideoId !== previousVideoId);
        // log if it changed
        //if (videoIdChanged) {
        //    console.log("Video ID has changed:", videoIdChanged);
        //}

        

        // end of getting current video ID
        // *********************************************************************************

        





        // *********************************************************************************

        // if it changed, we can update the page accordingly.
        // however, this won't run when the page is first loaded.
        // let's fix that by also checking if previousVideoId is null.
        const warningHTML = !currentVideoId ? `<p class="warning_text" style:"padding: 1rem 1rem;">No video ID provided. Select a video through the playlist or add a video ID to the URL with "?v=video_id". Youtu.be ids also work.</p>` : "";
        pages.video_player = `
                <h1>Video Player</h1>
                ${warningHTML}
                <div id="video_player_container"></div>
        `;

        

        // update the dynamic content div with the selected page's HTML
        // ********************************************************************************
        dynamicContent.innerHTML = pages[page] || pages.home;
        //logEvent('[LP()] Set dynamic content!', { page, params, currentVideoId, pendingVideoId, ytApiReady: !!ytApiReady, ytPlayer: !!ytPlayer})

        tryCreatePlayer()


        // New code by cGPT
        // this code does the following:
        // * toggle visibility of 'video_container'
        // * call syncVideoState
        // * update the URL (without triggering hashchange)
        // * update the afterVideoContainer 
        console.log("[LP()] currentVideoId:", currentVideoId);
        console.log("[LP()] previousVideoId:", previousVideoId);
        console.log("[LP()] urlVideoId", getVideoIdFromURL());
        console.log("[LP()] pendingVideoId", pendingVideoId);
        if (page === 'video_player') { //@lpv
            // make sure the video container is visible
            document.getElementById('video_container').style.display = 'block';
            

            // update URL without causing hashchange loop:
            const newHash = currentVideoId ? `#video_player?v=${currentVideoId}` : '#video_player';
            if (location.hash !== newHash) {
                history.replaceState(null, '', newHash); // does NOT trigger hashchange event listener
            }

            // update after-video HTML
            const afterVideoHTML = `
                <div id="video_input_box">
                    <input id="videoURL" type="text" placeholder="Paste YouTube link…" />
                    <button id="loadVideoBtn">Load Video</button>
                </div>
            `;
            afterVideoContainer.innerHTML = `${afterVideoHTML}`;
            // set up input box AFTER adding it to the DOM
            setupVideoInputBox();

            
        } else {
            // hide the player container if not on video page
            document.getElementById('video_container').style.display = 'none';
            // clear the after video container if not on video player page
            afterVideoContainer.innerHTML = "";
        }

        // handle any dynamic elements that need to be set up after loading the page
        const videoInputBox = document.getElementById("video_input_box");

        // set the active link in the nav menu (visual functionality only)
        setActiveLink(page);

        // restore scroll position
        if (scrollPositions[page] !== undefined) {
            window.scrollTo(0, scrollPositions[page]);
        } else {
            window.scrollTo(0, 0)
        }

        // call syncVideoState AFTER setActiveLink
        if (page === 'video_player') {
            // instruct the player to load this id (safe even if API/player not ready)
            //loadVideo(currentVideoId);
            if (!currentVideoId) {
                console.log("[LP()] currentVideoId NOT found!")
                console.log("* syncVideoState couldn't be called!")
            } else {
                syncVideoState();
            }
        }

        // yay we're done!
        console.log("[LP()] Loaded page!")

        firstPageLoad = false;
    };
    // End of loadPage function


    // this function sets which 'a' elements should have the "active" class.
    function setActiveLink(page) {
        // get all nav menu links
        const links = document.querySelectorAll("nav ul li a");
        // iterate through each link

        // remove all active classes first
        links.forEach(link => link.classList.remove("active"));

        links.forEach(link => {
            // if the link's href includes the current page, set it to active
            link.classList.toggle("active", link.getAttribute("href").includes(page));
        });
    };

    // finally, we load the page.
    // These statements only run when we finish loading the DOM in index.html for the first time.
    createNavLinks()
    loadPage(currentPageHash());

    //onsole.log("Website loaded!");
});
