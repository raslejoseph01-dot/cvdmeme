const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const serveur = http.createServer(app);
const io = new Server(serveur);

app.use(express.static("."));

let joueurs = [];
let codeSalle = null;

function genererCodeSalle() {
    const lettres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let code = "";

    for (let i = 0; i < 4; i++) {
        const indexAleatoire = Math.floor(Math.random() * lettres.length);
        code += lettres[indexAleatoire];
    }

    return code;
}

io.on("connection", (socket) => {
    console.log("Un joueur s'est connecté !");

    socket.on("nouveauJoueur", (pseudo) => {
        joueurs.push(pseudo);
        io.emit("listeJoueursMiseAJour", joueurs);
    });

    socket.on("creerSalle", () => {
        codeSalle = genererCodeSalle();
        io.emit("salleCreee", codeSalle);
    });
});

serveur.listen(3000, () => {
    console.log("Serveur démarré sur http://localhost:3000");
});