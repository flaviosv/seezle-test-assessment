package operations

import (
	"bytes"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/flaviosv/seezle-test-assessment/internal/middleware"
)

// newTestHandler builds a Handler wired to a real UseCase (no mocks, per
// spec.md Assumptions' "Meaning of 'integration test'").
func newTestHandler(t *testing.T, uc *UseCase) *Handler {
	t.Helper()
	return NewHandler(uc)
}

// newTestRouter registers Calculate on a real Gin engine so requests go
// through actual routing and JSON binding, not a direct function call.
func newTestRouter(t *testing.T, h *Handler) *gin.Engine {
	t.Helper()
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.CORS())
	r.Use(middleware.RequestTimeout(20 * time.Second))
	r.Use(middleware.RequestContext(slog.New(slog.NewTextHandler(httptest.NewRecorder(), nil))))
	v1 := r.Group("/v1")
	v1.Use(middleware.SecurityHeaders())
	v1.POST("/calculate", h.Calculate)
	return r
}

func doCalculateRequest(t *testing.T, r *gin.Engine, body []byte) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(http.MethodPost, "/v1/calculate", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	return rec
}

// TestHandler_Calculate covers API-01..05: exact response shapes for the
// success path and every documented 400 family.
func TestHandler_Calculate(t *testing.T) {
	tests := []struct {
		name       string
		body       string
		wantStatus int
		wantBody   string
	}{
		{
			name:       "valid request returns 200 with exact success shape",
			body:       `{"operation":"2+2"}`,
			wantStatus: http.StatusOK,
			wantBody:   `{"operation":"2+2","result":4}`,
		},
		{
			name:       "valid request producing a math error returns 400",
			body:       `{"operation":"1/0"}`,
			wantStatus: http.StatusBadRequest,
			wantBody:   `{"error":"operations: division by zero"}`,
		},
		{
			name:       "negative sqrt math error returns 400",
			body:       `{"operation":"-4\\"}`,
			wantStatus: http.StatusBadRequest,
			wantBody:   `{"error":"operations: square root of a negative number"}`,
		},
		{
			name:       "grammar mismatch (trailing binop) returns 400",
			body:       `{"operation":"1+1+"}`,
			wantStatus: http.StatusBadRequest,
			wantBody:   `{"error":"operations: expression does not match the grammar"}`,
		},
		{
			name:       "missing operation field defaults to empty and is rejected",
			body:       `{}`,
			wantStatus: http.StatusBadRequest,
			wantBody:   `{"error":"operations: expression is empty"}`,
		},
		{
			name:       "unrelated field with no operation is rejected as empty",
			body:       `{"other":"value"}`,
			wantStatus: http.StatusBadRequest,
			wantBody:   `{"error":"operations: expression is empty"}`,
		},
		{
			name:       "explicit empty operation string is rejected",
			body:       `{"operation":""}`,
			wantStatus: http.StatusBadRequest,
			wantBody:   `{"error":"operations: expression is empty"}`,
		},
	}

	uc := NewUseCase()
	h := newTestHandler(t, uc)
	r := newTestRouter(t, h)

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			rec := doCalculateRequest(t, r, []byte(tt.body))

			if rec.Code != tt.wantStatus {
				t.Fatalf("status = %d, want %d (body: %s)", rec.Code, tt.wantStatus, rec.Body.String())
			}
			got := rec.Body.String()
			if got != tt.wantBody {
				t.Fatalf("body = %s, want %s", got, tt.wantBody)
			}
		})
	}
}

// TestHandler_Calculate_MalformedJSON covers API-03/04/05: invalid JSON
// syntax must still yield a well-formed 400 error envelope, even though the
// exact bind-error message is not spec-defined (only the status and
// envelope shape are).
func TestHandler_Calculate_MalformedJSON(t *testing.T) {
	uc := NewUseCase()
	h := newTestHandler(t, uc)
	r := newTestRouter(t, h)

	rec := doCalculateRequest(t, r, []byte(`{"operation":`))

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400 (body: %s)", rec.Code, rec.Body.String())
	}

	var decoded map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &decoded); err != nil {
		t.Fatalf("response is not valid JSON: %v", err)
	}
	if len(decoded) != 1 {
		t.Fatalf("response has %d top-level fields, want exactly 1 (error): %v", len(decoded), decoded)
	}
	errMsg, ok := decoded["error"].(string)
	if !ok || errMsg == "" {
		t.Fatalf("response missing non-empty error field: %v", decoded)
	}
}

