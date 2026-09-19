from flask import Flask, send_from_directory, redirect, request
from dotenv import load_dotenv
import requests
import os
import secrets
import urllib.parse


# =========================
# CONFIGURACIÓN
# =========================

load_dotenv()

app = Flask(__name__)

CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
REDIRECT_URI = os.getenv("SPOTIFY_REDIRECT_URI")

SPOTIFY_AUTHORIZE_URL = "https://accounts.spotify.com/authorize"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
SPOTIFY_API_URL = "https://api.spotify.com/v1"

SPOTIFY_SCOPES = (
    "user-read-playback-state "
    "user-modify-playback-state "
    "user-read-currently-playing"
)

# =========================
# ESTADO DE AUTENTICACIÓN
# =========================

oauth_state = None
access_token = None
refresh_token = None


# =========================
# INTERFAZ WEB
# =========================

@app.route("/")
def index():
    return send_from_directory("web", "index.html")


@app.route("/style.css")
def style():
    return send_from_directory("web", "style.css")


@app.route("/app.js")
def javascript():
    return send_from_directory("web", "app.js")


# =========================
# SPOTIFY — LOGIN
# =========================

@app.route("/login")
def login():

    global oauth_state

    oauth_state = secrets.token_urlsafe(32)

    params = {
        "client_id": CLIENT_ID,
        "response_type": "code",
        "redirect_uri": REDIRECT_URI,
        "scope": SPOTIFY_SCOPES,
        "state": oauth_state
    }

    authorization_url = (
        SPOTIFY_AUTHORIZE_URL
        + "?"
        + urllib.parse.urlencode(params)
    )

    return redirect(authorization_url)


# =========================
# SPOTIFY — CALLBACK
# =========================

@app.route("/callback")
def callback():

    global access_token
    global refresh_token

    returned_state = request.args.get("state")
    code = request.args.get("code")
    error = request.args.get("error")

    if error:
        return (
            f"Spotify rechazó la autorización: {error}",
            400
        )

    if returned_state != oauth_state:
        return (
            "ERROR: estado OAuth inválido.",
            400
        )

    if not code:
        return (
            "ERROR: Spotify no devolvió un código.",
            400
        )

    response = requests.post(
        SPOTIFY_TOKEN_URL,
        data={
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": REDIRECT_URI
        },
        auth=(CLIENT_ID, CLIENT_SECRET)
    )

    if response.status_code != 200:
        return (
            "ERROR obteniendo token:<br><br>"
            + response.text
        ), 400

    token_data = response.json()

    access_token = token_data.get("access_token")
    refresh_token = token_data.get("refresh_token")

    print("Spotify conectado correctamente.")
    print("Access token obtenido.")
    print("Refresh token obtenido.")

    return """
    <h1>Montypod conectado</h1>
    <p>Spotify autorizó correctamente a M-TERM.</p>
    <p>Ya podemos controlar tu reproducción.</p>
    """


# =========================
# SPOTIFY — RENOVAR TOKEN
# =========================

def refresh_access_token():

    global access_token

    if not refresh_token:
        return False

    print("Renovando access token...")

    response = requests.post(
        SPOTIFY_TOKEN_URL,
        data={
            "grant_type": "refresh_token",
            "refresh_token": refresh_token
        },
        auth=(CLIENT_ID, CLIENT_SECRET)
    )

    if response.status_code != 200:

        print(
            "Error renovando token:",
            response.text
        )

        return False

    token_data = response.json()

    access_token = token_data.get(
        "access_token"
    )

    print("Access token renovado.")

    return True


# =========================
# SPOTIFY — PETICIÓN API
# =========================

def spotify_request(
    method,
    endpoint,
    **kwargs
):

    global access_token

    if not access_token:
        return None

    headers = kwargs.pop(
        "headers",
        {}
    )

    headers["Authorization"] = (
        f"Bearer {access_token}"
    )

    response = requests.request(
        method,
        f"{SPOTIFY_API_URL}{endpoint}",
        headers=headers,
        **kwargs
    )

    # Access token expirado
    if response.status_code == 401:

        print(
            "Access token expirado."
        )

        if refresh_access_token():

            headers["Authorization"] = (
                f"Bearer {access_token}"
            )

            response = requests.request(
                method,
                f"{SPOTIFY_API_URL}{endpoint}",
                headers=headers,
                **kwargs
            )

    return response


