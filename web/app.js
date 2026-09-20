/* =========================================================
   MONTYPOD
   Spotify controller + Playlists
   Safari iOS 9 compatible
========================================================= */


/* =========================================================
   ESTADO
========================================================= */

var isPlaying = false;
var currentProgress = 0;
var currentDuration = 0;
var seeking = false;

var currentScreen = "now";
var previousScreen = "now";


/* =========================================================
   PLAYLISTS PROVISIONALES
========================================================= */

var playlists = {

    gym: {
        name: "Gym",
        tracks: [
            { name: "Sky & Sand", artist: "Paul Kalkbrenner" },
            { name: "The Less I Know The Better", artist: "Tame Impala" },
            { name: "Instant Crush", artist: "Daft Punk" },
            { name: "Midnight City", artist: "M83" }
        ]
    },

    musica: {
        name: "Música",
        tracks: [
            { name: "Sky & Sand", artist: "Paul Kalkbrenner" },
            { name: "Instant Crush", artist: "Daft Punk" },
            { name: "Do I Wanna Know?", artist: "Arctic Monkeys" },
            { name: "505", artist: "Arctic Monkeys" }
        ]
    },

    noches: {
        name: "Noches",
        tracks: [
            { name: "Midnight City", artist: "M83" },
            { name: "After Dark", artist: "Mr.Kitty" },
            { name: "Nightcall", artist: "Kavinsky" }
        ]
    },

    rock: {
        name: "Rock",
        tracks: [
            { name: "Do I Wanna Know?", artist: "Arctic Monkeys" },
            { name: "505", artist: "Arctic Monkeys" },
            { name: "Everlong", artist: "Foo Fighters" },
            { name: "Come As You Are", artist: "Nirvana" }
        ]
    },

    chill: {
        name: "Chill",
        tracks: [
            { name: "Sunset Lover", artist: "Petit Biscuit" },
            { name: "Intro", artist: "The xx" },
            { name: "Weightless", artist: "Marconi Union" }
        ]
    },

    likes: {
        name: "Me gusta",
        tracks: [
            { name: "Sky & Sand", artist: "Paul Kalkbrenner" },
            { name: "Instant Crush", artist: "Daft Punk" },
            { name: "The Less I Know The Better", artist: "Tame Impala" }
        ]
    }

};


/* =========================================================
   ELEMENTOS
========================================================= */

var nowPlayingScreen = document.getElementById("now-playing-screen");
var playlistsScreen = document.getElementById("playlists-screen");
var playlistDetailScreen = document.getElementById("playlist-detail-screen");

var headerTitle = document.getElementById("header-title");
var backButton = document.getElementById("back-button");

var dockNowPlaying = document.getElementById("dock-now-playing");
var dockPlaylists = document.getElementById("dock-playlists");


/* =========================================================
   UTILIDADES
========================================================= */

function updateResponse(text) {

    var response = document.getElementById("response");

    if (response) {
        response.textContent = text;
    }
}


function formatTime(milliseconds) {

    if (!milliseconds || milliseconds < 0) {
        milliseconds = 0;
    }

    var totalSeconds = Math.floor(milliseconds / 1000);
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = totalSeconds % 60;

    if (seconds < 10) {
        seconds = "0" + seconds;
    }

    return minutes + ":" + seconds;
}


/* =========================================================
   PLAY
========================================================= */

function updatePlayButton() {

    var button = document.getElementById("play-button");

    if (!button) {
        return;
    }

    if (isPlaying) {
        button.textContent = "||";
    } else {
        button.textContent = ">";
    }
}


/* =========================================================
   PROGRESO
========================================================= */

function updateProgress() {

    if (!currentDuration || currentDuration <= 0) {
        return;
    }

    var percentage =
        (currentProgress / currentDuration) * 100;

    if (percentage < 0) {
        percentage = 0;
    }

    if (percentage > 100) {
        percentage = 100;
    }

    var bar = document.getElementById("progress-bar");
    var currentTime = document.getElementById("current-time");
    var duration = document.getElementById("duration");

    if (bar) {
        bar.style.width = percentage + "%";
    }

    if (currentTime) {
        currentTime.textContent =
            formatTime(currentProgress);
    }

    if (duration) {
        duration.textContent =
            formatTime(currentDuration);
    }
}


