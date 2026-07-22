const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const serveur = http.createServer(app);
const io = new Server(serveur);

app.use(express.static("."));

const salles = {};

function melangerTableau(tableau) {
    const copie = [...tableau];

    for (let i = copie.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = copie[i];
        copie[i] = copie[j];
        copie[j] = temp;
    }

    return copie;
}

function attribuerPhrases(code) {
    const salle = salles[code];
    const phrasesMelangees = melangerTableau(salle.phrases);

    salle.attributions = {};

    for (let i = 0; i < phrasesMelangees.length; i++) {
        const phraseDecalee = phrasesMelangees[(i + 1) % phrasesMelangees.length];
        salle.attributions[phrasesMelangees[i].pseudo] = phraseDecalee.texte;
    }

    for (const [socketId, socketConnecte] of io.sockets.sockets) {
        if (socketConnecte.data.code === code) {
            const pseudoJoueur = socketConnecte.data.pseudo;
            const phraseAEnvoyer = salle.attributions[pseudoJoueur];
            socketConnecte.emit("phraseAAssocier", phraseAEnvoyer);
        }
    }
}

function lancerReveal(code) {
    const salle = salles[code];
    const listeReveal = [];

    for (const visuel of salle.visuels) {
        const pseudoQuiAChoisi = visuel.pseudo;
        const phraseOriginale = salle.attributions[pseudoQuiAChoisi];

        listeReveal.push({
            phrase: phraseOriginale,
            lien: visuel.lien,
            pseudoAuteur: pseudoQuiAChoisi
        });
    }

    salle.revealListe = listeReveal;
    salle.revealIndex = 0;
    salle.scores = {};

    for (const joueur of salle.joueurs) {
        salle.scores[joueur] = 0;
    }

    envoyerItemReveal(code);
}

function envoyerItemReveal(code) {
    const salle = salles[code];
    const item = salle.revealListe[salle.revealIndex];

    salle.votesActuels = {};

    io.to(code).emit("revealItem", {
        phrase: item.phrase,
        lien: item.lien,
        pseudoAuteur: item.pseudoAuteur,
        index: salle.revealIndex + 1,
        total: salle.revealListe.length
    });
}

function passerAuSuivant(code) {
    const salle = salles[code];

    if (salle.timerReveal) {
        clearTimeout(salle.timerReveal);
        salle.timerReveal = null;
    }

    const item = salle.revealListe[salle.revealIndex];
    let totalEtoiles = 0;

    for (const pseudoVotant in salle.votesActuels) {
        totalEtoiles += salle.votesActuels[pseudoVotant];
    }

    salle.scores[item.pseudoAuteur] += totalEtoiles;

    salle.revealIndex++;

    if (salle.revealIndex < salle.revealListe.length) {
        envoyerItemReveal(code);
    } else {
        const classement = [];
        for (const pseudo in salle.scores) {
            classement.push({ pseudo: pseudo, points: salle.scores[pseudo] });
        }
        classement.sort((a, b) => b.points - a.points);

        io.to(code).emit("classementFinal", classement);
    }
}

io.on("connection", (socket) => {
    console.log("Un joueur s'est connecté !");

    socket.on("rejoindreSalle", (donnees) => {
        const pseudo = donnees.pseudo;
        const code = donnees.code;

        if (!salles[code]) {
            salles[code] = { joueurs: [], phrases: [], visuels: [] };
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

    socket.on("demarrerPartie", (code) => {
        if (salles[code]) {
            salles[code].phrases = [];
            salles[code].visuels = [];
            io.to(code).emit("partieDemarree");
        }
    });

    socket.on("envoyerPhrase", (donnees) => {
        const code = donnees.code;
        const texte = donnees.texte;
        const pseudo = socket.data.pseudo;

        if (salles[code]) {
            salles[code].phrases.push({ pseudo: pseudo, texte: texte });

            io.to(code).emit("statutEcriture", {
                nombrePhrases: salles[code].phrases.length,
                nombreJoueurs: salles[code].joueurs.length
            });

            if (salles[code].phrases.length === salles[code].joueurs.length) {
                attribuerPhrases(code);
            }
        }
    });

    socket.on("envoyerVisuel", (donnees) => {
        const code = donnees.code;
        const lien = donnees.lien;
        const pseudo = socket.data.pseudo;

        if (salles[code]) {
            salles[code].visuels.push({ pseudo: pseudo, lien: lien });

            io.to(code).emit("statutVisuel", {
                nombreVisuels: salles[code].visuels.length,
                nombreJoueurs: salles[code].joueurs.length
            });

            if (salles[code].visuels.length === salles[code].joueurs.length) {
                lancerReveal(code);
            }
        }
    });

    socket.on("voter", (donnees) => {
        const code = donnees.code;
        const etoiles = donnees.etoiles;
        const pseudo = socket.data.pseudo;
        const salle = salles[code];

        if (!salle) {
            return;
        }

        const item = salle.revealListe[salle.revealIndex];

        if (pseudo === item.pseudoAuteur) {
            return;
        }

        salle.votesActuels[pseudo] = etoiles;

        const nombreVotants = salle.joueurs.length - 1;
        const nombreVotes = Object.keys(salle.votesActuels).length;

        io.to(code).emit("statutVote", {
            nombreVotes: nombreVotes,
            nombreVotants: nombreVotants
        });

        if (nombreVotes >= nombreVotants) {
            if (!salle.timerReveal) {
                salle.timerReveal = setTimeout(() => {
                    passerAuSuivant(code);
                }, 5000);
            }
        }
    });

    socket.on("forcerSuite", (code) => {
        if (salles[code] && salles[code].revealListe) {
            passerAuSuivant(code);
        }
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