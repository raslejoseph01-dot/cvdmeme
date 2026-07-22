const socket = io();

let monPseudo = "";
let monCode = "";

function rejoindreSalle() {
    const pseudo = document.getElementById("pseudo").value.trim();
    const code = document.getElementById("codeSalle").value.trim().toUpperCase();

    if (pseudo === "") {
        document.getElementById("message").textContent = "Merci d'entrer un pseudo !";
        return;
    }

    if (code === "") {
        document.getElementById("message").textContent = "Merci d'entrer un code de salle !";
        return;
    }

    monPseudo = pseudo;
    monCode = code;

    socket.emit("rejoindreSalle", { pseudo: pseudo, code: code });
}

function afficherJoueurs(listeJoueurs) {
    const liste = document.getElementById("listeJoueurs");
    liste.innerHTML = "";

    for (const joueur of listeJoueurs) {
        const item = document.createElement("li");
        item.textContent = joueur;
        liste.appendChild(item);
    }
}

function demarrerPartie() {
    socket.emit("demarrerPartie", monCode);
}

function envoyerPhrase() {
    const phrase = document.getElementById("phrase").value.trim();

    if (phrase === "") {
        document.getElementById("messageEcriture").textContent = "Merci d'écrire une phrase !";
        return;
    }

    socket.emit("envoyerPhrase", { code: monCode, texte: phrase });
    document.getElementById("phrase").value = "";
    document.getElementById("messageEcriture").textContent = "Phrase envoyée, en attente des autres...";
}

socket.on("miseAJourSalle", (donnees) => {
    document.getElementById("ecranAccueil").style.display = "none";
    document.getElementById("ecranSalle").style.display = "block";
    document.getElementById("affichageCodeSalle").textContent = donnees.code;
    afficherJoueurs(donnees.joueurs);
});

socket.on("partieDemarree", () => {
    document.getElementById("ecranSalle").style.display = "none";
    document.getElementById("ecranEcriture").style.display = "block";
});

socket.on("statutEcriture", (donnees) => {
    document.getElementById("statutEcriture").textContent =
        donnees.nombrePhrases + " sur " + donnees.nombreJoueurs + " joueurs ont écrit leur phrase.";
});