/* =========================================================
   SEEK
========================================================= */

function updateSeekPosition(clientX) {

    var progress =
        document.getElementById("progress");

    if (!progress || !currentDuration) {
        return;
    }

    var rect =
        progress.getBoundingClientRect();

    var x =
        clientX - rect.left;

    if (x < 0) {
        x = 0;
    }

    if (x > rect.width) {
        x = rect.width;
    }

    if (rect.width <= 0) {
        return;
    }

    var percentage =
        x / rect.width;

    currentProgress =
        currentDuration * percentage;

    updateProgress();
}


function seekToCurrentPosition() {

    if (!currentDuration || currentDuration <= 0) {
        return;
    }

    var position =
        Math.round(currentProgress);

    sendRequest(
        "/command/seek?position=" +
        encodeURIComponent(position),
        function () {

            updateResponse(
                "Posición: " +
                formatTime(position)
            );

        },
        function () {

            updateResponse(
                "Error al mover la canción"
            );

        }
    );
}


function handleProgressClick(event) {

    updateSeekPosition(event.clientX);
    seekToCurrentPosition();
}


function handleTouchStart(event) {

    if (!event.touches || !event.touches.length) {
        return;
    }

    seeking = true;

    updateSeekPosition(
        event.touches[0].clientX
    );
}


function handleTouchMove(event) {

    if (!seeking) {
        return;
    }

    if (!event.touches || !event.touches.length) {
        return;
    }

    event.preventDefault();

    updateSeekPosition(
        event.touches[0].clientX
    );
}


function handleTouchEnd() {

    if (!seeking) {
        return;
    }

    seeking = false;

    seekToCurrentPosition();
}


function setupSeekBar() {

    var progress =
        document.getElementById("progress");

    if (!progress) {
        return;
    }

    progress.onclick =
        handleProgressClick;

    progress.ontouchstart =
        handleTouchStart;

    progress.ontouchmove =
        handleTouchMove;

    progress.ontouchend =
        handleTouchEnd;
}


/* =========================================================
   VOLUMEN
========================================================= */

function updateVolume(volume) {

    if (
        volume === null ||
        typeof volume === "undefined"
    ) {
        return;
    }

    var slider =
        document.getElementById("volume-slider");

    var label =
        document.getElementById("volume-value");

    if (slider) {
        slider.value = volume;
    }

    if (label) {
        label.textContent =
            volume + "%";
    }
}


function setVolume(value) {

    sendRequest(
        "/command/volume?value=" +
        encodeURIComponent(value),

        function () {

            updateVolume(
                parseInt(value, 10)
            );

            updateResponse(
                "Volumen: " +
                value +
                "%"
            );

        },

        function () {

            updateResponse(
                "Error de volumen"
            );

        }
    );
}


/* =========================================================
   PETICIÓN HTTP COMPATIBLE
========================================================= */

function sendRequest(url, success, failure) {

    var xhr =
        new XMLHttpRequest();

    xhr.open(
        "GET",
        url,
        true
    );

    xhr.onreadystatechange =
        function () {

            if (xhr.readyState !== 4) {
                return;
            }

            if (
                xhr.status >= 200 &&
                xhr.status < 300
            ) {

                if (success) {
                    success(xhr);
                }

            } else {

                if (failure) {
                    failure(xhr);
                }
            }
        };

    xhr.onerror =
        function () {

            if (failure) {
                failure(xhr);
            }
        };

    try {

        xhr.send(null);

    } catch (error) {

        if (failure) {
            failure(xhr);
        }
    }
}


/* =========================================================
   SPOTIFY ACTUAL
========================================================= */

