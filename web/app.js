function sendCommand(command) {

    var xhr = new XMLHttpRequest();

    xhr.open(
        "GET",
        "/command/" + command,
        true
    );

    xhr.onreadystatechange = function() {

        if (xhr.readyState === 4) {

            if (xhr.status === 200) {

                document.getElementById("response").innerHTML =
                    xhr.responseText;

            } else {

                document.getElementById("response").innerHTML =
                    "ERROR: " + xhr.status;

            }

        }

    };

    xhr.send(null);
}