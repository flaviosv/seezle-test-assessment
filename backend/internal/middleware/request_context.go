package middleware

import (
	"log/slog"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const (
	RequestIDKey = "request_id"
	LoggerKey    = "logger"
)

// RequestContext attaches a request ID and a scoped logger to the Gin
// context so every log line for a request (including a failed calculation)
// is traceable.
func RequestContext(base *slog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		requestID := uuid.NewString()
		c.Set(RequestIDKey, requestID)
		c.Set(LoggerKey, base.With("request_id", requestID))
		c.Next()
	}
}
