const mongoose = require("mongoose")
const Schema = mongoose.Schema

const UtilisateurSchema = new Schema({
  nom: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  mot_passe: {
    type: String,
    required: true,
  },
  date_creation: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model("Utilisateur", UtilisateurSchema)
