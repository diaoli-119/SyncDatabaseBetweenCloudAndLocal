/*
 * @Author: your name
 * @Date: 2021-02-25 14:57:11
 * @LastEditTime: 2021-04-30 15:17:00
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \sync_cpy_from_cloud\Boarding\pullBoardingUpdated.js
 */

'use strict'

const dotenv = require('/usr/local/lib/node_modules/npm/node_modules/dotenv').config({ path: '/home/pi/sync_from_cloud/.env' });
const fs = require('fs');
var updatedFile;
const { Pool } = require(process.env.NODEPATH + 'pg');
const connString = 'postgresql://pi:pi@localhost:5432/parse';
const conn2Postgres = new Pool({
  connectionString: connString
});
var queryMongo;
var upId = [];
var tab;

const readUpdatedFile = () =>
{
  upId = [];
  fs.readFile(updatedFile, 'utf8', (err, data) => {
    if(err) {
      console.error('L31 ', err);
      return;
    }
    fs.unlink(updatedFile, () => {
      console.log('L29' + updatedFile + ' deleted.');
    })
    console.log(data.toString());
    for(let c = 0, i = 0; c < data.toString().length; c++)
    {
      if (data[c] == '\n'){
        upId.push(data.substring(i, c));
        i = c + 1;
      }
    }
    console.log('L32 upId = ', upId);
    deleteRepetitiveRecords(upId);
    console.log('L34 upId = ', upId);
    queryRecords(upId);
  })
}

const deleteRepetitiveRecords = (recordArr) =>
{
  for (let c = 0; c < recordArr.length; c++)
    for (let i = c + 1; i < recordArr.length; i++) 
      if (recordArr[c] == recordArr[i]) 
        recordArr.splice(i--, 1);
  console.log('recordArr', recordArr);
  upId = recordArr;
}

async function updateRecords(updateRec)
{
  let keyIdValue, keyIdValue_2nd;
  let id, id_2nd;
  let sqlComm = 'update \"' + tab + '\" set ';
  
  if (tab == 'Address') { id = 'AddressId' }
  else if (tab == 'Boarding'){ id = 'watchBarCode' }
  else if (tab == 'Device') { id = 'LocalName' }
  else if (tab == 'DevInfo') { id =  'Device' }
  else if (tab == 'EmgcyContactInfo') { id = 'macAddr' }
  else if (tab == 'OwnerGroup') { id = 'localName' }
  else if (tab == 'Venue') { id = 'VenueId' }
  else if (tab == 'NodeInfo') { id = 'LocalName' }
  else if (tab == 'V0000001') { id = 'Latitude', id_2nd = 'longitude' }
  else if (tab == 'Point') { id = 'Point', id_2nd = 'ClassName' }
  else if (tab == 'Building') { id = 'BuildingID', id_2nd = 'VenueId' }
  else if (tab == 'ClientList') { id = 'venue', id_2nd = 'clientId' }
  else if (tab == 'NotificationAlarm') { id = 'venue', id_2nd = 'nodeaddr' }
  else if (tab == 'Plate') { id = 'Longitude', id_2nd = 'Latitude' }

  for (let n in updateRec)
  {
    for (let key in updateRec[n])
    {
      console.log(updateRec[n][key]);
      if (key == 'saveTime')
        continue;
      else if (key == id)
        keyIdValue = updateRec[n][key];
      else if (key == id_2nd)
        keyIdValue_2nd = updateRec[n][key];
      else if (isNaN(updateRec[n][key]))
        sqlComm += '\"' + key + '\" = \'' + updateRec[n][key] + '\', ';
      else 
        sqlComm += '\"' + key + '\" = ' + updateRec[n][key] + ', ';
    }
  }
  console.log(sqlComm);
  sqlComm = sqlComm.substring(0, sqlComm.length - 2);

  if(tab == 'Point'){
    sqlComm += ' where "Point" = ' + keyIdValue + 'and "ClassName" = \'' + keyIdValue_2nd + '\';';
  }
  else if(tab == 'V0000001'){
    sqlComm += ' where "Latitude" = \'' + keyIdValue + '\' and "longitude" = \'' + keyIdValue_2nd + '\';';
  }
  else if(tab == 'Building'){
    sqlComm += ' where "BuildingID" = ' + keyIdValue + 'and "VenueId" = \'' + keyIdValue_2nd + '\';';
  }
  else if(tab == 'NotificationAlarm'){
    sqlComm += ' where "venue" = ' + keyIdValue + 'and "nodeaddr" = \'' + keyIdValue_2nd + '\';';
  }
  else if(tab == 'Plate'){
    sqlComm += ' where "Longitude" = ' + keyIdValue + 'and "Latitude" = \'' + keyIdValue_2nd + '\';';
  }
  else if(tab == 'ClientList'){
    sqlComm += ' where "venue" = ' + keyIdValue + 'and "clientId" = \'' + keyIdValue_2nd + '\';';
  }
  else{
    sqlComm += ' where \"' + id + '\" = \'' + keyIdValue + '\';';    
  }

  console.log('sqlComm = ', sqlComm);
  await conn2Postgres
    .query(sqlComm, (err, res) => {
      if (err) console.log(err);
    })   
}