# =========================
# SPOTIFY — ESTADO ACTUAL
# =========================

@app.route("/spotify/current")
def spotify_current():

    if not access_token:

        return {
            "connected": False,
            "message": "Spotify no está conectado."
        }, 401

    response = spotify_request(
        "GET",
        "/me/player"
    )

    if response is None:

        return {
            "connected": False,
            "message": "Spotify no está conectado."
        }, 401

    # No hay reproducción activa
    if response.status_code == 204:

        return {
            "connected": True,
            "playing": False,
            "track": None
        }

    if response.status_code != 200:

        return {
            "connected": False,
            "error": response.text
        }, response.status_code

    data = response.json()

    item = data.get("item")

    if not item:

        return {
            "connected": True,
            "playing": data.get(
                "is_playing",
                False
            ),
            "track": None
        }

    # =========================
    # ARTISTAS
    # =========================

    artists = item.get(
        "artists",
        []
    )

    artist_names = [
        artist.get(
            "name",
            ""
        )
        for artist in artists
    ]

    # =========================
    # PORTADA
    # =========================

    images = item.get(
        "album",
        {}
    ).get(
        "images",
        []
    )

    album_image = None

    if images:

        album_image = images[0].get(
            "url"
        )

    # =========================
    # RESPUESTA M-TERM
    # =========================

    return {

        "connected": True,

        "playing": data.get(
            "is_playing",
            False
        ),

        "progress_ms": data.get(
            "progress_ms",
            0
        ),

        "duration_ms": item.get(
            "duration_ms",
            0
        ),

        "track": {

            "name": item.get(
                "name",
                "Sin título"
            ),

            "artist": ", ".join(
                artist_names
            ),

            "album": item.get(
                "album",
                {}
            ).get(
                "name",
                ""
            ),

            "image": album_image

        }

    }


# =========================
# COMANDOS
# =========================

@app.route("/command/<command>")
def command(command):

    print(
        f"Comando recibido: {command}"
    )

    if command == "ping":
        return "PONG"

    if not access_token:

        return (
            "Spotify no está conectado.",
            401
        )

    # =========================
    # PLAY
    # =========================

    if command == "play":

        response = spotify_request(
            "PUT",
            "/me/player/play"
        )

        if response is not None and response.status_code in (200, 204):

            return "PLAY ejecutado"

        if response is None:

            return (
                "Spotify no está conectado.",
                401
            )

        return (
            f"Error PLAY: {response.text}",
            response.status_code
        )

    # =========================
    # PAUSE
    # =========================

    if command == "pause":

        response = spotify_request(
            "PUT",
            "/me/player/pause"
        )

        if response is not None and response.status_code in (200, 204):

            return "PAUSE ejecutado"

        if response is None:

            return (
                "Spotify no está conectado.",
                401
            )

        return (
            f"Error PAUSE: {response.text}",
            response.status_code
        )

    # =========================
    # NEXT
    # =========================

    if command == "next":

        response = spotify_request(
            "POST",
            "/me/player/next"
        )

        if response is not None and response.status_code in (200, 204):

            return "NEXT ejecutado"

        if response is None:

            return (
                "Spotify no está conectado.",
                401
            )

        return (
            f"Error NEXT: {response.text}",
            response.status_code
        )

    # =========================
    # PREVIOUS
    # =========================

    if command == "previous":

        response = spotify_request(
            "POST",
            "/me/player/previous"
        )

        if response is not None and response.status_code in (200, 204):

            return "PREVIOUS ejecutado"

        if response is None:

            return (
                "Spotify no está conectado.",
                401
            )

        return (
            f"Error PREVIOUS: {response.text}",
            response.status_code
        )

    # =========================
    # DESCONOCIDO
    # =========================

    return (
        f"Comando desconocido: {command}",
        400
    )


# =========================
# SERVIDOR
# =========================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=8000
    )