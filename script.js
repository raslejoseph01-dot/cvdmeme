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

socket.on("phraseAAssocier", (phrase) => {
    document.getElementById("ecranEcriture").style.display = "none";
    document.getElementById("ecranPhraseRecue").style.display = "block";
    document.getElementById("affichagePhraseRecue").textContent = phrase;
});

document.addEventListener("DOMContentLoaded", () => {
    const champLien = document.getElementById("lienImage");
    if (champLien) {
        champLien.addEventListener("input", () => {
            afficherApercu(champLien.value.trim());
        });
    }
});

function afficherApercu(lien) {
    const apercu = document.getElementById("apercuVisuel");
    apercu.innerHTML = "";

    if (lien === "") {
        return;
    }

    const image = document.createElement("img");
    image.src = lien;
    image.style.maxWidth = "300px";
    apercu.appendChild(image);
}

function validerVisuel() {
    const lien = document.getElementById("lienImage").value.trim();

    if (lien === "") {
        document.getElementById("messageVisuel").textContent = "Merci de coller un lien !";
        return;
    }

    socket.emit("envoyerVisuel", { code: monCode, lien: lien });
    document.getElementById("messageVisuel").textContent = "Visuel envoyé, en attente des autres...";
}

socket.on("statutVisuel", (donnees) => {
    document.getElementById("messageVisuel").textContent =
        donnees.nombreVisuels + " sur " + donnees.nombreJoueurs + " joueurs ont choisi leur visuel.";
});

let pseudoAuteurActuel = "";
let aDejaVote = false;

socket.on("revealItem", (item) => {
    document.getElementById("ecranPhraseRecue").style.display = "none";
    document.getElementById("ecranReveal").style.display = "block";
    document.getElementById("ecranClassement").style.display = "none";

    document.getElementById("revealPhrase").textContent = item.phrase;
    pseudoAuteurActuel = item.pseudoAuteur;
    aDejaVote = false;
    document.getElementById("messageVote").textContent = "";

    const zoneVisuel = document.getElementById("revealVisuel");
    zoneVisuel.innerHTML = "";
    const image = document.createElement("img");
    image.src = item.lien;
    image.style.maxWidth = "300px";
    zoneVisuel.appendChild(image);

    if (monPseudo === pseudoAuteurActuel) {
        document.getElementById("zoneVote").style.display = "none";
        document.getElementById("messageVote").textContent = "C'est ton visuel, tu ne peux pas voter dessus !";
    } else {
        document.getElementById("zoneVote").style.display = "block";
    }

    document.getElementById("revealCompteur").textContent =
        item.index + " / " + item.total;
});

function voter(etoiles) {
    if (aDejaVote) {
        return;
    }

    aDejaVote = true;
    socket.emit("voter", { code: monCode, etoiles: etoiles });
    document.getElementById("messageVote").textContent = "Vote envoyé : " + etoiles + " étoile(s) !";
}

function forcerSuite() {
    socket.emit("forcerSuite", monCode);
}

socket.on("classementFinal", (classement) => {
    document.getElementById("ecranReveal").style.display = "none";
    document.getElementById("ecranClassement").style.display = "block";

    const liste = document.getElementById("listeClassement");
    liste.innerHTML = "";

    for (const joueur of classement) {
        const item = document.createElement("li");
        item.textContent = joueur.pseudo + " : " + joueur.points + " pts";
        liste.appendChild(item);
    }
});