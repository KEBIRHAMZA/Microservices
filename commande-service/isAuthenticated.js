const jwt = require("jsonwebtoken")

module.exports = async function isAuthenticated(req, res, next) {
  try {
    // Check if Authorization header exists
    const authHeader = req.headers["authorization"]
    if (!authHeader) {
      return res.status(401).json({ message: "Token d'authentification manquant" })
    }

    // Extract token
    const token = authHeader.split(" ")[1]
    if (!token) {
      return res.status(401).json({ message: "Format du token invalide" })
    }

    // Verify token
    jwt.verify(token, "secret", (err, user) => {
      if (err) {
        return res.status(401).json({ message: "Token invalide ou expiré" })
      }

      req.user = user
      next()
    })
  } catch (error) {
    console.error("Erreur d'authentification:", error)
    return res.status(500).json({ message: "Erreur lors de l'authentification" })
  }
}
