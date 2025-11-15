//11/14/2025


document.addEventListener("DOMContentLoaded", ()=> {
    // disable automatic scroll restoration
    // this prevents the browser from messing with our custom scroll positions.
    history.scrollRestoration = "manual";

    // get references to our main content div and dynamic menu ul
    const contentDiv = document.getElementById("content");
    const navMenu = document.getElementById("navMenu");

    const scrollPositions = {};

    let previousVideoId = null;
    let currentVideoId = null;

    let previousPage = currentPage();

    let playlistLoaded = false;
    let videoPlayerLoaded = false;
    let videoIdChanged = false;

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
            <p class="textAlign">Here's a fun little html project I made in roughly two days. It's basically YouTube, but it only consists of LinesSensei's tutorials playlist! The idea here is to cut out distractions and focus solely on figure drawing from this amazing professional artist ^^. Next time you need to view a tutorial, you won't be flashbanged by a home page that makes you instantly forget what you set out for.</p>
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
                <li>
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
        <ul id="playlistContainer">
            ${playlistHTML}
        </ul>
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
        console.log("*** Hash change detected");

        scrollPositions[previousPage] = window.scrollY;
        previousPage = currentPage();
        
        //onsole.log("scroll position: ", window.scrollY);
        //onsole.log("scrollPositions object array: ", scrollPositions)
        

        //onsole.log("hash changed to:", window.location.hash);
        // call loadPage. This is our app function.
        // insert window.location.hash. This the destination of the href hash, ex. "#about" from "index.html#about"
        loadPage(window.location.hash);
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

        // /!\ Fallback videos are currently not being used.
        const fallbackVideos = {
            "Oo63vtmSW_E": "That tracks. Baseball, huh?",
            "IgENnFhniOg": "Trumpet...",
            "eFq4qsKrcoE": "Pencil...",
        };

        //page === "playlist" && 

        // If we haven't loaded the playlist yet, do so here.
        if (!playlistLoaded) {
            await generatePlaylist();
            playlistLoaded = true;
        }

        // log if we are on the video player page.
        //onsole.log("On video player page:", page === "video_player");

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

        

        // the following code updates the video player page HTML

        // if it changed, we can update the page accordingly.
        // however, this won't run when the page is first loaded.
        // let's fix that by also checking if previousVideoId is null.
        if (videoIdChanged || previousVideoId === null) {
            // warn the user if no video ID is provided.
            const warningHTML = !currentVideoId ? `<p style:"padding: 1rem 1rem;">No video ID provided. Select a video through the playlist or add a video ID to the URL with "?v=video_id". Youtu.be ids also work.</p>` : "";
            
            // create HTML for the iframe that only displays if a video ID is present.
            const videoPlayerHTML = currentVideoId ? `
                <div class="video_wrapper">
                    <iframe id="video_player" src="https://www.youtube.com/embed/${currentVideoId}" allowfullscreen></iframe>
                </div>
            ` : "";
            
            // HTML const for the video input box.
            const videoInputBoxHTML = `
                <div id="videoInputBox">
                    <input id="videoURL" type="text" placeholder="Paste YouTube link…" />
                    <button id="loadVideoBtn">Load Video</button>
                </div>
            `;

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
                ${videoPlayerHTML}
                ${videoInputBoxHTML}
            `;

            //onsole.log("The video_player page content has been updated and video ID set to:", currentVideoId);
        }

        //onsole.log("Loading page:", page);

        // set the content this page if it exists, or the home page.
        contentDiv.innerHTML = pages[page] || pages.home;

        // if we are on the video player page, setup the input box.
        if (page === "video_player") {
            setupVideoInputBox();
        }

        // call setActiveLink (???)
        setActiveLink(page);

        // restore scroll position
        if (scrollPositions[page] !== undefined) {
            window.scrollTo(0, scrollPositions[page]);
        } else {
            window.scrollTo(0, 0)
        }

        //const iframe = document.getElementById("video_player");
        //iframe.src = `https://www.youtube.com/embed/${currentVideoId}`;
        //if (page === "video_player" && currentVideoId) {
        //    document.getElementById("video_wrapper").classList.add("hidden");
        //} else {
        //    document.getElementById("video_wrapper").classList.remove("hidden");
        //}


        console.log("Loaded page!")
    };

    // this function sets which 'a' elements should have the "active" class.
    function setActiveLink(page) {
        // get only 'a' elements inside our nav bar, 'navMenus'
        const links = document.querySelectorAll("nav ul li a") //navMenu.querySelectorAll("a");

        // clear all just in case
        links.forEach(link => link.classList.remove("active"));

        //onsole.log("links:", links);
        // in each link (a element)...
        // set the desired link to be highlighted, while unhighlighting the other links.
        links.forEach(link => {
            // set the classname to "active" if the href contains the page text.
            // essentially, we are taking something like "about" and ensuring <a href="#about"></a> has the active classname.
            link.classList.toggle("active", link.getAttribute("href").includes(page));

            // chatGPT recommends using triple equals, like such...
            // check if this link's href matches "#key", ex. "#contacts"
            // "===" breaks implied type rules, such as 1 == true or "1" == 1
            // "===" also checks if objects are the same in memory! :O
            // So, two identical arrays still won't be the same unless they are variables that reference the same object in memory.
            const isActive = link.getAttribute("href") === `#${page}`
            // Okay, so I'm guessing this toggle method just sets a class to be on or off.
            // Not quite. It's just an easier method that turns it into a boolean based method.
            // If true, add it if it isn't already present.
            // If false, remove it if it exists.
            link.classList.toggle("active", isActive)

            //onsole.log(isActive, link)
        });

        //onsole.log("set active link")
    };

    // finally, we load the page.
    // These statements only run when we finish loading the DOM in index.html for the first time.
    createNavLinks()
    loadPage(currentPageHash());

    //onsole.log("Website loaded!");
});
