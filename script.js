const socket = io();

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

socket.on("miseAJourSalle", (donnees) => {
    document.getElementById("ecranAccueil").style.display = "none";
    document.getElementById("ecranSalle").style.display = "block";
    document.getElementById("affichageCodeSalle").textContent = donnees.code;
    afficherJoueurs(donnees.joueurs);
});