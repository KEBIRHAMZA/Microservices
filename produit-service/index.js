const express = require("express");
const app = express();
const PORT = process.env.PORT_ONE || 4000;
const mongoose = require("mongoose");
const Produit = require("./Produit");

app.use(express.json());
mongoose.set('strictQuery', true);
//Connection à la base de données MongoDB publication-service-db
//(Mongoose créera la base de données s'il ne le trouve pas)
// Connexion à MongoDB avec gestion d'erreur améliorée
mongoose.set('strictQuery', true);
const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/produit-service?directConnection=true", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000 // Timeout après 5 secondes au lieu de 10
      });
    console.log("Produit-Service DB Connected");
  } catch (err) {
    console.error("Database connection error:", err);
    process.exit(1); // Quitte l'application en cas d'échec de connexion
  }
};
connectDB();

//La méthode save() renvoie une Promise.
//Ainsi, dans le bloc then(), nous renverrons une réponse de réussite avec un code 201 de réussite.
//Dans le bloc catch () , nous renverrons une réponse avec l'erreur générée par Mongoose ainsi qu'un code d'erreur 400.

app.post("/produit/ajouter", (req, res, next) => {
    const { nom, description, prix } = req.body;
    const newProduit = new Produit({
        nom,
        description,
        prix
    });
    newProduit.save()
        .then(produit => res.status(201).json(produit))
        .catch(error => res.status(400).json({ error }));
});


app.post("/produit/acheter", (req, res, next) => {
    const { ids } = req.body;
    Produit.find({ _id: { $in: ids } })
        .then(produits => res.status(201).json(produits))
        .catch(error => res.status(400).json({ error }));

});

app.listen(PORT, () => {
    console.log(`Product-Service at ${PORT}`);
});