function accessToMongo(num) {
  return new Promise(async (resolve, reject) => {
    console.log('L87 upId = ', upId[num]);
    await queryMongo.get(upId[num])
    .then(async (res) => {
      console.log('L106 queryRecords res = ', res);
      
      if(tab == 'Boarding'){
        const updateBoarding = [
                                {tckIdx: (res.get('tckIdx') == undefined ? null : res.get('tckIdx'))}, 
                                {toCity: (res.get('toCity') == undefined ? null : res.get('toCity'))}, 
                                {seatNo: (res.get('seatNo') == undefined ? null : res.get('seatNo'))},
                                {operCarr: (res.get('operCarr') == undefined ? null : res.get('operCarr'))}, 
                                {noLeg: (res.get('noLeg') == undefined ? null : res.get('noLeg'))}, 
                                {psgName: (res.get('psgName') == undefined ? null : res.get('psgName'))},
                                {watchBarCode: (res.get('watchBarCode') == undefined ? null : res.get('watchBarCode'))}, 
                                {flightNo: (res.get('flightNo') == undefined ? null : res.get('flightNo'))}, 
                                {checkInSeq: (res.get('checkInSeq') == undefined ? null : res.get('checkInSeq'))},
                                {fromCity: (res.get('fromCity') == undefined ? null : res.get('fromCity'))}, 
                                {fmtCode: (res.get('fmtCode') == undefined ? null : res.get('fmtCode'))}, 
                                {flightDate: (res.get('flightDate') == undefined ? null : res.get('flightDate'))},
                                {VenueId: (res.get('VenueId') == undefined ? null : res.get('VenueId'))}, 
                                {RegisterPhone: (res.get('RegisterPhone') == undefined ? null : res.get('RegisterPhone'))}, 
                                {saveTime: (res.get('saveTime') == undefined ? null : res.get('saveTime'))}
                              ];
        await updateRecords(updateBoarding);
      }
      else if (tab == 'Address'){
        const updateAddress = [
                                {AddressId: (res.get('AddressId') == undefined ? null : res.get('AddressId'))}, 
                                {PostCode: (res.get('PostCode') == undefined ? null : res.get('PostCode'))}, 
                                {Address1: (res.get('Address1') == undefined ? null : res.get('Address1'))}, 
                                {Address2: (res.get('Address2') == undefined ? null : res.get('Address2'))}, 
                                {Address3: (res.get('Address3') == undefined ? null : res.get('Address3'))},
                                {SecurityPhoneNo: (res.get('SecurityPhoneNo') == undefined ? null : res.get('SecurityPhoneNo'))}
                              ];
        await updateRecords(updateAddress);
      }
      else if (tab == 'Device'){
        const updateDevice = [
                              {Level: (res.get('Level') == undefined ? null : res.get('Level'))}, 
                              {Floor: (res.get('Floor') == undefined ? null : res.get('Floor'))}, 
                              {FloorName: (res.get('FloorName') == undefined ? null : res.get('FloorName'))}, 
                              {AddressId: (res.get('AddressId') == undefined ? null : res.get('AddressId'))}, 
                              {RssiInMeter: (res.get('RssiInMeter') == undefined ? null : res.get('RssiInMeter'))},
                              {Venue: (res.get('Venue') == undefined ? null : res.get('Venue'))}, 
                              {EnvFactCnt: (res.get('EnvFactCnt') == undefined ? null : res.get('EnvFactCnt'))}, 
                              {nodeAddress: (res.get('nodeAddress') == undefined ? null : res.get('nodeAddress'))},
                              {LocalName: (res.get('LocalName') == undefined ? null : res.get('LocalName'))}, 
                              {DeviceNo: (res.get('DeviceNo') == undefined ? null : res.get('DeviceNo'))}, 
                              {X: (res.get('X') == undefined ? null : res.get('X'))},
                              {Y: (res.get('Y') == undefined ? null : res.get('Y'))}, 
                              {envFactor: (res.get('envFactor') == undefined ? null : res.get('envFactor'))},
                              {Desc: (res.get('Desc') == undefined ? null : res.get('Desc'))}
                            ];
        await updateRecords(updateDevice);
      }
      else if (tab == 'DevInfo'){
        const updateDevInfo = [
                                {Device: (res.get('Device') == undefined ? null : res.get('Device'))},
                                {temHighBound: (res.get('temHighBound') == undefined ? null : res.get('temHighBound'))},
                                {temLowBound: (res.get('temLowBound') == undefined ? null : res.get('temLowBound'))}, 
                                {humLowBound: (res.get('humLowBound') == undefined ? null : res.get('humLowBound'))},
                                {humHighBound: (res.get('humHighBound') == undefined ? null : res.get('humHighBound'))}
                              ];
        await updateRecords(updateDevInfo);
      }
      else if (tab == 'EmgcyContactInfo'){
        const updateEmgCntInfo = [
                                  {macAddr: (res.get('macAddr') == undefined ? null : res.get('macAddr'))}, 
                                  {EmgcyCntPerson: (res.get('EmgcyCntPerson') == undefined ? null : res.get('EmgcyCntPerson'))}, 
                                  {EmgcyCntNum: (res.get('EmgcyCntNum') == undefined ? null : res.get('EmgcyCntNum'))}
                                 ];
        await updateRecords(updateEmgCntInfo);
      }
      else if (tab == 'OwnerGroup'){
        const updateOwnerGroup = [
                                  {localName: (res.get('localName') == undefined ? null : res.get('localName'))}, 
                                  {UserPhone: (res.get('UserPhone') == undefined ? null : res.get('UserPhone'))}, 
                                  {Venue: (res.get('Venue') == undefined ? null : res.get('Venue'))}
                                 ];
        await updateRecords(updateOwnerGroup);
      }
      else if (tab == 'Point'){
        const updateVenue = [
                              {ClassName: (res.get('ClassName') == undefined ? null : res.get('ClassName'))}, 
                              {Level: (res.get('Level') == undefined ? null : res.get('Level'))}, 
                              {Floor: (res.get('Floor') == undefined ? null : res.get('Floor'))},
                              {AddressId: (res.get('AddressId') == undefined ? null : res.get('AddressId'))}, 
                              {Point: (res.get('Point') == undefined ? null : res.get('Point'))}, 
                              {FloorName: (res.get('FloorName') == undefined ? null : res.get('FloorName'))},
                              {X: (res.get('X') == undefined ? null : res.get('X'))},
                              {Y: (res.get('Y') == undefined ? null : res.get('Y'))}
                            ];
        await updateRecords(updateVenue);
      }
      else if (tab == 'Venue'){
        const updateVenue = [
                              {VenueId: (res.get('VenueId') == undefined ? null : res.get('VenueId'))}, 
                              {Logo: (res.get('Logo') == undefined ? null : res.get('Logo'))}, 
                              {PostCode: (res.get('PostCode') == undefined ? null : res.get('PostCode'))},
                              {URL: (res.get('URL') == undefined ? null : res.get('URL'))}, 
                              {VenueName: (res.get('VenueName') == undefined ? null : res.get('VenueName'))},
                              {MeshConfig: (res.get('MeshConfig') == undefined ? null : res.get('MeshConfig'))},
                              {MeshToken: (res.get('MeshToken') == undefined ? null : res.get('MeshToken'))},
                              {Address1: (res.get('Address1') == undefined ? null : res.get('Address1'))}, 
                              {Address2: (res.get('Address2') == undefined ? null : res.get('Address2'))}, 
                              {Address3: (res.get('Address3') == undefined ? null : res.get('Address3'))}
                            ];
        await updateRecords(updateVenue);
      }
      else if (tab == 'V0000001'){
        const updateVenue = [
                              {noofDevice: (res.get('noofDevice') == undefined ? null : res.get('noofDevice'))}, 
                              {Point: (res.get('Point') == undefined ? null : res.get('Point'))}, 
                              {desc: (res.get('desc') == undefined ? null : res.get('desc'))}, 
                              {Latitude: (res.get('Latitude') == undefined ? null : res.get('Latitude'))}, 
                              {longitude: (res.get('longitude') == undefined ? null : res.get('longitude'))}, 
                              {markTime: (res.get('markTime') == undefined ? null : res.get('markTime'))}, 
                              {ble1: (res.get('ble1') == undefined ? null : res.get('ble1'))},
                              {ble2: (res.get('ble2') == undefined ? null : res.get('ble2'))}, 
                              {ble3: (res.get('ble3') == undefined ? null : res.get('ble3'))},
                              {ble4: (res.get('ble4') == undefined ? null : res.get('ble4'))},
                              {ble5: (res.get('ble5') == undefined ? null : res.get('ble5'))},
                              {ble6: (res.get('ble6') == undefined ? null : res.get('ble6'))},
                              {ble7: (res.get('ble7') == undefined ? null : res.get('ble7'))},
                              {rssi1: (res.get('rssi1') == undefined ? null : res.get('rssi1'))},
                              {rssi2: (res.get('rssi2') == undefined ? null : res.get('rssi2'))},
                              {rssi3: (res.get('rssi3') == undefined ? null : res.get('rssi3'))},
                              {rssi4: (res.get('rssi4') == undefined ? null : res.get('rssi4'))},
                              {rssi5: (res.get('rssi5') == undefined ? null : res.get('rssi5'))},
                              {rssi6: (res.get('rssi6') == undefined ? null : res.get('rssi6'))},
                              {rssi7: (res.get('rssi7') == undefined ? null : res.get('rssi7'))},
                              {markTime: (res.get('markTime') == undefined ? null : res.get('markTime'))}
                            ];
        await updateRecords(updateVenue);
      }
      else if (tab == 'Building'){
        const updateVenue = [
                              {VenueId: (res.get('VenueId') == undefined ? null : res.get('VenueId'))}, 
                              {FireZone: (res.get('FireZone') == undefined ? null : res.get('FireZone'))}, 
                              {assPt_latitude: (res.get('assPt_latitude') == undefined ? null : res.get('assPt_latitude'))},
                              {assPt_longitude: (res.get('assPt_longitude') == undefined ? null : res.get('assPt_longitude'))},
                              {FH_latitude: (res.get('FH_latitude') == undefined ? null : res.get('FH_latitude'))}, 
                              {FH_longitude: (res.get('FH_longitude') == undefined ? null : res.get('FH_longitude'))},
                              {FA_latitude: (res.get('FA_latitude') == undefined ? null : res.get('FA_latitude'))},
                              {FA_longitude: (res.get('FA_longitude') == undefined ? null : res.get('FA_longitude'))},
                              {Name: (res.get('Name') == undefined ? null : res.get('Name'))}, 
                              {BuildingID: (res.get('BuildingID') == undefined ? null : res.get('BuildingID'))}
                            ];
        await updateRecords(updateVenue);
      }
      else if (tab == 'ClientList'){
        const updateVenue = [
                              {venue: (res.get('venue') == undefined ? null : res.get('venue'))}, 
                              {name: (res.get('name') == undefined ? null : res.get('name'))}, 
                              {clientId: (res.get('clientId') == undefined ? null : res.get('clientId'))},
                              {ContactPerson_1: (res.get('ContactPerson_1') == undefined ? null : res.get('ContactPerson_1'))},
                              {ContactPerson_2: (res.get('ContactPerson_2') == undefined ? null : res.get('ContactPerson_2'))}, 
                              {ContactNum_1: (res.get('ContactNum_1') == undefined ? null : res.get('ContactNum_1'))},
                              {ContactNum_2: (res.get('ContactNum_2') == undefined ? null : res.get('ContactNum_2'))}
                            ];
        await updateRecords(updateVenue);
      }
      else if (tab == 'NodeInfo'){
        const updateVenue = [
                              {VenueId: (res.get('VenueId') == undefined ? null : res.get('VenueId'))}, 
                              {Logo: (res.get('Logo') == undefined ? null : res.get('Logo'))}, 
                              {URL: (res.get('URL') == undefined ? null : res.get('URL'))},
                              {Address: (res.get('Address') == undefined ? null : res.get('Address'))},
                              {LocalName: (res.get('LocalName') == undefined ? null : res.get('LocalName'))}, 
                              {Coordinates: (res.get('Coordinates') == undefined ? null : res.get('Coordinates'))},
                              {nodeAddr: (res.get('nodeAddr') == undefined ? null : res.get('nodeAddr'))}
                            ];
        await updateRecords(updateVenue);
      }
      else if (tab == 'NotificationAlarm'){
        const updateVenue = [
                              {venue: (res.get('venue') == undefined ? null : res.get('venue'))}, 
                              {nodeaddr: (res.get('nodeaddr') == undefined ? null : res.get('nodeaddr'))}, 
                              {Done: (res.get('Done') == undefined ? null : res.get('Done'))}
                            ];
        await updateRecords(updateVenue);
      }
      else if (tab == 'Plate'){
        const updateVenue = [
                              {VenueId: (res.get('VeuneId') == undefined ? null : res.get('VenueId'))}, 
                              {Title: (res.get('Title') == undefined ? null : res.get('Title'))}, 
                              {Info: (res.get('Info') == undefined ? null : res.get('Info'))},
                              {Longitude: (res.get('Longitude') == undefined ? null : res.get('Longitude'))},
                              {Latitude: (res.get('Latitude') == undefined ? null : res.get('Latitude'))}, 
                              {Type: (res.get('Type') == undefined ? null : res.get('Type'))},
                              {Image: (res.get('Image') == undefined ? null : res.get('Image'))},
                              {BuildingID: (res.get('BuildingID') == undefined ? null : res.get('BuildingID'))}
                            ];
        await updateRecords(updateVenue);
      }
      else if (tab == '_User'){
        const updateVenue = [
                              {emailVerified: (res.get('emailVerified') == undefined ? null : res.get('VenueId'))}, 
                              {username: (res.get('username') == undefined ? null : res.get('username'))}, 
                              {password: (res.get('password') == undefined ? null : res.get('password'))},
                              {phone: (res.get('phone') == undefined ? null : res.get('phone'))},
                              {authData: (res.get('authData') == undefined ? null : res.get('authData'))}, 
                              {email: (res.get('email') == undefined ? null : res.get('email'))},
                              {birth: (res.get('birth') == undefined ? null : res.get('birth'))},
                              {verified: (res.get('verified') == undefined ? null : res.get('verified'))},
                              {PIN: (res.get('PIN') == undefined ? null : res.get('PIN'))},
                              {PreferName: (res.get('PreferName') == undefined ? null : res.get('PreferName'))},
                              {UserType: (res.get('UserType') == undefined ? null : res.get('UserType'))}
                            ];
        await updateRecords(updateVenue);
      }
      else{}
      
    }, (error) => {
      console.error('err = ', error);
    });
    resolve();
  })
}

async function queryRecords(upId){
  for(let num in upId){
    await accessToMongo(num);
  }
}

const updatedFunc = (tabName) => {
  tab = tabName;
  let parseMongo = require(process.env.NODEPATH + 'parse/node');
  parseMongo.initialize(process.env.APPID_MONGO);
  parseMongo.serverURL = process.env.SERVERURL_MONGO;
  queryMongo = new parseMongo.Query(tab);

  updatedFile = '/home/pi/Log_' + tab + '/_update.txt';
  readUpdatedFile();
}

module.exports = updatedFunc;