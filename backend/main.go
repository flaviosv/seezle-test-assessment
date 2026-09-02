package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"

	docs "github.com/flaviosv/seezle-test-assessment/docs"
	"github.com/flaviosv/seezle-test-assessment/internal/middleware"
	"github.com/flaviosv/seezle-test-assessment/internal/operations"
	"github.com/flaviosv/seezle-test-assessment/internal/routes"
	"github.com/flaviosv/seezle-test-assessment/internal/shared/config"
	"github.com/flaviosv/seezle-test-assessment/internal/shared/logger"
)

const (
	requestTimeout      = 20 * time.Second
	shutdownGracePeriod = 15 * time.Second
	readHeaderTimeout   = 5 * time.Second
	readTimeout         = 20 * time.Second
	writeTimeout        = 25 * time.Second
	idleTimeout         = 60 * time.Second
)

//	@title			Seezle Test Assessment API
//	@version		1.0
//	@description	Calculator MVP API — a single stateless endpoint that parses and evaluates a left-to-right arithmetic expression.
//	@BasePath		/v1
func main() {
	cfg := config.Load()
	log := logger.Initialize(cfg.LogLevel)
	gin.SetMode(cfg.GinMode)

	app := gin.New()
	app.Use(gin.Recovery())
	app.Use(middleware.CORS())
	app.Use(middleware.RequestTimeout(requestTimeout))
	app.Use(middleware.RequestContext(log))

	docs.SwaggerInfo.BasePath = "/v1"

	v1 := app.Group("/v1")
	v1.Use(middleware.SecurityHeaders())

	uc := operations.NewUseCase()
	routes.Routes(app, v1, uc)

	srv := &http.Server{
		Addr:              ":" + cfg.APIPort,
		Handler:           app,
		ReadHeaderTimeout: readHeaderTimeout,
		ReadTimeout:       readTimeout,
		WriteTimeout:      writeTimeout,
		IdleTimeout:       idleTimeout,
	}

	log.Info("starting server", "app_env", cfg.AppEnv, "port", cfg.APIPort)

	if err := run(srv, log); err != nil {
		log.Error("server error", "error", err)
		os.Exit(1)
	}
}

// run starts srv and blocks until a shutdown signal arrives, then drains
// in-flight requests within shutdownGracePeriod.
func run(srv *http.Server, log *slog.Logger) error {
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, os.Interrupt, syscall.SIGTERM)

	serveErrCh := make(chan error, 1)
	go func() {
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			serveErrCh <- err
			return
		}
		serveErrCh <- nil
	}()

	select {
	case err := <-serveErrCh:
		return err
	case sig := <-sigCh:
		log.Info("shutdown signal received", "signal", sig.String())
	}

	ctx, cancel := context.WithTimeout(context.Background(), shutdownGracePeriod)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		return fmt.Errorf("graceful shutdown: %w", err)
	}
	log.Info("shutdown complete")
	return nil
}
