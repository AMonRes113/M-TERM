var isPlaying = false;

var currentProgress = 0;
var currentDuration = 0;


/* =========================
   RESPUESTA
========================= */

function updateResponse(message) {

    document.getElementById("response").innerHTML =
        message;

}


/* =========================
   FORMATO DE TIEMPO
========================= */

function formatTime(milliseconds) {

    if (!milliseconds || milliseconds < 0) {
        return "0:00";
    }

    var totalSeconds =
        Math.floor(milliseconds / 1000);

    var minutes =
        Math.floor(totalSeconds / 60);

    var seconds =
        totalSeconds % 60;

    if (seconds < 10) {
        seconds = "0" + seconds;
    }

    return minutes + ":" + seconds;

}


/* =========================
   BOTÓN PLAY / PAUSE
========================= */

function updatePlayButton() {

    var button =
        document.getElementById("play-button");

    if (!button) {
        return;
    }

    if (isPlaying) {

        button.innerHTML = "||";

    } else {

        button.innerHTML = ">";

    }

}


/* =========================
   BARRA DE PROGRESO
========================= */

function updateProgress() {

    if (!currentDuration) {
        return;
    }

    var percentage =
        (currentProgress / currentDuration) * 100;

    if (percentage > 100) {
        percentage = 100;
    }

    if (percentage < 0) {
        percentage = 0;
    }

    document.querySelector(
        ".progress-bar"
    ).style.width =
        percentage + "%";


    document.querySelector(
        ".time span:first-child"
    ).innerHTML =
        formatTime(currentProgress);


    document.querySelector(
        ".time span:last-child"
    ).innerHTML =
        formatTime(currentDuration);

}


/* =========================
   OBTENER CANCIÓN
========================= */

function getCurrentTrack() {

    var xhr = new XMLHttpRequest();

    xhr.open(
        "GET",
        "/spotify/current",
        true
    );

    xhr.onreadystatechange = function() {

        if (xhr.readyState !== 4) {
            return;
        }


        if (xhr.status !== 200) {

            updateResponse(
                "Spotify desconectado"
            );

            return;
        }


        try {

            var data =
                JSON.parse(
                    xhr.responseText
                );


            /* =========================
               ESTADO
            ========================= */

            isPlaying =
                data.playing;

            updatePlayButton();


            /* =========================
               SIN CANCIÓN
            ========================= */

            if (!data.track) {

                document.getElementById(
                    "song"
                ).innerHTML =
                    "Sin reproducción";


                document.getElementById(
                    "artist"
                ).innerHTML =
                    "Spotify";


                currentProgress = 0;
                currentDuration = 0;


                document.querySelector(
                    ".progress-bar"
                ).style.width =
                    "0%";


                document.querySelector(
                    ".time span:first-child"
                ).innerHTML =
                    "0:00";


                document.querySelector(
                    ".time span:last-child"
                ).innerHTML =
                    "0:00";


                return;

            }


            /* =========================
               INFORMACIÓN DE CANCIÓN
            ========================= */

            document.getElementById(
                "song"
            ).innerHTML =
                data.track.name;


            document.getElementById(
                "artist"
            ).innerHTML =
                data.track.artist;


            /* =========================
               PORTADA
            ========================= */

            if (data.track.image) {

                var album =
                    document.querySelector(
                        ".album-placeholder"
                    );

                album.style.backgroundImage =
                    "url('" +
                    data.track.image +
                    "')";

                album.style.backgroundSize =
                    "cover";

                album.style.backgroundPosition =
                    "center";

                album.innerHTML = "";

            }


            /* =========================
               PROGRESO
            ========================= */

            currentProgress =
                data.progress_ms || 0;


            currentDuration =
                data.duration_ms || 0;


            updateProgress();


            updateResponse(
                "Spotify conectado"
            );


        } catch (error) {

            updateResponse(
                "Error leyendo Spotify"
            );

        }

    };


    xhr.send(null);

}


/* =========================
   COMANDOS
========================= */

function sendCommand(command) {

    var xhr = new XMLHttpRequest();

    xhr.open(
        "GET",
        "/command/" + command,
        true
    );

    xhr.onreadystatechange = function() {

        if (xhr.readyState !== 4) {
            return;
        }


        if (xhr.status === 200) {

            updateResponse(
                xhr.responseText
            );


            if (command === "play") {

                isPlaying = true;

                updatePlayButton();

            }


            if (command === "pause") {

                isPlaying = false;

                updatePlayButton();

            }


            if (
                command === "next" ||
                command === "previous"
            ) {

                setTimeout(
                    getCurrentTrack,
                    500
                );

            }

        } else {

            updateResponse(
                "ERROR: " + xhr.status
            );

        }

    };


    xhr.send(null);

}


/* =========================
   TOGGLE PLAY
========================= */

function togglePlay() {

    if (isPlaying) {

        sendCommand("pause");

    } else {

        sendCommand("play");

    }

}


/* =========================
   INICIO
========================= */

getCurrentTrack();


setInterval(
    getCurrentTrack,
    3000
);


/* =========================
   PROGRESO LOCAL
========================= */

setInterval(
    function() {

        if (!isPlaying) {
            return;
        }

        if (!currentDuration) {
            return;
        }

        currentProgress += 250;


        if (
            currentProgress >
            currentDuration
        ) {

            currentProgress =
                currentDuration;

        }


        updateProgress();

    },
    250
);