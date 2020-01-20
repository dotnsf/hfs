//. app.js

var express = require( 'express' ),
    basicAuth = require( 'basic-auth-connect' ),
    ejs = require( 'ejs' ),
    app = express();
var api = require( './routes/api' );


app.use( express.Router() );
app.use( express.static( __dirname + '/public' ) );

app.use( '/api', api );
app.set( 'views', __dirname + '/views' );
app.set( 'view engine', 'ejs' );


app.get( '/', function( req, res ){
  res.render( 'list', {} );
});


var port = process.env.port || 3000;
app.listen( port );
console.log( "server stating on " + port + " ..." );
