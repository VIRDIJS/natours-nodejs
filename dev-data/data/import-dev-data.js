// ******/Require Declarations/*******
const fs = require('fs')
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./../../models/tourModel')
const User = require('./../../models/userModel')
const Review = require('./../../models/reviewModel')

dotenv.config({ path: './config.env' });

const db = process.env.DATABASE.replace('<PASSWORD>',process.env.DATABASE_PASSWORD)

mongoose.connect(db,{
  useNewUrlParser:true,
  useUnifiedTopology:true,
  useCreateIndex:true,
  useFindAndModify:false
}).then(()=> console.log('Connection Successful!'));
// console.log(app.get('env'))
console.log(process.env.NODE_ENV);

// ******/Server/*******
const port = process.env.PORT || 3000;
// app.listen(port, () => {
//   console.log(`Server Started!.Listening on port ${port}...`);
// });

// Read JSON file
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`,'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`,'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`,'utf-8'));

// Import data into database
const importData = async ()=>{
    try {
        await Tour.create(tours);
        await User.create(users,{validateBeforeSave:false});
        await Review.create(reviews);

        console.log('Import operation successful!')
    } catch (err) {
        console.log(err)
    }
    process.exit()
}

// Delete pre-existing data
const deleteData = async ()=> {
    try {
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log('Delete operation successful!')
    } catch (err) {
        console.log(err)
    }
    process.exit()
}

if(process.argv[2] === '--import'){
    importData()
}else if(process.argv[2] === '--delete'){
    deleteData()
}