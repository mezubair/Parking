const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars')





// const routes = require('./routes'); // Import the routes module

const app = express();

const port = process.env.port || 3000;

const static_path = path.join(__dirname, "../public");
const viewsPath = path.join(__dirname, '../views');
const partialsPath = path.join(__dirname, '../views/partials')

const adminRoutes = require('./routes/adminRoutes');
app.use(adminRoutes);

const userRoutes = require('./routes/userRoutes');
app.use(userRoutes);



//Database and necessary models


app.use(express.static(static_path));




/* Middleware */
// Setting up the view engine
//
app.engine('hbs', exphbs.engine({
    extname: '.hbs',
    helpers: {
        eq: function (a, b) {
          return a === b;
        },
    },
    defaultLayout: false,
    partialsDir: partialsPath
}));

app.set('views', viewsPath);
app.set('view engine', 'hbs');

// Other middleware and configurations




app.listen(port, () => {
    console.log(`Server is running at port: ${port}`)
});  