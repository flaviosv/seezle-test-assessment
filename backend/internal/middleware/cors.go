package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// CORS allows the frontend (served cross-origin, e.g. :8080) to call this
// API (:8090). Allow-Origin is "*" — safe here because API-06 confirms no
// auth, cookies, or credentials exist anywhere in this service to protect.
func CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "POST, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type")

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
