package middleware

import (
	"net/http"
	"time"

	"github.com/gin-contrib/timeout"
	"github.com/gin-gonic/gin"
)

// RequestTimeout aborts the request with a 504 if it has not completed
// within d.
func RequestTimeout(d time.Duration) gin.HandlerFunc {
	return timeout.New(
		timeout.WithTimeout(d),
		timeout.WithResponse(func(c *gin.Context) {
			c.JSON(http.StatusGatewayTimeout, gin.H{"error": "request timed out"})
			c.Writer.Flush()
		}),
	)
}
