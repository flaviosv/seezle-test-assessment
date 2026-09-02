package routes

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/flaviosv/seezle-test-assessment/internal/middleware"
	"github.com/flaviosv/seezle-test-assessment/internal/operations"
	"github.com/flaviosv/seezle-test-assessment/internal/shared/logger"
)

// newTestRouter builds a real Gin engine with the full middleware stack and
// route registration, mirroring main.go's wiring (AD-001: routes registered
// via routes.Routes, never assembled ad hoc for the test).
func newTestRouter(t *testing.T) *gin.Engine {
	t.Helper()
	gin.SetMode(gin.TestMode)

	log := logger.Initialize("error")

	app := gin.New()
	app.Use(gin.Recovery())
	app.Use(middleware.CORS())
	app.Use(middleware.RequestTimeout(20 * time.Second))
	app.Use(middleware.RequestContext(log))

	v1 := app.Group("/v1")
	v1.Use(middleware.SecurityHeaders())

	uc := operations.NewUseCase()
	Routes(app, v1, uc)

	return app
}

func doGet(r *gin.Engine, path string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(http.MethodGet, path, nil)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	return rec
}

// TestSwaggerUIServed covers API-07: GET /swagger/index.html serves the
// interactive Swagger UI.
func TestSwaggerUIServed(t *testing.T) {
	r := newTestRouter(t)
	rec := doGet(r, "/swagger/index.html")
	if rec.Code != http.StatusOK {
		t.Fatalf("GET /swagger/index.html status = %d, want 200 (body: %s)", rec.Code, rec.Body.String())
	}
}

// TestReDocServed covers API-07: GET /docs serves the ReDoc documentation
// page.
func TestReDocServed(t *testing.T) {
	r := newTestRouter(t)
	rec := doGet(r, "/docs")
	if rec.Code != http.StatusOK {
		t.Fatalf("GET /docs status = %d, want 200 (body: %s)", rec.Code, rec.Body.String())
	}
}

// TestOpenAPISpecServed covers API-07: GET /docs/openapi.json serves the
// embedded swagger.json as valid JSON.
func TestOpenAPISpecServed(t *testing.T) {
	r := newTestRouter(t)
	rec := doGet(r, "/docs/openapi.json")
	if rec.Code != http.StatusOK {
		t.Fatalf("GET /docs/openapi.json status = %d, want 200 (body: %s)", rec.Code, rec.Body.String())
	}

	var decoded map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &decoded); err != nil {
		t.Fatalf("GET /docs/openapi.json body is not valid JSON: %v", err)
	}
}

// TestSwaggerSpecValidStructure covers API-07: the served spec lists
// POST /v1/calculate among its documented paths.
func TestSwaggerSpecValidStructure(t *testing.T) {
	r := newTestRouter(t)
	rec := doGet(r, "/docs/openapi.json")

	var decoded map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &decoded); err != nil {
		t.Fatalf("spec body is not valid JSON: %v", err)
	}

	for _, key := range []string{"swagger", "info", "paths"} {
		if _, ok := decoded[key]; !ok {
			t.Fatalf("spec missing top-level key %q: %v", key, decoded)
		}
	}

	paths, ok := decoded["paths"].(map[string]any)
	if !ok {
		t.Fatalf("spec's paths field is not an object: %v", decoded["paths"])
	}
	if _, ok := paths["/v1/calculate"]; !ok {
		t.Fatalf("spec does not list /v1/calculate among its paths: %v", paths)
	}
}

// TestCalculateRouteRegistered is a sanity check that POST /v1/calculate is
// actually registered (not a 404) once Routes has run.
func TestCalculateRouteRegistered(t *testing.T) {
	r := newTestRouter(t)

	req := httptest.NewRequest(http.MethodPost, "/v1/calculate", bytes.NewReader([]byte(`{"operation":"2+2"}`)))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	if rec.Code == http.StatusNotFound {
		t.Fatalf("POST /v1/calculate returned 404 — route not registered")
	}
	if rec.Code != http.StatusOK {
		t.Fatalf("POST /v1/calculate status = %d, want 200 (body: %s)", rec.Code, rec.Body.String())
	}
}

// TestDocumentationRoutesRequireNoAuth covers API-06/API-07: none of the
// documentation or calculate routes are gated by any auth middleware — a
// request with no credentials of any kind still succeeds.
func TestDocumentationRoutesRequireNoAuth(t *testing.T) {
	r := newTestRouter(t)

	getPaths := []string{"/swagger/index.html", "/docs", "/docs/openapi.json"}
	for _, path := range getPaths {
		t.Run("GET "+path, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, path, nil)
			// Deliberately no Authorization header, no cookies.
			rec := httptest.NewRecorder()
			r.ServeHTTP(rec, req)
			if rec.Code == http.StatusUnauthorized || rec.Code == http.StatusForbidden {
				t.Fatalf("GET %s status = %d, expected no auth to be required", path, rec.Code)
			}
		})
	}

	t.Run("POST /v1/calculate", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/v1/calculate", bytes.NewReader([]byte(`{"operation":"2+2"}`)))
		req.Header.Set("Content-Type", "application/json")
		rec := httptest.NewRecorder()
		r.ServeHTTP(rec, req)
		if rec.Code != http.StatusOK {
			t.Fatalf("POST /v1/calculate status = %d, want 200 for a credential-free request", rec.Code)
		}
	})
}