// TestHandler_Calculate_NonStringOperation covers API-04/05: a non-string
// operation value fails Gin's JSON bind (type mismatch), which must still
// surface as 400.
func TestHandler_Calculate_NonStringOperation(t *testing.T) {
	uc := NewUseCase()
	h := newTestHandler(t, uc)
	r := newTestRouter(t, h)

	rec := doCalculateRequest(t, r, []byte(`{"operation":123}`))

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400 (body: %s)", rec.Code, rec.Body.String())
	}

	var decoded map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &decoded); err != nil {
		t.Fatalf("response is not valid JSON: %v", err)
	}
	errMsg, ok := decoded["error"].(string)
	if !ok || errMsg == "" {
		t.Fatalf("response missing non-empty error field for non-string operation: %v", decoded)
	}
}

// TestHandler_Calculate_ResponseShapeHasNoExtraFields covers API-01/02:
// the success body must contain exactly {operation, result} — nothing more.
func TestHandler_Calculate_ResponseShapeHasNoExtraFields(t *testing.T) {
	uc := NewUseCase()
	h := newTestHandler(t, uc)
	r := newTestRouter(t, h)

	rec := doCalculateRequest(t, r, []byte(`{"operation":"2+2"}`))

	var decoded map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &decoded); err != nil {
		t.Fatalf("response is not valid JSON: %v", err)
	}
	if len(decoded) != 2 {
		t.Fatalf("response has %d top-level fields, want exactly 2 (operation, result): %v", len(decoded), decoded)
	}
	if _, ok := decoded["operation"]; !ok {
		t.Fatalf("response missing operation field: %v", decoded)
	}
	if _, ok := decoded["result"]; !ok {
		t.Fatalf("response missing result field: %v", decoded)
	}
}

// TestHandler_Calculate_ContentType covers request/response transport
// (spec.md Assumptions): both directions are application/json.
func TestHandler_Calculate_ContentType(t *testing.T) {
	uc := NewUseCase()
	h := newTestHandler(t, uc)
	r := newTestRouter(t, h)

	rec := doCalculateRequest(t, r, []byte(`{"operation":"2+2"}`))

	ct := rec.Header().Get("Content-Type")
	if ct != "application/json; charset=utf-8" {
		t.Fatalf("response Content-Type = %q, want application/json; charset=utf-8", ct)
	}
}

// TestHandler_Calculate_NoCredentialsRequired covers API-06: a request with
// no Authorization header (or any credential) must still process normally.
func TestHandler_Calculate_NoCredentialsRequired(t *testing.T) {
	uc := NewUseCase()
	h := newTestHandler(t, uc)
	r := newTestRouter(t, h)

	req := httptest.NewRequest(http.MethodPost, "/v1/calculate", bytes.NewReader([]byte(`{"operation":"2+2"}`)))
	req.Header.Set("Content-Type", "application/json")
	// Deliberately no Authorization header, no cookies.
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 for a credential-free request (API-06); body: %s", rec.Code, rec.Body.String())
	}
}

// TestHandler_Calculate_NilUseCaseDoesNotPanic covers the Done-when bullet
// "No nil-pointer panics on nil usecase". UseCase is a stateless zero-field
// struct, so a nil *UseCase receiver never dereferences a field and the
// call completes normally rather than panicking.
func TestHandler_Calculate_NilUseCaseDoesNotPanic(t *testing.T) {
	h := newTestHandler(t, nil)
	r := newTestRouter(t, h)

	defer func() {
		if rec := recover(); rec != nil {
			t.Fatalf("handler panicked with nil usecase: %v", rec)
		}
	}()

	rec := doCalculateRequest(t, r, []byte(`{"operation":"2+2"}`))
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 with a nil-but-stateless usecase; body: %s", rec.Code, rec.Body.String())
	}
}
