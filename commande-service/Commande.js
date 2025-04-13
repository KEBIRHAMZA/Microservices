const mongoose = require("mongoose")
const Schema = mongoose.Schema

const CommandeSchema = new Schema({
  produits: {
    type: [String],
    required: true,
  },
  email_utilisateur: {
    type: String,
    required: true,
  },
  prix_total: {
    type: Number,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model("commande", CommandeSchema)
