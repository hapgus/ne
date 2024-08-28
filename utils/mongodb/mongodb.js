const { mongoose } = require('mongoose');
const { MONGO_URL } = require('./mongodbConfig')

const HttpError = require('../../models/http-error')

mongoose.connection.once('open', () => { console.log('Mongo connection ready!') });//Check DB connection

mongoose.connection.on('error', (err) => { console.error(`There was an error with SFW's MongoDB connection: ${err}`) });//Check DB errors

const mongoDBConnection = async () => {
    try {
        const establishedConnection = await mongoose.connect(MONGO_URL);
        if (!establishedConnection) {
            return (next(new HttpError('Could not connect.', 409)))
        }
       
        console.log(establishedConnection)

    } catch (error) {
        return next(new HttpError(`Something went wrong. Error ${error} `, 409))
    }
}

const mongoDBDisconnect = async () => {
    await mongoose.disconnect();
}

module.exports = {
    mongoDBConnection,
    mongoDBDisconnect
}