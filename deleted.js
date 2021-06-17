/*
 * @Author: your name
 * @Date: 2021-02-25 14:57:11
 * @LastEditTime: 2021-04-30 15:17:36
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \sync_cpy_from_cloud\Boarding\pullBoardingUpdated.js
 */

'use strict'

const dotenv = require('/usr/local/lib/node_modules/npm/node_modules/dotenv').config({ path: '/home/pi/sync_from_cloud/.env' });
const fs = require('fs');
const { Pool } = require(process.env.NODEPATH + 'pg');
const connString = 'postgresql://pi:pi@localhost:5432/parse';
const conn2Postgres = new Pool({
  connectionString: connString
});
var deletedFile;
var tabName, id, id_2nd;

function deleteRecords(idValue)
{
  for(let n in idValue){
    (async (n) => {
      let sqlComm;
      if (tabName == 'Point'){
        let venue, addrId, point;
        let cPos_1 = idValue[n].indexOf(','); // ',' position
        venue = idValue[n].substring(0, cPos_1);
        let tempStr = idValue[n].substring(cPos_1 + 1);
        console.log(tempStr);
        let cPos_2 = tempStr.indexOf(',');
        addrId = tempStr.substring(0, cPos_2);
        point = tempStr.substring(cPos_2 + 1);
        sqlComm = 'delete from \"' + tabName + '\" where "ClassName" = \'' + venue + '\' and "AddressId" = \'' + addrId + '\' and "Point" = \'' + point + '\';';
      }
      else if (tabName == 'Building'){
        let venue, buildingId;
        let cPos_1 = idValue[n].indexOf(','); // ',' position
        venue = idValue[n].substring(0, cPos_1);
        buildingId = idValue[n].substring(cPos_1 + 1);
        sqlComm = 'delete from \"' + tabName + '\" where "VenueId" = \'' + venue + '\' and "BuildingID" = \'' + buildingId + '\';';
      }
      else if (tabName == 'ClientList'){
        let venue, clientId;
        let cPos_1 = idValue[n].indexOf(','); // ',' position
        venue = idValue[n].substring(0, cPos_1);
        clientId = idValue[n].substring(cPos_1 + 1);
        sqlComm = 'delete from \"' + tabName + '\" where "venue" = \'' + venue + '\' and "clientId" = \'' + clientId + '\';';
      }
      else if (tabName == 'NotificationAlarm'){
        let venue, nodeaddr;
        let cPos_1 = idValue[n].indexOf(','); // ',' position
        venue = idValue[n].substring(0, cPos_1);
        nodeaddr = idValue[n].substring(cPos_1 + 1);
        sqlComm = 'delete from \"' + tabName + '\" where "venue" = \'' + venue + '\' and "nodeaddr" = \'' + nodeaddr + '\';';
      }
      else if (tabName == 'Plate'){
        let longi, lati;
        let cPos_1 = idValue[n].indexOf(','); // ',' position
        longi = idValue[n].substring(0, cPos_1);
        lati = idValue[n].substring(cPos_1 + 1);
        sqlComm = 'delete from \"' + tabName + '\" where "Longitude" = \'' + longi + '\' and "Latitude" = \'' + lati + '\';';
      }
      else if (tabName == 'V0000001'){
        let longi, lati;
        let cPos_1 = idValue[n].indexOf(','); // ',' position
        lati = idValue[n].substring(0, cPos_1);
        longi = idValue[n].substring(cPos_1 + 1);
        sqlComm = 'delete from \"' + tabName + '\" where "Latitude" = \'' + lati + '\' and "longitude" = \'' + longi + '\';';
      }
      else{
        sqlComm = 'delete from \"' + tabName + '\" where \"' + id + '\" = ' + '\'' + idValue[n] + '\';';
      }
      console.log(sqlComm);
      await conn2Postgres
        .query(sqlComm, (err, res) => {
          if (err) console.log(err);
          console.log(idValue, ' deleted');
        })
    })(n)
  }
}

function deletedFunc(tab)
{
  tabName = tab;
  if (tabName == 'Address') { id = 'AddressId' }
  else if (tabName == 'Boarding'){ id = 'watchBarCode' }
  else if (tabName == 'Device') { id = 'LocalName' }
  else if (tabName == 'DevInfo') { id =  'Device' }
  else if (tabName == 'EmgcyContactInfo') { id = 'macAddr' }
  else if (tabName == 'OwnerGroup') { id = 'localName' }
  else if (tabName == 'Point') { id = 'Point', id_2nd = 'ClassName' }
  else if (tabName == 'Venue') { id = 'VenueId' }
  else if (tabName == 'Building') { id = 'BuildingID', id_2nd = 'VenueId' }
  else if (tabName == 'ClientList') { id = 'venue' }
  else if (tabName == 'NodeInfo') { id = 'LocalName' }
  else if (tabName == '_User') { id = 'username' }

  deletedFile = '/home/pi/Log_' + tabName + '/_delete.txt';
  let idValue = [];
  fs.readFile(deletedFile, 'utf8', (err, data) => {
    if (err) console.error(err);
    fs.unlink(deletedFile, () => {
      console.log('_delete.txt deleted');
    })

    for(let c = 0, i = 0; c < data.length; c++)
    {
      if (data[c] == '\n'){
        idValue.push(data.substring(i, c));
        i = c + 1;
      }
    }
    deleteRecords(idValue);
  })
}

module.exports = deletedFunc;