package config

import "os"

// Config holds the minimal env-driven settings this stateless service needs
// to boot — no DB, cache, or auth fields exist here (API-06).
type Config struct {
	APIPort  string
	AppEnv   string
	GinMode  string
	LogLevel string
}

const (
	defaultAPIPort  = "8090"
	defaultAppEnv   = "development"
	defaultGinMode  = "release"
	defaultLogLevel = "info"
)

// Load builds a Config from environment variables, falling back to safe
// defaults for every field (no required-without-default field exists, so
// Load never fails).
func Load() *Config {
	return &Config{
		APIPort:  envOrDefault("API_PORT", defaultAPIPort),
		AppEnv:   envOrDefault("APP_ENV", defaultAppEnv),
		GinMode:  envOrDefault("GIN_MODE", defaultGinMode),
		LogLevel: envOrDefault("LOG_LEVEL", defaultLogLevel),
	}
}

func envOrDefault(key, def string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return def
}
