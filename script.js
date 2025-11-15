//11/14/2025


document.addEventListener("DOMContentLoaded", ()=> {
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

    let previousVideoId = null;
    let currentVideoId = null;

    let previousPage = currentPage();

    let playlistLoaded = false;
    let videoIdChanged = false;

    // set before manually changing the hash to prevent double-handling
    let ignoreHashChange = false;

    // first page load bool:
    let firstPageLoad = true;

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
    function extractYouTubeID(url) {
        try {
            const parsed = new URL(url);

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
        console.log("Generated playlist")
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
        if (!ignoreHashChange) {
            console.log("*** Hash change detected");

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
            console.log("*** Ignored hash change due to manual update.");
        }
    });

    // function to dynamically load our page.
    // this function sets our content and then sets the active link to the const page from the inserted hash
    async function loadPage(hash){
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

        // prioritize getting the parameter video ID if it exists.
        if (page === "video_player" && params) {
            const searchParams = new URLSearchParams(params);
            currentVideoId = searchParams.get("v");
            console.log("Param video ID found:", currentVideoId);
        }

        // if we still don't have a current video ID, check previousVideoId
        // attempt to fetch a video ID if we don't have one already.
        if (!currentVideoId && previousVideoId) {
            currentVideoId = previousVideoId;
            console.log("No param video ID; using previousVideoId:", previousVideoId);
            // update the URL hash to reflect this change.
            //location.hash = `video_player?v=${currentVideoId}`;
        }
        
        // log if no current video ID is found.
        if (!currentVideoId && page === "video_player") {
            console.log("No current video ID.");
        }

        // detect if the video ID changed:
        videoIdChanged = (currentVideoId !== previousVideoId);
        // log if it changed
        if (videoIdChanged) {
            console.log("Video ID has changed:", videoIdChanged);
        }

        // set previousVideoId to currentVideoId for next time.
        previousVideoId = currentVideoId;

        // end of getting current video ID
        // *********************************************************************************

        // the following code updates the video player page HTML

        // if it changed, we can update the page accordingly.
        // however, this won't run when the page is first loaded.
        // let's fix that by also checking if previousVideoId is null.
        if (videoIdChanged || previousVideoId === null) {
            // warn the user if no video ID is provided.
            const warningHTML = !currentVideoId ? `<p class="warning_text" style:"padding: 1rem 1rem;">No video ID provided. Select a video through the playlist or add a video ID to the URL with "?v=video_id". Youtu.be ids also work.</p>` : "";
            
            

            // update the URL params if we are on the video_player page.
            if (page === "video_player") {
                // if no video ID is provided, remove the search param entirely.
                if (!currentVideoId) {
                    location.hash = `video_player`;
                } else {
                    location.hash = `video_player?v=${currentVideoId}`;
                }
            }

            // Finally, set the video player page content with the new video ID.
            pages.video_player = `
                <h1>Video Player</h1>
                ${warningHTML}
                <div id="video_player_container"></div>
            `;

            //onsole.log("The video_player page content has been updated and video ID set to:", currentVideoId);
        }

        //onsole.log("Loading page:", page);

        // update the dynamic content div with the selected page's HTML
        // ********************************************************************************
        dynamicContent.innerHTML = pages[page] || pages.home;

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

        // set the video src and input box if on the video player page
        if (page === "video_player") {
            if (videoIdChanged) {
                videoPlayer.src = `https://www.youtube.com/embed/${currentVideoId}`;
            }
            
            // append the input box to the after-video container

            // HTML const for the video input box.
            const videoInputBoxHTML = `
                <div id="video_input_box">
                    <input id="videoURL" type="text" placeholder="Paste YouTube link…" />
                    <button id="loadVideoBtn">Load Video</button>
                </div>
            `;

            

            // use innerHTML to avoid duplicates
            afterVideoContainer.innerHTML = `${videoInputBoxHTML}`;

            // set up input box AFTER adding it to the DOM
            setupVideoInputBox();
        } else {
            // clear the after video container if not on video player page
            afterVideoContainer.innerHTML = "";
        }

        // show or hide the video container and player based on the page and video ID
        videoContainer.classList.toggle("hidden", !(page === "video_player" && currentVideoId));
        videoPlayer.classList.toggle("hidden", !(page === "video_player" && currentVideoId));

        // add the search param to the url if currentVideoId is valid
        if (page === "video_player" && currentVideoId && !firstPageLoad) {
            // prevent double-handling if we are already ignoring hash changes
            //ignoreHashChange = true;

            const newHash = `#video_player?v=${currentVideoId}`;
            if (location.hash !== newHash) {
                history.replaceState(null, "", newHash); // does not trigger hashchange event
            }


            //location.hash = `video_player?v=${currentVideoId}`;
        }


        // yay we're done!
        console.log("Loaded page!")
        console.log("ignoreHashChange is now:", ignoreHashChange);

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
