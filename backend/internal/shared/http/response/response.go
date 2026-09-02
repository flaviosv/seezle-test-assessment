package response

// ErrorResponse is the single error envelope used for every non-200
// response in this service (AD-002): populated directly at the call site,
// e.g. c.JSON(400, response.ErrorResponse{Error: err.Error()}).
type ErrorResponse struct {
	Error string `json:"error"`
}
