//const { createElement } = require("react");


document.addEventListener("DOMContentLoaded", ()=> {
    const contentDiv = document.getElementById("content");
    const dynamicMenu = document.getElementById("dynamicMenus");

    const scrollPositions = {};

    previousPage = currentPage()

    playlistLoaded = false 

    // create html for each page to insert into the app space.
    const pages = {
        home: `
            <h1>Home</h1>
            <p class="page_subtitle">Figure Drawing Focus Mode!</p>
            <p>No need to get flashbanged by YouTube's home page. Let's get going!</p>
            
            `,
        about: `
            <h1>About</h1>
            <p class="page_subtitle">What's the big idea?</p>
            <p class="textAlign">Here's a fun little html project I made in roughly two days. It's basically YouTube, but it only consists of LinesSensei's tutorials playlist! The idea here is to cut out distractions and focus solely on figure drawing from this amazing professional artist ^^. Next time you need to view a tutorial, you won't be flashbanged by a home page that makes you instantly forget what you set out for.</p>
            <p class="textAlign">I should be drawing now. You should be, too! :D</p>
            `,
        playlist: `
            <h1>Playlist</h1>
            <ul id="playlistContainer">Sup Bro!</ul>
            `,
        video_player: `
            <h1>Video Player</h1>
            <iframe id="video_player" src="https://www.youtube.com/embed" allowfullscreen title="video">
            </iframe>
            <p>select a video from the playlist to start watching.</p>
            `,
    };

    generatePlaylist()

    async function generatePlaylist() {
        // ok, we need to create the playlist options here...
        // let's get the API key and playlist.
        const API_KEY = "AIzaSyBIxMJ94JCvW4L1hl8baFKmW6RXtiVlOLQ";
        const PLAYLIST_ID = "PLuKeyozSP_IV-_ZHh_fZLT-cCGcslF8EN";

        // now let's get the url.
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

        // get the data
        data = await res.json();
        //onsole.log("data: ", data);

        
        let playlistHTML = ""

        // now let's get everything we need.
        for(const item of data.items) {
            const title = item.snippet.title;
            const id = item.snippet.resourceId?.videoId || ''
            const thumbnail = item.snippet.thumbnails?.medium?.url || ''
            //onsole.log(thumbnail);
            

            playlistHTML += `
                <li>
                    <a href="index.html#video_player?v=${id}">
                        <img src="${thumbnail}" alt="${title}"></img>
                        <p>${title}</p>
                    </a>
                    
                </li>
            
            `

            // add it to playlistHTML
        }

        pages.playlist = `
        <h1>Playlist</h1>
        <p class="page_subtitle">LinesSensei's tutorials! :D</p>
        <ul id="playlistContainer">
            ${playlistHTML}
        </ul>
        `

        //onsole.log(pages.playlist)
    };

    // streamline this... Add a function called create nav links
    // This function creates new 'a' links inside dynamicMenus using the const pages and assigns hash href references.
    // the hightlighted (or "active") link should always be the one currently used.
    function createNavLinks() {
        // loop through all keys
        for(let key in pages) {
            // create a new empty list element
            let li = document.createElement("li")
            // add the html from the object "pages"
            li.innerHTML=`<a href="#${key}">${key}</a>`;
            // add the item. Should be something like <li><a href="#home" class="active">home</a></li>
            dynamicMenu.appendChild(li);
        };
    }

    function currentPage() { return window.location.hash.replace("#", "") || "home" };

    // this runs after loadPage() has already run.
    //window.addEventListener("load", createNavLinks());



    // detects when we successfully go to a href with a hash
    window.addEventListener("hashchange", () => {
        scrollPositions[previousPage] = window.scrollY;
        previousPage = currentPage();
        
        console.log("scroll position: ", window.scrollY);
        console.log("scrollPositions object array: ", scrollPositions)
        

        //onsole.log("hash changed to:", window.location.hash);
        // call loadPage. This is our app function.
        // insert window.location.hash. This the destination of the href hash, ex. "#about" from "index.html#about"
        loadPage(window.location.hash);
    });

    // function to dynamically load our page.
    // this function sets our content and then sets the active link to the const page from the inserted hash
    async function loadPage(hash){
        // get the key from the hash. "#about" becomes "about"
        const [page, params] = hash.replace("#","").split("?") || "home";

        const fallbackVideos = {
            "Oo63vtmSW_E": "That tracks. Baseball, huh?",
            "IgENnFhniOg": "Trumpet...",
            "eFq4qsKrcoE": "Pencil...",
        };


        if (page === "playlist" && !playlistLoaded) {
            await generatePlaylist();
            playlistLoaded = true;
        }
        
        if (page === "video_player") {
            let videoId = null;

            if (params) {
                const searchParams = new URLSearchParams(params);
                videoId = searchParams.get("v");
            }

            // pick one at random if not provided
            //if (!videoId) {
            //    const ids = Object.keys(fallbackVideos);
            //    const randomIndex = Math.floor(Math.random() * ids.length);
            //    videoId = ids[randomIndex];
            //}
            
            let videoFlair = fallbackVideos[videoId] || "";

            if (!videoId) {
                videoFlair = "Pick a video from the playlist!"
            }

            pages.video_player = `
                <h1>Video Player</h1>
                <div>
                    <iframe id="video_player" src="https://www.youtube.com/embed/${videoId}" allowfullscreen></iframe>
                </div>
                <p>${videoFlair}</p>
            `;
        
        }

        //onsole.log("Loading page:", page);

        // set the content this page if it exists, or the home page.
        contentDiv.innerHTML = pages[page] || pages.home;
        // call setActiveLink (???)
        setActiveLink(page);

        // restore scroll position
        if (scrollPositions[page] !== undefined) {
            window.scrollTo(0, scrollPositions[page]);
        } else {
            window.scrollTo(0, 0)
        }
    };

    // this function sets which 'a' elements should have the "active" class.
    function setActiveLink(page) {
        // get only 'a' elements inside our nav bar, 'dynamicMenus'
        links = dynamicMenus.querySelectorAll("a");
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
        });
    };

    // finally, we load the page.
    // These statements only run when we finish loading the DOM in index.html for the first time.
    createNavLinks()
    const currentHash = window.location.hash || "#home";
    loadPage(currentHash);

    //onsole.log("Website loaded!");
});