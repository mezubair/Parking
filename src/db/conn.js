const mongoose = require('mongoose');

mongoose.connect("mongodb://localhost:27017/pms", {
    useNewUrlParser:true,
    useUnifiedTopology:true,
}).then(() =>{
    console.log(`Connection Successful`);
}).catch((e) => {
    console.log(`Couldn't connect to Database`);
}) 






