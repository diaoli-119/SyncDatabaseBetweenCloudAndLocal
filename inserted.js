/*
 * @Author: your name
 * @Date: 2021-02-24 13:17:03
 * @LastEditTime: 2021-05-01 15:08:30
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \sync_cpy_from_cloud\Boarding\pull.js
 */

'use strict'

const fs = require('fs');
const request = require('/usr/local/lib/node_modules/request');
const parsePostsql = require('/usr/local/lib/node_modules/parse/node');
const mongoClient = require('/usr/local/lib/node_modules/mongodb').MongoClient;
const mongoURL = '****';	//hide for security
const asyncA = require('async')
const dbName = 'dev';
const appId = 'postgresAppId';
const localUrl = 'http://localhost:1337/parse/classes/';
const localVenueId = 'V0000001';
const addressId = 'A0000000001';
var tab;
var createdFile;    //crontab need absolute path to read file.

var dbIns, dbObj, timeStamp;
var recArray = [];
var deviceArr = [];
var earliest;

const connect2Mongo = () => {
  mongoClient.connect(mongoURL, { useUnifiedTopology: true }, (err, db) => {
    if (err) throw err;
    dbIns = db;
    dbObj = dbIns.db(dbName);
    console.log('L25 connected to Mongo');
    getCreatedTimeFromCreatedFile();
  })
}

const getCreatedTimeFromCreatedFile = () => {
  fs.readFile(createdFile, 'utf8', (err, data) => {
    if (err) throw err;
    fs.unlink(createdFile, () => {
      
    })
    console.log('L44 data = ', data);
    earliest = data.substring(data.indexOf('2'), data.indexOf('\n'));
    console.log(earliest);
    timeStamp = new Date(earliest).getTime();
    console.log(timeStamp);
    getLatestCloudRec();
  })
}

const getLatestCloudRec = () => {
  var recCondition;
  if (tab == 'Address'){
    recCondition = {
                      "_created_at":{"$gte":new Date(new Date(timeStamp).toISOString())},  //gte: greater than and equal
                      "AddressId": addressId
                    };
  }
  else if(tab == 'Boarding' || tab == 'Building' || tab == 'NodeInfo'){
    recCondition = {
                      "_created_at":{"$gte":new Date(new Date(timeStamp).toISOString())},  //gte: greater than and equal
                      "VenueId": localVenueId
                    };
  }
  else if(tab == 'Plate'){
    recCondition = {
                      "_created_at":{"$gte":new Date(new Date(timeStamp).toISOString())},  //gte: greater than and equal
                      "VeuneId": localVenueId
                    };
  }
  else if (tab == 'Device' || tab == 'OwnerGroup') {
    recCondition = {
                      "_created_at":{"$gte":new Date(new Date(timeStamp).toISOString())},  //gte: greater than and equal
                      "Venue": localVenueId
                    };
  }
  else if (tab == 'Point'){
    recCondition = {
                      "_created_at":{"$gte":new Date(new Date(timeStamp).toISOString())},  //gte: greater than and equal
                      "ClassName": localVenueId
                    };
  }
  else if (tab == 'ClientList' || tab == 'NotificationAlarm'){
    recCondition = {
                      "_created_at":{"$gte":new Date(new Date(timeStamp).toISOString())},  //gte: greater than and equal
                      "venue": localVenueId
                    };
  }
  else if (tab == '_User'){
    recCondition = {
                      "_created_at":{"$gte":new Date(new Date(timeStamp).toISOString())},  //gte: greater than and equal
                    };
  }
  else {
    recCondition = {
                      "_created_at":{"$gte":new Date(new Date(timeStamp).toISOString())}  //gte: greater than and equal
                    };
  }
  dbObj.collection(tab)
    .find(recCondition)
    .toArray((err, res) => {
      if (err)  throw err;
      recArray = res;
      console.log('L41 recArray = ', recArray);
      dbIns.close();
      if(tab != 'Device') insertLatestCloudRec();
      else if(tab == 'Device') insertIntoDevInfo(recArray);
    })
}

const insertIntoDevInfo = (arr) => {  
  mongoClient.connect(mongoURL, { useUnifiedTopology: true }, (err, db) => {
    if (err) throw err;
    dbIns = db;
    dbObj = dbIns.db(dbName);
    console.log('L112 connected to Mongo');
    for(let n in arr){
      deviceArr.push(arr[n]['LocalName']);
    }
    console.log('deviceArr = ', deviceArr);
    
    asyncA.each(deviceArr, (item) => {
      let queryCond;
      recArray = [];
      queryCond = {Device: item}
      dbObj.collection('DevInfo')
        .find(queryCond)
        .toArray((err, res) => {
          if (err) throw err;
          console.log('L126 queryDevInfoRec res =', res);
          recArray.push(res[0]);
          if(item === deviceArr[deviceArr.length - 1]){
            dbIns.close();
            console.log('recArray = ', recArray);
            tab = 'DevInfo';
            insertLatestCloudRec();
          }
        })
    }, (err) => console.log(err));
  })
}

const insertLatestCloudRec = () => {
  parsePostsql.initialize(appId);
  var Object = parsePostsql.Object.extend(tab);
  for (var i = recArray.length - 1; i >= 0; i--) 
  {
    var bigObject = new Object();
    for (var key in recArray[i])
    {
      /*get key*/
      if (key == "_id" || key == "_created_at" || key == "_updated_at" || key == "Logo") continue;

      /*get value*/
      if (key == 'saveTime') bigObject.set(key, new Date(recArray[i][key]));
      else if (key == 'Logo' || key == 'Image' || key == 'FireZone'){
        bigObject.set(key, 'https://app.peasnet.tech/parse/files/bOYTojoWISKooGiwRxyP55E3/' + recArray[i][key]);
      }
      else
        bigObject.set(key, recArray[i][key]);
    }
    bigObject.save();
    addTab(bigObject);
  }
}

var totalNum = 0;
const addTab = (object) => {
  const options = {
    url: localUrl + tab,
    method: 'POST',
    headers: {
     'Content-Type': 'application/json',
     'X-Parse-Application-Id': appId
    },
    body: JSON.stringify(object)
  };

  request(options, function (err, res, body) {
    if ( err ) console.log(err);
    else 
      console.log((++totalNum) + ' records inserted successfully！\n');
  })
}

const insertedFunc = (tabName) => {
  tab = tabName;
  createdFile = '/home/pi/Log_' + tab + '/_create.txt';
  connect2Mongo();
}

module.exports = insertedFunc;