const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const serveur = http.createServer(app);
const io = new Server(serveur);

app.use(express.static("."));

const salles = {};

io.on("connection", (socket) => {
    console.log("Un joueur s'est connecté !");

    socket.on("rejoindreSalle", (donnees) => {
        const pseudo = donnees.pseudo;
        const code = donnees.code;

        if (!salles[code]) {
            salles[code] = { joueurs: [] };
        }

        socket.join(code);
        socket.data.pseudo = pseudo;
        socket.data.code = code;

        salles[code].joueurs.push(pseudo);

        io.to(code).emit("miseAJourSalle", {
            code: code,
            joueurs: salles[code].joueurs
        });
    });

    socket.on("disconnect", () => {
        const code = socket.data.code;
        const pseudo = socket.data.pseudo;

        if (code && salles[code]) {
            salles[code].joueurs = salles[code].joueurs.filter((j) => j !== pseudo);

            io.to(code).emit("miseAJourSalle", {
                code: code,
                joueurs: salles[code].joueurs
            });
        }
    });
});

const PORT = process.env.PORT || 3000;
serveur.listen(PORT, () => {
    console.log("Serveur démarré sur le port " + PORT);
});