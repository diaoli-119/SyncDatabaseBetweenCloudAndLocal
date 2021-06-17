/*
 * @Author: your name
 * @Date: 2020-09-17 15:51:22
 * @LastEditTime: 2021-03-04 16:26:28
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \helpluminaire\traceMongoLog\js.js
 */

'use strict';

const fs = require('fs');
// const childProcess = require('child_process');
const inserted = require('./inserted.js');
const updated = require('./updated.js');
// const deleted = require('./deleted.js');
var createdFile;
var updatedFile;
var deletedFile;

//set log
const options = {flags: 'a', encoding: 'utf8'};
var stderr;
var logger;

const syncInsertedRec = () => {
  let subProcess = childProcess.fork(__dirname + '/inserted.js');
  subProcess.on('exit', (code, signal) => {
  })
}

const syncUpdatedRec = () => {
  let subProcess = childProcess.fork(__dirname + '/updated.js');
  subProcess.on('exit', (code, signal) => {
  })
}

const syncDeleteRec = () => {
  let subProcess = childProcess.fork(__dirname + '/deleted.js');
  subProcess.on('exit', (code, signal) => {
  })
}

const readFiles = (dbName, id) => {
  const logForCron = '/home/pi/Log_' + dbName + '/';
  createdFile = logForCron + '_create.txt';
  updatedFile = logForCron + '_update.txt';
  deletedFile = logForCron + '_delete.txt';
  stderr = fs.createWriteStream(__dirname + '/' + dbName + 'Err.log', options);
  logger = new console.Console(stderr);

  inserted(dbName, id);
  updated(dbName, id);
  // deleted(dbName, id);
}

module.exports = readFiles;