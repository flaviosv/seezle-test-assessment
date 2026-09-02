package main

func main() {
	// TODO(T7): load config via config.Load()
	// TODO(T7): initialize logger via logger.Initialize(cfg.LogLevel)
	// TODO(T7): build gin.New() engine with middleware stack (T2): Recovery, SecurityHeaders, CORS, RequestTimeout, RequestContext
	// TODO(T7): register routes via routes.Routes(app, app.Group("/v1"), uc, cfg) (T3/T4/T5/T6)
	// TODO(T7): start http.Server on cfg.APIPort with graceful shutdown on SIGTERM/SIGINT
}
