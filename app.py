from flask import Flask, send_from_directory

app = Flask(__name__)


@app.route("/")
def index():
    return send_from_directory("web", "index.html")


@app.route("/style.css")
def style():
    return send_from_directory("web", "style.css")


@app.route("/app.js")
def javascript():
    return send_from_directory("web", "app.js")


@app.route("/command/<command>")
def command(command):
    print(f"Comando recibido: {command}")

    if command == "ping":
        return "PONG"

    if command == "play":
        return "PLAY recibido"

    if command == "next":
        return "NEXT recibido"

    if command == "previous":
        return "PREVIOUS recibido"

    return f"Comando desconocido: {command}", 400


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)