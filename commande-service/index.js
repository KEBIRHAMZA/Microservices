const express = require("express")
const app = express()
const PORT = process.env.PORT_ONE || 4001
const mongoose = require("mongoose")
const Commande = require("./Commande")
const axios = require("axios")
const isAuthenticated = require("./isAuthenticated")

// Middleware pour parser le JSON
app.use(express.json())

// Connexion à MongoDB avec gestion d'erreur améliorée
mongoose.set("strictQuery", true)
const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/commande-service?directConnection=true", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout après 5 secondes au lieu de 10
    })
    console.log("Commande-Service DB Connected")
  } catch (err) {
    console.error("Database connection error:", err)
    process.exit(1) // Quitte l'application en cas d'échec de connexion
  }
}
connectDB()

// Calcul du prix total d'une commande en passant en paramètre un tableau des produits
function calculerPrixTotal(produits) {
  if (!Array.isArray(produits)) {
    throw new Error("Le paramètre produits doit être un tableau")
  }

  return produits.reduce((total, produit) => {
    // Vérification que le produit a un prix valide
    if (!produit || typeof produit.prix !== "number") {
      throw new Error(`Prix invalide pour le produit: ${JSON.stringify(produit)}`)
    }
    return total + produit.prix
  }, 0)
}

// Cette fonction envoie une requête http au service produit pour récupérer
// le tableau des produits qu'on désire commander (en se basant sur leurs ids)
async function recupererProduits(ids) {
  try {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error("IDs de produits invalides")
    }

    const URL = "http://localhost:4000/produit/acheter"
    const response = await axios.post(URL, { ids }, { headers: { "Content-Type": "application/json" } })

    if (!response.data || !Array.isArray(response.data)) {
      throw new Error("Réponse invalide du service produit")
    }

    // Calcul du prix total de la commande
    return {
      produits: response.data,
      prixTotal: calculerPrixTotal(response.data),
    }
  } catch (error) {
    // Amélioration de la gestion d'erreur
    if (error.response) {
      // Le serveur a répondu avec un code d'erreur
      throw new Error(
        `Erreur du service produit: ${error.response.status} - ${error.response.data.message || "Erreur inconnue"}`,
      )
    } else if (error.request) {
      // La requête a été faite mais pas de réponse
      throw new Error("Le service produit ne répond pas")
    } else {
      // Erreur lors de la configuration de la requête
      throw error
    }
  }
}

// Endpoint pour ajouter une commande
app.post("/commande/ajouter", isAuthenticated, async (req, res) => {
  try {
    const { ids } = req.body

    // Validation des données d'entrée
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Liste de produits invalide" })
    }

    // Récupération des produits et calcul du prix total
    const { prixTotal } = await recupererProduits(ids)

    // Création de la commande
    const newCommande = new Commande({
      produits: ids,
      email_utilisateur: req.user.email,
      prix_total: prixTotal,
    })

    // Sauvegarde de la commande
    const commandeSauvegardee = await newCommande.save()
    return res.status(201).json(commandeSauvegardee)
  } catch (error) {
    console.error("Erreur lors de la création de la commande:", error)
    return res.status(500).json({
      message: "Erreur lors de la création de la commande",
      error: error.message,
    })
  }
})

// Endpoint pour récupérer les commandes d'un utilisateur
app.get("/commandes", isAuthenticated, async (req, res) => {
  try {
    const commandes = await Commande.find({ email_utilisateur: req.user.email })
    return res.json(commandes)
  } catch (error) {
    console.error("Erreur lors de la récupération des commandes:", error)
    return res.status(500).json({
      message: "Erreur lors de la récupération des commandes",
      error: error.message,
    })
  }
})

app.listen(PORT, () => {
  console.log(`Commande-Service at ${PORT}`)
})
