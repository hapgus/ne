
const MONGO_DB_CONFIG = {
    MONGO_USER: process.env.MONGO_USER,
    MONGO_PASSWORD: process.env.MONGO_PASSWORD,
    MONGO_CLUSTER: process.env.MONGO_USER,
    MONGO_DB: process.env.MONGO_DB,
}
// const MONGO_URL = `mongodb+srv://${MONGO_DB_CONFIG.MONGO_USER}:${MONGO_DB_CONFIG.MONGO_PASSWORD}@${MONGO_DB_CONFIG.MONGO_CLUSTER}/?retryWrites=true&w=majority&appName=${MONGO_DB_CONFIG.MONGO_DB}`
const MONGO_URL = 'mongodb+srv://sfw-hapg-dev:hapgus2468@hapgus-cluster.bkiorpz.mongodb.net/?retryWrites=true&w=majority&appName=hapgus-cluster';

module.exports = {
    MONGO_URL
}