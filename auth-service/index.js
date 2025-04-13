const express = require("express")
const app = express()
const PORT = process.env.PORT_ONE || 4002
const mongoose = require("mongoose")
const Utilisateur = require("./Utilisateur")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")

mongoose.set("strictQuery", true)
const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/auth-service?directConnection=true", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout après 5 secondes au lieu de 10
    })
    console.log("Auth-Service DB Connected")
  } catch (err) {
    console.error("Database connection error:", err)
    process.exit(1) // Quitte l'application en cas d'échec de connexion
  }
}
connectDB()

app.use(express.json())

// la méthode register permettera de créer et d'ajouter un nouvel utilisateur à la base de données
app.post("/auth/register", async (req, res) => {
  try {
    const { nom, email, mot_passe } = req.body

    // Validation des données d'entrée
    if (!nom || !email || !mot_passe) {
      return res.status(400).json({ message: "Tous les champs sont requis" })
    }

    // On vérifie si le nouvel utilisateur est déjà inscrit avec la même adresse email
    const userExists = await Utilisateur.findOne({ email })
    if (userExists) {
      return res.status(409).json({ message: "Cet utilisateur existe déjà" })
    }

    // Hashage du mot de passe
    const hashedPassword = await bcrypt.hash(mot_passe, 10)

    // Création du nouvel utilisateur
    const newUtilisateur = new Utilisateur({
      nom,
      email,
      mot_passe: hashedPassword,
    })

    // Sauvegarde de l'utilisateur
    const savedUser = await newUtilisateur.save()

    // Retourne l'utilisateur créé sans le mot de passe
    const userResponse = {
      _id: savedUser._id,
      nom: savedUser.nom,
      email: savedUser.email,
    }

    return res.status(201).json(userResponse)
  } catch (error) {
    console.error("Erreur d'enregistrement:", error)
    return res.status(500).json({
      message: "Erreur lors de l'enregistrement de l'utilisateur",
      error: error.message,
    })
  }
})

// la méthode login permettera de retourner un token après vérification de l'email et du mot de passe
app.post("/auth/login", async (req, res) => {
  try {
    const { email, mot_passe } = req.body

    // Validation des données d'entrée
    if (!email || !mot_passe) {
      return res.status(400).json({ message: "Email et mot de passe requis" })
    }

    // Recherche de l'utilisateur
    const utilisateur = await Utilisateur.findOne({ email })
    if (!utilisateur) {
      return res.status(404).json({ message: "Utilisateur introuvable" })
    }

    // Vérification du mot de passe
    const passwordMatch = await bcrypt.compare(mot_passe, utilisateur.mot_passe)
    if (!passwordMatch) {
      return res.status(401).json({ message: "Mot de passe incorrect" })
    }

    // Création du payload pour le token
    const payload = {
      userId: utilisateur._id,
      email: utilisateur.email,
      nom: utilisateur.nom,
    }

    // Génération du token
    jwt.sign(payload, "secret", { expiresIn: "24h" }, (err, token) => {
      if (err) {
        console.error("Erreur de génération du token:", err)
        return res.status(500).json({ message: "Erreur lors de la génération du token" })
      }
      return res.json({
        message: "Connexion réussie",
        token,
        user: {
          id: utilisateur._id,
          nom: utilisateur.nom,
          email: utilisateur.email,
        },
      })
    })
  } catch (error) {
    console.error("Erreur de connexion:", error)
    return res.status(500).json({
      message: "Erreur lors de la connexion",
      error: error.message,
    })
  }
})

app.listen(PORT, () => {
  console.log(`Auth-Service at ${PORT}`)
})
