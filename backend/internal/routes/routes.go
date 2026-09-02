package routes

import (
	"github.com/gin-gonic/gin"
	redoc "github.com/mvrilo/go-redoc"
	ginredoc "github.com/mvrilo/go-redoc/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	seezledocs "github.com/flaviosv/seezle-test-assessment/docs"
	"github.com/flaviosv/seezle-test-assessment/internal/operations"
	"github.com/flaviosv/seezle-test-assessment/internal/shared/config"
)

// Routes registers the operations slice's route on the v1 group (AD-001:
// never on the bare engine) and the Swagger/ReDoc documentation endpoints on
// the bare engine (mirroring dinherim's wiring) — neither carries any auth
// middleware, since API-06 means there is nothing to gate.
func Routes(app *gin.Engine, v1 *gin.RouterGroup, uc *operations.UseCase, cfg *config.Config) {
	h := operations.NewHandler(uc)
	v1.POST("/calculate", h.Calculate)

	app.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	redocHandler := ginredoc.New(redoc.Redoc{
		Title:       "Seezle Test Assessment API",
		Description: "Calculator MVP API documentation",
		SpecFile:    "swagger.json",
		SpecFS:      &seezledocs.SwaggerJSON,
		SpecPath:    "/docs/openapi.json",
		DocsPath:    "/docs",
	})
	app.GET("/docs", redocHandler)
	app.GET("/docs/openapi.json", redocHandler)
}
