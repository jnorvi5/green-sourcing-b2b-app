export const EMISSION_FACTOR = 0.35 // kg CO2 per ton-mile (truck transport)
export const LOCAL_DISTANCE_MILES = 100
export const SUPPLIER_CANDIDATE_LIMIT = 10
export const AI_MATCH_SCORE_FALLBACK = 50
export const AI_TOKENS_ESTIMATE_SMALL = 500
export const AI_TOKENS_ESTIMATE_LARGE = 1000

// Azure OpenAI Deployments (Update these names to match your Azure setup if different)
export const AZURE_DEPLOYMENT_EXPENSIVE = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o'
export const AZURE_DEPLOYMENT_CHEAP = 'gpt-4o-mini' // Assuming this deployment exists or fallback to standard
