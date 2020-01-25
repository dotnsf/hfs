//. api.js
var express = require( 'express' ),
    crypto = require( 'crypto' ),
    multer = require( 'multer' ),
    bodyParser = require( 'body-parser' ),
    fs = require( 'fs' ),
    cloudantlib = require( '@cloudant/cloudant' ),
    router = express.Router();
var settings = require( '../settings' );


router.use( multer( { dest: './tmp/' } ).single( 'file' ) );
router.use( bodyParser.urlencoded( { extended: true } ) );
router.use( bodyParser.json() );

var cloudant = null;
var db = null;
if( settings.db_username && settings.db_password ){
  cloudant = cloudantlib( { account: settings.db_username, password: settings.db_password } );
}else if( settings.db_apikey && settings.db_url ){
  cloudant = new cloudantLib({
    url: settings.db_url,
    plugins: {
      iamauth: {
        iamApikey: settings.db_apikey
      }
    }
  });
}
db = cloudant.db.use( settings.dbname );

/*
app.all( '/', basicAuth( function( user, pass ){
  if( settings.basic_username && settings.basic_password ){
    return( user === settings.basic_username && pass === settings.basic_password );
  }else{
    return true;
  }
}));
*/

router.post( '/file', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var filepath = req.file.path;
  var filetype = req.file.mimetype;
  //var filesize = req.file.size;
  var ext = filetype.split( "/" )[1];
  //var filename = req.file.filename;
  var originalname = req.file.originalname;
  var ts = ( new Date() ).getTime();

  if( filepath ){
    var bin = fs.readFileSync( filepath );
    var bin64 = new Buffer( bin ).toString( 'base64' );

    var hash = crypto.createHash( 'sha512' );
    hash.update( JSON.stringify( bin ) );
    var _id = hash.digest( 'hex' );

    var params = {
      originalname: originalname,
      timestamp: ts,
      _attachments: {
        file: {
          content_type: filetype,
          data: bin64
        }
      }
    };

    db.insert( params, _id, function( err, body, header ){
      fs.unlink( filepath, function( err ){} );
      if( err ){
        res.status( 400 );
        res.write( JSON.stringify( { status: false, error: err }, null, 2 ) );
        res.end();
      }else{
        res.write( JSON.stringify( { status: true, id: body.id }, null, 2 ) );
        res.end();
      }
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'No file attached.' }, null, 2 ) );
    res.end();
  }
});

router.post( '/validate/:id', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );
  var id = req.params.id;
  if( id ){
    db.attachment.get( id, "file", function( err, body ){
      if( err ){
        res.status( 400 );
        res.write( JSON.stringify( { status: false, error: err }, null, 2 ) );
        res.end();
      }else{
        var hash = crypto.createHash( 'sha512' );
        hash.update( JSON.stringify( body ) );
        var value = hash.digest( 'hex' );
        if( id == value ){
          res.write( JSON.stringify( { status: true, hashvalue: value }, null, 2 ) );
          res.end();
        }else{
          res.write( JSON.stringify( { status: false, hashvalue: value }, null, 2 ) );
          res.end();
        }
      }
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'Parameter id required.' }, null, 2 ) );
    res.end();
  }
});

router.post( '/exist', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var filepath = req.file.path;
  var filetype = req.file.mimetype;
  //var filesize = req.file.size;
  var ext = filetype.split( "/" )[1];
  //var filename = req.file.filename;

  if( filepath ){
    var bin = fs.readFileSync( filepath );

    var hash = crypto.createHash( 'sha512' );
    hash.update( JSON.stringify( bin ) );
    var id = hash.digest( 'hex' );

    fs.unlink( filepath, function( err ){} );

    db.get( id, "file", function( err, doc ){
      if( err ){
        res.status( 400 );
        res.write( JSON.stringify( { status: false, hash: id }, null, 2 ) );
        res.end();
      }else{
        res.write( JSON.stringify( { status: true, hash: id }, null, 2 ) );
        res.end();
      }
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'No file attached.' }, null, 2 ) );
    res.end();
  }
});

router.get( '/file_ids', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var _limit = req.query.limit ? parseInt( req.query.limit ) : 0;
  var _offset = req.query.offset ? parseInt( req.query.offset ) : 0;
  var limit = isNaN( _limit ) ? 0 : _limit;
  var offset = isNaN( _offset ) ? 0 : _offset;

  db.list( function( err, files ){
    if( err ){
      console.log( err );
      res.status( 400 );
      res.write( JSON.stringify( { status: false, error: err }, null, 2 ) );
      res.end();
    }else{
      var ids = [];

      files.rows.forEach( function( file ){
        var id = file.id;
        ids.push( id );
      });

      if( offset ){
        if( limit ){
          ids = ids.slice( offset, limit );
        }else{
          ids = ids.slice( offset );
        }
      }else if( limit ){
        ids = ids.slice( 0, limit );
      }

      res.write( JSON.stringify( { status: true, ids: ids }, null, 2 ) );
      res.end();
    }
  });
});

router.get( '/file/:id', function( req, res ){
  var id = req.params.id;
  var _download = req.query.download;
  var _binary = req.query.binary;
  if( id ){
    db.get( id, { include_docs: true }, function( err, file ){
      if( err ){
        res.contentType( 'application/json; charset=utf-8' );
        res.status( 400 );
        res.write( JSON.stringify( { status: false, error: err }, null, 2 ) );
        res.end();
      }else{
        if( _download || _binary ){
          db.attachment.get( id, "file", function( err, body ){
            if( err ){
              res.contentType( 'application/json; charset=utf-8' );
              res.status( 400 );
              res.write( JSON.stringify( { status: false, error: err }, null, 2 ) );
              res.end();
            }else{
              if( _download ){
                var filename = file.originalname ? file.originalname : id;
                //var ts = file.timestamp;
                res.set({
                  'Content-Disposition': 'attachment; filename=' + filename,
                  'Content-Type': 'application/force-download'
                });
              }
              res.end( body, 'binary' );
            }
          });
        }else{
          delete file['_rev'];
          delete file['_attachments'];
          res.contentType( 'application/json; charset=utf-8' );
          res.write( JSON.stringify( { status: true, file: file }, null, 2 ) );
          res.end();
        }
      }
    });
  }else{
    res.contentType( 'application/json; charset=utf-8' );
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'Parameter id required.' }, null, 2 ) );
    res.end();
  }
});

router.delete( '/file/:id', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var id = req.params.id;
  if( id ){
    db.get( id, null, function( err, body, header ){
      if( err ){
        res.status( 400 );
        res.write( JSON.stringify( { status: false, error: err }, null, 2 ) );
        res.end();
      }else{
        var rev = body._rev;
        db.destroy( id, rev, function( err, body, header ){
          if( err ){
            res.status( 400 );
            res.write( JSON.stringify( { status: false, error: err }, null, 2 ) );
            res.end();
          }else{
            res.write( JSON.stringify( { status: true } ) );
            res.end();
          }
        });
      }
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'Parameter id required.' }, null, 2 ) );
    res.end();
  }
});

module.exports = router;
