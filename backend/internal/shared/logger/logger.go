package logger

import (
	"log/slog"
	"os"
)

// Initialize builds a structured slog logger with a level driven by
// logLevel ("debug"|"info"|"warn"|"error"), defaulting to info for any
// other value.
func Initialize(logLevel string) *slog.Logger {
	handler := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: parseLevel(logLevel)})
	log := slog.New(handler)
	slog.SetDefault(log)
	return log
}

func parseLevel(logLevel string) slog.Level {
	switch logLevel {
	case "debug":
		return slog.LevelDebug
	case "warn":
		return slog.LevelWarn
	case "error":
		return slog.LevelError
	default:
		return slog.LevelInfo
	}
}