function getCurrentTrack() {

    sendRequest(
        "/spotify/current?_=" +
        new Date().getTime(),

        function (xhr) {

            var data;

            try {

                data =
                    JSON.parse(
                        xhr.responseText
                    );

            } catch (error) {

                updateResponse(
                    "Respuesta inválida"
                );

                return;
            }


            if (data.connected === false) {

                updateResponse(
                    "Spotify no conectado"
                );

                return;
            }


            isPlaying =
                data.playing === true;

            updatePlayButton();


            if (
                typeof data.volume_percent !==
                "undefined"
            ) {

                updateVolume(
                    data.volume_percent
                );
            }


            if (!data.track) {

                var song =
                    document.getElementById("song");

                var artist =
                    document.getElementById("artist");

                var image =
                    document.getElementById("album-image");

                var placeholder =
                    document.getElementById(
                        "album-placeholder"
                    );

                if (song) {
                    song.textContent =
                        "Sin reproducción";
                }

                if (artist) {
                    artist.textContent =
                        "Spotify";
                }

                if (image) {
                    image.classList.add("hidden");
                }

                if (placeholder) {
                    placeholder.classList.remove("hidden");
                }

                currentProgress = 0;
                currentDuration = 0;

                return;
            }


            var songElement =
                document.getElementById("song");

            var artistElement =
                document.getElementById("artist");

            if (songElement) {
                songElement.textContent =
                    data.track.name;
            }

            if (artistElement) {
                artistElement.textContent =
                    data.track.artist;
            }


            if (data.track.image) {

                var albumImage =
                    document.getElementById(
                        "album-image"
                    );

                var albumPlaceholder =
                    document.getElementById(
                        "album-placeholder"
                    );

                if (albumImage) {

                    albumImage.src =
                        data.track.image;

                    albumImage.classList.remove(
                        "hidden"
                    );
                }

                if (albumPlaceholder) {

                    albumPlaceholder.classList.add(
                        "hidden"
                    );
                }
            }


            if (!seeking) {

                currentProgress =
                    data.progress_ms || 0;

                currentDuration =
                    data.duration_ms || 0;

                updateProgress();
            }

        },

        function () {

            updateResponse(
                "No se pudo conectar con M-TERM"
            );

        }
    );
}


/* =========================================================
   COMANDOS
========================================================= */

function sendCommand(command) {

    sendRequest(
        "/command/" + command,

        function (xhr) {

            updateResponse(
                xhr.responseText
            );

            setTimeout(
                getCurrentTrack,
                250
            );

        },

        function (xhr) {

            updateResponse(
                "Error de comando"
            );

        }
    );
}


function togglePlay() {

    if (isPlaying) {
        sendCommand("pause");
    } else {
        sendCommand("play");
    }
}


/* =========================================================
   NAVEGACIÓN
========================================================= */

function hideAllScreens() {

    if (nowPlayingScreen) {
        nowPlayingScreen.classList.add("hidden");
    }

    if (playlistsScreen) {
        playlistsScreen.classList.add("hidden");
    }

    if (playlistDetailScreen) {
        playlistDetailScreen.classList.add("hidden");
    }
}


function clearDockActive() {

    if (dockNowPlaying) {
        dockNowPlaying.classList.remove("active");
    }

    if (dockPlaylists) {
        dockPlaylists.classList.remove("active");
    }
}


function showNowPlaying() {

    previousScreen = currentScreen;
    currentScreen = "now";

    hideAllScreens();

    if (nowPlayingScreen) {
        nowPlayingScreen.classList.remove("hidden");
    }

    if (headerTitle) {
        headerTitle.textContent =
            "Montypod";
    }

    if (backButton) {
        backButton.classList.add("hidden");
    }

    clearDockActive();

    if (dockNowPlaying) {
        dockNowPlaying.classList.add("active");
    }
}


function showPlaylists() {

    previousScreen = currentScreen;
    currentScreen = "playlists";

    hideAllScreens();

    if (playlistsScreen) {
        playlistsScreen.classList.remove("hidden");
    }

    if (headerTitle) {
        headerTitle.textContent =
            "Playlists";
    }

    if (backButton) {
        backButton.classList.add("hidden");
    }

    clearDockActive();

    if (dockPlaylists) {
        dockPlaylists.classList.add("active");
    }
}


function showPreviousScreen() {

    if (
        currentScreen ===
        "playlist-detail"
    ) {

        showPlaylists();

        return;
    }

    showNowPlaying();
}


/* =========================================================
   PLAYLIST
========================================================= */

function openPlaylist(id) {

    var playlist =
        playlists[id];

    if (!playlist) {
        return;
    }

    previousScreen =
        "playlists";

    currentScreen =
        "playlist-detail";

    hideAllScreens();

    if (playlistDetailScreen) {
        playlistDetailScreen.classList.remove(
            "hidden"
        );
    }

    if (headerTitle) {
        headerTitle.textContent =
            playlist.name;
    }

    if (backButton) {
        backButton.classList.remove(
            "hidden"
        );
    }

    clearDockActive();

    if (dockPlaylists) {
        dockPlaylists.classList.add(
            "active"
        );
    }

    renderPlaylist(playlist);
}


