package operations

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Handler translates HTTP <-> UseCase for the operations slice.
type Handler struct {
	uc *UseCase
}

func NewHandler(uc *UseCase) *Handler {
	return &Handler{uc: uc}
}

// Calculate is implemented in T4 (bind, call uc.Calculate, map response).
//
// SPEC_DEVIATION: temporary stub — see usecase.go's SPEC_DEVIATION note for
// why this file exists ahead of T4.
func (h *Handler) Calculate(c *gin.Context) {
	c.Status(http.StatusNotImplemented)
}
