package operations

import (
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/flaviosv/seezle-test-assessment/internal/shared/http/response"
)

// Handler translates HTTP <-> UseCase for the operations slice.
type Handler struct {
	uc *UseCase
}

func NewHandler(uc *UseCase) *Handler {
	return &Handler{uc: uc}
}

// CalculateRequest is the POST /v1/calculate request body.
type CalculateRequest struct {
	// Operation intentionally has no `binding:"required"` tag: an empty or
	// missing value decodes to "" and is rejected by the parser's own
	// ErrEmptyExpression (T6), which is this service's single source of
	// truth for grammar validity — not a separate bind-level rule.
	Operation string `json:"operation" example:"2+2"`
}

// CalculateResponse is the POST /v1/calculate success response body.
type CalculateResponse struct {
	Operation string      `json:"operation" example:"2+2"`
	Result    json.Number `json:"result" swaggertype:"number" example:"4"`
}

// Calculate parses and evaluates the operation string against the
// calculator grammar.
//
//	@Summary		Evaluate a calculator expression
//	@Description	Parses and evaluates a left-to-right arithmetic expression (+ - * / ^ \ %), returning the rounded numeric result
//	@Tags			operations
//	@Accept			json
//	@Produce		json
//	@Param			request	body		CalculateRequest	true	"Expression to evaluate"
//	@Success		200		{object}	CalculateResponse
//	@Failure		400		{object}	response.ErrorResponse
//	@Router			/v1/calculate [post]
func (h *Handler) Calculate(c *gin.Context) {
	var req CalculateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.ErrorResponse{Error: err.Error()})
		return
	}

	result, err := h.uc.Calculate(req.Operation)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, CalculateResponse{Operation: req.Operation, Result: result})
}
