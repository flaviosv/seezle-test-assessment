.PHONY: test test-backend test-frontend test-e2e

test: test-backend test-frontend test-e2e ## Run backend, frontend, and e2e suites

test-backend: ## Go unit + integration tests
	cd backend && go test ./...

test-frontend: ## Vitest unit + component tests (CI mode)
	cd frontend && npm run test -- --run

test-e2e: ## Playwright end-to-end suite (requires `npx playwright install chromium` once)
	cd e2e && npm test
