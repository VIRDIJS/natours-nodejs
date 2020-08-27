// ******/Require Declarations/*******
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// ******/UNCAUGHT EXCEPTIONS ERROR HANDLING/*******

process.on('uncaughtException',(err) => {
  console.log(`Exception Name: ${err.name}, Exception Message: ${err.message}`);
  process.exit(1);
});

dotenv.config({ path: './config.env' });

const app = require('./app');
const db = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log('Connection Successful!'));
// console.log(app.get('env'))
console.log(process.env.NODE_ENV);

// ******/Server/*******
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`Server Started!.Listening on port ${port}...`);
});

// ******/ERROR HANDLING UNHANDLED REJECTION/*******
// On event named "unhandledRejection" shutdown the server
// and exit the running node process.
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION. Shutting Down...');
  server.close(() => {
    process.exit(1);
  });
});
