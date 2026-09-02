package middleware

import "github.com/gin-gonic/gin"

// SecurityHeaders sets baseline hardening headers (MIME-sniffing
// prevention, deny framing, and a strict default-src CSP) on every
// response it wraps.
func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("Content-Security-Policy", "default-src 'self'")
		c.Next()
	}
}
