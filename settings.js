exports.basic_username = '';
exports.basic_password = '';
exports.db_username = '';
exports.db_password = '';
exports.db_apikey = '';
exports.db_url = '';
exports.dbname = 'hfsdb';

if( process.env.VCAP_SERVICES ){
  var VCAP_SERVICES = JSON.parse( process.env.VCAP_SERVICES );
  if( VCAP_SERVICES && VCAP_SERVICES.cloudantNoSQLDB ){
    exports.db_username = VCAP_SERVICES.cloudantNoSQLDB[0].credentials.username;
    exports.db_password = VCAP_SERVICES.cloudantNoSQLDB[0].credentials.password;
    exports.db_apikey = VCAP_SERVICES.cloudantNoSQLDB[0].credentials.apikey;
    exports.db_url = VCAP_SERVICES.cloudantNoSQLDB[0].credentials.url;
  }
}