function renderPlaylist(playlist) {

    var title =
        document.getElementById(
            "playlist-detail-title"
        );

    if (title) {
        title.textContent =
            playlist.name;
    }


    var container =
        document.getElementById(
            "playlist-tracks"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    var i;

    for (
        i = 0;
        i < playlist.tracks.length;
        i++
    ) {

        var track =
            playlist.tracks[i];

        var row =
            document.createElement("div");

        row.className =
            "track-row";


        var number =
            document.createElement("div");

        number.className =
            "track-number";

        number.textContent =
            i + 1;


        var info =
            document.createElement("div");

        info.className =
            "track-info";


        var name =
            document.createElement("div");

        name.className =
            "track-name";

        name.textContent =
            track.name;


        var artist =
            document.createElement("div");

        artist.className =
            "track-artist";

        artist.textContent =
            track.artist;


        info.appendChild(name);
        info.appendChild(artist);


        var play =
            document.createElement("div");

        play.className =
            "track-play";

        play.textContent =
            "▶";


        row.appendChild(number);
        row.appendChild(info);
        row.appendChild(play);


        row.onclick =
            createTrackHandler(track);


        container.appendChild(row);
    }
}


function createTrackHandler(track) {

    return function () {

        updateResponse(
            "Seleccionada: " +
            track.name
        );

        var song =
            document.getElementById("song");

        var artist =
            document.getElementById("artist");

        if (song) {
            song.textContent =
                track.name;
        }

        if (artist) {
            artist.textContent =
                track.artist;
        }

        showNowPlaying();
    };
}


/* =========================================================
   LIKE
========================================================= */

function toggleLike() {

    var button =
        document.getElementById(
            "like-button"
        );

    if (!button) {
        return;
    }

    if (
        button.className.indexOf(
            "liked"
        ) !== -1
    ) {

        button.classList.remove("liked");

        button.textContent =
            "♡";

        updateResponse(
            "Quitado de Me gusta"
        );

    } else {

        button.classList.add("liked");

        button.textContent =
            "♥";

        updateResponse(
            "Añadido a Me gusta"
        );
    }
}


/* =========================================================
   EVENTOS
========================================================= */

function setupButtons() {

    var playButton =
        document.getElementById("play-button");

    var previousButton =
        document.getElementById("previous-button");

    var nextButton =
        document.getElementById("next-button");

    var likeButton =
        document.getElementById("like-button");

    var volumeSlider =
        document.getElementById("volume-slider");

    if (playButton) {

        playButton.onclick =
            function () {
                togglePlay();
            };
    }

    if (previousButton) {

        previousButton.onclick =
            function () {
                sendCommand("previous");
            };
    }

    if (nextButton) {

        nextButton.onclick =
            function () {
                sendCommand("next");
            };
    }

    if (likeButton) {

        likeButton.onclick =
            function () {
                toggleLike();
            };
    }

    if (volumeSlider) {

        volumeSlider.onchange =
            function () {

                setVolume(
                    this.value
                );
            };

        volumeSlider.oninput =
            function () {

                updateVolume(
                    this.value
                );
            };
    }

    if (dockNowPlaying) {

        dockNowPlaying.onclick =
            function () {
                showNowPlaying();
            };
    }

    if (dockPlaylists) {

        dockPlaylists.onclick =
            function () {
                showPlaylists();
            };
    }

    if (backButton) {

        backButton.onclick =
            function () {
                showPreviousScreen();
            };
    }
}


/* =========================================================
   PROGRESO LOCAL
========================================================= */

setInterval(
    function () {

        if (
            isPlaying &&
            !seeking &&
            currentDuration > 0
        ) {

            currentProgress += 1000;

            if (
                currentProgress >
                currentDuration
            ) {

                currentProgress =
                    currentDuration;
            }

            updateProgress();
        }

    },
    1000
);


/* =========================================================
   INICIO
========================================================= */

setupSeekBar();
setupButtons();

showNowPlaying();
getCurrentTrack();

setInterval(
    getCurrentTrack,
    3000
);