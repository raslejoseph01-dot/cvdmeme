function ajouterJoueur() {
    const pseudo = document.getElementById("pseudo").value.trim();

    if (pseudo === "") {
        document.getElementById("message").textContent = "Merci d'entrer un pseudo !";
        return;
    }

    socket.emit("nouveauJoueur", pseudo);
    document.getElementById("pseudo").value = "";
    document.getElementById("message").textContent = "";
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

function creerSalle() {
    socket.emit("creerSalle");
}

const socket = io();

socket.on("listeJoueursMiseAJour", (listeJoueurs) => {
    afficherJoueurs(listeJoueurs);
});

socket.on("salleCreee", (code) => {
    document.getElementById("codeSalle").textContent = "Code de la salle : " + code;
});