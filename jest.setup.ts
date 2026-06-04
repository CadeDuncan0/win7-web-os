// Runs after the test framework is installed in each test file (see
// jest.config.js → setupFilesAfterEnv). Importing jest-dom registers its custom
// matchers (toBeInTheDocument, toHaveTextContent, toBeDisabled, …) on Jest's
// global `expect` and augments the matcher types for TypeScript.
import '@testing-library/jest-dom'
